import { PacketType } from "../packet.ts";


export interface UnsubAckPacket {
    // header
    readonly type: PacketType.UnsubAck;

    // payload
    readonly id: number;
}
