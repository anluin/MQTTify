import { assertEquals } from "https://deno.land/std@0.192.0/testing/asserts.ts";

import { PublishPacket } from "../../../protocol/packet/publish.ts";
import { PacketType, QualityOfService } from "../../../protocol/packet.ts";


Deno.test("PublishPacket: raw encode/decode", () => {
    for (let id = 0; id < 2 ** 16; ++id) {
        const packet: PublishPacket = {
            type: PacketType.Publish,
            id: id,
            dup: false,
            topic: "test",
            payload: new Uint8Array(),
            qos: QualityOfService.exactlyOnce,
            retain: false,
        };

        assertEquals(PublishPacket.decode(
            PublishPacket.encode(packet),
        ), packet);
    }

    for (let qos = 0; qos < 3; ++qos) {
        for (let dup = 0; dup < 2; ++dup) {
            for (let retain = 0; retain < 2; ++retain) {
                const packet: PublishPacket = {
                    type: PacketType.Publish,
                    id: qos,
                    dup: !!dup,
                    topic: "test",
                    payload: new Uint8Array(),
                    qos: qos,
                    retain: !!retain,
                };

                assertEquals(PublishPacket.decode(
                    PublishPacket.encode(packet),
                ), packet);
            }
        }
    }
});
