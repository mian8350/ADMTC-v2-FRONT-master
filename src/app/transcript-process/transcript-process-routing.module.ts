import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { TranscriptProcessDetailComponent } from './transcript-process-detail/transcript-process-detail.component';
import { TranscriptProcessTableComponent } from './transcript-process-table.component';

const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: TranscriptProcessTableComponent,
  },
  {
    path: ':transcriptId',
    component: TranscriptProcessDetailComponent,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TranscriptProcessRoutingModule { }
