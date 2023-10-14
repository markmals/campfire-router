import { clear, createStore, del, get, getMany, keys, set } from 'idb-keyval';
import { StorageEngine } from './storage-engine';

export class IndexedDBStorageEngine<Element> extends StorageEngine<Element> {
    private store = createStore(this.prefix, 'idb-keyval-store');

    public async keys() {
        return (await keys(this.store)) as string[];
    }

    public async get(): Promise<Element[]>;
    public async get(key: string): Promise<Element | null>;
    public async get(key?: string): Promise<Element | null | Element[]> {
        if (key) {
            return (await get(key, this.store)) ?? null;
        }

        return await getMany(await this.keys(), this.store);
    }

    public async set(key: string, value: Element) {
        await set(key, value, this.store);
    }

    public async delete(key: string) {
        await del(key, this.store);
    }

    public override async clear(): Promise<void> {
        await clear(this.store);
    }
}
