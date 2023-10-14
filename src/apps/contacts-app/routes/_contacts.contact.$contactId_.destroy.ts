import { WatchedElement } from '@campfirejs/signals';
import type { ActionFunctionArgs } from '@remix-run/router';
import { redirect } from '@remix-run/router';
import { html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { deleteContact } from '~/lib/data';

export async function action({ params }: ActionFunctionArgs) {
    await deleteContact(params.contactId!);
    return redirect('/');
}

@customElement('contact-destroy-error')
export class DestroyErrorElement extends WatchedElement {
    render() {
        return html`<div>Oops! There was an error.</div>`;
    }
}
