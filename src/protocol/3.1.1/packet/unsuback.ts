import { PacketType, RawPacket, RawPayload } from "../packet.ts";
import { Uint16 } from "../../../utils/intdef.ts";


export type UnsubAckPacket = {
    type: PacketType.UnsubAck,
    id: Uint16,
};

export const UnsubAckPacket = {
    encode(packet: UnsubAckPacket): RawPacket {
        const payload = new RawPayload();

        payload.writeUint16(packet.id);

        return {
            header: {
                type: packet.type,
            },
            payload,
        };
    },
    decode(rawPacket: RawPacket): UnsubAckPacket {
        if (rawPacket.header?.type !== PacketType.UnsubAck)
            throw new Error(`unexpected packet-type: ${rawPacket.header?.type}`);

        return {
            type: PacketType.UnsubAck,
            id: rawPacket.payload.readUint16(),
        };
    },
} as const;
