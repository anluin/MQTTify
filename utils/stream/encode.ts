import { Packet } from "../../protocol/packet.ts";
import { PacketEncoder } from "../../protocol/encoder/packet.ts";


export class PacketEncoderTransformer implements Transformer<Packet, Uint8Array> {
    private readonly encoder = new PacketEncoder();

    transform(packet: Packet, controller: TransformStreamDefaultController<Uint8Array>) {
        controller.enqueue(this.encoder.encode(packet));
    }
}

export class PacketEncoderStream extends TransformStream<Packet, Uint8Array> {
    constructor(writableStrategy?: QueuingStrategy<Packet>, readableStrategy?: QueuingStrategy<Uint8Array>) {
        super(
            new PacketEncoderTransformer(),
            writableStrategy,
            readableStrategy,
        );
    }
}

