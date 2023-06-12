import { encoder, Message, PacketHeader, PacketType } from "../mod.ts";
import { PacketDecoder } from "../decoder.ts";
import { textEncoder } from "../encoder.ts";


export type ConnectPacket = {
    type: PacketType.Connect,
    clientId: string,
    cleanSession: boolean,
    keepAlive: number,
    will?: Message,
    username?: string,
    password?: string,
};

export const ConnectPacket = {
    encode: (packet: ConnectPacket): Uint8Array => (
        encoder
            .header({
                type: packet.type,
            })
            .payload(encoder => {
                encoder
                    .string("MQTT")
                    .uint8(4)
                    .bits(
                        !!packet.username,
                        !!packet.password,
                        !!packet.will?.retain,
                        !!((packet.will?.qos ?? 0) & 2),
                        !!((packet.will?.qos ?? 0) & 1),
                        !!packet.will,
                        packet.cleanSession,
                        false,
                    )
                    .uint16(packet.keepAlive)
                    .string(packet.clientId);

                if (packet.will) {
                    encoder.string(packet.will.topic);

                    encoder.uint8(...(
                        packet.will.payload instanceof Uint8Array
                            ? packet.will.payload
                            : textEncoder.encode(
                                typeof packet.will.payload === "string"
                                    ? packet.will.payload
                                    : JSON.stringify(packet.will.payload))
                    ));
                }

                if (packet.username) {
                    encoder.string(packet.username);
                }

                if (packet.password) {
                    encoder.string(packet.password);
                }
            })
            .unwrap()
    ),
    decode: (header: PacketHeader, decoder: PacketDecoder): ConnectPacket => {
        const protocol = {
            name: decoder.string(),
            level: decoder.uint8(),
        };

        if (protocol.name !== "MQTT" || protocol.level !== 4) {
            throw new Error(`client requests unsupported protocol: ${protocol.name} (${protocol.level})`);
        }

        const flags = decoder.flags((byte) => {
            const qualityOfService = (byte & (16 + 8)) >> 3;

            if (qualityOfService < 0 || qualityOfService > 2) {
                throw new Error("invalid will qos");
            }

            return {
                username: !!(byte & 2 ** 7),
                password: !!(byte & 2 ** 6),
                cleanSession: !!(byte & 2),
                lastWillAndTestament: (byte & 4) ? {
                    retain: !!(byte & 2 ** 5),
                    qualityOfService,
                } : undefined,
            };
        });

        return {
            type: PacketType.Connect,
            keepAlive: decoder.uint16(),
            clientId: decoder.string(),
            cleanSession: flags.cleanSession,
            will: flags.lastWillAndTestament ? {
                ...flags.lastWillAndTestament,
                topic: decoder.string(),
                payload: decoder.bytes(),
            } : undefined,
            username: flags.username ? decoder.string() : undefined,
            password: flags.password ? decoder.string() : undefined,
        };
    },
} as const;
