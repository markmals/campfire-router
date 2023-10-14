import type { StorageEngine } from './storage-engine';

export type StorageValue = null | string | number | boolean | object;

export interface ToString {
    toString(): string;
}

export interface Identifiable {
    id: ToString;
}

interface _CollectionOptions<Item extends StorageValue & Identifiable> {
    storage: StorageEngine<Item>;
    cacheIdentifier: keyof Item | undefined;
    initialValue: Item[] | undefined;
}

export type CollectionOptions<Item extends StorageValue> = Item extends Identifiable
    ? {
          storage: StorageEngine<Item>;
          initialValue?: Item[];
      }
    : {
          storage: StorageEngine<Item>;
          cacheIdentifier: keyof Item;
          initialValue?: Item[];
      };

export class Collection<Item extends StorageValue & Identifiable> {
    private _items: Item[] = [];
    private observers: ((items: Item[]) => void)[] = [];

    public get items(): Item[] {
        return this._items;
    }

    public set items(newValue: Item[]) {
        this._items = newValue;
        this.observers.forEach(observer => observer(newValue));
    }

    private storageEngine!: StorageEngine<Item>;
    private cacheId!: keyof Item;

    /** Cannot synchronously construct a Collection. Use createCollection instead. */
    private constructor() {}

    public static async create<Item extends StorageValue & Identifiable>(
        options: CollectionOptions<Item>,
    ): Promise<Collection<Item>> {
        let collection = new Collection<Item>();
        let { initialValue, storage, cacheIdentifier } = options as _CollectionOptions<Item>;
        collection.storageEngine = storage;
        collection.cacheId = cacheIdentifier || ('id' as keyof Item);

        // Populate the state with any existing database data
        let items = await storage.get();
        if (items) {
            collection.items = items;
        }

        if (initialValue !== undefined && collection.isEmpty) {
            collection.add(initialValue);
        }

        return collection;
    }

    public get isEmpty() {
        return this.items.length === 0;
    }

    public async add(item: Item | Item[]) {
        let currentValuesMap = new Map<string, Item>();

        if (Array.isArray(item)) {
            let addedItemsMap = new Map<string, Item>();

            // Deduplicate items passed into `add(items)` by taking advantage
            // of the fact that a Map can't have duplicate keys.
            for (let newItem of item) {
                let identifier = (newItem[this.cacheId] as ToString).toString();
                addedItemsMap.set(identifier, newItem);
            }

            // Take the current items array and turn it into a Map.
            for (let currentItem of this.items) {
                currentValuesMap.set(
                    (currentItem[this.cacheId] as ToString).toString(),
                    currentItem,
                );
            }

            // Add the new items into the dictionary representation of our items.
            for (let [key, newItem] of addedItemsMap) {
                currentValuesMap.set(key, newItem);
            }

            // We persist only the newly added items, rather than rewriting all of the items
            await this.persist(Array.from(addedItemsMap.values()));
        } else {
            let identifier = (item[this.cacheId] as ToString).toString();

            for (let currentItem of this.items) {
                currentValuesMap.set(
                    (currentItem[this.cacheId] as ToString).toString(),
                    currentItem,
                );
            }

            currentValuesMap.set(identifier, item);

            // We persist only the newly added item, rather than rewriting all of the items
            await this.persist(item);
        }

        this.items = Array.from(currentValuesMap.values());
    }

    // TODO: Patch?
    // update(item: Partial<Item> | Partial<Item>[]) {}

    public async delete(item: Item | Item[]) {
        let values: Item[] = Array.isArray(item) ? item : [item];
        await this.deletePersisted(item);
        this.items = this.items.filter(
            currentItem =>
                !values
                    .map(i => String(i[this.cacheId]))
                    .includes((currentItem[this.cacheId] as ToString).toString()),
        );
    }

    public async clear() {
        await this.storageEngine.clear();
        this.items = [];
    }

    public subscribe(observable: (items: Item[]) => void) {
        this.observers.push(observable);
        return () => {
            let idx = this.observers.indexOf(observable);
            delete this.observers[idx];
        };
    }

    private async persist(item: Item | Item[]) {
        if (Array.isArray(item)) {
            let items = item;
            for (const item of items) {
                await this.persist(item);
            }
        } else {
            let identifier = (item[this.cacheId] as ToString).toString();
            await this.storageEngine.set(identifier, item);
        }
    }

    private async deletePersisted(item: Item | Item[]) {
        if (Array.isArray(item)) {
            let items = item;
            for (const item of items) {
                await this.deletePersisted(item);
            }
        } else {
            let identifier = (item[this.cacheId] as ToString).toString();
            await this.storageEngine.delete(identifier);
        }
    }
}

export function createCollection<Item extends StorageValue & Identifiable>(
    options: CollectionOptions<Item>,
): Promise<Collection<Item>> {
    return Collection.create(options);
}
