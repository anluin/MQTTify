import { Packet, PacketType, QualityOfService } from "./packet.ts";
import { InvalidPacket } from "./errors.ts";


export class PacketEncoder {
    private readonly textEncoder = new TextEncoder();

    private bytes: number[] = [];

    encode(packet?: Packet): Uint8Array {
        switch (packet?.type) {
            case undefined:
                return new Uint8Array();
            case PacketType.Connect:
                return (
                    this
                        .start(packet.type)
                        .string("MQTT")
                        .uint8(4)
                        .uint8((
                            (packet.username ? 2 ** 7 : 0) |
                            (packet.password ? 2 ** 6 : 0) |
                            (packet.will?.retain ? 2 ** 5 : 0) |
                            (((packet.will?.qos ?? 0) & 2) ? 4 ** 7 : 0) |
                            (((packet.will?.qos ?? 0) & 1) ? 3 ** 7 : 0) |
                            (packet.will ? 2 ** 2 : 0) |
                            (packet.cleanSession ? 2 ** 1 : 0)
                        ))
                        .uint16(packet.keepAlive)
                        .string(packet.clientId)
                        .optional(packet.will, will => (
                            this.string(will.topic)
                                .byteArray(will.payload)
                        ))
                        .optional(packet.username, value => this.string(value))
                        .optional(packet.password, value => this.string(value))
                        .flush()
                );
            case PacketType.ConnAck:
                return (
                    this
                        .start(packet.type)
                        .uint8(packet.sessionPresent ? 1 : 0)
                        .uint8(packet.returnCode)
                        .flush()
                );
            case PacketType.Publish:
                return (
                    this
                        .start(packet.type, packet)
                        .string(packet.topic)
                        .optional(packet.qos !== 0, () => this.uint16(packet.id))
                        .payload(packet.payload)
                        .flush()
                );
            case PacketType.PubAck:
            case PacketType.PubRec:
            case PacketType.PubComp:
            case PacketType.UnsubAck:
                return (
                    this
                        .start(packet.type)
                        .uint16(packet.id)
                        .flush()
                );
            case PacketType.PubRel:
                return (
                    this
                        .start(packet.type, { qos: 1 })
                        .uint16(packet.id)
                        .flush()
                );
            case PacketType.Subscribe:
                return (
                    this
                        .start(packet.type, { qos: 1 })
                        .uint16(packet.id)
                        .forEach(packet.subscriptions, subscription => (
                            this.string(subscription.topic)
                                .uint8(subscription.qos)
                        ))
                        .flush()
                );
            case PacketType.SubAck:
                return (
                    this
                        .start(packet.type, { qos: 1 })
                        .uint16(packet.id)
                        .uint8(...packet.returnCodes)
                        .flush()
                );
            case PacketType.Unsubscribe:
                return (
                    this
                        .start(packet.type, { qos: 1 })
                        .uint16(packet.id)
                        .forEach(packet.topics, topic => (
                            this.string(topic)
                        ))
                        .flush()
                );
            case PacketType.PingReq:
            case PacketType.PingResp:
            case PacketType.Disconnect:
                return (
                    this
                        .start(packet.type)
                        .flush()
                );
            default:
                throw new InvalidPacket();
        }
    }

    private* encodeLength(value: number) {
        if (value < 0 || value > 2 ** 28) {
            throw new Error("value out of range");
        }

        do {
            let byte = value >> 0 & 127;

            value = Math.floor(value / 128);

            if (value > 0) {
                byte |= 128;
            }

            yield byte;
        } while (value > 0);
    }

    private start(type: PacketType, flags?: {
        dup?: boolean,
        qos?: QualityOfService,
        retain?: boolean,
    }) {
        this.bytes.push(
            (type << 4) |
            (flags?.dup ? 2 ** 3 : 0) |
            (((flags?.qos ?? 0) & 2) ? 2 ** 2 : 0) |
            (((flags?.qos ?? 0) & 1) ? 2 ** 1 : 0) |
            (flags?.retain ? 2 ** 0 : 0),
        );

        return this;
    }

    private int(value: number) {
        this.bytes.push(...this.encodeLength(value));

        return this;
    }

    private uint8(...values: number[]) {
        for (const value of values) {
            if (value < 0 || value > 2 ** 8) {
                throw new Error("value out of range");
            }
        }

        this.bytes.push(...values);

        return this;
    }

    private uint16(value: number) {
        if (value < 0 || value > 2 ** 16) {
            throw new Error("value out of range");
        }

        return this.uint8(
            (value >> 8),
            (value & 0xff),
        );
    }

    private byteArray(value: number[] | Uint8Array) {
        if (value.length < 0x0 || value.length > 0x10000)
            throw new Error("too much data (max. 65536 bytes)");

        return (
            this.uint16(value.length)
                .uint8(...value)
        );
    }

    private string(value: string) {
        return this.byteArray(this.textEncoder.encode(value));
    }

    private optional<T>(condition: T | undefined, callback: (value: T) => this) {
        return condition ? callback(condition) : this;
    }

    private forEach<T>(elements: T[], callback: (element: T) => void) {
        for (const element of elements) {
            callback(element);
        }

        return this;
    }

    private flush() {
        const [ headerByte, ...payloadBytes ] =
            ([ , this.bytes ] = [ this.bytes, [] ])[0];


        return Uint8Array.from([
            headerByte,
            ...this.encodeLength(payloadBytes.length),
            ...payloadBytes,
        ]);
    }

    private payload(payload: Uint8Array) {
        this.bytes.push(...payload);

        return this;
    }
}

export class PacketEncoderTransformer implements Transformer<Packet, Uint8Array> {
    private readonly encoder = new PacketEncoder();

    transform(packet: Packet, controller: TransformStreamDefaultController<Uint8Array>) {
        controller.enqueue(this.encoder.encode(packet));
    }
}

export class PacketEncoderStream extends TransformStream<Packet, Uint8Array> {
    constructor() {
        super(new PacketEncoderTransformer());
    }
}
