import { assertEquals } from "https://deno.land/std@0.192.0/testing/asserts.ts";

import { PingRespPacket } from "../../../protocol/packet/pingresp.ts";
import { PacketType } from "../../../protocol/packet.ts";


Deno.test("PingRespPacket: raw encode/decode", () => {
    const packet: PingRespPacket = {
        type: PacketType.PingResp,
    };

    assertEquals(PingRespPacket.decode(
        PingRespPacket.encode(packet),
    ), packet);
});
