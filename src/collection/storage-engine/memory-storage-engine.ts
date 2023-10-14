import { StorageEngine } from './storage-engine';

export class MemoryStorageEngine<Element> extends StorageEngine<Element> {
    private memory = new Map<string, Element>();

    public async keys() {
        let keys: string[] = [];
        for (let key of this.memory.keys()) {
            keys.push(key);
        }
        return keys;
    }

    public async get(): Promise<Element[]>;
    public async get(key: string): Promise<Element | null>;
    public async get(key?: string): Promise<Element | null | Element[]> {
        if (key) {
            return this.memory.get(this.prefixKey(key)) ?? null;
        }

        let elements: Element[] = [];
        for (let key of await this.keys()) {
            let value = await this.get(key);
            if (value) elements.push(value);
        }
        return elements;
    }

    public async set(key: string, value: Element) {
        this.memory.set(this.prefixKey(key), value);
    }

    public async delete(key: string) {
        this.memory.delete(this.prefixKey(key));
    }
}
