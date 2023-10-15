import type { StorageValue } from './storage-engine';
import { StorageEngine } from './storage-engine';

export class MemoryStorageEngine<Value extends StorageValue> extends StorageEngine<Value> {
    private memory = new Map<string, Value>();

    public async keys() {
        let keys: string[] = [];
        for (let key of this.memory.keys()) {
            keys.push(key);
        }
        return keys;
    }

    public async get(): Promise<Value[]>;
    public async get(key: string): Promise<Value | null>;
    public async get(key?: string): Promise<Value | null | Value[]> {
        if (key) {
            return this.memory.get(this.prefixKey(key)) ?? null;
        }

        let elements: Value[] = [];
        for (let key of await this.keys()) {
            let value = await this.get(key);
            if (value) elements.push(value);
        }
        return elements;
    }

    public async set(key: string, value: Value) {
        this.memory.set(this.prefixKey(key), value);
    }

    public async delete(key: string) {
        this.memory.delete(this.prefixKey(key));
    }
}
