/* eslint-disable @typescript-eslint/no-explicit-any */
import { signal } from '@lit-labs/preact-signals';

(Symbol as any).metadata ??= Symbol('Symbol.metadata');

type PropertyContext =
    | ClassAccessorDecoratorContext
    | ClassGetterDecoratorContext
    | ClassFieldDecoratorContext;

interface Constructor<T> {
    new (...args: any[]): T;
}

const UntrackedSymbol = Symbol();

/**
 * Disables reactivity tracking of a property.
 *
 * @remarks
 * By default, an object can observe any property of a reactive class that
 * is accessible to the reactive object. To prevent tracking of an accessible
 * property, attach the `@untrack()` decorator to the property.
 *
 * @alpha
 */
export function untrack() {
    return (_target: any, context: PropertyContext) => {
        if (context.static || context.private) {
            throw new Error('@untrack can only be applied to public instance members.');
        }

        if (typeof context.name === 'symbol') {
            throw new Error('@untrack cannot be applied to symbol-named properties.');
        }

        const metadata = (context as any).metadata;
        const untrackedProps: string[] = (metadata[UntrackedSymbol] ??= []);
        untrackedProps.push(context.name);
    };
}

/**
 * A decorator that implements deeply nested reactivity for each property on the decorated class.
 *
 * @remarks
 * Decorating a class with this decorator signals to other APIs that the class supports
 * reactivity.
 *
 * @example
 * The following code applies the `@reactive` decorator to the type `Car` making it observable:
 *
 * ```ts
 * \@reactive()
 * class Car {
 *      name: string = ""
 *      \@untrack()
 *      needsRepairs: boolean = false
 *
 *      constructor(name: string, needsRepairs: boolean = false) {
 *          this.name = name
 *          this.needsRepairs = needsRepairs
 *      }
 * }
 * ```
 *
 * @alpha
 */
export function reactive<Target extends Constructor<any>>() {
    return (_target: Target, context: ClassDecoratorContext) => {
        if (context.kind !== 'class') {
            throw new Error('@reactive must be applied to a class.');
        }

        return class Reactive extends _target {
            constructor(...args: any[]) {
                super(...args);

                const prototype = Object.getPrototypeOf(this);
                const metadata = prototype.constructor[(Symbol as any).metadata];
                const untrackedProps: string[] = (metadata[UntrackedSymbol] ??= []);

                const properties = Object.getOwnPropertyNames(this);
                for (const prop of properties) {
                    if (untrackedProps.includes(prop)) continue;

                    let initialValue = Object.getOwnPropertyDescriptor(this, prop)!;
                    let backingSignal = Symbol(`__$${prop}`);

                    Object.defineProperty(this, backingSignal, {
                        value: signal(initialValue.value),
                        writable: true,
                    });

                    Object.defineProperty(this, prop, {
                        get() {
                            return this[backingSignal].value;
                        },
                        set(v) {
                            this[backingSignal].value = v;
                        },
                    });

                    // TODO: Don't override existing getter/setter pairs
                    // TODO: Make sure to explicitly ignore functions
                }
            }
        } as Target;
    };
}
