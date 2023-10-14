import { Router, type LoaderFunctionArgs } from '@campfirejs/router';
import { WatchedElement } from '@campfirejs/signals';
import { effect } from '@lit-labs/preact-signals';
import { css, html } from 'lit';
import { customElement, query } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { repeat } from 'lit/directives/repeat.js';
import { when } from 'lit/directives/when.js';
import { createContact, getContacts } from '~/lib/contacts';
import { sharedStyles } from '~/styles/styles';

export async function loader({ request }: LoaderFunctionArgs) {
    const url = new URL(request.url);
    const q = url.searchParams.get('q') ?? undefined;
    const contacts = await getContacts(q);
    return { contacts, q };
}

export async function action() {
    const contact = await createContact();
    return { contact };
}

@customElement('contacts-root')
export class ContactsRootElement extends WatchedElement {
    static styles = [
        sharedStyles,
        css`
            :host {
                display: flex;
                height: 100%;
                width: 100%;
            }

            #sidebar {
                width: 22rem;
                background-color: #f7f7f7;
                border-right: solid 1px #e3e3e3;
                display: flex;
                flex-direction: column;
            }

            #sidebar > * {
                padding-left: 2rem;
                padding-right: 2rem;
            }

            #sidebar h1 {
                font-size: 1rem;
                font-weight: 500;
                display: flex;
                align-items: center;
                margin: 0;
                padding: 1rem 2rem;
                border-top: 1px solid #e3e3e3;
                order: 1;
                line-height: 1;
            }

            #sidebar h1::before {
                content: url('/campfire.svg');
                margin-right: 0.5rem;
                position: relative;
                top: 1px;
            }

            #sidebar > div {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                padding-top: 1rem;
                padding-bottom: 1rem;
                border-bottom: 1px solid #e3e3e3;
            }

            #sidebar > div form {
                position: relative;
            }

            #sidebar > div form input[type='search'] {
                /* width: 100%; */
                padding-left: 2rem;
                background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' class='h-6 w-6' fill='none' viewBox='0 0 24 24' stroke='%23999' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' /%3E%3C/svg%3E");
                background-repeat: no-repeat;
                background-position: 0.625rem 0.75rem;
                background-size: 1rem;
                position: relative;
            }

            #sidebar > div form input[type='search'].loading {
                background-image: none;
            }

            #search-spinner {
                width: 1rem;
                height: 1rem;
                background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24'%3E%3Cpath stroke='%23000' strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M20 4v5h-.582m0 0a8.001 8.001 0 00-15.356 2m15.356-2H15M4 20v-5h.581m0 0a8.003 8.003 0 0015.357-2M4.581 15H9' /%3E%3C/svg%3E");
                animation: spin 1s infinite linear;
                position: absolute;
                left: 0.625rem;
                top: 0.75rem;
            }

            @keyframes spin {
                from {
                    transform: rotate(0deg);
                }
                to {
                    transform: rotate(360deg);
                }
            }

            #sidebar nav {
                flex: 1;
                overflow: auto;
                padding-top: 1rem;
            }

            #sidebar nav a span {
                float: right;
                color: #eeb004;
            }
            #sidebar nav a.active span {
                color: inherit;
            }

            i {
                color: #818181;
            }
            #sidebar nav .active i {
                color: inherit;
            }

            #sidebar ul {
                padding: 0;
                margin: 0;
                list-style: none;
            }

            #sidebar li {
                margin: 0.25rem 0;
            }

            #sidebar nav a {
                display: flex;
                align-items: center;
                justify-content: space-between;
                overflow: hidden;

                /* white-space: pre; */
                padding: 0.5rem;
                border-radius: 8px;
                color: inherit;
                text-decoration: none;
                gap: 1rem;
            }

            #sidebar nav a:hover {
                background: #e3e3e3;
            }

            #sidebar nav a.active {
                background: hsl(224, 98%, 58%);
                color: white;
            }

            #sidebar nav a.pending {
                color: hsl(224, 98%, 58%);
            }

            #detail {
                flex: 1;
                padding: 2rem 4rem;
                width: 100%;
            }

            #detail.loading {
                opacity: 0.25;
                transition: opacity 200ms;
                transition-delay: 200ms;
            }
        `,
    ];

    #router = new Router(this);

    get navigation() {
        return this.#router.navigation;
    }

    get data() {
        return this.#router.loaderData as Awaited<ReturnType<typeof loader>>;
    }

    submit = this.#router.submit;
    navigate = this.#router.navigate;

    get searching() {
        return (
            (this.navigation.location &&
                new URLSearchParams(this.navigation.location.search).has('q')) ??
            false
        );
    }

    @query('#q')
    accessor searchInput!: HTMLInputElement;

    #dispose: () => void = () => {};
    connectedCallback() {
        super.connectedCallback();
        this.#dispose = effect(() => {
            const query = this.data.q ?? '';
            if (this.searchInput) {
                this.searchInput.value = query;
            }
        });
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this.#dispose();
    }

    render() {
        return html`
            <div id="sidebar">
                <h1>Campfire Contacts</h1>
                <div>
                    <form id="search-form" action="/" role="search" ${this.#router.enhanceForm()}>
                        <input
                            aria-label="Search contacts"
                            class="${classMap({ loading: this.searching })}"
                            id="q"
                            name="q"
                            value="${this.data.q ?? ''}"
                            @input="${this.#onInput}"
                            placeholder="Search"
                            type="search"
                        />
                        <div
                            aria-hidden="${!this.searching}"
                            ?hidden="${!this.searching}"
                            id="search-spinner"
                        ></div>
                        <div aria-live="polite" class="sr-only"></div>
                    </form>
                    <form method="post" action="/" ${this.#router.enhanceForm()}>
                        <button type="submit">New</button>
                    </form>
                </div>
                <nav>
                    ${when(
                        this.data.contacts.length,
                        () => html`
                            <ul>
                                ${repeat(
                                    this.data.contacts,
                                    contact => contact.id,
                                    contact => html`
                                        <li>
                                            <a
                                                href="${`/contact/${contact.id}`}"
                                                class="${classMap({
                                                    active: this.#router.isActive(
                                                        `/contact/${contact.id}`,
                                                    ),
                                                    pending: this.#router.isPending(
                                                        `/contact/${contact.id}`,
                                                    ),
                                                })}"
                                                ${this.#router.enhanceLink()}
                                            >
                                                ${when(
                                                    contact.first || contact.last,
                                                    () => html`${contact.first} ${contact.last}`,
                                                    () => html`<i>No Name</i>`,
                                                )}
                                                ${when(
                                                    contact.favorite,
                                                    () => html`<span class="star">★</span>`,
                                                )}
                                            </a>
                                        </li>
                                    `,
                                )}
                            </ul>
                        `,
                        () => html`
                            <p>
                                <i>No contacts</i>
                            </p>
                        `,
                    )}
                </nav>
            </div>
            <div class="${classMap({ loading: this.navigation.state !== 'idle' })}" id="detail">
                ${this.#router.outlet()}
            </div>
        `;
    }

    #onInput = (event: InputEvent & { currentTarget: HTMLInputElement }) => {
        console.log(event.currentTarget.value);
        // FIXME: This isn't rendering correctly, causes stutters every time you type
        // Remove empty query params when value is empty
        if (!event.currentTarget.value) {
            this.navigate('/');
            return;
        }

        const isFirstSearch = this.data.q === null;
        this.submit(event.currentTarget.form, { replace: !isFirstSearch });
        // this.navigate(`/?q=${event.currentTarget.value}`, { replace: !isFirstSearch });
    };
}
