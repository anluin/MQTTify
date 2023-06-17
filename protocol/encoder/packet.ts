import { Packet } from "../packet.ts";
import { RawPacketEncoder } from "./raw_packet.ts";


export class PacketEncoder {
    private readonly rawPacketEncoder = new RawPacketEncoder();

    encode(packet: Packet): Uint8Array {
        return this.rawPacketEncoder.encode(Packet.encode(packet));
    }
}
