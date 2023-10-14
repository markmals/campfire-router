import { html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import type {
    ActionFunctionArgs,
    FetcherWithDirective,
    LoaderFunctionArgs,
} from '@campfirejs/router';
import { Router, RouterProvider, redirect } from '@campfirejs/router';
import { WatchedElement } from '@campfirejs/signals';

import type { ITask } from './tasks';
import { addTask, deleteTask, getTasks } from './tasks';
import { sleep } from './utils';

@customElement('task-item')
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
        return this.#fetcher.formData != null;
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

async function newTaskAction({ request }: ActionFunctionArgs) {
    await sleep();
    let formData = await request.formData();
    addTask(formData.get('newTask') as string);
    return redirect('/', { status: 302 });
}

@customElement('new-task')
export class NewTaskRoute extends WatchedElement {
    #router = new Router(this);

    get isAdding() {
        return this.#router.navigation.state !== 'idle';
    }

    render() {
        return html`
            <form method="post" action="/new" ${this.#router.enhanceForm()}>
                <input name="newTask" />
                <button type="submit" ?disabled=${this.isAdding}>
                    ${this.isAdding ? 'Adding...' : 'Add'}
                </button>
            </form>
        `;
    }
}

async function taskLoader({ params }: LoaderFunctionArgs) {
    await sleep();
    return {
        task: getTasks().find(t => t.id === params.id),
    };
}

@customElement('task-detail')
export class TaskRoute extends WatchedElement {
    #router = new Router(this);

    get task() {
        return (this.#router.loaderData as Awaited<ReturnType<typeof taskLoader>>)?.task;
    }

    render() {
        return html`<p>${this.task?.name}</p>`;
    }
}

async function tasksLoader() {
    await sleep();
    return {
        tasks: getTasks(),
    };
}

async function tasksAction({ request }: ActionFunctionArgs) {
    await sleep();
    let formData = await request.formData();
    deleteTask(formData.get('taskId') as string);
    return {};
}

@customElement('task-list')
export class TasksRoute extends WatchedElement {
    #router = new Router(this);

    get tasks() {
        return (this.#router.loaderData as Awaited<ReturnType<typeof tasksLoader>>).tasks;
    }

    render() {
        return html`
            <ul>
                ${repeat(
                    this.tasks,
                    task => task.id,
                    task => html`<li><task-item .task="${task}"></task-item></li>`,
                )}
            </ul>
            <a href="/new" ${this.#router.enhanceLink()}>Add New Task</a>
            ${this.#router.outlet()}
        `;
    }
}

@customElement('tasks-app')
export class TasksApp extends WatchedElement {
    routes = [
        {
            path: '/',
            loader: tasksLoader,
            action: tasksAction,
            template: () => html`
                <h2>Tasks</h2>
                <task-list></task-list>
            `,
            children: [
                {
                    path: ':id',
                    loader: taskLoader,
                    template: () => html`
                        <h3>Task</h3>
                        <task-detail></task-detail>
                    `,
                },
                {
                    path: 'new',
                    action: newTaskAction,
                    template: () => html`
                        <h3>New Task</h3>
                        <new-task></new-task>
                    `,
                },
            ],
        },
    ];

    #provider: RouterProvider;

    constructor() {
        super();
        this.#provider = new RouterProvider(this, this.routes, html`<p>Loading...</p>`);
    }

    render() {
        return this.#provider.outlet();
    }
}
