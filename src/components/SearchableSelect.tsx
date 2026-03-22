import { html } from 'htm/preact';
import { useState, useRef, useEffect, useMemo } from 'preact/hooks';
import { icons } from '../constants/icons';

interface SearchableSelectOption {
    value: string;
    label: string;
}

interface SearchableSelectProps {
    options: SearchableSelectOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    required?: boolean;
    name: string;
}

export const SearchableSelect = ({ options, value, onChange, placeholder = 'Select an option', required, name }: SearchableSelectProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef<HTMLDivElement | null>(null);

    const selectedOption = useMemo(() => options.find(opt => opt.value === value), [options, value]);

    useEffect(() => {
        if (!isOpen) {
            setSearchTerm('');
        }
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const filteredOptions = useMemo(() => {
        if (!searchTerm) {
            return options;
        }
        const lowercasedQuery = searchTerm.toLowerCase().trim();
        const terms = lowercasedQuery.split(' ').filter(t => t);
        if (terms.length === 0) return options;

        return options.filter(option => {
            const searchableText = option.label.toLowerCase();
            return terms.every(term => searchableText.includes(term));
        });
    }, [searchTerm, options]);

    const handleSelect = (option: SearchableSelectOption) => {
        onChange(option.value);
        setIsOpen(false);
    };
    
    const handleInputChange = (e) => {
        setSearchTerm(e.currentTarget.value);
        if (!isOpen) {
            setIsOpen(true);
        }
    }
    
    return html`
        <div class="searchable-select-container" ref=${containerRef}>
             <input type="hidden" name=${name} value=${value || ''} required=${required} />
            <div class="searchable-select-input-wrapper" onClick=${() => setIsOpen(!isOpen)}>
                <input
                    type="text"
                    class="searchable-select-display"
                    placeholder=${placeholder}
                    value=${isOpen ? searchTerm : (selectedOption?.label || '')}
                    onInput=${handleInputChange}
                    onClick=${() => !isOpen && setIsOpen(true)}
                />
                <span class="searchable-select-chevron ${isOpen ? 'expanded' : ''}">${icons.chevron}</span>
            </div>
            ${isOpen && html`
                <ul class="searchable-select-dropdown">
                    ${filteredOptions.length > 0 ? filteredOptions.map(option => html`
                        <li
                            key=${option.value}
                            class="searchable-select-option ${option.value === value ? 'selected' : ''}"
                            onClick=${() => handleSelect(option)}
                        >
                            ${option.label}
                        </li>
                    `) : html`
                        <li class="searchable-select-option-empty">No results found</li>
                    `}
                </ul>
            `}
        </div>
    `;
};
