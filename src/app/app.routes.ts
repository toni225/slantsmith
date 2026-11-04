import { Routes } from '@angular/router';
import { RhymePageComponent } from './rhyme/rhyme-page.component';
import { SettingsPageComponent } from './settings/settings-page.component';

export const routes: Routes = [
  { path: '', redirectTo: 'rhymes', pathMatch: 'full' },
  { path: 'rhymes', component: RhymePageComponent },
  { path: 'settings', component: SettingsPageComponent },
];
