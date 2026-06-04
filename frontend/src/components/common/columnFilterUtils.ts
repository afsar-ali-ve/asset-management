export const COLUMN_FILTER_OPTIONS = [
    'Contains',
    'Does not contain',
    'Equals',
    'Does not equal',
    'Begins with',
    'Ends with',
    'Blank',
    'Not blank',
];

export const DEFAULT_COLUMN_FILTER = {
    operator: 'Contains',
    value: '',
};

const normalizeFilterValue = (value) => {
    if (value === null || value === undefined) {
        return '';
    }
    return String(value).trim().toLowerCase();
};

export const columnFilterNeedsValue = (operator) => operator !== 'Blank' && operator !== 'Not blank';

export const valueMatchesColumnFilter = (rawValue, filter) => {
    if (!filter) {
        return true;
    }

    const value = normalizeFilterValue(rawValue);
    const filterValue = normalizeFilterValue(filter.value);

    if (filter.operator === 'Blank') {
        return value.length === 0;
    }
    if (filter.operator === 'Not blank') {
        return value.length > 0;
    }
    if (!filterValue) {
        return true;
    }

    switch (filter.operator) {
        case 'Contains':
            return value.includes(filterValue);
        case 'Does not contain':
            return !value.includes(filterValue);
        case 'Equals':
            return value === filterValue;
        case 'Does not equal':
            return value !== filterValue;
        case 'Begins with':
            return value.startsWith(filterValue);
        case 'Ends with':
            return value.endsWith(filterValue);
        default:
            return true;
    }
};

export const hasColumnFilters = (columnFilters) => Object.keys(columnFilters).length > 0;
