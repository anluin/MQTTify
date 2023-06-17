import { Message, PacketType } from "../packet.ts";
import { RawPacket } from "../raw_packet.ts";
import { RawPayload } from "../raw_payload.ts";
import { Uint16, Uint8 } from "../../utils/intdef.ts";


export interface PublishPacket extends Message {
    type: PacketType.Publish;

    dup: boolean;
    id: number;
}

export const PublishPacket = {
    encode(packet: PublishPacket): RawPacket {
        const payload = new RawPayload();

        payload.writeString(packet.topic);

        if ((packet.qos ?? 0) > 0) {
            payload.writeUint16(packet.id as Uint16);
        }

        payload.writeUint8(...packet.payload as unknown as Uint8[]);

        return {
            header: {
                type: PacketType.Publish,
                flags: {
                    dup: packet.dup,
                    qos: packet.qos ?? 0,
                    retain: packet.retain ?? false,
                },
            },
            payload,
        };
    },
    decode(rawPacket: RawPacket): PublishPacket {
        if (rawPacket.header?.type !== PacketType.Publish)
            throw new Error(`unexpected packet-type: ${rawPacket.header?.type}`);

        const topic = rawPacket.payload.readString();
        const id = (
            rawPacket.header.flags!.qos > 0
                ? rawPacket.payload.readUint16()
                : 0 as Uint16
        );

        const payload = Uint8Array.from(
            rawPacket.payload.readRest(),
        );

        return {
            type: PacketType.Publish,
            ...rawPacket.header.flags!,
            id,
            topic,
            payload,
        };
    },
} as const;
