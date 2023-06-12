import { Connection } from "./connection.ts";
import { Socket } from "./socket.ts";
import { PacketType, ReturnCode } from "./packet/mod.ts";
import { defaults } from "./defaults.ts";
import { ConnectPacket } from "./packet/packets/connect.ts";
import { ConnAckPacket } from "./packet/packets/connack.ts";


export type ServeOptions = {
    port?: number,
    auth?: (packet: Omit<ConnectPacket, "type">) => Omit<ConnAckPacket, "type">,
} & ({
    secure?: false,
} | {
    secure: true,
    key?: string;
    cert: string;
});


export type ConnectionHandler = (connection: Connection) => void;

export async function* serve(options?: ServeOptions) {
    const port = options?.port ?? defaults.port;

    for await (const connection of (
        options?.secure
            ? Deno.listenTls({
                port,
                key: options.key,
                cert: options.cert,
            })
            : Deno.listen({
                port,
            })
    )) {
        const socket = new Socket(connection);
        const packet = await (
            socket
                .receive(PacketType.Connect, defaults.timeouts.connect)
                .catch(() => undefined)
        );

        if (packet) {
            const {
                type,
                ...details
            } = packet;

            const response = options?.auth?.(details) ?? {
                returnCode: ReturnCode.ConnectionAccepted,
                sessionPresent: false,
            };

            await socket.send(PacketType.ConnAck, response);

            if (response.returnCode === ReturnCode.ConnectionAccepted) {
                yield await new Connection(socket, details);
                continue;
            }
        }

        socket.close();
    }
}
