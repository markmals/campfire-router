export type StorageValue = null | string | number | boolean | object;

export abstract class StorageEngine<Value extends StorageValue> {
    public constructor(protected prefix: string) {}

    protected prefixKey(key: string): string {
        return key.startsWith(`${this.prefix}:`) ? key : `${this.prefix}:${key}`;
    }

    public abstract keys(): Promise<string[]>;

    public abstract get(): Promise<Value[]>;
    public abstract get(key: string): Promise<Value | null>;

    public abstract set(key: string, value: Value): Promise<void>;

    public abstract delete(key: string): Promise<void>;

    public async clear(): Promise<void> {
        for (let key of await this.keys()) {
            await this.delete(key);
        }
    }
}
