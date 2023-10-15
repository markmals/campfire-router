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

            :host h1 {
                display: flex;
                align-items: flex-start;
                gap: 1rem;
            }
            :host h1 form {
                display: flex;
                align-items: center;
                margin-top: 0.25rem;
            }

            :host h1 {
                font-size: 2rem;
                font-weight: 700;
                margin: 0;
                line-height: 1.2;
            }

            :host h1 + p {
                margin: 0;
            }

            :host h1 + p + p {
                white-space: break-spaces;
            }

            :host h1:focus {
                outline: none;
                color: hsl(224, 98%, 58%);
            }

            :host a[href*='mastodon'] {
                display: flex;
                font-size: 1.5rem;
                color: #3992ff;
                text-decoration: none;
            }
            :host a[href*='mastodon']:hover {
                text-decoration: underline;
            }

            :host img {
                width: 12rem;
                height: 12rem;
                background: #c8c8c8;
                margin-right: 2rem;
                border-radius: 1.5rem;
                object-fit: cover;
            }

            :host h1 ~ div {
                display: flex;
                gap: 0.5rem;
                margin: 1rem 0;
            }
        `,
    ];

    router = new Router(this);

    get contact() {
        return (this.router.loaderData as Awaited<ReturnType<typeof loader>>)?.contact ?? {};
    }

    render() {
        return html`
            <div>
                <img
                    alt=""
                    src="${this.contact.avatar
                        ? this.contact.avatar
                        : 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png'}"
                />
            </div>

            <div>
                <h1>
                    ${when(
                        this.contact.first || this.contact.last,
                        () => html`${this.contact.first} ${this.contact.last}`,
                        () => html`<i>No Name</i>`,
                    )}
                    <contact-favorite .favorite="${this.contact.favorite!}"></contact-favorite>
                </h1>

                ${when(
                    this.contact.mastodon,
                    () => html`
                        <p>
                            <a
                                href=${`https://mastodon.social/${this.contact.mastodon!.replace(
                                    '@mastodon.social',
                                    '',
                                )}`}
                                rel="noreferrer"
                                target="_blank"
                            >
                                ${this.contact.mastodon}
                            </a>
                        </p>
                    `,
                )}
                ${when(this.contact.notes, () => html`<p>${this.contact.notes}</p>`)}

                <div>
                    <form action=${`contact/${this.contact.id}/edit`} ${this.router.enhanceForm()}>
                        <button type="submit">Edit</button>
                    </form>
                    <form
                        action=${`contact/${this.contact.id}/destroy`}
                        method="post"
                        @submit=${(event: SubmitEvent) => {
                            if (!confirm('Please confirm you want to delete this record.')) {
                                event.preventDefault();
                            }
                        }}
                        ${this.router.enhanceForm()}
                    >
                        <button type="submit">Delete</button>
                    </form>
                </div>
            </div>
        `;
    }
}
