import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QualityControlComponent } from './quality-control/quality-control.component';
import { SharedModule } from 'app/shared/shared.module';
import { QualityControlRoutingModule } from './quality-control-routing.module';



@NgModule({
  declarations: [QualityControlComponent],
  imports: [
    CommonModule,
    SharedModule,
    QualityControlRoutingModule
  ]
})
export class QualityControlModule { }
