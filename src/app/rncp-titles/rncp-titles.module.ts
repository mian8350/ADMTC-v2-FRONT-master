import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RncpTitlesComponent } from './rncp-titles/rncp-titles.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { SharedModule } from 'app/shared/shared.module';
import { RncpTitleRoutingModule } from './rncp-title-routing.module';
import { PendingTaskComponent } from '../rncp-titles/dashboard/pendingtask/pendingtask.component'
import { CalendarComponent } from '../rncp-titles/dashboard/calendar/calendar.component'
import { AddCalendarEventDialogComponent } from './dashboard/add-calendar-event-dialog/add-calendar-event-dialog.component'
import { NgSelectModule } from '@ng-select/ng-select';
import { ModifyCategoriesComponent } from '../rncp-titles/dashboard/modify-categories/modify-categories.component';
import { TestDetailsComponent } from './dashboard/test-details/test-details.component';
import { IdentityComponent } from './dashboard/test-details/identity/identity.component';
import { AutomaticTaskComponent } from './dashboard/test-details/automatic-task/automatic-task.component';
import { DocumentUploadedComponent } from './dashboard/test-details/document-uploaded/document-uploaded.component';
import { DocumentExpectedComponent } from './dashboard/test-details/document-expected/document-expected.component';
import { ViewDialogComponent } from './dashboard/test-details/view-dialog/view-dialog.component';
import { TitleCardDashboardComponent } from './rncp-titles/title-card-dashboard/title-card-dashboard.component';
import { SetupAcademicKitDialogComponent } from './rncp-titles/setup-academic-kit-dialog/setup-academic-kit-dialog.component'
import { AcademicKitComponent } from './dashboard/academic-kit/academic-kit.component';
import { AddFolderDialogComponent } from './dashboard/add-folder-dialog/add-folder-dialog.component';
import { DocumentDetailDialogComponent } from './dashboard/document-detail-dialog/document-detail-dialog.component';
import { DocumentUploadDialogComponent } from './dashboard/document-upload-dialog/document-upload-dialog.component';
import { MoveFolderDialogComponent } from './dashboard/move-folder-dialog/move-folder-dialog.component';
import { FolderTreeComponent } from './dashboard/move-folder-dialog/folder-tree/folder-tree.component';
import { TaskModule } from 'app/task/task.module';
import { PdfPersonalizedStudentComponent } from './dashboard/test-details/pdf-personalized-student/pdf-personalized-student.component';
import { PdfPersonalizedGroupComponent } from './dashboard/test-details/pdf-personalized-group/pdf-personalized-group.component';
import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';
import { AcadKitQuickSearchListComponent } from './acad-kit-quick-search-list/acad-kit-quick-search-list.component';
import { DuplicateDetailDialogComponent } from './dashboard/duplicate-detail-dialog/duplicate-detail-dialog.component';
import { DuplicateFolderDialogComponent } from './dashboard/duplicate-folder-dialog/duplicate-folder-dialog.component';

@NgModule({
    declarations: [
        RncpTitlesComponent,
        DashboardComponent,
        PendingTaskComponent,
        CalendarComponent,
        AcademicKitComponent,
        AddCalendarEventDialogComponent,
        ModifyCategoriesComponent,
        TestDetailsComponent,
        IdentityComponent,
        AutomaticTaskComponent,
        DocumentUploadedComponent,
        DocumentExpectedComponent,
        ViewDialogComponent,
        TitleCardDashboardComponent,
        SetupAcademicKitDialogComponent,
        AddFolderDialogComponent,
        DocumentDetailDialogComponent,
        DocumentUploadDialogComponent,
        MoveFolderDialogComponent,
        FolderTreeComponent,
        AcadKitQuickSearchListComponent,
        DuplicateDetailDialogComponent,
        DuplicateFolderDialogComponent,
    ],
    imports: [
        CommonModule,
        SharedModule,
        RncpTitleRoutingModule,
        NgSelectModule,
        TaskModule,
        SweetAlert2Module.forRoot(),
    ],
    exports: [
        DocumentDetailDialogComponent,
    ],
    providers: [DatePipe]
})
export class RncpTitlesModule { }
