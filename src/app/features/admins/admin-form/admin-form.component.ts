import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzMessageService } from 'ng-zorro-antd/message';
import { LucideAngularModule } from 'lucide-angular';
import { AdminService } from 'src/app/core/services/adminService';
import { RoleService } from 'src/app/core/services/roleService';
import { FloatLabelComponent } from 'src/app/shared/components/float-label/float-label.component';
import { FormErrorComponent } from 'src/app/shared/components/form-error/form-error.component';
import { MyValidators } from 'src/app/shared/validators/custom-validator';

@Component({
  selector: 'app-admin-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzButtonModule,
    NzSwitchModule,
    NzDividerModule,
    LucideAngularModule,
    FloatLabelComponent,
    FormErrorComponent,
  ],
  templateUrl: './admin-form.component.html',
  styleUrls: ['./admin-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminFormComponent {
  readonly adminId: string | null;
  readonly isEditMode: boolean;
  readonly roles: any;
  readonly filteredRoles: () => any;

  showPassword = false;
  showConfirmPassword = false;

  readonly form: any;

  constructor(private readonly fb: FormBuilder, private readonly route: ActivatedRoute, private readonly router: Router, private readonly message: NzMessageService, private readonly adminService: AdminService, private readonly roleService: RoleService) {
      this.adminId = this.route.snapshot.paramMap.get('id');
      this.isEditMode = !!this.adminId;
      this.roles = this.roleService.getAll();
      // Filter out super admin role when creating new admin
      this.filteredRoles = () => {
        const allRoles = typeof this.roles === 'function' ? this.roles() : this.roles;
        if (this.isEditMode) {
          return allRoles;
        }
        return allRoles.filter((role: any) => 
          role.name?.toLowerCase() !== 'super admin'
        );
      };
      this.form = this.fb.nonNullable.group({
          username: ['', [Validators.required, MyValidators.spaceValidator()]],
          email: ['', [Validators.required, Validators.email]],
          phone: ['', [MyValidators.numberValidator()]],
          roleId: [null as number | null, [Validators.required]],
          status: ['active', [Validators.required]],
          password: [''],
          confirmPassword: [''],
        });
    if (this.isEditMode) {
      this.adminService.loadById(this.adminId!).subscribe({
        next: (res: any) => {
          const admin = res?.data ?? res;
          if (admin) {
            this.form.patchValue({
              username: admin.name ?? admin.username ?? '',
              email: admin.email,
              phone: admin.phone ?? '',
              roleId: admin.roleId,
              status: admin.status?.toLowerCase() ?? 'active',
            });
          }
        },
      });
    } else {
      this.form.get('password')?.setValidators([Validators.required, Validators.minLength(8)]);
      this.form.get('confirmPassword')?.setValidators([Validators.required]);
    }
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

    if (val.password || val.confirmPassword) {
      if (val.password !== val.confirmPassword) {
        this.message.error('Passwords do not match');
        return;
      }
    }

    if (this.isEditMode) {
      const payload: any = {
        username: val.username,
        roleId: val.roleId,
        phone: val.phone,
        status: val.status,
      };
      if (val.password) payload.password = val.password;

      this.adminService.update(this.adminId!, payload).subscribe({
        next: () => {
          this.message.success('Admin updated successfully');
          this.router.navigate(['/admins']);
        },
        error: (err: any) => {
          this.message.error(err?.error?.message || 'Failed to update admin');
        },
      });
    } else {
      const payload = {
        username: val.username,
        email: val.email,
        password: val.password,
        roleId: val.roleId!,
        phone: val.phone || undefined,
      };

      this.adminService.add(payload).subscribe({
        next: () => {
          this.message.success('Admin created successfully');
          this.router.navigate(['/admins']);
        },
        error: (err: any) => {
          this.message.error(err?.error?.message || 'Failed to create admin');
        },
      });
    }
  }

  getRoleDescription(roleId: string | null): string {
    if (!roleId) return '';
    const roles = typeof this.filteredRoles === 'function' ? this.filteredRoles() : this.filteredRoles;
    const role = roles.find((r: any) => r.id === roleId);
    return role?.description ?? '';
  }

  goBack(): void {
    this.router.navigate(['/admins']);
  }
}
