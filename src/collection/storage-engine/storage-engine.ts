export abstract class StorageEngine<Element> {
    public constructor(protected prefix: string) {}

    protected prefixKey(key: string): string {
        return key.startsWith(`${this.prefix}:`) ? key : `${this.prefix}:${key}`;
    }

    public abstract keys(): Promise<string[]>;

    public abstract get(): Promise<Element[]>;
    public abstract get(key: string): Promise<Element | null>;

    public abstract set(key: string, value: Element): Promise<void>;

    public abstract delete(key: string): Promise<void>;

    public async clear(): Promise<void> {
        for (let key of await this.keys()) {
            await this.delete(key);
        }
    }
}
