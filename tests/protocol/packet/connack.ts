import { assertEquals } from "https://deno.land/std@0.192.0/testing/asserts.ts";

import { ConnAckReturnCode, PacketType } from "../../../protocol/packet.ts";
import { ConnAckPacket } from "../../../protocol/packet/conack.ts";


Deno.test("ConnAckPacket: raw encode/decode #1", () => {
    const packet: ConnAckPacket = {
        type: PacketType.ConnAck,
        returnCode: ConnAckReturnCode.ConnectionAccepted,
        sessionPresent: false,
    };

    assertEquals(ConnAckPacket.decode(
        ConnAckPacket.encode(packet),
    ), packet);
});

Deno.test("ConnAckPacket: raw encode/decode #2", () => {
    const packet: ConnAckPacket = {
        type: PacketType.ConnAck,
        returnCode: ConnAckReturnCode.ConnectionAccepted,
        sessionPresent: true,
    };

    assertEquals(ConnAckPacket.decode(
        ConnAckPacket.encode(packet),
    ), packet);
});

Deno.test("ConnAckPacket: raw encode/decode #3", () => {
    const packet: ConnAckPacket = {
        type: PacketType.ConnAck,
        returnCode: ConnAckReturnCode.BadUsernameOrPassword,
        sessionPresent: false,
    };

    assertEquals(ConnAckPacket.decode(
        ConnAckPacket.encode(packet),
    ), packet);
});

Deno.test("ConnAckPacket: raw encode/decode #4", () => {
    const packet: ConnAckPacket = {
        type: PacketType.ConnAck,
        returnCode: ConnAckReturnCode.ServerUnavailable,
        sessionPresent: true,
    };

    assertEquals(ConnAckPacket.decode(
        ConnAckPacket.encode(packet),
    ), packet);
});
