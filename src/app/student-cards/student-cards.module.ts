import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MyDocumentTabComponent } from './my-document-tab/my-document-tab.component';
import { MyDocumentDialogComponent } from './my-document-tab/my-document-dialog/my-document-dialog.component';
import { DerogationDiplomaViewComponent } from './diploma/derogation-diploma-view/derogation-diploma-view.component';
import { ExemptionJustificationDiplomaViewComponent } from './diploma/exemption-justification-diploma-view/exemption-justification-diploma-view.component';
import { DerogationDiplomaDialogComponent } from './diploma/derogation-diploma-view/derogation-diploma-dialog/derogation-diploma-dialog.component';
import { StudentCertificationRuleComponent } from './student-certification-rule/student-certification-rule.component';
import { StudenntTranscriptDetailComponent } from './certification/student-transcript-detail/student-transcript-detail.component';
import { SubjectsForCertificationFolderComponent } from './subjects-for-certification-folder/subjects-for-certification-folder.component';
import { VerifcationIdentityDialogComponent } from './details-of-certification/verification-identity-dialog/verification-identity-dialog.component';
import { JobPDFComponent } from './job-description/job-description-pdf/job-description-pdf.component';
import { StudentJuryOrganizationComponent } from './student-jury-organization/student-jury-organization.component';
import { ProblematicPDFComponent } from './problematic/problematic-pdf/problematic-pdf.component';
import { CourseComponent } from './course/course.component';
import { IdentityComponent } from './identity/identity.component';
import { CompanyComponent } from './company/company.component';
import { ParentsComponent } from './parents/parents.component';
import { JobDescriptionComponent } from './job-description/job-description.component';
import { DiplomaComponent } from './diploma/diploma.component';
import { SubjectsForCertificationComponent } from './subjects-for-certification/subjects-for-certification.component';
import { DocumentsComponent } from './documents/documents.component';
import { CertificationComponent } from './certification/certification.component';
import { RetakeDuringTheYearComponent } from './retake-during-the-year/retake-during-the-year.component';
import { JobDescCompetencyComponent } from './job-description/job-by-competency/job-by-competency.component';
import { JobDescScoreComponent } from './job-description/job-by-score/job-by-score.component';
import { JobByScoreImportedComponent } from './job-description/job-by-score-imported/job-by-score-imported.component';
import { RejectionReasonDialogComponent } from './job-description/rejection-reason-dialog/rejection-reason-dialog.component';
import { ParentChildRecursiveComponent } from './job-description/job-by-score/parent-child-recursive/parent-child-recursive.component';
import { MyFileDiplomaViewComponent } from './diploma/my-file-diploma-view/my-file-diploma-view.component';
import { MyFileDiplomaEditComponent } from './diploma/my-file-diploma-edit/my-file-diploma-edit.component';
import { MentorEvalComponent } from './mentor-eval/mentor-eval.component';
import { ProblematicComponent } from './problematic/problematic.component';
import { EmployabilitySurveyComponent } from './employability-survey/employability-survey.component';
import { DocumentsTabComponent } from './documents-tab/documents-tab.component';
import { ImportedProblematicFormComponent } from './problematic/imported-problematic-form/imported-problematic-form.component';
import { NewProblematicFormComponent } from './problematic/new-problematic-form/new-problematic-form.component';
import { EmployabilitySurveyFormDetailComponent } from './employability-survey/employability-survey-form-detail/employability-survey-form-detail.component';
import { DetailOfCertificationComponent } from './details-of-certification/details-of-certification.component';
import { SharedModule } from 'app/shared/shared.module';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import { NgSelectModule } from '@ng-select/ng-select';
import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';
import { ValidateSiretDialogComponent } from './company/validate-siret-dialog/validate-siret-dialog.component';
import { CloseCompanyContractDialogComponent } from './company/close-company-contract-dialog/close-company-contract-dialog.component';
import { FinalTranscriptViewComponent } from './diploma/final-transcript-view/final-transcript-view.component';
import { ReasonOfDeactivationDialogComponent } from './company/reason-of-deactivation-dialog/reason-of-deactivation-dialog.component';


@NgModule({
    declarations: [
        MyDocumentTabComponent,
        MyDocumentDialogComponent,
        DerogationDiplomaViewComponent,
        DerogationDiplomaDialogComponent,
        ExemptionJustificationDiplomaViewComponent,
        StudentCertificationRuleComponent,
        StudenntTranscriptDetailComponent,
        SubjectsForCertificationFolderComponent,
        VerifcationIdentityDialogComponent,
        JobPDFComponent,
        ProblematicPDFComponent,
        StudentJuryOrganizationComponent,
        CourseComponent,
        IdentityComponent,
        ParentsComponent,
        CompanyComponent,
        JobDescriptionComponent,
        DiplomaComponent,
        SubjectsForCertificationComponent,
        DocumentsComponent,
        CertificationComponent,
        RetakeDuringTheYearComponent,
        JobDescCompetencyComponent,
        JobDescScoreComponent,
        JobByScoreImportedComponent,
        RejectionReasonDialogComponent,
        ParentChildRecursiveComponent,
        MyFileDiplomaViewComponent,
        MyFileDiplomaEditComponent,
        MentorEvalComponent,
        ProblematicComponent,
        EmployabilitySurveyComponent,
        DocumentsTabComponent,
        ImportedProblematicFormComponent,
        NewProblematicFormComponent,
        EmployabilitySurveyFormDetailComponent,
        DetailOfCertificationComponent,
        ValidateSiretDialogComponent,
        CloseCompanyContractDialogComponent,
        FinalTranscriptViewComponent,
        ReasonOfDeactivationDialogComponent
    ],
    imports: [
        CommonModule,
        SharedModule,
        CKEditorModule,
        NgSelectModule,
        SweetAlert2Module.forRoot(),
    ],
    exports: [
        MyDocumentTabComponent,
        MyDocumentDialogComponent,
        DerogationDiplomaViewComponent,
        DerogationDiplomaDialogComponent,
        ExemptionJustificationDiplomaViewComponent,
        StudentCertificationRuleComponent,
        StudenntTranscriptDetailComponent,
        SubjectsForCertificationFolderComponent,
        VerifcationIdentityDialogComponent,
        JobPDFComponent,
        ProblematicPDFComponent,
        StudentJuryOrganizationComponent,
        CourseComponent,
        IdentityComponent,
        ParentsComponent,
        CompanyComponent,
        JobDescriptionComponent,
        DiplomaComponent,
        SubjectsForCertificationComponent,
        DocumentsComponent,
        CertificationComponent,
        RetakeDuringTheYearComponent,
        JobDescCompetencyComponent,
        JobDescScoreComponent,
        JobByScoreImportedComponent,
        RejectionReasonDialogComponent,
        ParentChildRecursiveComponent,
        MyFileDiplomaViewComponent,
        MyFileDiplomaEditComponent,
        MentorEvalComponent,
        ProblematicComponent,
        EmployabilitySurveyComponent,
        DocumentsTabComponent,
        ImportedProblematicFormComponent,
        NewProblematicFormComponent,
        EmployabilitySurveyFormDetailComponent,
        DetailOfCertificationComponent
    ]
})
export class StudentCardsModule { }
