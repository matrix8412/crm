
import { render } from 'preact';
import { html } from 'htm/preact';
import { App } from './src/App';
import { UIProvider } from './src/contexts/ToastContext';

render(html`<${UIProvider}><${App} /><//>`, document.getElementById('root'));