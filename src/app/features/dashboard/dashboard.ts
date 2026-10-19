import { Component, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzPageHeaderModule } from 'ng-zorro-antd/page-header';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { LucideAngularModule } from 'lucide-angular';
import { DashboardService } from 'src/app/core/services/dashboardService';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    RouterLink,
    NzCardModule,
    NzGridModule,
    NzStatisticModule,
    NzTableModule,
    NzButtonModule,
    NzPageHeaderModule,
    NzSpaceModule,
    LucideAngularModule,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit {
  protected readonly stats: any;
  protected readonly recentOrders: any;

    constructor(private readonly dashboardService: DashboardService) {
        this.stats = this.dashboardService.stats;
        this.recentOrders = this.dashboardService.recentOrders;
    }

    ngOnInit(): void {
      this.dashboardService.loadStats();
    }
}
