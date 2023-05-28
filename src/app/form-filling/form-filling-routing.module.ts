import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { FormFillingComponent } from './form-filling.component';

const routes: Routes = [
  {
    path: '',
    component: FormFillingComponent,
  },
  {
    path: ':formId',
    component: FormFillingComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FormFillingRoutingModule {}
