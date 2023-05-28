import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { TitleManagerDashboardComponent } from './title-manager-list/title-manager-dashboard/title-manager-dashboard.component';
import { TitleManagerFollowUpRegistrationComponent } from './title-manager-list/title-manager-follow-up/title-manager-follow-up-registration/title-manager-follow-up-registration.component';
import { TitleManagerFollowUpCompanyComponent } from './title-manager-list/title-manager-follow-up/title-manager-follow-up-company/title-manager-follow-up-company.component';
import { TitleManagerListComponent } from './title-manager-list/title-manager-list.component';
import { TitleManagerFollowUpSchoolComponent } from './title-manager-list/title-manager-follow-up/title-manager-follow-up-school/title-manager-follow-up-school.component';
import { TitleManagerStudentComponent } from './title-manager-student/title-manager-student.component';
import { PermissionGuard } from 'app/service/guard/auth.guard';

const routes: Routes = [
  { path: '', redirectTo: 'title', pathMatch: 'full' },
  {
    path: 'title',
    component: TitleManagerListComponent,
    canActivate: [PermissionGuard],
    data: {
      permission: 'manager_menu.manager_task'
      // permission: {
      //   only: [
      //     'ADMTC Director',
      //     'ADMTC Admin'
      //   ]
      // },
    },
  },
  {
    path: 'title-manager-student',
    component: TitleManagerStudentComponent,
    canActivate: [PermissionGuard],
    data: {
      permission: 'manager_menu.table_of_student'
      // permission: {
      //   only: [
      //     'ADMTC Director',
      //     'ADMTC Admin'
      //   ]
      // },
    },
  },
  {
    path: 'dashboard/:titleId',
    component: TitleManagerDashboardComponent,
  },
  {
    path: 'registration/:titleId/:classId',
    component: TitleManagerFollowUpRegistrationComponent,
  },
  {
    path: 'school/:titleId/:classId',
    component: TitleManagerFollowUpSchoolComponent,
  },
  {
    path: 'company/:titleId/:classId',
    component: TitleManagerFollowUpCompanyComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TitleManagerRoutingModule {}
