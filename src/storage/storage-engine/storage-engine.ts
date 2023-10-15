/** @private */
export function prefixKey(prefix: string, key: string): string {
    return key.startsWith(`${prefix}:`) ? key : `${prefix}:${key}`;
}

/** @private */
export async function clearAll(keys: () => Promise<string[]>, del: (key: string) => Promise<void>) {
    for (let key of await keys()) {
        await del(key);
    }
}

const utils = {
    prefixKey,
    clearAll,
};

export type Utilities = typeof utils;

export type StorageValue = null | string | number | boolean | object;

export type StorageEngine<Item extends StorageValue> = {
    keys(): Promise<string[]>;

    get(): Promise<Item[]>;
    get(key: string): Promise<Item | null>;

    set(key: string, value: Item): Promise<void>;

    delete(key: string): Promise<void>;
    clear(): Promise<void>;
};

export function defineStorageEngine<Options>(
    builder: (options: Options, utilities: Utilities) => StorageEngine<StorageValue>,
): <Item extends StorageValue>(options: Options) => StorageEngine<Item> {
    return (options: Options) => builder(options, utils) as StorageEngine<any>;
}
