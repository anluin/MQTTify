import { PacketType } from "../packet.ts";


export interface PingRespPacket {
    // header
    readonly type: PacketType.PingResp;
}
