import { PacketType, QualityOfService, RawPacket, RawPayload } from "../packet.ts";
import { Uint16, Uint8 } from "../../../utils/intdef.ts";


export type Subscription = {
    topic: string,
    qos: QualityOfService,
};

export type SubscribePacket = {
    type: PacketType.Subscribe,
    id: Uint16,
    subscriptions: Subscription[],
};

export const SubscribePacket = {
    encode(packet: SubscribePacket): RawPacket {
        const payload = new RawPayload();

        payload.writeUint16(packet.id);

        for (const subscription of packet.subscriptions) {
            payload.writeString(subscription.topic);
            payload.writeUint8(subscription.qos as Uint8);
        }

        return {
            header: {
                type: packet.type,
                flags: {
                    dup: false,
                    qos: 1,
                    retain: false,
                },
            },
            payload,
        };
    },
    decode(rawPacket: RawPacket): SubscribePacket {
        if (rawPacket.header?.type !== PacketType.Subscribe)
            throw new Error(`unexpected packet-type: ${rawPacket.header?.type}`);

        const id = rawPacket.payload.readUint16();
        const subscriptions: Subscription[] = [];

        while (rawPacket.payload.numRemainingBytes > 0) {
            subscriptions.push(<Subscription>{
                topic: rawPacket.payload.readString(),
                qos: rawPacket.payload.readUint8(),
            });
        }

        return {
            type: PacketType.Subscribe,
            id,
            subscriptions,
        };
    },
} as const;
