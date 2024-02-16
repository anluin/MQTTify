import {
    MqttMessage,
    MqttPacket,
    MqttPacketId,
    MqttPacketType,
    MqttPublishPacket,
    MqttPublishPacketId,
    MqttQualityOfService,
    MqttSubAckReturnCode,
} from "./packet.ts";

export type MqttPacketWithId = Extract<MqttPacket, { id: MqttPacketId }>;

export class MqttPacketProvider {
    #requests = new Set<{
        filter: {
            type: MqttPacketWithId["type"];
            id: MqttPacketId;
        };
        resolvers: {
            resolve: (packet: MqttPacketWithId) => void;
            reject: (reason?: unknown) => void;
        };
        timeoutId: number;
    }>();

    processIncomingPacket(packet: MqttPacket) {
        for (const request of this.#requests) {
            if ("id" in packet && packet.id === request.filter.id) {
                request.resolvers.resolve(packet);

                if (packet.type !== request.filter.type) {
                    console.debug(
                        "[DEBUG]",
                        packet.type,
                        "==",
                        request.filter.type,
                        "=",
                        packet.type === request.filter.type,
                    );
                }

                return true;
            }
        }

        return false;
    }

    async request<T extends MqttPacketWithId["type"]>(filter: {
        type: T;
        id: MqttPacketId;
    }) {
        const {
            promise,
            ...resolvers
        } = Promise.withResolvers<MqttPacketWithId>();

        const timeoutId = setTimeout(() => {
            resolvers.reject(new Deno.errors.TimedOut());
        }, 1000);

        const request = { filter, resolvers, timeoutId };

        this.#requests.add(request);

        return await (
            promise
                .then((packet) => packet as Extract<MqttPacket, { type: T }>)
                .finally(() => {
                    this.#requests.delete(request);
                    clearTimeout(timeoutId);
                })
        );
    }

    [Symbol.dispose]() {
        for (const request of this.#requests) {
            clearTimeout(request.timeoutId);
        }

        this.#requests.clear();
    }
}

export class MqttMessageController {
    readonly #packetProvider: MqttPacketProvider;
    readonly #controller: {
        enqueue(packet: MqttPacket): void;
        terminate(): void;
    };

    #packetIdCounter: number;

    constructor(packetProvider: MqttPacketProvider, controller: {
        enqueue(packet: MqttPacket): void;
        terminate(): void;
    }) {
        this.#packetIdCounter = 1 as MqttPublishPacketId;
        this.#packetProvider = packetProvider;
        this.#controller = controller;
    }

    async publish(message: MqttMessage) {
        const packet: MqttPublishPacket = {
            type: MqttPacketType.Publish,
            id: (
                message.qualityOfService === MqttQualityOfService.atMostOnce
                    ? 0 as MqttPublishPacketId
                    : this.#nextPacketId()
            ),
            duplicate: false,
            message,
        };

        for (let numRemainingTries = 3; (numRemainingTries--) > 0;) {
            try {
                await this.#publish(packet);
            } catch (error) {
                if (error instanceof Deno.errors.TimedOut) {
                    packet.duplicate = true;
                    continue;
                }

                throw error;
            }

            break;
        }
    }

    #nextPacketId(): MqttPublishPacketId {
        const packetId = this.#packetIdCounter++;
        if (this.#packetIdCounter > 0xffff) {
            this.#packetIdCounter = 1;
        }
        return packetId as MqttPublishPacketId;
    }

    async #publish(packet: MqttPublishPacket) {
        this.#controller.enqueue(packet);

        switch (packet.message.qualityOfService) {
            case MqttQualityOfService.atLeastOnce:
                await this.#packetProvider.request({
                    type: MqttPacketType.PubAck,
                    id: packet.id,
                });

                break;

            case MqttQualityOfService.exactlyOnce:
                await this.#packetProvider.request({
                    type: MqttPacketType.PubRec,
                    id: packet.id,
                });

                this.#controller.enqueue({
                    type: MqttPacketType.PubRel,
                    id: packet.id,
                });

                await this.#packetProvider.request({
                    type: MqttPacketType.PubComp,
                    id: packet.id,
                });

                break;
        }
    }

    disconnect() {
        this.#controller.terminate();
    }
}

export class MqttTopicFilter {
    readonly source: string;
    readonly parameters?: Record<string, string>;

    readonly #parts: string[];

    constructor(source: string) {
        const queryIndex = source.indexOf("?");

        this.source = source;

        if (queryIndex !== -1) {
            const parameters = source.substring(queryIndex + 1);

            source = source.substring(0, queryIndex);

            this.parameters = Object.fromEntries(
                parameters
                    .split("&")
                    .map((parameter) => (
                        parameter
                            .split("=")
                            .map((part) => part.trim())
                    )),
            );
        }

        this.#parts = source.split("/");
    }

    test(topic: string) {
        const topicParts = topic.split("/");

        for (let filterIdx = 0; filterIdx < Math.max(this.#parts.length, topicParts.length); filterIdx++) {
            const filterPart = this.#parts[filterIdx];

            if (filterPart === "#") {
                return true;
            }

            if (filterPart === "+" && !!topicParts[filterIdx]) {
                continue;
            }

            if (filterPart !== topicParts[filterIdx]) {
                return false;
            }
        }

        return true;
    }
}

export const toMqttSubAckReturnCode = (qualityOfService: MqttQualityOfService) => (
    qualityOfService as unknown as MqttSubAckReturnCode
);
