import { PacketEncoder } from "./encoder.ts";
import { PacketDecoder } from "./decoder.ts";

import { ConnectPacket } from "./packets/connect.ts";
import { ConnAckPacket } from "./packets/connack.ts";
import { PublishPacket } from "./packets/publish.ts";
import { PubAckPacket } from "./packets/puback.ts";
import { PubRecPacket } from "./packets/pubrec.ts";
import { PubRelPacket } from "./packets/pubrel.ts";
import { PubCompPacket } from "./packets/pubcomp.ts";
import { SubscribePacket } from "./packets/subscribe.ts";
import { SubAckPacket } from "./packets/suback.ts";
import { UnsubscribePacket } from "./packets/unsubscribe.ts";
import { UnsubAckPacket } from "./packets/unsuback.ts";
import { PingReqPacket } from "./packets/pingreg.ts";
import { PingRespPacket } from "./packets/pingresp.ts";
import { DisconnectPacket } from "./packets/disconnect.ts";


export enum ReturnCode {
    ConnectionAccepted = 0,
    UnacceptableProtocolVersion = 1,
    ClientIdentifierRejected = 2,
    ServerUnavailable = 3,
    BadUsernameOrPassword = 4,
    NotAuthorized = 5,
}

export enum PacketType {
    Connect = 1,
    ConnAck = 2,
    Publish = 3,
    PubAck = 4,
    PubRec = 5,
    PubRel = 6,
    PubComp = 7,
    Subscribe = 8,
    SubACK = 9,
    Unsubscribe = 10,
    UnsubAck = 11,
    PingReq = 12,
    PingResp = 13,
    Disconnect = 14,
}

export enum QualityOfService {
    atMostOnce = 0,
    atLeastOnce = 1,
    exactlyOnce = 2,
}

export type PacketHeader = {
    type: PacketType,
    flags?: {
        retain: boolean;
        qos: QualityOfService,
        dup: boolean;
    },
};

export interface ItoJSON {
    toJSON(): JSONValue;
}

export type JSONValue =
    | string
    | number
    | boolean
    | {
    [_: string]: JSONValue
}
    | Array<JSONValue>
    | ItoJSON;

export type Payload = string | Uint8Array | JSONValue;

export type Message = {
    topic: string,
    payload?: Payload,
    retain?: boolean,
    qos?: QualityOfService,
};

export type Subscription = {
    topic: string,
    qos: QualityOfService,
};

export type Packet =
    ConnectPacket |
    ConnAckPacket |
    PublishPacket |
    PubAckPacket |
    PubRecPacket |
    PubRelPacket |
    PubCompPacket |
    SubscribePacket |
    SubAckPacket |
    UnsubscribePacket |
    UnsubAckPacket |
    PingReqPacket |
    PingRespPacket |
    DisconnectPacket;

export const encoder = new PacketEncoder();


export const Packet = {
    encode: (packet: Packet) => {
        switch (packet.type) {
            case PacketType.Connect:
                return ConnectPacket.encode(packet);
            case PacketType.ConnAck:
                return ConnAckPacket.encode(packet);
            case PacketType.Publish:
                return PublishPacket.encode(packet);
            case PacketType.PubAck:
                return PubAckPacket.encode(packet);
            case PacketType.PubRec:
                return PubRecPacket.encode(packet);
            case PacketType.PubRel:
                return PubRelPacket.encode(packet);
            case PacketType.PubComp:
                return PubCompPacket.encode(packet);
            case PacketType.Subscribe:
                return SubscribePacket.encode(packet);
            case PacketType.SubACK:
                return SubAckPacket.encode(packet);
            case PacketType.Unsubscribe:
                return UnsubscribePacket.encode(packet);
            case PacketType.UnsubAck:
                return UnsubAckPacket.encode(packet);
            case PacketType.PingReq:
                return PingReqPacket.encode(packet);
            case PacketType.PingResp:
                return PingRespPacket.encode(packet);
            case PacketType.Disconnect:
                return DisconnectPacket.encode(packet);
        }
    },
    decode: (header: PacketHeader, decoder: PacketDecoder) => {
        switch (header.type) {
            case PacketType.Connect:
                return ConnectPacket.decode(header, decoder);
            case PacketType.ConnAck:
                return ConnAckPacket.decode(header, decoder);
            case PacketType.Publish:
                return PublishPacket.decode(header, decoder);
            case PacketType.PubAck:
                return PubAckPacket.decode(header, decoder);
            case PacketType.PubRec:
                return PubRecPacket.decode(header, decoder);
            case PacketType.PubRel:
                return PubRelPacket.decode(header, decoder);
            case PacketType.PubComp:
                return PubCompPacket.decode(header, decoder);
            case PacketType.Subscribe:
                return SubscribePacket.decode(header, decoder);
            case PacketType.SubACK:
                return SubAckPacket.decode(header, decoder);
            case PacketType.Unsubscribe:
                return UnsubscribePacket.decode(header, decoder);
            case PacketType.UnsubAck:
                return UnsubAckPacket.decode(header, decoder);
            case PacketType.PingReq:
                return PingReqPacket.decode(header, decoder);
            case PacketType.PingResp:
                return PingRespPacket.decode(header, decoder);
            case PacketType.Disconnect:
                return DisconnectPacket.decode(header, decoder);
            default:
                throw new Error(`unimplemented packet-type: ${header.type}`);
        }
    },
} as const;
