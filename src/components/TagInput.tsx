import { html } from 'htm/preact';
import { useState } from 'preact/hooks';
import { icons } from '../constants/icons';

export const TagInput = ({ allTags, selectedTagIds, onChange }) => {
    const [inputValue, setInputValue] = useState('');
    const [isDropdownOpen, setDropdownOpen] = useState(false);

    const selectedTags = (selectedTagIds || []).map(id => allTags.find(t => t.id === id)).filter(Boolean);
    const availableTags = allTags.filter(t => !t.isDeleted && !(selectedTagIds || []).includes(t.id));

    const handleRemoveTag = (tagId) => {
        onChange((selectedTagIds || []).filter(id => id !== tagId));
    };

    const handleAddTag = (tag) => {
        if (!tag) return;
        onChange([...(selectedTagIds || []), tag.id]);
        setInputValue('');
        setDropdownOpen(false);
    };

    const filteredAvailableTags = availableTags.filter(tag =>
        tag.label.toLowerCase().includes(inputValue.toLowerCase())
    );

    return html`
        <div class="tag-input-container" style="position: relative;">
            <div class="tag-input-wrapper" style="display: flex; flex-wrap: wrap; gap: 0.5rem; padding: 0.5rem; border: 1px solid var(--input-border-color); border-radius: 8px; align-items: center;">
                ${selectedTags.map(tag => html`
                    <span key=${tag.id} class="tag-item" style="background-color: ${tag.color || 'var(--hover-bg-color)'}; color: ${tag.color ? '#fff' : 'var(--font-color)'}; padding: 0.25rem 0.75rem; border-radius: 16px; font-size: 0.9rem; font-weight: 500; display: flex; align-items: center; gap: 0.5rem;">
                        ${tag.label}
                        <button type="button" onClick=${() => handleRemoveTag(tag.id)} style="background: none; border: none; color: inherit; cursor: pointer; line-height: 1; padding: 0.1rem; opacity: 0.7; border-radius: 50%;">×</button>
                    </span>
                `)}
                <input
                    type="text"
                    value=${inputValue}
                    onInput=${(e) => setInputValue(e.currentTarget.value)}
                    onFocus=${() => setDropdownOpen(true)}
                    onBlur=${() => setTimeout(() => setDropdownOpen(false), 200)}
                    placeholder="Add a tag..."
                    style="flex-grow: 1; border: none; outline: none; background: transparent; padding: 0.25rem; font-size: 1rem;"
                />
            </div>
            ${isDropdownOpen && filteredAvailableTags.length > 0 && html`
                <ul class="searchable-select-dropdown" style="max-height: 150px;">
                    ${filteredAvailableTags.map(tag => html`
                        <li key=${tag.id} class="searchable-select-option" onClick=${() => handleAddTag(tag)}>
                            ${tag.label}
                        </li>
                    `)}
                </ul>
            `}
        </div>
    `;
};