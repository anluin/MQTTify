import { Client, ReturnCode, serve } from "../src/mod.ts";


const current = new Date();

Deno.test("client & server", async () => {
    let error: Error | undefined;

    const startServer = async () => {
        for await (const connection of await serve({
            auth(packet) {
                return {
                    returnCode: ReturnCode.ConnectionAccepted,
                    sessionPresent: false,
                };
            },
        })) {
            connection.addEventListener("subscribe", (event) => {
                console.log(event);
            });

            connection.addEventListener("unsubscribe", (event) => {
                console.log(event);
            });

            connection.addEventListener("disconnect", (event) => {
                console.log(event);
            });

            connection.addEventListener("publish", (event) => {
                if (!(
                    (typeof event.message.payload === "object") &&
                    ("current" in event.message.payload) &&
                    (event.message.payload.current instanceof Date) &&
                    (event.message.payload.current.getTime() === current.getTime()))
                ) {
                    console.log(event.message);
                    error = new Error("wrong payload received");
                }

                connection.disconnect();
            });

            await connection.disconnected();
            break;
        }

    }

    const startClient = async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        const client = new Client("mqtt://127.0.0.1:1883");

        await client.connect();
        await client.publish("test", {
            current,
        });
        await client.subscribe("#");
        await client.disconnect();
    };

    await Promise.all([
        startServer(),
        startClient(),
    ]);

    if (error) {
        throw error;
    }
});
