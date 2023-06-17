import { Packet } from "../../protocol/packet.ts";
import { PacketDecoder, PacketDecoderOptions } from "../../protocol/decoder/packet.ts";


export class PacketDecoderTransformer implements Transformer<Uint8Array, Packet> {
    private readonly decoder: PacketDecoder;

    constructor(options?: PacketDecoderOptions) {
        this.decoder = new PacketDecoder(options);
    }

    transform(chunk: Uint8Array, controller: TransformStreamDefaultController<Packet>) {
        for (const packet of this.decoder.decode(chunk, { stream: true })) {
            controller.enqueue(packet);
        }
    }
}

export class PacketDecoderStream extends TransformStream<Uint8Array, Packet> {
    constructor(options?: PacketDecoderOptions, writableStrategy?: QueuingStrategy<Uint8Array>, readableStrategy?: QueuingStrategy<Packet>) {
        super(
            new PacketDecoderTransformer(options),
            writableStrategy,
            readableStrategy,
        );
    }
}
