import { assertEquals } from "https://deno.land/std@0.192.0/testing/asserts.ts";

import { ConnectPacket } from "../../../protocol/packet/connect.ts";
import { PacketType, QualityOfService } from "../../../protocol/packet.ts";


Deno.test("ConnectPacket: raw encode/decode #1", () => {
    const packet: ConnectPacket = {
        type: PacketType.Connect,
        cleanSession: false,
        clientId: "test",
        keepAlive: 50,
        protocol: {
            name: "MQTT",
            level: 4,
        },
        will: {
            topic: "test",
            payload: new Uint8Array(),
            qos: QualityOfService.exactlyOnce,
            retain: false,
        },
        username: "username",
        password: "password",
    };

    assertEquals(ConnectPacket.decode(
        ConnectPacket.encode(packet),
    ), packet);
});

Deno.test("ConnectPacket: raw encode/decode #2", () => {
    const packet: ConnectPacket = {
        type: PacketType.Connect,
        cleanSession: false,
        clientId: "test",
        keepAlive: 50,
        protocol: {
            name: "MQTT",
            level: 4,
        },
        will: {
            topic: "test",
            payload: new Uint8Array(),
            qos: QualityOfService.exactlyOnce,
            retain: false,
        },
        username: "username",
    };

    assertEquals(ConnectPacket.decode(
        ConnectPacket.encode(packet),
    ), packet);
});

Deno.test("ConnectPacket: raw encode/decode #3", () => {
    const packet: ConnectPacket = {
        type: PacketType.Connect,
        cleanSession: false,
        clientId: "test",
        keepAlive: 50,
        protocol: {
            name: "MQTT",
            level: 4,
        },
        will: {
            topic: "test",
            payload: new Uint8Array(),
            qos: QualityOfService.exactlyOnce,
            retain: false,
        },
        password: "password",
    };

    assertEquals(ConnectPacket.decode(
        ConnectPacket.encode(packet),
    ), packet);
});

Deno.test("ConnectPacket: raw encode/decode #4", () => {
    const packet: ConnectPacket = {
        type: PacketType.Connect,
        cleanSession: false,
        clientId: "test",
        keepAlive: 50,
        protocol: {
            name: "MQTT",
            level: 4,
        },
        will: {
            topic: "test",
            payload: new Uint8Array(),
            qos: QualityOfService.exactlyOnce,
            retain: false,
        },
    };

    assertEquals(ConnectPacket.decode(
        ConnectPacket.encode(packet),
    ), packet);
});


Deno.test("ConnectPacket: raw encode/decode #5", () => {
    const packet: ConnectPacket = {
        type: PacketType.Connect,
        cleanSession: false,
        clientId: "test",
        keepAlive: 50,
        protocol: {
            name: "MQTT",
            level: 4,
        },
    };

    assertEquals(ConnectPacket.decode(
        ConnectPacket.encode(packet),
    ), packet);
});
