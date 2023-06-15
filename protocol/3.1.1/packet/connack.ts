import { PacketType, RawPacket, RawPayload } from "../packet.ts";
import { Uint8 } from "../../../utils/intdef.ts";


export enum ConnAckReturnCode {
    ConnectionAccepted = 0,
    UnacceptableProtocolVersion = 1,
    ClientIdentifierRejected = 2,
    ServerUnavailable = 3,
    BadUsernameOrPassword = 4,
    NotAuthorized = 5,
}

export type ConnAckPacket = {
    type: PacketType.ConnAck,
    sessionPresent: boolean;
    returnCode: ConnAckReturnCode;
};

export const ConnAckPacket = {
    encode(packet: ConnAckPacket): RawPacket {
        const payload = new RawPayload();

        payload.writeUint8((packet.sessionPresent ? 1 : 0) as Uint8);
        payload.writeUint8(packet.returnCode as Uint8);

        return {
            header: {
                type: packet.type,
            },
            payload,
        };
    },
    decode(rawPacket: RawPacket): ConnAckPacket {
        if (rawPacket.header?.type !== PacketType.ConnAck)
            throw new Error(`unexpected packet-type: ${rawPacket.header?.type}`);

        return {
            type: PacketType.ConnAck,
            sessionPresent: !!rawPacket.payload.readUint8(),
            returnCode: rawPacket.payload.readUint8(),
        };
    },
} as const;
