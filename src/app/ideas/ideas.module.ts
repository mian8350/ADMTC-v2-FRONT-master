import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { IdeasComponent } from './ideas/ideas.component';
import { SharedModule } from 'app/shared/shared.module';
import { IdeasRoutingModule } from './ideas-routing.module';

@NgModule({
  declarations: [IdeasComponent],
  imports: [
    CommonModule,
    SharedModule,
    IdeasRoutingModule
  ],
  providers: [DatePipe]
})
export class IdeasModule { }
