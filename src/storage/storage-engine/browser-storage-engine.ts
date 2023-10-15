import type { StorageEngine, StorageValue } from '.';
import { defineStorageEngine } from '.';

export type BrowserStorageEngineOptions = {
    prefix: string;
    storage: Storage;
};

export const createBrowserStorageEngine = defineStorageEngine<BrowserStorageEngineOptions>(
    ({ prefix, storage }, utilities) => {
        return {
            async keys() {
                return Object.keys(storage).filter(key => key.startsWith(prefix));
            },
            async get(key) {
                if (key) {
                    return JSON.parse(storage.getItem(utilities.prefixKey(prefix, key)) ?? '');
                }

                let elements: StorageValue[] = [];
                for (let key of await this.keys()) {
                    let value = await this.get(key);
                    if (value) elements.push(value);
                }
                return elements;
            },
            async set(key, value) {
                storage.setItem(utilities.prefixKey(prefix, key), JSON.stringify(value));
            },
            async delete(key: string) {
                storage.removeItem(utilities.prefixKey(prefix, key));
            },
            async clear() {
                await utilities.clearAll(this.keys.bind(this), this.delete.bind(this));
            },
        } as StorageEngine<StorageValue>;
    },
);
