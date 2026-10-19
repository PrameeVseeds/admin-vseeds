import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzMessageService } from 'ng-zorro-antd/message';
import { QuillModule } from 'ngx-quill';
import { FaqService } from 'src/app/core/services/faqService';
import { FloatLabelComponent } from 'src/app/shared/components/float-label/float-label.component';
import { FormErrorComponent } from 'src/app/shared/components/form-error/form-error.component';

@Component({
  selector: 'app-faq-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzButtonModule,
    NzCardModule,
    NzInputNumberModule,
    NzDividerModule,
    LucideAngularModule,
    QuillModule,
    FloatLabelComponent,
    FormErrorComponent,
  ],
  templateUrl: './faq-form.component.html',
  styleUrls: ['./faq-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FaqFormComponent {
  readonly faqId: string | null;
  readonly isEditMode: boolean;

  private readonly faqs: any;
  private readonly customCategories = signal<string[]>([]);
  readonly categoryOptions: any;

  readonly siteOptions = [
    { value: 'electronics', label: 'Electronics' },
    { value: 'embedded', label: 'Embedded / PCB' },
    { value: 'both', label: 'Both Sites' },
  ];

  readonly form: any;

  readonly editorModules = {
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link'],
      ['clean'],
    ],
  };

  constructor(private readonly fb: FormBuilder, private readonly route: ActivatedRoute, private readonly router: Router, private readonly message: NzMessageService, private readonly faqService: FaqService) {
      this.faqId = this.route.snapshot.paramMap.get('id');
      this.isEditMode = !!this.faqId;
      this.faqs = this.faqService.getAll();
      this.categoryOptions = computed(() => {
          const dbCategories = this.faqs()
            .map((f: any) => f.category)
            .filter(Boolean);
          const defaults = ['General', 'Ordering', 'Payment', 'Shipping', 'Returns', 'Technical'];
          const merged = new Set([...defaults, ...dbCategories, ...this.customCategories()]);
          return Array.from(merged).sort();
        });
      this.form = this.fb.group({
          question: ['', [Validators.required]],
          answer: ['', [Validators.required]],
          category: [null as string | null, [Validators.required]],
          site: ['both', [Validators.required]],
          order: [0, [Validators.required, Validators.min(0)]],
          status: ['Active', [Validators.required]],
        });
    if (this.isEditMode) {
      this.faqService.loadById(this.faqId!).subscribe({
        next: (res: any) => {
          const faq = res?.data ?? res;
          if (faq) {
            this.form.patchValue({
              question: faq.question,
              answer: faq.answer || '',
              category: faq.category,
              site: faq.site ?? 'both',
              order: faq.displayOrder,
              status: faq.isActive ? 'Active' : 'Inactive',
            } as any);
          }
        },
      });
    }
  }

  addCategory(input: HTMLInputElement): void {
    const value = input.value.trim();
    if (value && !this.categoryOptions().includes(value)) {
      this.customCategories.update((list: any) => [...list, value]);
      this.form.patchValue({ category: value });
      this.message.success(`Category "${value}" added`);
    }
    input.value = '';
  }

  submit(): void {
    if (this.form.valid) {
      const val = this.form.getRawValue();
      const payload = {
        question: val.question,
        answer: val.answer,
        category: val.category,
        site: val.site,
        displayOrder: val.order,
        isActive: val.status === 'Active',
      };

      if (this.isEditMode) {
        this.faqService.update(this.faqId!, payload).subscribe({
          next: () => {
            this.message.success('FAQ entry updated successfully');
            this.router.navigate(['/faqs']);
          },
          error: (err: any) => {
            const errMsg = Array.isArray(err?.error?.message)
              ? err.error.message.join(', ')
              : err?.error?.message || 'Failed to update FAQ';
            this.message.error(errMsg);
          },
        });
      } else {
        this.faqService.add(payload).subscribe({
          next: () => {
            this.message.success('FAQ entry created successfully');
            this.router.navigate(['/faqs']);
          },
          error: (err: any) => {
            const errMsg = Array.isArray(err?.error?.message)
              ? err.error.message.join(', ')
              : err?.error?.message || 'Failed to create FAQ';
            this.message.error(errMsg);
          },
        });
      }
    } else {
      Object.values(this.form.controls).forEach((control: any) => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/faqs']);
  }
}
