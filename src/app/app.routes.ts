import { Routes } from '@angular/router';
import { ChordsPageComponent } from './chords/chords-page.component';
import { MixPageComponent } from './mix/mix-page.component';
import { RhymePageComponent } from './rhyme/rhyme-page.component';
import { SettingsPageComponent } from './settings/settings-page.component';
import { SongEditorComponent } from './songs/song-editor.component';
import { SongsListComponent } from './songs/songs-list.component';
import { TakesListComponent } from './songs/takes-list.component';

export const routes: Routes = [
  { path: '', redirectTo: 'songs', pathMatch: 'full' },
  { path: 'songs', component: SongsListComponent },
  { path: 'songs/:id', component: SongEditorComponent },
  { path: 'songs/:id/takes', component: TakesListComponent },
  { path: 'rhymes', component: RhymePageComponent },
  { path: 'chords', component: ChordsPageComponent },
  { path: 'mix', component: MixPageComponent },
  { path: 'settings', component: SettingsPageComponent },
];
