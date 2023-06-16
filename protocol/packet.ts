import { ConnectPacket } from "./packet/connect.ts";
import { ConnAckPacket } from "./packet/conack.ts";
import { PublishPacket } from "./packet/publish.ts";
import { PubAckPacket } from "./packet/puback.ts";
import { PubRecPacket } from "./packet/pubrec.ts";
import { PubRelPacket } from "./packet/pubrel.ts";
import { PubCompPacket } from "./packet/pubcomp.ts";
import { SubscribePacket } from "./packet/subscribe.ts";
import { SubAckPacket } from "./packet/suback.ts";
import { UnsubscribePacket } from "./packet/unsubscribe.ts";
import { PingReqPacket } from "./packet/pingreq.ts";
import { PingRespPacket } from "./packet/pingresp.ts";
import { DisconnectPacket } from "./packet/disconnect.ts";
import { UnsubAckPacket } from "./packet/unsuback.ts";


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

export const isPacketType =
    (value: number): value is PacketType =>
        value >= PacketType.Connect &&
        value <= PacketType.Disconnect;

export enum QualityOfService {
    atMostOnce,
    atLeastOnce,
    exactlyOnce,
}

export const isQualityOfService =
    (value: number): value is QualityOfService =>
        value >= QualityOfService.atMostOnce &&
        value <= QualityOfService.exactlyOnce;

export interface Message {
    // header
    readonly qos: QualityOfService;
    readonly retain: boolean;

    // payload
    readonly topic: string;
    readonly payload: Uint8Array;
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
