export const defaults = {
    port: 1883,
    keepAlive: 60,
    timeouts: {
        connect: 1000,
        puback: 1000,
        pubrel: 1000,
        pubrec: 1000,
        pubcomp: 1000,
        connack: 1000,
        suback: 1000,

    },
    retries: {
        pubrel: 8,
        publish: 8,

    },
    limits: {
        maxPacketId: 2 ** 16,
    },
} as const;
