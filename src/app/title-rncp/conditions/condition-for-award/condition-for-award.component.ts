import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { AddExpertiseDialogComponent } from './add-expertise-dialog/add-expertise-dialog.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import Swal from 'sweetalert2';
import { ConditionsService } from '../../../service/conditions/conditions.service';
import { GlobalConstants } from '../../../shared/settings';
import { RNCPTitlesService } from '../../../service/rncpTitles/rncp-titles.service';
import { TranslateService } from '@ngx-translate/core';
import { DuplicateConditionDialogComponent } from './duplicate-condition-dialog/duplicate-condition-dialog.component';
import { SubSink } from 'subsink';

@Component({
  selector: 'ms-condition-for-award',
  templateUrl: './condition-for-award.component.html',
  styleUrls: ['./condition-for-award.component.scss'],
})
export class ConditionForAwardComponent implements OnInit, OnDestroy {
  private subs = new SubSink();

  @Input() selectedRncpTitleId: string;
  @Input() selectedClassId: string;
  public dialogRefExpertise: MatDialogRef<AddExpertiseDialogComponent>;
  public dialogRefDuplicate: MatDialogRef<DuplicateConditionDialogComponent>;
  @Input() rncpTitle;
  @Input() classData;
  evaluationRetakeBlock = new Map<string, any>();
  expertiseMainList = [];
  subjectNumber = 0;
  expertiseNumber = 0;
  form: UntypedFormArray;
  testType = GlobalConstants.TestType;
  testTypeRetake = GlobalConstants.TestTypeForSubTest;
  expertise_mark_point_status = false;
  expertise_max_point = 0;
  isWaitingForResponse = false;
  private timeOutVal: any;

  constructor(
    private dialog: MatDialog,
    private fb: UntypedFormBuilder,
    private conditionsService: ConditionsService,
    private titleService: RNCPTitlesService,
    private translate: TranslateService,
  ) {}

  ngOnInit() {
    this.form = this.fb.array([]);
    this.initDataExpertise();
    this.subs.sink = this.titleService.getRncpTitleById(this.selectedRncpTitleId).subscribe((resp) => {
      this.rncpTitle = resp;
    });
    this.subs.sink = this.titleService.getClassById(this.selectedClassId).subscribe((resp) => {
      this.classData = resp;
      this.expertise_mark_point_status = resp.expertise_mark_point_status ? resp.expertise_mark_point_status : false;
      this.expertise_max_point = resp.expertise_max_point ? resp.expertise_max_point : 0;
    });
  }

  initDataExpertise() {
    this.isWaitingForResponse = true;
    // Reset form
    this.form = this.fb.array([]);
    this.expertiseNumber = 0;
    this.subs.sink = this.conditionsService
      .getConditionsByTitleAndClass(this.selectedRncpTitleId, this.selectedClassId)
      .subscribe((data) => {
        this.isWaitingForResponse = false;
        if (data && data.length > 0) {
          const expertiseData = data;
          expertiseData.sort(function (a, b) {
            return a.field_index - b.field_index;
          });
          this.expertiseMainList = expertiseData;
          this.subs.sink = expertiseData.forEach((expert) => {
            this.generateExpertiseForm(expert);
          });
        }
      });
  }

  /* Duplicate existing expertise*/
  onDuplicatedExpertise() {
    this.dialogRefDuplicate = this.dialog.open(DuplicateConditionDialogComponent, {
      disableClose: true,
      width: '630px',
      height: '300px',
      data: {
        rncp_title_destination: this.selectedRncpTitleId,
        class_id_destination: this.selectedClassId,
      },
    });
    // After close dialog get the data
    this.subs.sink = this.dialogRefDuplicate.afterClosed().subscribe((data) => {
      if (data && data.conditionData) {
        this.initDataExpertise();
      }
    });
  }

  /* Add new expertise*/
  addNewExpertiseDialog() {
    this.dialogRefExpertise = this.dialog.open(AddExpertiseDialogComponent, {
      disableClose: true,
      width: '700px',
      maxHeight: '580px',
      minHeight: '400px',
    });
    this.dialogRefExpertise.componentInstance.expertise = {};
    this.dialogRefExpertise.componentInstance.RNCPtitleId = this.selectedRncpTitleId;
    this.dialogRefExpertise.componentInstance.expertiseMaxPoints = 0;
    this.dialogRefExpertise.componentInstance.expertiseMarkPointStatus = true;
    this.dialogRefExpertise.componentInstance.specializations = [];
    this.dialogRefExpertise.componentInstance.expertiseList = this.getBlockOfExpertiseList();
    const dialogExpertise = this.dialogRefExpertise.afterClosed().subscribe((data) => {
      if (data && data.expertise) {
        this.generateExpertiseForm(data.expertise);
      }
    });
    // this.SubSink.sink(dialogExpertise);
  }

