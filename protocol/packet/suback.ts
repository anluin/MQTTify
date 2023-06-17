import { PacketType, SubAckReturnCode } from "../packet.ts";
import { RawPacket } from "../raw_packet.ts";
import { RawPayload } from "../raw_payload.ts";
import { Uint16, Uint8 } from "../../utils/intdef.ts";


export interface SubAckPacket {
    type: PacketType.SubAck;

    id: number,
    returnCodes: SubAckReturnCode[],
}

export const SubAckPacket = {
    encode(packet: SubAckPacket): RawPacket {
        const payload = new RawPayload();

        payload.writeUint16(packet.id as Uint16);

        for (const returnCode of packet.returnCodes) {
            payload.writeUint8(returnCode as Uint8);
        }

        return {
            header: {
                type: PacketType.SubAck,
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
