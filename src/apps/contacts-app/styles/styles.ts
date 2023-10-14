import { css } from 'lit';

export const sharedStyles = css`
    *,
    *:before,
    *:after {
        box-sizing: inherit;
    }

    code {
        font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New', monospace;
    }

    textarea,
    input,
    button {
        font-size: 1rem;
        font-family: inherit;
        border: none;
        border-radius: 8px;
        padding: 0.5rem 0.75rem;
        box-shadow:
            0 0px 1px hsla(0, 0%, 0%, 0.2),
            0 1px 2px hsla(0, 0%, 0%, 0.2);
        background-color: white;
        line-height: 1.5;
        margin: 0;
    }

    button {
        color: #3992ff;
        font-weight: 500;
    }

    textarea:hover,
    input:hover,
    button:hover {
        box-shadow:
            0 0px 1px hsla(0, 0%, 0%, 0.6),
            0 1px 2px hsla(0, 0%, 0%, 0.2);
    }

    button:active {
        box-shadow: 0 0px 1px hsla(0, 0%, 0%, 0.4);
        transform: translateY(1px);
    }

    form[action$='destroy'] button {
        color: #f44250;
    }

    #contact-form {
        display: flex;
        max-width: 40rem;
        flex-direction: column;
        gap: 1rem;
    }
    #contact-form > p:first-child {
        margin: 0;
        padding: 0;
    }
    #contact-form > p:first-child > :nth-child(2) {
        margin-right: 1rem;
    }
    #contact-form > p:first-child,
    #contact-form label {
        display: flex;
    }
    #contact-form p:first-child span,
    #contact-form label span {
        width: 8rem;
    }
    #contact-form p:first-child input,
    #contact-form label input,
    #contact-form label textarea {
        flex-grow: 2;
    }

    #contact-form-avatar {
        margin-right: 2rem;
    }

    #contact-form-avatar img {
        width: 12rem;
        height: 12rem;
        background: hsla(0, 0%, 0%, 0.2);
        border-radius: 1rem;
    }

    #contact-form-avatar input {
        box-sizing: border-box;
        width: 100%;
    }

    #contact-form p:last-child {
        display: flex;
        gap: 0.5rem;
        margin: 0 0 0 8rem;
    }

    #contact-form p:last-child button[type='button'] {
        color: inherit;
    }

    .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border-width: 0;
    }
`;

export const displayContents = css`
    :host {
        display: contents;
    }
`;
