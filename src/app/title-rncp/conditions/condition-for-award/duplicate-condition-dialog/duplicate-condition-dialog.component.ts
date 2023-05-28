import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { RNCPTitlesService } from '../../../../service/rncpTitles/rncp-titles.service';
import { Subscription } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ConditionsService } from '../../../../service/conditions/conditions.service';
import Swal from 'sweetalert2';
import { TranslateService } from '@ngx-translate/core';
import { SubSink } from 'subsink';

@Component({
  selector: 'ms-duplicate-condition-dialog',
  templateUrl: './duplicate-condition-dialog.component.html',
  styleUrls: ['./duplicate-condition-dialog.component.scss'],
})
export class DuplicateConditionDialogComponent implements OnInit, OnDestroy {
  private subs = new SubSink();
  rncpData = [];
  classData = [];
  showTitleDropdown = false;
  duplicateForm: UntypedFormGroup;
  selectedClass;
  private intVal: any;
  private timeOutVal: any;
  isWaitingForResponse = false;

  constructor(
    private rncpTitlesService: RNCPTitlesService,
    public dialogRef: MatDialogRef<DuplicateConditionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: UntypedFormBuilder,
    private conditionService: ConditionsService,
    private translateService: TranslateService,
  ) {}

  ngOnInit() {
    this.isWaitingForResponse = true;
    this.subs.sink = this.rncpTitlesService.getRncpTitleListData(true).subscribe((resp) => {
      this.isWaitingForResponse = false;
      if (resp) {
        this.rncpData = resp;
      }
    });
    this.duplicateForm = this.fb.group({
      rncp_title_destination: [
        this.data && this.data.rncp_title_destination ? this.data.rncp_title_destination : '',
        [Validators.required],
      ],
      class_id_destination: [this.data && this.data.rncp_title_destination ? this.data.class_id_destination : '', [Validators.required]],
      rncp_title_id: ['', [Validators.required]],
      class_id: ['', [Validators.required]],
    });
  }

  onTitleSelected(rncpId: string) {
    this.subs.sink = this.rncpTitlesService.getClassByRncpTitle(rncpId).subscribe((resp) => {
      if (resp) {
        this.classData = resp;
      }
    });
  }

  showTitleList() {
    this.showTitleDropdown = true;
  }

  setClassSelected(value) {
    this.selectedClass = value;
  }

  /* Duplicate parameter submit*/
  onDuplicateParameter() {
    let timeDisabledinSec = 6;
    Swal.fire({
      title: this.translateService.instant('PARAMETERS-RNCP.CONDITION_TAB_S2.TITLE', {
        className: this.selectedClass ? this.selectedClass.name : '',
      }),
      type: 'warning',
      text: this.translateService.instant('PARAMETERS-RNCP.CONDITION_TAB_S2.TEXT'),
      showCancelButton: true,
      cancelButtonText: this.translateService.instant('PARAMETERS-RNCP.CONDITION_TAB_S2.CANCEL'),
      confirmButtonText: this.translateService.instant('PARAMETERS-RNCP.CONDITION_TAB_S2.SUCCESS_BUTTON'),
      allowEscapeKey: false,
      allowOutsideClick: false,
      onOpen: () => {
        Swal.disableConfirmButton();
        const confirmButtonRef = Swal.getConfirmButton();

        // TimerLoop for derementing timeDisabledinSec
        this.intVal = setInterval(() => {
          timeDisabledinSec -= 1;
          confirmButtonRef.innerText = this.translateService.instant('PARAMETERS-RNCP.CONDITION_TAB_S2.SUCCESS_BUTTON_IN', {
            timer: timeDisabledinSec,
          });
        }, 1000);

        // Resetting timerLoop to stop after required time of execution
        this.timeOutVal = setTimeout(() => {
          confirmButtonRef.innerText = this.translateService.instant('PARAMETERS-RNCP.CONDITION_TAB_S2.SUCCESS_BUTTON');
          Swal.enableConfirmButton();
          clearInterval(this.intVal);
          // clearTimeout(timerLoop);
        }, 6 * 1000);
        // clearTimeout(this.timeOutVal);
      },
    }).then((resp) => {
      if (resp.value) {
        const { rncp_title_destination, class_id_destination, rncp_title_id, class_id } = this.duplicateForm.value;
        this.isWaitingForResponse = true;
        this.subs.sink = this.conditionService
        .duplicateParametersTitle({ rncp_title_destination, class_id_destination, rncp_title_id, class_id })
        .subscribe((resp) => {
          this.isWaitingForResponse = false;
            if (resp) {
              Swal.fire({
                title: 'Bravo',
                type: 'success',
                text: `Conditions of class ${this.selectedClass.name} blocks of expertise, subjects and tests have been duplicated`,
                allowOutsideClick: false,
                confirmButtonText : 'OK'
              });
              this.dialogRef.close({
                conditionData: resp,
              });
            }
          });
      }
    });
  }

  /* Setup basic one*/
  onSetupBasicOne() {
    this.dialogRef.close({});
  }

  ngOnDestroy(): void {
    clearTimeout(this.timeOutVal);
    clearInterval(this.intVal);
    this.subs.unsubscribe();
  }
}
