import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DoctestComponent } from './doctest/doctest.component';
import { SharedModule } from 'app/shared/shared.module';
import { DoctestRoutingModule } from './doctest-routing.module';



@NgModule({
  declarations: [DoctestComponent],
  imports: [
    CommonModule,
    SharedModule,
    DoctestRoutingModule
  ]
})
export class DoctestModule { }
