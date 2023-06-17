import { PacketType } from "../packet.ts";
import { RawPacket } from "../raw_packet.ts";
import { RawPayload } from "../raw_payload.ts";


export interface PingReqPacket {
    type: PacketType.PingReq;
}

export const PingReqPacket = {
    encode(packet: PingReqPacket): RawPacket {
        const payload = new RawPayload();

        return {
            header: {
                type: PacketType.PingReq,
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
