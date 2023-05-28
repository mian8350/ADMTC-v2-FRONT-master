import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AutoJoinJuryRoomN6Component } from './auto-join-jury-room-n6/auto-join-jury-room-n6.component';


const routes: Routes = [
  {
    path: '',
    component: AutoJoinJuryRoomN6Component,
  },
  {
    path: '**', redirectTo: '', pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AutoJoinJuryRoomRoutingModule { }
