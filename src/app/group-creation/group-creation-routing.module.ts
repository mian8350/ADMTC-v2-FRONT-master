import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { GroupCreationComponent } from './group-creation.component';
import { CanExitService } from 'app/service/exit-guard/can-exit.service';
import { PermissionGuard } from 'app/service/guard/auth.guard';


const routes: Routes = [
  {
    path: ':titleId/:testId/:taskId',
    component: GroupCreationComponent,
    canDeactivate: [CanExitService],
    canActivate: [PermissionGuard],
    // data: {
    //   permission: {
    //     only: ['ADMTC Admin', 'ADMTC Director', 'Academic Admin' , 'Academic Director']
    //   }
    // }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class GroupCreationRoutingModule { }
