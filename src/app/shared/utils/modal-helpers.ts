import { Type } from '@angular/core';
import { NzModalService, NzModalRef } from 'ng-zorro-antd/modal';
import { ConfirmModalComponent, ConfirmModalData } from '../components/confirm-modal/confirm-modal.component';

/**
 * Standard modal shape used across the admin app. All fields default
 * to the values that were previously copy-pasted into every
 * `modalService.create({...})` call.
 */
export interface ModalOptions<TData = any> {
  /** Component to render inside the modal body. */
  content: Type<any>;
  /** Data assigned to the component's `data` property after creation. */
  data?: TData;
  /** Modal width. Defaults to `'600px'`. */
  width?: string;
  /** Optional title shown in the header. Defaults to `''` (no title). */
  title?: string;
  /** Custom class on the modal wrapper. */
  className?: string;
  /** Whether the mask can be clicked to close. Defaults to `false`. */
  maskClosable?: boolean;
  /** Whether the X button is shown. Defaults to `false`. */
  closable?: boolean;
  /** Whether the modal is vertically centered. Defaults to `true`. */
  centered?: boolean;
  /** Footer template. Defaults to `null` (component owns its footer). */
  footer?: any;
}

const DEFAULTS = {
  nzFooter: null,
  nzTitle: '',
  nzCentered: true,
  nzClosable: false,
  nzMaskClosable: false,
  nzWidth: '600px',
  nzDraggable: false,
} as const;

/**
 * Open a modal with the standard admin defaults applied. Any option
 * explicitly passed overrides the default.
 *
 * @example
 * const ref = openModal(modalService, {
 *   content: ProductDetailsComponent,
 *   data: product,
 *   width: '800px',
 *   className: 'media-preview-modal',
 * });
 * ref.afterClose.subscribe(result => { ... });
 */
export function openModal<TData = any, TResult = any>(
  modalService: NzModalService,
  options: ModalOptions<TData>,
): NzModalRef<TResult> {
  const ref = modalService.create({
    nzContent: options.content,
    nzWidth: options.width ?? DEFAULTS.nzWidth,
    nzTitle: options.title ?? DEFAULTS.nzTitle,
    nzCentered: options.centered ?? DEFAULTS.nzCentered,
    nzClosable: options.closable ?? DEFAULTS.nzClosable,
    nzMaskClosable: options.maskClosable ?? DEFAULTS.nzMaskClosable,
    nzFooter: options.footer ?? DEFAULTS.nzFooter,
    nzDraggable: DEFAULTS.nzDraggable,
    nzClassName: options.className,
  });

  if (options.data !== undefined && ref.componentInstance) {
    (ref.componentInstance as { data?: TData }).data = options.data;
  }

  return ref;
}

/**
 * Open the standard confirmation modal. Returns the `NzModalRef` so
 * callers can subscribe to `afterClose` — `true` means confirmed,
 * `false`/`undefined` means cancelled.
 *
 * @example
 * const ref = openConfirm(modalService, {
 *   title: 'Delete Banner',
 *   description: 'Are you sure you want to delete this banner?',
 *   confirmText: 'Delete',
 *   iconName: 'trash-2',
 * });
 * ref.afterClose.subscribe(confirmed => {
 *   if (confirmed) this.bannerService.delete(item.id);
 * });
 */
export function openConfirm(
  modalService: NzModalService,
  data: ConfirmModalData,
  options: { width?: string; className?: string } = {},
): NzModalRef<boolean> {
  return openModal<ConfirmModalData, boolean>(modalService, {
    content: ConfirmModalComponent,
    data,
    width: options.width ?? '400px',
    className: options.className,
  });
}
