import { PacketType } from "../packet.ts";
import { RawPacket } from "../raw_packet.ts";
import { RawPayload } from "../raw_payload.ts";
import { Uint16 } from "../../utils/intdef.ts";


export interface PubRelPacket {
    type: PacketType.PubRel;

    id: number;
}

export const PubRelPacket = {
    encode(packet: PubRelPacket): RawPacket {
        const payload = new RawPayload();

        payload.writeUint16(packet.id as Uint16);

        return {
            header: {
                type: PacketType.PubRel,
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
