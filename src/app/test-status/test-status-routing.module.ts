import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { TestStatusTableComponent } from './test-status-table.component';


const routes: Routes = [
  {
    path: '',
    component: TestStatusTableComponent,
 },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TestStatusRoutingModule { }
