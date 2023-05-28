import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { FileUploadService } from 'app/service/file-upload/file-upload.service';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import { TaskService } from 'app/service/task/task.service';
import * as DecoupledEditor from 'assets/ckeditor5-custom/ckeditor.js';
import { cloneDeep } from 'lodash';
import { map, startWith } from 'rxjs/operators';
import { SubSink } from 'subsink';
import Swal from 'sweetalert2';

@Component({
  selector: 'ms-messages-details',
  templateUrl: './messages-details.component.html',
  styleUrls: ['./messages-details.component.scss'],
})
export class MessagesDetailsComponent implements OnInit, OnChanges, OnDestroy {
  _reference: string;
  @Input() refSelected: any;
  @Input() isPublished: boolean;
  @Input() isViewTask;
  @Output() updateTabs = new EventEmitter();
  @Output() onViewMessages = new EventEmitter();
  isImageUploading = false;
  photo: string;
  photo_s3_path: string;
  is_photo_in_s3: boolean;
  imgURL: any;
  private subs = new SubSink();

  triggerConditionForm = new UntypedFormControl('');

  initialData: any;
  isWaitingForResponse: boolean;
  options: any;
  dataMessage: any;

  triggerDropdown = [];
  trigerCondition = [
    { key: 'done', value: 'When the task is Done' },
    { key: 'rejected', value: 'When the task is Rejected' },
    { key: 'approved', value: 'When the task is Approved' },
    { key: 'waiting_for_approval', value: 'When the task is Waiting for approval' },
  ];
  triggerConditionFilter: any;
  taskId: any;
  statusRejection: any;

  @Input() set reference(value) {
    this._reference = value;
  }
  public Editor = DecoupledEditor;
  public config = {
    toolbar: [
      'heading',
      '|',
      'fontSize',
      'fontFamily',
      'fontColor',
      'fontBackgroundColor',
      '|',
      'bold',
      'italic',
      'underline',
      'strikethrough',
      '|',
      'alignment',
      '|',
      'numberedList',
      'bulletedList',
      'todoList',
      '|',
      'indent',
      'outdent',
      '|',
      'link',
      'blockQuote',
      'imageUpload',
      'insertTable',
      'horizontalLine',
      'pageBreak',
      '|',
      'undo',
      'redo',
    ],
    link: {
      addTargetToExternalLinks: true,
    },
  };
  messageForm: UntypedFormGroup;

  constructor(
    private fb: UntypedFormBuilder,
    private translate: TranslateService,
    private rncpTitleService: RNCPTitlesService,
    private fileUploadService: FileUploadService,
    private taskService: TaskService,
    private route: ActivatedRoute,
  ) {}

  get reference() {
    return this._reference;
  }

  ngOnInit() {
    this.taskId = this.route.snapshot.queryParams['taskId'];
    this.getOneTaskBuilder();
    this.getDataMessage();
    this.initForm();
  }

  initForm() {
    this.messageForm = this.fb.group({
      ref_id: [''],
      body: [''],
      label_back: [''],
      label_continue: [''],
      trigger_condition: [null],
      image: [''],
    });
  }

  onReady(editor) {
    editor.ui.getEditableElement().parentElement.insertBefore(editor.ui.view.toolbar.element, editor.ui.getEditableElement());
  }

  getDataMessage() {
    this.isWaitingForResponse = true;
    this.subs.sink = this.rncpTitleService.getOneTaskBuilderNotificationAndMessage(this.refSelected._id).subscribe((resp) => {
      this.isWaitingForResponse = false;
      if (resp) {

        this.dataMessage = this.formatResponse(cloneDeep(resp));
        this.onViewMessages.emit(this.dataMessage);
        if (this.dataMessage && this.dataMessage.image) {
          this.is_photo_in_s3 = true;
          this.photo_s3_path = this.dataMessage.image;
        } else {
          this.is_photo_in_s3 = false;
          this.photo_s3_path = '';
        }
        this.patchNotifForm();
      }
    });
  }

  getOneTaskBuilder(){
    this.subs.sink = this.taskService.getOneTaskBuilder(this.taskId).subscribe(
      (resp) => {
        if (resp) {

          this.statusRejection = resp.is_rejection_active;
          this.getDropDownTrigger();
        }
      });
  }

  formatResponse(obj) {
    // return only the string _id of all object variables with key "_id"
    Object.entries(obj).forEach(([key, value]: any) => {
      if (value && typeof value === 'object' && value.hasOwnProperty('_id')) {
        obj[key] = value._id;
      }
    });
    return obj;
  }

  patchNotifForm() {
    if (this.dataMessage) {
      this.triggerConditionForm.setValue(this.dataMessage.trigger_condition);
      this.messageForm.patchValue(this.dataMessage);
      if (this.messageForm.get('label_back').value === '') {
        this.messageForm.get('label_back').setValue('Go back');
        this.messageForm.get('label_continue').setValue('Go to next step');
      }
      this.initialData = cloneDeep(this.messageForm.getRawValue());
      this.initValueChange();
    }
  }

  initValueChange() {
    this.messageForm.valueChanges.subscribe(() => {
      this.isFormUnchanged();
    });
  }

