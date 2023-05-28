import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import { NgSelectModule } from '@ng-select/ng-select';
import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';
import { CompaniesModule } from 'app/companies/companies.module';
import { JuryOrganizationModule } from 'app/jury-organization/jury-organization.module';
import { MailboxModule } from 'app/mailbox/mailbox.module';
import { RncpTitlesModule } from 'app/rncp-titles/rncp-titles.module';
import { SharedModule } from 'app/shared/shared.module';
import { StudentCardsModule } from 'app/student-cards/student-cards.module';
import { StudentsModule } from 'app/students/students.module';
import { TaskModule } from 'app/task/task.module';
import { AdmissionFormComponent } from '../student-cards/admission-form/admission-form.component';
import { AddRncpDialogComponent } from './add-rncp-dialog/add-rncp-dialog.component';
import { AddSchoolDialogComponent } from './add-school-dialog/add-school-dialog.component';
import { SchoolComposeEmailDialogComponent } from './school-compose-email-dialog/school-compose-email-dialog.component';
import { ConnectTitleDialogComponent } from './school-detail/connect-title-dialog/connect-title-dialog.component';
import { EditConnectedTitleDialogComponent } from './school-detail/edit-connected-title-dialog/edit-connected-title-dialog.component';
import { SchoolDetailComponent } from './school-detail/school-detail.component';
import { SchoolRoutingModule } from './school-routing.module';
import { SchoolStaffDialogComponent } from './school-staff/school-staff-dialog/school-staff-dialog.component';
import { SchoolStaffComponent } from './school-staff/school-staff.component';
import { CardsListComponent } from './school-student-cards/cards-list/cards-list.component';
import { CreateCompanyDetailComponent } from './school-student-cards/create-student-detail/create-company-detail/create-company-detail.component';
import { CreateCourseDetailComponent } from './school-student-cards/create-student-detail/create-course-detail/create-course-detail.component';
import { CreateIdentityDetailComponent } from './school-student-cards/create-student-detail/create-identity-detail/create-identity-detail.component';
import { CreateParentDetailComponent } from './school-student-cards/create-student-detail/create-parent-detail/create-parent-detail.component';
import { CreateStudentDetailComponent } from './school-student-cards/create-student-detail/create-student-detail.component';
import { AddCommentaryDialogComponent } from './school-student-cards/grouped-card-detail/commentaries/add-commentary-dialog/add-commentary-dialog.component';
import { CommentariesReplyDialogComponent } from './school-student-cards/grouped-card-detail/commentaries/commentaries-reply-dialog/commentaries-reply-dialog.component';
import { CommentariesComponent } from './school-student-cards/grouped-card-detail/commentaries/commentaries.component';
import { GroupedCardDetailComponent } from './school-student-cards/grouped-card-detail/grouped-card-detail.component';
import { ParentAdmissionTabComponent } from './school-student-cards/grouped-card-detail/parent-admission-tab/parent-admission-tab.component';
import { ParentCertificationTabComponent } from './school-student-cards/grouped-card-detail/parent-certification-tab/parent-certification-tab.component';
import { ParentCompanyTabComponent } from './school-student-cards/grouped-card-detail/parent-company-tab/parent-company-tab.component';
import { ParentDocumentsTabComponent } from './school-student-cards/grouped-card-detail/parent-documents-tab/parent-documents-tab.component';
import { ParentIdentityTabComponent } from './school-student-cards/grouped-card-detail/parent-identity-tab/parent-identity-tab.component';
import { QuestionFieldTabComponent } from './school-student-cards/grouped-card-detail/question-field-tab/question-field-tab.component';
import { SchoolStudentCardsComponent } from './school-student-cards/school-student-cards.component';
import { StudentSummaryCardComponent } from './school-student-cards/student-summary-card/student-summary-card.component';
import { SchoolStudentDeactivatedComponent } from './school-student-deactivated/school-student-deactivated.component';
import { ImportStudentComponent } from './school-student-table/import-student/import-student.component';
import { SchoolStudentTableComponent } from './school-student-table/school-student-table.component';
import { ValidateStudentCvPresentationComponent } from './school-student-table/validate-student-cv-presentation/validate-student-cv-presentation.component';
import { ValidateStudentDocExpectedComponent } from './school-student-table/validate-student-doc-expected/validate-student-doc-expected.component';
import { SchoolTabComponent } from './school-tab/school-tab.component';
import { SchoolComponent } from './school/school.component';
import { SelectTitleClassComponent } from './select-title-class/select-title-class.component';

@NgModule({
    declarations: [
        SchoolComponent,
        AddSchoolDialogComponent,
        AddRncpDialogComponent,
        SchoolComposeEmailDialogComponent,
        SchoolStudentCardsComponent,
        SchoolStudentTableComponent,
        SchoolStudentDeactivatedComponent,
        SchoolDetailComponent,
        SchoolStaffComponent,
        SchoolTabComponent,
        SelectTitleClassComponent,
        SchoolStaffDialogComponent,
        ConnectTitleDialogComponent,
        EditConnectedTitleDialogComponent,
        CardsListComponent,
        CreateStudentDetailComponent,
        CreateCourseDetailComponent,
        CreateIdentityDetailComponent,
        CreateParentDetailComponent,
        CreateCompanyDetailComponent,
        ImportStudentComponent,
        ValidateStudentDocExpectedComponent,
        ValidateStudentCvPresentationComponent,
        AdmissionFormComponent,
        GroupedCardDetailComponent,
        ParentIdentityTabComponent,
        ParentAdmissionTabComponent,
        ParentCompanyTabComponent,
        ParentDocumentsTabComponent,
        CommentariesComponent,
        StudentSummaryCardComponent,
        ParentCertificationTabComponent,
        AddCommentaryDialogComponent,
        CommentariesReplyDialogComponent,
        QuestionFieldTabComponent,
    ],
    imports: [
        CommonModule,
        SharedModule,
        SchoolRoutingModule,
        CKEditorModule,
        NgSelectModule,
        SweetAlert2Module.forRoot(),
        StudentsModule,
        RncpTitlesModule,
        CompaniesModule,
        JuryOrganizationModule,
        StudentCardsModule,
        TaskModule,
        MailboxModule,
    ],
    exports: [
        SelectTitleClassComponent,
        CardsListComponent,
        GroupedCardDetailComponent,
        StudentSummaryCardComponent,
    ]
})
export class SchoolModule {}
