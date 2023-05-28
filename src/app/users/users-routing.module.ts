import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PermissionGuard } from 'app/service/guard/auth.guard';
import { UserManagementDetailComponent } from './user-management-detail/user-management-detail.component';
import { UsersParentTabsComponent } from './users-parent-tabs/users-parent-tabs.component';
import { UsersComponent } from './users-parent-tabs/users/users.component';

export const routes: Routes = [
  {
    path: '',
    component: UsersParentTabsComponent,
    canActivate: [PermissionGuard],
    data: {
      permission: 'users.show_perm'
    },
  },
  {
    path: 'user-management-detail',
    component: UserManagementDetailComponent,
    canActivate: [PermissionGuard],
    data: {
      permission: 'users.show_perm'
    },
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
export class UsersRoutingModule {}
