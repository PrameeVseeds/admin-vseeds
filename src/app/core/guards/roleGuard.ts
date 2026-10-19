import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { TokenStorageService } from '@services/tokenStorageService';

export const roleGuard: CanActivateFn = (route) => {
  const tokenStorage = inject(TokenStorageService);
  const router = inject(Router);

  const userRole = tokenStorage.user()?.role?.toLowerCase().trim();
  if (!userRole) {
    router.navigate(['/auth/login']);
    return false;
  }

  // Super admin bypass — allowed everywhere
  if (userRole === 'super admin') {
    return true;
  }

  // Look for allowed roles on the matched child route, then fall back to parent
  const allowed =
    (route.data?.['roles'] as string[] | undefined) ??
    (route.parent?.data?.['roles'] as string[] | undefined);

  if (!allowed || allowed.length === 0) {
    return true;
  }

  if (allowed.map((r) => r.toLowerCase()).includes(userRole)) {
    return true;
  }

  // No access — send to dashboard instead of leaving them on a broken page
  router.navigate(['/dashboard']);
  return false;
};
