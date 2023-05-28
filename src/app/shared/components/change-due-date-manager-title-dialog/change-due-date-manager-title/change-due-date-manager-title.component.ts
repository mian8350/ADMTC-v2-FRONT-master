import { AuthService } from 'app/service/auth-service/auth.service';
import { ParseLocalToUtcPipe } from './../../../pipes/parse-local-to-utc.pipe';
import { ParseStringDatePipe } from './../../../pipes/parse-string-date.pipe';
import { TranslateService } from '@ngx-translate/core';
import { ParseUtcToLocalPipe } from './../../../pipes/parse-utc-to-local.pipe';
import { cloneDeep } from 'lodash';
import { RNCPTitlesService } from './../../../../service/rncpTitles/rncp-titles.service';
import { Component, Inject, OnInit } from '@angular/core';
import { FormGroup, UntypedFormBuilder, UntypedFormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import * as moment from 'moment';
import Swal from 'sweetalert2';
@Component({
  selector: 'ms-change-due-date-manager-title',
  templateUrl: './change-due-date-manager-title.component.html',
  styleUrls: ['./change-due-date-manager-title.component.scss'],
  providers: [ParseUtcToLocalPipe, ParseStringDatePipe, ParseLocalToUtcPipe]
})
export class ChangeDueDateManagerTitleComponent implements OnInit {
  dueDateForm = new UntypedFormControl('')
  isWaitingForResponse = false
  data
  currentUser

  constructor(
    @Inject(MAT_DIALOG_DATA) public dialogData: any,
    private dialogRef: MatDialogRef<ChangeDueDateManagerTitleComponent>,
    private fb: UntypedFormBuilder,
    private rncpService: RNCPTitlesService,
    private parseUTCToLocalPipe: ParseUtcToLocalPipe,
    private parseStringDatePipe: ParseStringDatePipe,
    private translate: TranslateService,
    private parseLocalToUTCPipe: ParseLocalToUtcPipe,
    private authService:AuthService
  ) { }

  ngOnInit() {

    if (this.dialogData && this.dialogData.taskId) {
      this.getData()
    }
    this.currentUser = this.authService.getCurrentUser()

  }
  getData() {
    this.isWaitingForResponse = true
    this.rncpService.getOneTask(this.dialogData.taskId).subscribe(resp => {
      if (resp) {
        this.data = cloneDeep(resp)
        const temp = cloneDeep(resp)

        let dueDate = null;
        if (temp.due_date && temp.due_date.date && temp.due_date.time) {
          const date = this.parseStringDatePipe.transformStringToDate(this.parseUTCToLocalPipe.transformDate(temp.due_date.date, temp.due_date.time))
          if (date) {
            dueDate = date
          }
        }

        this.dueDateForm.patchValue(dueDate)

        this.isWaitingForResponse = false
      }
    })
  }
  createPayload() {
    const form = this.dueDateForm.value

    const payload = {
      created_by: this.currentUser._id,
      due_date: {
        date: this.parseLocalToUTCPipe.transformDate(moment(form).format('DD/MM/YYYY'), '15:59'),
        time: '15:59'
      }
    }
    return payload
  }
  submit() {
    this.isWaitingForResponse = true
    const payload = this.createPayload()

    if (this.dialogData && this.dialogData.taskId) {
      this.rncpService.updateTask(payload, this.dialogData.taskId).subscribe(resp => {
        if (resp) {
          Swal.fire({
            type: 'success',
            title: 'Bravo !',
            confirmButtonText: this.translate.instant('OK'),
          }).then((result) => {
            this.closeDialog()
          });
        }
        this.isWaitingForResponse = false
      }, err => {

        this.isWaitingForResponse = false
      })
    }
  }

  closeDialog() {
    this.dialogRef.close();
  }

}
