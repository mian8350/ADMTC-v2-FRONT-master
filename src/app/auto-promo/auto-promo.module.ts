import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AutoPromoComponent } from './auto-promo/auto-promo.component';
import { AutoPromoRoutingModule } from './auto-promo-routing.module';
import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';
import { SharedModule } from 'app/shared/shared.module';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import { AddPromoDialogComponent } from './add-promo-dialog/add-promo-dialog.component';
import { NgSelectModule } from '@ng-select/ng-select';

@NgModule({
    declarations: [AutoPromoComponent, AddPromoDialogComponent],
    imports: [
        CommonModule,
        SharedModule,
        AutoPromoRoutingModule,
        SweetAlert2Module.forRoot(),
        CKEditorModule,
        NgSelectModule
    ],
    providers: []
})
export class AutoPromoModule { }
