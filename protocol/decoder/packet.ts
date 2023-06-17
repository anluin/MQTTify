import { Packet } from "../packet.ts";
import { RawPacketDecoder } from "./raw_packet.ts";


export interface PacketDecoderOptions {
    fatal: boolean,
}

export interface PacketDecodeOptions {
    stream: boolean,
}

export class PacketDecoder {
    private readonly rawPacketDecoder: RawPacketDecoder;

    constructor(options?: PacketDecoderOptions) {
        this.rawPacketDecoder = new RawPacketDecoder(options);
    }

    get fatal() {
        return this.rawPacketDecoder.fatal;
    }

    decode<Stream extends boolean = false>(input: BufferSource, options?: PacketDecodeOptions) {
        return (
            this.rawPacketDecoder
                .decode(input, options)
                ?.map(Packet.decode)
        );
    }
}
