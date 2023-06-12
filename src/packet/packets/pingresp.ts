import { encoder, PacketHeader, PacketType } from "../mod.ts";
import { PacketDecoder } from "../decoder.ts";


export type PingRespPacket = {
    type: PacketType.PingResp,
};

export const PingRespPacket = {
    encode: (packet: PingRespPacket): Uint8Array => (
        encoder
            .header({
                type: PacketType.PingResp,
            })
            .unwrap()
    ),
    decode: (_header: PacketHeader, decoder: PacketDecoder): PingRespPacket => ({
        type: PacketType.PingResp,
    }),
} as const;
