import { PacketType, RawPacket, RawPayload } from "../packet.ts";


export type PingRespPacket = {
    type: PacketType.PingResp,
};

export const PingRespPacket = {
    encode(packet: PingRespPacket): RawPacket {
        const payload = new RawPayload();

        return {
            header: {
                type: packet.type,
            },
            payload,
        };
    },
    decode(rawPacket: RawPacket): PingRespPacket {
        if (rawPacket.header?.type !== PacketType.PingResp)
            throw new Error(`unexpected packet-type: ${rawPacket.header?.type}`);

        return {
            type: PacketType.PingResp,
        };
    },
} as const;
