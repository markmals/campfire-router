import type { ReadonlySignal } from '@lit-labs/preact-signals';
import { computed, signal } from '@lit-labs/preact-signals';
import { ContextConsumer } from '@lit/context';
import type { Fetcher, Path, To } from '@remix-run/router';
import {
    createPath,
    resolveTo,
    type Location,
    type Navigation,
    type Action as NavigationType,
} from '@remix-run/router';
import type { ReactiveController, ReactiveElement } from 'lit';
import invariant from 'tiny-invariant';
import { routeContext, routeErrorContext, routerContext } from './context';
import { form, link } from './directives';
import type { FetcherWithDirective, IRouteContext, IRouterContext, NavigateOptions } from './types';
import { createURL, getPathContributingMatches, submitImpl } from './utils';

let fetcherId = 0;

export class RouterController implements ReactiveController {
    #routerConsumer;
    #routeConsumer;
    #routeErrorConsumer;

    #disposables: (() => void)[] = [];
    #onCleanup(cleanupFunc: () => void) {
        this.#disposables.push(cleanupFunc);
    }

    hostDisconnected() {
        this.#disposables.forEach(dispose => dispose());
    }

    constructor(host: ReactiveElement) {
        host.addController(this);
        this.#routerConsumer = new ContextConsumer(host, { context: routerContext });
        this.#routeConsumer = new ContextConsumer(host, { context: routeContext });
        this.#routeErrorConsumer = new ContextConsumer(host, { context: routeErrorContext });
    }

    get routerContext(): IRouterContext {
        invariant(this.#routerConsumer.value, 'No RouterContext available');
        return this.#routerConsumer.value;
    }

    get routeContext(): IRouteContext {
        invariant(this.#routeConsumer.value, 'No RouteContext available');
        return this.#routeConsumer.value;
    }

    get state() {
        return this.routerContext.state;
    }

    routeError: ReadonlySignal<unknown> = computed(
        () =>
            this.#routeErrorConsumer.value?.error.value ||
            this.state.value.errors?.[this.routeContext.id.value],
    );

    navigationType: ReadonlySignal<NavigationType> = computed(() => this.state.value.historyAction);

    location: ReadonlySignal<Location> = computed(() => this.state.value.location);

    matches = computed(() =>
        this.state.value.matches.map(match => ({
            id: match.route.id,
            pathname: match.pathname,
            params: match.params,
            data: this.state.value.loaderData[match.route.id] as unknown,
            handle: match.route.handle as unknown,
        })),
    );

    navigation: ReadonlySignal<Navigation> = computed(() => this.state.value.navigation);

    routeLoaderData(routeId: string): unknown {
        return this.state.value.loaderData[routeId];
    }

    loaderData: ReadonlySignal<unknown> = computed(() =>
        this.routeLoaderData(this.routeContext.id.value),
    );

    actionData: ReadonlySignal<unknown> = computed(
        () => this.state.value.actionData?.[this.routeContext.id.value],
    );

    resolvedPath = (to: To): ReadonlySignal<Path> =>
        computed(() =>
            resolveTo(
                to,
                getPathContributingMatches(this.routeContext.matches).map(
                    match => match.pathnameBase,
                ),
                this.location.value.pathname,
            ),
        );

    href = (to: To): ReadonlySignal<string> =>
        computed(() =>
            this.routerContext.router.createHref(
                createURL(this.routerContext.router, createPath(this.resolvedPath(to).value)),
            ),
        );

    navigate = (to: To | number, options: NavigateOptions = {}) => {
        if (typeof to === 'number') {
            this.routerContext.router.navigate(to);
            return;
        }

        let path = resolveTo(
            to,
            getPathContributingMatches(this.routeContext.matches).map(match => match.pathnameBase),
            this.location.value.pathname,
        );

        this.routerContext.router.navigate(path, {
            replace: options.replace,
            state: options.state,
        });
    };

    enhanceLink = () => {
        return link(this.navigate);
    };

    formAction(action = '.'): string {
        let { matches } = this.routeContext;
        let route = this.routeContext;
        let location = this.location.value;

        let path = resolveTo(
            action,
            getPathContributingMatches(matches).map(match => match.pathnameBase),
            location.pathname,
        );

        let search = path.search;
        if (action === '.' && route.index) {
            search = search ? search.replace(/^\?/, '?index&') : '?index';
        }

        return path.pathname + search;
    }

    enhanceForm = (options: { replace: boolean } = { replace: false }) => {
        return form(this, this.routerContext, options.replace, null, null);
    };

    getFetcher = <TData = unknown>(): ReadonlySignal<FetcherWithDirective<TData>> => {
        const { router } = this.routerContext;
        const { id } = this.routeContext;
        const defaultAction = this.formAction();
        const fetcherKey = String(++fetcherId);
        const fetcher = signal<Fetcher<TData>>(router.getFetcher<TData>(fetcherKey));

        router.subscribe(() => (fetcher.value = router.getFetcher<TData>(fetcherKey)));
        this.#onCleanup(() => router.deleteFetcher(fetcherKey));

        return computed(() => ({
            ...fetcher.value,
            enhanceForm: (options = { replace: false }) => {
                return form(this, this.routerContext, options.replace, fetcherKey, id.value);
            },
            submit(target, options = {}) {
                return submitImpl(router, defaultAction, target, options, fetcherKey, id.value);
            },
            load(href) {
                return router.fetch(fetcherKey, id.value, href);
            },
        }));
    };
}
