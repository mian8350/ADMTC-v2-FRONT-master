import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PermissionGuard } from 'app/service/guard/auth.guard';
import { FormDetailTableComponent } from './form-detail-table/form-detail-table.component';
import { FormFollowUpComponent } from './form-follow-up.component';


const routes: Routes = [
  {
    path: '',
    component: FormFollowUpComponent,
    canActivate: [PermissionGuard],
    data: {
      permission: 'form_follow_up'
      // permission: {
      //   only: [
      //     'ADMTC Director',
      //     'ADMTC Admin'
      //   ]
      // },
    },
  },
  {
    path: 'details/:formId',
    component: FormDetailTableComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class FormFollowUpRoutingModule { }
