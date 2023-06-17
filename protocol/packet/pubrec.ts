import { PacketType } from "../packet.ts";
import { RawPacket } from "../raw_packet.ts";
import { RawPayload } from "../raw_payload.ts";
import { Uint16 } from "../../utils/intdef.ts";


export interface PubRecPacket {
    type: PacketType.PubRec;

    id: number;
}

export const PubRecPacket = {
    encode(packet: PubRecPacket): RawPacket {
        const payload = new RawPayload();

        payload.writeUint16(packet.id as Uint16);

        return {
            header: {
                type: PacketType.PubRec,
            },
            payload,
        };
    },
    decode(rawPacket: RawPacket): PubRecPacket {
        if (rawPacket.header?.type !== PacketType.PubRec)
            throw new Error(`unexpected packet-type: ${rawPacket.header?.type}`);

        return {
            type: PacketType.PubRec,
            id: rawPacket.payload.readUint16(),
        };
    },
} as const;
