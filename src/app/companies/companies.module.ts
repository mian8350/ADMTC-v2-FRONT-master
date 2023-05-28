import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { MatOptionModule } from '@angular/material/core';
import { CompaniesRoutingModule } from './companies-routing.module';
import { CompanyDetailsComponent } from './company-details/company-details.component';
import { CompanyStaffComponent } from './company-staff/company-staff.component';
import { AskRevisionDialogComponent } from './ask-revision-dialog/ask-revision-dialog.component';
import { CheckCompanyDialogComponent } from './check-company-dialog/check-company-dialog.component';
import { AddCompanyStaffDialogComponent } from './add-company-staff-dialog/add-company-staff-dialog.component';
import { CompanyCreationTabComponent } from './company-creation-tab/company-creation-tab.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { ConnectSchoolDialogComponent } from './connect-school-dialog/connect-school-dialog.component';
import { CompanyComposeEmailDialogComponent } from './company-compose-email-dialog/company-compose-email-dialog.component';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import { ConnectedSchoolComponent } from './connected-school/connected-school.component';
import { ConnectMentorDialogComponent } from './connect-mentor-dialog/connect-mentor-dialog.component';
import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';
import { CompanyParentTabsComponent } from './company-parent-tabs/company-parent-tabs.component';
import { CompanyEntitiesComponent } from './company-entities/company-entities.component';
import { CompanyBranchesComponent } from './company-branches/company-branches.component';
import { CompanyEntityDetailComponent } from './company-entities/company-entity-detail/company-entity-detail.component';
import { CompanyEntitySummaryComponent } from './company-entities/company-entity-detail/company-entity-summary/company-entity-summary.component';
import { CompanyEntityParentTabsComponent } from './company-entities/company-entity-detail/company-entity-parent-tabs/company-entity-parent-tabs.component';
import { EntityIdentityTabComponent } from './company-entities/company-entity-detail/company-entity-parent-tabs/entity-identity-tab/entity-identity-tab.component';
import { EntityHeadOfficeTabComponent } from './company-entities/company-entity-detail/company-entity-parent-tabs/entity-head-office-tab/entity-head-office-tab.component';
import { EntityBranchesTabComponent } from './company-entities/company-entity-detail/company-entity-parent-tabs/entity-branches-tab/entity-branches-tab.component';
import { CompanyBranchDetailComponent } from './company-branches/company-branch-detail/company-branch-detail.component';
import { CompanyBranchSummaryComponent } from './company-branches/company-branch-detail/company-branch-summary/company-branch-summary.component';
import { CompanyBranchParentTabsComponent } from './company-branches/company-branch-detail/company-branch-parent-tabs/company-branch-parent-tabs.component';
import { BranchIdentityTabComponent } from './company-branches/company-branch-detail/company-branch-parent-tabs/branch-identity-tab/branch-identity-tab.component';
import { BranchIdentityFormComponent } from './company-branches/company-branch-detail/company-branch-parent-tabs/branch-identity-tab/branch-identity-form/branch-identity-form.component';
import { BranchCompanyStaffTabComponent } from './company-branches/company-branch-detail/company-branch-parent-tabs/branch-company-staff-tab/branch-company-staff-tab.component';
import { BranchSchoolConnectedTabComponent } from './company-branches/company-branch-detail/company-branch-parent-tabs/branch-school-connected-tab/branch-school-connected-tab.component';
import { BranchIdentityDisplayComponent } from './company-branches/company-branch-detail/company-branch-parent-tabs/branch-identity-tab/branch-identity-display/branch-identity-display.component';
import { CompanyListComponent } from './shared-company-components/company-list/company-list.component';
import { CompanyHeaderBarComponent } from './shared-company-components/company-header-bar/company-header-bar.component';
import { AddCompanyDialogComponent } from './shared-company-components/add-company-dialog/add-company-dialog.component';
import { CompanyNotesTabComponent } from './shared-company-components/company-notes-tab/company-notes-tab.component';
import { AddCompanyNoteDialogComponent } from './shared-company-components/company-notes-tab/add-company-note-dialog/add-company-note-dialog.component';
import { ReplyCompanyNoteDialogComponent } from './shared-company-components/company-notes-tab/reply-company-note-dialog/reply-company-note-dialog.component';

@NgModule({
    declarations: [
        CompanyListComponent,
        CompanyDetailsComponent,
        ConnectMentorDialogComponent,
        ConnectedSchoolComponent,
        CompanyStaffComponent,
        AskRevisionDialogComponent,
        CheckCompanyDialogComponent,
        AddCompanyStaffDialogComponent,
        CompanyCreationTabComponent,
        ConnectSchoolDialogComponent,
        CompanyComposeEmailDialogComponent,
        CompanyParentTabsComponent,
        CompanyEntitiesComponent,
        CompanyBranchesComponent,
        CompanyEntityDetailComponent,
        CompanyEntitySummaryComponent,
        CompanyEntityParentTabsComponent,
        EntityIdentityTabComponent,
        EntityHeadOfficeTabComponent,
        EntityBranchesTabComponent,
        CompanyBranchDetailComponent,
        CompanyBranchSummaryComponent,
        CompanyBranchParentTabsComponent,
        BranchIdentityDisplayComponent,
        BranchIdentityTabComponent,
        BranchIdentityFormComponent,
        BranchCompanyStaffTabComponent,
        BranchSchoolConnectedTabComponent,
        CompanyHeaderBarComponent,
        AddCompanyDialogComponent,
        CompanyNotesTabComponent,
        AddCompanyNoteDialogComponent,
        ReplyCompanyNoteDialogComponent,
    ],
    imports: [
        CommonModule,
        SharedModule,
        MatOptionModule,
        CompaniesRoutingModule,
        NgSelectModule,
        CKEditorModule,
        SweetAlert2Module.forRoot(),
    ],
    exports: [
        CompanyCreationTabComponent
    ]
})
export class CompaniesModule {}
