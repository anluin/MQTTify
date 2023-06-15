import { isQualityOfService, Message, PacketType, RawPacket, RawPayload } from "../packet.ts";
import { Uint16, Uint8 } from "../../../utils/intdef.ts";


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
    encode(packet: ConnectPacket): RawPacket {
        const payload = new RawPayload();

        payload
            .writeString("MQTT")
            .writeUint8(4 as Uint8)
            .writeUint8((
                (packet.username ? 2 ** 7 : 0) |
                (packet.password ? 2 ** 6 : 0) |
                (packet.will?.retain ? 2 ** 5 : 0) |
                (((packet.will?.qos ?? 0) & 2) ? 4 ** 7 : 0) |
                (((packet.will?.qos ?? 0) & 1) ? 3 ** 7 : 0) |
                (packet.will ? 2 ** 2 : 0) |
                (packet.cleanSession ? 2 ** 1 : 0)
            ) as Uint8)
            .writeUint16(packet.keepAlive as Uint16)
            .writeString(packet.clientId);


        if (packet.will) {
            payload.writeString(packet.will.topic);
            payload.writeByteArray(packet.will.payload);
        }

        if (packet.username) {
            payload.writeString(packet.username);
        }

        if (packet.password) {
            payload.writeString(packet.password);
        }

        return {
            header: {
                type: packet.type,
            },
            payload,
        };
    },
    decode(rawPacket: RawPacket): ConnectPacket {
        if (rawPacket.header?.type !== PacketType.Connect)
            throw new Error(`unexpected packet-type: ${rawPacket.header?.type}`);

        const protocolName = rawPacket.payload!.readString();

        if (protocolName !== "MQTT")
            throw new Error(`unsupported protocol: ${protocolName})`);

        const protocolLevel = rawPacket.payload!.readUint8();

        if (protocolLevel !== 4)
            throw new Error(`unsupported protocol-level: ${protocolLevel})`);

        const flags = rawPacket.payload!.readUint8();
        const usernameFlag = !!(flags & 2 ** 7);
        const passwordFlag = !!(flags & 2 ** 6);
        const cleanSessionFlag = !!(flags & 2);
        const willFlag = (flags & 4);
        const willRetainFlag = willFlag ? !!(flags & 2 ** 5) : false;
        const willQosFlag = willFlag ? (flags & (16 + 8)) >> 3 : 0;

        if (!isQualityOfService(willQosFlag)) {
            throw new Error("invalid will-qos");
        }

        return {
            type: rawPacket.header.type,
            keepAlive: rawPacket.payload!.readUint16(),
            clientId: rawPacket.payload!.readString(),
            cleanSession: cleanSessionFlag,
            will: willFlag ? {
                topic: rawPacket.payload!.readString(),
                payload: Uint8Array.from(rawPacket.payload!.readByteArray()),
                retain: willRetainFlag,
                qos: willQosFlag,
            } : undefined,
            username: usernameFlag ? rawPacket.payload!.readString() : undefined,
            password: passwordFlag ? rawPacket.payload!.readString() : undefined,
        };
    },
} as const;
