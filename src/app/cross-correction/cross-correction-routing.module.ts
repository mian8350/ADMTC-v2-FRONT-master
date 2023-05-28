import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CrossCorrectionComponent } from './cross-correction/cross-correction.component';
import { PermissionGuard } from 'app/service/guard/auth.guard';
import { CrossCorrectionTableComponent } from './cross-correction-table/cross-correction-table.component';
import { CrossCorrectionDetailComponent } from './cross-correction-detail/cross-correction-detail.component';
import { AssignCrossCorrectorComponent } from './cross-correction-table/assign-cross-corrector/assign-cross-corrector.component';

export const routes: Routes = [
  {
    path: '',
    component: CrossCorrectionTableComponent,
    canActivate: [PermissionGuard],
    data: {
      // permission: 'process.cross_correction.show_perm'
      // permission: {
      //   only: [
      //     'ADMTC Director',
      //     'ADMTC Admin',
      //   ]
      // },
    },
  },
  {
    path: 'detail/:crossCorrectionId',
    component: CrossCorrectionDetailComponent,
  },
  {
    path: 'assign-cross-corrector/:titleId/:classId/:testId',
    component: AssignCrossCorrectorComponent,
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full',
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CrossCorrectionRoutingModule {}
