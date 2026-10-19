import {
  Component,
  ChangeDetectionStrategy,
  signal,
  OnInit,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, Validators } from '@angular/forms';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { LucideAngularModule } from 'lucide-angular';
import { BankService } from 'src/app/core/services/bankService';
import { Bank } from 'src/app/core/models/bank.model';
import { FloatLabelComponent } from '@shared/components/float-label/float-label.component';
import { openConfirm } from 'src/app/shared/utils/modal-helpers';

@Component({
  selector: 'app-bank-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzTableModule,
    NzModalModule,
    NzInputModule,
    NzSwitchModule,
    NzInputNumberModule,
    NzTooltipModule,
    LucideAngularModule,
    FloatLabelComponent,
  ],
  templateUrl: './bankManagement.html',
  styleUrl: './bankManagement.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BankManagementComponent implements OnInit {
  readonly banks = signal<Bank[]>([]);
  readonly searchQuery = signal<string>('');
  readonly loading = signal<boolean>(false);
  readonly isModalVisible = signal<boolean>(false);
  readonly isEditing = signal<boolean>(false);
  private currentBankId: string | null = null;

  readonly filteredBanks = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const allBanks = this.banks();
    if (!query) return allBanks;

    return allBanks.filter((b: any) =>
        b.bankName.toLowerCase().includes(query) ||
        b.branch.toLowerCase().includes(query) ||
        b.accountName.toLowerCase().includes(query) ||
        b.accountNumber.toLowerCase().includes(query),
    );
  });

  readonly form: any;

  ngOnInit(): void {
    this.loadBanks();
  }

  loadBanks(): void {
    this.loading.set(true);
    this.bankService.getAll().subscribe({
      next: (data) => {
        this.banks.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.message.error('Failed to load bank accounts');
        this.loading.set(false);
      },
    });
  }

  showAddModal(): void {
    this.isEditing.set(false);
    this.currentBankId = null;
    this.form.reset({ isActive: true, displayOrder: 0 });
    this.isModalVisible.set(true);
  }

  showEditModal(bank: Bank): void {
    this.isEditing.set(true);
    this.currentBankId = bank.id!;
    this.form.patchValue({
      bankName: bank.bankName,
      branch: bank.branch,
      accountNumber: bank.accountNumber,
      accountName: bank.accountName,
      isActive: bank.isActive,
      displayOrder: bank.displayOrder,
    });
    this.isModalVisible.set(true);
  }

  handleCancel(): void {
    this.isModalVisible.set(false);
  }

  handleSave(): void {
    if (this.form.invalid) {
      Object.values(this.form.controls).forEach((control: any) => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      return;
    }

    const data = this.form.getRawValue() as Bank;
    this.loading.set(true);

    if (this.isEditing() && this.currentBankId) {
      this.bankService.update(this.currentBankId, data).subscribe({
        next: () => {
          this.message.success('Bank account updated successfully');
          this.loadBanks();
          this.isModalVisible.set(false);
        },
        error: () => {
          this.message.error('Failed to update bank account');
          this.loading.set(false);
        },
      });
    } else {
      this.bankService.create(data).subscribe({
        next: () => {
          this.message.success('Bank account added successfully');
          this.loadBanks();
          this.isModalVisible.set(false);
        },
        error: () => {
          this.message.error('Failed to add bank account');
          this.loading.set(false);
        },
      });
    }
  }

  confirmDelete(bank: Bank): void {
    const ref = openConfirm(this.modal, {
      title: 'Delete Bank Account',
      description: `Are you sure you want to delete ${bank.bankName} (${bank.accountNumber})? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      iconName: 'trash-2',
    }, { width: '420px' });

    ref.afterClose.subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.loading.set(true);
        this.bankService.delete(bank.id!).subscribe({
          next: () => {
            this.message.success('Bank account deleted successfully');
            this.loadBanks();
          },
          error: () => {
            this.message.error('Failed to delete bank account');
            this.loading.set(false);
          },
        });
      }
    });
  }

  toggleStatus(bank: Bank): void {
    this.bankService.update(bank.id!, { isActive: !bank.isActive }).subscribe({
      next: () => {
        this.message.success('Status updated');
        this.loadBanks();
      },
      error: () => {
        this.message.error('Failed to update status');
      },
    });
  }

    constructor(private readonly bankService: BankService, private readonly fb: FormBuilder, private readonly modal: NzModalService, private readonly message: NzMessageService) {
        this.form = this.fb.group({
            bankName: ['', [Validators.required]],
            branch: ['', [Validators.required]],
            accountNumber: ['', [Validators.required]],
            accountName: ['', [Validators.required]],
            isActive: [true],
            displayOrder: [0],
          });
    }
}
