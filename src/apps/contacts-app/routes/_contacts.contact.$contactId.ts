import type { ActionFunctionArgs, LoaderFunctionArgs } from '@campfirejs/router';
import { Router } from '@campfirejs/router';
import { LitElement, css, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { when } from 'lit/directives/when.js';
import { getContact, updateContact } from '~/lib/contacts';
import { sharedStyles } from '~/styles/styles';

export async function loader({ params }: LoaderFunctionArgs) {
    const contact = await getContact(params.contactId!);

    if (!contact) {
        throw new Response('', {
            status: 404,
            statusText: 'Not Found',
        });
    }

    return { contact };
}

export async function action({ request, params }: ActionFunctionArgs) {
    const formData = await request.formData();
    await updateContact(params.contactId!, {
        favorite: formData.get('favorite') === 'true',
    });
    return null;
}

@customElement('contact-details')
export class ContactDetailsElement extends LitElement {
    static styles = [
        sharedStyles,
        css`
            :host {
                max-width: 40rem;
                display: flex;
            }

            h1 {
                display: flex;
                align-items: flex-start;
                gap: 1rem;
            }

            h1 form {
                display: flex;
                align-items: center;
                margin-top: 0.25rem;
            }

            h1 {
                font-size: 2rem;
                font-weight: 700;
                margin: 0;
                line-height: 1.2;
            }

            h1 + p {
                margin: 0;
            }

            h1 + p + p {
                white-space: break-spaces;
            }

            h1:focus {
                outline: none;
                color: hsl(224, 98%, 58%);
            }

            a[href*='mastodon'] {
                display: flex;
                font-size: 1.5rem;
                color: #3992ff;
                text-decoration: none;
            }

            a[href*='mastodon']:hover {
                text-decoration: underline;
            }

            img {
                width: 12rem;
                height: 12rem;
                background: #c8c8c8;
                margin-right: 2rem;
                border-radius: 1.5rem;
                object-fit: cover;
            }

            h1 ~ div {
                display: flex;
                gap: 0.5rem;
                margin: 1rem 0;
            }

            form[action$='destroy'] button {
                color: #f44250;
            }
        `,
    ];

    router = new Router(this);

    get data() {
        return this.router.loaderData as Awaited<ReturnType<typeof loader>>;
    }

    get contact() {
        return this.data.contact ?? {};
    }

    get avatarURL() {
        return this.contact.avatar
            ? this.contact.avatar
            : 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png';
    }

    get socialURL() {
        return `https://mastodon.social/${
            this.contact.mastodon?.replace('@mastodon.social', '') ?? ''
        }`;
    }

    render() {
        return html`
            <div>
                <img
                    alt="${this.contact.first} ${this.contact.last} avatar"
                    src="${this.avatarURL}"
                />
            </div>

            <div>
                <h1>
                    ${when(
                        this.contact.first || this.contact.last,
                        () => `${this.contact.first} ${this.contact.last}`,
                        () => html`<i>No Name</i>`,
                    )}
                    <contact-favorite .favorite="${this.contact.favorite!}"></contact-favorite>
                </h1>

                ${when(
                    this.contact.mastodon,
                    () => html`
                        <p>
                            <a href="${this.socialURL}" rel="noreferrer" target="_blank">
                                ${this.contact.mastodon}
                            </a>
                        </p>
                    `,
                )}
                ${when(this.contact.notes, () => html`<p>${this.contact.notes}</p>`)}

                <div>
                    <form
                        action="${`contact/${this.contact.id}/edit`}"
                        ${this.router.enhanceForm()}
                    >
                        <button type="submit">Edit</button>
                    </form>
                    <form
                        action="${`contact/${this.contact.id}/destroy`}"
                        method="post"
                        @submit="${this.onSubmit}"
                        ${this.router.enhanceForm()}
                    >
                        <button type="submit">Delete</button>
                    </form>
                </div>
            </div>
        `;
    }

    onSubmit(event: SubmitEvent) {
        if (!confirm('Please confirm you want to delete this record.')) {
            event.preventDefault();
        }
    }
}
