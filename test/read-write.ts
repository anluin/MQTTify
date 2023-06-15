import { assertObjectMatch } from "https://deno.land/std@0.191.0/testing/asserts.ts";

import { Packet, PacketType } from "../src/protocol/3.1.1/packet.ts";
import { readPacket, writePacket } from "../src/protocol/3.1.1/helper.ts";


Deno.test("read-write", async () => {
    const connectPacket: Packet = {
        type: PacketType.Connect,
        clientId: 'my-client-id',
        cleanSession: true,
        keepAlive: 60,
    };

    const listener = await Deno.listen({ port: 1883 });
    const connection = await Deno.connect({ port: 1883 });

    await Promise.all([
        (async () => {
            const connection = await listener.accept();

            const packet = await readPacket(connection);
            connection.close();
            listener.close();

            assertObjectMatch(packet, connectPacket);
        })(),
        (async () => {
            await writePacket(connection, connectPacket);
            connection.close();
        })(),
    ]);
});
