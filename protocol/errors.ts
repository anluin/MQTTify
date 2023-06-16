export class InvalidPacket extends Error {
}

export class InvalidPacketType extends InvalidPacket {
    type: number;

    constructor(type: number) {
        super(`invalid packet type: #${type}`);
        this.type = type;
    }
}

export class InvalidProtocol extends InvalidPacket {
}

export class InvalidProtocolLevel extends InvalidPacket {
}

export class InvalidPayload extends InvalidPacket {

}
