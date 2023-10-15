import type { StorageEngine, StorageValue } from '.';
import { defineStorageEngine } from '.';

export const createMemoryStorageEngine = defineStorageEngine<{ prefix: string }>(
    ({ prefix }, utilities) => {
        const memory = new Map<string, StorageValue>();
        return {
            async keys() {
                let keys: string[] = [];
                for (let key of memory.keys()) {
                    keys.push(key);
                }
                return keys;
            },
            async get(key) {
                if (key) {
                    return memory.get(utilities.prefixKey(prefix, key)) ?? null;
                }

                let elements: StorageValue[] = [];
                for (let key of await this.keys()) {
                    let value = await this.get(key);
                    if (value) elements.push(value);
                }
                return elements;
            },
            async set(key, value) {
                memory.set(utilities.prefixKey(prefix, key), value);
            },
            async delete(key: string) {
                memory.delete(utilities.prefixKey(prefix, key));
            },
            async clear() {
                await utilities.clearAll(this.keys.bind(this), this.delete.bind(this));
            },
        } as StorageEngine<StorageValue>;
    },
);
