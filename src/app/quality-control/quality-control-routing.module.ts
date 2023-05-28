import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { QualityControlComponent } from './quality-control/quality-control.component';
import { PermissionGuard } from 'app/service/guard/auth.guard';


export const routes: Routes = [

  {
    path: '',
    component: QualityControlComponent,
    canActivate: [PermissionGuard],
    data: {
      permission: 'process.quality_control.show_perm'
      // permission: {
      //   only: [
      //     'ADMTC Director',
      //     'ADMTC Admin',
      //     'Certifier Admin',
      //     'CR School Director'
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
export class QualityControlRoutingModule { }
