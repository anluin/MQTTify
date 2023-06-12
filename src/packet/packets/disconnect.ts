import { encoder, PacketHeader, PacketType } from "../mod.ts";
import { PacketDecoder } from "../decoder.ts";


export type DisconnectPacket = {
    type: PacketType.Disconnect,
};

export const DisconnectPacket = {
    encode: (_packet: DisconnectPacket): Uint8Array => (
        encoder
            .header({
                type: PacketType.Disconnect,
            })
            .unwrap()
    ),
    decode: (_header: PacketHeader, _decoder: PacketDecoder): DisconnectPacket => ({
        type: PacketType.Disconnect,
    }),
} as const;
