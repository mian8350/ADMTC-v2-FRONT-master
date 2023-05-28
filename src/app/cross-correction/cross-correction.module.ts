import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CrossCorrectionComponent } from './cross-correction/cross-correction.component';
import { SharedModule } from 'app/shared/shared.module';
import { CrossCorrectionRoutingModule } from './cross-correction-routing.module';
import { CrossCorrectionTableComponent } from './cross-correction-table/cross-correction-table.component';
import { CrossCorrectionDetailComponent } from './cross-correction-detail/cross-correction-detail.component';
import { AssignCrossCorrectorComponent } from './cross-correction-table/assign-cross-corrector/assign-cross-corrector.component';
import { AssignCrossCorrectorTableComponent } from './cross-correction-table/assign-cross-corrector/assign-cross-corrector-table/assign-cross-corrector-table.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { SchoolCrossCorrectorTableComponent } from './cross-correction-table/assign-cross-corrector/school-cross-corrector-table/school-cross-corrector-table.component';
import { CustomAngular2csvComponent } from 'app/shared/components/angular2csv/angular2csv.component';
import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';

@NgModule({
  declarations: [
    CrossCorrectionComponent,
    CrossCorrectionTableComponent,
    CrossCorrectionDetailComponent,
    AssignCrossCorrectorComponent,
    AssignCrossCorrectorTableComponent,
    SchoolCrossCorrectorTableComponent,
    CustomAngular2csvComponent,
  ],
  imports: [CommonModule, SharedModule, CrossCorrectionRoutingModule, NgSelectModule, SweetAlert2Module.forRoot()],
})
export class CrossCorrectionModule {}
