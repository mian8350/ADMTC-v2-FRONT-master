import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TranscriptBuilderRoutingModule } from './transcript-builder-routing.module';
import { TranscriptBuilderComponent } from './transcript-builder/transcript-builder.component';
import { SharedModule } from 'app/shared/shared.module';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import { CkEditorComponent } from './ck-editor/ck-editor.component';
import { PerfectScrollbarModule, PERFECT_SCROLLBAR_CONFIG, PerfectScrollbarConfigInterface } from 'ngx-perfect-scrollbar';

const DEFAULT_PERFECT_SCROLLBAR_CONFIG: PerfectScrollbarConfigInterface = {
  suppressScrollX: true,
};

@NgModule({
  declarations: [TranscriptBuilderComponent, CkEditorComponent],
  imports: [
    CommonModule,
    TranscriptBuilderRoutingModule,
    SharedModule,
    CKEditorModule,
    PerfectScrollbarModule,
  ],
  providers: [
    {
      provide: PERFECT_SCROLLBAR_CONFIG,
      useValue: DEFAULT_PERFECT_SCROLLBAR_CONFIG,
    },
  ],
})
export class TranscriptBuilderModule {}
