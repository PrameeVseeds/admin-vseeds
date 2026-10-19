import { Routes } from '@angular/router';

export const settingsRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./systemSettings').then((m) => m.SystemSettingsComponent),
  },
  {
    path: 'banks',
    loadComponent: () =>
      import('./bankManagement/bankManagement').then((m) => m.BankManagementComponent),
  },
];
