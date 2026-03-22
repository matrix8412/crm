import { html } from 'htm/preact';

export const PlaceholderContent = ({ title, message }) => html`
    <div class="placeholder-content">
        <h3>${title}</h3>
        <p>${message}</p>
    </div>
`;