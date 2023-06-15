import { isPacketType, Packet, PacketType, RawPacket, RawPayload } from "./packet.ts";
import { Uint8 } from "../../utils/intdef.ts";

import { ConnectPacket } from "./packet/connect.ts";
import { ConnAckPacket } from "./packet/connack.ts";
import { PublishPacket } from "./packet/publish.ts";
import { PubAckPacket } from "./packet/puback.ts";
import { PubRecPacket } from "./packet/pubrec.ts";
import { PubRelPacket } from "./packet/pubrel.ts";
import { PubCompPacket } from "./packet/pubcomp.ts";
import { SubscribePacket } from "./packet/subscribe.ts";
import { SubAckPacket } from "./packet/suback.ts";
import { UnsubscribePacket } from "./packet/unsubscribe.ts";
import { UnsubAckPacket } from "./packet/unsuback.ts";
import { PingReqPacket } from "./packet/pingreq.ts";
import { PingRespPacket } from "./packet/pingresp.ts";
import { DisconnectPacket } from "./packet/disconnect.ts";


export enum RawPacketDecoderState {
    CollectHeader,
    CollectPayloadLength,
    CollectPayload,
}

export class RawPacketDecoder {
    private state = RawPacketDecoderState.CollectHeader;
    private payloadLengthByteCounter = 0;
    private packet?: RawPacket;

    decode(bytes: Uint8Array): RawPacket {
        const decoder = new RawPacketDecoder();

        for (const byte of bytes) {
            const packet = decoder.partialDecode(byte as Uint8);

            if (packet) {
                return packet;
            }
        }

        throw new Error("unimplemented");
    }

    partialDecode(byte: Uint8) {
        switch (this.state) {
            case RawPacketDecoderState.CollectHeader:
                if (!isPacketType(byte >> 4)) {
                    throw new Error(`protocol violation: ${byte >> 4}`);
                }

                this.state = RawPacketDecoderState.CollectPayloadLength;
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
                    payload: new RawPayload(undefined as unknown as Uint8[]),
                };

                break;
            case RawPacketDecoderState.CollectPayloadLength:
                this.packet!.payload!.capacity |= ((byte & 0x7F) << ((this.payloadLengthByteCounter++) * 7));

                if ((byte & 0x80) === 0) {
                    this.state = RawPacketDecoderState.CollectPayload;
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
            case RawPacketDecoderState.CollectPayload:
                if (this.packet!.payload!.capacity > this.packet!.payload!.cursor.write) {
                    this.packet!.payload!.bytes![this.packet!.payload!.cursor.write++] = byte as Uint8;
                }

                if (this.packet!.payload!.capacity === this.packet!.payload!.cursor.write) {
                    this.state = RawPacketDecoderState.CollectHeader;
                    return this.packet!;
                }

                break;
        }

        return undefined;
    }
}

export class PacketDecoder {
    private rawPacketDecoder = new RawPacketDecoder();

    decode(bytes: Uint8Array): Packet {
        return this.#decode(this.rawPacketDecoder.decode(bytes));
    }

    partialDecode(byte: Uint8) {
        const rawPacket = this.rawPacketDecoder.partialDecode(byte);

        if (rawPacket) {
            return this.#decode(rawPacket);
        }
    }

    #decode(rawPacket: RawPacket): Packet {
        switch (rawPacket.header.type) {
            case PacketType.Connect:
                return ConnectPacket.decode(rawPacket);
            case PacketType.ConnAck:
                return ConnAckPacket.decode(rawPacket);
            case PacketType.Publish:
                return PublishPacket.decode(rawPacket);
            case PacketType.PubAck:
                return PubAckPacket.decode(rawPacket);
            case PacketType.PubRec:
                return PubRecPacket.decode(rawPacket);
            case PacketType.PubRel:
                return PubRelPacket.decode(rawPacket);
            case PacketType.PubComp:
                return PubCompPacket.decode(rawPacket);
            case PacketType.Subscribe:
                return SubscribePacket.decode(rawPacket);
            case PacketType.SubAck:
                return SubAckPacket.decode(rawPacket);
            case PacketType.Unsubscribe:
                return UnsubscribePacket.decode(rawPacket);
            case PacketType.UnsubAck:
                return UnsubAckPacket.decode(rawPacket);
            case PacketType.PingReq:
                return PingReqPacket.decode(rawPacket);
            case PacketType.PingResp:
                return PingRespPacket.decode(rawPacket);
            case PacketType.Disconnect:
                return DisconnectPacket.decode(rawPacket);
        }

        throw new Error(`unimplemented packet-type: ${rawPacket.header.type}`);
    }
}

export class PacketDecodeTransformer implements Transformer<Uint8Array, Packet> {
    private decoder = new PacketDecoder();

    transform(chunk: Uint8Array, controller: TransformStreamDefaultController<Packet>) {
        for (const byte of chunk) {
            const packet = this.decoder.partialDecode(byte as Uint8);

            if (packet) {
                controller.enqueue(packet);
            }
        }
    }
}

export class PacketDecodeStream extends TransformStream<Uint8Array, Packet> {
    constructor() {
        super(new PacketDecodeTransformer());
    }
}
