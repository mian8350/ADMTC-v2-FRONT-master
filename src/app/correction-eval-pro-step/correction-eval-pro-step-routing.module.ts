import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PermissionGuard } from 'app/service/guard/auth.guard';
import { CorrectionEvalProComponent } from './correction-eval-pro-step.component';


export const routes: Routes = [
  {
    path: '',
    component: CorrectionEvalProComponent,
  },
  {
    path: '**', redirectTo: '', pathMatch: 'full'
  }
];


@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class CorrectionEvalProRoutingModule { }
