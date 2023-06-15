import { PacketType, RawPacket, RawPayload } from "../packet.ts";
import { Uint16 } from "../../../utils/intdef.ts";


export type PubRelPacket = {
    type: PacketType.PubRel,
    id: Uint16,
};

export const PubRelPacket = {
    encode(packet: PubRelPacket): RawPacket {
        const payload = new RawPayload();

        payload.writeUint16(packet.id);

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
    decode(rawPacket: RawPacket): PubRelPacket {
        if (rawPacket.header?.type !== PacketType.PubRel)
            throw new Error(`unexpected packet-type: ${rawPacket.header?.type}`);

        return {
            type: PacketType.PubRel,
            id: rawPacket.payload.readUint16(),
        };
    },
} as const;
