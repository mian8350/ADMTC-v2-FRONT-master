import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { TestCorrectionComponent } from './test-correction.component';
import { CanExitService } from 'app/service/exit-guard/can-exit.service';


const routes: Routes = [
  {
    path: ':titleId/:testId',
    component: TestCorrectionComponent,
    canDeactivate: [CanExitService],
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TestCorrectionRoutingModule { }
