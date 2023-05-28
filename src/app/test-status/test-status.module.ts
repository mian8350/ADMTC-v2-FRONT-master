import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TestStatusRoutingModule } from './test-status-routing.module';
import { TestStatusTableComponent } from './test-status-table.component';
import { SharedModule } from 'app/shared/shared.module';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import { NgSelectModule } from '@ng-select/ng-select';
import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';


@NgModule({
  declarations: [TestStatusTableComponent],
  imports: [
    CommonModule,
    TestStatusRoutingModule,
    SharedModule,
    CKEditorModule,
    NgSelectModule,
    SweetAlert2Module.forRoot(),
  ]
})
export class TestStatusModule { }
