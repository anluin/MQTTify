import { PacketType } from "../packet.ts";
import { RawPacket } from "../raw_packet.ts";
import { RawPayload } from "../raw_payload.ts";
import { Uint16 } from "../../utils/intdef.ts";


export interface UnsubAckPacket {
    type: PacketType.UnsubAck;

    id: number;
}

export const UnsubAckPacket = {
    encode(packet: UnsubAckPacket): RawPacket {
        const payload = new RawPayload();

        payload.writeUint16(packet.id as Uint16);

        return {
            header: {
                type: PacketType.UnsubAck,
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
