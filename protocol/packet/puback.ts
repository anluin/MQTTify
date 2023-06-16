import { PacketType } from "../packet.ts";


export interface PubAckPacket {
    // header
    readonly type: PacketType.PubAck;

    // payload
    readonly id: number;
}
