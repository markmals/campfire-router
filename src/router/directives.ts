/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import type { FormMethod } from '@remix-run/router';
import type { Part } from 'lit';
import { noChange } from 'lit';
import type { DirectiveParameters, PartInfo } from 'lit/async-directive.js';
import { AsyncDirective, PartType, directive } from 'lit/async-directive.js';
import type { RouterController } from './router-controller';
import type { HTMLFormSubmitter, IRouterContext, NavigateFunction } from './types';
import { submitImpl } from './utils';

class LinkDirective extends AsyncDirective {
    #part?: Part = undefined;

    constructor(partInfo: PartInfo) {
        super(partInfo);

        if (partInfo.type !== PartType.ELEMENT) {
            throw new Error('LinkDirective must be used on an anchor element');
        }
    }

    render(_navigate: NavigateFunction) {
        return noChange;
    }

    update(part: Part, [navigate]: DirectiveParameters<this>) {
        this.#part = part;

        if (
            this.#part.type !== PartType.ELEMENT ||
            !(this.#part.element instanceof HTMLAnchorElement)
        ) {
            throw new Error('LinkDirective must be used on an anchor element');
        }

        this.#part.element.addEventListener('click', this.linkHandler(navigate));
    }

    private linkHandler(navigate: NavigateFunction) {
        return (event: Event) => {
            event.preventDefault();
            let anchor = event
                .composedPath()
                .find((t): t is HTMLAnchorElement => t instanceof HTMLAnchorElement);

            if (anchor === undefined) {
                throw new Error(
                    '(link handler) event must have an anchor element in its composed path.',
                );
            }
            navigate(new URL(anchor.href).pathname);
        };
    }
}

export type { LinkDirective };

export const link = directive(LinkDirective);

class FormDirective extends AsyncDirective {
    #part?: Part = undefined;

    constructor(partInfo: PartInfo) {
        super(partInfo);

        if (partInfo.type !== PartType.ELEMENT) {
            throw new Error('FormDirective must be used on a form element');
        }
    }

    render(
        _controller: RouterController,
        _routerContext: IRouterContext,
        _replace: boolean,
        _fetcherKey: string | null,
        _routeId: string | null,
    ) {
        return noChange;
    }

    update(
        part: Part,
        [controller, routerContext, replace, fetcherKey, routeId]: DirectiveParameters<this>,
    ) {
        this.#part = part;

        if (
            this.#part.type !== PartType.ELEMENT ||
            !(this.#part.element instanceof HTMLFormElement)
        ) {
            throw new Error('FormDirective must be used on a form element');
        }

        this.#part.element.addEventListener(
            'submit',
            this.handleSubmit(
                this.#part.element,
                controller,
                routerContext,
                replace,
                fetcherKey,
                routeId,
            ),
        );
    }

    private handleSubmit(
        form: HTMLFormElement,
        controller: RouterController,
        routerContext: IRouterContext,
        replace: boolean,
        fetcherKey: string | null,
        routeId: string | null,
    ): (event: any) => void {
        return (event: SubmitEvent & { submitter: HTMLFormSubmitter }) => {
            if (event.defaultPrevented) {
                return;
            }
            event.preventDefault();
            submitImpl(
                routerContext.router,
                controller.formAction(form.action),
                event.submitter || event.currentTarget,
                {
                    method: form.method as FormMethod,
                    replace: replace,
                },
                fetcherKey ?? undefined,
                routeId ?? undefined,
            );
        };
    }
}

export type { FormDirective };

export const form = directive(FormDirective);
