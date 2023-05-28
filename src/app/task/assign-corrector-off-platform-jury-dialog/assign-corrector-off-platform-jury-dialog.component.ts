import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSelect, MatSelectChange } from '@angular/material/select';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from 'app/service/auth-service/auth.service';
import { TaskService } from 'app/service/task/task.service';
import { ParseUtcToLocalPipe } from 'app/shared/pipes/parse-utc-to-local.pipe';
import { SubSink } from 'subsink';
import swal from 'sweetalert2';
import * as _ from 'lodash';
import { JuryOrganizationService } from 'app/service/jury-organization/jury-organization.service';
import { MatOption } from '@angular/material/core';

@Component({
  selector: 'ms-assign-corrector-off-platform-jury-dialog',
  templateUrl: './assign-corrector-off-platform-jury-dialog.component.html',
  styleUrls: ['./assign-corrector-off-platform-jury-dialog.component.scss'],
  providers: [ParseUtcToLocalPipe],
})
export class AssignCorrectorOffPlatformJuryDialogComponent implements OnInit {
  @ViewChild('corrector') corrector: MatSelect;
  private subs = new SubSink();
  assignCorrrectorForm: UntypedFormGroup;

  testData;
  currentUser: any;
  studentCount;
  noUsers = false;
  backupTestData;
  specializationId: string;
  blockConditionId: string;

  userTypes = [];
  userCorrectorList = [];

  correctorAssigned = [];

  isGroupTest = false;
  isRetakeTest = false;

  isWaitingForResponse = false;
  isWaitingForUserList = true;
  dataDialog: any;
  taskData: any;
  dataStudent: any;
  grand_oral_name: any;
  initialForm: any;
  formChanged = false;
  allSelected = false;
  juryProcessName: any;

