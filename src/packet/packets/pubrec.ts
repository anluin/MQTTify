import { encoder, PacketHeader, PacketType } from "../mod.ts";
import { PacketDecoder } from "../decoder.ts";


export type PubRecPacket = {
    type: PacketType.PubRec,
    id: number,
};

export const PubRecPacket = {
    encode: (packet: PubRecPacket): Uint8Array => (
        encoder
            .header({
                type: PacketType.PubRec,
            })
            .payload(encoder => (
                encoder
                    .uint16(packet.id)
            ))
            .unwrap()
    ),
    decode: (_header: PacketHeader, decoder: PacketDecoder): PubRecPacket => ({
        type: PacketType.PubRec,
        id: decoder.uint16(),
    }),
} as const;
