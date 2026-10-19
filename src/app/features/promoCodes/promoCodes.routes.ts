import { Routes } from '@angular/router';
import { PromoCodeListComponent } from './promoCodeList';

export const promoCodeRoutes: Routes = [
  { path: '', title: 'Promo Codes', component: PromoCodeListComponent },
  {
    path: 'create',
    title: 'Create Promo Code',
    loadComponent: () =>
      import('./promo-form/promo-form.component').then((m) => m.PromoFormComponent),
  },
  {
    path: ':id/edit',
    title: 'Edit Promo Code',
    loadComponent: () =>
      import('./promo-form/promo-form.component').then((m) => m.PromoFormComponent),
  },
];
