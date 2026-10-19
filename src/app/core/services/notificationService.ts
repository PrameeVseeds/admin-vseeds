import { Injectable } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzNotificationService } from 'ng-zorro-antd/notification';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  success(text: string): void {
    this.message.success(text);
  }

  error(text: string): void {
    this.message.error(text);
  }

  warning(text: string): void {
    this.message.warning(text);
  }

  info(text: string): void {
    this.message.info(text);
  }

  notifySuccess(title: string, text: string): void {
    this.notification.success(title, text);
  }

  notifyError(title: string, text: string): void {
    this.notification.error(title, text);
  }

    constructor(private readonly message: NzMessageService, private readonly notification: NzNotificationService) {
    }
}
