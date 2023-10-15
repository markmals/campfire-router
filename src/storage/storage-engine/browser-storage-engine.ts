import type { StorageValue } from './storage-engine';
import { StorageEngine } from './storage-engine';

export class BrowserStorageEngine<Value extends StorageValue> extends StorageEngine<Value> {
    public constructor(
        prefix: string,
        protected storage: Storage = localStorage,
    ) {
        super(prefix);
    }

    public async keys() {
        return Object.keys(this.storage).filter(key => key.startsWith(this.prefix));
    }

    public async get(): Promise<Value[]>;
    public async get(key: string): Promise<Value | null>;
    public async get(key?: string): Promise<Value | null | Value[]> {
        if (key) {
            return JSON.parse(this.storage.getItem(this.prefixKey(key)) ?? '');
        }

        let elements: Value[] = [];
        for (let key of await this.keys()) {
            let value = await this.get(key);
            if (value) elements.push(value);
        }
        return elements;
    }

    public async set(key: string, value: Value) {
        this.storage.setItem(this.prefixKey(key), JSON.stringify(value));
    }

    public async delete(key: string) {
        this.storage.removeItem(this.prefixKey(key));
    }
}
