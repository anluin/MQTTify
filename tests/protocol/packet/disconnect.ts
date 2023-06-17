import { assertEquals } from "https://deno.land/std@0.192.0/testing/asserts.ts";

import { DisconnectPacket } from "../../../protocol/packet/disconnect.ts";
import { PacketType } from "../../../protocol/packet.ts";


Deno.test("DisconnectPacket: raw encode/decode", () => {
    const packet: DisconnectPacket = {
        type: PacketType.Disconnect,
    };

    assertEquals(DisconnectPacket.decode(
        DisconnectPacket.encode(packet),
    ), packet);
});
