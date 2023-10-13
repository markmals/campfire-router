import type { ReadonlySignal, Signal } from '@lit-labs/preact-signals';
import { computed, signal } from '@lit-labs/preact-signals';
import { ContextConsumer, ContextProvider } from '@lit/context';
import type { Fetcher, Path, RouterState, To } from '@remix-run/router';
import {
    createPath,
    resolveTo,
    type Location,
    type Navigation,
    type Action as NavigationType,
} from '@remix-run/router';
import type { TemplateResult } from 'lit';
import { html, isServer, nothing, type ReactiveController, type ReactiveElement } from 'lit';
import { when } from 'lit/directives/when.js';
import invariant from 'tiny-invariant';
import { routeContext, routeErrorContext, routerContext } from './context';
import { form, link } from './directives';
import { createBrowserRouter, createMemoryRouter } from './routers';
import type {
    CreateBrowserRouterOpts,
    CreateMemoryRouterOpts,
    DataRouteMatch,
    FetcherWithDirective,
    IRouteContext,
    IRouterContext,
    NavigateOptions,
    RouteObject,
} from './types';
import { createURL, getPathContributingMatches, submitImpl } from './utils';

let fetcherId = 0;

export class Router implements ReactiveController {
    #routerConsumer;
    #routeConsumer;
    #routeErrorConsumer;

    #disposables: (() => void)[] = [];
    #onCleanup(cleanupFunc: () => void) {
        this.#disposables.push(cleanupFunc);
    }

    constructor(host: ReactiveElement) {
        host.addController(this);
        this.#routerConsumer = new ContextConsumer(host, { context: routerContext });
        this.#routeConsumer = new ContextConsumer(host, { context: routeContext });
        this.#routeErrorConsumer = new ContextConsumer(host, { context: routeErrorContext });
    }

    hostDisconnected() {
        this.#disposables.forEach(dispose => dispose());
    }

    get #routerContext(): IRouterContext {
        invariant(this.#routerConsumer.value, 'No RouterContext available');
        return this.#routerConsumer.value;
    }

    get #routeContext(): IRouteContext {
        invariant(this.#routeConsumer.value, 'No RouteContext available');
        return this.#routeConsumer.value;
    }

    get #state() {
        return this.#routerContext.state;
    }

    get routeError(): unknown {
        return (
            this.#routeErrorConsumer.value?.error.value ||
            this.#state.value.errors?.[this.#routeContext.id.value]
        );
    }

    get navigationType(): NavigationType {
        return this.#state.value.historyAction;
    }

    get location(): Location {
        return this.#state.value.location;
    }

    get matches() {
        return this.#state.value.matches.map(match => ({
            id: match.route.id,
            pathname: match.pathname,
            params: match.params,
            data: this.#state.value.loaderData[match.route.id] as unknown,
            handle: match.route.handle as unknown,
        }));
    }

    get navigation(): Navigation {
        return this.#state.value.navigation;
    }

    routeLoaderData(routeId: string): unknown {
        return this.#state.value.loaderData[routeId];
    }

    get loaderData(): unknown {
        return this.routeLoaderData(this.#routeContext.id.value);
    }

    get actionData(): unknown {
        return this.#state.value.actionData?.[this.#routeContext.id.value];
    }

    resolvedPath = (to: To): ReadonlySignal<Path> =>
        computed(() =>
            resolveTo(
                to,
                getPathContributingMatches(this.#routeContext.matches).map(
                    match => match.pathnameBase,
                ),
                this.location.pathname,
            ),
        );

    href = (to: To): ReadonlySignal<string> =>
        computed(() =>
            this.#routerContext.router.createHref(
                createURL(this.#routerContext.router, createPath(this.resolvedPath(to).value)),
            ),
        );

    navigate = (to: To | number, options: NavigateOptions = {}) => {
        if (typeof to === 'number') {
            this.#routerContext.router.navigate(to);
            return;
        }

        let path = resolveTo(
            to,
            getPathContributingMatches(this.#routeContext.matches).map(match => match.pathnameBase),
            this.location.pathname,
        );

        this.#routerContext.router.navigate(path, {
            replace: options.replace,
            state: options.state,
        });
    };

    enhanceLink = () => {
        return link(this.navigate);
    };

    formAction = (action = '.'): string => {
        let { matches } = this.#routeContext;
        let route = this.#routeContext;

        let path = resolveTo(
            action,
            getPathContributingMatches(matches).map(match => match.pathnameBase),
            this.location.pathname,
        );

        let search = path.search;
        if (action === '.' && route.index) {
            search = search ? search.replace(/^\?/, '?index&') : '?index';
        }

        return path.pathname + search;
    };

    enhanceForm = (options: { replace: boolean } = { replace: false }) => {
        return form(this, this.#routerContext, options.replace, null, null);
    };

    getFetcher = <TData = unknown>(): FetcherWithDirective<TData> => {
        const { router } = this.#routerContext;
        const { id } = this.#routeContext;
        const defaultAction = this.formAction();
        const fetcherKey = String(++fetcherId);
        const fetcher = signal<Fetcher<TData>>(router.getFetcher<TData>(fetcherKey));

        router.subscribe(() => (fetcher.value = router.getFetcher<TData>(fetcherKey)));
        this.#onCleanup(() => router.deleteFetcher(fetcherKey));

        return {
            get fetcher() {
                return fetcher.value;
            },
            enhanceForm: (options = { replace: false }) => {
                return form(this, this.#routerContext, options.replace, fetcherKey, id.value);
            },
            submit(target, options = {}) {
                return submitImpl(router, defaultAction, target, options, fetcherKey, id.value);
            },
            load(href) {
                return router.fetch(fetcherKey, id.value, href);
            },
        };
    };

    outlet = () =>
        outletImpl({
            state: this.#state,
            routeContext: this.#routeContext,
            routeError: () => this.routeError,
        });

    /** @private */
    routeMatches(id: string): DataRouteMatch[] {
        return this.#state.value.matches.slice(
            0,
            this.#state.value.matches.findIndex(m => m.route.id === id) + 1,
        );
    }
}

function createDefaultRouter(
    routes: RouteObject[],
    opts: CreateBrowserRouterOpts | CreateMemoryRouterOpts = {},
) {
    if (isServer) {
        return createMemoryRouter(routes, opts);
    }

    return createBrowserRouter(routes, opts);
}

export class RouterProvider implements ReactiveController {
    #state: Signal<RouterState>;
    #unsubscribe: () => void;
    #fallback?: TemplateResult;

    constructor(host: ReactiveElement, routes: RouteObject[], fallback?: TemplateResult) {
        host.addController(this);

        const router = createDefaultRouter(routes);
        this.#state = signal(router.state);
        this.#unsubscribe = router.subscribe(state => (this.#state.value = state));
        this.#fallback = fallback;

        const provider = new ContextProvider(host, { context: routerContext });
        provider.setValue({ router, state: this.#state });
    }

    hostDisconnected() {
        this.#unsubscribe();
    }

    outlet() {
        if (!this.#state.value.initialized) {
            return this.#fallback ? this.#fallback : html`<span></span>`;
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
                    .match="${match}"
                    .routeError="${routeError()}"
                    .error="${error}"
                    .root="${root}"
                ></route-wrapper>
            `,
            () =>
                // We found an Outlet() but do not have deeper matching paths so we
                // end the render tree here
                nothing,
        )}
    `;
}
