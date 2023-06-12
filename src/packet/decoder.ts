export const textDecoder = new TextDecoder(undefined, { ignoreBOM: true });

export class PacketDecoder {
    private readonly buffer: Uint8Array;

    private cursor: number;

    constructor(buffer: Uint8Array, cursor = 0) {
        this.buffer = buffer;
        this.cursor = cursor;
    }

    get numRemainingBytes() {
        return this.buffer.byteLength - this.cursor;
    }

    uint() {
        const b1 = this.buffer[this.cursor++];

        if ((b1 & 0x80) === 0) {
            return b1;
        }

        const b2 = this.buffer[this.cursor++];

        if ((b2 & 0x80) === 0) {
            return (
                ((b1 & 0x7F) << 0) |
                ((b2 & 0x7F) << 7)
            );
        }

        const b3 = this.buffer[this.cursor++];

        if ((b3 & 0x80) === 0) {
            return (
                ((b1 & 0x7F) << 0) |
                ((b2 & 0x7F) << 7) |
                ((b3 & 0x7F) << 14)
            );
        }

        const b4 = this.buffer[this.cursor++];

        if ((b4 & 0x80) === 0) {
            return (
                ((b1 & 0x7F) << 0) |
                ((b2 & 0x7F) << 7) |
                ((b3 & 0x7F) << 14) |
                ((b4 & 0x7F) << 21)
            );
        }

        throw new Error("malformed variable-byte integer");
    }

    uint8() {
        return this.buffer[this.cursor++];
    }

    uint16() {
        return (this.buffer[this.cursor++] << 8) + this.buffer[this.cursor++];
    }

    flags<T = number>(map: (byte: number) => T = byte => byte as T): T {
        return map(this.uint8());
    }

    bytes() {
        const length = (this.buffer[this.cursor] << 8) + this.buffer[this.cursor + 1];
        const bytes = this.buffer.subarray(this.cursor + 2, this.cursor + 2 + length);
        this.cursor += 2 + length;
        return bytes;
    }

    string() {
        return textDecoder.decode(this.bytes());
    }

    rest() {
        return this.buffer.subarray(this.cursor, this.cursor = this.buffer.length);
    }
}
