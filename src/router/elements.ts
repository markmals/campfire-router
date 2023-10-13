import type { ReadonlySignal } from '@lit-labs/preact-signals';
import { SignalWatcher, computed, signal } from '@lit-labs/preact-signals';
import { ContextProvider } from '@lit/context';
import { isRouteErrorResponse, type Router, type RouterState } from '@remix-run/router';
import type { TemplateResult } from 'lit';
import { LitElement, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { when } from 'lit/directives/when.js';
import { routeContext, routeErrorContext, routerContext } from './context';
import { RouterController } from './router-controller';
import type { DataRouteMatch, IRouteContext } from './types';

@customElement('router-provider')
export class RouterProvider extends SignalWatcher(LitElement) {
    @property({ attribute: false })
    accessor router!: Router;

    @property({ attribute: false })
    accessor fallback!: TemplateResult<1>;

    #state = signal<RouterState>(undefined!);
    #unsubscribe: (() => void) | undefined = undefined;

    #provider = new ContextProvider(this, { context: routerContext });

    connectedCallback() {
        super.connectedCallback();
        this.#state.value = this.router.state;
        this.#unsubscribe = this.router.subscribe(state => (this.#state.value = state));
        this.#provider.setValue({ router: this.router, state: this.#state });
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this.#unsubscribe!();
    }

    render() {
        if (!this.#state.value.initialized) {
            return this.fallback ? this.fallback : html`<span></span>`;
        }

        return outletImpl(
            {
                state: this.#state,
                routeError: () => {},
            },
            { root: true },
        );
    }
}

@customElement('router-outlet')
export class RouterOutlet extends SignalWatcher(LitElement) {
    #controller = new RouterController(this);

    render() {
        return outletImpl({
            state: this.#controller.state,
            routeContext: this.#controller.routeContext,
            routeError: () => this.#controller.routeError.value,
        });
    }
}

@customElement('error-boundary')
export class ErrorBoundary extends SignalWatcher(LitElement) {
    @property({ attribute: false })
    accessor errorTemplate!: TemplateResult;

    @property({ attribute: false })
    accessor error!: unknown;

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

    #provider = new ContextProvider(this, { context: routeErrorContext });

    connectedCallback() {
        super.connectedCallback();

        // this.#dispose = effect(() => {
        //     if (this.#error.value) {
        //         console.error(this.#error.value);
        //     }
        // });

        window.addEventListener('error', this.#errorCallback);
        window.addEventListener('unhandledrejection', this.#rejectionCallback);

        this.#provider.setValue({ error: this.#error });
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        window.removeEventListener('error', this.#errorCallback);
        window.removeEventListener('unhandledrejection', this.#rejectionCallback);
        this.#dispose();
    }

    render() {
        return when(
            this.#error.value,
            () => this.errorTemplate,
            () => html`<slot></slot>`,
        );
    }
}

@customElement('route-wrapper')
export class RouteWrapper extends SignalWatcher(LitElement) {
    @property({ attribute: false })
    accessor routeId!: ReadonlySignal<string>;

    @property({ attribute: false })
    accessor index!: boolean;

    #controller = new RouterController(this);
    #provider = new ContextProvider(this, { context: routeContext });

    get routeMatches() {
        return this.#controller.state.value.matches.slice(
            0,
            this.#controller.state.value.matches.findIndex(m => m.route.id === this.id) + 1,
        );
    }

    connectedCallback() {
        super.connectedCallback();
        this.#provider.setValue({
            id: this.routeId,
            index: this.index,
            matches: this.routeMatches,
        });
    }

    render() {
        return html`<slot></slot>`;
    }
}

function outletImpl(
    {
        routeContext,
        state,
        routeError,
    }: {
        routeContext?: IRouteContext;
        state: ReadonlySignal<RouterState>;
        routeError: () => unknown;
    },
    { root }: { root: boolean } = { root: false },
): TemplateResult {
    const routeCtx = root ? null : routeContext;
    const idx = state.value.matches.findIndex(m => m.route.id === routeCtx?.id.value);
    const matchToRender = state.value.matches[idx + 1];
    const error = (
        state.value.errors?.[matchToRender.route.id] != null
            ? Object.values(state.value.errors)[0]
            : null
    ) as unknown;
    const match = matchToRender as DataRouteMatch;

    if (idx < 0 && !root) {
        throw new Error(
            `Unable to find <router-outlet> match for route id: ${routeCtx?.id || '_root_'}`,
        );
    }

    return html`
        ${when(
            match,
            () => html`
                <route-wrapper
                    .routeId="${computed(() => state.value.matches[idx + 1]?.route.id)}"
                    .index="${match.route.index === true}"
                >
                    ${when(
                        root || error || match.route.errorTemplate,
                        () => html`
                            <error-boundary
                                .errorTemplate="${match.route.errorTemplate?.() ||
                                defaultErrorTemplate(routeError())}"
                                .error="${error}"
                            >
                                ${match.route.template?.()}
                            </error-boundary>
                        `,
                        () => match.route.template?.(),
                    )}
                </route-wrapper>
            `,
            () =>
                // We found an Outlet() but do not have deeper matching paths so we
                // end the render tree here
                nothing,
        )}
    `;
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
