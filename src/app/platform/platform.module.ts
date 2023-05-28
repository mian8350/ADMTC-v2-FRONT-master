import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlatformComponent } from './platform/platform.component';
import { ScholerSeasonComponent } from './scholer-season/scholer-season.component';
import { UserTypeMgmtComponent } from './user-type-mgmt/user-type-mgmt.component';
import { CalendarStepsMgmtComponent } from './calendar-steps-mgmt/calendar-steps-mgmt.component';
import { SharedModule } from 'app/shared/shared.module';
import { PlatformRoutingModule } from './platform-routing.module';
import { AddCalendarStepsDialogComponent } from './add-calendar-steps-dialog/add-calendar-steps-dialog.component';
import { AddScholarSeasonDialogComponent } from './add-scholar-season-dialog/add-scholar-season-dialog.component';
import { AddUserTypeDialogComponent } from './add-user-type-dialog/add-user-type-dialog.component';



@NgModule({
    declarations: [
        PlatformComponent,
        ScholerSeasonComponent,
        UserTypeMgmtComponent,
        CalendarStepsMgmtComponent,
        AddCalendarStepsDialogComponent,
        AddScholarSeasonDialogComponent,
        AddUserTypeDialogComponent
    ],
    imports: [
        CommonModule,
        SharedModule,
        PlatformRoutingModule
    ]
})
export class PlatformModule { }
