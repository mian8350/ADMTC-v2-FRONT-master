import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { JuryGrandOralComponent } from './jury-grand-oral.component';

const routes: Routes = [
  {
    path: '',
    component: JuryGrandOralComponent,
  },
  {
    path: ':juryId/:studentId',
    component: JuryGrandOralComponent,
  },
  {
    path: ':juryId/:studentId/:taskId',
    component: JuryGrandOralComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class GrandOralRoutingModule {}
