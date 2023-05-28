import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { WorkProgressComponent } from './work-progress/work-progress.component';


export const routes: Routes = [

  {
    path: '',
    component: WorkProgressComponent
  },
  {
    path: '**', redirectTo: '', pathMatch: 'full'
  }
];


@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class WorkProgressRoutingModule { }
