import { assertEquals } from "https://deno.land/std@0.192.0/testing/asserts.ts";

import { PubRecPacket } from "../../../protocol/packet/pubrec.ts";
import { PacketType } from "../../../protocol/packet.ts";


Deno.test("PubRecPacket: raw encode/decode", () => {
    for (let id = 0; id < 2 ** 16; ++id) {
        const packet: PubRecPacket = {
            type: PacketType.PubRec,
            id,
        };

        assertEquals(PubRecPacket.decode(
            PubRecPacket.encode(packet),
        ), packet);
    }
});
