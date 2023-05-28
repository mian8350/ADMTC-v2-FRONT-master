import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UploadDocumentComponent } from './upload-document.component';
import { SharedModule } from 'app/shared/shared.module';



@NgModule({
  declarations: [UploadDocumentComponent],
  imports: [
    CommonModule,
    SharedModule
  ]
})
export class UploadDocumentModule { }
