import { encoder, PacketHeader, PacketType, ReturnCode } from "../mod.ts";
import { PacketDecoder } from "../decoder.ts";


export type ConnAckPacket = {
    type: PacketType.ConnAck,
    sessionPresent: boolean;
    returnCode: ReturnCode;
};

export const ConnAckPacket = {
    encode: (packet: ConnAckPacket): Uint8Array => (
        encoder
            .header({
                type: PacketType.ConnAck,
            })
            .payload(encoder => (
                encoder
                    .uint8(packet.sessionPresent ? 1 : 0)
                    .uint8(packet.returnCode)
            ))
            .unwrap()
    ),
    decode: (_header: PacketHeader, decoder: PacketDecoder): ConnAckPacket => ({
        type: PacketType.ConnAck,
        sessionPresent: !!(decoder.uint8() & 1),
        returnCode: decoder.uint8(),
    }),
} as const;
