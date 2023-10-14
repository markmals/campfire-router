import { effect } from '@lit-labs/preact-signals';
import { beforeEach, describe, expect, it } from 'vitest';
import { reactive, untrack } from './reactive';

class Author {
    firstName = 'Steven';
    lastName = 'King';
}

@reactive()
class Book {
    title = 'The Shining';
    author = new Author();
    inStock = true;

    tags = ['Horror', 'Thriller'];

    @untrack()
    someData = { foo: 'Hello', bar: 'World' };

    get caseInsensitiveTitle() {
        return this.title.toUpperCase();
    }
}

// TODO: Copy Swift @Observable tests

describe('@reactive classes', () => {
    let book = new Book();

    beforeEach(() => {
        book = new Book();
    });

    it('should be a getter which reflect the set value', () => {
        expect(book.inStock).toBeTruthy();
        book.inStock = false;
        expect(book.inStock).toBeFalsy();
    });

    it('should accept update function to set new value based on the previous one', () => {
        expect(book.title).toEqual('The Shining');
        book.title += ': Part II';
        expect(book.title).toEqual('The Shining: Part II');
    });

    it('should have mutate function for mutable, out of bound updates', () => {
        expect(book.author.lastName).toEqual('King');
        book.author.lastName = 'Hawking';
        expect(book.author.lastName).toEqual('Hawking');

        expect(book.tags.join(', ')).toEqual('Horror, Thriller');
        book.tags.push('Comedy');
        expect(book.tags.join(', ')).toEqual('Horror, Thriller, Comedy');
    });

    it('should update reactively', () => {
        let rxTitle: string | undefined = undefined;
        effect(() => {
            rxTitle = book.title;
        });
        expect(rxTitle).toEqual('The Shining');

        book.title += ': Part II';
        expect(rxTitle).toEqual('The Shining: Part II');
    });
});
