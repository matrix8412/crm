export const areDatesEqual = (date1: Date, date2: Date): boolean => {
    if (!date1 || !date2 || isNaN(date1.getTime()) || isNaN(date2.getTime())) return false;
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
};

export const createInitialVisibility = (config, defaultHiddenKeys = []) => Object.keys(config).reduce((acc, key) => ({ ...acc, [key]: !defaultHiddenKeys.includes(key) }), {});

export const generatePlanTooltipText = (plan, customerMap, deviceMap, enumMaps) => {
    if (!plan) return '';

    const category = enumMaps.planCategory?.get(plan.category)?.label || 'N/A';
    const customer = customerMap.get(plan.customerId);
    const device = deviceMap.get(plan.deviceId);
    
    const customerName = customer 
        ? `${customer.firstName} ${customer.lastName}` 
        : '';
        
    const deviceName = device ? device.name : '';
    
    let tooltipLines = [];

    tooltipLines.push(`Category: ${category}`);

    if (customerName) {
        tooltipLines.push(`Customer: ${customerName}`);
    }

    if (deviceName) {
        tooltipLines.push(`Device: ${deviceName}`);
    }
    
    if (plan.description) {
        // Truncate long descriptions
        const desc = plan.description.length > 100 ? plan.description.substring(0, 97) + '...' : plan.description;
        tooltipLines.push(`\n${desc}`);
    }

    return tooltipLines.join('\n');
};