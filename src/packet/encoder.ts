import { PacketHeader } from "./mod.ts";


export type Byte = [
    boolean,
    boolean,
    boolean,
    boolean,
    boolean,
    boolean,
    boolean,
    boolean,
];

export const textEncoder = new TextEncoder();


export const encodeVariableByteInteger = (value: number) => {
    if (0 > value)
        throw Error("value out of range", { cause: value });

    if (128 > value)
        return [ value ];

    if (16384 > value)
        return [ value >> 0 & 127 | 128, value >> 7 & 127 ];

    if (2097152 > value)
        return [ value >> 0 & 127 | 128, value >> 7 & 127 | 128, value >> 14 & 127 ];

    if (268435456 > value)
        return [ value >> 0 & 127 | 128, value >> 7 & 127 | 128, value >> 14 & 127 | 128, value >> 21 ];

    throw Error("value out of range", { cause: value });
};

export class PacketEncoder {
    private readonly buffer: number[];

    constructor(bytes: number[] = []) {
        this.buffer = bytes;
    }

    uint(value: number) {
        this.buffer.push(...encodeVariableByteInteger(value));
        return this;
    }

    uint8(...values: number[]) {
        for (const value of values) {
            if (value < 0 || value > 2 ** 8)
                throw new Error("value out of range", { cause: value });

            this.buffer.push(value);
        }

        return this;
    }

    uint16(value: number) {
        this.buffer.push(value >> 8, value & 0xff);
        return this;
    }

    bits(...byte: Byte) {
        return this.uint8(
            (byte[0] ? 2 ** 7 : 0) |
            (byte[1] ? 2 ** 6 : 0) |
            (byte[2] ? 2 ** 5 : 0) |
            (byte[3] ? 2 ** 4 : 0) |
            (byte[4] ? 2 ** 3 : 0) |
            (byte[5] ? 2 ** 2 : 0) |
            (byte[6] ? 2 ** 1 : 0) |
            (byte[7] ? 2 ** 0 : 0)
        );
    }

    bytes(value: Uint8Array) {
        this.uint16(value.length);
        this.buffer.push(...value);

        return this;
    }

    string(value: string) {
        if (/\x00|[\uD800-\uDFFF]/.test(value)) {
            throw new Error("malformed string");
        }

        if (value.length >= 64 * 1024) {
            throw new Error("string is to long");
        }

        return this.bytes(textEncoder.encode(value));
    }

    header(header: PacketHeader) {
        return this.uint8(
            (header.type << 4) |
            (header.flags?.dup ? 2 ** 3 : 0) |
            (((header.flags?.qos ?? 0) & 2) ? 2 ** 2 : 0) |
            (((header.flags?.qos ?? 0) & 1) ? 2 ** 1 : 0) |
            (header.flags?.retain ? 2 ** 0 : 0)
        );
    }

    payload(encode: (encoder: PacketEncoder) => void) {
        const start = this.buffer.length;
        encode(this);
        const length = this.buffer.length - start;
        this.buffer.splice(start, 0, ...encodeVariableByteInteger(length));
        return this;
    }

    unwrap() {
        const bytes = new Uint8Array(this.buffer);
        this.buffer.length = 0;
        return bytes;
    }
}
