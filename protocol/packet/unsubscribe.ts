import { PacketType } from "../packet.ts";


export interface UnsubscribePacket {
    // header
    readonly type: PacketType.Unsubscribe;

    // payload
    readonly id: number;
    readonly topics: string[];
}
