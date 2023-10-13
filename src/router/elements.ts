import type { ReadonlySignal } from '@lit-labs/preact-signals';
import { SignalWatcher, signal } from '@lit-labs/preact-signals';
import { ContextProvider } from '@lit/context';
import { isRouteErrorResponse } from '@remix-run/router';
import { LitElement, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { when } from 'lit/directives/when.js';
import { routeContext, routeErrorContext } from './context';
import { Router } from './router-controller';
import type { DataRouteMatch } from './types';

@customElement('route-wrapper')
export class RouteWrapper extends SignalWatcher(LitElement) {
    @property({ attribute: false })
    @state()
    accessor routeId!: ReadonlySignal<string>;

    @property({ attribute: false })
    @state()
    accessor match!: DataRouteMatch;

    @property({ attribute: false })
    @state()
    accessor routeError!: unknown;

    @property({ attribute: false })
    @state()
    accessor error!: unknown;

    @property({ attribute: false })
    @state()
    accessor root!: boolean;

    #controller = new Router(this);
    #routeProvider = new ContextProvider(this, { context: routeContext });
    #errorProvider = new ContextProvider(this, { context: routeErrorContext });

    #error = signal(this.error);
    #dispose = () => {};

    #errorCallback = (event: ErrorEvent) => {
        // event.preventDefault();
        this.#error.value = event.error;
    };

    #rejectionCallback = (event: PromiseRejectionEvent) => {
        // event.preventDefault();
        this.#error.value = event.reason;
    };

    get index() {
        return this.match.route.index === true;
    }

    get routeMatches() {
        return this.#controller.routeMatches(this.routeId.value);
    }

    connectedCallback() {
        super.connectedCallback();
        this.#routeProvider.setValue({
            id: this.routeId,
            index: this.index,
            matches: this.routeMatches,
        });

        // this.#dispose = effect(() => {
        //     if (this.#error.value) {
        //         console.error(this.#error.value);
        //     }
        // });

        window.addEventListener('error', this.#errorCallback);
        window.addEventListener('unhandledrejection', this.#rejectionCallback);

        this.#errorProvider.setValue({ error: this.#error });
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        window.removeEventListener('error', this.#errorCallback);
        window.removeEventListener('unhandledrejection', this.#rejectionCallback);
        this.#dispose();
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
