import { Component, OnInit, ViewChild, AfterViewInit, OnDestroy, Inject } from '@angular/core';
import { RNCPTitlesService } from '../../../../service/rncpTitles/rncp-titles.service';
import { Test } from '../../../../models/test.model';
import { TestService } from '../../../../service/test/test.service';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormControl, UntypedFormGroup, NgForm, UntypedFormBuilder, Validators } from '@angular/forms';
import { FocusMonitor } from '@angular/cdk/a11y';
import { SubSink } from 'subsink';
import { debounceTime, startWith, map } from 'rxjs/operators';
import * as _ from 'lodash';
import { Observable, of } from 'rxjs';
import { removeSpaces } from 'app/service/customvalidator.validator';
import { ConditionsService } from 'app/service/conditions/conditions.service';
import { UtilityService } from 'app/service/utility/utility.service';
import { ClassIdAndName } from 'app/rncp-titles/RncpTitle.model';

interface ParentData {
  titleId: string
  classId: string
  subjectId: string
  blockId: string
  evalId: string
  testId: string // if test id has value, it mean we edit test data
}

@Component({
  selector: 'ms-duplicate-test-dialog',
  templateUrl: './duplicate-test-dialog.component.html',
  styleUrls: ['./duplicate-test-dialog.component.scss'],
})
export class DuplicateTestDialogComponent implements OnInit, OnDestroy {
  private subs = new SubSink();
  duplicateForm: UntypedFormGroup;
  searchForm: UntypedFormGroup;
  searchResults: any[];
  showHint = true;
  searching: boolean;
  titleID: string;
  disablePlease = true;
  // @ViewChild('searchInput') searchInput: HTMLInputElement;

  classesTarget = [];
  blocksTarget = [];
  subjectsTarget = [];
  testsTarget = [];
  targetEvaluationType = '';

  titleList = [];
  filteredTitle: Observable<any[]>;
  classList = [];
  filteredClass: Observable<any[]>;
  testList = [];
  filteredTest: Observable<any[]>;

  constructor(
    private dialogRef: MatDialogRef<DuplicateTestDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ParentData,
    private testService: TestService,
    private _focusMonitor: FocusMonitor,
    private fb: UntypedFormBuilder,
    private rncpTitleService: RNCPTitlesService,
    private conditionService: ConditionsService,
    public utilService: UtilityService
  ) {}

  ngOnInit() {
    this.initFormDuplicate();
    this.getTitleDropdownList();
    this.getClassTarget();

  }

  getClassTarget() {
    this.subs.sink = this.rncpTitleService.getClassesByTitle(this.data.titleId).subscribe(resp => {
      this.classesTarget = resp;
      this.duplicateForm.get('title_id').disable();
      if (this.data.testId || this.data.classId) {
        this.getBlockList();
        const targetClassData = this.classesTarget.find(cls => cls._id === this.data.classId);
        this.setClassEvalType(targetClassData);
      }
    })
  }

  setClassEvalType(classData: ClassIdAndName) {
    this.targetEvaluationType = classData.type_evaluation;
  }

  getBlockList(isResetChildFields?: boolean) {
    const classId = this.duplicateForm.get('class_target').value;


    if (classId) {
      this.subs.sink = this.conditionService.getFilteredBlockCondition(
        this.data.titleId, classId, true, this.data.testId
      ).subscribe((resp) => {
        this.blocksTarget = resp;
        this.duplicateForm.get('title_id').enable();
        this.duplicateForm.get('title_id').setValue('');
        this.duplicateForm.get('class_id').disable();
        this.duplicateForm.get('class_id').setValue('');
        this.duplicateForm.get('test_id').disable();
        this.duplicateForm.get('test_id').setValue('');
        if (this.data.testId) {
          this.getSubjectList();
        }
      });
    }
    if (isResetChildFields) {
      this.duplicateForm.get('block_target').setValue('');
      this.duplicateForm.get('subject_target').setValue('');
      this.duplicateForm.get('eval_target').setValue('');
    }
  }

  getSubjectList(isResetChildFields?: boolean) {
    const classId = this.duplicateForm.get('class_target').value;
    const blockId = this.duplicateForm.get('block_target').value;

    if (classId && blockId) {
      const payload = {
        rncp_title_id: this.data.titleId,
        class_id: classId,
        test_not_created: true,
        block_of_competence_condition_id: blockId,
        test_id: this.data.testId
      };
      this.subs.sink = this.conditionService.getFilteredSubjectCondition(payload).subscribe(resp => {
        this.subjectsTarget = resp;
        if (this.data.testId) {
          this.getTestList();
        }
      })
    }
    if (isResetChildFields) {
      this.duplicateForm.get('subject_target').setValue('');
      this.duplicateForm.get('eval_target').setValue('');
    }
  }

  getTestList(isResetChildFields?: boolean) {
    const classId = this.duplicateForm.get('class_target').value;
    const subjId = this.duplicateForm.get('subject_target').value;

    if (classId && subjId) {
      const payload = {
        rncp_title_id: this.data.titleId,
        class_id: classId,
        test_not_created: true,
        subject_id: subjId,
        test_id: this.data.testId
      };
      this.subs.sink = this.conditionService.getFilteredEvaluationCondition(payload).subscribe(resp => {
        this.testsTarget = resp;
      })
    }
    if (isResetChildFields) {
      this.duplicateForm.get('eval_target').setValue('');
    }
  }

