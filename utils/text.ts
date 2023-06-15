export const text = {
    decoder: new TextDecoder(undefined, { ignoreBOM: true }),
    encoder: new TextEncoder(),
} as const;
