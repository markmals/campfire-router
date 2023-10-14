import { html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { RouterProvider } from '../../router/router.js';
import type { RouteObject } from '../../router/types.js';
import { EffectElement } from '../../signals/signal-element.js';

import './routes/_contacts._index.js';
import {
    action as contactAction,
    loader as contactLoader,
} from './routes/_contacts.contact.$contactId.js';
import { action as destroyAction } from './routes/_contacts.contact.$contactId_.destroy.js';
import { action as rootAction, loader as rootLoader } from './routes/_contacts.js';

import '../../router/elements';
import './error.js';
import { displayContents } from './styles.js';

@customElement('contacts-app')
export class ContactsAppElement extends EffectElement {
    static styles = [displayContents];

    #provider: RouterProvider;
    #routes: RouteObject[] = [
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
                //     {
                //         path: 'contact/:contactId/edit',
                //         template: () => html`<contact-edit></contact-edit>`,
                //         loader: contactLoader,
                //         action: editAction,
                //     },
                {
                    path: 'contact/:contactId/destroy',
                    action: destroyAction,
                    errorTemplate: () => html`<contact-destroy-error></contact-destroy-error>`,
                },
            ],
        },
    ];

    constructor() {
        super();
        this.#provider = new RouterProvider(this, this.#routes);
    }

    render() {
        return this.#provider.outlet();
    }
}
