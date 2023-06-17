import { RawPacket } from "../raw_packet.ts";
import { RawPayload } from "../raw_payload.ts";
import { Uint8 } from "../../utils/intdef.ts";


export enum RawPacketDecoderState {
    DecodeHeader,
    DecodePayloadLength,
    CollectPayload,
}

export interface RawPacketDecoderOptions {
    fatal: boolean,
}

export interface RawPacketDecodeOptions {
    stream: boolean,
}

export class RawPacketDecoder {
    readonly fatal: boolean;
    private state: RawPacketDecoderState = RawPacketDecoderState.DecodeHeader;
    private payloadLengthByteCounter = 0;
    private packet?: RawPacket;

    constructor(options?: RawPacketDecoderOptions) {
        this.fatal = options?.fatal ?? false;
    }

    decode<Stream extends boolean = false>(input: BufferSource, options?: RawPacketDecodeOptions) {
        const buffer = (
            input instanceof Uint8Array
                ? input
                : input instanceof ArrayBuffer
                    ? new Uint8Array(input)
                    : new Uint8Array(
                        input.buffer,
                        input.byteOffset,
                        input.byteLength,
                    )
        );

        const packets: RawPacket[] = [];

        for (const byte of buffer) {
            switch (this.state) {
                case RawPacketDecoderState.DecodeHeader:
                    this.state = RawPacketDecoderState.DecodePayloadLength;
                    this.packet = {
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
                        payload: new RawPayload(undefined as unknown as Uint8[]),
                    };

                    break;
                case RawPacketDecoderState.DecodePayloadLength:
                    this.packet!.payload!.capacity |= ((byte & 0x7F) << ((this.payloadLengthByteCounter++) * 7));

                    if ((byte & 0x80) === 0) {
                        this.state = RawPacketDecoderState.CollectPayload;
                        this.payloadLengthByteCounter = 0;
                        this.packet!.payload!.bytes = new Array(
                            this.packet!.payload!.capacity,
                        );

                        if (this.packet!.payload!.capacity > 0) {
                            break;
                        }
                    } else {
                        break;
                    }

                /* falls through */
                case RawPacketDecoderState.CollectPayload:
                    if (this.packet!.payload!.capacity > this.packet!.payload!.cursor.write) {
                        this.packet!.payload!.bytes![this.packet!.payload!.cursor.write++] = byte as Uint8;
                    }

                    if (this.packet!.payload!.capacity === this.packet!.payload!.cursor.write) {
                        this.state = RawPacketDecoderState.DecodeHeader;

                        const [ packet ] = (
                            [ , this.packet ] =
                                [ this.packet!, undefined ]
                        );

                        packets.push(packet);
                    }

                    break;
            }
        }

        if (this.fatal && packets.length === 0 && options?.stream !== true) {
            throw new TypeError();
        }

        return packets;
    }
}
