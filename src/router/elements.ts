import { ContextProvider } from '@lit/context';
import { isRouteErrorResponse } from '@remix-run/router';
import { LitElement, css, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { when } from 'lit/directives/when.js';
import { routeContext, routeErrorContext, routeIdContext } from './context.js';
import { Router } from './router.js';
import type { DataRouteMatch } from './types.js';

@customElement('route-wrapper')
export class RouteWrapper extends LitElement {
    static styles = [
        css`
            :host {
                display: contents;
            }
        `,
    ];

    @state()
    accessor #routeId!: string;

    get routeId() {
        return this.#routeId;
    }

    @property({ attribute: false })
    set routeId(newValue: string) {
        this.#routeId = newValue;
        this.#routeIdProvider.setValue(newValue);
    }

    @property({ attribute: false })
    accessor match!: DataRouteMatch;

    @property({ attribute: false })
    accessor routeError!: unknown;

    @state()
    accessor #error: unknown;

    get error() {
        return this.#error;
    }

    @property({ attribute: false })
    set error(newValue: unknown) {
        this.#error = newValue;
        this.#errorProvider.setValue(newValue);
    }

    @property({ attribute: false })
    accessor root!: boolean;

    #router = new Router(this);

    #routeIdProvider = new ContextProvider(this, { context: routeIdContext });
    #routeProvider = new ContextProvider(this, { context: routeContext });
    #errorProvider = new ContextProvider(this, { context: routeErrorContext });

    #errorCallback = (event: ErrorEvent) => {
        event.preventDefault();
        this.error = event.error;
        console.error(this.error);
    };

    #rejectionCallback = (event: PromiseRejectionEvent) => {
        event.preventDefault();
        this.error = event.reason;
        console.error(this.error);
    };

    get index() {
        return this.match.route.index === true;
    }

    get routeMatches() {
        return this.#router.routeMatches(this.routeId);
    }

    connectedCallback() {
        super.connectedCallback();
        this.#routeIdProvider.setValue(this.routeId);
        this.#routeProvider.setValue({
            index: this.index,
            matches: this.routeMatches,
        });

        window.addEventListener('error', this.#errorCallback);
        window.addEventListener('unhandledrejection', this.#rejectionCallback);

        this.#errorProvider.setValue(this.error);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        window.removeEventListener('error', this.#errorCallback);
        window.removeEventListener('unhandledrejection', this.#rejectionCallback);
    }

    render() {
        return when(
            this.root || this.error || this.match.route.errorTemplate,
            () =>
                when(
                    this.error,
                    () =>
                        this.match.route.errorTemplate?.() || defaultErrorTemplate(this.routeError),
                    () => this.match.route.template?.(),
                ),
            () => this.match.route.template?.(),
        );
    }
}

const defaultErrorTemplate = (routeError: unknown) => {
    const message = () => {
        const err = routeError;
        return isRouteErrorResponse(err)
            ? `${err.status} ${err.statusText}`
            : err instanceof Error
            ? err.message
            : JSON.stringify(err);
    };

    const stack = () => {
        const err = routeError;
        return err instanceof Error ? err.stack : undefined;
    };

    const lightgrey = 'rgba(200,200,200, 0.5)';
    const preStyles = `padding: 0.5rem; background-color: ${lightgrey}`;
    const codeStyles = `padding: 2px 4px; background-color: ${lightgrey}`;

    return html`
        <h2>Unhandled Thrown Error!</h2>
        <h3 style="font-style: italic">${message()}</h3>
        <!-- FIXME: This error stack is never showing up -->
        ${stack() ? html`<pre style="${preStyles}">${stack()}</pre>` : nothing}
        <p>💿 Hey developer 👋</p>
        <p>
            You can provide a way better UX than this when your app throws errors by providing your
            own <code style="${codeStyles}">ErrorBoundary</code> props on your routes.
        </p>
    `;
};
