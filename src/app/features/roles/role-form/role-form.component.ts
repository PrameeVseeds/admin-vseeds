import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { LucideAngularModule } from 'lucide-angular';
import { RoleService } from 'src/app/core/services/roleService';
import { FloatLabelComponent } from 'src/app/shared/components/float-label/float-label.component';
import { FormErrorComponent } from 'src/app/shared/components/form-error/form-error.component';
import { MyValidators } from 'src/app/shared/validators/custom-validator';

interface PermissionModule {
  name: string;
  icon: string;
  read: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
}

const MODULE_DEFS: { name: string; icon: string }[] = [
  { name: 'Dashboard', icon: 'layout-dashboard' },
  { name: 'Products', icon: 'package' },
  { name: 'Categories', icon: 'layers' },
  { name: 'Orders', icon: 'shopping-cart' },
  { name: 'Payments', icon: 'credit-card' },
  { name: 'Deliveries', icon: 'truck' },
  { name: 'Wishlists', icon: 'heart' },
  { name: 'Banners', icon: 'image' },
  { name: 'Blogs', icon: 'file-text' },
  { name: 'FAQs', icon: 'help-circle' },
  { name: 'Projects', icon: 'folder-kanban' },
  { name: 'Reviews', icon: 'star' },
  { name: 'Quotes', icon: 'file-text' },
  { name: 'Customers', icon: 'users' },
  { name: 'Admins', icon: 'user-cog' },
  { name: 'Roles', icon: 'shield' },
  { name: 'Statistics', icon: 'bar-chart-3' },
  { name: 'Activity Logs', icon: 'activity' },
  { name: 'Contacts', icon: 'message-square' },
  { name: 'Email Templates', icon: 'mail' },
  { name: 'Image Gallery', icon: 'image' },
  { name: 'Settings', icon: 'settings' },
  { name: 'Banks', icon: 'landmark' },
];

