import { Router, redirect, type ActionFunctionArgs } from '@campfirejs/router';
import { WatchedElement } from '@campfirejs/signals';
import { css, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { updateContact } from '~/lib/contacts';
import { sharedStyles } from '~/styles/styles';
import type { loader } from './_contacts.contact.$contactId';

export async function action({ request, params }: ActionFunctionArgs) {
    const formData = await request.formData();
    const updates = Object.fromEntries(formData);
    await updateContact(params.contactId!, updates);
    return redirect(`/contact/${params.contactId}`);
}

@customElement('contact-edit')
export class EditContactElement extends WatchedElement {
    static styles = [
        sharedStyles,
        css`
            form {
                display: flex;
                max-width: 40rem;
                flex-direction: column;
                gap: 1rem;
            }

            form > p:first-child {
                margin: 0;
                padding: 0;
            }

            form > p:first-child > :nth-child(2) {
                margin-right: 1rem;
            }

            form > p:first-child,
            form label {
                display: flex;
            }

            form p:first-child span,
            form label span {
                width: 8rem;
            }

            form p:first-child input,
            form label input,
            form label textarea {
                flex-grow: 2;
            }

            form p:last-child {
                display: flex;
                gap: 0.5rem;
                margin: 0 0 0 8rem;
            }

            form p:last-child button[type='button'] {
                color: inherit;
            }
        `,
    ];

    #router = new Router(this);

    get contact() {
        return (this.#router.loaderData as Awaited<ReturnType<typeof loader>>).contact;
    }

    navigate = this.#router.navigate;

    render() {
        return html`
            <form method="post" ${this.#router.enhanceForm()}>
                <p>
                    <span>Name</span>
                    <input
                        aria-label="First name"
                        .value="${this.contact.first ?? ''}"
                        name="first"
                        placeholder="First"
                        type="text"
                    />
                    <input
                        aria-label="Last name"
                        .value="${this.contact.last ?? ''}"
                        name="last"
                        placeholder="Last"
                        type="text"
                    />
                </p>
                <label>
                    <span>Mastodon</span>
                    <input
                        .value="${this.contact.mastodon ?? ''}"
                        name="mastodon"
                        placeholder="@Gargron@mastodon.social"
                        type="text"
                    />
                </label>
                <label>
                    <span>Avatar URL</span>
                    <input
                        aria-label="Avatar URL"
                        .value="${this.contact.avatar ?? ''}"
                        name="avatar"
                        placeholder="https://example.com/avatar.jpg"
                        type="text"
                    />
                </label>
                <label>
                    <span>Notes</span>
                    <textarea .value="${this.contact.notes ?? ''}" name="notes" rows="6"></textarea>
                </label>
                <p>
                    <button type="submit">Save</button>
                    <button @click="${() => this.navigate(-1)}" type="button">Cancel</button>
                </p>
            </form>
        `;
    }
}