  saveMessageData() {
    if (this.isPublished) {
      Swal.fire({
        type: 'info',
        title: this.translate.instant('UserForm_S18.TITLE'),
        text: this.translate.instant('UserForm_S18.TEXT'),
        confirmButtonText: this.translate.instant('UserForm_S18.CONFIRM'),
      });
    } else {

      if (this.checkFormValidity()) {
        return;
      } else {
        this.isWaitingForResponse = true;
        const payload = this.formatResponse(this.messageForm.getRawValue());
        // payload.trigger_condition = this.triggerConditionForm.value;
        delete payload.ref_id;

        this.cleanNullValues(payload);

        this.rncpTitleService.updateTaskBuilderNotificationAndMessage(this.refSelected._id, payload).subscribe((resp) => {
          if (resp) {

            this.initialData = cloneDeep(this.messageForm.getRawValue());
            this.isFormUnchanged();
            this.isWaitingForResponse = false;
            Swal.fire({
              type: 'success',
              title: this.translate.instant('Bravo!'),
              confirmButtonText: this.translate.instant('OK'),
              allowEnterKey: false,
              allowEscapeKey: false,
              allowOutsideClick: false,
            }).then((action) => {
              this.updateTabs.emit(true);
            });
          } else {
            this.isWaitingForResponse = false;
          }
        });
      }
    }
  }

  checkFormValidity(): boolean {
    if (this.messageForm.invalid) {
      Swal.fire({
        type: 'warning',
        title: this.translate.instant('Invalid_Form_Warning.TITLE'),
        html: this.translate.instant('Invalid_Form_Warning.TEXT'),
        confirmButtonText: this.translate.instant('Invalid_Form_Warning.BUTTON'),
      });
      this.messageForm.markAllAsTouched();
      return true;
    } else {
      return false;
    }
  }

  cleanNullValues(obj) {
    return Object.keys(obj).forEach((key) => {
      if (obj[key] && typeof obj[key] === 'object') {
        this.cleanNullValues(obj[key]);
      } else if (obj[key] === null) {
        delete obj[key];
      }
    });
  }

  chooseFile(fileInput: Event) {
    const file = (<HTMLInputElement>fileInput.target).files[0];


    this.isImageUploading = true;
    this.photo = '';
    this.photo_s3_path = '';
    this.is_photo_in_s3 = false;
    if (file.type === 'image/png' || file.type === 'image/jpeg') {
      this.subs.sink = this.fileUploadService.singleUpload(file).subscribe(
        (resp) => {
          this.isImageUploading = false;
          if (resp) {
            this.photo = resp.file_name;
            this.photo_s3_path = resp.file_url;
            this.is_photo_in_s3 = true;

            this.messageForm.get('image').setValue(resp.file_url);

          } else {
            Swal.fire({
              type: 'error',
              title: 'Error',
              allowOutsideClick: false,
              confirmButtonText: this.translate.instant('ok'),
            });
          }
        },
        (err) => {

          Swal.fire({
            type: 'error',
            title: 'Error',
            text: err && err['message'] ? err['message'] : err,
            confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
          });
        },
      );
    } else {
      this.isImageUploading = false;
    }
  }

  ngOnChanges() {
    this.getDropDownTrigger();
    this.getDataMessage();
  }

  initFilter() {
      if (this.triggerConditionForm.value) {
        const searchString = this.triggerConditionForm.value.toLowerCase().trim();
        if (this.triggerDropdown) {
          this.triggerConditionFilter = this.triggerDropdown.filter((triger) => {
            return triger.value.toLowerCase().trim().includes(searchString)
          });
        }
      } else {
        this.triggerConditionFilter = this.triggerDropdown;
        this.messageForm.get('trigger_condition').patchValue(null);
      }
  }

  getDropDownTrigger() {
    this.triggerDropdown = [];
    if (!this.statusRejection) {
      this.triggerDropdown.push({ key: 'done', value: this.translate.instant('When the task is Done') });
      this.triggerConditionFilter = this.triggerDropdown;
    } else {
      this.trigerCondition.forEach((item)=> {
        this.triggerDropdown.push({key: item.key, value: this.translate.instant(item.value)});
        this.triggerConditionFilter = this.triggerDropdown;
      });
    }
    this.subs.sink = this.translate.onLangChange.subscribe(() => {
      this.triggerDropdown = [];
      if (!this.statusRejection) {
        this.triggerDropdown.push({ key: 'done', value: this.translate.instant('When the task is Done') })
      } else {
        this.trigerCondition.forEach((item)=> {
          this.triggerDropdown.push({key: item.key, value: this.translate.instant(item.value)});
        });
      }
      this.triggerConditionFilter = this.triggerDropdown;
    })
  }

  displayTrigerCondition(value) {
    if (value) {
      let trigerCondition = null;
      if (this.triggerDropdown && this.triggerDropdown.length) {
        trigerCondition = this.triggerDropdown.find((list) => list.key === value);
        return trigerCondition ? trigerCondition.value : '';
      }
    } else {
      return null;
    }
  }

  deleteImagePreview() {
    if (this.photo && this.photo_s3_path) {
      this.messageForm.get('image').setValue('');
      this.photo = '';
      this.photo_s3_path = '';
      this.is_photo_in_s3 = false;
    }
  }

  selectTrigger(value) {

    const rec = this.trigerCondition.find((val) => val.key === value);

    if (rec) this.messageForm.get('trigger_condition').patchValue(rec.key);
  }

  isFormUnchanged() {
    if (!this.initialData || !this.messageForm) return;
    const initialData = JSON.stringify(this.initialData);
    const currentData = JSON.stringify(this.messageForm.getRawValue());



    if (initialData === currentData) {
      this.taskService.childrenFormValidationStatus = true;
      return true;
    } else {
      this.taskService.childrenFormValidationStatus = false;
      return false;
    }
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
