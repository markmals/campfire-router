/* eslint-disable @typescript-eslint/no-explicit-any */
import { Router } from '@campfirejs/router';
import { LitElement, css, html } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('contacts-error')
export class ErrorElement extends LitElement {
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

    router = new Router(this);

    get #routeError() {
        return this.router.routeError as any;
    }

    get #error() {
        return this.#routeError?.statusText || this.#routeError?.message;
    }

    render() {
        return html`
            <h1>Oops!</h1>
            <p>Sorry, an unexpected error has occurred.</p>
            <p>
                <i>${this.#error}</i>
            </p>
        `;
    }
}
