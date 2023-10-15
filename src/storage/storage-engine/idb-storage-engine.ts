import { clear, createStore, del, get, getMany, keys, set } from 'idb-keyval';
import type { StorageEngine, StorageValue } from '.';
import { defineStorageEngine } from '.';

export type IndexedDBStorageEngineOptions = {
    prefix: string;
};

export const createIndexedDBStorageEngine = defineStorageEngine<IndexedDBStorageEngineOptions>(
    ({ prefix }) => {
        const store = createStore(prefix, 'idb-keyval-store');

        return {
            async keys() {
                return (await keys(store)) as string[];
            },
            async get(key) {
                if (key) {
                    return (await get(key, store)) ?? null;
                }

                return await getMany(await this.keys(), store);
            },
            async set(key, value) {
                await set(key, value, store);
            },
            async delete(key: string) {
                await del(key, store);
            },
            async clear() {
                await clear(store);
            },
        } as StorageEngine<StorageValue>;
    },
);
