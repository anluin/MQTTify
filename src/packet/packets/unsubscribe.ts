import { encoder, PacketHeader, PacketType } from "../mod.ts";
import { PacketDecoder } from "../decoder.ts";


export type UnsubscribePacket = {
    type: PacketType.Unsubscribe,
    id: number,
    topics: string[],
};

export const UnsubscribePacket = {
    encode: (packet: UnsubscribePacket): Uint8Array => (
        encoder
            .header({
                type: PacketType.Unsubscribe,
            })
            .payload(encoder => {
                encoder.uint16(packet.id);

                for (const topic of packet.topics) {
                    encoder.string(topic);
                }
            })
            .unwrap()
    ),
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