  initFormDuplicate() {
    this.duplicateForm = this.fb.group({
      // target test
      class_target: [this.data.classId, Validators.required],
      block_target: [this.data.blockId, Validators.required],
      subject_target: [this.data.subjectId, Validators.required],
      eval_target: [this.data.evalId, Validators.required],
      // duplicate from
      title_id: ['', [Validators.required, removeSpaces]],
      class_id: [{ value: '', disabled: true }, [Validators.required, removeSpaces]],
      test_id: [{ value: '', disabled: true }, [Validators.required, removeSpaces]],
    });
  }

  initFormListener() {
    this.filteredTitle = this.duplicateForm.get('title_id').valueChanges.pipe(
      startWith(''),
      map((searchTxt) => this.titleList.filter((option) => {
        if (searchTxt) {
          return option.short_name.toLowerCase().includes(searchTxt.toLowerCase());
        }
        return true;
      })),
    );

    this.filteredClass = this.duplicateForm.get('class_id').valueChanges.pipe(
      startWith(''),
      map((searchTxt) =>
        this.classList.filter((option) => {
          if (searchTxt) {
            return option.name.toLowerCase().includes(searchTxt.toLowerCase());
          }
          return true;
        }),
      ),
    );

    this.filteredTest = this.duplicateForm.get('test_id').valueChanges.pipe(
      startWith(''),
      map((searchTxt) =>
        this.testList.filter((option) => {
          if (searchTxt) {
            return option.name.toLowerCase().includes(searchTxt.toLowerCase());
          }
          return true;
        }),
      ),
    );
  }

  getTitleDropdownList() {
    this.subs.sink = this.rncpTitleService.GetAllTitlePublish('').subscribe((resp) => {
      this.titleList = resp;
      this.initFormListener();
    });
  }

  getClassDropdownList(data: MatAutocompleteSelectedEvent) {
    if (data && data.option && data.option.value) {
      this.subs.sink = this.rncpTitleService.getAllClassDropdownListByEvaluationType(
        data.option.value,
        this.targetEvaluationType
      ).subscribe((classData) => {
        if (this.classList !== classData) {
          this.classList = _.cloneDeep(classData);
          this.filteredClass = of(this.classList);
          this.duplicateForm.get('class_id').enable();
          this.duplicateForm.get('class_id').patchValue('');
          this.duplicateForm.get('test_id').disable();
          this.duplicateForm.get('test_id').patchValue('');
          this.initFormListener();
        }
      });
    } else {
      this.classList = [];
      this.filteredClass = of(this.classList);
      this.duplicateForm.get('class_id').disable();
      this.duplicateForm.get('class_id').patchValue('');
      this.duplicateForm.get('test_id').disable();
      this.duplicateForm.get('test_id').patchValue('');
      this.initFormListener();
    }
  }

  getTestDropdownList(data: MatAutocompleteSelectedEvent) {
    if (data && data.option && data.option.value) {
      this.subs.sink = this.rncpTitleService
        .getAlltestDropdownList(this.duplicateForm.get('title_id').value, data.option.value)
        .subscribe((testData) => {
          if (this.testList !== testData) {
            this.testList = _.cloneDeep(testData);
            this.filteredTest = of(this.testList);
            this.duplicateForm.get('test_id').enable();
            this.duplicateForm.get('test_id').patchValue('');
            this.initFormListener();
          }
        });
    } else {
      this.testList = [];
      this.filteredTest = of(this.testList);
      this.duplicateForm.get('test_id').disable();
      this.duplicateForm.get('test_id').patchValue('');
      this.initFormListener();
    }
  }

  displayTitleName(data: string): string | undefined {
    const filteredData = this.titleList.filter((title) => title._id === data);

    if (filteredData && filteredData.length > 0) {
      return filteredData[0].short_name;
    } else {
      return '';
    }
  }

  displayClassName(data: string): string | undefined {
    const filteredData = this.classList.filter((classes) => classes._id === data);

    if (filteredData && filteredData.length > 0) {
      return filteredData[0].name;
    } else {
      return '';
    }
  }

  displayTestName(data: string): string | undefined {
    const filteredData = this.testList.filter((test) => test._id === data);

    if (filteredData && filteredData.length > 0) {
      return filteredData[0].name;
    } else {
      return '';
    }
  }

  duplicateTest() {
    const data = {
      duplicateFrom: this.duplicateForm.get('test_id').value,
      classId: this.duplicateForm.get('class_target').value,
      blockId: this.duplicateForm.get('block_target').value,
      subjectId: this.duplicateForm.get('subject_target').value,
      evalId: this.duplicateForm.get('eval_target').value,
    }
    this.dialogRef.close(data);
  }

  isDuplicateFormValid() {
    const temp = this.duplicateForm.value;
    if (temp.title_id && temp.class_id && temp.test_id) {
      return true;
    } else {
      return false;
    }
    // if (this.duplicateForm.get)
  }

  titleChanges() {
    this.duplicateForm.get('class_id').disable();
    this.duplicateForm.get('class_id').patchValue('');
    this.duplicateForm.get('test_id').disable();
    this.duplicateForm.get('test_id').patchValue('');
  }
  classChanges() {
    this.duplicateForm.get('test_id').disable();
    this.duplicateForm.get('test_id').patchValue('');
  }
  testChanges() {
    this.disablePlease = true;
  }
  getTestData(event: MatAutocompleteSelectedEvent) {

    this.disablePlease = false;
  }

  closeDialog() {
    this.dialogRef.close();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
