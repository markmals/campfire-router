import { ContextConsumer, ContextProvider } from '@lit/context';
import type {
    Path,
    RelativeRoutingType,
    Router as RemixRouter,
    RouterState,
    To,
} from '@remix-run/router';
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
import type { IRouteContext } from './context.js';
import {
    routeContext,
    routeErrorContext,
    routeIdContext,
    routerContext,
    routerStateContext,
} from './context.js';
import { form, link } from './directives.js';
import { createBrowserRouter, createMemoryRouter } from './routers.js';
import type {
    CreateBrowserRouterOpts,
    CreateMemoryRouterOpts,
    DataRouteMatch,
    FetcherWithDirective,
    NavigateOptions,
    RouteObject,
    SubmitFunction,
} from './types.js';
import { createURL, getPathContributingMatches, submitImpl } from './utils.js';

let fetcherId = 0;

// FIXME: Element using Router scheduled an update after an update completed, causing a
// new update to be scheduled. This is inefficient and should be avoided unless the next
// update can only be scheduled as a side effect of the previous update. See
// https://lit.dev/msg/change-in-update for more information.

export class Router implements ReactiveController {
    #host;

    #routerConsumer;
    #routeConsumer;

    #routerStateConsumer;
    #routeIdConsumer;
    #routeErrorConsumer;

