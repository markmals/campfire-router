import type { ActionFunctionArgs } from '@campfirejs/router';
import { redirect } from '@campfirejs/router';
import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { deleteContact } from '~/lib/contacts';

export async function action({ params }: ActionFunctionArgs) {
    await deleteContact(params.contactId!);
    return redirect('/');
}

@customElement('contact-destroy-error')
export class DestroyErrorElement extends LitElement {
    render() {
        return html`<div>Oops! There was an error.</div>`;
    }
}
