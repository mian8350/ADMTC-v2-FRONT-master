import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { EmployabilitySurveyRoutingModule } from './employability-survey-routing.module';
import { ListOfEmployabilitySurveyComponent } from './list-of-employability-survey.component';
import { SharedModule } from 'app/shared/shared.module';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import { NgSelectModule } from '@ng-select/ng-select';
import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';
import { EmployabilitySurveyDetailsComponent } from './employability-survey-details/employability-survey-details.component';
import { EmployabilitySurveyDetailsParametersComponent } from './employability-survey-details/employability-survey-details-parameters/employability-survey-details-parameters.component';
import { EmployabilitySurveyDetailsResultComponent } from './employability-survey-details/employability-survey-details-result/employability-survey-details-result.component';
import { CreateEmployabilitySurveyProcessDialogComponent } from './create-employability-survey-process-dialog/create-employability-survey-process-dialog.component';
import { SchoolModule } from 'app/school/school.module';
import { EmployabilitySurveyDetailsResultContinuousComponent } from './employability-survey-details/employability-survey-details-result/employability-survey-details-result-continuous/employability-survey-details-result-continuous.component';
import { EmployabilitySurveyDetailsResultOneTimeComponent } from './employability-survey-details/employability-survey-details-result/employability-survey-details-result-one-time/employability-survey-details-result-one-time.component';
import { EmployabilitySurveyDetailsResultExportComponent } from './employability-survey-details/employability-survey-details-result/employability-survey-details-result-export/employability-survey-details-result-export.component';
import { StudentCardsModule } from 'app/student-cards/student-cards.module';
import { EmployabilitySurveyDetailsParametersFormBuilderComponent } from './employability-survey-details/employability-survey-details-parameters-form-builder/employability-survey-details-parameters-form-builder.component';


@NgModule({
    declarations: [
        ListOfEmployabilitySurveyComponent,
        EmployabilitySurveyDetailsComponent,
        EmployabilitySurveyDetailsParametersComponent,
        EmployabilitySurveyDetailsResultComponent,
        CreateEmployabilitySurveyProcessDialogComponent,
        EmployabilitySurveyDetailsResultContinuousComponent,
        EmployabilitySurveyDetailsResultOneTimeComponent,
        EmployabilitySurveyDetailsResultExportComponent,
        EmployabilitySurveyDetailsParametersFormBuilderComponent
    ],
    imports: [
        CommonModule,
        EmployabilitySurveyRoutingModule,
        SharedModule,
        CKEditorModule,
        NgSelectModule,
        SchoolModule,
        StudentCardsModule,
        SweetAlert2Module.forRoot(),
    ]
})
export class EmployabilitySurveyModule { }
