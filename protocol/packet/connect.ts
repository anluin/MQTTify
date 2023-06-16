import { Message, PacketType } from "../packet.ts";


export interface ConnectPacket {
    // header
    readonly type: PacketType.Connect,

    // payload
    readonly cleanSession: boolean,
    readonly clientId: string,
    readonly keepAlive: number,
    readonly username?: string,
    readonly password?: string,
    readonly will?: Message,
}
