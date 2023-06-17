import { assertEquals } from "https://deno.land/std@0.192.0/testing/asserts.ts";

import { PubCompPacket } from "../../../protocol/packet/pubcomp.ts";
import { PacketType } from "../../../protocol/packet.ts";


Deno.test("PubCompPacket: raw encode/decode", () => {
    for (let id = 0; id < 2 ** 16; ++id) {
        const packet: PubCompPacket = {
            type: PacketType.PubComp,
            id,
        };

        assertEquals(PubCompPacket.decode(
            PubCompPacket.encode(packet),
        ), packet);
    }
});
