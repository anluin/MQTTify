import { encoder, PacketHeader, PacketType } from "../mod.ts";
import { PacketDecoder } from "../decoder.ts";


export type PubRelPacket = {
    type: PacketType.PubRel,
    id: number,
};

export const PubRelPacket = {
    encode: (packet: PubRelPacket): Uint8Array => (
        encoder
            .header({
                type: PacketType.PubRel,
                flags: {
                    dup: false,
                    qos: 1,
                    retain: false,
                },
            })
            .payload(encoder => (
                encoder
                    .uint16(packet.id)
            ))
            .unwrap()
    ),
    decode: (_header: PacketHeader, decoder: PacketDecoder): PubRelPacket => ({
        type: PacketType.PubRel,
        id: decoder.uint16(),
    }),
} as const;
