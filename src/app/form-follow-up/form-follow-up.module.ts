import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FormFollowUpRoutingModule } from './form-follow-up-routing.module';
import { SharedModule } from 'app/shared/shared.module';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import { NgSelectModule } from '@ng-select/ng-select';
import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';
import { FormDetailTableComponent } from './form-detail-table/form-detail-table.component';
import { FormFollowUpComponent } from './form-follow-up.component';

@NgModule({
  declarations: [FormDetailTableComponent, FormFollowUpComponent],
  imports: [
    CommonModule,
    FormFollowUpRoutingModule,
    SharedModule,
    CKEditorModule,
    NgSelectModule,
    SweetAlert2Module.forRoot()
  ]
})
export class FormFollowUpModule { }
