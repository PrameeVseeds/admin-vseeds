import { Routes } from '@angular/router';
import { RoleListComponent } from './roleList';

export const roleRoutes: Routes = [
  { path: '', title: 'Roles & Permissions', component: RoleListComponent },
  {
    path: 'create',
    title: 'Create Role',
    loadComponent: () => import('./role-form/role-form.component').then((m) => m.RoleFormComponent),
  },
  {
    path: ':id/edit',
    title: 'Edit Role',
    loadComponent: () => import('./role-form/role-form.component').then((m) => m.RoleFormComponent),
  },
];
