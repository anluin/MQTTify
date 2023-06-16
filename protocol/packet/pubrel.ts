import { PacketType } from "../packet.ts";


export interface PubRelPacket {
    // header
    readonly type: PacketType.PubRel;

    // payload
    readonly id: number;
}
