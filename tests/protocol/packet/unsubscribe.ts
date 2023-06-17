import { assertEquals } from "https://deno.land/std@0.192.0/testing/asserts.ts";

import { UnsubscribePacket } from "../../../protocol/packet/unsubscribe.ts";
import { PacketType } from "../../../protocol/packet.ts";


Deno.test("UnsubscribePacket: raw encode/decode", () => {
    for (let id = 0; id < 2 ** 16; ++id) {
        const packet: UnsubscribePacket = {
            type: PacketType.Unsubscribe,
            id,
            topics: [
                "test",
                "test",
                "test",
            ],
        };

        assertEquals(UnsubscribePacket.decode(
            UnsubscribePacket.encode(packet),
        ), packet);
    }
});
