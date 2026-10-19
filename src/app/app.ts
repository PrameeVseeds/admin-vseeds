import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from '@services/themeService';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
export class App implements OnInit {


    constructor(_themeService: ThemeService) {
    }

  ngOnInit(): void {
    // ThemeService initializes theme on construction via effect
  }
}
