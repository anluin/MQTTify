import { MqttMessageController, MqttPacketProvider, toMqttSubAckReturnCode } from "./utils.ts";
import {
    MqttConnAckReturnCode,
    MqttCredentials,
    MqttMessage,
    MqttPacket,
    MqttPacketType,
    MqttQualityOfService,
    MqttSubAckReturnCode,
    MqttSubscription,
} from "./packet.ts";

export type MqttSubscribeEvent = {
    subscriptions: MqttSubscription[];
};

export type MqttMessageEvent = {
    message: MqttMessage;
};

export type MqttOnSubscribeResult = {
    returnCodes: MqttSubAckReturnCode[];
};

export type MqttUnsubscribeEvent = {
    subscriptions: Omit<MqttSubscription, "qualityOfService">[];
};

export interface MqttPacketHandler {
    onConnected?(): void | Promise<void>;

    onDisconnect?(): void | Promise<void>;

    onMessage?(event: MqttMessageEvent): void | Promise<void>;

    onSubscribe?(event: MqttSubscribeEvent): MqttOnSubscribeResult | Promise<MqttOnSubscribeResult>;

    onUnsubscribe?(event: MqttUnsubscribeEvent): void | Promise<void>;
}

export type MqttConnectHandlerRequest = {
    clientId: string;
    cleanSession: boolean;
    keepAlive: number;
    credentials?: MqttCredentials;
};

export type MqttConnectHandlerResponse =
    | {
        returnCode: Exclude<MqttConnAckReturnCode, MqttConnAckReturnCode.ConnectionAccepted>;
    }
    | {
        returnCode: MqttConnAckReturnCode.ConnectionAccepted;
        sessionPresent: boolean;
        initializeHandler: (controller: MqttMessageController) => MqttPacketHandler | Promise<MqttPacketHandler>;
    };

export type MqttConnectHandler = (
    request: MqttConnectHandlerRequest,
) => MqttConnectHandlerResponse | Promise<MqttConnectHandlerResponse>;

export type MqttPacketControllerStreamOptions =
    | { handleConnect: MqttConnectHandler }
    | {
        connect: {
            clientId?: string;
            credentials?: MqttCredentials;
            initializeHandler: (controller: MqttMessageController) => MqttPacketHandler;
        };
    };

export const enum MqttPacketControllerStreamStateId {
    Idle,
    Connected,
    Disconnected,
}

export type MqttPacketControllerStreamIdleState = {
    id: MqttPacketControllerStreamStateId.Idle;
};

export type MqttPacketControllerStreamConnectedState = {
    id: MqttPacketControllerStreamStateId.Connected;
    messageController: MqttMessageController;
    handler: MqttPacketHandler;
    keepAlive: number;
    keepAliveTimeoutId: number;
};

export type MqttPacketControllerStreamDisconnectedState = {
    id: MqttPacketControllerStreamStateId.Disconnected;
};

export type MqttPacketControllerStreamState =
    | MqttPacketControllerStreamIdleState
    | MqttPacketControllerStreamConnectedState
    | MqttPacketControllerStreamDisconnectedState;

