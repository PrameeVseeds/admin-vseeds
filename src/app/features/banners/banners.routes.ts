import { Routes } from '@angular/router';
import { BannerListComponent } from './bannerList';

export const bannerRoutes: Routes = [
  { path: '', component: BannerListComponent },
  {
    path: 'create',
    loadComponent: () =>
      import('./banner-form/banner-form.component').then((m) => m.BannerFormComponent),
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./banner-form/banner-form.component').then((m) => m.BannerFormComponent),
  },
];
