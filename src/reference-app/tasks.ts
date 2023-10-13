/* eslint-disable no-empty */
export interface ITask {
    id: string;
    name: string;
}

export function getTasks(): ITask[] {
    try {
        let lsTasks = localStorage.getItem('tasks');
        if (lsTasks) return JSON.parse(lsTasks);
    } catch (e) {}
    let tasks = new Array(20).fill(0).map((_, idx) => ({
        id: String(idx + 1),
        name: `Task #${idx + 1}`,
    }));
    localStorage.setItem('tasks', JSON.stringify(tasks));
    return tasks;
}

export function addTask(taskMsg: string): ITask {
    let task = {
        id: Math.random().toString(32).substring(2),
        name: taskMsg,
    };
    let tasks = getTasks();
    tasks.push(task);
    localStorage.setItem('tasks', JSON.stringify(tasks));
    return task;
}

export function deleteTask(id: string): void {
    let tasks = getTasks();
    let idx = tasks.findIndex(t => t.id === id);
    tasks.splice(idx, 1);
    localStorage.setItem('tasks', JSON.stringify(tasks));
}
