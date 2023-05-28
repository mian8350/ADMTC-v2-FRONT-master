import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import { SubSink } from 'subsink';
import * as _ from 'lodash';
import { debounceTime } from 'rxjs/operators';
import { TaskService } from 'app/service/task/task.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  templateUrl: './task-manager-setup-dialog.component.html',
  styleUrls: ['./task-manager-setup-dialog.component.scss'],
})
export class TaskManagerSetupDialogComponent implements OnInit, OnDestroy {
  taskManager: UntypedFormGroup;
  isWaitingForResponse = false;
  private subs = new SubSink();

  selectRncpTitleForm = new UntypedFormControl('');
  rncpTitleList: any[] = [];

  selectClassForm = new UntypedFormControl('');
  classList: any[] = [];

  titleListOriginal = [];
  classListOriginal = [];

  isDuplicate = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public parentData: any,
    public dialogRef: MatDialogRef<TaskManagerSetupDialogComponent>,
    private fb: UntypedFormBuilder,
    private rncpTitleService: RNCPTitlesService,
    private translate: TranslateService,
    private taskService: TaskService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit() {
    this.createForm();
    this.patchForm();
    this.hookOnRncpTitleFormChanges();
  }

  createForm() {
    this.taskManager = this.fb.group({
      original_rncp_title_id: ['', [Validators.required]],
      original_class_id: ['', [Validators.required]],
      destination_rncp_title_id: ['', [Validators.required]],
      destination_class_id: ['', [Validators.required]],
    });
  }

  patchForm() {
    if (this.parentData) {
      this.taskManager.get('destination_rncp_title_id').patchValue(this.parentData.originTitleId);
      this.taskManager.get('destination_class_id').patchValue(this.parentData.originClassId);

    }
  }

  hookOnRncpTitleFormChanges() {
    this.subs.sink = this.selectRncpTitleForm.valueChanges.pipe(debounceTime(200)).subscribe((next: string) => {
      this.selectClassForm.setValue('');
    });
  }

  onClickNewManualTask() {
    this.isWaitingForResponse = true;
    this.selectClassForm.setValue('');
    this.selectClassForm.markAsPristine();
    this.selectClassForm.markAsUntouched();
    this.selectRncpTitleForm.setValue('');
    this.selectRncpTitleForm.markAsPristine();
    this.selectRncpTitleForm.markAsUntouched();
    this.taskManager.markAsPending();

    if (this.parentData && this.parentData.originClassId) {
      const classId = this.parentData.originClassId;
      const classData = { parent_rncp_title: this.parentData.originTitleId, is_task_builder_selected: true };
      this.subs.sink = this.rncpTitleService.updateClass(classId, classData).subscribe((response) => {

        this.isWaitingForResponse = false;
        this.dialogRef.close();
      });
    }
  }

  onClickDuplicateNow() {
    this.isWaitingForResponse = true;
    const payload = this.taskManager.value;
    this.subs.sink = this.taskService.duplicateTaskBuilder(payload).subscribe((response) => {

      this.isWaitingForResponse = false;
      this.dialogRef.close();
    });
  }

  onClickCancel() {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        classId: this.parentData.originClassId,
        tab: 'classparameters',
      },
    });
  }

  duplicateTaskManager() {
    if (!this.isDuplicate) {
      this.isDuplicate = true;
      this.getDropdownData();
    }
  }

  getDropdownData() {
    this.subs.sink = this.rncpTitleService.getTitleHaveTaskBuilder().subscribe((resp) => {
      if (resp) {

        const result = _.cloneDeep(resp);
        result.sort((a, b) => (a.short_name > b.short_name ? 1 : -1));
        this.rncpTitleList = _.cloneDeep(result);
        this.titleListOriginal = _.cloneDeep(result);
      } else {
        this.rncpTitleList = [];
        this.titleListOriginal = [];
      }
    });
  }

  getClassList(titleId) {
    // Reset All dropdown list and form control after rncp title form field
    this.classList = [];
    this.classListOriginal = [];
    this.selectClassForm.patchValue(null, { emitEvent: false });
    this.taskManager.get('original_class_id').patchValue(null, { emitEvent: false });


    if (titleId === null) {
      this.taskManager.get('original_rncp_title_id').patchValue(null, { emitEvent: false });
    } else {
      this.taskManager.get('original_rncp_title_id').patchValue(titleId, { emitEvent: false });
      this.getDropdownClassJury(titleId);
    }
  }

  getDropdownClassJury(titleId) {
    this.subs.sink = this.rncpTitleService.getClassHaveTaskBuilder(titleId).subscribe((resp) => {
      if (resp) {
        const result = _.cloneDeep(resp);
        result.sort((a, b) => (a.name > b.name ? 1 : -1));
        this.classList = _.cloneDeep(result);
        this.classListOriginal = _.cloneDeep(result);
      } else {
        this.classList = [];
        this.classListOriginal = [];
      }
    });
  }

  selectClass(classId) {
    if (classId === null) {
      this.taskManager.get('original_class_id').patchValue(null, { emitEvent: false });
    } else {
      this.taskManager.get('original_class_id').patchValue(classId, { emitEvent: false });
    }
  }

  filterRncpTitle() {
    if (this.selectRncpTitleForm.value) {
      const searchString = this.selectRncpTitleForm.value.toLowerCase().trim();
      this.rncpTitleList = this.titleListOriginal.filter((title) => title.short_name.toLowerCase().trim().includes(searchString));
    } else {
      this.rncpTitleList = this.titleListOriginal;
      this.taskManager.get('original_rncp_title_id').patchValue(null, { emitEvent: false });
    }
  }

  filterClass() {
    if (this.selectClassForm.value) {
      const searchString = this.selectClassForm.value.toLowerCase().trim();
      this.classList = this.classListOriginal.filter((className) => className.name.toLowerCase().trim().includes(searchString));
    } else {
      this.classList = this.classListOriginal;
      this.taskManager.get('original_class_id').patchValue(null, { emitEvent: false });
    }
  }

  displayFnTitle(value: any) {

    if (value) {
      const list = this.rncpTitleList;
      const found = _.find(list, (res) => res._id === value);
      let result = '';
      if (found) {
        result = found.short_name;
      }
      return result;
    }
  }

  displayFnClass(value: any) {

    if (value) {
      const list = this.classList;
      const found = _.find(list, (res) => res._id === value);
      let result = '';
      if (found) {
        result = found.name;
      }
      return result;
    }
  }

  closeDialog(isReloadData?: boolean) {
    this.dialogRef.close(isReloadData);
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
