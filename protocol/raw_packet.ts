import { RawPayload } from "./raw_payload.ts";


export interface RawPacket {
    header: {
        type: number,
        flags?: {
            retain: boolean;
            qos: number,
            dup: boolean;
        },
    },
    payload: RawPayload,
}
