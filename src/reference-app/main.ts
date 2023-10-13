import { redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from '@remix-run/router';
import { html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { Router } from '../router/router-controller';
import type { FetcherWithDirective } from '../router/types';
import { WatchedElement } from '../signals/signal-element';
import type { ITask } from './tasks';
import { addTask, deleteTask, getTasks } from './tasks';
import { sleep } from './utils';

import '../router/elements';
import { RouterProvider } from '../router/router-controller';

@customElement('app-task-item')
export class TaskItemElement extends WatchedElement {
    @property({ attribute: false })
    accessor task!: ITask;

    #router = new Router(this);
    #fetcher!: FetcherWithDirective<unknown>;

    connectedCallback() {
        super.connectedCallback();
        this.#fetcher = this.#router.getFetcher();
    }

    get isDeleting() {
        return this.#fetcher.fetcher.formData != null;
    }

    render() {
        return html`
            <span>${this.task.name}</span>
            <a href="/${this.task.id}" ${this.#router.enhanceLink()}>Open</a>
            <form style="display: inline" action="/" method="post" ${this.#fetcher.enhanceForm()}>
                <button
                    type="submit"
                    name="taskId"
                    value="${this.task.id}"
                    ?disabled="${this.isDeleting}"
                >
                    ${this.isDeleting ? 'Deleting...' : '❌'}
                </button>
            </form>
        `;
    }
}

@customElement('route-new-task')
export class NewTaskRoute extends WatchedElement {
    #router = new Router(this);

    get isAdding() {
        return this.#router.navigation.state !== 'idle';
    }

    static async action({ request }: ActionFunctionArgs) {
        await sleep();
        let formData = await request.formData();
        addTask(formData.get('newTask') as string);
        return redirect('/', { status: 302 });
    }

    render() {
        return html`
            <h3>New Task</h3>
            <form method="post" action="/new" ${this.#router.enhanceForm()}>
                <input name="newTask" />
                <button type="submit" ?disabled=${this.isAdding}>
                    ${this.isAdding ? 'Adding...' : 'Add'}
                </button>
            </form>
        `;
    }
}

@customElement('route-task')
export class TaskRoute extends WatchedElement {
    #router = new Router(this);

    get task() {
        return (this.#router.loaderData as Awaited<ReturnType<typeof TaskRoute.loader>>)?.task;
    }

    static async loader({ params }: LoaderFunctionArgs) {
        await sleep();
        return {
            task: getTasks().find(t => t.id === params.id),
        };
    }

    render() {
        return html`
            <h3>Task</h3>
            <p>${this.task?.name}</p>
        `;
    }
}

@customElement('route-tasks')
export class TasksRoute extends WatchedElement {
    #router = new Router(this);

    get data() {
        return this.#router.loaderData as Awaited<ReturnType<typeof TasksRoute.loader>>;
    }

    static async loader() {
        await sleep();
        return {
            tasks: getTasks(),
        };
    }

    static async action({ request }: ActionFunctionArgs) {
        await sleep();
        let formData = await request.formData();
        deleteTask(formData.get('taskId') as string);
        return {};
    }

    render() {
        return html`
            <h2>Tasks</h2>
            <ul>
                ${repeat(
                    this.data.tasks,
                    task => task.id,
                    task => html`<li><app-task-item .task="${task}"></app-task-item></li>`,
                )}
            </ul>
            <a href="/new" ${this.#router.enhanceLink()}>Add New Task</a>
            ${this.#router.outlet()}
        `;
    }
}

@customElement('app-main')
export class TasksApp extends WatchedElement {
    #provider = new RouterProvider(
        this,
        [
            {
                path: '/',
                loader: TasksRoute.loader,
                action: TasksRoute.action,
                template: () => html`<route-tasks></route-tasks>`,
                children: [
                    {
                        path: ':id',
                        loader: TaskRoute.loader,
                        template: () => html`<route-task></route-task>`,
                    },
                    {
                        path: 'new',
                        action: NewTaskRoute.action,
                        template: () => html`<route-new-task></route-new-task>`,
                    },
                ],
            },
        ],
        html`<p>Loading...</p>`,
    );

    render() {
        return this.#provider.outlet();
    }
}
