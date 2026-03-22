
import { html } from 'htm/preact';
import { useState, useMemo, useEffect } from 'preact/hooks';
import { icons } from '../../constants/icons';
import { calculateSubnetInfo, calculateSubnets } from '../../utils/ipCalculator';
import type { SubnetDetail } from '../../utils/ipCalculator';

export const SubnetCalculator = () => {
    const [input, setInput] = useState('192.168.1.0/24');
    const [result, setResult] = useState(() => calculateSubnetInfo('192.168.1.0/24'));
    const [subnetCidr, setSubnetCidr] = useState<number | null>(null);
    const [subnets, setSubnets] = useState<SubnetDetail[]>([]);

    const handleCalculate = (e) => {
        e.preventDefault();
        setSubnetCidr(null);
        setSubnets([]);
        setResult(calculateSubnetInfo(input));
    };
    
    useEffect(() => {
        if (subnetCidr && result && !('error' in result)) {
            const calculated = calculateSubnets(result.networkAddress, result.cidr, subnetCidr);
            setSubnets(calculated);
        } else {
            setSubnets([]);
        }
    }, [subnetCidr, result]);

    const subnetCidrOptions = useMemo(() => {
        if (!result || 'error' in result) return [];
        const options = [];
        for (let i = result.cidr + 1; i <= 30; i++) { // Up to /30 is most useful
            options.push(i);
        }
        return options;
    }, [result]);

    const ResultItem = ({ label, value }) => html`
        <div class="result-item">
            <strong>${label}</strong>
            <span>${value}</span>
        </div>
    `;

    return html`
        <div class="subnet-calculator-container">
            <div class="content-header">
                <h2>Advanced IP Subnet Calculator</h2>
            </div>
            <div class="calculator-form-container">
                <form class="calculator-form" onSubmit=${handleCalculate}>
                    <div class="search-input-container">
                        ${icons.search}
                        <input 
                            type="text" 
                            class="search-input" 
                            placeholder="Enter IP/CIDR (e.g., 192.168.1.0/24)"
                            value=${input}
                            onInput=${e => setInput(e.currentTarget.value)}
                        />
                    </div>
                    <button type="submit" class="btn btn-primary">Calculate</button>
                </form>
            </div>
            
            ${result ? (
                'error' in result ? html`
                    <div class="calculator-error">
                        <p>${result.error}</p>
                    </div>
                ` : html`
                    <div class="calculator-results">
                        <div class="results-grid">
                            <${ResultItem} label="Network Address" value=${result.networkAddress} />
                            <${ResultItem} label="Broadcast Address" value=${result.broadcastAddress} />
                            <${ResultItem} label="First Usable Host" value=${result.firstHost} />
                            <${ResultItem} label="Last Usable Host" value=${result.lastHost} />
                            <${ResultItem} label="Subnet Mask" value=${result.subnetMask} />
                            <${ResultItem} label="Wildcard Mask" value=${result.wildcardMask} />
                            <${ResultItem} label="Total Hosts" value=${result.totalHosts.toLocaleString()} />
                            <${ResultItem} label="Usable Hosts" value=${result.usableHosts.toLocaleString()} />
                            <${ResultItem} label="IP Class" value=${result.ipClass} />
                            <${ResultItem} label="IP Type" value=${result.ipType} />
                        </div>
                        <div class="binary-view">
                             <h4>Binary Representation</h4>
                             <div class="binary-grid">
                                <div class="binary-item">
                                    <strong>IP Address:</strong>
                                    <code>${result.binaryIp}</code>
                                </div>
                                <div class="binary-item">
                                    <strong>Subnet Mask:</strong>
                                    <code>${result.binarySubnetMask}</code>
                                </div>
                             </div>
                        </div>

                        <div class="subnet-breakdown-container">
                            <h4>Subnet Breakdown</h4>
                            <div class="form-group" style=${{ maxWidth: '350px' }}>
                                <label for="subnet-cidr-select">Select a new prefix size:</label>
                                <select 
                                    id="subnet-cidr-select" 
                                    value=${subnetCidr || ''} 
                                    onChange=${(e) => setSubnetCidr(Number(e.currentTarget.value) || null)}
                                >
                                    <option value="">-- Choose Subnet --</option>
                                    ${subnetCidrOptions.map(cidr => html`
                                        <option value=${cidr}>/${cidr} (${(Math.pow(2, cidr - result.cidr)).toLocaleString()} subnets)</option>
                                    `)}
                                </select>
                            </div>

                            ${subnets.length > 0 && html`
                                <div class="table-container subnet-breakdown-table">
                                    <div class="table-wrapper">
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Network Address</th>
                                                    <th>Usable Host Range</th>
                                                    <th>Broadcast Address</th>
                                                    <th>Usable Hosts</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                ${subnets.map(subnet => html`
                                                    <tr>
                                                        <td>${subnet.networkAddress}</td>
                                                        <td>${subnet.hostRange}</td>
                                                        <td>${subnet.broadcastAddress}</td>
                                                        <td>${subnet.usableHosts.toLocaleString()}</td>
                                                    </tr>
                                                `)}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            `}
                        </div>
                    </div>
                `
            ) : null}
        </div>
    `;
};
