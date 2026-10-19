import { Routes } from '@angular/router';
import { OrderListComponent } from './orderList';

export const orderRoutes: Routes = [
  { path: '', title: 'Orders', component: OrderListComponent },
  {
    path: ':id/edit',
    title: 'Edit Order',
    loadComponent: () =>
      import('./order-form/order-form.component').then((m) => m.OrderFormComponent),
  },
];
