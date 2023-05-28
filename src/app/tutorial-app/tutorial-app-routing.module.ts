import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { TutorialAppComponent } from './tutorial-app/tutorial-app.component';
import { PermissionGuard } from 'app/service/guard/auth.guard';
import { TutorialTabComponent } from './tutorial-tab.component';

export const routes: Routes = [
  {
    path: '',
    component: TutorialTabComponent,
    canActivate: [PermissionGuard],
    data: {
      permission: 'inapp_tutorials.show_perm'
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
export class TutorialAppRoutingModule {}
