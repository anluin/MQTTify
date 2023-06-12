import { Client, Message, Payload, PublishOptions } from "../mod.ts";


export async function publish(url: string | URL, topic: string, payload?: Payload, options?: PublishOptions): Promise<void>;
export async function publish(url: string | URL, message: Message): Promise<void>;
export async function publish(url: string | URL, ...args: (
    [ topic: string, payload?: Payload, options?: Omit<Message, "topic" | "payload"> ] |
    [ message: Message ]
    )) {
    await new Client(url)
        .connect()
        // @ts-ignore: No idea why typescript is complaining here 🤷
        .then(client => client.publish(...args))
        .then(client => client.disconnect());
}
