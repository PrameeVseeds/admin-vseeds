import { Component, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CategoryService } from 'src/app/core/services/category.service';
import { ImageService } from 'src/app/core/services/imageService';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { LucideAngularModule } from 'lucide-angular';
import { NzMessageService } from 'ng-zorro-antd/message';
import { FloatLabelComponent } from 'src/app/shared/components/float-label/float-label.component';
import { FormErrorComponent } from 'src/app/shared/components/form-error/form-error.component';
import { MyValidators } from 'src/app/shared/validators/custom-validator';
import { ImagePreviewModalComponent } from 'src/app/shared/components/image-preview-modal/image-preview-modal.component';
import { openModal } from 'src/app/shared/utils/modal-helpers';

@Component({
  selector: 'app-category-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzButtonModule,
    NzCardModule,
    NzModalModule,
    NzTooltipModule,
    LucideAngularModule,
    FloatLabelComponent,
    FormErrorComponent,
  ],
  templateUrl: './category-form.html',
  styleUrl: './category-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryFormComponent {
  readonly categoryId: string | null;
  readonly isEditMode: boolean;

  previewImage: string | undefined = '';
  imageFile: File | null = null;

  get suggestedImagePrompt(): string {
    const name = this.form.get('name')?.value;
    const desc = this.form.get('description')?.value;

    if (!name) return '';

    let prompt = `Modern professional illustration representing the "${name}" category for an electronics e-commerce store`;
    if (desc) prompt += `. ${desc}`;
    prompt += `. Clean flat design, vibrant colors, suitable for a category banner image. High resolution, minimal and professional. Include the text "VSEEDS.LK" in the design and the VSEEDS logo — a dark teal-green abstract lettermark with interconnected flowing lines and horizontal stripes inside a rounded square frame.`;
    return prompt;
  }

  copyImagePrompt(): void {
    const prompt = this.suggestedImagePrompt;
    if (!prompt) return;
    navigator.clipboard.writeText(prompt).then(() => {
      this.message.success('Prompt copied to clipboard');
    });
  }

  readonly form: any;

  constructor(private readonly fb: FormBuilder, private readonly route: ActivatedRoute, private readonly router: Router, private readonly categoryService: CategoryService, private readonly message: NzMessageService, private readonly modalService: NzModalService, private readonly imageService: ImageService) {
      this.categoryId = this.route.snapshot.paramMap.get('id');
      this.isEditMode = !!this.categoryId;
      this.form = this.fb.group({
          name: ['', [Validators.required, MyValidators.spaceValidator()]],
          slug: ['', [Validators.required, MyValidators.spaceValidator()]],
          status: ['active', [Validators.required]],
          description: [''],
        });
    if (this.isEditMode) {
      this.categoryService.loadById(this.categoryId!).subscribe({
        next: (res: any) => {
          const category = res?.data ?? res;
          if (category) {
            this.form.patchValue({
              ...category,
              status: category.status.toLowerCase(),
            });
            this.previewImage = category.icon;
          }
        },
      });
    }

    this.form.controls.name.valueChanges.subscribe((name: any) => {
      if (!this.form.controls.slug.dirty && name) {
        const slug = name
          .trim()
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/[\s_]+/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');
        this.form.controls.slug.setValue(slug);
      }
    });
  }

  removeImage(): void {
    this.previewImage = undefined;
    this.imageFile = null;
    this.form.patchValue({ icon: '' } as any);
  }

  previewFullImage(): void {
    if (!this.previewImage) return;
    openModal(this.modalService, {
      content: ImagePreviewModalComponent,
      data: {
        images: [this.previewImage],
        title: this.form.get('name')?.value || 'Category Icon',
      },
      width: '700px',
      className: 'image-preview-modal',
    });
  }

  submit() {
    if (this.form.valid) {
      const formValue = this.form.getRawValue();

      const categoryData: any = {
        name: formValue.name,
        slug: formValue.slug,
        status: formValue.status!.toLowerCase(),
        description: formValue.description || '',
      };

      if (this.imageFile) {
        const formData = new FormData();
        formData.append('file', this.imageFile);
        this.imageService.upload(formData, formValue.name!, 'categories').subscribe({
          next: (res: any) => {
            const uploadedUrl = res?.data?.url ?? res?.url;
            if (uploadedUrl) {
              categoryData.icon = uploadedUrl;
            }
            this.saveCategory(categoryData);
          },
          error: () => this.message.error('Failed to upload category icon'),
        });
      } else {
        this.saveCategory(categoryData);
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

  private saveCategory(categoryData: any): void {
    if (this.isEditMode) {
      this.categoryService.update(this.categoryId!, categoryData).subscribe({
        next: () => {
          this.message.success('Category updated successfully');
          this.router.navigate(['/categories']);
        },
        error: (err: any) => this.message.error(err?.error?.message || 'Failed to update category'),
      });
    } else {
      this.categoryService.add(categoryData).subscribe({
        next: () => {
          this.message.success('Category added successfully');
          this.router.navigate(['/categories']);
        },
        error: (err: any) => this.message.error(err?.error?.message || 'Failed to add category'),
      });
    }
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        this.message.error('Please select an image file');
        return;
      }
      this.imageFile = file;
      const reader = new FileReader();
      reader.onload = (e) => (this.previewImage = e.target?.result as string);
      reader.readAsDataURL(file);
    }
  }

  goBack() {
    this.router.navigate(['/categories']);
  }
}
