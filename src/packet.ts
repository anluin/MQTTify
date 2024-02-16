export type MqttPublishPacketId = number & { readonly __tag: unique symbol };
export type MqttSubscribePacketId = number & { readonly __tag: unique symbol };
export type MqttUnsubscribePacketId = number & {
    readonly __tag: unique symbol;
};

export type MqttPacketId =
    | MqttPublishPacketId
    | MqttSubscribePacketId
    | MqttUnsubscribePacketId;

export const enum MqttPacketType {
    Connect = 0x1,
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

export type MqttProtocol = {
    name: string;
    level: number;
};

export const enum MqttQualityOfService {
    atMostOnce,
    atLeastOnce,
    exactlyOnce,
}

export type MqttCredentials = {
    username: string;
    password: string;
} | {
    username: string;
    password: undefined;
} | {
    username: undefined;
    password: string;
};

export type MqttMessage = {
    topic: string;
    payload: Uint8Array;
    retain: boolean;
    qualityOfService: MqttQualityOfService;
};

export const enum MqttConnAckReturnCode {
    ConnectionAccepted = 0,
    UnacceptableProtocolVersion,
    ClientIdentifierRejected,
    ServerUnavailable,
    BadUsernameOrPassword,
    NotAuthorized,
}

export const enum MqttSubAckReturnCode {
    SuccessMaximumQoS_0 = 0x00,
    SuccessMaximumQoS_1 = 0x01,
    SuccessMaximumQoS_2 = 0x02,
    Failure = 0x80,
}

export type MqttSubscription = {
    topicFilter: string;
    qualityOfService: MqttQualityOfService;
};

export type MqttConnectPacket = {
    type: MqttPacketType.Connect;
    protocol: MqttProtocol;
    cleanSession: boolean;
    keepAlive: number;
    clientId: string;
    lastWillAndTestament?: MqttMessage;
    credentials?: MqttCredentials;
};

export type MqttConnAckPacket = {
    type: MqttPacketType.ConnAck;
    sessionPresent: boolean;
    returnCode: MqttConnAckReturnCode;
};

export type MqttPublishPacket = {
    type: MqttPacketType.Publish;
    id: MqttPublishPacketId;
    duplicate: boolean;
    message: MqttMessage;
};

export type MqttPubAckPacket = {
    type: MqttPacketType.PubAck;
    id: MqttPublishPacketId;
};

export type MqttPubRecPacket = {
    type: MqttPacketType.PubRec;
    id: MqttPublishPacketId;
};

export type MqttPubRelPacket = {
    type: MqttPacketType.PubRel;
    id: MqttPublishPacketId;
};

export type MqttPubCompPacket = {
    type: MqttPacketType.PubComp;
    id: MqttPublishPacketId;
};

export type MqttSubscribePacket = {
    type: MqttPacketType.Subscribe;
    id: MqttSubscribePacketId;
    subscriptions: MqttSubscription[];
};

export type MqttSubAckPacket = {
    type: MqttPacketType.SubAck;
    id: MqttSubscribePacketId;
    returnCodes: MqttSubAckReturnCode[];
};

export type MqttUnsubscribePacket = {
    type: MqttPacketType.Unsubscribe;
    id: MqttUnsubscribePacketId;
    topics: string[];
};

export type MqttUnsubAckPacket = {
    type: MqttPacketType.UnsubAck;
    id: MqttUnsubscribePacketId;
};

export type MqttPingReqPacket = {
    type: MqttPacketType.PingReq;
};

export type MqttPingRespPacket = {
    type: MqttPacketType.PingResp;
};

export type MqttDisconnectPacket = {
    type: MqttPacketType.Disconnect;
};

export type MqttPacket =
    | MqttConnectPacket
    | MqttConnAckPacket
    | MqttPublishPacket
    | MqttPubAckPacket
    | MqttPubRecPacket
    | MqttPubRelPacket
    | MqttPubCompPacket
    | MqttSubscribePacket
    | MqttSubAckPacket
    | MqttUnsubscribePacket
    | MqttUnsubAckPacket
    | MqttPingReqPacket
    | MqttPingRespPacket
    | MqttDisconnectPacket;