  // Generate the expertise
  generateExpertiseForm(data) {
    this.subjectNumber = 0;
    const control = this.form;
    const addrCtrl = this.fb.group({
      block_of_experise: [data ? data.block_of_experise : '', Validators.required],
      count_for_title_final_score: [data ? data.count_for_title_final_score : false],
      max_point: [data ? data.max_point : 0],
      min_score: [data ? data.min_score : '', Validators.required],
      description: [data ? data.description : '', Validators.required],
      rncp_title: [this.selectedRncpTitleId, Validators.required],
      class_id: [this.selectedClassId],
      expertise_credit: [data ? Math.abs(data.expertise_credit) : ''],
      is_specialization: [data ? data.is_specialization : ''],
      _id: [data ? data._id : ''],
      subjects: this.fb.array([]),
      specialization: [data ? data.specialization : null],
      page_break: [data ? data.page_break : false],
      transversal_block: [data && data.transversal_block ? data.transversal_block : false],
      is_retake_by_block: [data ? data.is_retake_by_block : false],
      selected_block_retake: [data.selected_block_retake && data.selected_block_retake._id ? data.selected_block_retake._id : null],
    });
    control.push(addrCtrl);
    if (data.subjects && data.subjects.length) {
      this.subs.sink = data.subjects.forEach((element) => {
        if (element.status !== 'deleted') {
          this.generateSubjectForm(this.expertiseNumber, element);
          this.subjectNumber = this.subjectNumber + 1;
        }
      });
    }
    this.expertiseNumber = this.expertiseNumber + 1;
  }

  // Generate the Test
  generateTestForm(expertiseIndex, subjectIndex, data) {
    const control = this.form;
    const subjectTestControl = this.form.controls[expertiseIndex]['controls']['subjects'].controls[subjectIndex]['controls'][
      'subject_tests'
    ];
    const addRetakeCtrl = this.fb.group({
      evaluation: [data.retake_subject_test ? data.retake_subject_test.evaluation : '', [Validators.required]],
      type: [data.retake_subject_test ? data.retake_subject_test.type : '', [Validators.required]],
      _id: [data.retake_subject_test ? data.retake_subject_test._id : null],
      weight: [data.weight ? data.weight : 0],
    });
    const addrCtrl = this.fb.group({
      weight: [data && data.weight ? data.weight : 0, [Validators.min(0.1), Validators.max(100)]],
      initial_subject_id: [data.initial_subject_id ? data.initial_subject_id : null],
      type: [data ? data.type : '', [Validators.required]],
      evaluation: [data ? data.evaluation : '', Validators.required],
      _id: [data && data._id ? data._id : null],
      parallel_intake: [data && data.parallel_intake ? data.parallel_intake : false],
      auto_mark: [data ? data.auto_mark : 1, [Validators.required, Validators.min(1), Validators.max(20)]],
      minimum_score: [data.minimum_score ? data.minimum_score : 0],
      is_retake_test: [data.is_retake_test ? data.is_retake_test : false],
      is_different_condition: [data.is_different_condition ? data.is_different_condition : false],
      retake_subject_test: addRetakeCtrl,
      retake_when_absent_justified: [data.retake_when_absent_justified ? data.retake_when_absent_justified : false],
      retake_when_absent_not_justified: [data.retake_when_absent_not_justified ? data.retake_when_absent_not_justified : false],
      use_best_mark: [data.use_best_mark ? data.use_best_mark : false],
      visible_before_decision_jury: [data.visible_before_decision_jury ? data.visible_before_decision_jury : false],
      never_visible_for_student: [data.never_visible_for_student ? data.never_visible_for_student : false],
      score_not_calculated_for_retake_block: [
        data.score_not_calculated_for_retake_block ? data.score_not_calculated_for_retake_block : false,
      ],
      test_is_not_retake_able_in_retake_block: [
        data.test_is_not_retake_able_in_retake_block ? data.test_is_not_retake_able_in_retake_block : false,
      ],
      selected_test_retake_block: [
        data.selected_test_retake_block && data.selected_test_retake_block._id ? data.selected_test_retake_block._id : null,
        [Validators.required],
      ],
    });

    /*const autoMarkControl = addrCtrl.get('auto_mark');
    if (data.parallel_intake) {
      autoMarkControl.enable();
      autoMarkControl.setValidators([
        Validators.required]);
    } else {
      autoMarkControl.clearValidators();
      autoMarkControl.disable();
    }*/

    subjectTestControl.push(addrCtrl);
    this.form.value[expertiseIndex].subjects[subjectIndex].subject_tests.push(data);
    if (data.evaluation) {
      this.evaluationRetakeBlock.set(
        this.form.at(expertiseIndex).get('_id').value,
        this.getListEvaluation(this.form.at(expertiseIndex).get('_id').value),
      );
    }
  }

