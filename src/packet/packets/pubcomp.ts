import { encoder, PacketHeader, PacketType } from "../mod.ts";
import { PacketDecoder } from "../decoder.ts";


export type PubCompPacket = {
    type: PacketType.PubComp,
    id: number,
};

export const PubCompPacket = {
    encode: (packet: PubCompPacket): Uint8Array => (
        encoder
            .header({
                type: PacketType.PubComp,
            })
            .payload(encoder => (
                encoder
                    .uint16(packet.id)
            ))
            .unwrap()
    ),
    decode: (_header: PacketHeader, decoder: PacketDecoder): PubCompPacket => ({
        type: PacketType.PubComp,
        id: decoder.uint16(),
    }),
} as const;
