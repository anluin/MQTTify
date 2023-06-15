import { PacketType, RawPacket, RawPayload } from "../packet.ts";


export type PingReqPacket = {
    type: PacketType.PingReq,
};

export const PingReqPacket = {
    encode(packet: PingReqPacket): RawPacket {
        const payload = new RawPayload();

        return {
            header: {
                type: packet.type,
            },
            payload,
        };
    },
    decode(rawPacket: RawPacket): PingReqPacket {
        if (rawPacket.header?.type !== PacketType.PingReq)
            throw new Error(`unexpected packet-type: ${rawPacket.header?.type}`);

        return {
            type: PacketType.PingReq,
        };
    },
} as const;
