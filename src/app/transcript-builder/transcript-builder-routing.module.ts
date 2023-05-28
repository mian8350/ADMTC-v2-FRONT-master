import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { TranscriptBuilderComponent } from './transcript-builder/transcript-builder.component';
import { PermissionGuard } from 'app/service/guard/auth.guard';

const routes: Routes = [
  {
    path: '',
    component: TranscriptBuilderComponent,
    canActivate: [PermissionGuard],
    data: {
      permission: 'transcript_builder.show_perm'
      // permission: {
      //   only: [
      //     'ADMTC Director',
      //     'ADMTC Admin'
      //   ]
      // },
    },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TranscriptBuilderRoutingModule {}
