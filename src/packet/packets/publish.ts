import { encoder, JSONValue, Message, PacketHeader, PacketType, Payload } from "../mod.ts";
import { PacketDecoder, textDecoder } from "../decoder.ts";
import { textEncoder } from "../encoder.ts";


export type PublishPacket = {
    type: PacketType.Publish,
    id: number;
    dup: boolean;
    message: Message,
};

const fix = (value: JSONValue): JSONValue => {
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(value)) {
        return new Date(value);
    }

    if (typeof value === "object" && value !== null) {
        return Object.fromEntries(
            Object.entries(value)
                .map(([ key, value ]) => [ key, fix(value) ]),
        );
    }

    return value;
};

export const PublishPacket = {
    encode: (packet: PublishPacket): Uint8Array => {
        encoder
            .header({
                type: PacketType.Publish,
                flags: {
                    dup: packet.dup,
                    qos: packet.message.qos ?? 0,
                    retain: packet.message.retain ?? false,
                },
            })
            .payload(encoder => {
                encoder.string(packet.message.topic);

                if ((packet.message.qos ?? 0) > 0) {
                    encoder.uint16(packet.id);
                }

                encoder.uint8(...(
                    packet.message.payload instanceof Uint8Array
                        ? packet.message.payload
                        : textEncoder.encode(
                            typeof packet.message.payload === "string"
                                ? packet.message.payload
                                : JSON.stringify(packet.message.payload))
                ));
            });

        return encoder.unwrap();
    },
    decode: (header: PacketHeader, decoder: PacketDecoder): PublishPacket => {
        const topic = decoder.string();
        const id = header.flags!.qos > 0 ? decoder.uint16() : 0;
        const {
            dup,
            ...rest
        } = header.flags!;

        const rawPayload = decoder.rest();

        let payload: Payload | undefined = undefined;

        if (rawPayload.length > 0) {
            payload = rawPayload;

            try {
                const temp = textDecoder.decode(payload);

                if (/^[^\x00-\x1F\x80-\x9F]+$/.test(temp)) {
                    payload = fix(JSON.parse(payload = temp));
                }
            } catch (_error) {
                // ignore error
            }
        }

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
