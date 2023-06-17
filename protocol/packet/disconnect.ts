import { PacketType } from "../packet.ts";
import { RawPacket } from "../raw_packet.ts";
import { RawPayload } from "../raw_payload.ts";


export interface DisconnectPacket {
    type: PacketType.Disconnect;
}

export const DisconnectPacket = {
    encode(packet: DisconnectPacket): RawPacket {
        const payload = new RawPayload();

        return {
            header: {
                type: PacketType.Disconnect,
            },
            payload,
        };
    },
    decode(rawPacket: RawPacket): DisconnectPacket {
        if (rawPacket.header?.type !== PacketType.Disconnect)
            throw new Error(`unexpected packet-type: ${rawPacket.header?.type}`);

        return {
            type: PacketType.Disconnect,
        };
    },
} as const;
