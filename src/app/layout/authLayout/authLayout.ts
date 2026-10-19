import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from '@services/themeService';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet, LucideAngularModule],
  templateUrl: './authLayout.html',
  styleUrl: './authLayout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthLayoutComponent {
  protected readonly currentYear = new Date().getFullYear();

    constructor(protected readonly themeService: ThemeService) {
    }
}
