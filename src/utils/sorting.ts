import type { ColumnDefinition } from '../types';

export const sortData = <T extends {}>(
    data: T[],
    sortConfig: { key: string; direction: 'asc' | 'desc' } | null,
    columnConfig: { [key: string]: Partial<ColumnDefinition<T>> }
): T[] => {
    if (!sortConfig || !sortConfig.key) {
        return data;
    }
    
    const { key, direction } = sortConfig;
    const sortType = columnConfig[key]?.sortType || 'string';

    return [...data].sort((a, b) => {
        const valueA = columnConfig[key]?.exportValue ? columnConfig[key].exportValue(a) : a[key];
        const valueB = columnConfig[key]?.exportValue ? columnConfig[key].exportValue(b) : b[key];

        if (valueA == null && valueB == null) return 0;
        if (valueA == null) return direction === 'asc' ? -1 : 1;
        if (valueB == null) return direction === 'asc' ? 1 : -1;

        let comparison = 0;
        switch (sortType) {
            case 'number':
                comparison = Number(valueA) - Number(valueB);
                break;
            case 'date':
                const dateA = new Date(valueA as string).getTime();
                const dateB = new Date(valueB as string).getTime();
                if (isNaN(dateA) && isNaN(dateB)) comparison = 0;
                else if (isNaN(dateA)) comparison = 1;
                else if (isNaN(dateB)) comparison = -1;
                else comparison = dateA - dateB;
                break;
            case 'string':
            default:
                comparison = String(valueA).toLowerCase().localeCompare(String(valueB).toLowerCase());
                break;
        }

        return direction === 'asc' ? comparison : -comparison;
    });
};
