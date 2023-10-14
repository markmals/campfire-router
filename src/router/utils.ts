/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
    FormEncType,
    FormMethod,
    Location,
    Path,
    Router as RemixRouter,
    Router,
} from '@remix-run/router';
import type { SubmitOptions } from './dom.js';
import { getFormSubmissionInfo } from './dom.js';
import type { DataRouteMatch, RouteObject, SubmitTarget } from './types.js';

export function enhanceManualRouteObjects(routes: RouteObject[]): RouteObject[] {
    return routes.map(route => {
        let routeClone = { ...route };
        if (routeClone.hasErrorBoundary == null) {
            routeClone.hasErrorBoundary = routeClone.errorTemplate != null;
        }
        if (routeClone.children) {
            routeClone.children = enhanceManualRouteObjects(routeClone.children);
        }
        return routeClone;
    });
}

export function submitImpl(
    router: RemixRouter,
    defaultAction: string,
    target: SubmitTarget,
    options: SubmitOptions = {},
    fetcherKey?: string,
    routeId?: string,
): void {
    if (typeof document === 'undefined') {
        throw new Error('Unable to submit during server render');
    }

    let { method, encType, formData, url } = getFormSubmissionInfo(target, defaultAction, options);

    let href = url.pathname + url.search;
    let opts = {
        replace: options.replace,
        formData,
        formMethod: method as FormMethod,
        formEncType: encType as FormEncType,
    };
    if (fetcherKey && routeId) {
        router.fetch(fetcherKey, routeId, href, opts as any);
    } else {
        router.navigate(href, opts);
    }
}

export function getPathContributingMatches(matches: DataRouteMatch[]) {
    // Ignore index + pathless matches
    return matches.filter(
        (match, index) =>
            index === 0 ||
            (!match.route.index && match.pathnameBase !== matches[index - 1].pathnameBase),
    );
}

export function createPath({ pathname = '/', search = '', hash = '' }: Partial<Path>) {
    if (search && search !== '?') pathname += search.charAt(0) === '?' ? search : '?' + search;
    if (hash && hash !== '#') pathname += hash.charAt(0) === '#' ? hash : '#' + hash;
    return pathname;
}

export function createURL(router: Router, location: Location | string): URL {
    let base =
        typeof window !== 'undefined' && typeof window.location !== 'undefined'
            ? window.location.origin
            : 'unknown://unknown';
    let href = typeof location === 'string' ? location : router.createHref(location);
    return new URL(href, base);
}
