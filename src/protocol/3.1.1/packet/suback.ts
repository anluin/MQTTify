import { PacketType, RawPacket, RawPayload } from "../packet.ts";
import { Uint16, Uint8 } from "../../../utils/intdef.ts";

export enum SubAckReturnCode {
    SuccessMaximumQoS_0 = 0x00,
    SuccessMaximumQoS_1 = 0x01,
    SuccessMaximumQoS_2 = 0x02,
    Failure = 0x80,
}

export type SubAckPacket = {
    type: PacketType.SubAck,
    id: Uint16,
    returnCodes: SubAckReturnCode[],
};

export const SubAckPacket = {
    encode(packet: SubAckPacket): RawPacket {
        const payload = new RawPayload();

        payload.writeUint16(packet.id);

        for (const returnCode of packet.returnCodes) {
            payload.writeUint8(returnCode as Uint8);
        }

        return {
            header: {
                type: packet.type,
                flags: {
                    dup: false,
                    qos: 1,
                    retain: false,
                },
            },
            payload,
        };
    },
    decode(rawPacket: RawPacket): SubAckPacket {
        if (rawPacket.header?.type !== PacketType.SubAck)
            throw new Error(`unexpected packet-type: ${rawPacket.header?.type}`);

        const id = rawPacket.payload.readUint16();
        const returnCodes: SubAckReturnCode[] = [];

        while (rawPacket.payload.numRemainingBytes > 0) {
            returnCodes.push(rawPacket.payload.readUint8());
        }

        return {
            type: PacketType.SubAck,
            id,
            returnCodes,
        };
    },
} as const;