  // Generate the subjects
  generateSubjectForm(expertiseIndex, data) {
    const control = this.form;
    const subjectControl = this.form.controls[expertiseIndex]['controls']['subjects'];
    const addrCtrl = this.fb.group({
      minimum_score_for_certification: [data ? data.minimum_score_for_certification : null, Validators.required],
      max_point: [data && data.max_point ? data.max_point : 0, Validators.required],
      coefficient: [data ? data.coefficient : 1, [Validators.required]],
      count_for_title_final_score: [data ? data.count_for_title_final_score : ''],
      credit: [data ? Math.abs(data.credit) : ''],
      subject_name: [data ? data.subject_name : '', Validators.required],
      _id: [data && data._id ? data._id : undefined],
      is_subject_transversal_block: [data && data.is_subject_transversal_block ? data.is_subject_transversal_block : false],
      subject_transversal_block_id: [
        data && data.subject_transversal_block_id ? data.subject_transversal_block_id._id : null,
        [Validators.required],
      ],
      subject_tests: this.fb.array([]),
    });
    subjectControl.push(addrCtrl);
    if (data.subject_tests.length) {
      this.subs.sink = data.subject_tests.forEach((element) => {
        if (element) {
          this.generateTestForm(expertiseIndex, this.subjectNumber, element);
        }
      });
    }
  }

  // onAdd new Subject
  addNewSubject(expertiseIndex) {
    const subjects = this.form.value[expertiseIndex].subjects;
    const ExpertiseMaxPoint = this.form.value[expertiseIndex].max_point;
    let sum = 0.0;
    for (let j = 0; j < subjects.length; j++) {
      sum = sum + Number(Number(subjects[j].max_point));
    }
    this.generateSubjectForm(expertiseIndex, {
      minimum_score_for_certification: null,
      coefficient: 1,
      credit: 0,
      max_point: Number(ExpertiseMaxPoint - Number(sum)),
      count_for_title_final_score: false,
      subject_name: '',
      is_subject_transversal_block: false,
      subject_transversal_block_id: null,
      _id: '',
      subject_tests: [],
    });
  }

  // onAdd new test
  addNewTest(expertiseIndex, subjectIndex) {
    const valueTests = this.form.value[expertiseIndex]['subjects'][subjectIndex]['subject_tests'];
    let sum = 0.0;
    for (let j = 0; j < valueTests.length; j++) {
      sum = sum + Number(Number(valueTests[j].weight));
    }

    sum = Number(sum.toFixed(2));

    if (sum >= 100) {
      Swal.fire({
        title: this.translate.instant('PARAMETERS-RNCP.EXPERTISE.WEIGHTSHOUDBEHUNDREDTitle'),
        html: this.translate.instant('PARAMETERS-RNCP.EXPERTISE.WEIGHTSHOUDBEHUNDREDText'),
        type: 'warning',
        allowEscapeKey: true,
        showCancelButton: false,
        confirmButtonText: this.translate.instant('SETTINGS.USERTYPES.S1.Ok'),
      });
    } else {
      this.generateTestForm(expertiseIndex, subjectIndex, {
        weight: Number(100 - Number(sum)),
        type: '',
        evaluation: '',
        _id: '',
        visible_before_decision_jury: false,
        never_visible_for_student: false,
      });
    }
  }

