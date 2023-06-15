# MQTTify

> Implementation of the [MQTT v3.1.1](http://docs.oasis-open.org/mqtt/mqtt/v3.1.1/mqtt-v3.1.1.pdf) protocol

This project is an implementation of the MQTT protocol using Deno. It includes classes and functions to encode and decode MQTT packets, as well as helpers to read and write packets from a connection.

## Usage

To use the MQTT library, you can import the necessary classes and functions in your Deno project.

For example, to read a packet from a connection:

```typescript
import { readPacket } from 'https://deno.land/x/mqttify/protocol/3.1.1/helper.ts';


for await (const connection of await Deno.listen({ port: 1883 })) {
    const packet = await readPacket(connection);

    console.log(packet);
}
```

To write a packet to a connection:

```typescript
import { writePacket } from 'https://deno.land/x/mqttify/protocol/3.1.1/helper.ts';
import { PacketType } from "https://deno.land/x/mqttify/protocol/3.1.1/packet.ts";


const connection = await Deno.connect({
    hostname: 'mqtt.example.com',
    port: 1883
});

await writePacket(connection, {
    type: PacketType.Connect,
    clientId: 'my-client-id',
    cleanSession: true,
    keepAlive: 60,
});
```

## Project Structure

- `src/defaults.ts`: Contains default values for MQTT packet settings.
- `src/utils/*.ts`: Contains a utility functions.
- `src/protocol/3.1.1/packet/*.ts`: Contains types and functions for encoding and decoding individual types of MQTT packets.
- `src/protocol/3.1.1/decode.ts`: Contains classes for decoding MQTT packets.
- `src/protocol/3.1.1/encode.ts`: Contains classes for encoding MQTT packets.
- `src/protocol/3.1.1/packet.ts`: Defines types and functions for encoding and decoding MQTT packets.
- `src/protocol/3.1.1/helper.ts`: Contains helper functions for reading and writing MQTT packets.

