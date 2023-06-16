import { PacketType } from "../packet.ts";


export interface PubRecPacket {
    // header
    readonly type: PacketType.PubRec;

    // payload
    readonly id: number;
}
