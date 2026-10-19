import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  TemplateRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { PaginationMeta } from '@services/apiService';

export interface BaseListColumn {
  key: string;
  label: string;
  width?: string;
}

export interface BaseListTab {
  label: string;
  value: string;
  count?: number;
}

@Component({
  selector: 'app-base-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzCardModule,
    NzInputModule,
    NzTabsModule,
    NzTableModule,
    NzPaginationModule,
  ],
  templateUrl: './base-list.component.html',
  styleUrl: './base-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseListComponent {
  readonly title = input<string>('');
  readonly tabs = input<BaseListTab[]>([]);
  readonly columns = input<BaseListColumn[]>([]);
  readonly items = input<any[]>([]);
  readonly paginationMeta = input<PaginationMeta>({
    total: 0,
    totalPages: 1,
    page: 1,
  });
  readonly searchPlaceholder = input<string>('Search...');
  readonly loading = input<boolean>(false);
  readonly pageSize = input<number>(20);
  readonly cellTemplates = input<Record<string, TemplateRef<{ $implicit: any; item: any }>>>({});
  readonly rowActionsTemplate = input<TemplateRef<{ $implicit: any; item: any }> | null>(null);

  readonly searchChange = output<string>();
  readonly tabChange = output<{ value: string }>();
  readonly pageChange = output<number>();
  readonly pageSizeChange = output<number>();

  protected readonly searchValue = signal('');
  private searchTimer: any;

  onSearchChange(value: string): void {
    this.searchValue.set(value);
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.searchChange.emit(value), 400);
  }

  onTabIndexChange(index: number): void {
    const tab = this.tabs()[index];
    if (tab) {
      this.tabChange.emit({ value: tab.value });
    }
  }

  onPageChange(page: number): void {
    this.pageChange.emit(page);
  }

  onPageSizeChange(size: number): void {
    this.pageSizeChange.emit(size);
  }
}
