import {
    createBrowserHistory,
    createHashHistory,
    createMemoryHistory,
    createRouter,
} from '@remix-run/router';
import type {
    CreateBrowserRouterOpts,
    CreateHashRouterOpts,
    CreateMemoryRouterOpts,
    RouteObject,
} from './types';
import { enhanceManualRouteObjects } from './utils';

export function createMemoryRouter(
    routes: RouteObject[],
    { basename, hydrationData, initialEntries, initialIndex }: CreateMemoryRouterOpts = {},
) {
    return createRouter({
        basename,
        history: createMemoryHistory({
            initialEntries,
            initialIndex,
        }),
        hydrationData,
        routes: enhanceManualRouteObjects(routes),
    }).initialize();
}

export function createBrowserRouter(
    routes: RouteObject[],
    { basename, hydrationData, window }: CreateBrowserRouterOpts = {},
) {
    return createRouter({
        basename,
        history: createBrowserHistory({ window }),
        hydrationData,
        routes: enhanceManualRouteObjects(routes),
    }).initialize();
}

export function createHashRouter(
    routes: RouteObject[],
    { basename, hydrationData, window }: CreateHashRouterOpts = {},
) {
    return createRouter({
        basename,
        history: createHashHistory({ window }),
        hydrationData,
        routes: enhanceManualRouteObjects(routes),
    }).initialize();
}
