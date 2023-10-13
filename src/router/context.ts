import { createContext } from '@lit/context';
import type { IRouteContext, IRouteErrorContext, IRouterContext } from './types';

/** @private */
export const routerContext = createContext<IRouterContext>(Symbol('router-context'));
/** @private */
export const routeContext = createContext<IRouteContext>(Symbol('route-context'));
/** @private */
export const routeErrorContext = createContext<IRouteErrorContext>(Symbol('route-error-context'));
