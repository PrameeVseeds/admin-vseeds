import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { SidebarComponent } from '../components/sidebar/sidebar';
import { HeaderBarComponent } from '../components/headerBar/headerBar';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, NzLayoutModule, SidebarComponent, HeaderBarComponent],
  templateUrl: './adminLayout.html',
  styleUrl: './adminLayout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminLayoutComponent {
  protected readonly sidebarCollapsed = signal(false);
  protected readonly currentYear = new Date().getFullYear();

  protected toggleSidebar(): void {
    this.sidebarCollapsed.update((v: any) => !v);
  }
}
