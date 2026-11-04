import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SettingsService } from './settings/settings.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('Slantsmith');
  // Applies theme/text-size as soon as the app boots, not just when Settings is visited.
  private readonly settings = inject(SettingsService);
}
