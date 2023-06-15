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
    encode: (value: number) => (
        value < 2 ** 7
            ? [ value ]
            : value < 2 ** 14
                ? [
                    value >> 0 & 127 | 128,
                    value >> 7 & 127,
                ]
                : value < 2 ** 21
                    ? [
                        value >> 0 & 127 | 128,
                        value >> 7 & 127 | 128,
                        value >> 14 & 127,
                    ]
                    : value < 2 ** 28
                        ? [
                            value >> 0 & 127 | 128,
                            value >> 7 & 127 | 128,
                            value >> 14 & 127 | 128,
                            value >> 21,
                        ]
                        : (() => {
                            new Error("value out of range", { cause: value })
                        })()
    ) as Uint8[],
} as const;