  // Remove expertise
  removeExpertise(expertiseIndex: number, expertiseId: string) {
    let timeDisabled = 5;
    Swal.fire({
      title: this.translate.instant('PARAMETERS-RNCP.EXPERTISE.deletedExpertiseWarningTitle'),
      html: this.translate.instant('PARAMETERS-RNCP.EXPERTISE.deletedExpertiseWarningMessage'),
      type: 'warning',
      allowEscapeKey: true,
      showCancelButton: true,
      confirmButtonText: this.translate.instant('THUMBSUP.SWEET_ALERT.CONFIRM', { timer: timeDisabled }),
      cancelButtonText: this.translate.instant('DASHBOARD_DELETE.NO'),
      allowOutsideClick: false,
      allowEnterKey: false,
      onOpen: () => {
        Swal.disableConfirmButton();
        const confirmBtnRef = Swal.getConfirmButton();
        const intVal = setInterval(() => {
          timeDisabled -= 1;
          confirmBtnRef.innerText = this.translate.instant('DELETE_ITEM_TEMPLATE.BUTTON_1') + ` (${timeDisabled})`;
        }, 1000);

        this.timeOutVal = setTimeout(() => {
          confirmBtnRef.innerText = this.translate.instant('DELETE_ITEM_TEMPLATE.BUTTON_1');
          Swal.enableConfirmButton();
          clearInterval(intVal);
          clearTimeout(this.timeOutVal);
        }, timeDisabled * 1000);
      },
    }).then((resp) => {
      clearTimeout(this.timeOutVal);
      if (resp.value) {
        if (expertiseId) {
          this.subs.sink = this.conditionsService.removeExpertise(expertiseId).subscribe((data) => {
            if (data) {
              this.form.removeAt(expertiseIndex);
              Swal.fire({
                title: this.translate.instant('PARAMETERS-RNCP.EXPERTISE.deletedExpertiseSuccessTitle'),
                html: this.translate.instant('PARAMETERS-RNCP.EXPERTISE.deletedExpertiseSuccess'),
                type: 'success',
                allowEscapeKey: true,
                showCancelButton: false,
                confirmButtonText: this.translate.instant('SETTINGS.USERTYPES.S1.Ok'),
              });
            }
          });
        } else {
          this.form.removeAt(expertiseIndex);
          Swal.fire({
            title: this.translate.instant('PARAMETERS-RNCP.EXPERTISE.deletedExpertiseSuccessTitle'),
            html: this.translate.instant('PARAMETERS-RNCP.EXPERTISE.deletedExpertiseSuccess'),
            type: 'success',
            allowEscapeKey: true,
            showCancelButton: false,
            confirmButtonText: this.translate.instant('SETTINGS.USERTYPES.S1.Ok'),
          });
        }
      }
    });
  }

  // Remove subjects
  removeSubject(expertiseIndex, subjectIndex, subjectId) {
    let timeDisabled = 5;
    Swal.fire({
      title: this.translate.instant('PARAMETERS-RNCP.TEST.deletedSubjectWarningTitle'),
      html: this.translate.instant('PARAMETERS-RNCP.TEST.deletedSubjectWarningMessage'),
      type: 'warning',
      allowEscapeKey: true,
      showCancelButton: true,
      confirmButtonText: this.translate.instant('THUMBSUP.SWEET_ALERT.CONFIRM', { timer: timeDisabled }),
      cancelButtonText: this.translate.instant('DASHBOARD_DELETE.NO'),
      allowOutsideClick: false,
      allowEnterKey: false,
      onOpen: () => {
        Swal.disableConfirmButton();
        const confirmBtnRef = Swal.getConfirmButton();
        const intVal = setInterval(() => {
          timeDisabled -= 1;
          confirmBtnRef.innerText = this.translate.instant('DELETE_ITEM_TEMPLATE.BUTTON_1') + ` (${timeDisabled})`;
        }, 1000);

        this.timeOutVal = setTimeout(() => {
          confirmBtnRef.innerText = this.translate.instant('DELETE_ITEM_TEMPLATE.BUTTON_1');
          Swal.enableConfirmButton();
          clearInterval(intVal);
          clearTimeout(this.timeOutVal);
        }, timeDisabled * 1000);
      },
    }).then((resp) => {
      clearTimeout(this.timeOutVal);
      if (resp.value) {
        if (subjectId) {
          this.subs.sink = this.conditionsService.removeSubject(subjectId).subscribe((respData) => {
            if (respData) {
              this.form.controls[expertiseIndex]['controls']['subjects']['controls'].splice(subjectIndex, 1);
              this.form.value[expertiseIndex]['subjects'].splice(subjectIndex, 1);
              Swal.fire({
                title: 'Deleted!',
                text: this.translate.instant('PARAMETERS-RNCP.TEST.deletedSubjectSuccess'),
                allowEscapeKey: true,
                type: 'success',
              });
            }
          });
        } else {
          this.form.controls[expertiseIndex]['controls']['subjects']['controls'].splice(subjectIndex, 1);
          this.form.value[expertiseIndex]['subjects'].splice(subjectIndex, 1);
          Swal.fire({
            title: 'Deleted!',
            text: this.translate.instant('PARAMETERS-RNCP.TEST.deletedSubjectSuccess'),
            allowEscapeKey: true,
            type: 'success',
          });
        }
      }
    });
  }

