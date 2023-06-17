import { assertEquals } from "https://deno.land/std@0.192.0/testing/asserts.ts";

import { SubAckPacket } from "../../../protocol/packet/suback.ts";
import { PacketType, SubAckReturnCode } from "../../../protocol/packet.ts";


Deno.test("SubAckPacket: raw encode/decode", () => {
    for (let id = 0; id < 2 ** 16; ++id) {
        const packet: SubAckPacket = {
            type: PacketType.SubAck,
            id,
            returnCodes: [
                SubAckReturnCode.SuccessMaximumQoS_0,
                SubAckReturnCode.SuccessMaximumQoS_1,
                SubAckReturnCode.SuccessMaximumQoS_2,
                SubAckReturnCode.Failure,
            ],
        };

        assertEquals(SubAckPacket.decode(
            SubAckPacket.encode(packet),
        ), packet);
    }
});