@Component({
  selector: 'app-role-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzButtonModule,
    NzSwitchModule,
    NzCheckboxModule,
    NzDividerModule,
    NzTooltipModule,
    LucideAngularModule,
    FloatLabelComponent,
    FormErrorComponent,
  ],
  templateUrl: './role-form.component.html',
  styleUrls: ['./role-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoleFormComponent {
  readonly roleId: string | null;
  readonly isEditMode: boolean;
  readonly isSystemRole = signal<boolean>(false);

  readonly form: any;

  readonly allPrivileges = signal<any[]>([]);

  readonly permissions = signal<PermissionModule[]>(
    MODULE_DEFS.map((d: any) => ({
      ...d,
      read: false,
      create: false,
      update: false,
      delete: false,
    })),
  );

  constructor(
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly message: NzMessageService,
    private readonly roleService: RoleService,
  ) {
    this.roleId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.roleId;
    this.form = this.fb.nonNullable.group({
      name: ['', [Validators.required, Validators.minLength(2), MyValidators.spaceValidator()]],
      description: [''],
    });
    this.roleService.getAllPrivileges().subscribe({
      next: (res: any) => {
        const data = res?.data ?? res;
        this.allPrivileges.set(Array.isArray(data) ? data : []);
      },
    });

    if (this.isEditMode) {
      this.roleService.loadById(this.roleId!).subscribe({
        next: (res: any) => {
          const role = res?.data ?? res;
          if (role) {
            this.isSystemRole.set(!!role.isSystem);
            this.form.patchValue({
              name: role.name,
              description: role.description ?? '',
            });
            if (role.isSystem) {
              this.form.controls.name.disable();
            }
          }
        },
      });

      this.roleService.getPrivilegesForRole(this.roleId!).subscribe({
        next: (res: any) => {
          const data = res?.data ?? res;
          const rps: any[] = Array.isArray(data) ? data : [];
          const activeNames = rps
            .filter((rp: any) => rp.isActive !== false)
            .map((rp: any) => rp.privilege?.name?.toLowerCase())
            .filter(Boolean);

          this.permissions.update((list: any) =>
            list.map((mod: any) => {
              const modKey = mod.name.toLowerCase().replace(/\s+/g, '_');
              return {
                ...mod,
                read: activeNames.includes(`${modKey}.read`),
                create: activeNames.includes(`${modKey}.create`),
                update: activeNames.includes(`${modKey}.update`),
                delete: activeNames.includes(`${modKey}.delete`),
              };
            }),
          );
        },
      });
    }
  }

  toggleAll(action: 'read' | 'create' | 'update' | 'delete', checked: boolean): void {
    this.permissions.update((list: any) => list.map((m: any) => ({ ...m, [action]: checked })));
  }

  toggleModuleAction(
    index: number,
    action: 'read' | 'create' | 'update' | 'delete',
    checked: boolean,
  ): void {
    this.permissions.update((list: any) =>
      list.map((m: any, i: any) => (i === index ? { ...m, [action]: checked } : m)),
    );
  }

  toggleModuleAll(index: number, checked: boolean): void {
    this.permissions.update((list: any) =>
      list.map((m: any, i: any) =>
        i === index
          ? { ...m, read: checked, create: checked, update: checked, delete: checked }
          : m,
      ),
    );
  }

  isModuleFullAccess(mod: PermissionModule): boolean {
    return mod.read && mod.create && mod.update && mod.delete;
  }

  isAllChecked(action: 'read' | 'create' | 'update' | 'delete'): boolean {
    return this.permissions().every((m: any) => m[action]);
  }

  isAllFullAccess(): boolean {
    return this.permissions().every((m: any) => m.read && m.create && m.update && m.delete);
  }

  toggleAllFullAccess(checked: boolean): void {
    this.permissions.update((list: any) =>
      list.map((m: any) => ({
        ...m,
        read: checked,
        create: checked,
        update: checked,
        delete: checked,
      })),
    );
  }

  getGrantedCount(): number {
    return this.permissions().filter((m: any) => m.read || m.create || m.update || m.delete).length;
  }

  submit(): void {
    if (this.form.invalid) {
      Object.values(this.form.controls).forEach((control: any) => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      return;
    }

    const val = this.form.getRawValue();
    const payload: any = { description: val.description };
    if (!this.isSystemRole()) {
      payload.name = val.name;
    }

    if (this.isEditMode) {
      forkJoin({
        role: this.roleService.update(this.roleId!, payload),
        privs: this.roleService.bulkSetPrivileges(this.roleId!, this.getSelectedPrivilegeIds()),
      }).subscribe({
        next: () => {
          this.message.success('Role updated successfully');
          this.router.navigate(['/roles']);
        },
        error: () => this.message.error('Failed to update role privileges'),
      });
    } else {
      this.roleService.add(payload).subscribe({
        next: (res: any) => {
          const newId = res?.data?.id ?? res?.id;
          if (newId) {
            this.roleService.bulkSetPrivileges(newId, this.getSelectedPrivilegeIds()).subscribe({
              next: () => {
                this.message.success('Role created successfully');
                this.router.navigate(['/roles']);
              },
            });
          } else {
            this.message.success('Role created successfully');
            this.router.navigate(['/roles']);
          }
        },
        error: () => this.message.error('Failed to create role'),
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/roles']);
  }

  private getSelectedPrivilegeIds(): string[] {
    const allPrivs = this.allPrivileges();
    const selectedIds: string[] = [];

    for (const mod of this.permissions()) {
      const modKey = mod.name.toLowerCase().replace(/\s+/g, '_');
      for (const action of ['read', 'create', 'update', 'delete'] as const) {
        if (mod[action]) {
          const privName = `${modKey}.${action}`;
          const priv = allPrivs.find((p: any) => p.name?.toLowerCase() === privName);
          if (priv) selectedIds.push(priv.id);
        }
      }
    }
    return selectedIds;
  }
}
