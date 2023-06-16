import { PacketType } from "../packet.ts";


export interface PubCompPacket {
    // header
    readonly type: PacketType.PubComp;

    // payload
    readonly id: number;
}
