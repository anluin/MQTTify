import { encoder, PacketHeader, PacketType } from "../mod.ts";
import { PacketDecoder } from "../decoder.ts";


export type PingReqPacket = {
    type: PacketType.PingReq,
};

export const PingReqPacket = {
    encode: (packet: PingReqPacket): Uint8Array => (
        encoder
            .header({
                type: PacketType.PingReq,
            })
            .unwrap()
    ),
    decode: (_header: PacketHeader, decoder: PacketDecoder): PingReqPacket => ({
        type: PacketType.PingReq,
    }),
} as const;
