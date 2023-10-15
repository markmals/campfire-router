import type { StorageEngine } from './storage-engine';

export interface ToString {
    toString(): string;
}

export interface Identifiable {
    id: ToString;
}

interface _CollectionOptions<Item extends object> {
    storage: StorageEngine<Item>;
    cacheIdentifier: keyof Item | undefined;
    initialValue: Item[] | undefined;
}

export type CollectionOptions<Item extends object> = Item extends Identifiable
    ? {
          storage: StorageEngine<Item>;
          initialValue?: Item[];
      }
    : {
          storage: StorageEngine<Item>;
          cacheIdentifier: keyof Item;
          initialValue?: Item[];
      };

export type Collection<Item extends object> = {
    get items(): Item[];
    get isEmpty(): boolean;
    add(item: Item | Item[]): Promise<void>;
    delete(item: Item | Item[]): Promise<void>;
    clear(): Promise<void>;
    subscribe(observable: (items: Item[]) => void): void;
};

export async function createCollection<Item extends object>(
    options: CollectionOptions<Item>,
): Promise<Collection<Item>> {
    let items: Item[] = [];
    const observers: ((items: Item[]) => void)[] = [];

    const {
        initialValue,
        storage: storageEngine,
        cacheIdentifier,
    } = options as _CollectionOptions<Item>;
    const cacheId = cacheIdentifier || ('id' as keyof Item);

    function setItems(newValue: Item[]) {
        items = newValue;
        observers.forEach(observer => observer(newValue));
    }

    async function persist(item: Item | Item[]) {
        if (Array.isArray(item)) {
            let items = item;
            for (const item of items) {
                await persist(item);
            }
        } else {
            let identifier = (item[cacheId] as ToString).toString();
            await storageEngine.set(identifier, item);
        }
    }

    async function deletePersisted(item: Item | Item[]) {
        if (Array.isArray(item)) {
            let items = item;
            for (const item of items) {
                await deletePersisted(item);
            }
        } else {
            let identifier = (item[cacheId] as ToString).toString();
            await storageEngine.delete(identifier);
        }
    }

    // Populate the state with any existing database data
    let existingItems = await storageEngine.get();
    if (existingItems) {
        items = existingItems;
    }

    const collection: Collection<Item> = {
        get items() {
            return items;
        },
        get isEmpty() {
            return items.length === 0;
        },
        async add(item) {
            let currentValuesMap = new Map<string, Item>();

            if (Array.isArray(item)) {
                let addedItemsMap = new Map<string, Item>();

                // Deduplicate items passed into `add(items)` by taking advantage
                // of the fact that a Map can't have duplicate keys.
                for (let newItem of item) {
                    let identifier = (newItem[cacheId] as ToString).toString();
                    addedItemsMap.set(identifier, newItem);
                }

                // Take the current items array and turn it into a Map.
                for (let currentItem of items) {
                    currentValuesMap.set(
                        (currentItem[cacheId] as ToString).toString(),
                        currentItem,
                    );
                }

                // Add the new items into the dictionary representation of our items.
                for (let [key, newItem] of addedItemsMap) {
                    currentValuesMap.set(key, newItem);
                }

                // We persist only the newly added items, rather than rewriting all of the items
                await persist(Array.from(addedItemsMap.values()));
            } else {
                let identifier = (item[cacheId] as ToString).toString();

                for (let currentItem of items) {
                    currentValuesMap.set(
                        (currentItem[cacheId] as ToString).toString(),
                        currentItem,
                    );
                }

                currentValuesMap.set(identifier, item);

                // We persist only the newly added item, rather than rewriting all of the items
                await persist(item);
            }

            setItems(Array.from(currentValuesMap.values()));
        },
        async delete(item) {
            let values: Item[] = Array.isArray(item) ? item : [item];
            await deletePersisted(item);
            setItems(
                items.filter(
                    currentItem =>
                        !values
                            .map(i => String(i[cacheId]))
                            .includes((currentItem[cacheId] as ToString).toString()),
                ),
            );
        },
        async clear() {
            await storageEngine.clear();
            setItems([]);
        },
        subscribe(observable) {
            observers.push(observable);
            return () => {
                let idx = observers.indexOf(observable);
                delete observers[idx];
            };
        },
    };

    if (initialValue !== undefined && collection.isEmpty) {
        collection.add(initialValue);
    }

    return collection;
}
