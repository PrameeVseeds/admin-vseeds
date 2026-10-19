import { Routes } from '@angular/router';
import { AdminLayoutComponent } from '@layout/adminLayout/adminLayout';
import { AuthLayoutComponent } from '@layout/authLayout/authLayout';
import { authGuard } from '@guards/authGuard';
import { roleGuard } from '@guards/roleGuard';

export const routes: Routes = [
  {
    path: 'auth',
    component: AuthLayoutComponent,
    children: [
      { path: '', redirectTo: 'login', pathMatch: 'full' },
      {
        path: 'login',
        title: 'Login',
        loadComponent: () => import('@features/auth/login/login').then((m) => m.LoginComponent),
      },
      {
        path: 'forgot-password',
        title: 'Forgot Password',
        loadComponent: () =>
          import('@features/auth/forgotPassword/forgotPassword').then(
            (m) => m.ForgotPasswordComponent,
          ),
      },
      {
        path: 'reset-password',
        title: 'Reset Password',
        loadComponent: () =>
          import('@features/auth/resetPassword/resetPassword').then(
            (m) => m.ResetPasswordComponent,
          ),
      },
    ],
  },
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [authGuard],
    canActivateChild: [roleGuard],
    data: { roles: ['admin', 'super admin'] },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        title: 'Dashboard',
        loadComponent: () =>
          import('@features/dashboard/dashboard').then((m) => m.DashboardComponent),
      },
      {
        path: 'products',
        title: 'Products',
        loadChildren: () =>
          import('@features/products/products.routes').then((m) => m.productRoutes),
      },
      {
        path: 'categories',
        title: 'Categories',
        loadChildren: () =>
          import('@features/categories/categories.routes').then((m) => m.categoryRoutes),
      },
      {
        path: 'orders',
        title: 'Orders',
        loadChildren: () => import('@features/orders/orders.routes').then((m) => m.orderRoutes),
      },
      {
        path: 'invoices',
        title: 'Invoices',
        loadChildren: () =>
          import('@features/invoices/invoices.routes').then((m) => m.invoiceRoutes),
      },
      {
        path: 'promo-codes',
        title: 'Promo Codes',
        loadChildren: () =>
          import('@features/promoCodes/promoCodes.routes').then((m) => m.promoCodeRoutes),
      },
      {
        path: 'payments',
        title: 'Payments',
        loadChildren: () =>
          import('@features/payments/payments.routes').then((m) => m.paymentRoutes),
      },
      {
        path: 'quotes',
        title: 'Quotes',
        loadChildren: () => import('@features/quotes/quotes.routes').then((m) => m.quoteRoutes),
      },
      {
        path: 'projects',
        title: 'Projects',
        loadChildren: () =>
          import('@features/projects/projects.routes').then((m) => m.projectRoutes),
      },
      {
        path: 'users',
        title: 'Users',
        loadChildren: () => import('@features/users/users.routes').then((m) => m.userRoutes),
      },
      {
        path: 'admins',
        title: 'Admin Users',
        data: { roles: ['super admin'] },
        loadChildren: () => import('@features/admins/admins.routes').then((m) => m.adminRoutes),
      },
      {
        path: 'roles',
        title: 'Roles & Permissions',
        data: { roles: ['super admin'] },
        loadChildren: () => import('@features/roles/roles.routes').then((m) => m.roleRoutes),
      },
      {
        path: 'banners',
        title: 'Banners',
        loadChildren: () => import('@features/banners/banners.routes').then((m) => m.bannerRoutes),
      },
      {
        path: 'reviews',
        title: 'Reviews',
        loadChildren: () => import('@features/reviews/reviews.routes').then((m) => m.reviewRoutes),
      },
      {
        path: 'wishlists',
        title: 'Wishlists',
        loadChildren: () =>
          import('@features/wishlists/wishlists.routes').then((m) => m.wishlistRoutes),
      },
      {
        path: 'contacts',
        title: 'Contacts',
        loadChildren: () =>
          import('@features/contacts/contacts.routes').then((m) => m.contactRoutes),
      },
      {
        path: 'blogs',
        title: 'Blogs',
        loadChildren: () => import('@features/blogs/blogs.routes').then((m) => m.blogRoutes),
      },
      {
        path: 'faqs',
        title: 'FAQs',
        loadChildren: () => import('@features/faqs/faqs.routes').then((m) => m.faqRoutes),
      },
      {
        path: 'deliveries',
        title: 'Deliveries',
        loadChildren: () =>
          import('@features/deliveries/deliveries.routes').then((m) => m.deliveryRoutes),
      },
      {
        path: 'images',
        title: 'Image Gallery',
        loadChildren: () => import('@features/images/images.routes').then((m) => m.imageRoutes),
      },
      {
        path: 'statistics',
        title: 'Statistics',
        loadChildren: () =>
          import('@features/statistics/statistics.routes').then((m) => m.statisticRoutes),
      },
      {
        path: 'activity-logs',
        title: 'Activity Logs',
        loadChildren: () =>
          import('@features/activityLogs/activityLogs.routes').then((m) => m.activityLogRoutes),
      },
      {
        path: 'email-templates',
        title: 'Email Templates',
        loadChildren: () =>
          import('@features/emailTemplates/emailTemplates.routes').then(
            (m) => m.emailTemplateRoutes,
          ),
      },
      {
        path: 'settings',
        title: 'Settings',
        loadChildren: () =>
          import('@features/settings/settings.routes').then((m) => m.settingsRoutes),
      },
      {
        path: 'profile',
        title: 'Profile Settings',
        loadComponent: () =>
          import('@features/profile/profileSettings').then((m) => m.ProfileSettingsComponent),
      },
    ],
  },
  {
    path: '**',
    loadComponent: () => import('@features/not-found/not-found').then((m) => m.NotFoundComponent),
    title: '404 - Not Found',
  },
];
