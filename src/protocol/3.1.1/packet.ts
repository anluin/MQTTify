import { isUint16, Uint16, Uint8 } from "../../utils/intdef.ts";
import { text } from "../../utils/text.ts";

import { ConnectPacket } from "./packet/connect.ts";
import { ConnAckPacket } from "./packet/connack.ts";
import { PublishPacket } from "./packet/publish.ts";
import { PubAckPacket } from "./packet/puback.ts";
import { PubRecPacket } from "./packet/pubrec.ts";
import { PubRelPacket } from "./packet/pubrel.ts";
import { PubCompPacket } from "./packet/pubcomp.ts";
import { SubscribePacket } from "./packet/subscribe.ts";
import { SubAckPacket } from "./packet/suback.ts";
import { PingReqPacket } from "./packet/pingreq.ts";
import { PingRespPacket } from "./packet/pingresp.ts";
import { DisconnectPacket } from "./packet/disconnect.ts";
import { UnsubscribePacket } from "./packet/unsubscribe.ts";
import { UnsubAckPacket } from "./packet/unsuback.ts";


export enum PacketType {
    Connect = 1,
    ConnAck = 2,
    Publish = 3,
    PubAck = 4,
    PubRec = 5,
    PubRel = 6,
    PubComp = 7,
    Subscribe = 8,
    SubAck = 9,
    Unsubscribe = 10,
    UnsubAck = 11,
    PingReq = 12,
    PingResp = 13,
    Disconnect = 14,
}

export const isPacketType = (value: number): value is PacketType =>
    value >= 1 && value <= 14;

export type Packet
    = ConnectPacket
    | ConnAckPacket
    | PublishPacket
    | PubRecPacket
    | PubRelPacket
    | PubCompPacket
    | PubAckPacket
    | SubscribePacket
    | SubAckPacket
    | UnsubscribePacket
    | UnsubAckPacket
    | PingReqPacket
    | PingRespPacket
    | DisconnectPacket;

export enum QualityOfService {
    atMostOnce = 0,
    atLeastOnce = 1,
    exactlyOnce = 2,
}

export const isQualityOfService = (value: number): value is QualityOfService =>
    value >= 0 && value <= 2;

export type Message = {
    topic: string,
    payload: Uint8Array,
    retain?: boolean,
    qos?: QualityOfService,
};

export type Cursor = {
    read: number,
    write: number,
};

export type RawPacketHeader = {
    type: PacketType,
    flags?: {
        retain: boolean;
        qos: QualityOfService,
        dup: boolean;
    },
};

export type RawPacket = {
    header: RawPacketHeader,
    payload: RawPayload,
};

export class RawPayload {
    bytes: Uint8[];
    capacity: number;
    cursor: Cursor;

    constructor(bytes: Uint8[] = [], capacity: number = 0, cursor: Cursor = {
        read: 0,
        write: 0,
    }) {
        this.bytes = bytes;
        this.capacity = capacity;
        this.cursor = cursor;
    }

    get numRemainingBytes() {
        return this.bytes.length - this.cursor.read;
    }

    readUint8() {
        return this.bytes?.[this.cursor.read++] ?? 0 as Uint8;
    }

    readUint16() {
        const msb = this.readUint8();
        const lsb = this.readUint8();

        return ((msb << 8) | lsb) as Uint16;
    }

    readByteArray(length: number = this.readUint16()): Uint8[] {
        return this.bytes?.slice(
            this.cursor.read,
            this.cursor.read += length,
        ) ?? [];
    }

    readRest(): Uint8[] {
        return this.readByteArray(
            (this.bytes?.length ?? this.capacity)
            - this.cursor.read
        );
    }

    readString() {
        return text.decoder.decode(Uint8Array.from(this.readByteArray()));
    }

    writeUint8(...values: Uint8[]) {
        for (const value of values) {
            (this.bytes ??= [])[this.cursor.write++] = value as Uint8;
        }

        this.capacity = Math.max(this.capacity, this.bytes.length);

        return this;
    }

    writeUint16(value: Uint16) {
        return this.writeUint8(
            (value >> 8) as Uint8,
            (value & 0xff) as Uint8,
        );
    }

    writeByteArray(value: Uint8[] | Uint8Array) {
        if (!isUint16(value.length))
            throw new Error("too much data (max. 65536 bytes)");

        return (
            this.writeUint16(value.length)
                .writeUint8(...value as Uint8[])
        );
    }

    writeString(value: string) {
        if (/\x00|[\uD800-\uDFFF]/.test(value)) {
            throw new Error("malformed string");
        }

        return this.writeByteArray(text.encoder.encode(value));
    }
}
