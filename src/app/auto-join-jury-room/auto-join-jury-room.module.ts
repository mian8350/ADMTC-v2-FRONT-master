import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AutoJoinJuryRoomRoutingModule } from './auto-join-jury-room-routing.module';
import { SharedModule } from 'app/shared/shared.module';
import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';
import { AutoJoinJuryRoomN6Component } from './auto-join-jury-room-n6/auto-join-jury-room-n6.component';


@NgModule({
  declarations: [AutoJoinJuryRoomN6Component],
  imports: [
    CommonModule,
    AutoJoinJuryRoomRoutingModule,
    SharedModule,
    SweetAlert2Module.forRoot(),
  ]
})
export class AutoJoinJuryRoomModule { }
