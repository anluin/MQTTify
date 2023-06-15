import { PacketType, RawPacket, RawPayload } from "../packet.ts";
import { Uint16 } from "../../../utils/intdef.ts";


export type PubRecPacket = {
    type: PacketType.PubRec,
    id: Uint16,
};

export const PubRecPacket = {
    encode(packet: PubRecPacket): RawPacket {
        const payload = new RawPayload();

        payload.writeUint16(packet.id);

        return {
            header: {
                type: packet.type,
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
