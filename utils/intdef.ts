export type Uint8 =
    {
        readonly ["#tag"]: unique symbol
    }
    & number;
export type Uint16 =
    {
        readonly ["#tag"]: unique symbol
    }
    & number;

export const isUint8 = (value: number): value is Uint8 =>
    value >= 0 && value <= 2 ** 8;

export const asUint8 = (value: number): Uint8 => {
    if (!isUint8(value))
        throw new Error("value must between 0 and 256");

    return value;
}

export const isUint16 = (value: number): value is Uint16 =>
    value >= 0 && value <= 2 ** 16;

export const asUint16 = (value: number): Uint16 => {
    if (!isUint16(value))
        throw new Error("value must between 0 and 65536");

    return value;
}

export const VarInt = {
    encode: (value: number) => {
        if (value < 0 || value > 2 ** 28) {
            throw new Error("value out of range", { cause: value });
        }

        if (value < 2 ** 7)
            return [ value ] as Uint8[];
        else if (value < 2 ** 14)
            return [
                value >> 0 & 127 | 128,
                value >> 7 & 127,
            ] as Uint8[];
        else if (value < 2 ** 21)
            return [
                value >> 0 & 127 | 128,
                value >> 7 & 127 | 128,
                value >> 14 & 127,
            ] as Uint8[];
        else
            return [
                value >> 0 & 127 | 128,
                value >> 7 & 127 | 128,
                value >> 14 & 127 | 128,
                value >> 21,
            ] as Uint8[];
    },
} as const;

