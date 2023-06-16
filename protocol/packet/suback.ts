import { PacketType } from "../packet.ts";


export enum SubAckReturnCode {
    SuccessMaximumQoS_0 = 0x00,
    SuccessMaximumQoS_1 = 0x01,
    SuccessMaximumQoS_2 = 0x02,
    Failure = 0x80,
}

export interface SubAckPacket {
    // header
    readonly type: PacketType.SubAck;

    // payload
    id: number,
    returnCodes: SubAckReturnCode[],
}
