import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EnumValue } from '../models';

@Component({
  selector: 'app-tag-input',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="tag-input-wrapper">
      <div class="tags-list">
        @for (tagId of selectedTagIds; track tagId) {
          @if (getTag(tagId); as tag) {
            <span class="tag-chip" [style.background]="tag.color || '#3498db'">
              {{ tag.label }}
              <button class="tag-remove" (click)="removeTag(tagId)">×</button>
            </span>
          }
        }
      </div>
      <div class="tag-add">
        <button class="btn btn-sm" (click)="showDropdown = !showDropdown">+ Add Tag</button>
        @if (showDropdown) {
          <div class="tag-dropdown">
            @for (tag of availableTags; track tag.id) {
              <div class="tag-option" (click)="addTag(tag.id)">
                @if (tag.color) {
                  <span class="tag-dot" [style.background]="tag.color"></span>
                }
                {{ tag.label }}
              </div>
            } @empty {
              <div class="tag-empty">No tags available</div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .tag-input-wrapper { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
    .tags-list { display: flex; flex-wrap: wrap; gap: 4px; }
    .tag-chip { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 12px; color: #fff; font-size: 12px; font-weight: 500; }
    .tag-remove { background: none; border: none; color: #fff; font-size: 14px; cursor: pointer; padding: 0 2px; margin-left: 2px; }
    .tag-add { position: relative; }
    .btn-sm { padding: 4px 10px; font-size: 12px; border: 1px solid var(--border-color,#ddd); border-radius: 6px; background: var(--bg-card,#fff); cursor: pointer; }
    .tag-dropdown { position: absolute; top: 100%; left: 0; background: var(--bg-card,#fff); border: 1px solid var(--border-color,#ddd); border-radius: 8px; box-shadow: 0 4px 16px rgba(0,0,0,0.1); min-width: 160px; max-height: 200px; overflow-y: auto; z-index: 100; margin-top: 4px; }
    .tag-option { padding: 8px 12px; cursor: pointer; font-size: 13px; display: flex; align-items: center; gap: 6px; }
    .tag-option:hover { background: var(--bg-hover,#f5f5f5); }
    .tag-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .tag-empty { padding: 12px; text-align: center; color: var(--text-secondary,#888); font-size: 13px; }
  `],
  host: { '(document:click)': 'onDocClick($event)' }
})
export class TagInputComponent {
  @Input() allTags: EnumValue[] = [];
  @Input() selectedTagIds: string[] = [];
  @Output() selectedTagIdsChange = new EventEmitter<string[]>();

  showDropdown = false;

  get availableTags(): EnumValue[] {
    return this.allTags.filter(t => !t.is_deleted && !this.selectedTagIds.includes(t.id));
  }

  getTag(id: string): EnumValue | undefined {
    return this.allTags.find(t => t.id === id);
  }

  addTag(id: string) {
    this.selectedTagIds = [...this.selectedTagIds, id];
    this.selectedTagIdsChange.emit(this.selectedTagIds);
    this.showDropdown = false;
  }

  removeTag(id: string) {
    this.selectedTagIds = this.selectedTagIds.filter(t => t !== id);
    this.selectedTagIdsChange.emit(this.selectedTagIds);
  }

  onDocClick(event: MouseEvent) {
    if (!(event.target as HTMLElement).closest('app-tag-input')) this.showDropdown = false;
  }
}
