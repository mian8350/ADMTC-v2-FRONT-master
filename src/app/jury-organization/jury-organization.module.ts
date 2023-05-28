import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { JuryOrganizationRoutingModule } from './jury-organization-routing.module';
import { JuryOrganizationComponent } from './jury-organization/jury-organization.component';
import { JuryOrganizationGlobalComponent } from './jury-organization-global/jury-organization-global.component';
import { SharedModule } from 'app/shared/shared.module';
import { JuryOrganizationDialogComponent } from './jury-organization-dialog/jury-organization-dialog.component';
import { OrganizeJuriesComponent } from './organize-juries/organize-juries.component';
import { AssignJuryComponent } from './organize-juries/assign-jury/assign-jury.component';
import { AssignPresidentJuryComponent } from './organize-juries/assign-president-jury/assign-president-jury.component';
import { AssignMemberJuryComponent } from './organize-juries/assign-member-jury/assign-member-jury.component';
import { AssignStudentComponent } from './organize-juries/assign-student/assign-student.component';
import { ScheduleJuriesComponent } from './schedule-juries/schedule-juries.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { JuryKitDialogComponent } from './jury-kit-dialog/jury-kit-dialog.component';
import { AssignNumberOfJuryComponent } from './organize-juries/assign-jury/assign-number-of-jury/assign-number-of-jury.component';
import { AssignNumberJuryMainScheduleComponent } from './organize-juries/assign-jury/assign-number-of-jury/assign-number-jury-main-schedule/assign-number-jury-main-schedule.component';
import { AssignNumberJuryBackupScheduleComponent } from './organize-juries/assign-jury/assign-number-of-jury/assign-number-jury-backup-schedule/assign-number-jury-backup-schedule.component';
import { JuryOrganizationDetailComponent } from './jury-organization-detail/jury-organization-detail.component';
import { NgxMaterialTimepickerModule } from 'ngx-material-timepicker';
import { AssignStudentPerJuryComponent } from './organize-juries/assign-student/assign-student-per-jury/assign-student-per-jury.component';
import { PostponeDialogComponent } from './schedule-juries/postpone-dialog/postpone-dialog.component';
import { AllJuryScheduleComponent } from './all-jury-schedule/all-jury-schedule.component';
import { AssignGrandOralJuryParameterComponent } from './organize-juries/assign-grand-oral-jury-parameter/assign-grand-oral-jury-parameter.component';
import { ClassGrandOralJuryParameterComponent } from './organize-juries/assign-grand-oral-jury-parameter/class-grand-oral-jury-parameter/class-grand-oral-jury-parameter.component';
import { BackupDateGlobalComponent } from './organize-juries/backup-date-global/backup-date-global.component';
import { StandardBackupDateTableComponent } from './organize-juries/backup-date-global/standard-backup-date-table/standard-backup-date-table.component';
import { PresidentJuriesSchedulesTableComponent } from './organize-juries/backup-date-global/president-juries-schedules-table/president-juries-schedules-table.component';
import { PresidentJuriesListTableComponent } from './organize-juries/backup-date-global/president-juries-schedules-table/president-juries-list-table/president-juries-list-table.component';
import { SchedulePerPresidentJuryTableComponent } from './organize-juries/backup-date-global/president-juries-schedules-table/schedule-per-president-jury-table/schedule-per-president-jury-table.component';
import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';
import { SetupScheduleGoVisioOfflineJuryComponent } from './organize-juries/setup-schedule-grand-oral/setup-schedule-go-visio-offline-jury/setup-schedule-go-visio-offline-jury.component';
import { AssignJuriesMultipleComponent } from './organize-juries/shared-jury-dialogs/assign-juries-multiple/assign-juries-multiple.component';
import { ImportSchedulesDialogComponent } from './organize-juries/shared-jury-dialogs/import-schedules-dialog/import-schedules-dialog.component';
import { SetSessionJuriesIndividualComponent } from './organize-juries/shared-jury-dialogs/set-session-juries-individual/set-session-juries-individual.component';
import { SetSessionMultipleComponent } from './organize-juries/shared-jury-dialogs/set-session-multiple/set-session-multiple.component';
import { SetupScheduleRetakeGrandOralComponent } from './organize-juries/setup-schedule-retake-grand-oral/setup-schedule-retake-grand-oral.component';
import { SetupScheduleGrandOralComponent } from './organize-juries/setup-schedule-grand-oral/setup-schedule-grand-oral.component';
import { SetupScheduleGoOffPlatformJuryComponent } from './organize-juries/setup-schedule-grand-oral/setup-schedule-go-off-platform-jury/setup-schedule-go-off-platform-jury.component';
import { JuryMarkEntryTableComponent } from './jury-mark-entry-table/jury-mark-entry-table.component';
import { GrandOralExemptionDialogComponent } from './organize-juries/shared-jury-dialogs/grand-oral-exemption-dialog/grand-oral-exemption-dialog.component';
import { GlobalJuryParentTabComponent } from './global-jury-parent-tab/global-jury-parent-tab.component';
import { SetupScheduleRetakeGoOffPlatformJuryComponent } from './organize-juries/setup-schedule-retake-grand-oral/setup-schedule-retake-go-off-platform-jury/setup-schedule-retake-go-off-platform-jury.component';
import { SetupScheduleRetakeGoVisioOfflineJuryComponent } from './organize-juries/setup-schedule-retake-grand-oral/setup-schedule-retake-go-visio-offline-jury/setup-schedule-retake-go-visio-offline-jury.component';

@NgModule({
    declarations: [
        JuryOrganizationComponent,
        JuryOrganizationGlobalComponent,
        JuryOrganizationDialogComponent,
        OrganizeJuriesComponent,
        AssignJuryComponent,
        AssignPresidentJuryComponent,
        AssignMemberJuryComponent,
        AssignStudentComponent,
        ScheduleJuriesComponent,
        JuryKitDialogComponent,
        AssignNumberOfJuryComponent,
        AssignNumberJuryMainScheduleComponent,
        AssignNumberJuryBackupScheduleComponent,
        JuryOrganizationDetailComponent,
        AssignStudentPerJuryComponent,
        PostponeDialogComponent,
        AllJuryScheduleComponent,
        AssignGrandOralJuryParameterComponent,
        ClassGrandOralJuryParameterComponent,
        BackupDateGlobalComponent,
        StandardBackupDateTableComponent,
        PresidentJuriesSchedulesTableComponent,
        PresidentJuriesListTableComponent,
        SchedulePerPresidentJuryTableComponent,
        SetupScheduleRetakeGrandOralComponent,
        SetSessionJuriesIndividualComponent,
        SetSessionMultipleComponent,
        AssignJuriesMultipleComponent,
        ImportSchedulesDialogComponent,
        SetupScheduleGoVisioOfflineJuryComponent,
        SetupScheduleGrandOralComponent,
        SetupScheduleGoOffPlatformJuryComponent,
        JuryMarkEntryTableComponent,
        GrandOralExemptionDialogComponent,
        GlobalJuryParentTabComponent,
        SetupScheduleRetakeGoOffPlatformJuryComponent,
        SetupScheduleRetakeGoVisioOfflineJuryComponent,
    ],
    imports: [
        CommonModule,
        SharedModule,
        JuryOrganizationRoutingModule,
        NgSelectModule,
        NgxMaterialTimepickerModule,
        SweetAlert2Module.forRoot(),
    ],
    exports: [JuryOrganizationDialogComponent, ScheduleJuriesComponent]
})
export class JuryOrganizationModule {}
