import { RawPacket } from "../raw_packet.ts";
import { VarInt } from "../../utils/intdef.ts";


export class RawPacketEncoder {
    encode(rawPacket: RawPacket): Uint8Array {
        return Uint8Array.from([
            (rawPacket.header.type << 4) |
            (rawPacket.header.flags?.dup ? 2 ** 3 : 0) |
            (((rawPacket.header.flags?.qos ?? 0) & 2) ? 2 ** 2 : 0) |
            (((rawPacket.header.flags?.qos ?? 0) & 1) ? 2 ** 1 : 0) |
            (rawPacket.header.flags?.retain ? 2 ** 0 : 0),
            ...VarInt.encode(rawPacket.payload.bytes.length),
            ...rawPacket.payload.bytes,
        ]);
    }
}
