import { defaults, Message, PacketType, Payload, QualityOfService, ReturnCode, Socket } from "./mod.ts";


export type ConnectOptions = {
    clientId?: string,
    cleanSession?: boolean,
    keepAlive?: number,
    will?: Message,
    autoReconnect?: number,
};

export type PublishOptions = Omit<Message, "topic" | "payload">;

export abstract class ClientBase {
    #socket?: Socket;

    private packetIdCounter?: number;

    protected constructor(socket?: Socket) {
        this.#socket = socket;
    }

    get connected() {
        return !!this.#socket;
    }

    protected get socket(): Socket {
        if (!this.#socket)
            throw new Error("disconnected");

        return this.#socket;
    }

    protected set socket(value: undefined | Socket) {
        this.#socket = value;
    }

    async publish(topic: string, payload?: Payload, options?: PublishOptions): Promise<this>;

    async publish(message: Message): Promise<this>;

    async publish(...args: (
        [ topic: string, payload?: Payload, options?: PublishOptions ] |
        [ message: Message ]
        )) {
        if (!this.socket)
            throw new Error("disconnected");

        const message: Message = (
            typeof args[0] !== "string"
                ? args[0]
                : {
                    topic: args[0],
                    payload: args[1],
                    ...args[2],
                }
        );

        const id = (
            message.qos ?? 0 > 0
                ? this.nextPacketId()
                : 0
        );

        for (let count = 0; count < defaults.retries.publish; ++count) {
            await this.socket.send(PacketType.Publish, {
                id,
                dup: false,
                message,
            });

            switch (message.qos) {
                case QualityOfService.atMostOnce:
                    break;
                case QualityOfService.atLeastOnce:
                    try {
                        await this.socket.receive(PacketType.PubAck, defaults.timeouts.puback, id);
                    } catch (error) {
                        if (error instanceof Deno.errors.TimedOut) {
                            await new Promise(resolve => setTimeout(resolve, 1000));
                            continue;
                        }

                        throw error;
                    }

                    break;
                case QualityOfService.exactlyOnce:
                    try {
                        await this.socket.receive(PacketType.PubRec, defaults.timeouts.pubrec, id);

                        for (let count = 0; count < defaults.retries.pubrel; ++count) {
                            await this.socket.send(PacketType.PubRel, { id });

                            try {
                                await this.socket.receive(PacketType.PubComp, defaults.timeouts.pubcomp, id);
                            } catch (error) {
                                if (error instanceof Deno.errors.TimedOut) {
                                    await new Promise(resolve => setTimeout(resolve, 1000));
                                    continue;
                                }

                                throw error;
                            }
                        }
                    } catch (error) {
                        if (error instanceof Deno.errors.TimedOut) {
                            await new Promise(resolve => setTimeout(resolve, 1000));
                            continue;
                        }

                        throw error;
                    }

                    break;
            }

            break;
        }

        return this;
    }

    protected nextPacketId() {
        return (this.packetIdCounter = (this.packetIdCounter ?? 0) % defaults.limits.maxPacketId) + 1;
    }
}

export class Client extends ClientBase {
    private readonly broker: {
        hostname: string,
        port: number,
        secure: boolean,
        username?: string,
        password?: string,
        connectOptions?: ConnectOptions;
    };

    private preventReconnect?: boolean;

    constructor(url: string | URL, options?: ConnectOptions) {
        super();
        url = url instanceof URL ? url : new URL(url);

        if (!/^mqtts?:/.test(url.protocol)) {
            throw new Error(`unsupported protocol: "${url.protocol.slice(0, -1)}"`);
        }

        this.broker = {
            hostname: url.hostname,
            port: (
                url.port
                    ? parseInt(url.port)
                    : defaults.port
            ),
            secure: url.protocol === "mqtts:",
            username: url.username ? url.username : undefined,
            password: url.password ? url.password : undefined,
            connectOptions: options,
        };
    }

    async connect(options?: ConnectOptions) {
        this.broker.connectOptions = options ??= this.broker.connectOptions;
        this.preventReconnect = false;

        const socket = new Socket((
            this.broker.secure
                ? await Deno.connectTls(this.broker)
                : await Deno.connect(this.broker)
        ));

        await socket.send(PacketType.Connect, {
            clientId: options?.clientId ?? crypto.randomUUID(),
            cleanSession: options?.cleanSession ?? !options?.clientId,
            keepAlive: options?.keepAlive ?? defaults.keepAlive,
            will: options?.will,
            username: this.broker.username,
            password: this.broker.password,
        });

        const packet = await socket.receive(PacketType.ConnAck, defaults.timeouts.connack);

        switch (packet.returnCode) {
            case ReturnCode.ConnectionAccepted:
                this.socket = socket;

                return this;
            case ReturnCode.UnacceptableProtocolVersion:
                throw new Error("unacceptable protocol version");
            case ReturnCode.ClientIdentifierRejected:
                throw new Error("client identifier rejected");
            case ReturnCode.ServerUnavailable:
                throw new Error("server unavailable");
            case ReturnCode.BadUsernameOrPassword:
                throw new Error("bad username or password");
            case ReturnCode.NotAuthorized:
                throw new Error("not authorized");
        }
    }

    async disconnect() {
        this.preventReconnect = true;

        if (this.socket) {
            const [ socket ] = ([ , this.socket ] = [ this.socket, undefined ]);

            await socket.send(PacketType.Disconnect, {});
            await socket.close();
        }

        return this;
    }

    async subscribe(topic: string, qos: QualityOfService = QualityOfService.atMostOnce) {
        const id = (
            qos ?? 0 > 0
                ? this.nextPacketId()
                : 0
        );

        await this.socket.send(PacketType.Subscribe, {
            id,
            subscriptions: [
                {
                    topic,
                    qos
                },
            ],
        });

        if (qos > 0) {
            await this.socket.receive(PacketType.SubACK, defaults.timeouts.suback, id);
        }
    }
}
