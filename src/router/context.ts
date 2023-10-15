import { createContext } from '@lit/context';
import type { Router as RemixRouter, RouterState } from '@remix-run/router';
import type { DataRouteMatch } from './types';

// Wrapper context holding the route location in the current hierarchy
export interface IRouteContext {
    matches: DataRouteMatch[];
    index: boolean;
}

/** @private */
export const routerContext = createContext<RemixRouter>(Symbol('router-context'));
/** @private @reactive */
export const routerStateContext = createContext<RouterState>(Symbol('router-state-context'));
/** @private */
export const routeContext = createContext<IRouteContext>(Symbol('route-context'));
/** @private @reactive */
export const routeIdContext = createContext<string>(Symbol('route-id-context'));
/** @private @reactive */
export const routeErrorContext = createContext<unknown>(Symbol('route-error-context'));
