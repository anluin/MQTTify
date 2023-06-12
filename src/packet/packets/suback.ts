import { encoder, PacketHeader, PacketType } from "../mod.ts";
import { PacketDecoder } from "../decoder.ts";


export type SubAckPacket = {
    type: PacketType.SubACK,
    id: number,
    returnCodes: number[],
};

export const SubAckPacket = {
    encode: (packet: SubAckPacket): Uint8Array => (
        encoder
            .header({
                type: PacketType.SubACK,
            })
            .payload(encoder => {
                encoder
                    .uint16(packet.id)
                    .uint8(...packet.returnCodes);
            })
            .unwrap()
    ),
    decode: (_header: PacketHeader, decoder: PacketDecoder): SubAckPacket => {
        throw new Error("unimplemented");
    },
} as const;
