import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HistoryComponent } from './history/history.component';
import { HistoryParentTabComponent } from './history-parent-tab/history-parent-tab.component';
import { PermissionGuard } from 'app/service/guard/auth.guard';


export const routes: Routes = [
  
  {
    path: '',
    component: HistoryParentTabComponent,
    canActivate: [PermissionGuard],
    data: {
      permission: 'history.notifications.show_perm'
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

export class HistoryRoutingModule { }
