import { html } from 'lit';
import { customElement } from 'lit/decorators.js';

import type { RouteObject } from '@campfirejs/router';
import { RouterProvider } from '@campfirejs/router';
import { WatchedElement } from '@campfirejs/signals';

import { displayContents } from './styles/styles';

import { action as rootAction, loader as rootLoader } from './routes/_contacts';
import './routes/_contacts._index';
import {
    action as contactAction,
    loader as contactLoader,
} from './routes/_contacts.contact.$contactId';
import { action as destroyAction } from './routes/_contacts.contact.$contactId_.destroy';
import { action as editAction } from './routes/_contacts.contact.$contactId_.edit';

import './elements/contact-favorite';
import './elements/error';

const routes: RouteObject[] = [
    {
        path: '/',
        action: rootAction,
        loader: rootLoader,
        template: () => html`<contacts-root></contacts-root>`,
        errorTemplate: () => html`<contacts-error></contacts-error>`,
        children: [
            {
                index: true,
                template: () => html`<contacts-splash></contacts-splash>`,
            },
            {
                path: 'contact/:contactId',
                template: () => html`<contact-details></contact-details>`,
                loader: contactLoader,
                action: contactAction,
            },
            {
                path: 'contact/:contactId/edit',
                template: () => html`<contact-edit></contact-edit>`,
                loader: contactLoader,
                action: editAction,
            },
            {
                path: 'contact/:contactId/destroy',
                action: destroyAction,
                errorTemplate: () => html`<contact-destroy-error></contact-destroy-error>`,
            },
        ],
    },
];

@customElement('contacts-app')
export class ContactsAppElement extends WatchedElement {
    static styles = [displayContents];
    #provider = new RouterProvider(this, routes);

    render() {
        return this.#provider.outlet();
    }
}
