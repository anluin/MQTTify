import { Message, PacketType } from "../packet.ts";


export interface PublishPacket extends Message {
    // header
    readonly type: PacketType.Publish;
    readonly dup: boolean;

    // payload
    readonly id: number;
}
