declare module "events" {
    interface EventEmitter {
        once(
            event: string | symbol,
            listener: (...args: unknown[]) => void,
        ): any;
    }
}