  // Remove test
  removeTest(expertiseIndex, subjectIndex, testIndex, testId) {
    let timeDisabled = 5;
    Swal.fire({
      title: this.translate.instant('PARAMETERS-RNCP.TEST.deletedTestWarningTitle'),
      html: this.translate.instant('PARAMETERS-RNCP.TEST.deletedTestWarningMessage'),
      type: 'warning',
      allowEscapeKey: true,
      showCancelButton: true,
      confirmButtonText: this.translate.instant('THUMBSUP.SWEET_ALERT.CONFIRM', { timer: timeDisabled }),
      cancelButtonText: this.translate.instant('DASHBOARD_DELETE.NO'),
      allowOutsideClick: false,
      allowEnterKey: false,
      onOpen: () => {
        Swal.disableConfirmButton();
        const confirmBtnRef = Swal.getConfirmButton();
        const intVal = setInterval(() => {
          timeDisabled -= 1;
          confirmBtnRef.innerText = this.translate.instant('DELETE_ITEM_TEMPLATE.BUTTON_1') + ` (${timeDisabled})`;
        }, 1000);

        this.timeOutVal = setTimeout(() => {
          confirmBtnRef.innerText = this.translate.instant('DELETE_ITEM_TEMPLATE.BUTTON_1');
          Swal.enableConfirmButton();
          clearInterval(intVal);
          clearTimeout(this.timeOutVal);
        }, timeDisabled * 1000);
      },
    }).then((resp) => {
      clearTimeout(this.timeOutVal);
      if (resp.value) {
        if (testId) {
          this.subs.sink = this.conditionsService.removeSubjectTest(testId).subscribe((respData) => {
            if (respData) {
              Swal.fire({
                title: 'Deleted!',
                text: this.translate.instant('PARAMETERS-RNCP.TEST.deletedTestSuccess'),
                allowEscapeKey: true,
                type: 'success',
              });
              this.form.controls[expertiseIndex]['controls']['subjects']['controls'][subjectIndex]['controls']['subject_tests'][
                'controls'
              ].splice(testIndex, 1);
              this.form.value[expertiseIndex]['subjects'][subjectIndex]['subject_tests'].splice(testIndex, 1);
            }
          });
        } else {
          this.form.controls[expertiseIndex]['controls']['subjects']['controls'][subjectIndex]['controls']['subject_tests'][
            'controls'
          ].splice(testIndex, 1);
          this.form.value[expertiseIndex]['subjects'][subjectIndex]['subject_tests'].splice(testIndex, 1);
          Swal.fire({
            title: 'Deleted!',
            text: this.translate.instant('PARAMETERS-RNCP.TEST.deletedTestSuccess'),
            allowEscapeKey: true,
            type: 'success',
          });
        }
      }
    });
  }

