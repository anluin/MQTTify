import { MqttPacket, MqttPacketType, MqttQualityOfService } from "./packet.ts";

export abstract class MqttEncoderError extends Error {
}

export class MqttValueOutOfRange extends MqttEncoderError {
    constructor(value: number, min: number, max: number) {
        super(`${value} is out of range (must be between ${min} and ${max})`);
    }
}

export const oldBuffers = new Set<Uint8Array>();

const findOrCreateBuffer = (size: number, exactly = false) => {
    for (const buffer of oldBuffers) {
        if (exactly ? buffer.length === size : buffer.length >= size) {
            oldBuffers.delete(buffer);
            return buffer;
        }
    }

    return new Uint8Array(size);
};

export class MqttPacketEncoder {
    readonly #textEncoder = new TextEncoder();

    #buffer = new Uint8Array();
    #cursor = 0;

    encode(packet: MqttPacket): Uint8Array {
        switch (packet.type) {
            case MqttPacketType.Connect:
                this
                    .#writeFixedHeader({
                        type: MqttPacketType.Connect,
                    })
                    .#writeString(packet.protocol.name)
                    .#writeUint8(packet.protocol.level)
                    .#writeUint8(
                        (packet.credentials?.username ? 2 ** 7 : 0) |
                            (packet.credentials?.password ? 2 ** 6 : 0) |
                            (packet.lastWillAndTestament?.retain ? 2 ** 5 : 0) |
                            (((packet.lastWillAndTestament?.qualityOfService ?? 0) & 2) ? 2 ** 4 : 0) |
                            (((packet.lastWillAndTestament?.qualityOfService ?? 0) & 1) ? 2 ** 3 : 0) |
                            (packet.lastWillAndTestament ? 2 ** 2 : 0) |
                            (packet.cleanSession ? 2 ** 1 : 0),
                    )
                    .#writeUint16(packet.keepAlive)
                    .#writeString(packet.clientId);

                if (packet.lastWillAndTestament) {
                    this.#writeString(packet.lastWillAndTestament.topic);
                    this.#writeUint8Array(packet.lastWillAndTestament.payload);
                }

                if (packet.credentials?.username) {
                    this.#writeString(packet.credentials.username);
                }

                if (packet.credentials?.password) {
                    this.#writeString(packet.credentials.password);
                }

                return this.#flush();

            case MqttPacketType.ConnAck:
                return (
                    this
                        .#writeFixedHeader({
                            type: MqttPacketType.ConnAck,
                        })
                        .#writeUint8(+packet.sessionPresent)
                        .#writeUint8(packet.returnCode)
                        .#flush()
                );

            case MqttPacketType.Publish:
                this
                    .#writeFixedHeader({
                        type: MqttPacketType.Publish,
                        flags: {
                            duplicate: packet.duplicate,
                            qualityOfService: packet.message.qualityOfService,
                            retain: packet.message.retain,
                        },
                    })
                    .#writeString(packet.message.topic);

                if (packet.message.qualityOfService > MqttQualityOfService.atMostOnce) {
                    this.#writeUint16(packet.id);
                }

                return (
                    this
                        .#writeUint8(packet.message.payload)
                        .#flush()
                );

            case MqttPacketType.PubAck:
                return (
                    this
                        .#writeFixedHeader({
                            type: MqttPacketType.PubAck,
                        })
                        .#writeUint16(packet.id)
                        .#flush()
                );

            case MqttPacketType.PubRec:
                return (
                    this
                        .#writeFixedHeader({
                            type: MqttPacketType.PubRec,
                        })
                        .#writeUint16(packet.id)
                        .#flush()
                );

            case MqttPacketType.PubRel:
                return (
                    this
                        .#writeFixedHeader({
                            type: MqttPacketType.PubRel,
                            flags: 2,
                        })
                        .#writeUint16(packet.id)
                        .#flush()
                );

            case MqttPacketType.PubComp:
                return (
                    this
                        .#writeFixedHeader({
                            type: MqttPacketType.PubComp,
                        })
                        .#writeUint16(packet.id)
                        .#flush()
                );

            case MqttPacketType.Subscribe:
                this
                    .#writeFixedHeader({
                        type: MqttPacketType.Subscribe,
                    })
                    .#writeUint16(packet.id);

                for (
                    const {
                        topicFilter,
                        qualityOfService,
                    } of packet.subscriptions
                ) {
                    this
                        .#writeString(topicFilter)
                        .#writeUint8(qualityOfService);
                }

                return this.#flush();

            case MqttPacketType.SubAck:
                this
                    .#writeFixedHeader({
                        type: MqttPacketType.SubAck,
                    })
                    .#writeUint16(packet.id);

                for (const returnCode of packet.returnCodes) {
                    this.#writeUint8(returnCode);
                }

                return this.#flush();

            case MqttPacketType.Unsubscribe:
                this
                    .#writeFixedHeader({
                        type: MqttPacketType.Unsubscribe,
                    })
                    .#writeUint16(packet.id);

                for (const topic of packet.topics) {
                    this
                        .#writeString(topic);
                }

                return this.#flush();

            case MqttPacketType.UnsubAck:
                return (
                    this
                        .#writeFixedHeader({
                            type: MqttPacketType.UnsubAck,
                        })
                        .#writeUint16(packet.id)
                        .#flush()
                );

            case MqttPacketType.PingReq:
                return (
                    this
                        .#writeFixedHeader({
                            type: MqttPacketType.PingReq,
                        })
                        .#flush()
                );

            case MqttPacketType.PingResp:
                return (
                    this
                        .#writeFixedHeader({
                            type: MqttPacketType.PingResp,
                        })
                        .#flush()
                );

            case MqttPacketType.Disconnect:
                return (
                    this
                        .#writeFixedHeader({
                            type: MqttPacketType.Disconnect,
                        })
                        .#flush()
                );
        }
    }

    [Symbol.dispose]() {
        oldBuffers.add(this.#buffer);
        this.#buffer = new Uint8Array();
    }

    #resizeBuffer(numAdditionalBytes: number) {
        if (this.#buffer.length < this.#cursor + numAdditionalBytes) {
            let targetSize = this.#buffer.length > 0 ? this.#buffer.length : 1;

            while (targetSize < this.#cursor + numAdditionalBytes) {
                targetSize *= 2;
            }

            const newBuffer = findOrCreateBuffer(targetSize);
            newBuffer.set(this.#buffer, 0);
            oldBuffers.add(this.#buffer);
            this.#buffer = newBuffer;
        }
    }

    #varInt(value: number): number[] {
        if (value < 0 || value > 2 ** 28) {
            throw new MqttValueOutOfRange(value, 0, 2 ** 28);
        }

        if (value < 2 ** 7) {
            return [value];
        } else if (value < 2 ** 14) {
            return [
                value >> 0 & 127 | 128,
                value >> 7 & 127,
            ];
        } else if (value < 2 ** 21) {
            return [
                value >> 0 & 127 | 128,
                value >> 7 & 127 | 128,
                value >> 14 & 127,
            ];
        } else {
            return [
                value >> 0 & 127 | 128,
                value >> 7 & 127 | 128,
                value >> 14 & 127 | 128,
                value >> 21,
            ];
        }
    }

    #writeFixedHeader(fixedHeader: {
        type: MqttPacketType;
        flags?: number | {
            duplicate?: boolean;
            qualityOfService?: MqttQualityOfService;
            retain?: boolean;
        };
    }) {
        this.#writeUint8(
            (fixedHeader.type << 4) | (
                typeof fixedHeader.flags === "number" ? fixedHeader.flags : (
                    (fixedHeader.flags?.duplicate ? 2 ** 3 : 0) |
                    (((fixedHeader.flags?.qualityOfService ?? 0) & 2) ? 2 ** 2 : 0) |
                    (((fixedHeader.flags?.qualityOfService ?? 0) & 1) ? 2 ** 1 : 0) |
                    (fixedHeader.flags?.retain ? 2 ** 0 : 0)
                )
            ),
        );

        return this;
    }

    #writeUint8(value: number | ArrayLike<number>) {
        if (typeof value === "number") {
            this.#resizeBuffer(1);
            this.#buffer[this.#cursor++] = value;
        } else {
            this.#resizeBuffer(value.length);
            this.#buffer.set(value, this.#cursor);
            this.#cursor += value.length;
        }

        return this;
    }

    #writeUint16(value: number) {
        return (
            this
                .#writeUint8((value >> 8) & 0xff)
                .#writeUint8((value >> 0) & 0xff)
        );
    }

    #writeUint8Array(value: number[] | Uint8Array) {
        if (value.length < 0 || value.length > 2 ** 16) {
            throw new MqttValueOutOfRange(value.length, 0, 2 ** 16);
        }

        return (
            this
                .#writeUint16(value.length)
                .#writeUint8(value)
        );
    }

    #writeString(value: string) {
        return this.#writeUint8Array(this.#textEncoder.encode(value));
    }

    #flush() {
        const remainingLengthBytes = this.#varInt(this.#cursor - 1);
        const result = findOrCreateBuffer(this.#cursor + remainingLengthBytes.length, true);

        result[0] = this.#buffer[0];
        result.set(remainingLengthBytes, 1);
        result.set(this.#buffer.subarray(1, this.#cursor), remainingLengthBytes.length + 1);

        this.#cursor = 0;

        return result;
    }
}

export class MqttPacketEncoderStream extends TransformStream<MqttPacket, Uint8Array> {
    constructor(
        writableStrategy?: QueuingStrategy<MqttPacket>,
        readableStrategy?: QueuingStrategy<Uint8Array>,
    ) {
        const encoder = new MqttPacketEncoder();
        const transformer: Transformer<MqttPacket, Uint8Array> = {
            transform: (chunk, controller) => {
                try {
                    controller.enqueue(encoder.encode(chunk));
                } catch (error) {
                    encoder[Symbol.dispose]();
                    controller.error(error);
                }
            },
            flush: () => {
                encoder[Symbol.dispose]();
            },
        };

        super(transformer, writableStrategy, readableStrategy);
    }
}
