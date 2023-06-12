import { Packet, PacketHeader } from "./mod.ts";
import { PacketDecoder } from "./decoder.ts";


export enum PacketDecoderStreamState {
    Idle,
    Header,
    PayloadLength0,
    PayloadLength1,
    PayloadLength2,
    PayloadLength3,
    PayloadLength,
    Payload,
}

export type PacketDecoderStreamData = {
    state: PacketDecoderStreamState.Idle,
} | {
    state: PacketDecoderStreamState.Header,
    header: PacketHeader,
} | {
    state: (
        PacketDecoderStreamState.PayloadLength |
        PacketDecoderStreamState.PayloadLength0 |
        PacketDecoderStreamState.PayloadLength1 |
        PacketDecoderStreamState.PayloadLength2 |
        PacketDecoderStreamState.PayloadLength3
        ),
    header: PacketHeader,
    payload: {
        length: number,
    },
} | {
    state: PacketDecoderStreamState.Payload,
    header: PacketHeader,
    payload: {
        length: number,
        bytes: number[],
    },
};

export class PacketDecoderStream extends TransformStream<Uint8Array, Packet> {
    private data: PacketDecoderStreamData = {
        state: PacketDecoderStreamState.Idle,
    };

    constructor(writableStrategy?: QueuingStrategy<Uint8Array>, readableStrategy?: QueuingStrategy<Packet>) {
        const transformer: Transformer<Uint8Array, Packet> = {
            transform: (chunk, controller) =>
                this.transform(chunk, controller),
            flush: (controller) =>
                this.flush(controller),
        };

        super(
            transformer,
            writableStrategy,
            readableStrategy,
        );
    }

    private transform(chunk: Uint8Array, controller: TransformStreamDefaultController<Packet>) {
        for (const byte of chunk) {
            for (; ;) {
                switch (this.data.state) {
                    case PacketDecoderStreamState.Idle:
                        this.data = {
                            state: PacketDecoderStreamState.Header,
                            header: {
                                type: byte >> 4,
                                flags: {
                                    dup: !!(byte & 2 ** 3),
                                    qos: (
                                        (byte & 2 ** 2) ? 2 :
                                            (byte & 2 ** 1) ? 1 :
                                                0
                                    ),
                                    retain: !!(byte & 2 ** 0),
                                },
                            },
                        };

                        break;
                    case PacketDecoderStreamState.Header:
                        if ((byte & 0x80) === 0) {
                            this.data = {
                                state: PacketDecoderStreamState.PayloadLength,
                                header: this.data.header,
                                payload: {
                                    length: byte,
                                },
                            };
                        } else {
                            this.data = {
                                state: PacketDecoderStreamState.PayloadLength0,
                                header: this.data.header,
                                payload: {
                                    length: (byte & 0x7F) << 0,
                                },
                            };
                        }

                        if (this.data.payload.length === 0) {
                            continue;
                        }

                        break;
                    case PacketDecoderStreamState.PayloadLength0:
                        this.data.state = (
                            (byte & 0x80) === 0
                                ? PacketDecoderStreamState.PayloadLength
                                : PacketDecoderStreamState.PayloadLength1
                        );

                        this.data.payload.length = (
                            this.data.payload.length |
                            ((byte & 0x7F) << 7)
                        );

                        break;
                    case PacketDecoderStreamState.PayloadLength1:
                        this.data.state = (
                            (byte & 0x80) === 0
                                ? PacketDecoderStreamState.PayloadLength
                                : PacketDecoderStreamState.PayloadLength2
                        );

                        this.data.payload.length = (
                            this.data.payload.length |
                            ((byte & 0x7F) << 14)
                        );

                        break;
                    case PacketDecoderStreamState.PayloadLength2:
                        if ((byte & 0x80) === 0) {
                            this.data.state = PacketDecoderStreamState.PayloadLength;
                            this.data.payload.length = (
                                this.data.payload.length |
                                ((byte & 0x7F) << 21)
                            );
                        } else {
                            throw new Error("malformed variable-byte integer");
                        }

                        break;
                    case PacketDecoderStreamState.PayloadLength:
                        this.data = {
                            state: PacketDecoderStreamState.Payload,
                            header: this.data.header,
                            payload: {
                                length: this.data.payload.length,
                                bytes: [],
                            },
                        };

                    /* falls through */
                    case PacketDecoderStreamState.Payload: {
                        if (this.data.payload.bytes.length < this.data.payload.length) {
                            this.data.payload.bytes.push(byte);

                            if (this.data.payload.bytes.length < this.data.payload.length) {
                                break;
                            }
                        }

                        const payload = new Uint8Array(this.data.payload.bytes);
                        const decoder = new PacketDecoder(payload);
                        const packet = Packet.decode(this.data.header, decoder);

                        controller.enqueue(packet);

                        this.data = {
                            state: PacketDecoderStreamState.Idle,
                        };

                        break;
                    }
                }

                break;
            }
        }
    }

    private flush(controller: TransformStreamDefaultController<Packet>) {
        if (this.data.state !== PacketDecoderStreamState.Idle) {
            this.data = {
                state: PacketDecoderStreamState.Idle,
            };
        }
    }
}