  // Drag and drop
  dropDragExpertise(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.form.controls, event.previousIndex, event.currentIndex);
    moveItemInArray(this.form.value, event.previousIndex, event.currentIndex);
  }

  getTestWeightLeft(testSubject: any[]) {
    let weight: number;
    let weighTotal = 0;
    testSubject.forEach((test) => {
      weighTotal += test.weight;
    });
    weight = 100 - weighTotal;
    return weight;
  }

  /* Add page break*/
  addPageBreak(expertiseIndex: number) {
    this.form.at(expertiseIndex).get('page_break').setValue(true);
  }

  /* Remove page break*/
  removePageBreak(expertiseIndex) {
    this.form.at(expertiseIndex).get('page_break').setValue(false);
  }

  /* Return all subject from block transversal*/
  getAllSubjectOfTransversal(): any[] {
    let expertise: any[] = this.form.value;
    const allSubjects = [];
    expertise = expertise.filter((expert) => {
      return expert.transversal_block === true;
    });
    if (expertise && expertise.length > 0) {
      expertise.forEach((expert) => {
        allSubjects.push(...expert.subjects);
      });
    }
    return allSubjects;
  }

  /* This function will call by retake slider, */
  disableRetake(selectedTest) {
    switch (selectedTest) {
      case 'Memoire-ORAL':
      case 'free-continuous-control':
      case 'mentor-evaluation':
      case 'Jury':
      case 'School-Mentor-Evaluation':
        return true;
      default:
        return false;
    }
  }

  // This function will return block of expertise without retake by block
  getBlockOfExpertiseList() {
    const expert: { name: string; id: string }[] = [];
    const expertiseList: any[] = this.form.value;
    expertiseList.forEach((exp) => {
      if (!exp.is_retake_by_block) {
        const findIndex = expertiseList.findIndex((fdx) => {
          return exp._id === fdx.selected_block_retake;
        });
        if (findIndex < 0) {
          expert.push({ name: exp.block_of_experise, id: exp._id });
        }
      }
    });
    return expert;
  }

  // This function will hide and show retake block on subject
  showSliderRetakeBlock(expId: string): boolean {
    const expertiseList = this.form.value;
    const findIndx = expertiseList.findIndex((exp) => {
      return exp.selected_block_retake === expId;
    });
    return findIndx > -1;
  }

  // will turn off test_is_not_retake_able_in_retake_block if true
  changeEvaluationSelection(testForm: UntypedFormGroup, value) {
    if (value.checked) {
      testForm.get('test_is_not_retake_able_in_retake_block').setValue(false);
    }
  }

  // When test is not retake able switch on
  testIsNotRetakeAble(testForm: UntypedFormGroup, value): void {
    if (value.checked) {
      testForm.get('score_not_calculated_for_retake_block').setValue(false);
    }
  }

  /* This will return all test inside block retake*/
  getListEvaluation(expertiseId: string) {
    const evalList: { name: string; id: string }[] = [];
    const selectedExp = this.expertiseMainList.find((exp) => {
      return exp.selected_block_retake && exp.selected_block_retake._id === expertiseId;
    });
    if (selectedExp && selectedExp.subjects) {
      selectedExp.subjects.forEach((subject) => {
        if (subject && subject.subject_tests) {
          subject.subject_tests.forEach((test) => {
            evalList.push({ name: test.evaluation, id: test._id });
          });
        }
      });
    }
    return evalList;
  }

  /* Validate double test selected*/
  selectTestEval(expertiseIndex, subjectIndex, testIndex, testEval, initTestIndex) {
    const subject = this.form.controls[expertiseIndex]['controls']['subjects']
      ? this.form.controls[expertiseIndex]['controls']['subjects'].value
      : [];
    this.subs.sink = subject.forEach((subjectData) => {
      if (subjectData.subject_tests) {
        subjectData.subject_tests.forEach((testData) => {
          if (testData.selected_test_retake_block === testEval.id) {
            if (initTestIndex !== testData._id) {
              Swal.fire({
                title: this.translate.instant('RETAKE_BY_BLOCK.SWEAT_ALERT1.TITLE'),
                text: this.translate.instant('RETAKE_BY_BLOCK.SWEAT_ALERT1.TEXT', {
                  testName: testEval.name,
                  testName2: testData.evaluation,
                }),
                type: 'error',
              }).then((resp) => {
                this.form.controls[expertiseIndex]['controls']['subjects'].controls[subjectIndex]['controls']['subject_tests'].controls[
                  testIndex
                ]['controls']['selected_test_retake_block'].setValue(null);
              });
            }
          }
        });
      }
    });
  }

  /* Generate condition pdf*/
  onPdfGeneration() {

  }

  // When submit expertise
  submitExpertise() {
    const expertiseData = this.form.value;
    if (expertiseData && expertiseData.length > 0) {
      expertiseData.forEach((exp, index) => {
        exp['field_index'] = index;
      });
    }

    this.subs.sink = this.conditionsService
      .saveConditionForAward(expertiseData, this.selectedClassId, this.selectedRncpTitleId)
      .subscribe((resp) => {

        if (resp) {
          Swal.fire({
            title: 'Congratulations!',
            type: 'success',
            text: `The Score Statement for the RNCP Title :
          has been registered successfully.`,
          }).then(() => {
            this.initDataExpertise();
          });
        }
      });
    // update class for point status
    this.subs.sink = this.conditionsService
      .updateClassMaxPoint(this.selectedClassId, {
        expertise_max_point: this.expertise_max_point,
        expertise_mark_point_status: this.expertise_mark_point_status,
      })
      .subscribe((resp) => {

      });
  }

  ngOnDestroy(): void {
    clearTimeout(this.timeOutVal);
    this.subs.unsubscribe();
  }
}
