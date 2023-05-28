import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UserPermissionComponent } from './user-permission.component';
import { PermissionGuard } from 'app/service/guard/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: UserPermissionComponent,
    canActivate: [PermissionGuard],
  
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UserPermissionRoutingModule { }
