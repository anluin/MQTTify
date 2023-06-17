import { PacketType } from "../packet.ts";
import { RawPacket } from "../raw_packet.ts";
import { RawPayload } from "../raw_payload.ts";


export interface PingRespPacket {
    type: PacketType.PingResp;
}

export const PingRespPacket = {
    encode(packet: PingRespPacket): RawPacket {
        const payload = new RawPayload();

        return {
            header: {
                type: PacketType.PingResp,
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
