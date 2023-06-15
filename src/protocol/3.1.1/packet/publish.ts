import { Message, PacketType, RawPacket, RawPayload } from "../packet.ts";
import { Uint16, Uint8 } from "../../../utils/intdef.ts";


export type PublishPacket = {
    type: PacketType.Publish,
    id: Uint16;
    dup: boolean;
    message: Message,
};

export const PublishPacket = {
    encode(packet: PublishPacket): RawPacket {
        const payload = new RawPayload();

        payload.writeString(packet.message.topic);

        if ((packet.message.qos ?? 0) > 0) {
            payload.writeUint16(packet.id);
        }

        payload.writeUint8(...packet.message.payload as unknown as Uint8[]);

        return {
            header: {
                type: packet.type,
                flags: {
                    dup: packet.dup,
                    qos: packet.message.qos ?? 0,
                    retain: packet.message.retain ?? false,
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

        const {
            dup,
            ...rest
        } = rawPacket.header.flags!;

        const payload = Uint8Array.from(rawPacket.payload.readRest());

        return {
            type: PacketType.Publish,
            dup,
            id,
            message: {
                ...rest,
                topic,
                payload,
            },
        };
    },
} as const;