  constructor(
    public dialogRef: MatDialogRef<AssignCorrectorOffPlatformJuryDialogComponent>,
    private fb: UntypedFormBuilder,
    private taskService: TaskService,
    private parseUTCtoLocal: ParseUtcToLocalPipe,
    private translate: TranslateService,
    private juryOrganizationService: JuryOrganizationService,
    private autService: AuthService,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {}

  ngOnInit() {
    this.currentUser = this.autService.getLocalStorageUser();
    this.initForm();
    this.getUserTypesId();
    this.getDataDialog();
    if (this.data && this.data.task && this.data.task._id) {

      this.getTaskData(this.data.task._id);
    }
    if (this.data && this.data.edit) {
      // this.editData();
    } 

  }

  initForm() {
    this.assignCorrrectorForm = this.fb.group({
      jury_id: [this.data.task.jury_id._id , Validators.required],
      correctors_id: ['', Validators.required],
    });
  }

  patchFormValue(){
    this.initialForm = _.cloneDeep(this.assignCorrrectorForm.value);
    this.subs.sink = this.assignCorrrectorForm.valueChanges.subscribe(()=> {
      this.isFormChanged();
    })
  }

  isFormChanged(){
    const firstForm = JSON.stringify(this.initialForm);

    
    const secondForm = JSON.stringify(this.assignCorrrectorForm.value);

    if (firstForm === secondForm) {
      this.formChanged = false;
    } else {
      this.formChanged = true;
    }
  }

  editData() {
    this.assignCorrrectorForm.get('update_corrector').patchValue(true);
  }

  getUserTypesId() {
    this.userTypes = this.taskService.getUserTypesCorrectorsID();
  }

  getDataDialog(){
  const juryId = this.data.task.jury_id._id;
    this.subs.sink = this.juryOrganizationService.getAllJuryOrganizationScheduleOffPlatform(juryId).subscribe((resp) => {
      this.isWaitingForResponse = false;
      if (resp) {
        // set jury and backup jury data
        this.dataDialog = resp;
        this.studentCount = this.dataDialog.length;
      }
    })
  }

  getTaskData(taskId) {
    this.isWaitingForResponse = true;
    this.subs.sink = this.taskService.getOneTaskOffPlatform(taskId).subscribe((resp) => {
      this.isWaitingForResponse = false;
      if (resp) {
        // set test and backup test data
        this.taskData = resp;
        this.juryProcessName = resp?.class_id?.jury_process_name;
        this.grand_oral_name = resp.jury_id.name;
        this.isWaitingForResponse = false;

        this.getCorrectorUsers(this.data.titleId);
        
      }
    });
  }


  getCorrectorUsers(titleId) {
    const jury_assign_corrector = '62298c90604bb15fd819bd73';

    this.isWaitingForUserList = true;
    this.subs.sink = this.taskService.getCorrectorCertifierUsers(titleId, jury_assign_corrector).subscribe((resp) => {
      this.isWaitingForUserList = false;
      if(resp.length){
        this.userCorrectorList = resp.sort((a, b) => a.first_name.localeCompare(b.first_name));;
        this.setUserCorrectorList(resp);
        
        this.patchFormValue();
      }

    });
  }

  setUserCorrectorList(correctors) {
    if (correctors) {

      if (this.data && this.data.edit && this.taskData.jury_id.jury_correctors && this.taskData.jury_id.jury_correctors.length) {
        const tempCorrector = [];
        this.taskData.jury_id.jury_correctors.forEach((corrector) => {
          if (corrector._id) {
            tempCorrector.push(corrector._id);
          }
        });
        this.assignCorrrectorForm.get('correctors_id').patchValue(tempCorrector);
        this.correctorAssigned = _.cloneDeep(tempCorrector);

      }
    } else {
      this.userCorrectorList = [];
    }
  }

  selectCorrectors(data: MatSelectChange) {
    this.correctorAssigned = data.value;;

  }
  toggleAllSelection() {
    if (this.allSelected) {
      this.corrector.options.forEach((item: MatOption) => item.select());
    } else {
      this.corrector.options.forEach((item: MatOption) => item.deselect());
    }
  }
  optionClick() {
    let newStatus = true;
    this.corrector.options.forEach((item: MatOption) => {
      if (!item.selected) {
        newStatus = false;
      }
    });
    this.allSelected = newStatus;
  }

  getDisplayCorrectorSelected(correctorId) {
    const correctorSelected = this.userCorrectorList.find((user) => user._id === correctorId);
    if (correctorSelected) {
      return `${this.translate.instant(correctorSelected.civility)} ${correctorSelected.first_name} ${correctorSelected.last_name}`;
    } else {
      return '';
    }
  }

  getTranslatedDate(dateRaw) {
    if (dateRaw && dateRaw.date_utc && dateRaw.time_utc) {
      return this.parseUTCtoLocal.transformDateToStringFormat(dateRaw.date_utc, dateRaw.time_utc);
    } else {
      return '';
    }
  }

  getTranslatedTextOneCorrector() {
    const user = this.assignCorrrectorForm.get('correctors_id').value;
    const userId = user[0];
    const userData = _.find(this.userCorrectorList, (corrector) => corrector._id === userId);

    const translatedCivility = userData && userData.civility ? this.translate.instant(userData.civility) : '';
    let assignedText = '';
    if (this.currentUser._id === userId) {
      assignedText = this.translate.instant(`ASSIGN_CORRECTOR_DIALOG.ASSIGN_MYSELF`);
    } else if (userData) {
      let paramsText = {
        civility: translatedCivility,
        firstname: userData.first_name,
        lastname: userData.last_name,
        grand_oral_name: this.taskData.jury_id.name
      }
      assignedText = this.juryProcessName ? this.translate.instant(`Grand_Oral_Improvement.SCHOOL_1_CORRECTOR_JURY`, {...paramsText, processName: this.juryProcessName}) 
      : this.translate.instant(`ASSIGN_CORRECTOR_DIALOG.SCHOOL_1_CORRECTOR_JURY`, paramsText);
    }
    return assignedText;
  }

  saveAssignedCorrector() {
    const result = this.assignCorrrectorForm.value;
    this.isWaitingForResponse = true;
    this.subs.sink = this.taskService
      .assignJuryCorrector(result.jury_id, result.correctors_id)
      .subscribe((resp) => {
        this.isWaitingForResponse = false;
        if (resp) {

          swal
            .fire({
              type: 'success',
              title: 'Bravo !',
              allowOutsideClick: false,
            })
            .then(() => {
              this.dialogRef.close('reset');
            });
        }
      }, (err) => this.swalError(err));
  }

  swalError(err) {
    this.isWaitingForResponse = false;
    swal.fire({
      type: 'error',
      title: 'Error',
      text: err && err['message'] ? err['message'] : err,
      confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
    });
  }

  closeDialog() {
    this.dialogRef.close();
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
