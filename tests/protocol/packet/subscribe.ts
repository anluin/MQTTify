import { assertEquals } from "https://deno.land/std@0.192.0/testing/asserts.ts";

import { SubscribePacket } from "../../../protocol/packet/subscribe.ts";
import { PacketType, QualityOfService } from "../../../protocol/packet.ts";


Deno.test("SubscribePacket: raw encode/decode", () => {
    for (let id = 0; id < 2 ** 16; ++id) {
        const packet: SubscribePacket = {
            type: PacketType.Subscribe,
            id,
            subscriptions: [
                {
                    topic: "test",
                    qos: QualityOfService.atMostOnce,
                },
                {
                    topic: "test",
                    qos: QualityOfService.atLeastOnce,
                },
                {
                    topic: "test",
                    qos: QualityOfService.atLeastOnce,
                },
            ],
        };

        assertEquals(SubscribePacket.decode(
            SubscribePacket.encode(packet),
        ), packet);
    }
});
