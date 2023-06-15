export const delay = (delay: number) =>
    new Promise<void>(resolve => setTimeout(resolve, delay));
