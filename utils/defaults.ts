export const defaults = {
    port: 1883,
    keepAlive: 60,
    retries: {
        publish: 8,
        pubrel: 8,
        suback: 8,
        unsuback: 8,
        pubrec: 8,
    },
    timeouts: {
        connect: 1000,
        puback: 1000,
        pubrec: 1000,
        pubcomp: 1000,
        pingresp: 1000,
        suback: 1000,
        unsuback: 1000,
        pubrel: 1000,
    },
};
