import { PacketType } from "../packet.ts";
import { RawPacket } from "../raw_packet.ts";
import { RawPayload } from "../raw_payload.ts";
import { Uint16 } from "../../utils/intdef.ts";


export interface PubAckPacket {
    type: PacketType.PubAck;

    id: number;
}

export const PubAckPacket = {
    encode(packet: PubAckPacket): RawPacket {
        const payload = new RawPayload();

        payload.writeUint16(packet.id as Uint16);

        return {
            header: {
                type: PacketType.PubAck,
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
