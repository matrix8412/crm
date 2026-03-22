import { html } from 'htm/preact';
import { PrefixesView } from './PrefixesView';
import { VlansView } from './VlansView';
import { VpnView } from './VpnView';

export const IpamPage = (props) => {
    const { activeView } = props;

    return html`
        ${activeView === 'ipamPrefixes' && html`<${PrefixesView} ...${props} />`}
        ${activeView === 'ipamVlans' && html`<${VlansView} ...${props} />`}
        ${activeView === 'ipamVpn' && html`<${VpnView} ...${props} />`}
    `;
};