import { Uint8 } from "../../utils/intdef.ts";
import { PacketDecoder } from "./decode.ts";
import { PacketEncoder } from "./encode.ts";
import { Packet } from "./packet.ts";


export const readPacket = async (connection: Deno.Conn) => {
    const decoder = new PacketDecoder();
    const buffer = new Uint8Array(1);

    let packet: Packet | undefined;

    do {
        if (await connection.read(buffer) !== 1) {
            throw new Error();
        }
    } while (!(packet = decoder.partialDecode(buffer[0] as Uint8)));

    return packet;
}

export const writePacket = async (connection: Deno.Conn, packet: Packet) => {
    const encoder = new PacketEncoder();
    await connection.write(encoder.encode(packet));
}
