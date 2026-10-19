import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  computed,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  signal,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzUploadModule, NzUploadFile } from 'ng-zorro-antd/upload';
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzMessageService } from 'ng-zorro-antd/message';
import { LucideAngularModule } from 'lucide-angular';
import { FloatLabelComponent } from 'src/app/shared/components/float-label/float-label.component';
import { FormErrorComponent } from 'src/app/shared/components/form-error/form-error.component';
import { ProductService } from 'src/app/core/services/product.service';
import { ProductModalsService } from '../../product-modals.service';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzInputNumberModule,
    NzDatePickerModule,
    NzSwitchModule,
    NzUploadModule,
    NzAutocompleteModule,
    NzButtonModule,
    NzTooltipModule,
    LucideAngularModule,
    FloatLabelComponent,
    FormErrorComponent,
  ],
  templateUrl: './product-form.component.html',
  styleUrl: './product-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductFormComponent implements OnInit, OnChanges {
  @Input() product: any = null;
  @Input({ required: true }) categories: any[] = [];

  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  protected readonly availableSubcategories = signal<string[]>([]);
  protected readonly saving = signal(false);
  protected readonly attributesList = signal<{ id: string; name: string }[]>([]);
  protected readonly attributeNames = computed(() => this.attributesList().map((a) => a.name));
  protected categoryNames: string[] = [];
  private lastCategory: string | null = null;
  thumbnailFile: NzUploadFile[] = [];
  otherFiles: NzUploadFile[] = [];

  readonly form: any;

  get suggestedImagePrompt(): string {
    const name = this.form.get('name')?.value;
    const desc = this.form.get('description')?.value;
    const cat = this.form.get('category')?.value;

    if (!name) return '';

    let prompt = `Professional product photo of "${name}"`;
    if (cat) prompt += `, ${cat} category`;
    if (desc) prompt += `. ${desc}`;
    prompt += `. Shot on a clean white background with soft studio lighting. High resolution, e-commerce ready, sharp focus, commercial product photography style. Include a subtle "VSEEDS.LK" watermark and a small VSEEDS logo — a dark teal-green abstract lettermark with interconnected flowing lines and horizontal stripes inside a rounded square frame — in a corner.`;
    return prompt;
  }

  constructor(
    private readonly fb: FormBuilder,
    private readonly productService: ProductService,
    private readonly productModals: ProductModalsService,
    private readonly msg: NzMessageService,
    private readonly cdr: ChangeDetectorRef,
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required]],
      category: [null as string | null, [Validators.required]],
      subCategory: [null as string | null],
      sku: [''],
      storeId: [''],
      manufacturer: [''],
      manufacturerProductNumber: [''],
      productLink: [{ value: '', disabled: true }],
      dataSheet: [''],
      model3dUrl: [''],
      tags: [[] as string[]],
      orderedQty: [0],
      expectedDate: [null as Date | null],
      inHandQty: [0, [Validators.required, Validators.min(0)]],
      purchasedPrice: [null as number | null],
      price1: [null as number | null, [Validators.required, Validators.min(0)]],
      price10: [null as number | null],
      price100: [null as number | null],
      minPurchaseValue: [null as number | null, [Validators.min(1)]],
      description: [''],
      shortDescription: [''],
      specifications: [''],
      status: [true],
      isFeatured: [false],
      attributes: this.fb.array([]),
    });

    this.form.get('name')?.valueChanges.subscribe((name: any) => {
      if (name) {
        this.form.get('productLink')?.setValue(this.generateSlug(name));
      } else {
        this.form.get('productLink')?.setValue('');
      }
    });

    this.form.get('category')?.valueChanges.subscribe((catName: any) => {
      const category = this.categories.find((c: any) => c.name === catName);
      if (category && Array.isArray(category.children)) {
        this.availableSubcategories.set(category.children.map((c: any) => c.name));
      } else {
        this.availableSubcategories.set([]);
      }
      if (catName !== this.lastCategory) {
        this.lastCategory = catName;
        this.form.get('subCategory')?.setValue(null);
      }
    });
  }

  ngOnInit(): void {
    this.refreshCategoryNames();
    this.productService.loadAttributes().subscribe({
      next: (res: any) => {
        const list = res?.data ?? res ?? [];
        this.attributesList.set(list);
      },
      error: () => this.msg.error('Failed to load attributes'),
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.refreshCategoryNames();
    if (changes['product']) {
      this.populateOrReset();
    }
  }

  private populateOrReset(): void {
    if (this.product) {
      this.populateEditForm(this.product);
    } else {
      this.resetForAdd();
    }
  }

  private resetForAdd(): void {
    this.form.reset({ status: true, inHandQty: 0, orderedQty: 0 });
    this.thumbnailFile = [];
    this.otherFiles = [];
    this.availableSubcategories.set([]);
  }

  private refreshCategoryNames(): void {
    this.categoryNames = this.categories.map((c: any) => c.name);
  }

  get attributesFormArray(): FormArray {
    return this.form.get('attributes') as FormArray;
  }

  addAttribute(attribute?: any): void {
    this.attributesFormArray.push(
      this.fb.group({
        attributeId: [attribute?.attributeId || ''],
        name: [attribute?.name || '', [Validators.required]],
        value: [attribute?.value || '', [Validators.required]],
        isSimilarFilter: [attribute?.isSimilarFilter || false],
      }),
    );
  }

  removeAttribute(index: number): void {
    this.attributesFormArray.removeAt(index);
  }

  private populateEditForm(product: any): void {
    const category = this.categories.find(
      (c: any) => c.name === (product.categoryName || product.category),
    );
    if (category && Array.isArray(category.children)) {
      this.availableSubcategories.set(category.children.map((c: any) => c.name));
    } else {
      this.availableSubcategories.set([]);
    }

    const specs = product.specifications;
    this.form.patchValue({
      name: product.name,
      category: product.categoryName || product.category,
      subCategory: product.subCategory ?? '',
      sku: product.sku ?? product.storeId ?? '',
      storeId: product.storeId ?? product.sku ?? '',
      manufacturer: product.manufacturer ?? '',
      manufacturerProductNumber:
        product.manufacturerProductNumber ?? product.mpn ?? '',
      productLink: product.productLink ?? '',
      dataSheet: product.dataSheet ?? product.datasheetUrl ?? '',
      model3dUrl: product.model3dUrl ?? product.model_3d_url ?? '',
      tags: product.tags ?? [],
      orderedQty: product.orderedQty ?? 0,
      expectedDate: product.expectedDate ? new Date(product.expectedDate) : null,
      inHandQty: product.inHandQty,
      purchasedPrice: product.purchasedPrice ?? null,
      price1: product.price1,
      price10: product.price10 ?? null,
      price100: product.price100 ?? null,
      description: product.description,
      shortDescription: product.shortDescription ?? '',
      minPurchaseValue: product.minPurchaseValue || null,
      specifications: Array.isArray(specs) ? specs[0] || '' : (specs ?? ''),
      status: product.status?.toLowerCase() === 'active',
      isFeatured:
        product.isFeatured === true ||
        product.isFeatured === 1 ||
        product.isFeatured === 'true' ||
        product.isFeatured === '1',
    });
    this.thumbnailFile = product.thumbnailImage
      ? [{ uid: '-1', name: 'thumbnail.png', status: 'done', url: product.thumbnailImage }]
      : [];

    this.attributesFormArray.clear();
    (product.attributes || [])
      .filter((attr: any) => attr?.name?.trim() && attr?.value?.trim())
      .forEach((attr: any) => this.addAttribute(attr));

    const gallery: string[] = product.otherImages || product.images || [];
    this.otherFiles = gallery
      .filter((url: string) => url && url !== product.thumbnailImage)
      .map((url: string, i: number) => ({
        uid: `-${i + 2}`,
        name: `image-${i + 1}.png`,
        status: 'done' as const,
        url,
      }));
  }

  cancel(): void {
    this.cancelled.emit();
  }

  copyImagePrompt(): void {
    const prompt = this.suggestedImagePrompt;
    if (!prompt) return;
    navigator.clipboard.writeText(prompt).then(() => {
      this.msg.success('Prompt copied to clipboard');
    });
  }

  copyProductLink(): void {
    const link = this.form.getRawValue().productLink;
    if (!link) return;
    navigator.clipboard.writeText(link).then(() => {
      this.msg.success('Product link copied to clipboard');
    });
  }

  openSpecsModal(): void {
    const modal = this.productModals.openEditSpecifications(this.form.get('specifications')?.value);

    modal.afterClose.subscribe((result: any) => {
      if (result !== undefined) {
        this.form.get('specifications')?.setValue(result);
      }
    });
  }

  openImagesModal(): void {
    const modal = this.productModals.openAddImages(
      this.thumbnailFile,
      this.otherFiles,
      this.suggestedImagePrompt,
    );

    modal.afterClose.subscribe((result: any) => {
      if (result) {
        this.thumbnailFile = result.thumbnailFile;
        this.otherFiles = result.otherFiles;
        this.cdr.markForCheck();
      }
    });
  }

  submitForm(): void {
    if (this.saving()) return;
    if (this.form.invalid) {
      Object.values(this.form.controls).forEach((c: any) => {
        c.markAsDirty();
        c.updateValueAndValidity({ onlySelf: true });
      });
      const labels: Record<string, string> = {
        name: 'Product Name',
        category: 'Category',
        inHandQty: 'In Hand Qty',
        price1: 'Selling Price (Qty 1)',
        minPurchaseValue: 'Minimum Purchase Qty',
        attributes: 'Attributes',
      };
      const invalid = Object.keys(this.form.controls)
        .filter((k) => this.form.controls[k].invalid)
        .map((k) => labels[k] || k);
      this.msg.warning(
        invalid.length
          ? `Please fix: ${invalid.join(', ')}`
          : 'Please fill in all required fields',
      );
      return;
    }

    const v = this.form.getRawValue();
    const category = this.categories.find((c: any) => c.name === v.category);

    const formData = new FormData();
    formData.append('name', v.name!);
    if (category?.id) {
      formData.append('categoryId', category.id);
    } else if (v.category) {
      formData.append('categoryName', v.category);
    }
    formData.append('sku', v.sku || v.storeId || '');
    formData.append('description', v.description || '');
    formData.append('storeId', v.storeId || '');
    formData.append('manufacturer', v.manufacturer || '');
    formData.append(
      'manufacturerProductNumber',
      v.manufacturerProductNumber || '',
    );
    if (v.subCategory) formData.append('subCategory', v.subCategory);
    formData.append('datasheetUrl', v.dataSheet || '');
    formData.append('model3dUrl', v.model3dUrl || '');
    formData.append('status', v.status ? 'active' : 'inactive');
    formData.append('isFeatured', String(v.isFeatured || false));
    formData.append('quantityInHand', String(v.inHandQty || 0));
    formData.append('quantityOrdered', String(v.orderedQty || 0));
    formData.append('purchasedPrice', String(v.purchasedPrice ?? 0));
    if (v.expectedDate) {
      formData.append('expectedDate', (v.expectedDate as Date).toISOString().split('T')[0]);
    }
    if (v.price1 != null) formData.append('price1', String(v.price1));
    if (v.price10 != null) formData.append('price10', String(v.price10));
    if (v.price100 != null) formData.append('price100', String(v.price100));
    formData.append('shortDescription', v.shortDescription || '');
    if (v.minPurchaseValue != null) formData.append('minPurchaseValue', String(v.minPurchaseValue));
    const rawSpecs = Array.isArray(v.specifications)
      ? v.specifications[0] || ''
      : v.specifications || '';
    formData.append('specifications', rawSpecs);
    formData.append('tags', JSON.stringify(v.tags || []));
    formData.append('attributes', JSON.stringify(v.attributes || []));

    if (this.thumbnailFile.length > 0 && this.isNewFile(this.thumbnailFile[0])) {
      const blob = this.getFileBlob(this.thumbnailFile[0]);
      if (blob) formData.append('thumbnail', blob);
    }

    this.otherFiles
      .filter((f: any) => this.isNewFile(f))
      .forEach((f: any) => {
        const blob = this.getFileBlob(f);
        if (blob) formData.append('images', blob);
      });

    this.saving.set(true);

    if (this.product) {
      this.productService.update(this.product.id, formData).subscribe({
        next: () => {
          this.saving.set(false);
          this.msg.success('Product updated successfully');
          this.productService.loadAll();
          this.saved.emit();
        },
        error: (err: any) => {
          this.saving.set(false);
          this.msg.error(err?.error?.message || 'Failed to update product');
        },
      });
    } else {
      this.productService.add(formData).subscribe({
        next: () => {
          this.saving.set(false);
          this.msg.success('Product added successfully');
          this.productService.loadAll();
          this.saved.emit();
        },
        error: (err: any) => {
          this.saving.set(false);
          this.msg.error(err?.error?.message || 'Failed to add product');
        },
      });
    }
  }

  private generateSlug(name: string): string {
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return `https://vseeds.lk/product/${slug}`;
  }

  readonly formatterPrice = (value: number): string => (value ? `Rs. ${value}` : '');
  readonly parserPrice = (value: string): number =>
    Number(value.replace('Rs. ', '').replace(',', ''));

  private isNewFile(file: NzUploadFile): boolean {
    return !file.url || file.url.startsWith('data:');
  }

  private getFileBlob(file: NzUploadFile): File | Blob | undefined {
    if (file.originFileObj instanceof File) return file.originFileObj;
    if ((file as any) instanceof File) return file as any;
    return undefined;
  }
}
