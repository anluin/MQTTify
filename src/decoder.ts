import {
    MqttCredentials,
    MqttMessage,
    MqttPacket,
    MqttPacketType,
    MqttProtocol,
    MqttPublishPacketId,
    MqttQualityOfService,
    MqttSubAckReturnCode,
    MqttSubscribePacketId,
    MqttSubscription,
    MqttUnsubscribePacketId,
} from "./packet.ts";

export abstract class MqttDecoderError extends Error {
}

export abstract class MqttInvalidFixedHeaderError extends MqttDecoderError {
}

export class MqttInvalidPacketTypeError extends MqttInvalidFixedHeaderError {
    constructor(type: number) {
        super(`0x${type.toString(16)} is not a valid packet type`);
    }
}

export type MqttDecodeGenerator<T> = Generator<number | void, T, Uint8Array | number>;

export class MqttPacketDecoder {
    readonly #textDecoder = new TextDecoder();

    #state?: {
        generator: MqttDecodeGenerator<MqttPacket>;
        result: IteratorResult<number | void, MqttPacket>;
        remainingLength: number;
    };

    decode(buffer: Uint8Array): MqttPacket[] {
        const packets: MqttPacket[] = [];

        for (let index = 0; index < buffer.length;) {
            if (!this.#state) {
                const generator = this.#decode();
                const result = generator.next();

                this.#state = {
                    generator,
                    result,
                    remainingLength: 0,
                };
            }

            if (typeof this.#state.result.value === "number") {
                const bytes = buffer.slice(index, index += this.#state.result.value);
                this.#state.remainingLength -= bytes.length;
                this.#state.result = this.#state.generator.next(bytes);
            } else {
                this.#state.remainingLength -= 1;
                this.#state.result = this.#state.generator.next(buffer[index++]);
            }

            if (this.#state.result.done) {
                packets.push(this.#state.result.value);
                this.#state = undefined;
            }
        }

        return packets;
    }

    #readUint8(): MqttDecodeGenerator<number>;
    #readUint8(numBytes: number): MqttDecodeGenerator<Uint8Array>;
    *#readUint8(numBytes?: number): MqttDecodeGenerator<Uint8Array | number> {
        return yield numBytes;
    }

    *#readUint16(): MqttDecodeGenerator<number> {
        return (
            ((yield) as number << 8) |
            ((yield) as number << 0)
        );
    }

    *#readVarInt(): MqttDecodeGenerator<number> {
        let numBytes = 0;
        let result = 0;

        for (;;) {
            const byte = yield* this.#readUint8();

            result |= (byte & 0x7F) << ((numBytes++) * 7);

            if ((byte & 0x80) === 0) {
                return result;
            }
        }
    }

    *#readBoolean(): MqttDecodeGenerator<boolean> {
        return !!(yield* this.#readUint8());
    }

    *#readUint8Array(length?: number): MqttDecodeGenerator<Uint8Array> {
        const buffer = new Uint8Array(length ??= yield* this.#readUint16());

        for (let index = 0; index < length;) {
            const bytes = yield* this.#readUint8(buffer.length - index);
            buffer.set(bytes, index);
            index += bytes.length;
        }

        return buffer;
    }

    *#readString(): MqttDecodeGenerator<string> {
        return this.#textDecoder.decode(yield* this.#readUint8Array());
    }

    *#decode(): MqttDecodeGenerator<MqttPacket> {
        const fixedHeaderByte = yield* this.#readUint8();
        const fixedHeader = {
            type: (fixedHeaderByte >> 4) as MqttPacketType | number,
            flags: {
                duplicate: !!(fixedHeaderByte & 2 ** 3),
                qualityOfService: (
                    (fixedHeaderByte & 2 ** 2) ? 2 : (fixedHeaderByte & 2 ** 1) ? 1 : 0
                ) as MqttQualityOfService,
                retain: !!(fixedHeaderByte & 2 ** 0),
            },
        };

        this.#state!.remainingLength = yield* this.#readVarInt();

        switch (fixedHeader.type) {
            case MqttPacketType.Connect: {
                const protocol: MqttProtocol = {
                    name: yield* this.#readString(),
                    level: yield* this.#readUint8(),
                };

                if (protocol.level !== 4) {
                    throw new Error();
                }

                const flags = yield* this.#readUint8();
                const username = !!(flags & 2 ** 7);
                const password = !!(flags & 2 ** 6);
                const cleanSession = !!(flags & 2);
                const will = (flags & 4)
                    ? {
                        retain: !!(flags & 2 ** 5),
                        qualityOfService: (flags & (16 + 8)) >> 3,
                    }
                    : undefined;

                const keepAlive = yield* this.#readUint16();
                const clientId = yield* this.#readString();

                const lastWillAndTestament = will
                    ? <MqttMessage> {
                        topic: yield* this.#readString(),
                        payload: yield* this.#readUint8Array(),
                        ...will,
                    }
                    : undefined;

                const credentials = username || password
                    ? <MqttCredentials> {
                        username: username ? yield* this.#readString() : undefined,
                        password: password ? yield* this.#readString() : undefined,
                    }
                    : undefined;

                return {
                    type: MqttPacketType.Connect,
                    protocol,
                    cleanSession,
                    keepAlive,
                    clientId,
                    lastWillAndTestament,
                    credentials,
                };
            }
            case MqttPacketType.ConnAck: {
                return {
                    type: MqttPacketType.ConnAck,
                    sessionPresent: yield* this.#readBoolean(),
                    returnCode: yield* this.#readUint8(),
                };
            }
            case MqttPacketType.Publish: {
                const topic = yield* this.#readString();
                const id = (
                    fixedHeader.flags!.qualityOfService > 0 ? yield* this.#readUint16() : 0
                ) as MqttPublishPacketId;

                return {
                    type: MqttPacketType.Publish,
                    id,
                    duplicate: fixedHeader.flags.duplicate,
                    message: {
                        topic,
                        payload: yield* this.#readUint8Array(this.#state!.remainingLength),
                        retain: fixedHeader.flags.retain,
                        qualityOfService: fixedHeader.flags.qualityOfService,
                    },
                };
            }
            case MqttPacketType.PubAck: {
                return {
                    type: MqttPacketType.PubAck,
                    id: (yield* this.#readUint16()) as MqttPublishPacketId,
                };
            }
            case MqttPacketType.PubRec: {
                return {
                    type: MqttPacketType.PubRec,
                    id: (yield* this.#readUint16()) as MqttPublishPacketId,
                };
            }
            case MqttPacketType.PubRel: {
                return {
                    type: MqttPacketType.PubRel,
                    id: (yield* this.#readUint16()) as MqttPublishPacketId,
                };
            }
            case MqttPacketType.PubComp: {
                return {
                    type: MqttPacketType.PubComp,
                    id: (yield* this.#readUint16()) as MqttPublishPacketId,
                };
            }
            case MqttPacketType.Subscribe: {
                const id = (yield* this.#readUint16()) as MqttSubscribePacketId;
                const subscriptions: MqttSubscription[] = [];

                while (this.#state!.remainingLength > 0) {
                    subscriptions.push(
                        <MqttSubscription> {
                            topicFilter: yield* this.#readString(),
                            qualityOfService: yield* this.#readUint8(),
                        },
                    );
                }

                return {
                    type: MqttPacketType.Subscribe,
                    id,
                    subscriptions,
                };
            }
            case MqttPacketType.SubAck: {
                const id = (yield* this.#readUint16()) as MqttSubscribePacketId;
                const returnCodes: MqttSubAckReturnCode[] = [
                    ...yield* this.#readUint8(this.#state!.remainingLength),
                ];

                return {
                    type: MqttPacketType.SubAck,
                    id,
                    returnCodes,
                };
            }

            case MqttPacketType.Unsubscribe: {
                const id = (yield* this.#readUint16()) as MqttUnsubscribePacketId;
                const topics: string[] = [];

                while (this.#state!.remainingLength > 0) {
                    topics.push(yield* this.#readString());
                }

                return {
                    type: MqttPacketType.Unsubscribe,
                    id,
                    topics,
                };
            }
            case MqttPacketType.UnsubAck: {
                const id = (yield* this.#readUint16()) as MqttUnsubscribePacketId;

                return {
                    type: MqttPacketType.UnsubAck,
                    id,
                };
            }
            case MqttPacketType.PingReq: {
                return {
                    type: MqttPacketType.PingReq,
                };
            }
            case MqttPacketType.PingResp: {
                return {
                    type: MqttPacketType.PingResp,
                };
            }
            case MqttPacketType.Disconnect: {
                return {
                    type: MqttPacketType.Disconnect,
                };
            }
            default:
                throw new MqttInvalidPacketTypeError(fixedHeader.type);
        }
    }
}

export class MqttPacketDecoderStream extends TransformStream<Uint8Array, MqttPacket> {
    constructor(
        writableStrategy?: QueuingStrategy<Uint8Array>,
        readableStrategy?: QueuingStrategy<MqttPacket>,
    ) {
        const decoder = new MqttPacketDecoder();
        const transformer: Transformer<Uint8Array, MqttPacket> = {
            transform: (chunk, controller) => {
                try {
                    for (const packet of decoder.decode(chunk)) {
                        controller.enqueue(packet);
                    }
                } catch (error) {
                    controller.error(error);
                }
            },
        };

        super(transformer, writableStrategy, readableStrategy);
    }
}
