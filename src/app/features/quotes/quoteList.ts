import { Component, ChangeDetectionStrategy, signal, computed, effect } from '@angular/core';
import { QuoteService } from 'src/app/core/services/quoteService';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { LucideAngularModule } from 'lucide-angular';
import { QuoteDetailModalComponent } from 'src/app/shared/components/quote-detail-modal/quote-detail-modal.component';
import { openModal } from 'src/app/shared/utils/modal-helpers';
import {
  BaseListComponent,
  BaseListColumn,
} from '@shared/components/base-list/base-list.component';

@Component({
  selector: 'app-quote-list',
  standalone: true,
  imports: [BaseListComponent, NzTooltipModule, NzModalModule, LucideAngularModule],
  templateUrl: './quoteList.html',
  styleUrl: './quoteList.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuoteListComponent {
  protected readonly totalCount = signal(0);
  protected readonly quotes: any;
  protected readonly paginationMeta: any;
  protected readonly loading: any;
  pageSize = 20;

  protected readonly columns: BaseListColumn[] = [
    { key: 'request', label: 'Quote Request' },
    { key: 'specifications', label: 'Specifications' },
    { key: 'estimate', label: 'Estimate' },
    { key: 'status', label: 'Status' },
  ];

  protected readonly pendingCount: any;
  protected readonly quotedCount: any;
  protected readonly rejectedCount: any;

  onSearchChange(_value: string): void {
    this.quoteService.loadAll({ page: 1, limit: this.pageSize });
  }

  onPageChange(page: number): void {
    this.quoteService.loadAll({ page, limit: this.pageSize });
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.quoteService.loadAll({ page: 1, limit: size });
  }

  viewQuote(quote: any) {
    const modal = openModal(this.modalService, {
      content: QuoteDetailModalComponent,
      data: quote,
      width: '680px',
    });

    modal.afterClose.subscribe((result: any) => {
      if (result?.action === 'respond') {
        this.updateStatus(result.id, 'quoted');
      } else if (result?.action === 'reject') {
        this.updateStatus(result.id, 'declined');
      }
    });
  }

  private updateStatus(id: string, status: string): void {
    this.quoteService.updateStatus(id, status).subscribe({
      next: () => {
        this.quoteService.loadAll();
        this.message.success(`Quote successfully ${status}`);
      },
      error: () => this.message.error(`Failed to update quote status`),
    });
  }

  constructor(
    private readonly quoteService: QuoteService,
    private readonly modalService: NzModalService,
    private readonly message: NzMessageService,
  ) {
    this.quotes = this.quoteService.getAll();
    this.paginationMeta = this.quoteService.paginationMeta;
    this.loading = this.quoteService.loading;
    this.pendingCount = computed(
      () => this.quotes().filter((q: any) => q.status === 'pending').length,
    );
    this.quotedCount = computed(
      () => this.quotes().filter((q: any) => q.status === 'quoted').length,
    );
    this.rejectedCount = computed(
      () => this.quotes().filter((q: any) => q.status === 'declined').length,
    );

    effect(() => {
      const total = this.paginationMeta().total;
      if (total > 0 && this.totalCount() === 0) {
        this.totalCount.set(total);
      }
    });
  }
}
