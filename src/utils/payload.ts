import { JSONValue } from "./json.ts";
import { text } from "./text.ts";


export type Payload = {
    bytes: Uint8Array,
    text: string,
    json: JSONValue,
};

export const Payload = {
    encode: (payload?: Payload[keyof Payload]) => (
        payload instanceof Uint8Array
            ? payload
            : text.encoder.encode(
                typeof payload !== "string"
                    ? JSON.stringify(payload)
                    : payload
            )
    ),
    decode: (payload: Uint8Array): Payload => ({
        bytes: payload,
        get text() {
            return text.decoder.decode(this.bytes);
        },
        set text(value: string) {
            this.bytes = text.encoder.encode(value);
        },
        get json() {
            return JSON.parse(this.text);
        },
        set json(value: JSONValue) {
            this.text = JSON.stringify(value);
        },
    }),
} as const;
