import { PacketType, RawPacket, RawPayload } from "../packet.ts";
import { Uint16 } from "../../../utils/intdef.ts";


export type PubCompPacket = {
    type: PacketType.PubComp,
    id: Uint16,
};

export const PubCompPacket = {
    encode(packet: PubCompPacket): RawPacket {
        const payload = new RawPayload();

        payload.writeUint16(packet.id);

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
