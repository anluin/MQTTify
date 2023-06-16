import { PacketType } from "../packet.ts";


export interface PingReqPacket {
    // header
    readonly type: PacketType.PingReq;
}
