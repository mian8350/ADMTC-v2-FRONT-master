import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ProcessManagementTableComponent } from './process-management-table.component';


const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: ProcessManagementTableComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProcessManagementRoutingModule { }
