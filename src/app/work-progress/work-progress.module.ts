import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkProgressComponent } from './work-progress/work-progress.component';
import { SharedModule } from 'app/shared/shared.module';
import { WorkProgressRoutingModule } from './work-progress-routing.module'
@NgModule({
  declarations: [WorkProgressComponent],
  imports: [
    CommonModule,
    SharedModule,
    WorkProgressRoutingModule
  ]
})
export class WorkProgressModule { }
