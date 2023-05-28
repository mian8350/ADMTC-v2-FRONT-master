import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuestionnaireToolsComponent } from './questionnaire-tools/questionnaire-tools.component';
import { SharedModule } from 'app/shared/shared.module';
import { QuestionnaireToolsRoutingModule } from './questionnaire-tools-routing.module';
import { QuestionnaireDocumentComponent } from './questionnaire-document/questionnaire-document.component';
import { QuestionnaireGlobalComponent } from './questionnaire-global/questionnaire-global.component';
import { QuestionaireTemplateFormComponent } from './questionaire-template-form/questionaire-template-form.component';
import { QuestionaireFormDetailComponent } from './questionaire-template-form/questionaire-form-detail/questionaire-form-detail.component';
import { QuestionaireFormDocumentComponent } from './questionaire-template-form/questionaire-form-document/questionaire-form-document.component';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import { NgSelectModule } from '@ng-select/ng-select';
import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';
import { ParentChildNestingComponent } from './questionaire-template-form/questionaire-form-detail/parent-child-nesting/parent-child-nesting.component';
import { DuplicateTemplateDialogComponent } from './questionnaire-tools/duplicate-template-dialog/duplicate-template-dialog.component';
import { QuestionnaireSimulationDialogComponent } from './questionnaire-simulation-dialog/questionnaire-simulation-dialog.component';
import { QuestionnaireSimulationsComponent } from './questionnaire-simulations/questionnaire-simulations.component';
import { QuestionnaireSimulationJobDescriptionComponent } from './questionnaire-simulations/questionnaire-simulation-job-description/questionnaire-simulation-job-description.component';
import { QuestionnaireSimulationProblematicComponent } from './questionnaire-simulations/questionnaire-simulation-problematic/questionnaire-simulation-problematic.component';
import { QuestionnaireSimulationEmployabilitySurveyComponent } from './questionnaire-simulations/questionnaire-simulation-employability-survey/questionnaire-simulation-employability-survey.component';
import { ParentChildRecursiveComponent } from 'app/student-cards/job-description/job-by-score/parent-child-recursive/parent-child-recursive.component';

@NgModule({
    declarations: [
        QuestionnaireToolsComponent,
        QuestionnaireDocumentComponent,
        QuestionnaireGlobalComponent,
        QuestionaireTemplateFormComponent,
        QuestionaireFormDetailComponent,
        QuestionaireFormDocumentComponent,
        ParentChildNestingComponent,
        DuplicateTemplateDialogComponent,
        QuestionnaireSimulationDialogComponent,
        QuestionnaireSimulationsComponent,
        QuestionnaireSimulationJobDescriptionComponent,
        QuestionnaireSimulationProblematicComponent,
        QuestionnaireSimulationEmployabilitySurveyComponent,
    ],
    imports: [CommonModule, SharedModule, QuestionnaireToolsRoutingModule, CKEditorModule, NgSelectModule, SweetAlert2Module.forRoot()],
    exports: [ParentChildNestingComponent]
})
export class QuestionnaireToolsModule {}
