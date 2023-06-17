import { PacketType } from "../packet.ts";
import { RawPacket } from "../raw_packet.ts";
import { RawPayload } from "../raw_payload.ts";
import { Uint16 } from "../../utils/intdef.ts";


export interface UnsubscribePacket {
    type: PacketType.Unsubscribe;

    id: number;
    topics: string[];
}

export const UnsubscribePacket = {
    encode(packet: UnsubscribePacket): RawPacket {
        const payload = new RawPayload();

        payload.writeUint16(packet.id as Uint16);

        for (const topic of packet.topics) {
            payload.writeString(topic);
        }

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
    decode(rawPacket: RawPacket): UnsubscribePacket {
        if (rawPacket.header?.type !== PacketType.Unsubscribe)
            throw new Error(`unexpected packet-type: ${rawPacket.header?.type}`);

        const id = rawPacket.payload.readUint16();
        const topics: string[] = [];

        while (rawPacket.payload.numRemainingBytes > 0) {
            topics.push(rawPacket.payload.readString());
        }

        return {
            type: PacketType.Unsubscribe,
            id,
            topics,
        };
    },
} as const;
