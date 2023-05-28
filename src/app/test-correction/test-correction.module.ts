import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TestCorrectionRoutingModule } from './test-correction-routing.module';
import { TestCorrectionComponent } from './test-correction.component';
import { StudentListComponent } from './student-list/student-list.component';
import { GroupListComponent } from './group-list/group-list.component';
import { HeaderSectionComponent } from './header-section/header-section.component';
import { FooterSectionComponent } from './footer-section/footer-section.component';
import { PenaltiesBonusesComponent } from './penalties-bonuses/penalties-bonuses.component';
import { EliminationComponent } from './elimination/elimination.component';
import { FinalCommentComponent } from './final-comment/final-comment.component';
import { SharedModule } from 'app/shared/shared.module';
import { FileUploadModule } from 'ng2-file-upload';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import { NgxMaterialTimepickerModule } from 'ngx-material-timepicker';
import { InformationDialogComponent } from './information-dialog/information-dialog.component';
import { JuryStudentFormComponent } from './jury-student-form/jury-student-form.component';
import { JuryGroupFormComponent } from './jury-group-form/jury-group-form.component';
import { RncpTitlesModule } from 'app/rncp-titles/rncp-titles.module';
import { PdfDetailComponent } from './pdf-detail/pdf-detail.component';
import { PdfGroupDetailComponent } from './pdf-group-detail/pdf-group-detail.component';
import { JustificationDialogComponent } from './justification-dialog/justification-dialog.component';
import { JustificationReasonDialogComponent } from './justification-reason-dialog/justification-reason-dialog.component';
import { EvalByCompetenceFormComponent } from './eval-by-competence-form/eval-by-competence-form.component';
import { NotationGridFormComponent } from './notation-grid-form/notation-grid-form.component';
import { FreeControlFormComponent } from './free-control-form/free-control-form.component';
import { MultipleDateFormComponent } from './multiple-date-form/multiple-date-form.component';
import { JuryOrganizationFormComponent } from './jury-organization-form/jury-organization-form.component';
import { PdfGroupDetailIndividualWithoutGroupComponent } from './pdf-group-detail/pdf-group-detail-individual-without-group/pdf-group-detail-individual-without-group.component';
import { PdfGroupDetailIndividualWithGroupComponent } from './pdf-group-detail/pdf-group-detail-individual-with-group/pdf-group-detail-individual-with-group.component';
import { PdfGroupDetailDialogComponent } from './pdf-group-detail/pdf-group-detail-dialog/pdf-group-detail-dialog.component';
import { AcademicRecommendationFormComponent } from './academic-recommendation-form/academic-recommendation-form.component';

@NgModule({
    declarations: [
        TestCorrectionComponent,
        StudentListComponent,
        GroupListComponent,
        HeaderSectionComponent,
        FooterSectionComponent,
        PenaltiesBonusesComponent,
        EliminationComponent,
        FinalCommentComponent,
        InformationDialogComponent,
        JuryStudentFormComponent,
        JuryGroupFormComponent,
        JustificationDialogComponent,
        JustificationReasonDialogComponent,
        PdfGroupDetailComponent,
        EvalByCompetenceFormComponent,
        NotationGridFormComponent,
        FreeControlFormComponent,
        MultipleDateFormComponent,
        JuryOrganizationFormComponent,
        PdfGroupDetailIndividualWithoutGroupComponent,
        PdfGroupDetailIndividualWithGroupComponent,
        PdfGroupDetailDialogComponent,
        AcademicRecommendationFormComponent,
    ],
    imports: [
        CommonModule,
        TestCorrectionRoutingModule,
        SharedModule,
        RncpTitlesModule,
        FileUploadModule,
        CKEditorModule,
        NgxMaterialTimepickerModule,
    ]
})
export class TestCorrectionModule {}
