

interface SubnetInfo {
  ipAddress: string;
  cidr: number;
  networkAddress: string;
  broadcastAddress: string;
  subnetMask: string;
  wildcardMask: string;
  firstHost: string;
  lastHost: string;
  totalHosts: number;
  usableHosts: number;
  ipType: 'Private' | 'Public' | 'Loopback' | 'Reserved';
  ipClass: 'A' | 'B' | 'C' | 'D' | 'E';
  binaryIp: string;
  binarySubnetMask: string;
  error?: string;
}

export interface SubnetDetail {
  networkAddress: string;
  hostRange: string;
  broadcastAddress: string;
  usableHosts: number;
}

const ipToLong = (ip: string): number => {
    return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
};

const longToIp = (long: number): string => {
    return [ (long >>> 24), (long >>> 16) & 255, (long >>> 8) & 255, long & 255 ].join('.');
};

const longToBinary = (long: number): string => {
    return (long >>> 0).toString(2).padStart(32, '0').match(/.{1,8}/g)!.join('.');
};

const getIpClass = (firstOctet: number): 'A' | 'B' | 'C' | 'D' | 'E' => {
    if (firstOctet >= 0 && firstOctet <= 127) return 'A';
    if (firstOctet >= 128 && firstOctet <= 191) return 'B';
    if (firstOctet >= 192 && firstOctet <= 223) return 'C';
    if (firstOctet >= 224 && firstOctet <= 239) return 'D';
    return 'E';
};

const getIpType = (ipLong: number): 'Private' | 'Public' | 'Loopback' | 'Reserved' => {
    // Private ranges
    if ((ipLong >= ipToLong('10.0.0.0') && ipLong <= ipToLong('10.255.255.255')) ||
        (ipLong >= ipToLong('172.16.0.0') && ipLong <= ipToLong('172.31.255.255')) ||
        (ipLong >= ipToLong('192.168.0.0') && ipLong <= ipToLong('192.168.255.255'))) {
        return 'Private';
    }
    // Loopback
    if (ipLong >= ipToLong('127.0.0.0') && ipLong <= ipToLong('127.255.255.255')) {
        return 'Loopback';
    }
    // APIPA
    if (ipLong >= ipToLong('169.254.0.0') && ipLong <= ipToLong('169.254.255.255')) {
        return 'Reserved';
    }
    // CGNAT
    if (ipLong >= ipToLong('100.64.0.0') && ipLong <= ipToLong('100.127.255.255')) {
        return 'Reserved';
    }
    // Reserved for Class E
    if (ipLong >= ipToLong('240.0.0.0')) {
        return 'Reserved';
    }
    return 'Public';
};

export const calculateSubnetInfo = (input: string): SubnetInfo | { error: string } => {
    const [ipAddress, cidrStr] = input.split('/');
    if (!ipAddress || !cidrStr) {
        return { error: 'Invalid format. Use IP/CIDR notation (e.g., 192.168.1.1/24).' };
    }

    const ipOctets = ipAddress.split('.').map(Number);
    if (ipOctets.length !== 4 || ipOctets.some(octet => isNaN(octet) || octet < 0 || octet > 255)) {
        return { error: 'Invalid IP address.' };
    }

    const cidr = parseInt(cidrStr, 10);
    if (isNaN(cidr) || cidr < 0 || cidr > 32) {
        return { error: 'Invalid CIDR prefix. Must be between 0 and 32.' };
    }

    const ipLong = ipToLong(ipAddress);
    const subnetMaskLong = cidr === 0 ? 0 : (0xFFFFFFFF << (32 - cidr)) >>> 0;
    const wildcardMaskLong = ~subnetMaskLong >>> 0;

    const networkAddressLong = (ipLong & subnetMaskLong) >>> 0;
    const broadcastAddressLong = (networkAddressLong | wildcardMaskLong) >>> 0;

    const totalHosts = Math.pow(2, 32 - cidr);
    const usableHosts = cidr <= 30 ? totalHosts - 2 : 0;

    const firstHostLong = cidr <= 30 ? networkAddressLong + 1 : networkAddressLong;
    const lastHostLong = cidr <= 30 ? broadcastAddressLong - 1 : broadcastAddressLong;
    
    return {
        ipAddress,
        cidr,
        networkAddress: longToIp(networkAddressLong),
        broadcastAddress: longToIp(broadcastAddressLong),
        subnetMask: longToIp(subnetMaskLong),
        wildcardMask: longToIp(wildcardMaskLong),
        firstHost: cidr < 31 ? longToIp(firstHostLong) : 'N/A',
        lastHost: cidr < 31 ? longToIp(lastHostLong) : 'N/A',
        totalHosts,
        usableHosts: usableHosts > 0 ? usableHosts : 0,
        ipType: getIpType(ipLong),
        ipClass: getIpClass(ipOctets[0]),
        binaryIp: longToBinary(ipLong),
        binarySubnetMask: longToBinary(subnetMaskLong),
    };
};

export const calculateSubnets = (networkAddressStr: string, originalCidr: number, newCidr: number): SubnetDetail[] => {
    if (newCidr <= originalCidr || newCidr > 32) {
        return [];
    }

    const networkAddressLong = ipToLong(networkAddressStr);
    const subnetSize = Math.pow(2, 32 - newCidr);
    const numberOfSubnets = Math.pow(2, newCidr - originalCidr);

    const subnets: SubnetDetail[] = [];

    for (let i = 0; i < numberOfSubnets; i++) {
        const currentNetworkAddressLong = networkAddressLong + (i * subnetSize);
        const wildcardMaskLong = (subnetSize - 1) >>> 0;
        const broadcastAddressLong = (currentNetworkAddressLong | wildcardMaskLong) >>> 0;

        const usableHosts = newCidr <= 30 ? subnetSize - 2 : 0;
        const firstHostLong = newCidr <= 30 ? currentNetworkAddressLong + 1 : currentNetworkAddressLong;
        const lastHostLong = newCidr <= 30 ? broadcastAddressLong - 1 : broadcastAddressLong;
        
        const hostRange = newCidr < 31 
            ? `${longToIp(firstHostLong)} - ${longToIp(lastHostLong)}`
            : 'N/A';
        
        subnets.push({
            networkAddress: longToIp(currentNetworkAddressLong),
            hostRange,
            broadcastAddress: longToIp(broadcastAddressLong),
            usableHosts: usableHosts > 0 ? usableHosts : 0,
        });
    }

    return subnets;
};
