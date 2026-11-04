import { Routes } from '@angular/router';
import { RhymePageComponent } from './rhyme/rhyme-page.component';
import { SettingsPageComponent } from './settings/settings-page.component';
import { SongEditorComponent } from './songs/song-editor.component';
import { SongsListComponent } from './songs/songs-list.component';

export const routes: Routes = [
  { path: '', redirectTo: 'songs', pathMatch: 'full' },
  { path: 'songs', component: SongsListComponent },
  { path: 'songs/:id', component: SongEditorComponent },
  { path: 'rhymes', component: RhymePageComponent },
  { path: 'settings', component: SettingsPageComponent },
];
