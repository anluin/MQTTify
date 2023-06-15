export interface ItoJSON {
    toJSON(): JSONValue;
}

export type JSONValue =
    | string
    | number
    | boolean
    | {
    [_: string]: JSONValue
}
    | Array<JSONValue>
    | ItoJSON;