export class MqttPacketControllerStream extends TransformStream<MqttPacket, MqttPacket> {
    constructor(options: MqttPacketControllerStreamOptions) {
        const packetProvider = new MqttPacketProvider();
        const disconnect = async (controller?: TransformStreamDefaultController<MqttPacket>, error?: unknown) => {
            try {
                if (state.id === MqttPacketControllerStreamStateId.Connected) {
                    clearTimeout(state.keepAliveTimeoutId);
                    await state.handler.onDisconnect?.();

                    state = {
                        id: MqttPacketControllerStreamStateId.Disconnected,
                    };
                }
            } finally {
                packetProvider[Symbol.dispose]();

                if (error) {
                    controller?.error(error);
                } else {
                    controller?.terminate();
                }
            }
        };

        let state: MqttPacketControllerStreamState = {
            id: MqttPacketControllerStreamStateId.Idle,
        };

        super(
            "handleConnect" in options
                ? {
                    transform: async (packet, controller) => {
                        try {
                            switch (state.id) {
                                case MqttPacketControllerStreamStateId.Idle: {
                                    if (packet.type !== MqttPacketType.Connect) {
                                        controller.error(`[Idle] Received unexpected packet ${Deno.inspect(packet)}`);
                                        break;
                                    }

                                    const response = await options.handleConnect(packet);

                                    if (response.returnCode === MqttConnAckReturnCode.ConnectionAccepted) {
                                        const {
                                            returnCode,
                                            sessionPresent,
                                            initializeHandler,
                                        } = response;

                                        const messageController = new MqttMessageController(
                                            packetProvider,
                                            {
                                                enqueue: (packet) => {
                                                    try {
                                                        controller.enqueue(packet);
                                                    } catch (error) {
                                                        disconnect(controller, error)
                                                            .catch(console.error);
                                                    }
                                                },
                                                terminate: () => {
                                                    disconnect(controller)
                                                        .catch(console.error);
                                                },
                                            },
                                        );

                                        state = {
                                            id: MqttPacketControllerStreamStateId.Connected,
                                            handler: await initializeHandler(messageController),
                                            messageController,
                                            keepAlive: packet.keepAlive,
                                            keepAliveTimeoutId: setTimeout(() => {
                                                disconnect(controller, new Deno.errors.TimedOut())
                                                    .catch(console.error);
                                            }, packet.keepAlive * 1000 + 1000),
                                        };

                                        controller.enqueue({
                                            type: MqttPacketType.ConnAck,
                                            sessionPresent,
                                            returnCode,
                                        });

                                        await state.handler.onConnected?.();
                                    } else {
                                        controller.enqueue({
                                            type: MqttPacketType.ConnAck,
                                            sessionPresent: false,
                                            returnCode: response.returnCode,
                                        });
                                    }

                                    break;
                                }
                                case MqttPacketControllerStreamStateId.Connected:
                                    clearTimeout(state.keepAliveTimeoutId);
                                    state.keepAliveTimeoutId = setTimeout(() => {
                                        disconnect(controller, new Deno.errors.TimedOut())
                                            .catch(console.error);
                                    }, state.keepAlive * 1000 + 10000);

                                    if (!packetProvider.processIncomingPacket(packet)) {
                                        switch (packet.type) {
                                            case MqttPacketType.Publish:
                                                switch (packet.message.qualityOfService) {
                                                    case MqttQualityOfService.atMostOnce:
                                                        state.handler.onMessage?.({
                                                            message: packet.message,
                                                        })
                                                            ?.catch((error) => disconnect(controller, error));

                                                        break;

                                                    case MqttQualityOfService.atLeastOnce:
                                                        controller.enqueue({
                                                            type: MqttPacketType.PubAck,
                                                            id: packet.id,
                                                        });

                                                        state.handler.onMessage?.({
                                                            message: packet.message,
                                                        })
                                                            ?.catch((error) => disconnect(controller, error));

                                                        break;

                                                    case MqttQualityOfService.exactlyOnce:
                                                        controller.enqueue({
                                                            type: MqttPacketType.PubRec,
                                                            id: packet.id,
                                                        });

                                                        packetProvider
                                                            .request({
                                                                type: MqttPacketType.PubRel,
                                                                id: packet.id,
                                                            })
                                                            .then(() => {
                                                                controller.enqueue({
                                                                    type: MqttPacketType.PubComp,
                                                                    id: packet.id,
                                                                });

                                                                if (
                                                                    state.id ===
                                                                        MqttPacketControllerStreamStateId.Connected
                                                                ) {
                                                                    state.handler.onMessage?.({
                                                                        message: packet.message,
                                                                    })
                                                                        ?.catch((error) =>
                                                                            disconnect(controller, error)
                                                                        );
                                                                }
                                                            })
                                                            .catch((error) => disconnect(controller, error));

                                                        break;
                                                }

                                                break;

                                            case MqttPacketType.Subscribe:
                                                controller.enqueue({
                                                    type: MqttPacketType.SubAck,
                                                    id: packet.id,
                                                    returnCodes:
                                                        (await (state as MqttPacketControllerStreamConnectedState)
                                                            .handler.onSubscribe?.({
                                                                subscriptions: packet.subscriptions,
                                                            }))?.returnCodes ?? (
                                                                packet.subscriptions
                                                                    .map(({ qualityOfService }) =>
                                                                        toMqttSubAckReturnCode(qualityOfService)
                                                                    )
                                                            ),
                                                });

                                                break;

                                            case MqttPacketType.Unsubscribe:
                                                controller.enqueue({
                                                    type: MqttPacketType.UnsubAck,
                                                    id: packet.id,
                                                });

                                                await state.handler.onUnsubscribe?.({
                                                    subscriptions: (
                                                        packet.topics
                                                            .map((topicFilter) => ({ topicFilter }))
                                                    ),
                                                });

                                                break;

                                            case MqttPacketType.PingReq:
                                                controller.enqueue({
                                                    type: MqttPacketType.PingResp,
                                                });

                                                break;

                                            case MqttPacketType.Disconnect:
                                                await disconnect(controller);

                                                break;

                                            default:
                                                console.error(
                                                    `[Connected] Received unexpected packet ${Deno.inspect(packet)}`,
                                                );

                                                break;
                                        }
                                    }

                                    break;
                                case MqttPacketControllerStreamStateId.Disconnected:
                                    break;
                            }
                        } catch (error) {
                            await disconnect(controller, error);
                        }
                    },
                    cancel: async (reason) => {
                        await disconnect(undefined, reason);
                    },
                    flush: async (...args) => {
                        await disconnect(...args);
                    },
                }
                : {
                    // deno-lint-ignore require-await no-unused-vars
                    transform: async (packet, controller) => {
                        throw new Error("unimplemented");
                    },
                    flush: disconnect,
                },
        );
    }
}
