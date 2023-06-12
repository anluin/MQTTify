import { Socket } from "./socket.ts";
import { Message, PacketType, QualityOfService, Subscription } from "./packet/mod.ts";
import { defaults } from "./defaults.ts"
import { ConnectPacket } from "./packet/packets/connect.ts";
import { ClientBase } from "./client.ts";


export type SubscribeEvent = {
    type: "subscribe",
    subscriptions: Subscription[],
};

export type UnsubscribeEvent = {
    type: "unsubscribe",
    topics: string[],
};

export type PublishEvent = {
    type: "publish",
    message: Message
};

export type DisconnectEvent = {
    type: "disconnect",
};

export type Event = SubscribeEvent | UnsubscribeEvent | PublishEvent | DisconnectEvent;

export type EventListener<T extends Event["type"]> = (event: Extract<Event, {
    type: T,
}>) => void | Promise<void>;

export class Connection extends ClientBase {
    readonly details: Omit<ConnectPacket, "type">;
    private readonly listeners: {
        [Type in Event["type"]]: Set<EventListener<Type>>;
    };

    constructor(socket: Socket, details: Omit<ConnectPacket, "type">) {
        super(socket);

        this.listeners = {
            subscribe: new Set(),
            unsubscribe: new Set(),
            disconnect: new Set(),
            publish: new Set(),
        };
        this.details = details;

        socket.addEventListener("packet", async (event) => {
            switch (event.packet.type) {
                case PacketType.Subscribe: {
                    const {
                        packet: {
                            id,
                            subscriptions
                        }
                    } = event;

                    event.preventDefault();

                    await Promise.all(
                        [ ...this.listeners.subscribe ]
                            .map(listener => listener({
                                type: "subscribe",
                                subscriptions,
                            })),
                    );

                    await socket.send(PacketType.SubACK, {
                        id,
                        returnCodes: subscriptions.map(() => 0)
                    });

                    break;
                }
                case PacketType.Unsubscribe: {
                    const {
                        packet: {
                            id,
                            topics
                        }
                    } = event;

                    event.preventDefault();

                    await Promise.all(
                        [ ...this.listeners.unsubscribe ]
                            .map(listener => listener({
                                type: "unsubscribe",
                                topics: topics,
                            })),
                    );

                    await socket.send(PacketType.UnsubAck, {
                        id: id,
                    });

                    break;
                }
                case PacketType.Publish: {
                    const {
                        packet: {
                            id,
                            message
                        }
                    } = event;

                    event.preventDefault();

                    switch (message.qos) {
                        case QualityOfService.atMostOnce:
                            break;
                        case QualityOfService.atLeastOnce:
                            await this.socket.send(PacketType.PubAck, { id });
                            break;
                        case QualityOfService.exactlyOnce:
                            for (let count = 0; count < defaults.retries.pubrel; ++count) {
                                await this.socket.send(PacketType.PubRec, { id });

                                try {
                                    await this.socket.receive(PacketType.PubRel, defaults.timeouts.pubrel, id);
                                    await this.socket.send(PacketType.PubComp, { id });
                                } catch (error) {
                                    if (error instanceof Deno.errors.TimedOut) {
                                        continue;
                                    }

                                    throw error;
                                }

                                break;
                            }

                            break;
                    }

                    await Promise.all(
                        [ ...this.listeners.publish ]
                            .map(listener => listener({
                                type: "publish",
                                message,
                            })),
                    );

                    break;
                }
                case PacketType.PingReq:
                    event.preventDefault();

                    await this.socket.send(PacketType.PingResp, {});

                    break;
                case PacketType.Disconnect:
                    event.preventDefault();

                    await Promise.all(
                        [ ...this.listeners.disconnect ]
                            .map(listener => listener({
                                type: "disconnect",
                            })),
                    );

                    this.socket = undefined;

                    break;
            }
        });
    }

    addEventListener<T extends Event["type"]>(event: T, listener: EventListener<T>) {
        this.listeners[event].add(listener);
    }

    removeEventListener<T extends Event["type"]>(event: T, listener: EventListener<T>) {
        this.listeners[event].delete(listener);
    }

    async disconnected() {
        await this.socket.receive(PacketType.Disconnect, -1);
    }

    async disconnect() {
        try {
            await this.socket.send(PacketType.Disconnect, {});
            await this.socket.close();
        } catch (error) {
            if (error instanceof Deno.errors.BadResource) {
                return;
            }

            throw error;
        } finally {
            this.socket = undefined;
        }
    }
}
