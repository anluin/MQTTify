import { PacketType, QualityOfService } from "../packet.ts";


export type Subscription = {
    topic: string,
    qos: QualityOfService,
};

export interface SubscribePacket {
    // header
    readonly type: PacketType.Subscribe;

    // payload
    readonly id: number;
    readonly subscriptions: Subscription[];
}
