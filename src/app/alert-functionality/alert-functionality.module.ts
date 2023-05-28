import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'app/shared/shared.module';
import { AlertFunctionalityComponent } from './alert-functionality/alert-functionality.component';
import { AlertFunctionalityRoutingModule } from './alert-functionality-routing.module';
import { NgSelectModule } from '@ng-select/ng-select';
import { AddNewAlertDialogComponent } from './alert-functionality/add-new-alert-dialog/add-new-alert-dialog.component';
import { AlertUserResponseDialogComponent } from './alert-functionality/alert-user-response-dialog/alert-user-response-dialog.component';
import { DuplicateAlertDialogComponent } from './alert-functionality/duplicate-alert-dialog/duplicate-alert-dialog.component';

@NgModule({
    declarations: [AlertFunctionalityComponent, AddNewAlertDialogComponent, AlertUserResponseDialogComponent, DuplicateAlertDialogComponent],
    imports: [CommonModule, SharedModule, AlertFunctionalityRoutingModule, NgSelectModule, CKEditorModule, SweetAlert2Module.forRoot(),]
})
export class AlertFunctionalityModule { }
