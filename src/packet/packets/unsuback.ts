import { encoder, PacketHeader, PacketType } from "../mod.ts";
import { PacketDecoder } from "../decoder.ts";


export type UnsubAckPacket = {
    type: PacketType.UnsubAck,
    id: number,
};

export const UnsubAckPacket = {
    encode: (packet: UnsubAckPacket): Uint8Array => (
        encoder
            .header({
                type: PacketType.UnsubAck,
            })
            .payload(encoder => {
                encoder.uint16(packet.id);
            })
            .unwrap()
    ),
    decode: (_header: PacketHeader, decoder: PacketDecoder): UnsubAckPacket => {
        throw new Error("unimplemented");
    },
} as const;
