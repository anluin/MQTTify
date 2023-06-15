import { PacketType, RawPacket, RawPayload } from "../packet.ts";
import { Uint16 } from "../../../utils/intdef.ts";


export type PubAckPacket = {
    type: PacketType.PubAck,
    id: Uint16,
};

export const PubAckPacket = {
    encode(packet: PubAckPacket): RawPacket {
        const payload = new RawPayload();

        payload.writeUint16(packet.id);

        return {
            header: {
                type: packet.type,
            },
            payload,
        };
    },
    decode(rawPacket: RawPacket): PubAckPacket {
        if (rawPacket.header?.type !== PacketType.PubAck)
            throw new Error(`unexpected packet-type: ${rawPacket.header?.type}`);

        return {
            type: PacketType.PubAck,
            id: rawPacket.payload.readUint16(),
        };
    },
} as const;
