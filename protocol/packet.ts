import {
    ConnAckPacket,
    ConnectPacket,
    DisconnectPacket,
    PingReqPacket,
    PingRespPacket,
    PubAckPacket,
    PubCompPacket,
    PublishPacket,
    PubRecPacket,
    PubRelPacket,
    SubAckPacket,
    SubscribePacket,
    UnsubAckPacket,
    UnsubscribePacket
} from "./packet/mod.ts";
import { RawPacket } from "./raw_packet.ts";
import { InvalidPacket, InvalidPacketType } from "./error/invalid_packet.ts";


export enum PacketType {
    Connect = 1,
    ConnAck,
    Publish,
    PubAck,
    PubRec,
    PubRel,
    PubComp,
    Subscribe,
    SubAck,
    Unsubscribe,
    UnsubAck,
    PingReq,
    PingResp,
    Disconnect,
}

export type Packet
    = ConnectPacket
    | ConnAckPacket
    | PublishPacket
    | PubAckPacket
    | PubRecPacket
    | PubRelPacket
    | PubCompPacket
    | SubscribePacket
    | SubAckPacket
    | UnsubscribePacket
    | UnsubAckPacket
    | PingReqPacket
    | PingRespPacket
    | DisconnectPacket;

export enum ConnAckReturnCode {
    ConnectionAccepted = 0,
    UnacceptableProtocolVersion,
    ClientIdentifierRejected,
    ServerUnavailable,
    BadUsernameOrPassword,
    NotAuthorized,
}

export enum SubAckReturnCode {
    SuccessMaximumQoS_0 = 0x00,
    SuccessMaximumQoS_1 = 0x01,
    SuccessMaximumQoS_2 = 0x02,
    Failure = 0x80,
}

export enum QualityOfService {
    atMostOnce,
    atLeastOnce,
    exactlyOnce,
}

export interface Message {
    readonly qos: QualityOfService;
    readonly retain: boolean;
    readonly topic: string;
    readonly payload: Uint8Array;
}

export interface Subscription {
    topic: string,
    qos: QualityOfService,
}

export type ProtocolName = "MQTT";

export type ProtocolLevel
    = 4  // v3.1.1
 // | 5  // v5.0   // TODO: Support MQTT 5.0

export interface Protocol {
    name: "MQTT",
    level: ProtocolLevel,
}

export const isSupportedProtocolLevel =
    (value: number): value is ProtocolLevel =>
        value === 4 ||
        value === 5;

export const isQualityOfService =
    (value: number): value is QualityOfService =>
        value >= QualityOfService.atMostOnce &&
        value <= QualityOfService.exactlyOnce;

export const isPacketType =
    (value: number): value is PacketType =>
        value >= PacketType.Connect &&
        value <= PacketType.Disconnect;

export const isConnAckReturnCode =
    (value: number): value is ConnAckReturnCode =>
        value >= ConnAckReturnCode.ConnectionAccepted &&
        value <= ConnAckReturnCode.NotAuthorized;

export const isSubAckReturnCode =
    (value: number): value is ConnAckReturnCode =>
        (
            value >= SubAckReturnCode.SuccessMaximumQoS_0 &&
            value <= SubAckReturnCode.SuccessMaximumQoS_2
        ) || (
            value == SubAckReturnCode.Failure
        );

export const Packet = {
    encode: (packet: Packet): RawPacket => {
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
            case PacketType.SubAck:
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

        throw new InvalidPacket(`invalid packet`);
    },
    decode: (packet: RawPacket): Packet => {
        switch (packet.header.type) {
            case PacketType.Connect:
                return ConnectPacket.decode(packet);
            case PacketType.ConnAck:
                return ConnAckPacket.decode(packet);
            case PacketType.Publish:
                return PublishPacket.decode(packet);
            case PacketType.PubAck:
                return PubAckPacket.decode(packet);
            case PacketType.PubRec:
                return PubRecPacket.decode(packet);
            case PacketType.PubRel:
                return PubRelPacket.decode(packet);
            case PacketType.PubComp:
                return PubCompPacket.decode(packet);
            case PacketType.Subscribe:
                return SubscribePacket.decode(packet);
            case PacketType.SubAck:
                return SubAckPacket.decode(packet);
            case PacketType.Unsubscribe:
                return UnsubscribePacket.decode(packet);
            case PacketType.UnsubAck:
                return UnsubAckPacket.decode(packet);
            case PacketType.PingReq:
                return PingReqPacket.decode(packet);
            case PacketType.PingResp:
                return PingRespPacket.decode(packet);
            case PacketType.Disconnect:
                return DisconnectPacket.decode(packet);
        }

        throw new InvalidPacketType(`invalid packet type (${packet.header.type})`);
    },
} as const;
