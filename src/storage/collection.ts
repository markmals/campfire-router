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

export type Collection<Item extends object> = EventTarget & {
    get items(): Item[];
    get isEmpty(): boolean;
    add(item: Item | Item[]): Promise<void>;
    delete(item: Item | Item[]): Promise<void>;
    clear(): Promise<void>;
    addEventListener(
        type: 'items-changed',
        callback:
            | ((event: CollectionEvent<Item>) => void)
            | {
                  handleEvent(object: CollectionEvent<Item>): void;
              }
            | null,
        options?: boolean | AddEventListenerOptions | undefined,
    ): void;
};

export class CollectionEvent<Item extends object> extends Event {
    items: Item[];

    constructor(items: Item[]) {
        super('items-changed');
        this.items = items;
    }
}

export async function createCollection<Item extends object>(
    options: CollectionOptions<Item>,
): Promise<Collection<Item>> {
    const {
        initialValue,
        storage: storageEngine,
        cacheIdentifier,
    } = options as _CollectionOptions<Item>;
    const cacheId = cacheIdentifier || ('id' as keyof Item);

    let items: Item[] = [];

    const collection = new (class extends EventTarget {
        get items() {
            return items;
        }

        #setItems(newValue: Item[]) {
            items = newValue;
            super.dispatchEvent(new CollectionEvent(newValue));
        }

        get isEmpty() {
            return this.items.length === 0;
        }

        async add(item: Item | Item[]) {
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
                for (let currentItem of this.items) {
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
                await this.#persist(Array.from(addedItemsMap.values()));
            } else {
                let identifier = (item[cacheId] as ToString).toString();

                for (let currentItem of this.items) {
                    currentValuesMap.set(
                        (currentItem[cacheId] as ToString).toString(),
                        currentItem,
                    );
                }

                currentValuesMap.set(identifier, item);

                // We persist only the newly added item, rather than rewriting all of the items
                await this.#persist(item);
            }

            this.#setItems(Array.from(currentValuesMap.values()));
        }

        async delete(item: Item | Item[]) {
            let values: Item[] = Array.isArray(item) ? item : [item];
            await this.#deletePersisted(item);
            this.#setItems(
                this.items.filter(
                    currentItem =>
                        !values
                            .map(i => String(i[cacheId]))
                            .includes((currentItem[cacheId] as ToString).toString()),
                ),
            );
        }

        async clear() {
            await storageEngine.clear();
            this.#setItems([]);
        }

        async #persist(item: Item | Item[]) {
            if (Array.isArray(item)) {
                let items = item;
                for (const item of items) {
                    await this.#persist(item);
                }
            } else {
                let identifier = (item[cacheId] as ToString).toString();
                await storageEngine.set(identifier, item);
            }
        }

        async #deletePersisted(item: Item | Item[]) {
            if (Array.isArray(item)) {
                let items = item;
                for (const item of items) {
                    await this.#deletePersisted(item);
                }
            } else {
                let identifier = (item[cacheId] as ToString).toString();
                await storageEngine.delete(identifier);
            }
        }

        override dispatchEvent(_event: Event): boolean {
            throw new Error('Cannot externally dispatch event on Collection');
        }
    })();

    // Populate the state with any existing database data
    let existingItems = await storageEngine.get();
    if (existingItems) {
        items = existingItems;
    }

    if (initialValue !== undefined && collection.isEmpty) {
        collection.add(initialValue);
    }

    return collection;
}
