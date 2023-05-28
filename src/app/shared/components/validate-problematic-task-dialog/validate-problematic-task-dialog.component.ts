import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { UtilityService } from 'app/service/utility/utility.service';
import { ParseUtcToLocalPipe } from 'app/shared/pipes/parse-utc-to-local.pipe';
import { SubSink } from 'subsink';

@Component({
  selector: 'ms-validate-problematic-task-dialog',
  templateUrl: './validate-problematic-task-dialog.component.html',
  styleUrls: ['./validate-problematic-task-dialog.component.scss'],
  providers: [ParseUtcToLocalPipe]
})
export class ValidateProblematicTaskDialogComponent implements OnInit, OnDestroy {
  private subs = new SubSink();
  isWaitingForResponse = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<ValidateProblematicTaskDialogComponent>,
    private translate: TranslateService,
    private utilService: UtilityService,
    private router: Router,
    private parseUTCtoLocal: ParseUtcToLocalPipe,
  ) { }

  ngOnInit() {

  }

  closeDialog() {
    this.dialogRef.close();
  }

  goToValidateProblematic(task) {

    if (this.utilService.isCorrectorOfProblematic()) {
      this.router.navigate(['/students-card-problematic', task.school._id], {
        queryParams: { title: task.rncp._id, class: task.class_id._id, open: 'student-cards' },
      });
      this.closeDialog();
    } else {
      this.router.navigate(['/school', task.school._id], {
        queryParams: { title: task.rncp._id, class: task.class_id._id, student: task.student_id._id, open: 'student-cards', selectedTab: 'Company', selectedSubTab: 'Problematic' },
      });
      this.closeDialog();
    }
  }

  translateValidateProblematicDesc(name, task) {
    if (this.translate.currentLang.toLowerCase() === 'en') {
      let taskDetails = name.split(' : ');
      taskDetails[taskDetails.length - 1] = 'Validate Problematics';
      taskDetails = taskDetails.join(' : ');
      return taskDetails;
    } else {
      let taskDetails = name.split(' : ');
      taskDetails[taskDetails.length - 1] = 'Notes de problématique à valider';
      taskDetails = taskDetails.join(' : ');
      return taskDetails;
    }
  }

  translateDate(date) {
    const value = date;
    if (date && typeof date === 'object' && date.time && date.date) {
      return this.parseUTCtoLocal.transformDate(date.date, date.time);
    } else {
      return '';
    }
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

}
