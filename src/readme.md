# MQTTify

Unfinished Implementation of the [MQTT v3.1.1](http://docs.oasis-open.org/mqtt/mqtt/v3.1.1/mqtt-v3.1.1.pdf) protokoll.


## Server
```ts
const handleConnection = async (connection: Connection) => {
    connection.addEventListener("subscribe", (event) => {
        console.log(event);
    });

    connection.addEventListener("unsubscribe", (event) => {
        console.log(event);
    });

    connection.addEventListener("publish", (event) => {
        console.log(event);
    });

    connection.addEventListener("disconnect", (event) => {
        console.log(event);
    });
    
    await connection.publish("welcome", "Hello, world!", {
        // qos: QualityOfService.atMostOnce,
        // retain: false,
    });

    // wait until client disconnects
    await connection.disconnected();
};

for await (const connection of await serve({
    auth(packet: Omit<ConnectPacket, "type">) {
        // insert auth logic here

        return {
            returnCode: ReturnCode.ConnectionAccepted,
            sessionPresent: false,
        };
    },
})) {
    handleConnection(connection)
        .catch(console.error);
}
```


## Client
```ts
// server is specified via url:
// mqtt(s)?://$username:$password@$hostname:$port
const client = new Client("mqtt://127.0.0.1:1883");

await client.connect();

await client.subscribe("#");

await client.publish("test", {
    current,
});

await client.disconnect();
```


## Utils

### Publish

Simple one-liner to connect, publish and disconnect

```ts
await publish("mqtt://127.0.0.1:1883", "topic", "payload");
```
