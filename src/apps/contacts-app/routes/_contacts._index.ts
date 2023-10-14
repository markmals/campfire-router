import { WatchedElement } from '@campfirejs/signals';
import { css, html } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('contacts-splash')
export class ContactsSplashElement extends WatchedElement {
    static styles = [
        css`
            :host {
                margin: 2rem;
                text-align: center;
                color: #818181;
            }

            :host a {
                color: inherit;
            }

            :host a:hover {
                color: #121212;
            }

            :host:before {
                display: block;
                margin-bottom: 0.5rem;
                content: url('/campfire-hero.svg');
            }
        `,
    ];

    render() {
        return html`
            <p>
                This is a demo for Campfire Router.
                <br />
                Check out
                <a href="https://campfirejs.dev/router"> the docs at campfirejs.dev</a>.
            </p>
        `;
    }
}
