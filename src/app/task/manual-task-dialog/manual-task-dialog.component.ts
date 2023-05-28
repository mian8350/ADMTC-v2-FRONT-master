import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, FormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { ParseUtcToLocalPipe } from 'app/shared/pipes/parse-utc-to-local.pipe';
import { SubSink } from 'subsink';
import * as _ from 'lodash';
import Swal from 'sweetalert2';
import { TaskService } from 'app/service/task/task.service';
import { FileUploadService } from 'app/service/file-upload/file-upload.service';
import { UtilityService } from 'app/service/utility/utility.service';
import { AcademicKitService } from 'app/service/rncpTitles/academickit.service';
import { environment } from 'environments/environment';
import { AuthService } from 'app/service/auth-service/auth.service';

@Component({
  selector: 'ms-manual-task-dialog',
  templateUrl: './manual-task-dialog.component.html',
  styleUrls: ['./manual-task-dialog.component.scss'],
  providers: [ParseUtcToLocalPipe],
})
export class ManualTaskDialogComponent implements OnInit, OnDestroy {
  private subs = new SubSink();
  manualTaskForm: UntypedFormGroup;

  isPendingAchieved = false;
  isWaitingForResponse = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<ManualTaskDialogComponent>,
    private fb: UntypedFormBuilder,
    private parseUTCtoLocal: ParseUtcToLocalPipe,
    private translate: TranslateService,
    private taskService: TaskService,
    private fileUploadService: FileUploadService,
    private utilService: UtilityService,
    private acadKitService: AcademicKitService,
    private authService: AuthService,
  ) {}

  ngOnInit() {
    this.initForm();
    this.populateForm();
  }

  initForm() {
    this.manualTaskForm = this.fb.group({
      pending_slider: [false],
      action_taken: [''],
      rncp: ['', Validators.required],
      created_by: ['', Validators.required],
      document_expecteds: this.fb.array([]),
    });
  }

  initDocumentExpected() {
    return this.fb.group({
      name: [''],
      document_id: ['', [Validators.required]],
    });
  }

  getDocExpectedArray(): UntypedFormArray {
    return this.manualTaskForm.get('document_expecteds') as UntypedFormArray;
  }

  populateForm() {

    const taskData = _.cloneDeep(this.data.taskData);
    if (taskData && taskData.rncp && taskData.rncp._id) {
      taskData.rncp = taskData.rncp._id;
    }
    if (taskData && taskData.created_by && taskData.created_by._id) {
      taskData.created_by = taskData.created_by._id;
    }

    if (taskData && taskData.document_expecteds && taskData.document_expecteds.length) {
      taskData.document_expecteds.forEach((doc) => {
        this.getDocExpectedArray().push(this.initDocumentExpected());
      });
    }

    this.manualTaskForm.patchValue(taskData);


  }

  getTranslatedDate(dateRaw) {
    if (dateRaw && dateRaw.date && dateRaw.time) {
      return this.parseUTCtoLocal.transformDateToStringFormat(dateRaw.date, dateRaw.time);
    } else {
      return '';
    }
  }

  getAssignedUser(userData) {
    if (userData && userData.first_name && userData.last_name) {
      return userData.first_name + ' ' + userData.last_name;
    } else {
      return '';
    }
  }

  chooseFile(fileInput: Event, docIndex) {
    const acceptable = ['pdf','jpeg','jpg','png'];
    const file = (<HTMLInputElement>fileInput.target).files[0];
    const fileType = this.utilService.getFileExtension(file.name).toLocaleLowerCase();
    if (acceptable.includes(fileType)) {
      this.isWaitingForResponse = true;
      this.subs.sink = this.fileUploadService.singleUpload(file).subscribe(
        (resp) => {
          this.isWaitingForResponse = false;
          if (resp) {
            this.createAcadDoc(resp, docIndex);
          }
        },
        (err) => {
          this.isWaitingForResponse = false;
          Swal.fire({
            type: 'error',
            title: 'Error !',
            text: err && err['message'] ? err['message'] : err,
            confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
          }).then((res) => {

          });
        },
      );
    } else {
      Swal.fire({
        type: 'warning',
        title: this.translate.instant('UPLOAD_ERROR.WRONG_TYPE_TITLE'),
        footer: `<span style="margin-left: auto">UPLOAD_ERROR</span>`,
        text: this.translate.instant('UPLOAD_ERROR.WRONG_TYPE_TEXT', { file_exts: '.pdf, .png, .jpeg, .jpg' }),
        allowEscapeKey: false,
        allowOutsideClick: false,
        allowEnterKey: false,
      });
    }
  }

  createAcadDoc(resp, docIndex) {
    const parentClassId =
      this.data.taskData && this.data.taskData.class_id && this.data.taskData.class_id._id ? this.data.taskData.class_id._id : null;
    // call mutation create acad doc
    const payload = {
      document_name: this.getDocExpectedArray().at(docIndex).get('name').value,
      type_of_document: 'documentExpected',
      document_generation_type: 'documentExpected',
      s3_file_name: resp.s3_file_name,
      task_id: this.data.taskData._id,
      parent_rncp_title: this.data.taskData.rncp._id,
      parent_class_id: parentClassId ? [parentClassId] : null,
    };
    this.isWaitingForResponse = true;
    this.subs.sink = this.acadKitService.createAcadDoc(payload).subscribe(
      (response) => {
        this.isWaitingForResponse = false;
        this.getDocExpectedArray().at(docIndex).get('document_id').patchValue(response._id);
      },
      (err) => (this.isWaitingForResponse = false),
    );
  }

  createPayload() {
    const payload = this.manualTaskForm.value;
    // ************** If has document expected, will create acad doc and add into 06 folder, else will only input updatetest
    if (this.getDocExpectedArray() && this.getDocExpectedArray().length) {
      this.isPendingAchieved = true;
      delete payload.pending_slider;
      return payload;
    } else {
      this.isPendingAchieved = payload.pending_slider;
      delete payload.pending_slider;
      return payload;
    }
  }

  submitManualTask() {
    const payload = this.createPayload();

    this.isWaitingForResponse = true;
    this.subs.sink = this.taskService.updateManualTask(this.data.taskData._id, payload).subscribe(
      (resp) => {
        this.isWaitingForResponse = false;

        if (this.isPendingAchieved) {
          if (this.getDocExpectedArray() && this.getDocExpectedArray().length) {
            this.addDocToZeroSix();
          } else {
            this.markTaskAsDone();
          }
        } else {
          if (resp) {
            this.swalSuccess();
          }
        }
      },
      (err) => (this.isWaitingForResponse = false),
    );
  }

  addDocToZeroSix() {
    let userId = '';
    let schoolId = '';
    let titleId =
      this.data && this.data.taskData && this.data.taskData.rncp && this.data.taskData.rncp._id ? this.data.taskData.rncp._id : '';

    if (this.data && this.data.taskData && this.data.taskData.school && this.data.taskData.school._id) {
      schoolId = this.data.taskData.school._id;
    } else {
      userId =
        this.data &&
        this.data.taskData &&
        this.data.taskData.user_selection &&
        this.data.taskData.user_selection.user_id &&
        this.data.taskData.user_selection.user_id._id
          ? this.data.taskData.user_selection.user_id._id
          : '';
    }
    const classId =
      this.data.taskData && this.data.taskData.class_id && this.data.taskData.class_id._id ? this.data.taskData.class_id._id : null;

    const documentData = this.getDocExpectedArray().value;
    const docList = [];
    if (documentData && documentData.length) {
      documentData.forEach((doc) => {
        if (doc && doc.document_id) {
          docList.push(doc.document_id);
        }
      });
    }



    if (schoolId) {
      this.isWaitingForResponse = true;
      this.subs.sink = this.acadKitService.AddDocumentToAcadKitZeroSixManualTask(schoolId, docList, titleId, classId).subscribe(
        (response) => {

          this.isWaitingForResponse = false;
          if (response) {
            this.markTaskAsDone();
          }
        },
        (err) => (this.isWaitingForResponse = false),
      );
    } else if (userId) {
      this.subs.sink = this.authService.getUserById(userId).subscribe((resp) => {

        if (resp && resp.entities && resp.entities.length) {
          const userTitleEntity = resp.entities.find(
            (entity) => entity && entity.assigned_rncp_title && entity.assigned_rncp_title._id === titleId,
          );

          if (userTitleEntity && userTitleEntity.school && userTitleEntity.school._id) {
            const userSchoolId = userTitleEntity.school._id;
            this.isWaitingForResponse = true;
            this.subs.sink = this.acadKitService.AddDocumentToAcadKitZeroSixManualTask(userSchoolId, docList, titleId, classId).subscribe(
              (response) => {
                this.isWaitingForResponse = false;

                if (response) {
                  this.markTaskAsDone();
                }
              },
              (err) => (this.isWaitingForResponse = false),
            );
          }
        } else {
          this.markTaskAsDone();
        }
      });
    } else {
      this.markTaskAsDone();
    }
  }

  markTaskAsDone() {
    this.isWaitingForResponse = true;
    this.subs.sink = this.taskService.doneManualTask(this.data.taskData._id).subscribe(
      (response_task) => {
        this.isWaitingForResponse = false;
        if (response_task) {
          this.swalSuccess();
        }
      },
      (err) => (this.isWaitingForResponse = false),
    );
  }

  swalSuccess() {
    this.isWaitingForResponse = false;
    Swal.fire({
      type: 'success',
      title: 'Bravo',
    }).then((result) => {
      this.closeDialog();
    });
  }

  closeDialog() {
    this.dialogRef.close();
  }

  downloadDoc(docId) {
    if (docId) {
      this.subs.sink = this.acadKitService.getOneDoc(docId).subscribe((resp) => {

        if (resp && resp.s3_file_name) {
          const fileUrl = resp.s3_file_name;
          const a = document.createElement('a');
          a.target = 'blank';
          a.href = `${environment.apiUrl}/fileuploads/${fileUrl}?download=true`.replace('/graphql', '');
          a.click();
          a.remove();
        }
      });
    }
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
