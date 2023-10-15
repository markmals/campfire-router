import type {
    AgnosticIndexRouteObject,
    AgnosticNonIndexRouteObject,
    AgnosticRouteMatch,
    Fetcher,
    HydrationState,
    LazyRouteFunction,
    To,
} from '@remix-run/router';
import type { TemplateResult } from 'lit';
import type { DirectiveResult } from 'lit/async-directive.js';
import type { FormDirective } from './directives.js';
import type { SubmitOptions } from './dom.js';

// Create Campfire-specific types from the agnostic types in @remix-run/router to
// export from @campfirejs/router
export interface IndexRouteObject {
    caseSensitive?: AgnosticIndexRouteObject['caseSensitive'];
    path?: AgnosticIndexRouteObject['path'];
    id?: AgnosticIndexRouteObject['id'];
    loader?: AgnosticIndexRouteObject['loader'];
    action?: AgnosticIndexRouteObject['action'];
    hasErrorBoundary?: AgnosticIndexRouteObject['hasErrorBoundary'];
    shouldRevalidate?: AgnosticIndexRouteObject['shouldRevalidate'];
    handle?: AgnosticIndexRouteObject['handle'];
    index: true;
    children?: undefined;
    template?: () => TemplateResult | null;
    errorTemplate?: () => TemplateResult | null;
}

export interface NonIndexRouteObject {
    caseSensitive?: AgnosticNonIndexRouteObject['caseSensitive'];
    path?: AgnosticNonIndexRouteObject['path'];
    id?: AgnosticNonIndexRouteObject['id'];
    loader?: AgnosticNonIndexRouteObject['loader'];
    action?: AgnosticNonIndexRouteObject['action'];
    hasErrorBoundary?: AgnosticNonIndexRouteObject['hasErrorBoundary'];
    shouldRevalidate?: AgnosticNonIndexRouteObject['shouldRevalidate'];
    handle?: AgnosticNonIndexRouteObject['handle'];
    index?: false;
    children?: RouteObject[];
    template?: () => TemplateResult | null;
    errorTemplate?: () => TemplateResult | null;
    lazy?: LazyRouteFunction<RouteObject>;
}

export type RouteObject = IndexRouteObject | NonIndexRouteObject;

export type DataRouteObject = RouteObject & {
    children?: DataRouteObject[];
    id: string;
};

export type RouteMatch<
    ParamKey extends string = string,
    RouteObjectType extends RouteObject = RouteObject,
> = AgnosticRouteMatch<ParamKey, RouteObjectType>;

export type DataRouteMatch = RouteMatch<string, DataRouteObject>;

interface CreateRouterOpts {
    basename?: string;
    hydrationData?: HydrationState;
}

export interface CreateMemoryRouterOpts extends CreateRouterOpts {
    initialEntries?: string[];
    initialIndex?: number;
}

export interface CreateBrowserRouterOpts extends CreateRouterOpts {
    window?: Window;
}

export interface CreateHashRouterOpts extends CreateRouterOpts {
    window?: Window;
}

export interface NavigateOptions {
    replace?: boolean;
    state?: unknown;
}

export type FetcherWithDirective<TData> = Fetcher<TData> & {
    submit(
        target:
            | HTMLFormElement
            | HTMLButtonElement
            | HTMLInputElement
            | FormData
            | URLSearchParams
            | { [name: string]: string }
            | null,
        options?: SubmitOptions,
    ): void;
    enhanceForm(options?: { replace: boolean }): DirectiveResult<typeof FormDirective>;
    load: (href: string) => void;
};

export type SubmitTarget =
    | HTMLFormElement
    | HTMLButtonElement
    | HTMLInputElement
    | FormData
    | URLSearchParams
    | { [name: string]: string }
    | null;

export interface SubmitFunction {
    (
        /**
         * Specifies the `<form>` to be submitted to the server, a specific
         * `<button>` or `<input type="submit">` to use to submit the form, or some
         * arbitrary data to submit.
         *
         * Note: When using a `<button>` its `name` and `value` will also be
         * included in the form data that is submitted.
         */
        target: SubmitTarget,

        /**
         * Options that override the `<form>`'s own attributes. Required when
         * submitting arbitrary data without a backing `<form>`.
         */
        options?: SubmitOptions,
    ): void;
}

export type HTMLFormSubmitter = HTMLButtonElement | HTMLInputElement;

export interface NavigateFunction {
    (to: To, options?: NavigateOptions): void;
    (delta: number): void;
}
