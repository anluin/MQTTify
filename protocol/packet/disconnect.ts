import { PacketType } from "../packet.ts";


export interface DisconnectPacket {
    // header
    readonly type: PacketType.Disconnect;
}
