import { UserService } from './../../service/user/user.service';
import { Component, OnInit, Inject, OnDestroy, ViewEncapsulation } from '@angular/core';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { DateAdapter } from '@angular/material/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntypedFormBuilder, UntypedFormGroup, Validators, FormControl, FormArray } from '@angular/forms';
import swal from 'sweetalert2';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { StudentsService } from 'app/service/students/students.service';
import * as moment from 'moment';
import Swal from 'sweetalert2';
import { SubSink } from 'subsink';
import * as _ from 'lodash';
import { UtilityService } from 'app/service/utility/utility.service';
import {TaskService} from 'app/service/task/task.service'

@Component({
  selector: 'ms-user-deactivation-dialog',
  templateUrl: './user-deactivation-dialog.component.html',
  styleUrls: ['./user-deactivation-dialog.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class UserDeactivationDialogComponent implements OnInit {

  public userDeleteForm: UntypedFormGroup;
  private subs = new SubSink();
  private timeOutVal: any;
  isWaitingForResponse = false;

  testList = [];
  blockList = [];

  selectedTests = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: UntypedFormBuilder,
    public dialogRef: MatDialogRef<UserDeactivationDialogComponent>,
    private translate: TranslateService,
    private studentService: StudentsService,
    private dateAdapter: DateAdapter<Date>,
    public utilService: UtilityService,
    private userService: UserService,
    private taskService: TaskService,
  ) { }

  ngOnInit() {

    this.dateAdapter.setLocale(this.translate.currentLang);
    this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      this.dateAdapter.setLocale(this.translate.currentLang);
    });

    this.initform();
    // this.data.element.entities.forEach(element => {

    //   this.taskService.getOneTask(element.assigned_rncp_title._id).subscribe(resp=>{

    //     if(resp.task_status!== 'done'){

    //     }
    //   })
    // });
  }

  initform() {
    this.userDeleteForm = this.fb.group({
      user_id: [this.data.element._id],
      reason_for_resignation: [null, Validators.required],
      date_of_resignation: [this.getTodayDate(), Validators.required],
    });
    // this.userDeleteForm.markAsUntouched()
    // this.userDeleteForm.markAsPristine();
  }

  deleteStudent() {
    const userId = this.userDeleteForm.get('user_id').value;
    const reason = this.userDeleteForm.get('reason_for_resignation').value;
    const date = this.userDeleteForm.get('date_of_resignation').value;
    // const testList = this.selectedTests;
    // const date = moment(this.studentDeleteForm.get('date_of_resignation').value).format('DD/MM/YYYY');
    if (this.userDeleteForm.valid) {
      this.isWaitingForResponse = true;
      this.subs.sink = this.userService.deactivateUser(userId, reason, date).subscribe(
        (resp) => {
          this.isWaitingForResponse = false;
          if (resp) {
            swal
              .fire({
                title: this.translate.instant('Deactivate_S2.TITLE'),
                html: this.translate.instant('Deactivate_S2.TEXT', {
                  civility: this.translate.instant(this.data.element.civility),
                  LName: this.data.element.first_name,
                  FName: this.data.element.last_name,
                }),
                footer: `<span style="margin-left: auto">Deactivate_S2</span>`,
                allowEscapeKey: true,
                type: 'success',
                confirmButtonText: this.translate.instant('Deactivate_S2.OK'),
              })
              .then((result) => {
                if (result.value) {
                  this.dialogRef.close(true);
                }
              });
          }
        },
        (err) => {

          if (err['message'].includes('the mentor is already used in student contract')) {
            Swal.fire({
              allowOutsideClick: false,
              confirmButtonText: this.translate.instant('Deactivate_S4.BUTTON'),
              type: 'error',
              title: this.translate.instant('Deactivate_S4.TITLE'),
              html: this.translate.instant('Deactivate_S4.TEXT'),
              footer: `<span style="margin-left: auto">Deactivate_S4</span>`
            }).then((res) => {
                this.dialogRef.close(true);
            });
          }else if (err['message'].includes('user should transfer the responsibility first')) {
            Swal.fire({
              allowOutsideClick: false,
              confirmButtonText: this.translate.instant('Deactivate_S3.BUTTON'),
              type: 'error',
              title: this.translate.instant('Deactivate_S3.TITLE'),
              html: this.translate.instant('Deactivate_S3.TEXT'),
              footer: `<span style="margin-left: auto">Deactivate_S3</span>`,
            }).then((res) => {
                this.dialogRef.close(true);
            });
          }else if (err['message'].includes('user still have todo tasks')) {
            Swal.fire({
              allowOutsideClick: false,
              confirmButtonText: this.translate.instant('USERMODIFY_S2.BUTTON'),
              type: 'warning',
              title: this.translate.instant('USERMODIFY_S2.TITLE'),
              html: this.translate.instant('USERMODIFY_S2.TEXT',{
                userType: this.translate.instant(this.data.element.entities[0].type.name),
                title: this.data.element.entities[0].assigned_rncp_title.short_name
              }),
              footer: `<span style="margin-left: auto">USERMODIFY_S2</span>`
            }).then((res) => {
                this.dialogRef.close(true);
            });
          }
          else{
          Swal.fire({
            type: 'error',
            title: 'Error !',
            text: err && err['message'] ? err['message'] : err,
            confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
          })
          .then((res) => {


            if (res.value) {
              // this.isWaitingForResponse = false;
              this.dialogRef.close(true);
            }
          });
          }
        },
      )
    } else {
      swal
        .fire({
          title: this.translate.instant('FormSave_S1.TITLE'),
          html: this.translate.instant('FormSave_S1.TEXT'),
          type: 'warning',
          confirmButtonText: this.translate.instant('FormSave_S1.BUTTON_1'),
          footer: `<span style="margin-left: auto">FormSave_S1</span>`,
        })
        .then((result) => {
          this.userDeleteForm.markAsDirty()
        });
    }
  }

  closeDialog() {
    this.dialogRef.close(false);
  }

  getTodayDate() {
    return moment().format('DD/MM/YYYY');
  }

  ngOnDestroy() {
    clearTimeout(this.timeOutVal);
    this.subs.unsubscribe();
  }


}
