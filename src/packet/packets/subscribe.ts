import { encoder, PacketHeader, PacketType, Subscription } from "../mod.ts";
import { PacketDecoder } from "../decoder.ts";


export type SubscribePacket = {
    type: PacketType.Subscribe,
    id: number,
    subscriptions: Subscription[],
};

export const SubscribePacket = {
    encode: (packet: SubscribePacket): Uint8Array => (
        encoder
            .header({
                type: PacketType.Subscribe,
            })
            .payload(encoder => {
                encoder.uint16(packet.id);

                for (const subscription of packet.subscriptions) {
                    encoder
                        .string(subscription.topic)
                        .uint8(subscription.qos);
                }
            })
            .unwrap()
    ),
    decode: (_header: PacketHeader, decoder: PacketDecoder): SubscribePacket => {
        const id = decoder.uint16();
        const subscriptions: Subscription[] = [];

        while (decoder.numRemainingBytes > 0) {
            subscriptions.push(<Subscription>{
                topic: decoder.string(),
                qos: decoder.uint8(),
            });
        }

        return {
            type: PacketType.Subscribe,
            id,
            subscriptions,
        };
    },
} as const;
