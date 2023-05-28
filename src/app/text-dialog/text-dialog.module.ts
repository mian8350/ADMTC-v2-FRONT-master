import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TextDialogComponent } from './text-dialog.component';
import { SharedModule } from 'app/shared/shared.module';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';



@NgModule({
  declarations: [TextDialogComponent],
  imports: [
    CommonModule,
    SharedModule,
    CKEditorModule,
  ],
  exports: [
    TextDialogComponent
  ]
})
export class TextDialogModule { }
