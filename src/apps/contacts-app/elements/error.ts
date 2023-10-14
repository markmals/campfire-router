/* eslint-disable @typescript-eslint/no-explicit-any */
import { Router } from '@campfirejs/router';
import { WatchedElement } from '@campfirejs/signals';
import { css, html } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('contacts-error')
export class ErrorElement extends WatchedElement {
    static styles = [
        css`
            :host {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                width: 100%;
            }
        `,
    ];

    #router = new Router(this);

    get #error() {
        return this.#router.routeError as any;
    }

    render() {
        console.error(this.#error);
        return html`
            <h1>Oops!</h1>
            <p>Sorry, an unexpected error has occurred.</p>
            <p>
                <i>${this.#error.statusText || this.#error.message}</i>
            </p>
        `;
    }
}
