import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AlertFunctionalityComponent } from './alert-functionality/alert-functionality.component';
import { PermissionGuard } from 'app/service/guard/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: AlertFunctionalityComponent,
    canActivate: [PermissionGuard],
    data: {
      permission: 'messages.alert_func.show_perm'
      // permission: {
      //   only: [
      //     'ADMTC Director',
      //     'ADMTC Admin',
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
export class AlertFunctionalityRoutingModule {}
