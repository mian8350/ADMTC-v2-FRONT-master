
import { AllJuryScheduleComponent } from './all-jury-schedule/all-jury-schedule.component';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { JuryOrganizationGlobalComponent } from './jury-organization-global/jury-organization-global.component';
import { OrganizeJuriesComponent } from './organize-juries/organize-juries.component';
import { PermissionGuard } from 'app/service/guard/auth.guard';
import { AssignNumberOfJuryComponent } from './organize-juries/assign-jury/assign-number-of-jury/assign-number-of-jury.component';
import { JuryOrganizationDetailComponent } from './jury-organization-detail/jury-organization-detail.component';
import { AssignJuryComponent } from './organize-juries/assign-jury/assign-jury.component';
import { AssignPresidentJuryComponent } from './organize-juries/assign-president-jury/assign-president-jury.component';
import { AssignMemberJuryComponent } from './organize-juries/assign-member-jury/assign-member-jury.component';
import { AssignStudentComponent } from './organize-juries/assign-student/assign-student.component';
import { ScheduleJuriesComponent } from './schedule-juries/schedule-juries.component';
import { JuryOrganizationComponent } from './jury-organization/jury-organization.component';
import { AssignStudentPerJuryComponent } from './organize-juries/assign-student/assign-student-per-jury/assign-student-per-jury.component';
import { AssignGrandOralJuryParameterComponent } from './organize-juries/assign-grand-oral-jury-parameter/assign-grand-oral-jury-parameter.component';
import { ClassGrandOralJuryParameterComponent } from './organize-juries/assign-grand-oral-jury-parameter/class-grand-oral-jury-parameter/class-grand-oral-jury-parameter.component';
import { BackupDateGlobalComponent } from './organize-juries/backup-date-global/backup-date-global.component';
import { SetupScheduleRetakeGrandOralComponent } from './organize-juries/setup-schedule-retake-grand-oral/setup-schedule-retake-grand-oral.component';
import { SetupScheduleGrandOralComponent } from './organize-juries/setup-schedule-grand-oral/setup-schedule-grand-oral.component';
import { JuryMarkEntryTableComponent } from './jury-mark-entry-table/jury-mark-entry-table.component';
import { GlobalJuryParentTabComponent } from './global-jury-parent-tab/global-jury-parent-tab.component';


export const routes: Routes = [
  {
    path: '',
    component: JuryOrganizationComponent,
    canActivate: [PermissionGuard],
    data: {
      permission: 'certifications.jury_organization.show_perm',
    },
  },
  {
    path: 'all-jury-schedule',
    component: GlobalJuryParentTabComponent,
    canActivate: [PermissionGuard],
    data: {
      permission: 'certifications.jury_organization.show_perm',
    },
  },
  {
    path: ':juryOrgId/assign-number-of-jury/:schoolId/:rncpId/:classId',
    pathMatch: 'full',
    component: AssignNumberOfJuryComponent,
  },
  {
    path: ':juryOrgId/assign-student/:schoolId/:rncpId/:classId/:jurySerialNumber',
    pathMatch: 'full',
    component: AssignStudentPerJuryComponent,
  },
  {
    path: 'class-parameter/:titleId/:classId/:indexClass',
    component: ClassGrandOralJuryParameterComponent,
  },
  {
    path: 'setup-schedule',
    component: SetupScheduleRetakeGrandOralComponent
  },
  {
    path: 'setup-schedule-go',
    component: SetupScheduleGrandOralComponent
  },
  {
    path: ':juryOrgId',
    component: JuryOrganizationDetailComponent,
    children: [
      {
        path: 'organize-juries',
        component: OrganizeJuriesComponent,
        children: [
          {
            path: 'grand-oral-jury-parameter',
            component: AssignGrandOralJuryParameterComponent,
            // children: [
            //   {
            //     path: 'class-parameter/:titleId/:classId/:indexClass',
            //     component: ClassGrandOralJuryParameterComponent,
            //   },
            // ],
          },
          {
            path: 'assign-jury',
            component: AssignJuryComponent,
          },
          {
            path: 'assign-president-jury',
            component: AssignPresidentJuryComponent,
          },
          {
            path: 'assign-backup-date',
            component: BackupDateGlobalComponent,
          },
          {
            path: 'assign-member-jury',
            component: AssignStudentComponent,
          },
          {
            path: 'assign-student-table',
            component: AssignStudentComponent,
          },
        ],
      },
      {
        path: 'schedule-juries',
        component: ScheduleJuriesComponent,
      },
      {
        path: 'jury-mark-entry',
        component: JuryMarkEntryTableComponent,
      },
    ],
  },

  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full',
  },
];

@NgModule({
  declarations: [],
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class JuryOrganizationRoutingModule {}
