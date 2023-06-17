import { isUint16, Uint16, Uint8 } from "../utils/intdef.ts";


const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export type RawPayloadCursor = {
    read: number,
    write: number,
};

export class RawPayload {
    bytes: Uint8[];
    capacity: number;
    cursor: RawPayloadCursor;

    constructor(bytes: Uint8[] = [], capacity: number = 0, cursor: RawPayloadCursor = {
        read: 0,
        write: 0,
    }) {
        this.bytes = bytes;
        this.capacity = capacity;
        this.cursor = cursor;
    }

    get numRemainingBytes() {
        return this.bytes.length - this.cursor.read;
    }

    readUint8() {
        return this.bytes?.[this.cursor.read++] ?? 0 as Uint8;
    }

    readUint16() {
        const msb = this.readUint8();
        const lsb = this.readUint8();

        return ((msb << 8) | lsb) as Uint16;
    }

    readByteArray(length: number = this.readUint16()): Uint8[] {
        return this.bytes?.slice(
            this.cursor.read,
            this.cursor.read += length,
        ) ?? [];
    }

    readRest(): Uint8[] {
        return this.readByteArray(
            (this.bytes?.length ?? this.capacity)
            - this.cursor.read
        );
    }

    readString() {
        return textDecoder.decode(Uint8Array.from(this.readByteArray()));
    }

    writeUint8(...values: Uint8[]) {
        for (const value of values) {
            (this.bytes ??= [])[this.cursor.write++] = value as Uint8;
        }

        this.capacity = Math.max(this.capacity, this.bytes.length);

        return this;
    }

    writeUint16(value: Uint16) {
        return this.writeUint8(
            (value >> 8) as Uint8,
            (value & 0xff) as Uint8,
        );
    }

    writeByteArray(value: Uint8[] | Uint8Array) {
        if (!isUint16(value.length))
            throw new Error("too much data (max. 65536 bytes)");

        return (
            this.writeUint16(value.length)
                .writeUint8(...value as Uint8[])
        );
    }

    writeString(value: string) {
        return this.writeByteArray(textEncoder.encode(value));
    }
}
