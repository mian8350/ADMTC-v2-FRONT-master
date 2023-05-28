import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { TutorialComponent } from './tutorial/tutorial.component';
import { PermissionGuard } from 'app/service/guard/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: TutorialComponent,
    canActivate: [PermissionGuard],
    data: {
      permission: 'tutorials.show_perm'
      // permission: {
      //   only : [
      //     'ADMTC Admin',
      //     'ADMTC Director',
      //     'Academic Director',
      //     'Academic Admin'
      //   ]
      // },
    },
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
export class TutorialRoutingModule {}
