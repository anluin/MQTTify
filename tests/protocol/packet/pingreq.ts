import { assertEquals } from "https://deno.land/std@0.192.0/testing/asserts.ts";

import { PingReqPacket } from "../../../protocol/packet/pingreq.ts";
import { PacketType } from "../../../protocol/packet.ts";


Deno.test("PingReqPacket: raw encode/decode", () => {
    const packet: PingReqPacket = {
        type: PacketType.PingReq,
    };

    assertEquals(PingReqPacket.decode(
        PingReqPacket.encode(packet),
    ), packet);
});
