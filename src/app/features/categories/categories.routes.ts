import { Routes } from '@angular/router';
import { CategoryListComponent } from './categoryList';

export const categoryRoutes: Routes = [
  { path: '', title: 'Categories', component: CategoryListComponent },
  {
    path: 'create',
    title: 'Create Category',
    loadComponent: () =>
      import('./category-form/category-form').then((m) => m.CategoryFormComponent),
  },
  {
    path: ':id/edit',
    title: 'Edit Category',
    loadComponent: () =>
      import('./category-form/category-form').then((m) => m.CategoryFormComponent),
  },
];
