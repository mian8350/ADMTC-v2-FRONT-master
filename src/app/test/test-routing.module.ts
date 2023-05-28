import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { FirstStepComponent } from './steps/first-step/first-step.component';
import { TestCreationComponent } from './test-creation/test-creation.component';
import { ThirdStepComponent } from './steps/third-step/third-step.component';
import { SecondStepComponent } from './steps/second-step/second-step.component';
import { FourthStepComponent } from './steps/fourth-step/fourth-step.component';
import { FifthStepComponent } from './steps/fifth-step/fifth-step.component';
import { CanExitService } from 'app/service/exit-guard/can-exit.service';

export const routes: Routes = [
  {
    path: ':titleId',
    component: TestCreationComponent,
    canDeactivate: [CanExitService],
    children: [
      {
        path: 'first', component: FirstStepComponent
      },
      {
        path: 'second', component: SecondStepComponent
      },
      {
        path: 'third', component: ThirdStepComponent
      },
      {
        path: 'fourth', component: FourthStepComponent
      },
      {
        path: 'fifth', component: FifthStepComponent
      }

    ]
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full',
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TestRoutingModule {}
