import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { GrandOralRoutingModule } from './grand-oral-routing.module';
import { SharedModule } from 'app/shared/shared.module';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import { NgSelectModule } from '@ng-select/ng-select';
import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';
import { JuryGrandOralComponent } from './jury-grand-oral.component';
import { PdfStudentGrandOralComponent } from './pdf-student-grand-oral/pdf-student-grand-oral.component';
import { PdfJuryGrandOralComponent } from './pdf-jury-grand-oral/pdf-jury-grand-oral.component';

@NgModule({
  declarations: [JuryGrandOralComponent, PdfStudentGrandOralComponent, PdfJuryGrandOralComponent],
  imports: [CommonModule, SharedModule, CKEditorModule, NgSelectModule, SweetAlert2Module.forRoot(), GrandOralRoutingModule],
})
export class GrandOralModule {}
