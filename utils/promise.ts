export const unwrappedPromise = <T = void>() => {
    let resolve: (value: T) => void;
    let reject: (error: unknown) => void;

    const promise = new Promise(
        (...args) =>
            [ resolve, reject ] = args,
    );

    return {
        promise,
        // @ts-ignore: assigned in executor
        resolve,
        // @ts-ignore: assigned in executor
        reject,
    }
};
