import {
    MqttConnAckReturnCode,
    MqttMessageController,
    MqttPacketControllerStream,
    MqttPacketDecoderStream,
    MqttPacketEncoderStream,
    toMqttSubAckReturnCode,
} from "./mod.ts";

const startSimpleBroker = async (signal: AbortSignal) => {
    const connectedClients = new Set<MqttMessageController>();
    const tcpListener = Deno.listen({
        transport: "tcp",
        port: 1883,
    });

    signal.addEventListener("abort", () => {
        tcpListener.close();
    });

    for await (const tcpConnection of tcpListener) {
        const abortListener = () => {
            tcpListener[Symbol.dispose]();
        };

        signal.addEventListener("abort", abortListener);

        tcpConnection.readable
            .pipeThrough(new MqttPacketDecoderStream())
            .pipeThrough(
                new MqttPacketControllerStream({
                    handleConnect: (_request) => {
                        return {
                            returnCode: MqttConnAckReturnCode.ConnectionAccepted,
                            sessionPresent: false,
                            initializeHandler: (controller) => ({
                                onConnected() {
                                    connectedClients.add(controller);
                                },
                                onDisconnect() {
                                    connectedClients.delete(controller);
                                },
                                async onMessage(event) {
                                    await Promise.all(
                                        [...connectedClients]
                                            .map((connectedClient) => (
                                                connectedClient.publish(event.message)
                                            )),
                                    );
                                },
                                onSubscribe(event) {
                                    return {
                                        returnCodes: (
                                            event.subscriptions.map(({ qualityOfService }) =>
                                                toMqttSubAckReturnCode(qualityOfService)
                                            )
                                        ),
                                    };
                                },
                                onUnsubscribe(event) {
                                },
                            }),
                        };
                    },
                }),
            )
            .pipeThrough(new MqttPacketEncoderStream())
            .pipeTo(tcpConnection.writable)
            .catch(console.error)
            .finally(() => {
                signal.removeEventListener("abort", abortListener);
                tcpConnection[Symbol.dispose]();
            });
    }
};

Deno.test("Simple Broker", async () => {
    const abortController = new AbortController();

    await Promise.all([
        startSimpleBroker(abortController.signal),
        (async () => {
            await (
                new Deno.Command("mqtt", {
                    args: ["test", "--all", "--timeOut", "1", "-V", "3"],
                    stdout: "inherit",
                    stderr: "inherit",
                })
                    .output()
            );

            abortController.abort();
        })(),
    ]);
});

// Deno.test("Simple client", async () => {
//     const abortController = new AbortController();
//     await Promise.all([
//         startSimpleBroker(abortController.signal),
//         (async () => {
//             const tcpConnection = await Deno.connect({
//                 transport: "tcp",
//                 port: 1883,
//             });
//
//             await tcpConnection.readable
//                 .pipeThrough(new MqttPacketDecoderStream())
//                 .pipeThrough(new MqttPacketControllerStream({
//                     connect: {
//                         initializeHandler: () => ({
//
//                         }),
//                     },
//                 }))
//                 .pipeThrough(new MqttPacketEncoderStream())
//                 .pipeTo(tcpConnection.writable)
//                 .catch(console.error)
//                 .finally(() => {
//                     tcpConnection[Symbol.dispose]();
//                 });
//
//             abortController.abort();
//         })(),
//     ]);
// });
