import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

// shortcut: no Mix help tab yet (unbuilt screen); add it here once that route exists.
@Component({
  selector: 'app-tab-nav',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './tab-nav.component.html',
  styleUrl: './tab-nav.component.css',
})
export class TabNavComponent {}
