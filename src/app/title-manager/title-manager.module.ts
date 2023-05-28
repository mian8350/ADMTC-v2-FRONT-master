import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TitleManagerRoutingModule } from './title-manager-routing.module';
import { TitleManagerListComponent } from './title-manager-list/title-manager-list.component';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import { NgSelectModule } from '@ng-select/ng-select';
import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';
import { SharedModule } from 'app/shared/shared.module';
import { TitleManagerDashboardComponent } from './title-manager-list/title-manager-dashboard/title-manager-dashboard.component';
import { ManagerTasksTableComponent } from './title-manager-list/title-manager-dashboard/manager-tasks-table/manager-tasks-table.component';
import { DashboardGraphicChartsComponent } from './title-manager-list/title-manager-dashboard/dashboard-graphic-charts/dashboard-graphic-charts.component';
import { DashboardGraphicChartsRegistrationComponent } from './title-manager-list/title-manager-dashboard/dashboard-graphic-charts/dashboard-graphic-charts-registration/dashboard-graphic-charts-registration.component';
import { DashboardGraphicChartsSchoolComponent } from './title-manager-list/title-manager-dashboard/dashboard-graphic-charts/dashboard-graphic-charts-school/dashboard-graphic-charts-school.component';
import { DashboardGraphicChartsTaskComponent } from './title-manager-list/title-manager-dashboard/dashboard-graphic-charts/dashboard-graphic-charts-task/dashboard-graphic-charts-task.component';
import { DashboardGraphicChartsCompanyComponent } from './title-manager-list/title-manager-dashboard/dashboard-graphic-charts/dashboard-graphic-charts-company/dashboard-graphic-charts-company.component';
import { TitleManagerFollowUpRegistrationComponent } from './title-manager-list/title-manager-follow-up/title-manager-follow-up-registration/title-manager-follow-up-registration.component';
import { TitleManagerFollowUpSchoolComponent } from './title-manager-list/title-manager-follow-up/title-manager-follow-up-school/title-manager-follow-up-school.component';
import { TitleManagerFollowUpCompanyComponent } from './title-manager-list/title-manager-follow-up/title-manager-follow-up-company/title-manager-follow-up-company.component';
import { TitleManagerStudentComponent } from './title-manager-student/title-manager-student.component';
import { TitleManagerStudentTitleClassSelectionComponent } from './title-manager-student/title-manager-student-title-class-selection/title-manager-student-title-class-selection.component';
import { TitleManagerStudentTableComponent } from './title-manager-student/title-manager-student-table/title-manager-student-table.component';


@NgModule({
  declarations: [
    TitleManagerListComponent, 
    TitleManagerDashboardComponent, 
    ManagerTasksTableComponent, 
    DashboardGraphicChartsComponent, 
    DashboardGraphicChartsRegistrationComponent, 
    DashboardGraphicChartsSchoolComponent, 
    DashboardGraphicChartsTaskComponent,
    DashboardGraphicChartsCompanyComponent,
    TitleManagerFollowUpRegistrationComponent,
    TitleManagerFollowUpSchoolComponent,
    TitleManagerFollowUpCompanyComponent,
    TitleManagerStudentComponent,
    TitleManagerStudentTitleClassSelectionComponent,
    TitleManagerStudentTableComponent,
  ],
  imports: [
    CommonModule,
    TitleManagerRoutingModule,
    SharedModule,
    CKEditorModule,
    NgSelectModule,
    SweetAlert2Module.forRoot(),
  ],
  exports: [
    DashboardGraphicChartsComponent, 
    DashboardGraphicChartsRegistrationComponent, 
    DashboardGraphicChartsSchoolComponent, 
    DashboardGraphicChartsTaskComponent,
    DashboardGraphicChartsCompanyComponent
  ]
})
export class TitleManagerModule { }
