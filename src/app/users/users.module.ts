import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'app/shared/shared.module';
import { UsersRoutingModule } from './users-routing.module';
import { UsersDialogComponent } from './users-dialog/users-dialog.component';
import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';
import { NgSelectModule } from '@ng-select/ng-select';
import { UserEmailDialogComponent } from './user-email-dialog/user-email-dialog.component';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import { UsersParentTabsComponent } from './users-parent-tabs/users-parent-tabs.component';
import { UsersComponent } from './users-parent-tabs/users/users.component';
import { DeactivatedUsersComponent } from './users-parent-tabs/deactivated-users/deactivated-users.component';
import { DeactivationReasonDialogComponent } from './deactivation-reason-dialog/deactivation-reason-dialog.component';
import { UserDeactivationDialogComponent } from './user-deactivation-dialog/user-deactivation-dialog.component';
import { UserManagementDetailComponent } from './user-management-detail/user-management-detail.component';
import { UserDetailsComponent } from './user-management-detail/user-details/user-details.component';
import { UserDetailsParentTabsComponent } from './user-management-detail/user-details/user-details-parent-tabs/user-details-parent-tabs.component';
import { UserDetailsUsertypeTabComponent } from './user-management-detail/user-details/user-details-parent-tabs/user-details-usertype-tab/user-details-usertype-tab.component';
import { UserDetailsIdentityTabComponent } from './user-management-detail/user-details/user-details-parent-tabs/user-details-identity-tab/user-details-identity-tab.component';
import { UserCardsComponent } from './user-management-detail/user-cards/user-cards.component';
import { ModifyUserTypeDialogComponent } from './user-management-detail/user-details/user-details-parent-tabs/user-details-usertype-tab/modify-user-type-dialog/modify-user-type-dialog.component';
import { MailboxModule } from 'app/mailbox/mailbox.module';
@NgModule({
    declarations: [
        UsersComponent,
        UsersDialogComponent,
        UserEmailDialogComponent,
        UsersParentTabsComponent,
        DeactivatedUsersComponent,
        DeactivationReasonDialogComponent,
        UserDeactivationDialogComponent,
        UserManagementDetailComponent,
        UserDetailsComponent,
        UserDetailsParentTabsComponent,
        UserDetailsUsertypeTabComponent,
        UserDetailsIdentityTabComponent,
        UserCardsComponent,
        ModifyUserTypeDialogComponent,
    ],
    imports: [CommonModule, SharedModule, UsersRoutingModule, SweetAlert2Module.forRoot(), NgSelectModule, CKEditorModule, MailboxModule],
    exports: [UsersDialogComponent]
})
export class UsersModule {}
