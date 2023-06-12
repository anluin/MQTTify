import { Packet, PacketType } from "./packet/mod.ts";
import { PacketDecoderStream } from "./packet/decoder_stream.ts";

export type PacketEvent = {
    type: "packet",
    packet: Packet,
    preventDefault(): void;
};

export type PacketListener = (event: PacketEvent) => void | Promise<void>;

export class Socket {
    private readonly connection: Deno.Conn;
    private readonly listeners: {
        packet: Set<PacketListener>,
    };

    constructor(connection: Deno.Conn) {
        this.connection = connection;
        this.listeners = {
            packet: new Set(),
        };
        this.loop()
            .catch(console.error);
    }

    addEventListener(event: "packet", listener: PacketListener) {
        this.listeners[event].add(listener);
    }

    removeEventListener(event: "packet", listener: PacketListener) {
        this.listeners[event].delete(listener);
    }

    async send<T extends Packet["type"]>(type: T, data: Omit<Extract<Packet, {
        type: T
    }>, "type">) {
        const bytes = Packet.encode({ type, ...data } as unknown as Packet);

        for (let numBytesWritten = 0; numBytesWritten < bytes.length;) {
            numBytesWritten += await this.connection.write(bytes.subarray(numBytesWritten));
        }
    }

    async receive<T extends Extract<Packet, {
        id: number
    }>["type"]>(type: T, timeout: number, id?: number): Promise<Extract<Packet, {
        type: T
    }>>;
    async receive<T extends Packet["type"]>(type: T, timeout: number): Promise<Extract<Packet, {
        type: T
    }>>;
    async receive<T extends Packet["type"]>(type: T, timeout: number, id?: number) {
        return await new Promise<Extract<Packet, {
            type: T
        }>>((resolve, reject) => {
            const timeoutId = (
                timeout > 0
                    ? setTimeout(() => {
                        this.removeEventListener("packet", listener);
                        reject(new Deno.errors.TimedOut());
                    }, timeout)
                    : -1
            );

            const listener: PacketListener = (event) => {
                if (event.packet.type === type) {
                    clearTimeout(timeoutId);
                    event.preventDefault();
                    this.removeEventListener("packet", listener);
                    resolve(event.packet as Extract<Packet, {
                        type: T
                    }>);
                }
            };

            this.addEventListener("packet", listener);
        });
    }

    close() {
        this.connection.close();
    }

    private async loop() {
        let disconnectPacketReceived = false;

        const errors: Error[] = [];

        try {
            for await (const packet of (
                this.connection.readable
                    .pipeThrough(new PacketDecoderStream())
            )) {
                if (errors.length > 0)
                    throw errors;

                let preventDefault = false;

                const event: PacketEvent = {
                    type: "packet",
                    packet,
                    preventDefault: () => {
                        preventDefault = true;
                    },
                };

                Promise.all(
                    [ ...this.listeners.packet ]
                        .map(listener => listener(event)),
                )
                    .then(() => {
                        if (!preventDefault) {
                            throw new Error(`unconsumed packet: ${packet.type}`);
                        }
                    })
                    .catch(error => {
                        errors.push(error);
                    });

                if (packet.type === PacketType.Disconnect) {
                    disconnectPacketReceived = true;
                    break;
                }
            }

            this.connection.close();
        } catch (errors) {
            for (const error of (
                errors instanceof Array ? errors : [ errors ]
            )) {
                if (
                    (error instanceof Deno.errors.Interrupted) ||
                    (error instanceof Deno.errors.ConnectionReset) ||
                    (error instanceof Deno.errors.BadResource)
                ) {
                    return;
                }

                console.error(error);
            }
        } finally {
            if (!disconnectPacketReceived) {
                const event: PacketEvent = {
                    type: "packet",
                    packet: {
                        type: PacketType.Disconnect,
                    },
                    preventDefault: () => {
                    },
                };

                for (const listener of this.listeners.packet) {
                    listener(event);
                }
            }
        }
    }
}
