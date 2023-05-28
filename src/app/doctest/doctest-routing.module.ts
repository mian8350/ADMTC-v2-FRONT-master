import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DoctestComponent } from './doctest/doctest.component';
import { PermissionGuard } from 'app/service/guard/auth.guard';


export const routes: Routes = [
  
  {
    path: '',
    component: DoctestComponent,
    canActivate: [PermissionGuard],
    data: {
      permission: 'history.tests.show_perm'
      // permission: {
      //   only: [
      //     'ADMTC Director',
      //     'ADMTC Admin',
      //     'Academic Director',
      //     'Academic Admin',
      //     'PC School Director',
      //     'Certifier Admin',
      //     'CR School Director',
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

export class DoctestRoutingModule { }
