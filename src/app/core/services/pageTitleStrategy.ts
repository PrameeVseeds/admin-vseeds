import { Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class PageTitleStrategy extends TitleStrategy {
  override updateTitle(routerState: RouterStateSnapshot) {
    const title = this.buildTitle(routerState);
    if (title !== undefined) {
      this.title.setTitle(`${title} | Admin Portal - VSEEDS`);
    } else {
      this.title.setTitle('Admin Portal - VSEEDS');
    }
  }

    constructor(private readonly title: Title) {
        super();
    }
}