    #disposables: (() => void)[] = [];
    #onCleanup(cleanupFunc: () => void) {
        this.#disposables.push(cleanupFunc);
    }

    constructor(host: ReactiveElement) {
        this.#host = host;
        host.addController(this);

        this.#routerConsumer = new ContextConsumer(host, { context: routerContext });
        this.#routeConsumer = new ContextConsumer(host, { context: routeContext });

        this.#routerStateConsumer = new ContextConsumer(host, {
            context: routerStateContext,
            subscribe: true,
        });

        this.#routeIdConsumer = new ContextConsumer(host, {
            context: routeIdContext,
            subscribe: true,
        });

        this.#routeErrorConsumer = new ContextConsumer(host, {
            context: routeErrorContext,
            subscribe: true,
        });
    }

    hostDisconnected() {
        this.#disposables.forEach(dispose => dispose());
    }

    get #router(): RemixRouter {
        invariant(this.#routerConsumer.value, 'No RouterContext available');
        return this.#routerConsumer.value;
    }

    get #state(): RouterState {
        invariant(this.#routerStateConsumer.value, 'No RouterStateContext available');
        return this.#routerStateConsumer.value;
    }

    get #routeId(): string {
        invariant(this.#routeIdConsumer.value, 'No RouteIdContext available');
        return this.#routeIdConsumer.value;
    }

    get #routeContext(): IRouteContext {
        invariant(this.#routeConsumer.value, 'No RouteContext available');
        return this.#routeConsumer.value;
    }

    get routeError(): unknown {
        return this.#routeErrorConsumer.value || this.#state.errors?.[this.#routeId];
    }

    get navigationType(): NavigationType {
        return this.#state.historyAction;
    }

    get location(): Location {
        return this.#state.location;
    }

    get matches() {
        return this.#state.matches.map(match => ({
            id: match.route.id,
            pathname: match.pathname,
            params: match.params,
            data: this.#state.loaderData[match.route.id] as unknown,
            handle: match.route.handle as unknown,
        }));
    }

    get navigation(): Navigation {
        return this.#state.navigation;
    }

    routeLoaderData = (routeId: string): unknown => {
        return this.#state.loaderData[routeId];
    };

    get loaderData(): unknown {
        return this.routeLoaderData(this.#routeId);
    }

    get actionData(): unknown {
        return this.#state.actionData?.[this.#routeId];
    }

    resolvedPath = (to: To, { relative }: { relative?: RelativeRoutingType } = {}): Path =>
        resolveTo(
            to,
            getPathContributingMatches(this.#routeContext.matches).map(match => match.pathnameBase),
            this.location.pathname,
            relative === 'path',
        );

    href = (to: To): string =>
        this.#router.createHref(createURL(this.#router, createPath(this.resolvedPath(to))));

    navigate = (to: To | number, options: NavigateOptions = {}) => {
        if (typeof to === 'number') {
            this.#router.navigate(to);
            return;
        }

        let path = resolveTo(
            to,
            getPathContributingMatches(this.#routeContext.matches).map(match => match.pathnameBase),
            this.location.pathname,
        );

        this.#router.navigate(path, {
            replace: options.replace,
            state: options.state,
        });
    };

    enhanceLink = () => {
        return link(this.navigate);
    };

    // TODO: enhanceNavLink(options: { isActive: string, isPending: string })

    formAction = (action = '.', { relative }: { relative?: RelativeRoutingType } = {}): string => {
        let route = this.#routeContext;
        let path = this.resolvedPath(action, { relative });

        let search = path.search;
        if (action === '.' && route.index) {
            search = search ? search.replace(/^\?/, '?index&') : '?index';
        }

        return path.pathname + search;
    };

    submit: SubmitFunction = (target, options = {}) => {
        submitImpl(this.#router, this.formAction(), target, options);
    };

    enhanceForm = (options: { replace: boolean } = { replace: false }) => {
        return form(this, this.#router, options.replace, null, null);
    };

    getFetcher = <TData = unknown>(): FetcherWithDirective<TData> => {
        const defaultAction = this.formAction();
        const fetcherKey = String(++fetcherId);

        // TODO: Make FetcherController
        let fetcher = this.#router.getFetcher<TData>(fetcherKey);

        this.#router.subscribe(() => {
            fetcher = this.#router.getFetcher<TData>(fetcherKey);
            this.#host.requestUpdate();
        });

        this.#onCleanup(() => this.#router.deleteFetcher(fetcherKey));

        return {
            get state() {
                return fetcher.state;
            },
            get formMethod() {
                return fetcher.formMethod;
            },
            get formAction() {
                return fetcher.formAction;
            },
            get formEncType() {
                return fetcher.formEncType;
            },
            get text() {
                return fetcher.text;
            },
            get formData() {
                return fetcher.formData;
            },
            get json() {
                return fetcher.json;
            },
            get data() {
                return fetcher.data;
            },
            enhanceForm: (options = { replace: false }) => {
                return form(this, this.#router, options.replace, fetcherKey, this.#routeId);
            },
            submit: (target, options = {}) => {
                return submitImpl(
                    this.#router,
                    defaultAction,
                    target,
                    options,
                    fetcherKey,
                    this.#routeId,
                );
            },
            load: href => {
                return this.#router.fetch(fetcherKey, this.#routeId, href);
            },
        } as FetcherWithDirective<TData>;
    };

    outlet = () =>
        outletImpl({
            state: this.#state,
            routeId: this.#routeId,
            routeError: this.routeError,
        });

    isActive = (to: To) => {
        let path = this.resolvedPath(to);
        let toPathname = path.pathname;

        let locationPathname = this.location.pathname;

        return (
            locationPathname === toPathname ||
            (locationPathname.startsWith(toPathname) &&
                locationPathname.charAt(toPathname.length) === '/')
        );
    };

    isPending = (to: To) => {
        let path = this.resolvedPath(to);
        let toPathname = path.pathname;

        let nextLocationPathname =
            this.navigation && this.navigation.location ? this.navigation.location.pathname : null;

        return (
            nextLocationPathname != null &&
            (nextLocationPathname === toPathname ||
                (nextLocationPathname.startsWith(toPathname) &&
                    nextLocationPathname.charAt(toPathname.length) === '/')) &&
            !this.isActive(to)
        );
    };

    /** @private */
    routeMatches(id: string): DataRouteMatch[] {
        return this.#state.matches.slice(
            0,
            this.#state.matches.findIndex(m => m.route.id === id) + 1,
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
    #state: RouterState;
    #unsubscribe: () => void;
    #fallback?: TemplateResult;

    constructor(host: ReactiveElement, routes: RouteObject[], fallback?: TemplateResult) {
        host.addController(this);

        const routerProvider = new ContextProvider(host, { context: routerContext });
        const stateProvider = new ContextProvider(host, { context: routerStateContext });

        const router = createDefaultRouter(routes);
        routerProvider.setValue(router);

        this.#state = router.state;
        stateProvider.setValue(router.state);

        this.#unsubscribe = router.subscribe(state => {
            this.#state = state;
            stateProvider.setValue(state);
            host.requestUpdate();
        });

        this.#fallback = fallback;
    }

    hostDisconnected() {
        this.#unsubscribe();
    }

    outlet() {
        if (!this.#state.initialized) {
            return this.#fallback ? this.#fallback : html`<span></span>`;
        }

        return outletImpl({ state: this.#state, root: true });
    }
}

function outletImpl({
    routeId,
    state,
    routeError,
    root = false,
}: {
    routeId?: string;
    state: RouterState;
    routeError?: unknown;
    root?: boolean;
}): TemplateResult {
    const id = root ? null : routeId;
    const idx = state.matches.findIndex(m => m.route.id === id);
    const matchToRender = state.matches[idx + 1];
    const error = (
        state.errors?.[matchToRender.route.id] != null ? Object.values(state.errors)[0] : null
    ) as unknown;
    const match = matchToRender as DataRouteMatch;

    if (idx < 0 && !root) {
        throw new Error(`Unable to find <router-outlet> match for route id: ${id || '_root_'}`);
    }

    return html`
        ${when(
            match,
            () => html`
                <route-wrapper
                    .routeId="${state.matches[idx + 1]?.route.id}"
                    .match="${match}"
                    .routeError="${routeError}"
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
