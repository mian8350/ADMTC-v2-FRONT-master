import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PlatformComponent } from './platform/platform.component';
import { PermissionGuard } from 'app/service/guard/auth.guard';


export const routes: Routes = [
  
  {
    path: '',
    component: PlatformComponent,
    canActivate: [PermissionGuard],
    data: {
      permission: 'parameters.platform.show_perm'
      // permission: {
      //   only: [
      //     'ADMTC Director',
      //     'ADMTC Admin'
      //   ]
      // },
    },
  },
  {
    path: '**', redirectTo: '', pathMatch: 'full'
  }
];


@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class PlatformRoutingModule { }
