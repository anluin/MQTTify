import { Packet } from "../../protocol/packet.ts";
import { PacketDecoder } from "../../protocol/decoder/packet.ts";
import { PacketEncoder } from "../../protocol/encoder/packet.ts";


const mapController = (controller: TransformStreamDefaultController<Uint8Array>, encoder: PacketEncoder): TransformStreamDefaultController<Packet> => ({
    desiredSize: controller.desiredSize,
    enqueue: chunk => controller.enqueue(encoder.encode(chunk)),
    error: (reason) => controller.error(reason),
    terminate: () => controller.terminate(),
});

export class PacketTransformTransformer implements Transformer<Uint8Array, Uint8Array> {
    private readonly decoder: PacketDecoder = new PacketDecoder({ fatal: true });
    private readonly encoder = new PacketEncoder();
    private readonly transformer: Transformer<Packet, Packet>;

    constructor(transformer: Transformer<Packet, Packet>) {
        this.transformer = transformer;
    }

    start(controller: TransformStreamDefaultController<Uint8Array>) {
        this.transformer.start?.(mapController(controller, this.encoder));
    }

    transform(chunk: Uint8Array, controller: TransformStreamDefaultController<Uint8Array>) {
        const mappedController = mapController(controller, this.encoder);

        for (const packet of this.decoder.decode(chunk, { stream: true })) {
            this.transformer.transform?.(packet, mappedController);
        }
    }

    flush(controller: TransformStreamDefaultController<Uint8Array>) {
        this.transformer.flush?.(mapController(controller, this.encoder));
    }
}

export class PacketTransformStream extends TransformStream<Uint8Array, Uint8Array> {
    constructor(transformer: Transformer<Packet, Packet>, writableStrategy?: QueuingStrategy<Uint8Array>, readableStrategy?: QueuingStrategy<Uint8Array>) {
        super(
            new PacketTransformTransformer(transformer),
            writableStrategy,
            readableStrategy,
        );
    }
}
