import { encoder, PacketHeader, PacketType } from "../mod.ts";
import { PacketDecoder } from "../decoder.ts";


export type PubAckPacket = {
    type: PacketType.PubAck,
    id: number,
};

export const PubAckPacket = {
    encode: (packet: PubAckPacket): Uint8Array => (
        encoder
            .header({
                type: PacketType.PubAck,
            })
            .payload(encoder => (
                encoder
                    .uint16(packet.id)
            ))
            .unwrap()
    ),
    decode: (_header: PacketHeader, decoder: PacketDecoder): PubAckPacket => ({
        type: PacketType.PubAck,
        id: decoder.uint16(),
    }),
} as const;
