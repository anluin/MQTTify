import { assertEquals } from "https://deno.land/std@0.192.0/testing/asserts.ts";

import { PubAckPacket } from "../../../protocol/packet/puback.ts";
import { PacketType } from "../../../protocol/packet.ts";


Deno.test("PubAckPacket: raw encode/decode", () => {
    for (let id = 0; id < 2 ** 16; ++id) {
        const packet: PubAckPacket = {
            type: PacketType.PubAck,
            id,
        };

        assertEquals(PubAckPacket.decode(
            PubAckPacket.encode(packet),
        ), packet);
    }
});
