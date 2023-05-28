import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskComponent } from './task/task.component';
import { TaskRoutingModule } from './task-routing.module';
import { SharedModule } from 'app/shared/shared.module';
import { DatePipe } from '@angular/common';
import { AddTaskDialogComponent } from './add-task-dialog/add-task-dialog.component';
import { AddTestTaskDialogComponent } from './add-test-task-dialog/add-test-task-dialog.component';
import { AssignCorrectorDialogComponent } from './assign-corrector-dialog/assign-corrector-dialog.component';
import { ManualTaskDialogComponent } from './manual-task-dialog/manual-task-dialog.component';
import { AddStudentCardTaskDialogComponent } from './add-student-card-task-dialog/add-student-card-task-dialog.component';
import { AssignCorrectorOffPlatformJuryDialogComponent } from './assign-corrector-off-platform-jury-dialog/assign-corrector-off-platform-jury-dialog.component';

@NgModule({
    declarations: [
        TaskComponent,
        AddTaskDialogComponent,
        AddTestTaskDialogComponent,
        AssignCorrectorDialogComponent,
        ManualTaskDialogComponent,
        AddStudentCardTaskDialogComponent,
        AssignCorrectorOffPlatformJuryDialogComponent,
    ],
    imports: [CommonModule, SharedModule, TaskRoutingModule],
    exports: [TaskComponent, AddStudentCardTaskDialogComponent],
    providers: [DatePipe]
})
export class TaskModule {}
