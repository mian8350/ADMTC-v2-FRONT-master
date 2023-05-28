import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PermissionGuard } from 'app/service/guard/auth.guard';
import { EmployabilitySurveyDetailsComponent } from './employability-survey-details/employability-survey-details.component';
import { ListOfEmployabilitySurveyComponent } from './list-of-employability-survey.component';


const routes: Routes = [
  {
    path: '',
    component: ListOfEmployabilitySurveyComponent,
    canActivate: [PermissionGuard],
    data: {
      permission: 'process.emp_survey.show_perm'
      // permission: {
      //   only: [
      //     'ADMTC Director',
      //     'ADMTC Admin'
      //   ]
      // },
    },
  },
  {
    path: 'details/:esId',
    component: EmployabilitySurveyDetailsComponent,
    canActivate: [PermissionGuard],
    data: {
      permission: 'process.emp_survey.show_perm'
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
  exports: [RouterModule]
})
export class EmployabilitySurveyRoutingModule { }
