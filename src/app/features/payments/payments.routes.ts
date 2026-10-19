import { Routes } from '@angular/router';
import { PaymentListComponent } from './paymentList';

export const paymentRoutes: Routes = [
  { path: '', component: PaymentListComponent },
  { path: ':id', component: PaymentListComponent },
];
