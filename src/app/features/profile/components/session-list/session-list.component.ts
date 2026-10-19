import { Component, ChangeDetectionStrategy, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-session-list',
  standalone: true,
  imports: [CommonModule, NzTooltipModule, LucideAngularModule],
  templateUrl: './session-list.component.html',
  styleUrl: './session-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SessionListComponent {
  @Input() sessions: any[] = [];
  @Input() lastLogin: string = '—';
  @Output() remove = new EventEmitter<any>();

  onRemove(session: any): void {
    this.remove.emit(session);
  }
}
