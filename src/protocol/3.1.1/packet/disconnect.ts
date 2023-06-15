import { PacketType, RawPacket, RawPayload } from "../packet.ts";


export type DisconnectPacket = {
    type: PacketType.Disconnect,
};

export const DisconnectPacket = {
    encode(packet: DisconnectPacket): RawPacket {
        const payload = new RawPayload();

        return {
            header: {
                type: packet.type,
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
