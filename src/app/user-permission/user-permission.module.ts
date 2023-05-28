import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'app/shared/shared.module';
import { UserPermissionRoutingModule } from './user-permission-routing.module';
import { UserPermissionComponent } from './user-permission.component';


@NgModule({
  declarations: [UserPermissionComponent],
  imports: [
    CommonModule,
    UserPermissionRoutingModule,
    SharedModule
  ]
})
export class UserPermissionModule { }
