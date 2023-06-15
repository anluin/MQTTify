import { Packet, PacketType, RawPacket } from "./packet.ts";
import { VarInt } from "../../utils/intdef.ts";

import { ConnectPacket } from "./packet/connect.ts";
import { ConnAckPacket } from "./packet/connack.ts";
import { PublishPacket } from "./packet/publish.ts";
import { PubRecPacket } from "./packet/pubrec.ts";
import { PubRelPacket } from "./packet/pubrel.ts";
import { PubCompPacket } from "./packet/pubcomp.ts";
import { PubAckPacket } from "./packet/puback.ts";
import { SubscribePacket } from "./packet/subscribe.ts";
import { SubAckPacket } from "./packet/suback.ts";
import { UnsubscribePacket } from "./packet/unsubscribe.ts";
import { UnsubAckPacket } from "./packet/unsuback.ts";
import { PingReqPacket } from "./packet/pingreq.ts";
import { PingRespPacket } from "./packet/pingresp.ts";
import { DisconnectPacket } from "./packet/disconnect.ts";


export class RawPacketEncoder {
    encode(rawPacket: RawPacket): Uint8Array {
        return Uint8Array.from([
            (rawPacket.header.type << 4) |
            (rawPacket.header.flags?.dup ? 2 ** 3 : 0) |
            (((rawPacket.header.flags?.qos ?? 0) & 2) ? 2 ** 2 : 0) |
            (((rawPacket.header.flags?.qos ?? 0) & 1) ? 2 ** 1 : 0) |
            (rawPacket.header.flags?.retain ? 2 ** 0 : 0),
            ...VarInt.encode(rawPacket.payload.bytes.length),
            ...rawPacket.payload.bytes,
        ]);
    }
}

export class PacketEncoder {
    private readonly encoder = new RawPacketEncoder();

    encode(packet: Packet): Uint8Array {
        return this.encoder.encode(this.#encode(packet));
    }

    #encode(packet: Packet): RawPacket {
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
    }
}

export class PacketEncodeTransformer implements Transformer<Packet, Uint8Array> {
    private readonly encoder = new PacketEncoder();

    transform(packet: Packet, controller: TransformStreamDefaultController<Uint8Array>) {
        controller.enqueue(this.encoder.encode(packet));
    }
}

export class PacketEncodeStream extends TransformStream<Packet, Uint8Array> {
    constructor() {
        super(new PacketEncodeTransformer());
    }
}

