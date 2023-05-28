import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ProcessManagementRoutingModule } from './process-management-routing.module';
import { ProcessManagementTableComponent } from './process-management-table.component';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import { NgSelectModule } from '@ng-select/ng-select';
import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';
import { SharedModule } from 'app/shared/shared.module';


@NgModule({
  declarations: [ProcessManagementTableComponent],
  imports: [
    CommonModule,
    ProcessManagementRoutingModule,
    SharedModule,
    CKEditorModule,
    NgSelectModule,
    SweetAlert2Module.forRoot(),
  ]
})
export class ProcessManagementModule { }
