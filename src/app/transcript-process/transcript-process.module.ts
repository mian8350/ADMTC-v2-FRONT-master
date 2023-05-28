import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TranscriptProcessRoutingModule } from './transcript-process-routing.module';
import { SharedModule } from 'app/shared/shared.module';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import { NgSelectModule } from '@ng-select/ng-select';
import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';
import { TranscriptProcessTableComponent } from './transcript-process-table.component';
import { TranscriptProcessDialogComponent } from './transcript-process-dialog/transcript-process-dialog.component';
import { TranscriptProcessDetailComponent } from './transcript-process-detail/transcript-process-detail.component';
import { TranscriptPublishParameterStepComponent } from './transcript-publish-parameter-step/transcript-publish-parameter-step.component';
import { TranscriptInputDecisionComponent } from './transcript-input-decision/transcript-input-decision.component';
import { TranscriptDecisionComponent } from './transcript-input-decision/transcript-decision/transcript-decision.component';
import { BlockTreeComponent } from './transcript-input-decision/transcript-decision/block-tree/block-tree.component';
import { TranscriptStudentResultTableComponent } from './transcript-input-decision/transcript-student-result-table/transcript-student-result-table.component';
import { TranscriptProcessParameterComponent } from './transcript-process-parameter/transcript-process-parameter.component';
import { ImportTranscriptDecisionDialogComponent } from './transcript-input-decision/transcript-student-result-table/import-transcript-decision-dialog/import-transcript-decision-dialog.component';
import { TranscriptCertificateGenertionComponent } from './transcript-certificate-genertion/transcript-certificate-genertion.component';

@NgModule({
    declarations: [
        TranscriptProcessTableComponent,
        TranscriptProcessDialogComponent,
        TranscriptProcessDetailComponent,
        TranscriptProcessParameterComponent,
        TranscriptStudentResultTableComponent,
        TranscriptInputDecisionComponent,
        TranscriptDecisionComponent,
        BlockTreeComponent,
        TranscriptPublishParameterStepComponent,
        ImportTranscriptDecisionDialogComponent,
        TranscriptCertificateGenertionComponent,
    ],
    imports: [CommonModule, TranscriptProcessRoutingModule, SharedModule, CKEditorModule, NgSelectModule, SweetAlert2Module.forRoot()]
})
export class TranscriptProcessModule {}
