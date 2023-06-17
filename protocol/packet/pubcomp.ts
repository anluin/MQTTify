import { PacketType } from "../packet.ts";
import { RawPacket } from "../raw_packet.ts";
import { RawPayload } from "../raw_payload.ts";
import { Uint16 } from "../../utils/intdef.ts";


export interface PubCompPacket {
    type: PacketType.PubComp;

    id: number;
}

export const PubCompPacket = {
    encode(packet: PubCompPacket): RawPacket {
        const payload = new RawPayload();

        payload.writeUint16(packet.id as Uint16);

        return {
            header: {
                type: packet.type,
            },
            payload,
        };
    },
    decode(rawPacket: RawPacket): PubCompPacket {
        if (rawPacket.header?.type !== PacketType.PubComp)
            throw new Error(`unexpected packet-type: ${rawPacket.header?.type}`);

        return {
            type: PacketType.PubComp,
            id: rawPacket.payload.readUint16(),
        };
    },
} as const;
