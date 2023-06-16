import { PacketType } from "../packet.ts";


export enum ConnAckReturnCode {
    ConnectionAccepted = 0,
    UnacceptableProtocolVersion = 1,
    ClientIdentifierRejected = 2,
    ServerUnavailable = 3,
    BadUsernameOrPassword = 4,
    NotAuthorized = 5,
}

export const isConnAckReturnCode =
    (value: number): value is ConnAckReturnCode =>
        value >= ConnAckReturnCode.ConnectionAccepted
        && value <= ConnAckReturnCode.NotAuthorized;

export interface ConnAckPacket {
    // header
    readonly type: PacketType.ConnAck,
    readonly sessionPresent: boolean,

    // payload
    readonly returnCode: ConnAckReturnCode,
}

