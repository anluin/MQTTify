import { PacketHeader, PacketType } from "../mod.ts";
import { PacketDecoder } from "../decoder.ts";


export type UnsubscribePacket = {
    type: PacketType.Unsubscribe,
    id: number,
    topics: string[],
};

export const UnsubscribePacket = {
    encode: (_packet: UnsubscribePacket): Uint8Array => {
        throw new Error("unimplemented");
    },
    decode: (_header: PacketHeader, decoder: PacketDecoder): UnsubscribePacket => {
        const id = decoder.uint16();
        const topics: string[] = [];

        while (decoder.numRemainingBytes > 0) {
            topics.push(decoder.string());
        }

        return {
            type: PacketType.Unsubscribe,
            id,
            topics,
        };
    },
} as const;
