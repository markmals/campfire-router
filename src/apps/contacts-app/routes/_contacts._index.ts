import { LitElement, css, html } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('contacts-splash')
export class ContactsSplashElement extends LitElement {
    static styles = [
        css`
            :host {
                margin: 2rem;
                text-align: center;
                color: #818181;
            }

            :host:before {
                display: block;
                margin-bottom: 0.5rem;
                content: url('/campfire-hero.svg');
            }

            a {
                color: inherit;
            }

            a:hover {
                color: #121212;
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
