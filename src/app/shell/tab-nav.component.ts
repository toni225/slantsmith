import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-tab-nav',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './tab-nav.component.html',
  styleUrl: './tab-nav.component.css',
})
export class TabNavComponent {}
