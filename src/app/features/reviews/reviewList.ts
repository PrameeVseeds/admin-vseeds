import { Component, ChangeDetectionStrategy, signal, computed, effect } from '@angular/core';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzMessageService } from 'ng-zorro-antd/message';
import { LucideAngularModule } from 'lucide-angular';
import { ReviewDetailModalComponent } from 'src/app/shared/components/review-detail-modal/review-detail-modal.component';
import { ReviewService } from 'src/app/core/services/reviewService';
import { openModal, openConfirm } from 'src/app/shared/utils/modal-helpers';
import {
  BaseListComponent,
  BaseListColumn,
} from '@shared/components/base-list/base-list.component';

type ReviewItem = any;

@Component({
  selector: 'app-review-list',
  standalone: true,
  imports: [NzModalModule, NzTooltipModule, BaseListComponent, LucideAngularModule],
  templateUrl: './reviewList.html',
  styleUrl: './reviewList.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewListComponent {
  protected readonly totalCount = signal(0);
  protected readonly reviews: any;
  protected readonly paginationMeta: any;
  protected readonly loading: any;
  pageSize = 20;

  protected readonly statusTabs = computed(() => [
    { label: 'All', value: 'all', count: this.getStatusCount('all') },
    { label: 'Approved', value: 'approved', count: this.getStatusCount('approved') },
    { label: 'Pending', value: 'pending', count: this.getStatusCount('pending') },
    { label: 'Rejected', value: 'rejected', count: this.getStatusCount('rejected') },
  ]);

  protected readonly columns: BaseListColumn[] = [
    { key: 'reviewer', label: 'Reviewer' },
    { key: 'product', label: 'Product' },
    { key: 'rating', label: 'Rating' },
    { key: 'comment', label: 'Comment' },
    { key: 'status', label: 'Status' },
  ];

  protected readonly approvedCount: any;
  protected readonly pendingCount: any;
  protected readonly avgRating: any;

  getStatusCount(tabValue: string): number {
    if (tabValue === 'all') return this.totalCount() > 0 ? this.totalCount() : this.paginationMeta().total;
    return this.reviews().filter((r: any) =>
      String(r.status).toLowerCase().replace(/ /g, '_') === String(tabValue).toLowerCase().replace(/ /g, '_')
    ).length;
  }

  onSearchChange(_value: string): void {
    this.reviewService.loadAll({ page: 1, limit: this.pageSize });
  }

  onTabChange(_tab: string): void {
    this.reviewService.loadAll({ page: 1, limit: this.pageSize });
  }

  onPageChange(page: number): void {
    this.reviewService.loadAll({ page, limit: this.pageSize });
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.reviewService.loadAll({ page: 1, limit: size });
  }

  protected onView(item: ReviewItem): void {
    const modal = openModal(this.modalService, {
      content: ReviewDetailModalComponent,
      data: item,
      width: '520px',
      className: 'review-detail-modal',
    });

    modal.afterClose.subscribe((result: any) => {
      if (result?.action === 'approve') {
        this.updateStatus(result.id, 'approved');
      } else if (result?.action === 'reject') {
        this.updateStatus(result.id, 'rejected');
      }
    });
  }

  private updateStatus(id: string, status: string): void {
    this.reviewService.adminReply(id, `Status changed to ${status}`).subscribe({
      next: () => {
        this.reviewService.loadAll();
        this.message.success(`Review successfully ${status}`);
      },
      error: () => this.message.error(`Failed to update review status`),
    });
  }

  protected onDelete(item: ReviewItem): void {
    const modal = openConfirm(this.modalService, {
      title: 'Delete Review',
      description:
        'Are you sure you want to delete this customer review? This action will remove it from the product page permanently.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      iconName: 'trash-2',
    });

    modal.afterClose.subscribe((result: any) => {
      if (result) {
        this.reviewService.delete(item.id).subscribe({
          next: () => {
            this.reviewService.loadAll();
            this.message.success('Review deleted');
          },
          error: () => this.message.error('Failed to delete review'),
        });
      }
    });
  }

  exportReviews(): void {
    this.reviewService.getAllForExport().subscribe((data: any[]) => {
    const headers = ['Customer', 'Product', 'Rating', 'Comment', 'Date', 'Status'];
    const rows = data.map((r: any) => [
      `"${r.customer}"`,
      `"${r.product}"`,
      r.rating.toString(),
      `"${r.comment}"`,
      r.date,
      r.status,
    ]);
    const csv = [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reviews-export-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    this.message.success('Reviews exported successfully');
    });
  }

  constructor(
    private readonly modalService: NzModalService,
    private readonly message: NzMessageService,
    private readonly reviewService: ReviewService,
  ) {
    this.reviews = this.reviewService.getAll();
    this.paginationMeta = this.reviewService.paginationMeta;
    this.loading = this.reviewService.loading;
    this.approvedCount = computed(
      () => this.reviews().filter((r: any) => r.status === 'approved').length,
    );
    this.pendingCount = computed(
      () => this.reviews().filter((r: any) => r.status === 'pending').length,
    );
    this.avgRating = computed(() => {
      const list = this.reviews();
      if (list.length === 0) return '0.0';
      const avg = list.reduce((sum: any, r: any) => sum + r.rating, 0) / list.length;
      return avg.toFixed(1);
    });

    effect(() => {
      const total = this.paginationMeta().total;
      if (total > 0 && this.totalCount() === 0) {
        this.totalCount.set(total);
      }
    });
  }
}
