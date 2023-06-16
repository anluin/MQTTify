import { isPacketType, isQualityOfService, Packet, PacketType, QualityOfService } from "./packet.ts";
import { InvalidPacketType, InvalidPayload, InvalidProtocol, InvalidProtocolLevel } from "./errors.ts";
import { isConnAckReturnCode } from "./packet/conack.ts";


export enum PacketDecoderState {
    CollectHeader,
    CollectPayloadLength,
    CollectPayload,
}

export class PacketDecoder {
    private readonly textDecoder = new TextDecoder();

    private state: PacketDecoderState = PacketDecoderState.CollectHeader;
    private payloadLengthByteCounter = 0;
    private packet?: {
        header: {
            type: PacketType,
            flags?: {
                retain: boolean;
                qos: QualityOfService,
                dup: boolean;
            },
        },
        payload: {
            capacity: number,
            length: number,
            cursor: number,
            bytes: number[],
        };
    };

    decode(input: Uint8Array): Packet[] {
        return [ ...this.partialDecode(input) ];
    }

    private* partialDecode(chunk: Uint8Array): Generator<Packet> {
        for (const byte of chunk) {
            switch (this.state) {
                case PacketDecoderState.CollectHeader:
                    if (!isPacketType(byte >> 4)) {
                        throw new InvalidPacketType(byte >> 4);
                    }

                    this.state = PacketDecoderState.CollectPayloadLength;
                    this.packet = {
                        header: {
                            type: byte >> 4,
                            flags: {
                                dup: !!(byte & 2 ** 3),
                                qos: (
                                    (byte & 2 ** 2) ? 2 :
                                        (byte & 2 ** 1) ? 1 :
                                            0
                                ),
                                retain: !!(byte & 2 ** 0),
                            },
                        },
                        payload: {
                            capacity: 0,
                            length: 0,
                            cursor: 0,
                            bytes: [],
                        },
                    };

                    break;
                case PacketDecoderState.CollectPayloadLength:
                    this.packet!.payload!.capacity |= ((byte & 0x7F) << ((this.payloadLengthByteCounter++) * 7));

                    if ((byte & 0x80) === 0) {
                        this.state = PacketDecoderState.CollectPayload;
                        this.payloadLengthByteCounter = 0;

                        if (this.packet!.payload!.capacity > 0) {
                            this.packet!.payload!.bytes = new Array(
                                this.packet!.payload!.capacity,
                            );

                            break;
                        }
                    } else {
                        break;
                    }

                /* falls through */
                case PacketDecoderState.CollectPayload:
                    if (this.packet!.payload!.capacity > this.packet!.payload!.length) {
                        this.packet!.payload!.bytes![this.packet!.payload!.length++] = byte;
                    }

                    if (this.packet!.payload!.capacity === this.packet!.payload!.length) {
                        this.state = PacketDecoderState.CollectHeader;

                        switch (this.packet!.header.type) {
                            case PacketType.Connect: {
                                if (this.string() !== "MQTT") {
                                    throw new InvalidProtocol();
                                }

                                if (this.uint8() !== 4) {
                                    throw new InvalidProtocolLevel();
                                }

                                const flags = this.uint8();
                                const usernameFlag = !!(flags & 2 ** 7);
                                const passwordFlag = !!(flags & 2 ** 6);
                                const cleanSessionFlag = !!(flags & 2);
                                const willFlag = (flags & 4);
                                const willRetainFlag = willFlag ? !!(flags & 2 ** 5) : false;
                                const willQosFlag = willFlag ? (flags & (16 + 8)) >> 3 : 0;

                                if (!isQualityOfService(willQosFlag)) {
                                    throw new InvalidPayload();
                                }

                                yield {
                                    type: PacketType.Connect,
                                    keepAlive: this.uint16(),
                                    clientId: this.string(),
                                    cleanSession: cleanSessionFlag,
                                    will: willFlag ? {
                                        topic: this.string(),
                                        payload: this.byteArray(),
                                        retain: willRetainFlag,
                                        qos: willQosFlag,
                                    } : undefined,
                                    username: usernameFlag ? this.string() : undefined,
                                    password: passwordFlag ? this.string() : undefined,
                                };

                                continue;
                            }

                            case PacketType.ConnAck:
                                yield {
                                    type: PacketType.ConnAck,
                                    returnCode: this.connAckReturnCode(),
                                    sessionPresent: this.boolean(),
                                };

                                continue;
                            case PacketType.Publish:
                                yield {
                                    type: PacketType.Publish,
                                    ...this.packet!.header.flags!,
                                    topic: this.string(),
                                    id: this.packet!.header.flags!.qos !== 0 ? this.uint16() : 0,
                                    payload: this.payload(),
                                };

                                continue;
                            case PacketType.PubAck:
                            case PacketType.PubRec:
                            case PacketType.PubRel:
                            case PacketType.PubComp:
                            case PacketType.UnsubAck:
                                yield {
                                    type: this.packet!.header.type,
                                    id: this.uint16(),
                                };

                                continue
                            case PacketType.Subscribe:
                                yield {
                                    type: PacketType.Subscribe,
                                    id: this.uint16(),
                                    subscriptions: this.rest(() => ({
                                        topic: this.string(),
                                        qos: this.uint8(),
                                    })),
                                };

                                continue;
                            case PacketType.SubAck:
                                yield {
                                    type: PacketType.SubAck,
                                    id: this.uint16(),
                                    returnCodes: [ ...this.payload() ],
                                };

                                continue;
                            case PacketType.Unsubscribe:
                                yield {
                                    type: PacketType.Unsubscribe,
                                    id: this.uint16(),
                                    topics: this.rest(() => (
                                        this.string()
                                    )),
                                };

                                continue;
                            case PacketType.PingReq:
                            case PacketType.PingResp:
                            case PacketType.Disconnect:
                                yield {
                                    type: this.packet!.header.type,
                                };

                                continue
                        }
                    }

                    break;
            }
        }
    }

    private uint8() {
        return this.packet!.payload.bytes[this.packet!.payload.cursor++];
    }

    private uint16() {
        const msb = this.uint8();
        const lsb = this.uint8();

        return ((msb << 8) | lsb);
    }

    private boolean() {
        return !!this.uint8();
    }

    private connAckReturnCode() {
        const returnCode = this.uint8();

        if (isConnAckReturnCode(returnCode)) {
            return returnCode;
        }

        throw new InvalidPayload();
    }

    private byteArray(length: number = this.uint16()) {
        return Uint8Array.from(this.packet!.payload.bytes.slice(
            this.packet!.payload.cursor,
            this.packet!.payload.cursor += length,
        ) ?? []);
    }

    private string() {
        return this.textDecoder.decode(this.byteArray());
    }

    private payload() {
        return this.byteArray(
            this.packet!.payload.length -
            this.packet!.payload.cursor
        );
    }

    private rest<T>(callback: () => T): T[] {
        const elements: T[] = [];

        while (this.packet!.payload.cursor < this.packet!.payload.length) {
            callback();
        }

        return elements;
    }
}

export class PacketDecoderTransformer implements Transformer<Uint8Array, Packet> {
    private readonly decoder = new PacketDecoder();

    transform(chunk: Uint8Array, controller: TransformStreamDefaultController<Packet>) {
        for (const packet of this.decoder.decode(chunk)) {
            controller.enqueue(packet);
        }
    }
}

export class PacketDecoderStream extends TransformStream<Uint8Array, Packet> {
    constructor() {
        super(new PacketDecoderTransformer());
    }
}
