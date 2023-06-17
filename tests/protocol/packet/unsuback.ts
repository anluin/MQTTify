import { assertEquals } from "https://deno.land/std@0.192.0/testing/asserts.ts";

import { UnsubAckPacket } from "../../../protocol/packet/unsuback.ts";
import { PacketType } from "../../../protocol/packet.ts";


Deno.test("UnsubAckPacket: raw encode/decode", () => {
    for (let id = 0; id < 2 ** 16; ++id) {
        const packet: UnsubAckPacket = {
            type: PacketType.UnsubAck,
            id,
        };

        assertEquals(UnsubAckPacket.decode(
            UnsubAckPacket.encode(packet),
        ), packet);
    }
});
