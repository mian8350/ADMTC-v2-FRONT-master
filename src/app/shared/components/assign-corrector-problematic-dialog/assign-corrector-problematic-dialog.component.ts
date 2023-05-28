import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { TaskService } from 'app/service/task/task.service';
import { ParseUtcToLocalPipe } from 'app/shared/pipes/parse-utc-to-local.pipe';
import { SubSink } from 'subsink';
import * as _ from 'lodash';
import Swal from 'sweetalert2';
import { ProblematicService } from 'app/service/problematic/problematic.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'ms-assign-corrector-problematic-dialog',
  templateUrl: './assign-corrector-problematic-dialog.component.html',
  styleUrls: ['./assign-corrector-problematic-dialog.component.scss'],
  providers: [ParseUtcToLocalPipe],
})
export class AssignCorrectorProblematicDialogComponent implements OnInit, OnDestroy {
  private subs = new SubSink();
  assignCorrrectorForm: UntypedFormGroup;

  isWaitingForUserList = true;
  userCorrectorList;
  schoolData;
  correctorSelected;
  taskData;
  taskDataTitle;
  isWaitingForResponse = false;
  private timeOutVal: any;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<AssignCorrectorProblematicDialogComponent>,
    private fb: UntypedFormBuilder,
    private taskService: TaskService,
    private parseUTCtoLocal: ParseUtcToLocalPipe,
    private translate: TranslateService,
    private problematicService: ProblematicService,
  ) {}

  ngOnInit() {

    if (this.data && this.data.task) {
      this.taskData = _.cloneDeep(this.data.task);
    }

    this.initForm();
    this.getFormData();
  }

  initForm() {
    this.assignCorrrectorForm = this.fb.group({
      corrector_problematic: ['', Validators.required],
      rncp_title: [this.taskData && this.taskData.rncp && this.taskData.rncp._id ? this.taskData.rncp._id : '', [Validators.required]],
      class_id: [
        this.taskData && this.taskData.class_id && this.taskData.class_id._id ? this.taskData.class_id._id : '',
        [Validators.required],
      ],
      task_id: [this.taskData && this.taskData._id ? this.taskData._id : '', [Validators.required]],
      lang: [this.translate.currentLang, [Validators.required]],
    });
  }

  getFormData() {
    // ************* Usertype id of certifier admin and corrector of problematic
    const userTypeId = ['5a2e1ecd53b95d22c82f9550', '5a2e1ecd53b95d22c82f9551'];

    const forkParam = [];
    forkParam.push(this.problematicService.getAllSchoolsProblematic([this.taskData.rncp._id], this.taskData.class_id._id));
    forkParam.push(this.problematicService.getProblematicCorrectorDropdown([this.taskData.rncp._id], userTypeId));
    forkParam.push(this.problematicService.getOneDetailedTask(this.taskData._id));

    this.subs.sink = forkJoin(forkParam).subscribe((resp) => {

      this.isWaitingForUserList = false;
      if (resp && resp.length) {
        let count = 0;
        if (resp[count]) {
          this.schoolData = resp[count];
          count++;
        }
        if (resp[count]) {
          this.userCorrectorList = resp[count];
          count++;
        }

        if (resp[count]) {
          this.taskDataTitle = resp[count];
          count++;
        }
      }
    });
  }

  getTranslatedDate(dateRaw) {
    if (dateRaw && dateRaw.date && dateRaw.time) {
      return this.parseUTCtoLocal.transformDateToStringFormat(dateRaw.date, dateRaw.time);
    } else {
      return '';
    }
  }

  isCorrectorMoreThanSchool() {
    const correctorList = this.assignCorrrectorForm.get('corrector_problematic').value;
    const schoolCount = this.schoolData && this.schoolData.length ? this.schoolData.length : 0;
    const correctorCount = correctorList && correctorList.length ? correctorList.length : 0;
    let result = false;
    if (correctorCount > schoolCount) {
      result = true;
    }
    return result;
  }


  submitAssignCorrector() {
    const payload = this.assignCorrrectorForm.value;
    let long_title = [];
    let titleName;
    payload.corrector_problematic.forEach(element => {
      titleName = this.userCorrectorList.filter(user => {
        return user._id === element;
      });
      long_title = long_title.concat(titleName);
    });
    let name = '';
    if (long_title && long_title.length) {
      let count = 0;
      long_title.forEach((element) => {
        if (element) {
          count++;
          if (count > 1) {
            name = name + ', ';
            name = name + this.translate.instant(element.civility) + ' ' + element.first_name + ' ' + element.last_name;
          } else {
            name = name + this.translate.instant(element.civility) + ' ' + element.first_name + ' ' + element.last_name;
          }
        }
      });
    }
    let timeDisabled = 5;
    Swal.fire({
      title: this.translate.instant('PROB_S14.TITLE'),
      html: this.translate.instant('PROB_S14.TEXT', { problematic: name }),
      type: 'warning',
      allowEscapeKey: true,
      showCancelButton: true,
      allowOutsideClick: false,
      confirmButtonText: this.translate.instant('PROB_S14.BUTTON_1', { timer: timeDisabled }),
      cancelButtonText: this.translate.instant('PROB_S14.BUTTON_2'),
      onOpen: () => {
        Swal.disableConfirmButton();
        const confirmBtnRef = Swal.getConfirmButton();
        const intVal = setInterval(() => {
          timeDisabled -= 1;
          confirmBtnRef.innerText = this.translate.instant('PROB_S14.BUTTON_1') + ' in ' + timeDisabled + ' sec';
        }, 1000);
        this.timeOutVal = setTimeout(() => {
          confirmBtnRef.innerText = this.translate.instant('PROB_S14.BUTTON_1');
          Swal.enableConfirmButton();
          clearInterval(intVal);
          clearTimeout(this.timeOutVal);
        }, timeDisabled * 1000);
      },
    }).then((res) => {
      if (res.value) {
        this.subs.sink = this.problematicService.assignCorrectorProblematic(payload).subscribe((resp) => {
          if (resp) {
            Swal.fire({
              title: 'Bravo!',
              type: 'success',
            });
            this.dialogRef.close('reset');
          }
        });
      }
    });
  }

  closeDialog() {
    this.dialogRef.close();
  }

  ngOnDestroy() {
    clearTimeout(this.timeOutVal);
    this.subs.unsubscribe();
  }
}
