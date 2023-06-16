import { Packet, PacketDecoderStream, PacketEncoder } from "../mod.ts";


export class Connection implements AsyncIterable<Packet> {
    private readonly packetEncoder = new PacketEncoder();
    private readonly connection: Deno.Conn;

    #readable?: ReadableStream<Packet>;

    constructor(connection: Deno.Conn) {
        this.connection = connection;
    }

    get readable(): ReadableStream<Packet> {
        return this.#readable ??= (
            this.connection.readable
                .pipeThrough(new PacketDecoderStream())
        );
    }

    get writable(): WritableStream<Packet> {
        return new WritableStream(this);
    }

    async write(packet: Packet) {
        const bytes = this.packetEncoder.encode(packet);

        let numBytes = 0;

        while (numBytes < bytes.length) {
            numBytes += await this.connection.write(bytes.subarray(numBytes));
        }
    }

    async read() {
        const reader = this.readable.getReader();

        return await (
            reader.read()
                .then(({ value }) => value)
                .finally(() => reader.releaseLock())
        );
    }

    async* [Symbol.asyncIterator]() {
        for await (const packet of this.readable) {
            yield packet;
        }
    }

    async closeWrite() {
        await this.connection.closeWrite();
    }

    close() {
        this.connection.close();
    }
}
