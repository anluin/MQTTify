import { assertEquals } from "https://deno.land/std@0.192.0/testing/asserts.ts";

import { PubRelPacket } from "../../../protocol/packet/pubrel.ts";
import { PacketType } from "../../../protocol/packet.ts";


Deno.test("PubRelPacket: raw encode/decode", () => {
    for (let id = 0; id < 2 ** 16; ++id) {
        const packet: PubRelPacket = {
            type: PacketType.PubRel,
            id,
        };

        assertEquals(PubRelPacket.decode(
            PubRelPacket.encode(packet),
        ), packet);
    }
});
