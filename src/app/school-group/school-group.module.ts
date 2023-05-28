import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SchoolGroupRoutingModule } from './school-group-routing.module';
import { SchoolGroupComponent } from './school-group/school-group.component';
import { SharedModule } from 'app/shared/shared.module';


@NgModule({
  declarations: [SchoolGroupComponent],
  imports: [
    CommonModule,
    SchoolGroupRoutingModule,
    SharedModule,
  ]
})
export class SchoolGroupModule { }
