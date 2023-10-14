import { matchSorter } from 'match-sorter';
import { createCollection } from '../../collection/collection.js';
import { IndexedDBStorageEngine } from '../../collection/storage-engine/idb-storage-engine.js';

export interface IContact {
    id: string;
    first?: string;
    last?: string;
    avatar?: string;
    mastodon?: string;
    notes?: string;
    favorite: boolean;
    createdAt?: number;
}

export const defaultContacts: IContact[] = [
    {
        id: '0',
        first: 'Vivian',
        last: 'Chou',
        avatar: 'https://i.imgur.com/9kzTyn7.jpg',
        mastodon: '@vivian@sparklerjs.dev',
        favorite: true,
        createdAt: Date.now(),
    },
    {
        id: '1',
        first: 'Priya',
        last: 'Shah',
        avatar: 'https://i.imgur.com/35TQppC.jpg',
        mastodon: '@priya@sparklerjs.dev',
        favorite: false,
        createdAt: Date.now(),
    },
    {
        id: '2',
        first: 'Tania',
        last: 'Castillo',
        avatar: 'https://i.imgur.com/t1MXkoL.jpg',
        mastodon: '@tania@sparklerjs.dev',
        favorite: false,
        createdAt: Date.now(),
    },
    {
        id: '3',
        first: 'Andre',
        last: 'Lorico',
        avatar: 'https://i.imgur.com/teExVnJ.jpg',
        mastodon: '@andre@sparklerjs.dev',
        favorite: true,
        createdAt: Date.now(),
    },
    {
        id: '4',
        first: 'Sam',
        last: 'Denis',
        avatar: 'https://i.imgur.com/jK0zHfm.jpg',
        mastodon: '@sam@sparklerjs.dev',
        favorite: false,
        createdAt: Date.now(),
    },
    {
        id: '5',
        first: 'Albert',
        last: 'Puig',
        avatar: 'https://i.imgur.com/Jy3Hbr6.jpg',
        mastodon: '@albert@sparklerjs.dev',
        favorite: false,
        createdAt: Date.now(),
    },
];

const contactsCollection = await createCollection<IContact>({
    storage: new IndexedDBStorageEngine('campfire-contacts'),
    initialValue: defaultContacts,
});

export async function getContacts(query?: string) {
    await fakeNetwork(`getContacts:${query}`);
    const contacts = contactsCollection.items ?? [];
    return matchSorter(contacts, query ?? '', {
        keys: ['last', 'first', 'createdAt'],
    });
}

export async function createContact() {
    await fakeNetwork();
    let id = Math.random().toString(36).substring(2, 9);
    let contact = { id, createdAt: Date.now(), favorite: false };
    await contactsCollection.add(contact);
    return contact;
}

export async function getContact(id: string) {
    await fakeNetwork(`contact:${id}`);
    const contacts = contactsCollection.items ?? [];
    const contact = contacts.find(contact => contact.id === id) ?? null;
    return contact;
}

export async function updateContact(id: string, updates: Partial<IContact>) {
    await fakeNetwork();
    const contacts = contactsCollection.items ?? [];
    const contact = contacts.find(contact => contact.id === id);
    if (contact === undefined) {
        throw new Error(`No contact found for ${id}.`);
    }
    Object.assign(contact, updates);
    await contactsCollection.add(contact);
    return contact;
}

export async function deleteContact(id: string) {
    await fakeNetwork();
    const contacts = contactsCollection.items ?? [];
    let contact = contacts.find(contact => contact.id === id);
    if (contact) {
        await contactsCollection.delete(contact);
    }
}

let fakeCache: Record<string, boolean> = {};

async function fakeNetwork(key?: string) {
    if (!key) {
        fakeCache = {};
    }
    if (key && fakeCache[key]) {
        return;
    }
    if (key) {
        fakeCache[key] = true;
    }
    return new Promise(res => {
        setTimeout(res, Math.random() * 800);
    });
}