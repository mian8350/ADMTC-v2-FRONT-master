import { Component, OnInit, OnDestroy, OnChanges, ViewChild, ElementRef } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, Validators, UntypedFormArray } from '@angular/forms';
import { group } from 'console';
import { SubSink } from 'subsink';
import { Router, ActivatedRoute } from '@angular/router';
import { InformationDialogComponent } from './information-dialog/information-dialog.component';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { TestCorrectionService } from 'app/service/test-correction/test-correction.service';
import { ParseLocalToUtcPipe } from 'app/shared/pipes/parse-local-to-utc.pipe';
import * as _ from 'lodash';
import swal from 'sweetalert2';
import { forkJoin } from 'rxjs';
import { ParseUtcToLocalPipe } from 'app/shared/pipes/parse-utc-to-local.pipe';
import {
  TestCorrectionInput,
  TestCorrectionCorrectionGridCorrectionSectionInput,
  TestCorrectionCorrectionGridCorrectionInput,
  TestCorrectionCorrectionGridCorrectionSectionEvalskillInput,
  MultipleDateCorrection,
  TestCorrection,
} from './test-correction.model';
import { Section, PenaltiesBonuses, Correction, SectionEvalskill } from 'app/test/test-creation/test-creation.model';
import { SpeechToTextDialogComponent } from 'app/shared/components/speech-to-text-dialog/speech-to-text-dialog.component';
import { TestDetailsComponent } from 'app/rncp-titles/dashboard/test-details/test-details.component';
import { TranslateService } from '@ngx-translate/core';
import { PRINTSTYLES } from 'assets/scss/theme/doc-style';
import { TranscriptBuilderService } from 'app/service/transcript-builder/transcript-builder.service';
import { environment } from 'environments/environment.dev';
import { Observable } from 'apollo-link';
import Swal from 'sweetalert2';
import * as moment from 'moment';
import { AuthService } from 'app/service/auth-service/auth.service';
import { removeSpaces } from 'app/service/customvalidator.validator';
import { NgxPermissionsService } from 'ngx-permissions';
import { PdfDetailComponent } from './pdf-detail/pdf-detail.component';
import { UserProfileData } from 'app/users/user.model';
import { UserService } from 'app/service/user/user.service';
import { PdfGroupDetailComponent } from './pdf-group-detail/pdf-group-detail.component';
import { UtilityService } from 'app/service/utility/utility.service';
import { FileUploadService } from 'app/service/file-upload/file-upload.service';
import { AcademicKitService } from 'app/service/rncpTitles/academickit.service';

import * as DecoupledEditor from 'assets/ckeditor5-custom/ckeditor.js';
import { ApplicationUrls } from 'app/shared/settings';
import { Location } from '@angular/common';
import { PdfGroupDetailDialogComponent } from './pdf-group-detail/pdf-group-detail-dialog/pdf-group-detail-dialog.component';
import { CompetenceJobDescriptionResponse } from 'app/student-cards/job-description/job-desc.model';
import { ThirdStepComponent } from 'app/test/steps/third-step/third-step.component';

interface FilteredStudentList {
  testCorrectionId: string;
  _id: string;
  first_name: string;
  last_name: string;
  doc: string;
  missing_copy: boolean;
  is_do_not_participated: boolean;
  score: number;
  is_justified: string;
  school: {
    _id: string;
    short_name: string;
  };
  academic_pro_evaluation: {
    status: string;
  };
  soft_skill_pro_evaluation: {
    status: string;
  };
}

interface FilteredGroupList {
  groupTestCorrectionId: string;
  _id: string;
  name: string;
  doc: string;
  missing_copy: boolean;
  is_do_not_participated: boolean;
  is_justified: string;
  score: number;
}

@Component({
  selector: 'ms-test-correction',
  templateUrl: './test-correction.component.html',
  styleUrls: ['./test-correction.component.scss'],
  providers: [ParseLocalToUtcPipe, ParseUtcToLocalPipe],
})
export class TestCorrectionComponent implements OnInit, OnDestroy {
  private subs = new SubSink();
  @ViewChild(PdfDetailComponent, { static: false }) pdfDetailRef: PdfDetailComponent;
  @ViewChild(PdfGroupDetailComponent, { static: false }) pdfGroupDetailRef: PdfGroupDetailComponent;
  @ViewChild('notationGridContainer', { static: false }) notationGridContainer: ElementRef;
  @ViewChild('footerContainer', { static: false }) footerContainer: ElementRef;
  @ViewChild('fileUpload', { static: false }) fileUploader: ElementRef;
  @ViewChild('elementOfProofUpload', { static: false }) elementOfProofUploader: ElementRef;

  public Editor = DecoupledEditor;
  public config = {};
  selectedFile: File;
  uploadDocForm: any = {};
  testCorrectionForm: UntypedFormGroup;
  testCorrectionId = null;
  groupTestCorrectionId = null;

  titleId: string;
  schoolId: string;
  testId: string;
  taskId: string;
  groupId: string;

  selectedGroupData: any;

  titleData;
  schoolData;
  testData;
  taskData;
  selectedCorrector;
  selectedCorrectorId = '';
  selectedStudentId = '';
  maximumFinalMark = 0;

  studentList: any[];
  filteredStudentList: FilteredStudentList[];
  filteredGroupList: FilteredGroupList[];
  groupSelect: any;
  firstForm: any;
  studentSelect: any;
  originalStudentList: any = [];
  groupModel: any;
  test_group_id: any;
  studentSpecializationId: string = '';
  studentSelectDetail: any;
  studentData: any[];
  groupData: any[];
  groupList: any[];
  isStudent = false;
  isGroup = true;
  isWaitingForResponse = false;
  isWaitingPdf = false;
  loadReady = false;
  currentDate: any;
  CurUser: any;
  isADMTC: any;
  isUserLoginStudent = false;
  myInnerHeight = 960;
  currentUser: UserProfileData;

  isDataloaded = false;
  isTestHasDocumentExpected = false;
  isModificationPeriodMoreThan14Days = false;
  loadOneTime = true;
  studentOfAllGroupList = [];
  dataFilledStudentOfAllGroupList = [];
  multipleDatesFormArray = new UntypedFormArray([]);
  isDataSaved = false;
  isDataSubmit = false;
  firstTime = true;
  isRefreshMultipleDateNotationGrid = false;
  isRefreshJuryNotationGrid = false;
  studentJobDescriptions: CompetenceJobDescriptionResponse[] = [];
  isAllStudentInputLatestMultipleDate: boolean;
  missingCopyDocument: any;
  elementOfProofDocument: any;
  serverimgPath = `${ApplicationUrls.baseApi}/fileuploads/`.replace('/graphql', '');
  isAcadir = false;
  isAcadAdmin = false;
  isCertifierAdmin = false;
  disabledCke = false;
  private timeOutVal: any;
  emptyTask = false;
  public onReady(editor) {
    editor.ui.getEditableElement().parentElement.insertBefore(editor.ui.view.toolbar.element, editor.ui.getEditableElement());
  }

  isSaveThisScore = false;
  disabledSaveThisScore = false;
  dialogData: any;

  constructor(
    private fb: UntypedFormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    public dialog: MatDialog,
    private testCorrectionService: TestCorrectionService,
    private parseUTCtoLocal: ParseUtcToLocalPipe,
    private parseLocaltoUTC: ParseLocalToUtcPipe,
    private translate: TranslateService,
    private transcriptBuilderService: TranscriptBuilderService,
    private CurUserService: AuthService,
    private permissions: NgxPermissionsService,
    private authService: AuthService,
    private utilService: UtilityService,
    private fileUploadService: FileUploadService,
    private acadKitService: AcademicKitService,
    private _location: Location,
  ) {}

  ngOnInit() {
    this.isCertifierAdmin = this.utilService.isUserCRDirAdmin();
    if (!!this.permissions.getPermission('Academic Director') || !!this.permissions.getPermission('Academic Admin')) {
      this.isAcadir = true;
    }
    if (!!this.permissions.getPermission('ADMTC Director') || !!this.permissions.getPermission('ADMTC Admin')) {
      this.isADMTC = true;
    }
    if (!!this.permissions.getPermission('Student')) {
      this.isUserLoginStudent = true;
    }
    this.currentUser = this.authService.getLocalStorageUser();
    this.subs.sink = this.route.paramMap.subscribe((params) => {
      this.titleId = params.get('titleId');
      this.testId = params.get('testId');
    });
    this.subs.sink = this.route.queryParamMap.subscribe((queryParams) => {
      this.taskId = queryParams.get('task');
      this.schoolId = queryParams.get('school');
    });
    this.CurUser = this.CurUserService.getLocalStorageUser();
    this.currentDate = moment().format('DD MMM YYYY');
    this.initTestCorrectionForm();
    this.getDataFromParam();
    this.subs.sink = this.testCorrectionForm.get('student').valueChanges.subscribe((resp) => {
      if (resp) {
        const foundStudent = _.find(this.studentList, (student) => student._id === resp);
        if (foundStudent) {
          this.studentSelect = foundStudent.last_name.toUpperCase() + ' ' + foundStudent.first_name;
        }
      }
    });
  }

  initTestCorrectionForm() {
    this.testCorrectionForm = this.fb.group({
      test: [this.testId, Validators.required],
      corrector: ['', Validators.required],
      student: [''],
      missing_copy: [false],
      is_justified: [null],
      reason_for_missing_copy: [''],
      document_for_missing_copy: [],
      date: this.fb.group({
        date_utc: [''],
        time_utc: [''],
      }),
      correction_grid: this.initCorrectionGridForm(),
      status: ['active'],
      expected_documents: this.fb.array([]),
      jury_enabled_list: this.fb.array([]),
      should_retake_test: [false],
      mark_entry_document: [null],
      element_of_proof_doc: [null],
      is_cross_correction: [false],
      final_retake: [false],
      quality_control: [false],
      jury_organization: [false],
      jury_organization_id: [null],
      jury_member_id: [null],
      for_retake_correction: [false],
      is_different_notation_grid: [false],
      is_initial_correction: [false],
      retake_correction: [null],
      initial_marks_total: [null],
      initial_marks_additional_total: [null],
      initial_correction: [null],
      school_id: [this.schoolId],
      is_saved: [false],
      is_saved_as_draft: [false],
      is_do_not_participated: [false],
    });
  }

  initCorrectionGridForm() {
    return this.fb.group({
      header: this.initHeaderCorrectionGridForm(),
      correction: this.initCorrectionForm(),
      footer: this.initFooterCorrectionGridForm(),
    });
  }

  initCorrectionForm() {
    return this.fb.group({
      penalties: this.fb.array([]),
      bonuses: this.fb.array([]),
      elimination: [false],
      elimination_reason: [''],
      total: [null],
      total_jury_avg_rating: [null],
      additional_total: [0],
      final_comment: [''],
      sections: this.fb.array([]),
      sections_evalskill: this.fb.array([]),
    });
  }

  initHeaderCorrectionGridForm(): UntypedFormGroup {
    return this.fb.group({
      fields: this.fb.array([]),
    });
  }

  initFooterCorrectionGridForm(): UntypedFormGroup {
    return this.fb.group({
      fields: this.fb.array([]),
    });
  }

  initHeaderFooterFieldsForm(): UntypedFormGroup {
    return this.fb.group({
      type: ['', Validators.required],
      label: ['', Validators.required], // will be value from step 2
      value: [null, [Validators.required, removeSpaces]], // real value inputted by used
      data_type: ['', Validators.required],
      align: ['', Validators.required],
    });
  }

  initSectionForm() {
    return this.fb.group({
      title: [''],
      rating: [null],
      comment: [''],
      sub_sections: this.fb.array([]),
    });
  }

  initSubSectionForm() {
    return this.fb.group({
      title: [''],
      directions: [''],
      rating: [null],
      marks_number: [null],
      marks_letter: [''],
      score_conversion_id: [null],
      comments: [''],
      jurys: this.fb.array([]),
      showFullTitle: [false], // dummy field to truncate text
      showFullDirection: [false], // dummy field to truncate direction
    });
  }

  initSectionEvalskillForm() {
    return this.fb.group({
      ref_id: [''],
      is_selected: [false],
      title: [''],
      rating: [null],
      comment: [''],
      academic_skill_competence_template_id: [null],
      soft_skill_competence_template_id: [null],
      academic_skill_block_template_id: [null],
      soft_skill_block_template_id: [null],
      sub_sections: this.fb.array([]),
    });
  }

  initSubSectionEvalskillForm() {
    return this.fb.group({
      ref_id: [''],
      is_selected: [false],
      is_criteria_evaluated: [true],
      title: [''],
      rating: [null],
      comments: [''],
      directions: [''],
      marks_number: [null],
      marks_letter: [''],
      score_conversion_id: [null],
      academic_skill_criteria_of_evaluation_competence_id: [null],
      soft_skill_criteria_of_evaluation_competence_id: [null],
      academic_skill_competence_template_id: [null],
      soft_skill_competence_template_id: [null],
      jurys: this.fb.array([]),
      multiple_dates: this.fb.array([]),
      showFullTitle: [false], // dummy field to truncate text
      showFullDirection: [false], // dummy field to truncate direction
    });
  }

  initBonusPenaltyFieldForm() {
    return this.fb.group({
      title: [''],
      rating: [0],
    });
  }

  initExpectedDocumentForm() {
    return this.fb.group({
      document_name: [''],
      document: [null],
      is_uploaded: [false],
      validation_status: ['uploaded'],
    });
  }

  initJurysSubSectionForm() {
    return this.fb.group({
      name: [''],
      marks: [null],
      score_conversion_id: [null],
    });
  }

  initMultipleDatesSubSectionForm() {
    return this.fb.group({
      date: [''],
      // tempTime: [''],
      marks: [null],
      observation: [''],
      score_conversion_id: [''],
    });
  }

  initJuryEnabledList(index) {
    return this.fb.group({
      position: [index ? index : 0],
      state: [index === 0 ? true : false],
    });
  }

  getDataFromParam() {
    const forkParam = [];
    // get title data
    if (this.titleId) {
      const titleGet = this.testCorrectionService.getTitle(this.titleId);
      forkParam.push(titleGet);
    }

    // get test data
    if (this.testId) {
      const testGet = this.testCorrectionService.getTest(this.testId, this.schoolId);
      forkParam.push(testGet);
    }

    // get task data
    if (this.taskId) {
      const taskGet = this.testCorrectionService.getTask(this.taskId);
      forkParam.push(taskGet);
    }

    // get school data
    if (this.schoolId) {
      const schoolGet = this.testCorrectionService.getSchool(this.schoolId);
      forkParam.push(schoolGet);
    }

    this.isWaitingForResponse = true;
    this.subs.sink = forkJoin(forkParam).subscribe((resp) => {
      this.isWaitingForResponse = false;
      this.isDataloaded = true;
      if (resp && resp.length) {
        let count = 0;
        if (this.titleId) {
          this.titleData = resp[count];
          count++;
        }
        if (this.testId) {
          this.testData = _.cloneDeep(resp[count]);
          this.headerFormatFields(resp[count]);
          this.footerFormatFields(resp[count]);
          this.populateTestData(this.testData);
          this.isValidatedByAcadirOrCertAdmin();
          this.calculateMaximumFinalMark();
          this.checkModificationPeriodDate();
          this.isTestHasDocumentExpected = this.checkTestDocumentExpected();
          count++;
        }
        if (this.taskId) {
          this.taskData = resp[count];
          if(resp[count]) {
            this.populateTestCorrectionFormWithTaskData();
            this.populateStudentList(resp[count]);
            if (this.testData.group_test) {
              this.populateGroupList();
            }
            count++;
          } else {
            this.emptyTask = true;
            Swal.fire({
              type: 'info',
              title: this.translate.instant('REMOVE_CORRECTOR_S1.TITLE'),
              text: this.translate.instant('REMOVE_CORRECTOR_S1.TEXT', {eval_name: this.testData?.name}),
              confirmButtonText: this.translate.instant('REMOVE_CORRECTOR_S1.BUTTON'),
            }).then((res) => {
              this.router.navigate(['/rncpTitles']);
            });
          }
        } else {
          this.getStudentFromCorrectorAssigned();
          if (this.testData.group_test) {
            this.getAllGroupByTestIdAndGroupId();
          }
        }
        if (this.schoolId) {
          this.schoolData = resp[count];
          count++;
        }
        // *************** For test with cross correction type, if there is no task data, meaning it comes from acad kit. So we need to
        if (!this.taskId && this.testData && this.testData.correction_type === 'cross_correction' && this.schoolId) {
          this.populateStudentList(resp[count]);
        }
      }

      if (this.testData && this.testData.group_test && this.isStudent) {
        this.getFilteredStudentList();
        this.sortStudentList();
      } else if (this.testData && !this.testData.group_test) {
        this.getFilteredStudentList();
        this.sortStudentList();
      } else if (this.testData && this.testData.group_test) {
        // this.getFilteredGroupList();
      }
    });
  }

  sortStudentList() {
    this.studentList = _.orderBy(this.studentList, ['last_name'], ['asc']);
    this.studentList = this.studentList.sort((a, b) => {
      return a.last_name.toLowerCase().localeCompare(b.last_name.toLowerCase());
    });
  }

  calculateMaximumFinalMark() {
    if (this.testData && this.testData.correction_grid && this.testData.correction_grid.correction) {
      const correctionData: Correction = this.testData.correction_grid.correction;
      correctionData.sections.forEach((section) => {
        this.maximumFinalMark = this.maximumFinalMark + (section.maximum_rating ? section.maximum_rating : 0);
      });
    }
  }

  checkModificationPeriodDate() {
    // calculate difference of today date with modification_period_date.
    // if the difference more than 14 days, hide the save, submit, and validate button for user other than ADMTC

    if (this.testData.block_type === 'competence' || this.testData.block_type === 'soft_skill') {
      this.isModificationPeriodMoreThan14Days = false;
      return;
    }

    if (!this.utilService.isUserEntityADMTC() && this.testData && this.testData.correction_status_for_schools) {
      const schoolCorrection = this.testData.correction_status_for_schools.find((corr) => {
        if (corr && corr.school && corr.school._id) {
          return corr.school._id === this.schoolId;
        }
        return false;
      });
      if (schoolCorrection) {
        // schoolCorrection.modification_period_date.date = '01/11/2020';
        // schoolCorrection.modification_period_date.time = '15:59';
        const today = moment().format('DD/MM/YYYY');
        const date = schoolCorrection.modification_period_date.date ? schoolCorrection.modification_period_date.date : today;
        const time = schoolCorrection.modification_period_date.time ? schoolCorrection.modification_period_date.time : '00:00';
        if (date && time) {
          const modificationDate = this.parseUTCtoLocal.transformDateInDateFormat(date, time);
          const dayDifference = moment().diff(modificationDate, 'days');

          if (dayDifference > 30) {
            this.isModificationPeriodMoreThan14Days = true;
          }
        }
      }
    }
  }

  getAdditionalScore() {
    if (this.testData && this.testData.correction_grid && this.testData.correction_grid.correction) {
      if (this.testData.correction_grid.correction.total_zone.display_additional_total) {
        return this.testData.correction_grid.correction.total_zone.additional_max_score;
      } else {
        return '';
      }
    }
  }

  getScore(correctionMark: any) {
    // if display_additional_total checkbox in step 2 test creation checked, then use additional_total mark
    // if test type is free_continuous_control, then use additional_total mark
    // else use total mark
    let score = null;
    if (
      (this.testData &&
        this.testData.correction_grid &&
        this.testData.correction_grid.correction &&
        this.testData.correction_grid.correction.total_zone &&
        this.testData.correction_grid.correction.total_zone.display_additional_total) ||
      this.testData.type === 'free_continuous_control'
    ) {
      score = correctionMark.additional_total === 0 ? 0 : correctionMark.additional_total;
    } else {
      score = correctionMark.total === 0 ? 0 : correctionMark.total;
    }
    return score;
  }

  getCompanyAndMentor(companies: any[]) {
    const company = companies.find((comp) => comp.status === 'active');
    return company ? company : null;
  }

  addStudentWithNoCorrection(student: any) {
    return {
      testCorrectionId: null,
      _id: student._id,
      first_name: student.first_name,
      last_name: student.last_name,
      civility: student.civility,
      doc: null,
      missing_copy: false,
      is_do_not_participated: false,
      is_justified: null,
      score: null,
      company: student.companies && student.companies.length ? this.getCompanyAndMentor(student.companies) : null,
      specialization_id: student?.specialization?._id,
    };
  }

  populateStudentsWithTestCorrection(testCorrections: TestCorrection[]) {
    const tempStudentList = _.cloneDeep(this.studentList);

    let tempResult = [];
    if (testCorrections && testCorrections.length) {
      testCorrections.forEach((testCorrection) => {
        if (testCorrection.student) {
          // add test correction data to student that we get from corrector_assigned array
          const found = _.find(tempStudentList, (studentList) => studentList?._id === testCorrection?.student?._id);
          if (found) {
            tempResult.push({
              testCorrectionId: testCorrection?._id,
              _id: found._id,
              school: found && found.school ? found.school : null,
              first_name: found.first_name,
              last_name: found.last_name,
              civility: found.civility,
              doc: testCorrection.expected_documents,
              missing_copy: testCorrection.missing_copy ? testCorrection.missing_copy : false,
              is_do_not_participated: testCorrection.is_do_not_participated ? testCorrection.is_do_not_participated : false,
              is_justified: testCorrection.is_justified ? testCorrection.is_justified : null,
              score:
                testCorrection.is_saved && testCorrection.correction_grid && testCorrection.correction_grid.correction
                  ? this.getScore(testCorrection.correction_grid.correction)
                  : null,
              company: found.companies && found.companies.length ? this.getCompanyAndMentor(found.companies) : null,
              academic_pro_evaluation: found.academic_pro_evaluation,
              soft_skill_pro_evaluation: found.soft_skill_pro_evaluation,
              correctionGrid: testCorrection.correction_grid,
              specialization_id: found?.specialization?._id,
            });
          }
        }
      });
      // remove duplicated student if student has multiple test correction data
      tempResult = _.uniqBy(tempResult, '_id');
      // if student has no test correction yet, add empty test correction to that student
      tempStudentList.forEach((student) => {
        const found = _.find(tempResult, (tempStudent) => tempStudent?._id === student?._id);
        if (!found) {
          tempResult.push(this.addStudentWithNoCorrection(student));
        }
      });
    } else {
      // if there is no test correction for this test, students, and school yet, add all student from corrector_assigned array
      this.studentList.forEach((student) => {
        tempResult.push(this.addStudentWithNoCorrection(student));
      });
    }
    this.filteredStudentList = tempResult;
    this.filteredStudentList = _.orderBy(this.filteredStudentList, ['last_name'], ['asc']);
    this.filteredStudentList = this.filteredStudentList.sort((a, b) => {
      return a.last_name.toLowerCase().localeCompare(b.last_name.toLowerCase());
    });
    if (this.testData && !this.testData.group_test) {
      this.populateStudentRemaining(this.filteredStudentList);
      if ((this.testData.type !== 'academic_pro_evaluation' && this.testData.type !== 'soft_skill_pro_evaluation') || this.isDataSubmit) {
        this.populateFormFirstTime();
      } else if (this.firstTime) {
        this.firstTime = false;
        this.populateFormFirstTime();
      }
      if (this.taskData && this.taskData.description !== 'Validate Test') {
        this.getAllTestCorrection();
      }
    }
  }

  getFilteredStudentList() {
    if (this.selectedCorrector && this.selectedCorrector.corrector_id && this.selectedCorrector.corrector_id._id) {
      const selectorID = this.selectedCorrector.corrector_id._id;
      this.selectedCorrectorId = selectorID;
      this.testCorrectionForm.get('corrector').patchValue(this.selectedCorrectorId);
      const student_ids = [];
      if (this.studentList && this.studentList.length) {
        this.studentList.forEach((student) => {
          student_ids.push(student._id);
        });
      }
      this.isWaitingForResponse = true;
      // if there is task data (open mark entry page from pending task or task table), execute this block of code
      this.subs.sink = this.testCorrectionService
        .getAllTestCorrectionWithStudents(this.testId, student_ids, this.schoolId)
        .subscribe((response) => {
          this.isWaitingForResponse = false;
          this.populateStudentsWithTestCorrection(response);
        });
    } else {
      // if there is no task data (when open mark entry page from folder 06 acadkit), execute this block of code
      this.selectedCorrectorId = this.currentUser._id;
      this.testCorrectionForm.get('corrector').patchValue(this.selectedCorrectorId);
      this.isWaitingForResponse = true;

      if (this.testData && this.testData.correction_type && this.testData.correction_type === 'cross_correction') {
        const student_ids = [];
        const students = _.cloneDeep(this.studentList);
        if (students && students.length) {
          students.forEach((student) => {
            student_ids.push(student._id);
          });
          this.subs.sink = this.testCorrectionService
            .getAllTestCorrectionNonCorrectorByCross(this.testId, student_ids)
            .subscribe((response) => {
              this.isWaitingForResponse = false;
              if(response) {
                this.populateStudentsWithTestCorrection(response);
              }
            });
        }
        this.isWaitingForResponse = false;
      } else {
        this.subs.sink = this.testCorrectionService.getAllTestCorrectionNonCorrector(this.testId, this.schoolId).subscribe((response) => {
          this.isWaitingForResponse = false;
          if(response) {
            this.populateStudentsWithTestCorrection(response);
          }
        });
      }
    }
  }

  populateStudentsInGroupWithTestCorrection(testCorrections: TestCorrection[]) {
    const tempStudentList = _.cloneDeep(this.studentList);
    let tempResult = [];
    const tempAllStudentList = _.cloneDeep(this.studentOfAllGroupList);
    const tempAllStudent = [];
    if (testCorrections && testCorrections.length) {
      testCorrections.forEach((testCorrection) => {
        if (testCorrection.student) {
          // add test correction data to student that we get from corrector_assigned array
          const found = _.find(tempStudentList, (studentList) => studentList._id === testCorrection.student._id);
          if (found) {
            tempResult.push({
              testCorrectionId: testCorrection._id,
              _id: found._id,
              first_name: found.first_name,
              last_name: found.last_name,
              civility: found.civility,
              doc: testCorrection.expected_documents,
              missing_copy: testCorrection.missing_copy ? testCorrection.missing_copy : false,
              is_justified: testCorrection.is_justified ? testCorrection.is_justified : null,
              is_do_not_participated: testCorrection.is_do_not_participated ? testCorrection.is_do_not_participated : false,
              score:
                testCorrection.is_saved && testCorrection.correction_grid && testCorrection.correction_grid.correction
                  ? this.getScore(testCorrection.correction_grid.correction)
                  : null,
              company: found.companies && found.companies.length ? this.getCompanyAndMentor(found.companies) : null,
              specialization_id: found?.specialization?._id,
            });
          }

          const foundAllStudent = _.find(tempAllStudentList, (studentList) => studentList._id === testCorrection.student._id);
          if (foundAllStudent) {
            tempAllStudent.push({
              testCorrectionId: testCorrection._id,
              _id: foundAllStudent._id,
              first_name: foundAllStudent.first_name,
              last_name: foundAllStudent.last_name,
              doc: testCorrection.expected_documents,
              missing_copy: testCorrection.missing_copy ? testCorrection.missing_copy : false,
              is_justified: testCorrection.is_justified ? testCorrection.is_justified : null,
              groupId: foundAllStudent.groupId,
              score:
                testCorrection.is_saved && testCorrection.correction_grid && testCorrection.correction_grid.correction
                  ? this.getScore(testCorrection.correction_grid.correction)
                  : null,
              company:
                foundAllStudent.companies && foundAllStudent.companies.length ? this.getCompanyAndMentor(foundAllStudent.companies) : null,
              specialization_id: foundAllStudent?.specialization?._id,
            });
          }
        }
      });
      // remove duplicated student if student has multiple test correction data
      tempResult = _.uniqBy(tempResult, '_id');
      // if student has no test correction yet, add empty test correction to that student
      tempStudentList.forEach((student) => {
        const found = _.find(tempResult, (tempStudent) => tempStudent._id === student._id);
        if (!found) {
          tempResult.push(this.addStudentWithNoCorrection(student));
        }
      });
    } else {
      // if there is no test correction for this test, students, and school yet, add all student from corrector_assigned array
      this.studentList.forEach((student) => {
        tempResult.push(this.addStudentWithNoCorrection(student));
      });
    }
    this.filteredStudentList = tempResult;
    this.filteredStudentList = _.orderBy(this.filteredStudentList, ['last_name'], ['asc']);
    this.filteredStudentList = this.filteredStudentList.sort((a, b) => {
      return a.last_name.toLowerCase().localeCompare(b.last_name.toLowerCase());
    });
    this.dataFilledStudentOfAllGroupList = tempAllStudent;
    this.populateStudentRemaining(this.filteredStudentList);
  }

  getFilteredStudentListInGroup() {
    if (this.selectedCorrector && this.selectedCorrector.corrector_id && this.selectedCorrector.corrector_id._id) {
      const selectorID = this.selectedCorrector.corrector_id._id;
      this.selectedCorrectorId = selectorID;
      this.testCorrectionForm.get('corrector').patchValue(this.selectedCorrectorId);
      const student_ids = [];
      if (this.studentList && this.studentList.length) {
        this.studentList.forEach((student) => {
          student_ids.push(student._id);
        });
      }
      this.isWaitingForResponse = true;
      // if there is task data (open mark entry page from pending task or task table), execute this block of code
      this.subs.sink = this.testCorrectionService
        .getAllTestCorrectionWithStudents(this.testId, student_ids, this.schoolId)
        .subscribe((response) => {
          this.isWaitingForResponse = false;
          this.populateStudentsInGroupWithTestCorrection(response);
        });
    } else {
      // if there is no task data (when open mark entry page from folder 06 acadkit), execute this block of code
      this.selectedCorrectorId = this.currentUser._id;
      this.testCorrectionForm.get('corrector').patchValue(this.selectedCorrectorId);
      this.isWaitingForResponse = true;
      this.subs.sink = this.testCorrectionService.getAllTestCorrectionNonCorrector(this.testId, this.schoolId).subscribe((response) => {
        this.isWaitingForResponse = false;
        if(response) {
          this.populateStudentsInGroupWithTestCorrection(response);
        }
      });
    }
  }

  populateTestData(dataRef) {
    const data = _.cloneDeep(dataRef);
    if (data) {
      // Populate the date
      if (data.date) {
        if (data.date.date_utc) {
          this.testCorrectionForm.get('date').get('date_utc').patchValue(data.date.date_utc);
        }
        if (data.date.time_utc) {
          this.testCorrectionForm.get('date').get('time_utc').patchValue(data.date.time_utc);
        }
      }

      // Populate header fields
      if (
        data.correction_grid &&
        data.correction_grid.header &&
        data.correction_grid.header.fields &&
        data.correction_grid.header.fields.length
      ) {
        const result = [];
        data.correction_grid.header.fields.forEach((headerField) => {
          this.addHeaderFieldsFormArray();
          const index = this.getHeaderFieldsFormArray().length - 1;
          headerField.label = headerField.value;
          if (headerField.data_type === 'checkbox') {
            headerField.value = false;
            this.getHeaderFieldsFormArray().at(index).get('value').setValidators([Validators.requiredTrue]);
            this.getHeaderFieldsFormArray().at(index).get('value').updateValueAndValidity();
          } else if (!headerField.data_type) {
            headerField.data_type = 'text';
          } else {
            headerField.value = '';
          }
          result.push(headerField);
        });
        // Populate the form with filtered header fields
        this.testCorrectionForm.get('correction_grid').get('header').get('fields').patchValue(result);
      }

      // Populate footer fields
      if (
        data.correction_grid &&
        data.correction_grid.footer &&
        data.correction_grid.footer.fields &&
        data.correction_grid.footer.fields.length
      ) {
        const result = [];
        data.correction_grid.footer.fields.forEach((footerField) => {
          this.addFooterFieldsFormArray();
          const index = this.getFooterFieldsFormArray().length - 1;
          footerField.label = footerField.value;
          if (footerField.data_type === 'checkbox') {
            footerField.value = false;
            this.getFooterFieldsFormArray().at(index).get('value').setValidators([Validators.requiredTrue]);
            this.getFooterFieldsFormArray().at(index).get('value').updateValueAndValidity();
          } else if (!footerField.data_type) {
            footerField.data_type = 'text';
          } else {
            footerField.value = '';
          }
          if (footerField.value === 'Nom du Président de Jury') {
            footerField.value = '';
          }
          result.push(footerField);
        });
        // Populate the form with filtered footer fields
        this.testCorrectionForm.get('correction_grid').get('footer').get('fields').patchValue(result);
      }

      // populate expected document
      if (data.expected_documents && data.expected_documents.length) {
        data.expected_documents.forEach((doc) => {
          this.addExpectedDocumentForm();
        });
      }

      // populate corection field
      if (data.correction_grid && data.correction_grid.correction) {
        const correction: Correction = data.correction_grid.correction;
        if (correction.sections && correction.sections.length) {
          const sections: Section[] = correction.sections;
          sections.forEach((section, sectionIndex) => {
            // add title to notation grid form table
            this.addSectionForm();
            this.getSectionForm().at(sectionIndex).get('title').setValue(section.title);
            section.sub_sections.forEach((subSection, subSectionIndex) => {
              // add text and direction value to notation grid form table
              this.addSubSectionForm(sectionIndex);
              this.getSubSectionForm(sectionIndex).at(subSectionIndex).get('title').setValue(subSection.title);
              this.getSubSectionForm(sectionIndex).at(subSectionIndex).get('directions').setValue(subSection.direction);
              if (
                data.type === 'academic_recommendation' &&
                !this.testCorrectionForm.get('missing_copy').value &&
                !this.testCorrectionForm.get('is_do_not_participated').value
              ) {
                this.getSubSectionForm(sectionIndex).at(subSectionIndex).get('comments').setValidators([Validators.required]);
                this.getSubSectionForm(sectionIndex).at(subSectionIndex).get('comments').updateValueAndValidity();
              } else {
                this.getSubSectionForm(sectionIndex).at(subSectionIndex).get('rating').setValidators([Validators.required]);
                this.getSubSectionForm(sectionIndex).at(subSectionIndex).get('rating').updateValueAndValidity();
              }
              // add jury subsection form array if test type is jury organization
              data.jury_max = 3; // hard coded as 3 in admtc v1
              this.testData.jury_max = 3;
              if ((data.type === 'memoire_oral_non_jury' || data.type === 'memoire_oral') && data.jury_max >= 0) {
                for (let i = 0; i < data.jury_max; i++) {
                  this.addJurysSubSectionForm(sectionIndex, subSectionIndex);
                }
              }
            });
          });
        }

        if (correction.sections_evalskill && correction.sections_evalskill.length) {
          const sections: SectionEvalskill[] = correction.sections_evalskill;
          sections
            .filter((section) => !section?.specialization_id || section?.specialization_id === this.studentSpecializationId)
            .forEach((section, sectionIndex) => {
              // add title to notation grid form table
              this.addSectionEvalskillForm();
              this.getSectionEvalskillForm().at(sectionIndex).get('ref_id').setValue(section.ref_id);
              this.getSectionEvalskillForm().at(sectionIndex).get('is_selected').setValue(section.is_selected);
              this.getSectionEvalskillForm().at(sectionIndex).get('title').setValue(section.title);
              if (section.academic_skill_competence_template_id && section.academic_skill_competence_template_id._id) {
                this.getSectionEvalskillForm()
                  .at(sectionIndex)
                  .get('academic_skill_competence_template_id')
                  .setValue(section.academic_skill_competence_template_id._id);
              }
              section.sub_sections.forEach((subSection, subSectionIndex) => {
                // add text and direction value to notation grid form table
                this.addSubSectionEvalskillForm(sectionIndex);
                this.getSubSectionEvalskillForm(sectionIndex).at(subSectionIndex).get('ref_id').setValue(subSection.ref_id);
                this.getSubSectionEvalskillForm(sectionIndex).at(subSectionIndex).get('is_selected').setValue(subSection.is_selected);
                this.getSubSectionEvalskillForm(sectionIndex).at(subSectionIndex).get('title').setValue(subSection.title);
                this.getSubSectionEvalskillForm(sectionIndex).at(subSectionIndex).get('directions').setValue(subSection.direction);
                // add jury subsection form array if test type is jury organization
                data.jury_max = 3; // hard coded as 3 in admtc v1
                this.testData.jury_max = 3;
                if ((data.type === 'memoire_oral_non_jury' || data.type === 'memoire_oral') && data.jury_max >= 0) {
                  for (let i = 0; i < data.jury_max; i++) {
                    this.addJurysSubSectionForm(sectionIndex, subSectionIndex);
                  }
                }
                if (
                  subSection.academic_skill_criteria_of_evaluation_competence_id &&
                  subSection.academic_skill_criteria_of_evaluation_competence_id._id
                ) {
                  this.getSubSectionEvalskillForm(sectionIndex)
                    .at(subSectionIndex)
                    .get('academic_skill_criteria_of_evaluation_competence_id')
                    .setValue(subSection.academic_skill_criteria_of_evaluation_competence_id._id);
                }
                if (subSection.is_selected) {
                  this.getSubSectionEvalskillForm(sectionIndex).at(subSectionIndex).get('rating').setValidators([Validators.required]);
                  this.getSubSectionEvalskillForm(sectionIndex).at(subSectionIndex).get('rating').updateValueAndValidity();
                }
              });
            });
        }

        if (correction.show_penalty && correction.penalties && correction.penalties.length) {
          const penalties: PenaltiesBonuses[] = correction.penalties;
          penalties.forEach((penalty, penaltyIndex) => {
            // add penalty title and maximum rating
            this.addPenaltyFieldForm();
            this.getPenaltiesFieldForm().at(penaltyIndex).get('title').setValue(penalty.title);
            this.getPenaltiesFieldForm().at(penaltyIndex).get('rating').setValidators([Validators.required]);
            this.getPenaltiesFieldForm().at(penaltyIndex).get('rating').updateValueAndValidity();
          });
        }
        if (correction.show_bonus && correction.bonuses && correction.bonuses.length) {
          const bonuses: PenaltiesBonuses[] = correction.bonuses;
          bonuses.forEach((bonus, bonusIndex) => {
            // add bonus title and maximum rating
            this.addBonusFieldForm();
            this.getBonusesFieldForm().at(bonusIndex).get('title').setValue(bonus.title);
            this.getBonusesFieldForm().at(bonusIndex).get('rating').setValidators([Validators.required]);
            this.getBonusesFieldForm().at(bonusIndex).get('rating').updateValueAndValidity();
          });
        }
        if (correction.show_final_comment) {
          this.getCorrectionForm().get('final_comment').setValidators([Validators.required]);
          this.getCorrectionForm().get('final_comment').updateValueAndValidity();
        }
      }

      // populate the enabled list(the slider in jury form)
      if (data.type === 'memoire_oral_non_jury' || data.type === 'memoire_oral') {
        for (let i = 0; i < 3; i++) {
          this.addJuryEnabledList(i);
        }
      }

      // this.firstForm = _.cloneDeep(this.testCorrectionForm.value);
    }
  }

  populateTestCorrectionFormWithTaskData() {
    if (this.taskData) {
      if (this.taskData.type === 'final_retake_marks_entry') {
        this.testCorrectionForm.get('final_retake').setValue(true);
      }
      if (
        this.taskData.type === 'jury_organization_marks_entry' ||
        this.taskData.type === 'validate_jury_organization' ||
        this.taskData.type === 'certifier_validation'
      ) {
        this.testCorrectionForm.get('jury_organization').setValue(true);
        if (this.taskData.jury_id && this.taskData.jury_id?._id) {
          this.testCorrectionForm.get('jury_organization_id').setValue(this.taskData.jury_id._id);
        }
        this.testCorrectionForm.get('jury_member_id').setValue(this.taskData.jury_member_id);
      }
    }
  }

  getCorrectorAssigned(taskData?: any): any[] {
    let correctorAssigned = [];

    // for jury organization test, get student list from president_jury_assigned
    if (
      taskData &&
      (taskData.type === 'jury_organization_marks_entry' ||
        taskData.type === 'validate_jury_organization' ||
        taskData.type === 'certifier_validation')
    ) {
      this.testCorrectionForm.get('jury_organization').setValue(true);
      correctorAssigned = _.cloneDeep(this.testData.president_jury_assigned);
    } else if (
      this.testData.president_jury_assigned.length &&
      (this.testData.type === 'memoire_oral_non_jury' || this.testData.type === 'memoire_oral')
    ) {
      // if there is no task data (we open it from folder 06, then we can check if president_jury_assigned has value or not)
      // if has value, then this test is jury organization
      correctorAssigned = _.cloneDeep(this.testData.president_jury_assigned);
      this.testCorrectionForm.get('jury_organization').setValue(true);
      this.testCorrectionForm.get('jury_organization_id').setValue(correctorAssigned[0]?.jury_member_id?._id);
      this.testCorrectionForm.get('jury_member_id').setValue(correctorAssigned[0]?.jury_member_id?.jury_organization_id?._id);
    }

    // for final retake test, get student list from corrector_assigned_for_final_retake
    else if (taskData && (taskData.type === 'final_retake_marks_entry' || taskData.type === 'validate_test_correction_for_final_retake')) {
      correctorAssigned = _.cloneDeep(this.testData.corrector_assigned_for_final_retake);
    } else if (this.testData.corrector_assigned_for_final_retake.length) {
      // if there is no task data (we open it from folder 06, then we can check if corrector_assigned_for_final_retake has value or not)
      // if has value, then this test is retake test
      correctorAssigned = _.cloneDeep(this.testData.corrector_assigned_for_final_retake);
    }

    // for normal test, get student list from corrector_assigned
    else {
      correctorAssigned = _.cloneDeep(this.testData.corrector_assigned);
    }

    return correctorAssigned;
  }

  populateStudentList(dataRef) {
    const taskData = _.cloneDeep(dataRef);

    // if doesnt have task data and for test cross correction, then get all student correction for the student list
    if (this.testData && this.testData.correction_type === 'cross_correction' && !taskData) {
      this.subs.sink = this.testCorrectionService
        .getStudentsByTestAndSchoolForCrossCorrection(this.testId, this.schoolId)
        .subscribe((res) => {
          this.studentList = _.cloneDeep(res);
          const student_ids = [];
          const studentsList = _.cloneDeep(this.studentList);
          if (studentsList && studentsList.length) {
            studentsList.forEach((student) => {
              student_ids.push(student._id);
            });
          }
          if (this.loadOneTime) {
            this.loadOneTime = false;
            this.subs.sink = this.testCorrectionService
              .getAllTestCorrectionNonCorrectorByCross(this.testId, student_ids)
              .subscribe((response) => {
                this.isWaitingForResponse = false;
                this.populateStudentsWithTestCorrection(response);
              });
          }
        });
    } else {
      // If from cross correction then get the student is different
      if (taskData.type === 'cross_correction') {
        this.subs.sink = this.testCorrectionService.getStudentForCrossCorrMarksEntry(this.taskId).subscribe((students) => {
          this.studentList = _.cloneDeep(students);

          const student_ids = [];
          const studentsList = _.cloneDeep(this.studentList);
          if (studentsList && studentsList.length) {
            studentsList.forEach((student) => {
              student_ids.push(student._id);
            });
          }
          if (this.loadOneTime) {
            this.loadOneTime = false;
            this.subs.sink = this.testCorrectionService
              .getAllTestCorrectionNonCorrectorByCross(this.testId, student_ids)
              .subscribe((response) => {
                this.isWaitingForResponse = false;
                this.populateStudentsWithTestCorrection(response);
              });
          }
        });
      }
      // get student list data if task type is jury organization
      else if (taskData && taskData.type === 'jury_organization_marks_entry') {
        if (this.testData) {
          // Find the corrector by filtering corrector_assigned array in test data with task's user_selection id
          const correctorAssigned = this.getCorrectorAssigned(taskData);

          const selectedCorrector = correctorAssigned.find((corrector) => {
            if (corrector.corrector_id && corrector.corrector_id._id && taskData.user_selection && taskData.user_selection.user_id) {
              const correctorFound = corrector.corrector_id._id === taskData.user_selection.user_id._id;
              if (corrector.jury_member_id && corrector.jury_member_id._id && taskData.jury_member_id) {
                const juryIdFound = corrector.jury_member_id._id === taskData.jury_member_id;
                return juryIdFound && correctorFound;
              }
              return correctorFound;
            } else {
              return false;
            }
          });
          if (selectedCorrector) {
            this.studentList = selectedCorrector.students;
            this.studentList = this.studentList.filter((student) => (student.school ? student.school._id === this.schoolId : false));
            this.selectedCorrector = selectedCorrector;
          }
        }
      }
      // validate test for jury
      else if (
        (taskData && (taskData.type === 'validate_jury_organization' || taskData.type === 'certifier_validation')) ||
        (this.isTaskValidateTest() && this.testData.type === 'memoire_oral')
      ) {
        const correctorAssigned = this.getCorrectorAssigned(taskData);
        this.studentList = correctorAssigned.reduce((accumulator, currentValue) => accumulator.concat(currentValue.students), []);
        this.studentList = this.studentList.filter((student) => (student.school ? student.school._id === this.schoolId : false));
        this.studentList = _.uniqBy(this.studentList, '_id');

        this.selectedCorrector = taskData.user_selection.user_id._id;
      }

      // get student list data if task type is normal test or final retake
      else if (taskData && (taskData.description === 'Marks Entry' || taskData.type === 'final_retake_marks_entry')) {
        if (this.testData) {
          // Find the corrector by filtering corrector_assigned array in test data with task's user_selection id
          const correctorAssigned = this.getCorrectorAssigned(taskData);
          const selectedCorrector = correctorAssigned.find((corrector) => {
            if (corrector && corrector.corrector_id && corrector.corrector_id._id) {
              const schoolFound = corrector.school_id._id === this.schoolId;
              const correctorFound = corrector.corrector_id._id === taskData.user_selection.user_id._id;
              return schoolFound && correctorFound;
            } else {
              return false;
            }
          });
          if (selectedCorrector) {
            this.studentList = selectedCorrector.students;
            this.selectedCorrector = selectedCorrector;
          }
        }
      }
      // if task is validate test
      else if (this.isTaskValidateTest()) {
        this.getStudentFromCorrectorAssigned();
      }

      // if task data has transcript process id, it mean this mark entry is transcript retake mark entry. so only display 1 student
      if (taskData.transcript_process_id && taskData.transcript_process_id._id && taskData.student_id && taskData.student_id._id) {
        const transcriptRetakeStudent = this.studentList.find((stud) => stud._id === taskData.student_id._id);
        this.studentList = [transcriptRetakeStudent];
      }
    }
  }

  getStudentFromCorrectorAssigned() {
    // Find the corrector by filtering corrector_assigned array in test data with task's user_selection id
    const correctorAssigned = this.getCorrectorAssigned();

    if (this.testData.type === 'memoire_oral') {
      this.studentList = correctorAssigned.reduce((accumulator, currentValue) => accumulator.concat(currentValue.students), []);
      this.studentList = this.studentList.filter((student) => (student.school ? student.school._id === this.schoolId : false));
      this.studentList = _.uniqBy(this.studentList, '_id');
      this.selectedCorrector = null;
    } else {
      const temp = [];
      correctorAssigned.forEach((corrector) => {
        if (
          corrector &&
          corrector.school_id &&
          corrector.school_id._id === this.schoolId &&
          corrector.students &&
          corrector.students.length
        ) {
          corrector.students.forEach((student) => {
            temp.push(student);
          });
        }
      });

      this.studentList = temp;
      this.selectedCorrector = null;
    }
  }

  openInformation() {
    this.subs.sink = this.dialog
      .open(InformationDialogComponent, {
        disableClose: true,
        width: '600px',
        panelClass: 'certification-rule-pop-up',
        data: this.testData,
      })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
        }
      });
  }

  populateStudentRemaining(data) {
    if (data) {
      this.studentData = data;
      this.studentData = _.orderBy(this.studentData, ['last_name'], ['asc']);
      this.studentData = this.studentData.sort((a, b) => {
        return a.last_name.toLowerCase().localeCompare(b.last_name.toLowerCase());
      });
      this.studentSelectDetail = data;
    }
  }

  studentFilter(event) {
    this.studentData = this.originalStudentList.filter((student) =>
      student
        ? student.last_name
            .toLowerCase()
            .trim()
            .includes(this.studentSelect ? this.studentSelect.toLowerCase() : '')
        : '',
    );
    this.studentData = _.orderBy(this.studentData, ['last_name'], ['asc']);
    this.studentData = this.studentData.sort((a, b) => {
      return a.last_name.toLowerCase().localeCompare(b.last_name.toLowerCase());
    });
  }

  groupFilter(event) {
    if (this.groupModel && this.groupModel.length >= 3) {
      this.groupData = this.filteredGroupList.filter((groups) =>
        groups ? groups.name.toLowerCase().trim().includes(this.groupModel.toLowerCase()) : '',
      );
    }
  }

  updateFirstForm(eventData) {
    this.firstForm = _.cloneDeep(this.testCorrectionForm.value);
  }

  studentSelected(event) {
    // *************** needValidation only true when being called as eventEmitted from studentList to make the validation only triggers if user click on studentList UI.
    this.changeStudentSelection(event);
  }

  changeStudentSelection(event) {
    this.isStudent = true;
    this.isGroup = false;
    this.studentSelectDetail = event;
    this.testCorrectionForm.get('student').patchValue(event._id);

    this.studentSpecializationId = event?.specialization_id;
    this.selectedStudentId = event._id ? event._id : '';
    this.studentSelect = event.last_name.toUpperCase() + ' ' + event.first_name;
    this.setStudentJobDescriptionData();
    if (event.testCorrectionId) {
      this.testCorrectionId = event.testCorrectionId;
    } else {
      this.testCorrectionId = null;
      this.formReset();
    }
  }

  setMissingCopyDocument(event) {
    if (event) {
      this.missingCopyDocument = event;
    }
  }

  setElementOfProofDocument(event) {
    if (event) {
      this.elementOfProofDocument = event;
    }
  }

  deleteMissingCopyDoc() {
    Swal.fire({
      type: 'question',
      title: this.translate.instant('JUSTIFY_S2.TITLE'),
      text: this.translate.instant('JUSTIFY_S2.TEXT'),
      showCancelButton: true,
      allowEscapeKey: true,
      confirmButtonText: this.translate.instant('JUSTIFY_S2.BUTTON_1'),
      cancelButtonText: this.translate.instant('JUSTIFY_S2.BUTTON_2'),
    }).then((result) => {
      if (result.value) {
        this.resetMissingCopyDoc();
        Swal.fire({ type: 'success', title: 'Bravo!' });
      }
    });
  }

  resetMissingCopyDoc() {
    this.selectedFile = null;
    this.uploadDocForm = {};
    this.missingCopyDocument = null;
    this.testCorrectionForm.get('document_for_missing_copy').setValue([]);
  }

  resetElementOfProofDoc() {
    this.selectedFile = null;
    this.uploadDocForm = {};
    this.elementOfProofDocument = null;
    this.testCorrectionForm.get('element_of_proof_doc').setValue(null);
  }

  editMissingCopyDoc() {
    this.openUploadWindow();
  }

  setStudentJobDescriptionData() {
    // set student's job description data if test is auto/pro competence

    if (this.testData.type === 'academic_auto_evaluation' || this.testData.type === 'academic_pro_evaluation') {
      const selectedStudentData = this.studentList.find((student) => student._id === this.studentSelectDetail._id);
      if (
        selectedStudentData &&
        selectedStudentData.job_description_id &&
        selectedStudentData.job_description_id.block_of_template_competences &&
        selectedStudentData.job_description_id.block_of_template_competences.length
      ) {
        this.studentJobDescriptions = [];
        selectedStudentData.job_description_id.block_of_template_competences.forEach((blockTemplate) => {
          blockTemplate.competence_templates.forEach((competenceTemplate) => {
            this.studentJobDescriptions.push(competenceTemplate);
          });
        });
      } else {
        this.studentJobDescriptions = [];
      }
    }
  }

  groupSelected(event) {
    this.selectedGroupData = event;
    this.isStudent = false;
    this.isGroup = true;
    const tempGroupList = _.cloneDeep(event);
    const tempResult = [];
    if (event) {
      const foundStudent = _.find(this.groupList, (grp) => grp._id === event._id);
      this.groupSelect = event.name;
      this.groupModel = event.name;
      this.test_group_id = event._id;
      if (foundStudent && foundStudent.students) {
        foundStudent.students.forEach((data) => {
          tempResult.push({
            testCorrectionId: data.individual_test_correction_id ? data.individual_test_correction_id : null,
            _id: data.student_id._id,
            first_name: data.student_id.first_name,
            last_name: data.student_id.last_name,
            civility: data.student_id.civility,
            doc: null,
            missing_copy: false,
            is_do_not_participated: data.is_do_not_participated ? data.is_do_not_participated : false,
            is_justified: null,
            score: null,
            company:
              data.student_id.companies && data.student_id.companies.length ? this.getCompanyAndMentor(data.student_id.companies) : null,
            specialization_id: data?.specialization?._id,
          });
        });
      }

      this.studentList = tempResult;

      // Get all studentlist
      const tempStudent = [];
      this.groupList.forEach((groupData) => {
        if (groupData.students && groupData.students.length) {
          groupData.students.forEach((data) => {
            tempStudent.push({
              testCorrectionId: data.individual_test_correction_id ? data.individual_test_correction_id : null,
              _id: data.student_id._id,
              first_name: data.student_id.first_name,
              last_name: data.student_id.last_name,
              doc: null,
              missing_copy: false,
              is_justified: null,
              is_do_not_participated:
                data && data.student_id && data.student_id.is_do_not_participated ? data.student_id.is_do_not_participated : false,
              score: null,
              groupId: groupData._id,
              company:
                data.student_id.companies && data.student_id.companies.length ? this.getCompanyAndMentor(data.student_id.companies) : null,
              specialization_id: data?.student_id?.specialization?._id,
            });
          });
        }
      });
      this.studentOfAllGroupList = tempStudent;

      if (event.groupTestCorrectionId) {
        this.isWaitingForResponse = true;
        this.subs.sink = this.testCorrectionService.getOneGroupTestCorrection(event.groupTestCorrectionId).subscribe((resp) => {
          this.isWaitingForResponse = false;
          const patchData = this.formatDataBeforePatchGroup(_.cloneDeep(resp));
          this.getFilteredStudentListInGroup();
          this.dataUpdatedGroup(patchData);
        });
        this.groupTestCorrectionId = event.groupTestCorrectionId;
      } else {
        this.groupTestCorrectionId = null;
        this.formReset();
        this.filteredStudentList = tempResult;
        this.filteredStudentList = _.orderBy(this.filteredStudentList, ['last_name'], ['asc']);
        this.filteredStudentList = this.filteredStudentList.sort((a, b) => {
          return a.last_name.toLowerCase().localeCompare(b.last_name.toLowerCase());
        });
      }
    }
  }

  formReset() {
    this.testCorrectionForm.reset();
    this.initTestCorrectionForm();
    if (this.testId) {
      this.populateTestData(this.testData);
    }
    if (this.taskId) {
      this.populateTestCorrectionFormWithTaskData();
      this.populateStudentList(this.taskData);
    }
    // add empty multiple_dates field inside subsection if date type "multiple_date"
    const testData = _.cloneDeep(this.testData);
    if (testData.date_type === 'multiple_date') {
      const sections: SectionEvalskill[] = testData.correction_grid.correction.sections_evalskill;
      sections.forEach((section, sectionIndex) => {
        section.sub_sections.forEach((subSection, subSectionIndex) => {
          this.initMultipleDateForm(sectionIndex, subSectionIndex);
        });
      });
    }
    this.testCorrectionForm.get('student').patchValue(this.selectedStudentId);
    this.testCorrectionForm.get('corrector').patchValue(this.selectedCorrectorId);
    this.firstForm = _.cloneDeep(this.testCorrectionForm.value);
  }

  refreshMultipleDateNotationGrid(isRefresh: boolean) {
    this.isRefreshMultipleDateNotationGrid = isRefresh;
  }

  refreshJuryNotationGrid(isRefresh: boolean) {
    this.isRefreshJuryNotationGrid = isRefresh;
  }

  updateSectionEvalskillFormData(sectionEvalskillData: any[]) {
    // patch sections_evalskill form per section and per subsection
    this.getSectionEvalskillForm().controls.forEach((secEvalForm, secEvalIdx) => {
      // use ref_id to populate data accurately to their form
      const secEvalRefId = secEvalForm.get('ref_id').value;
      const sectionData = sectionEvalskillData.find((sec) => sec.ref_id === secEvalRefId);
      if (sectionData) {
        const subSectionEvalskillData = sectionData?.sub_sections || [];
        delete sectionData.sub_sections;
        secEvalForm.patchValue(sectionData);
        this.getSubSectionEvalskillForm(secEvalIdx).controls.forEach((subSecForm, subSecIdx) => {
          const subSecEvalRefId = subSecForm.get('ref_id').value;
          const subSectionData = subSectionEvalskillData.find((subsec) => subsec.ref_id === subSecEvalRefId);
          if (subSectionData) {
            subSecForm.patchValue(subSectionData);
          }
        });
      }
    });
  }

  setIsJustified(event: MatSlideToggleChange) {
    this.testCorrectionForm.get('is_justified').setValue(event.checked ? 'yes' : 'no');
  }

  openUploadElementOfProof() {
    this.elementOfProofUploader.nativeElement.click();
  }

  openUploadWindow() {
    this.fileUploader.nativeElement.click();
  }

  addFile(fileInput: Event, type: string) {
    this.selectedFile = (<HTMLInputElement>fileInput.target).files[0];

    if (this.selectedFile) {
      this.uploadFile(type);
    }
  }

  getTodayDate() {
    const todayUTC = this.parseLocaltoUTC.transformDate(moment().format('DD/MM/YYYY'), '00:00');
    return todayUTC;
  }

  getTodayTime() {
    return '15:59';
  }

  uploadFile(type) {
    // convert selectedFile size in byte to GB by dividing the value by 1e+9
    const selectedFileSizeInGb = this.selectedFile.size / 1000000000;

    if (selectedFileSizeInGb < 1) {
      this.isWaitingForResponse = true;
      this.subs.sink = this.fileUploadService.singleUpload(this.selectedFile).subscribe(
        (resp) => {
          this.isWaitingForResponse = false;
          if (resp && resp.s3_file_name) {
            this.uploadDocForm.type_of_document = 'application/pdf';
            this.uploadDocForm.document_generation_type = type;
            this.uploadDocForm.s3_file_name = resp.s3_file_name;
            this.uploadDocForm.parent_rncp_title = this.titleData._id;
            if (this.testData.group_test) {
              this.uploadDocForm.document_name = `${this.titleData.short_name} ${this.testData.name} ${this.selectedGroupData.name}`;
              this.uploadDocForm.group_test_correction = this.groupTestCorrectionId;
            } else {
              this.uploadDocForm.document_name = `${this.titleData.short_name} ${this.testData.name} ${this.studentSelectDetail.last_name} ${this.studentSelectDetail.first_name}`;
              this.uploadDocForm.test_correction = this.testCorrectionId;
            }
            if (type === 'elementOfProof') {
              this.uploadDocForm.document_name = `${this.translate.instant('element_of_proof')} - ${this.testData.name}`;
              this.uploadDocForm.uploaded_for_student = this.testCorrectionForm.get('student').value;
            }
            this.uploadDocForm.publication_date = {
              publication_date: { date: this.getTodayDate(), time: this.getTodayTime() },
            };
            this.createAcadDoc(type);
          }
        },
        (err) => {
          this.isWaitingForResponse = false;
          Swal.fire({
            type: 'error',
            title: 'Error !',
            text: err && err['message'] ? err['message'] : err,
            confirmButtonText: 'OK',
          }).then((res) => {});
        },
      );
    } else {
      // all of code in else is only sweet alert and removing invalid file
    }
  }

  createAcadDoc(type: string) {
    this.subs.sink = this.acadKitService.createAcadDocJustify(this.uploadDocForm).subscribe((resp) => {
      if (type === 'missingCopy') {
        this.testCorrectionForm.get('document_for_missing_copy').patchValue([resp._id]);
        this.missingCopyDocument = resp;
      } else if (type === 'elementOfProof') {
        this.testCorrectionForm.get('element_of_proof_doc').patchValue(resp._id);
        this.elementOfProofDocument = resp;
      }
      Swal.fire({
        type: 'success',
        title: this.translate.instant('JUSTIFY_S1.TITLE'),
        text: this.translate.instant('JUSTIFY_S1.TEXT'),
        confirmButtonText: this.translate.instant('JUSTIFY_S1.BUTTON_1'),
      });
    });
  }

  dataUpdated(event: TestCorrectionInput) {
    if (!event.correction_grid.header.fields.length) {
      this.resetHeaderForm();
    }
    if (!event.correction_grid.footer.fields.length) {
      this.resetFooterForm();
    }
    if (!event.correction_grid.correction.bonuses.length) {
      this.resetBonusForm();
    }
    if (!event.correction_grid.correction.penalties.length) {
      this.resetPenaltyForm();
    }
    if (!event.correction_grid.correction.sections.length) {
      this.resetSectionForm();
    }
    this.reMapSectionEvalSkillForm();
    if (event.correction_grid.correction?.sections_evalskill?.length) {
      event.correction_grid.correction.sections_evalskill
        .filter((section) => !section?.specialization_id || section?.specialization_id === this.studentSpecializationId)
        .forEach((section, sectionIndex) => {
          section.sub_sections.forEach((subsec, subsecIndex) => {
            // remove rating validator in subsection if is_criteria_evaluated false
            if (subsec.is_criteria_evaluated === false) {
              if (
                this.getSubSectionEvalskillForm(sectionIndex) &&
                this.getSubSectionEvalskillForm(sectionIndex).at(subsecIndex) &&
                this.getSubSectionEvalskillForm(sectionIndex).at(subsecIndex).get('rating')
              ) {
                this.getSubSectionEvalskillForm(sectionIndex).at(subsecIndex).get('rating').clearValidators();
                this.getSubSectionEvalskillForm(sectionIndex).at(subsecIndex).get('rating').updateValueAndValidity();
              }
            }
            // assign multiple date data from API to subsection form if test date type is multiple date
            if (this.testData && this.testData.date_type === 'multiple_date') {
              this.getMultipleDatesSubSectionForm(sectionIndex, subsecIndex).clear();
              if (subsec.multiple_dates && subsec.multiple_dates.length) {
                subsec.multiple_dates.forEach((dateData, dateIndex) => {
                  this.addMultipleDatesSubSectionForm(sectionIndex, subsecIndex);
                  if (this.testData.correction_grid.correction.show_number_marks_column) {
                    this.getMultipleDatesSubSectionForm(sectionIndex, subsecIndex)
                      .at(dateIndex)
                      .get('marks')
                      .setValidators([Validators.required]);
                  } else {
                    this.getMultipleDatesSubSectionForm(sectionIndex, subsecIndex)
                      .at(dateIndex)
                      .get('score_conversion_id')
                      .setValidators([Validators.required]);
                  }
                });
              }
            }
          });
        });
    }
    this.getExpectedDocumentForm().clear();
    if (event && event.expected_documents && event.expected_documents.length) {
      event.expected_documents.forEach((doc) => this.addExpectedDocumentForm());
    }
    if (!event.document_for_missing_copy || !event.document_for_missing_copy.length) {
      this.resetMissingCopyDoc();
    }
    if (!event.element_of_proof_doc) {
      this.resetElementOfProofDoc();
    }
    if (!event.date) {
      delete event.date;
    }
    // separate patch data with sections_evalskill because sections_evalskill form need to patched per section and per subsection
    if (event && event.correction_grid && event.correction_grid.correction && event.correction_grid.correction.sections_evalskill) {
      const sectionEvalskillData = event.correction_grid.correction.sections_evalskill;
      delete event.correction_grid.correction.sections_evalskill;
      this.updateSectionEvalskillFormData(sectionEvalskillData);
    }
    this.testCorrectionForm.patchValue(event);
    this.firstForm = _.cloneDeep(this.testCorrectionForm.value);
  }

  dataUpdatedGroup(event: TestCorrectionInput) {
    if (!event.correction_grid.header.fields.length) {
      this.resetHeaderForm();
    }
    if (!event.correction_grid.footer.fields.length) {
      this.resetFooterForm();
    }
    if (!event.correction_grid.correction.bonuses.length) {
      this.resetBonusForm();
    }
    if (!event.correction_grid.correction.penalties.length) {
      this.resetPenaltyForm();
    }
    if (!event.correction_grid.correction.sections.length) {
      this.resetSectionForm();
    }
    this.reMapSectionEvalSkillForm();
    if (event.correction_grid.correction?.sections_evalskill?.length) {
      event.correction_grid.correction.sections_evalskill.forEach((section, sectionIndex) => {
        section.sub_sections.forEach((subsec, subsecIndex) => {
          // remove rating validator in subsection if is_criteria_evaluated false
          if (subsec.is_criteria_evaluated === false) {
            this.getSubSectionEvalskillForm(sectionIndex).at(subsecIndex).get('rating').clearValidators();
            this.getSubSectionEvalskillForm(sectionIndex).at(subsecIndex).get('rating').updateValueAndValidity();
          }
        });
      });
    }

    this.getExpectedDocumentForm().clear();
    if (event && event.expected_documents && event.expected_documents.length) {
      event.expected_documents.forEach((doc) => this.addExpectedDocumentForm());
    }
    if (!event.document_for_missing_copy || !event.document_for_missing_copy.length) {
      this.resetMissingCopyDoc();
    }
    if (!event.element_of_proof_doc) {
      this.resetElementOfProofDoc();
    }
    if (!event.date) {
      delete event.date;
    }
    // separate patch data with sections_evalskill because sections_evalskill form need to patched per section and per subsection
    if (event && event.correction_grid && event.correction_grid.correction && event.correction_grid.correction.sections_evalskill) {
      const sectionEvalskillData = event.correction_grid.correction.sections_evalskill;
      delete event.correction_grid.correction.sections_evalskill;
      this.updateSectionEvalskillFormData(sectionEvalskillData);
    }
    this.testCorrectionForm.patchValue(event);
    this.firstForm = _.cloneDeep(this.testCorrectionForm.value);
  }

  formUpdated(event: TestCorrectionInput) {
    const oldForm = _.cloneDeep(this.testCorrectionForm.value);
    this.initTestCorrectionForm();

    // populate the header field
    if (event) {
      if (
        event.correction_grid &&
        event.correction_grid.header &&
        event.correction_grid.header.fields &&
        event.correction_grid.header.fields.length
      ) {
        // create formarray
        event.correction_grid.header.fields.forEach((headerField, index) => {
          this.addHeaderFieldsFormArray();
          if (headerField.data_type === 'checkbox') {
            this.getHeaderFieldsFormArray().at(index).get('value').setValidators([Validators.requiredTrue]);
            this.getHeaderFieldsFormArray().at(index).get('value').updateValueAndValidity();
          }
        });
      }
    }

    // populate the footer field
    if (event) {
      if (
        event.correction_grid &&
        event.correction_grid.footer &&
        event.correction_grid.footer.fields &&
        event.correction_grid.footer.fields.length
      ) {
        // create formarray
        event.correction_grid.footer.fields.forEach((footerField, index) => {
          this.addFooterFieldsFormArray();
          if (footerField.data_type === 'checkbox') {
            this.getFooterFieldsFormArray().at(index).get('value').setValidators([Validators.requiredTrue]);
            this.getFooterFieldsFormArray().at(index).get('value').updateValueAndValidity();
          }
        });
      }
    }

    // populate the expected document field
    if (event && event.expected_documents && event.expected_documents.length) {
      this.addExpectedDocumentForm();
    }

    // populate the section and subsection field
    if (event) {
      if (event.correction_grid && event.correction_grid.correction) {
        if (event.correction_grid.correction.sections && event.correction_grid.correction.sections.length) {
          // create formarray
          event.correction_grid.correction.sections.forEach((section, sectionIndex) => {
            this.addSectionForm();
            section.sub_sections.forEach((subSection, subSectionIndex) => {
              this.addSubSectionForm(sectionIndex);
              if (!event.missing_copy && this.testData.type !== 'academic_recommendation') {
                this.getSubSectionForm(sectionIndex).at(subSectionIndex).get('rating').setValidators([Validators.required]);
                this.getSubSectionForm(sectionIndex).at(subSectionIndex).get('rating').updateValueAndValidity();
              } else if (!event.missing_copy && this.testData.type === 'academic_recommendation') {
                this.getSubSectionForm(sectionIndex).at(subSectionIndex).get('comments').setValidators([Validators.required]);
                this.getSubSectionForm(sectionIndex).at(subSectionIndex).get('comments').updateValueAndValidity();
              }
            });
          });
        }
        if (event.correction_grid.correction.sections_evalskill && event.correction_grid.correction.sections_evalskill.length) {
          // create formarray
          event.correction_grid.correction.sections_evalskill.forEach((section, sectionIndex) => {
            this.addSectionEvalskillForm();
            section.sub_sections.forEach((subSection, subSectionIndex) => {
              this.addSubSectionEvalskillForm(sectionIndex);
              if (!event.missing_copy && subSection.is_selected) {
                this.getSubSectionEvalskillForm(sectionIndex).at(subSectionIndex).get('rating').setValidators([Validators.required]);
                this.getSubSectionEvalskillForm(sectionIndex).at(subSectionIndex).get('rating').updateValueAndValidity();
              }
            });
          });
        }
        if (event.correction_grid.correction.penalties && event.correction_grid.correction.penalties.length) {
          event.correction_grid.correction.penalties.forEach((penalty, penaltyIndex) => {
            this.addPenaltyFieldForm();
            this.getPenaltiesFieldForm().at(penaltyIndex).get('rating').setValidators([Validators.required]);
            this.getPenaltiesFieldForm().at(penaltyIndex).get('rating').updateValueAndValidity();
          });
        }
        if (event.correction_grid.correction.bonuses && event.correction_grid.correction.bonuses.length) {
          event.correction_grid.correction.bonuses.forEach((bonus, bonusIndex) => {
            this.addBonusFieldForm();
            this.getBonusesFieldForm().at(bonusIndex).get('rating').setValidators([Validators.required]);
            this.getBonusesFieldForm().at(bonusIndex).get('rating').updateValueAndValidity();
          });
        }
        if (this.testData && this.testData.correction_grid && this.testData.correction_grid.correction) {
          const correction: Correction = this.testData.correction_grid.correction;
          if (correction.show_final_comment) {
            this.getCorrectionForm().get('final_comment').setValidators([Validators.required]);
            this.getCorrectionForm().get('final_comment').updateValueAndValidity();
          }
        }
      }
    }
  }

  formUpdatedGroup(event: TestCorrectionInput) {
    const oldForm = _.cloneDeep(this.testCorrectionForm.value);
    this.initTestCorrectionForm();

    // populate the header field
    if (event) {
      if (
        event.correction_grid &&
        event.correction_grid.header &&
        event.correction_grid.header.fields &&
        event.correction_grid.header.fields.length
      ) {
        // create formarray
        event.correction_grid.header.fields.forEach((headerField, index) => {
          this.addHeaderFieldsFormArray();
          if (headerField.data_type === 'checkbox') {
            this.getHeaderFieldsFormArray().at(index).get('value').setValidators([Validators.requiredTrue]);
            this.getHeaderFieldsFormArray().at(index).get('value').updateValueAndValidity();
          }
        });
      }
    }

    // populate the footer field
    if (event) {
      if (
        event.correction_grid &&
        event.correction_grid.footer &&
        event.correction_grid.footer.fields &&
        event.correction_grid.footer.fields.length
      ) {
        // create formarray
        event.correction_grid.footer.fields.forEach((footerField, index) => {
          this.addFooterFieldsFormArray();
          if (footerField.data_type === 'checkbox') {
            this.getFooterFieldsFormArray().at(index).get('value').setValidators([Validators.requiredTrue]);
            this.getFooterFieldsFormArray().at(index).get('value').updateValueAndValidity();
          }
        });
      }
    }

    // populate the expected document field
    if (event && event.expected_documents && event.expected_documents.length) {
      this.addExpectedDocumentForm();
    }

    // populate the section and subsection field
    if (event) {
      if (event.correction_grid && event.correction_grid.correction) {
        if (event.correction_grid.correction.sections && event.correction_grid.correction.sections.length) {
          // create formarray
          event.correction_grid.correction.sections.forEach((section, sectionIndex) => {
            this.addSectionForm();
            section.sub_sections.forEach((subSection, subSectionIndex) => {
              this.addSubSectionForm(sectionIndex);
              if (!event.missing_copy && !event.is_do_not_participated && this.testData.type !== 'academic_recommendation') {
                this.getSubSectionForm(sectionIndex).at(subSectionIndex).get('rating').setValidators([Validators.required]);
                this.getSubSectionForm(sectionIndex).at(subSectionIndex).get('rating').updateValueAndValidity();
              } else if (!event.missing_copy && !event.is_do_not_participated && this.testData.type === 'academic_recommendation') {
                this.getSubSectionForm(sectionIndex).at(subSectionIndex).get('comments').setValidators([Validators.required]);
                this.getSubSectionForm(sectionIndex).at(subSectionIndex).get('comments').updateValueAndValidity();
              }
            });
          });
        }
        if (event.correction_grid.correction.sections_evalskill && event.correction_grid.correction.sections_evalskill.length) {
          // create formarray
          event.correction_grid.correction.sections_evalskill.forEach((section, sectionIndex) => {
            this.addSectionEvalskillForm();
            section.sub_sections.forEach((subSection, subSectionIndex) => {
              this.addSubSectionEvalskillForm(sectionIndex);
              if (!event.missing_copy && !event.is_do_not_participated && subSection.is_selected) {
                this.getSubSectionEvalskillForm(sectionIndex).at(subSectionIndex).get('rating').setValidators([Validators.required]);
                this.getSubSectionEvalskillForm(sectionIndex).at(subSectionIndex).get('rating').updateValueAndValidity();
              }
            });
          });
        }
        if (event.correction_grid.correction.penalties && event.correction_grid.correction.penalties.length) {
          event.correction_grid.correction.penalties.forEach((penalty, penaltyIndex) => {
            this.addPenaltyFieldForm();
            this.getPenaltiesFieldForm().at(penaltyIndex).get('rating').setValidators([Validators.required]);
            this.getPenaltiesFieldForm().at(penaltyIndex).get('rating').updateValueAndValidity();
          });
        }
        if (event.correction_grid.correction.bonuses && event.correction_grid.correction.bonuses.length) {
          event.correction_grid.correction.bonuses.forEach((bonus, bonusIndex) => {
            this.addBonusFieldForm();
            this.getBonusesFieldForm().at(bonusIndex).get('rating').setValidators([Validators.required]);
            this.getBonusesFieldForm().at(bonusIndex).get('rating').updateValueAndValidity();
          });
        }
        if (this.testData && this.testData.correction_grid && this.testData.correction_grid.correction) {
          const correction: Correction = this.testData.correction_grid.correction;
          if (correction.show_final_comment) {
            this.getCorrectionForm().get('final_comment').setValidators([Validators.required]);
            this.getCorrectionForm().get('final_comment').updateValueAndValidity();
          }
        }
      }
    }
  }

  updateJustification(event: string) {
    if (event && event === 'student') {
      this.getFilteredStudentList();
    } else if (event && event === 'group') {
      this.getFilteredGroupList();
    }
  }

  populateFormFirstTime() {
    if (this.taskData && this.taskData.task_status === 'done') {
      // if task status is done, select the first student and auto populate the mark entry form with his data
      this.autoPopulateFormWithStudentTestCorrection(this.filteredStudentList[0].testCorrectionId);
      this.studentSelected(this.filteredStudentList[0]);
    } else {
      const nonCorrectedStudent = this.filteredStudentList.find((student) => student.score === null);
      if (nonCorrectedStudent) {
        // if there is any student that has no test correction data yet, set this student as selected
        this.studentSelect = this.displayStudentName(nonCorrectedStudent._id);
        this.testCorrectionForm.get('student').patchValue(nonCorrectedStudent._id);
        this.firstForm = _.cloneDeep(this.testCorrectionForm.value);
        this.studentSelected(nonCorrectedStudent);
        // add empty multiple_dates field inside subsection if date type "multiple_date"
        const testData = _.cloneDeep(this.testData);
        if (testData.date_type === 'multiple_date') {
          const sections: SectionEvalskill[] = testData.correction_grid.correction.sections_evalskill;
          sections.forEach((section, sectionIndex) => {
            section.sub_sections.forEach((subSection, subSectionIndex) => {
              this.initMultipleDateForm(sectionIndex, subSectionIndex);
            });
          });
        }
        // if student dont have score but already has test correction id
        if (nonCorrectedStudent.testCorrectionId) {
          this.autoPopulateFormWithStudentTestCorrection(nonCorrectedStudent.testCorrectionId);
        }
      } else {
        // if all student's mark already inputted, select the first student and auto populate the mark entry form with his data
        if (this.filteredStudentList.length && this.filteredStudentList[0].testCorrectionId) {
          this.autoPopulateFormWithStudentTestCorrection(this.filteredStudentList[0].testCorrectionId);
          this.studentSelected(this.filteredStudentList[0]);
        }
      }
    }
  }

  autoPopulateFormWithStudentTestCorrection(testCorrectionId: string) {
    this.isWaitingForResponse = true;
    this.subs.sink = this.testCorrectionService.getTestCorrection(testCorrectionId).subscribe((resp) => {
      this.isWaitingForResponse = false;
      this.loadReady = true;
      const patchData = this.formatDataBeforePatch(_.cloneDeep(resp));

      this.dataUpdated(patchData);
      this.studentSelect = this.displayStudentName(patchData.student);
      this.testCorrectionForm.get('student').patchValue(patchData.student);
      this.firstForm = _.cloneDeep(this.testCorrectionForm.value);
      this.testCorrectionId = testCorrectionId;
    });
  }

  selectStudentFromDropdown(studentData) {
    // populate selected student from student remaining dropdown. copy the code from student list component
    if (studentData && studentData.testCorrectionId) {
      this.refreshMultipleDateNotationGrid(true);
      this.refreshJuryNotationGrid(true);
      this.subs.sink = this.testCorrectionService.getTestCorrection(studentData.testCorrectionId).subscribe((resp) => {
        const patchData = this.formatDataBeforePatch(_.cloneDeep(resp));
        this.dataUpdated(patchData);
        this.refreshMultipleDateNotationGrid(false);
        this.refreshJuryNotationGrid(false);
      });
    } else {
      this.testCorrectionForm.get('student').patchValue(studentData._id);
    }
    this.studentSelected(studentData);
  }

  selectGroupFromDropdown(groupData) {
    // populate selected group from group remaining dropdown. copy the code from group list component
    if (groupData && groupData._id) {
      const groups = _.cloneDeep(this.filteredGroupList);
      const selectedGroup = groups.find((grp) => grp._id === groupData._id);
      this.groupSelected(selectedGroup);
    }
  }

  selectStudentOfGroupFromDropdown(studentData) {
    // populate selected student of a group from dropdown. copy the code from group list component
    if (studentData && studentData.testCorrectionId) {
      this.subs.sink = this.testCorrectionService.getTestCorrection(studentData.testCorrectionId).subscribe((resp) => {
        const patchData = this.formatDataBeforePatch(_.cloneDeep(resp));
        this.dataUpdated(patchData);
      });
    } else {
      this.testCorrectionForm.get('student').patchValue(studentData._id);
    }
    this.studentSelected(studentData);
  }

  getTranslatedDate(date) {
    if (date && date.date_utc && date.time_utc) {
      return this.parseUTCtoLocal.transformDate(date.date_utc, date.time_utc);
    } else {
      return '';
    }
  }

  setMissingCopyJustification() {
    // trigger this when saving
    if (this.isTaskValidateTest()) {
      const justifyStatus = this.testCorrectionForm.get('is_justified').value;
      this.testCorrectionForm.get('is_justified').setValue(justifyStatus ? justifyStatus : 'no');
    }
  }

  formatPayload() {
    this.setMissingCopyJustification();
    const data = _.cloneDeep(this.testCorrectionForm.value);

    // remove document expected data if student dont upload document expected yet
    if (data && data.expected_documents && data.expected_documents[0] && !data.expected_documents[0].document) {
      data.expected_documents = [];
    }

    // Remove unnessecary data from correction form
    if (data && data.correction_grid && data.correction_grid.correction) {
      if (data.correction_grid.correction.sections && data.correction_grid.correction.sections.length) {
        data.correction_grid.correction.sections.forEach((section) => {
          if (section && section.sub_sections && section.sub_sections.length) {
            section.sub_sections.forEach((sub_section) => {
              if (sub_section.marks_number && typeof sub_section.marks_number === 'string') {
                sub_section.marks_number = +sub_section.marks_number;
              }
              if (sub_section.jurys && sub_section.jurys.length) {
                sub_section.jurys.forEach((jury) => {
                  if (jury.marks && typeof jury.marks === 'string') {
                    jury.marks = Number(jury.marks);
                  }
                });
              }
              delete sub_section.showFullDirection;
              delete sub_section.showFullTitle;
            });
          }
        });
      }
      if (data.correction_grid.correction.sections_evalskill && data.correction_grid.correction.sections_evalskill.length) {
        data.correction_grid.correction.sections_evalskill.forEach((section) => {
          if (section && section.sub_sections && section.sub_sections.length) {
            section.sub_sections.forEach((sub_section) => {
              if (sub_section.marks_number && typeof sub_section.marks_number === 'string') {
                sub_section.marks_number = +sub_section.marks_number;
              }
              if (sub_section.jurys && sub_section.jurys.length) {
                sub_section.jurys.forEach((jury) => {
                  if (jury.marks && typeof jury.marks === 'string') {
                    jury.marks = Number(jury.marks);
                  }
                });
              }
              // if (sub_section.multiple_dates && sub_section.multiple_dates.length) {
              //   sub_section.multiple_dates.forEach(multipleDate => {
              //     delete multipleDate.tempTime;
              //   });
              // }
              delete sub_section.showFullDirection;
              delete sub_section.showFullTitle;
            });
          }
        });
      }

      if (this.testData && this.testData.correction_type === 'cross_correction') {
        const studentList = _.cloneDeep(this.studentList);
        const studentData = studentList.filter((list) => list._id === data.student);
        if (studentData && studentData.length) {
          data.school_id = studentData[0].school._id;
        }
      }
    }

    // Change header value
    if (
      data &&
      data.correction_grid &&
      data.correction_grid.header &&
      data.correction_grid.header.fields &&
      data.correction_grid.header.fields.length
    ) {
      data.correction_grid.header.fields.forEach((header_field) => {
        if (header_field && header_field.type) {
          const tempValue = header_field.value;

          switch (header_field.type) {
            case 'date':
              header_field.value = {
                date: this.parseLocaltoUTC.transformJavascriptDate(header_field.value),
              };
              break;
            case 'text':
              header_field.value = {
                text: tempValue,
              };
              break;
            case 'number':
              header_field.value = {
                number: +tempValue,
              };
              break;
            case 'pfereferal':
              header_field.value = {
                pfereferal: tempValue,
              };
              break;
            case 'jurymember':
              header_field.value = {
                jury_member: tempValue,
              };
              break;
            case 'longtext':
              header_field.value = {
                long_text: tempValue,
              };
              break;
            case 'signature':
              header_field.value = {
                signature: tempValue,
              };
              break;
            case 'correctername':
              header_field.value = {
                correcter_name: tempValue,
              };
              break;
            case 'mentorname':
              header_field.value = {
                mentor_name: tempValue,
              };
              break;
            // case 'groupname':
            //   header_field.value = {
            //     group_name: tempValue,
            //   };
            //   break;
            default:
              break;
          }
        }
      });
    }

    // Change footer value
    if (
      data &&
      data.correction_grid &&
      data.correction_grid.footer &&
      data.correction_grid.footer.fields &&
      data.correction_grid.footer.fields.length
    ) {
      data.correction_grid.footer.fields.forEach((footer_field) => {
        if (footer_field && footer_field.type) {
          const tempValue = footer_field.value;

          switch (footer_field.type) {
            case 'date':
              footer_field.value = {
                date: this.parseLocaltoUTC.transformJavascriptDate(footer_field.value),
              };
              break;
            case 'text':
              footer_field.value = {
                text: tempValue,
              };
              break;
            case 'number':
              footer_field.value = {
                number: +tempValue,
              };
              break;
            case 'pfereferal':
              footer_field.value = {
                pfereferal: tempValue,
              };
              break;
            case 'jurymember':
              footer_field.value = {
                jury_member: tempValue,
              };
              break;
            case 'longtext':
              footer_field.value = {
                long_text: tempValue,
              };
              break;
            case 'signature':
              footer_field.value = {
                signature: tempValue,
              };
              break;
            case 'correctername':
              footer_field.value = {
                correcter_name: tempValue,
              };
              break;
            case 'mentorname':
              footer_field.value = {
                mentor_name: tempValue,
              };
              break;
            // case 'groupname':
            //   footer_field.value = {
            //     group_name: tempValue,
            //   };
            //   break;
            default:
              break;
          }
        }
      });
    }

    // if missing copy, set total and additional total to 0
    if ((data.missing_copy || data.is_do_not_participated) && data.correction_grid && data.correction_grid.correction) {
      data.correction_grid.correction.additional_total = 0;
      data.correction_grid.correction.total = 0;
      if (data.correction_grid.correction.sections && data.correction_grid.correction.sections.length) {
        data.correction_grid.correction.sections.forEach((section, index) => {
          section.rating = 0;
          section.comment = '';
          if (section.sub_sections && section.sub_sections.length) {
            section.sub_sections.forEach((subSection, subIndex) => {
              subSection.comments = '';
              subSection.marks_letter = '';
              subSection.marks_number = 0;
              subSection.rating = 0;
            });
          }
        });
      }

      if (data.correction_grid.correction.sections_evalskill && data.correction_grid.correction.sections_evalskill.length) {
        data.correction_grid.correction.sections_evalskill.forEach((section, index) => {
          section.rating = 0;
          section.comment = '';
          if (section.sub_sections && section.sub_sections.length) {
            section.sub_sections.forEach((subSection, subIndex) => {
              subSection.comments = '';
              subSection.marks_letter = '';
              subSection.marks_number = 0;
              subSection.rating = 0;
            });
          }
        });
      }
      if (data.correction_grid.correction.penalties && data.correction_grid.correction.penalties.length) {
        data.correction_grid.correction.penalties.forEach((penalty, index) => {
          data.correction_grid.correction.penalties[index].rating = 0;
        });
      }
      if (data.correction_grid.correction.bonuses && data.correction_grid.correction.bonuses.length) {
        data.correction_grid.correction.bonuses.forEach((bonus, index) => {
          data.correction_grid.correction.bonuses[index].rating = 0;
        });
      }
    }

    if (!data.document_for_missing_copy) {
      delete data.document_for_missing_copy;
    }

    if (!data.element_of_proof_doc) {
      delete data.element_of_proof_doc;
    }

    return data;
  }

  validateBeforeSaveGroupTest(savingType: string, actionAfterSave?: string) {
    // This function is to check if the group is "Save this score" and its already saved before hand, Meaning its the second-onward save.
    let validation = true;
    // Do validation check if its group test and the test correction is already saved before, meaning its the second-onward saved.
    if (this.testData && this.testData.group_test && savingType === 'save') {
      const payload = _.cloneDeep(this.formatPayload());

      // If is_saved true, meaning its already saved before. Need to display SWAL confirmation.
      if (payload && payload.is_saved) {
        validation = false;
        let timeDisabled = 5;
        Swal.fire({
          title: this.translate.instant('GROUP_SAVE_ALERT.TITLE', { groupName: this.selectedGroupData ? this.selectedGroupData.name : '' }),
          text: this.translate.instant('GROUP_SAVE_ALERT.TEXT'),
          type: 'warning',
          allowEscapeKey: true,
          showCancelButton: true,
          confirmButtonText: this.translate.instant('GROUP_SAVE_ALERT.BUTTON_1'),
          cancelButtonText: this.translate.instant('GROUP_SAVE_ALERT.BUTTON_2'),
          allowOutsideClick: false,
          allowEnterKey: false,
          onOpen: () => {
            Swal.disableConfirmButton();
            const confirmBtnRef = Swal.getConfirmButton();
            const intVal = setInterval(() => {
              timeDisabled -= 1;
              confirmBtnRef.innerText = this.translate.instant('GROUP_SAVE_ALERT.BUTTON_1') + ` (${timeDisabled})`;
            }, 1000);

            this.timeOutVal = setTimeout(() => {
              confirmBtnRef.innerText = this.translate.instant('GROUP_SAVE_ALERT.BUTTON_1');
              Swal.enableConfirmButton();
              clearInterval(intVal);
              clearTimeout(this.timeOutVal);
            }, timeDisabled * 1000);
          },
        }).then((res) => {
          clearTimeout(this.timeOutVal);
          if (res.value) {
            this.saveGroupTestCorrection(savingType);
          }
        });
      } else {
        this.saveGroupTestCorrection(savingType);
      }
    } else {
      this.saveGroupTestCorrection(savingType);
    }
  }

  saveTestCorrection(savingType: string, actionAfterSave?: string) {
    const payload = _.cloneDeep(this.formatPayload());

    if (payload) {
      payload.correction_grid.correction.additional_total = Number(payload.correction_grid.correction.additional_total);
      payload.correction_grid.correction.total_jury_avg_rating = Number(payload.correction_grid.correction.total_jury_avg_rating);
      payload.correction_grid.correction.total = Number(payload.correction_grid.correction.total);
      payload.correction_grid.correction.sections.forEach((element, sectionIndex) => {
        payload.correction_grid.correction.sections[sectionIndex].rating = Number(element.rating);
        payload.correction_grid.correction.sections[sectionIndex].sub_sections.forEach((elementSub, subSectionIndex) => {
          payload.correction_grid.correction.sections[sectionIndex].sub_sections[subSectionIndex].rating = Number(elementSub.rating);
        });
      });
      payload.correction_grid.correction.sections_evalskill.forEach((element, sectionIndex) => {
        payload.correction_grid.correction.sections_evalskill[sectionIndex].rating = element.rating ? Number(element.rating) : null;
        payload.correction_grid.correction.sections_evalskill[sectionIndex].sub_sections.forEach((elementSub, subSectionIndex) => {
          payload.correction_grid.correction.sections_evalskill[sectionIndex].sub_sections[subSectionIndex].rating = Number(
            elementSub.rating,
          );
          if (
            payload.correction_grid.correction.sections_evalskill[sectionIndex].sub_sections[subSectionIndex].multiple_dates &&
            payload.correction_grid.correction.sections_evalskill[sectionIndex].sub_sections[subSectionIndex].multiple_dates.length
          ) {
            payload.correction_grid.correction.sections_evalskill[sectionIndex].sub_sections[subSectionIndex].multiple_dates.forEach(
              (date, dateIndex) => {
                if ((date && date.marks) || date.marks !== 0) {
                  date.marks = Number(date.marks);
                }
              },
            );
            // when saving data, sort from earliest date to latest date
            if (this.taskData) {
              payload.correction_grid.correction.sections_evalskill[sectionIndex].sub_sections[subSectionIndex].multiple_dates =
                payload.correction_grid.correction.sections_evalskill[sectionIndex].sub_sections[subSectionIndex].multiple_dates.reverse();
            }
          } else {
            delete payload.correction_grid.correction.sections_evalskill[sectionIndex].sub_sections[subSectionIndex].multiple_dates;
          }
        });
      });
      if (savingType === 'save') {
        payload.is_saved = true;
        payload.is_saved_as_draft = true;
        this.isSaveThisScore = true;
        this.disabledSaveThisScore = true;
      }
      if (savingType === 'draft') {
        payload.is_saved_as_draft = true;
        this.isSaveThisScore = false;
      }

      if (this.testCorrectionId) {
        // update test correction
        this.isWaitingForResponse = true;
        this.subs.sink = this.testCorrectionService.updateTestCorrection(this.testCorrectionId, payload).subscribe(
          (resp) => {
            this.isDataSaved = true;
            this.isDataSubmit = false;
            this.isWaitingForResponse = false;
            this.firstForm = _.cloneDeep(this.testCorrectionForm.value);
            if (resp) {
              if (actionAfterSave === 'validate') {
                this.validateTestCorrection();
              } else {
                swal
                  .fire({
                    type: 'success',
                    title: this.translate.instant('CORR_S10.TITLE'),
                    text: this.translate.instant('CORR_S10.TEXT', {
                      civility: this.studentSelectDetail.civility ? this.translate.instant(this.studentSelectDetail.civility) : '',
                      firstName: this.studentSelectDetail.first_name ? this.studentSelectDetail.first_name : '',
                      lastName: this.studentSelectDetail.last_name ? this.studentSelectDetail.last_name : '',
                    }),
                    confirmButtonText: this.translate.instant('CORR_S10.CONFIRM'),
                    allowOutsideClick: false,
                  })
                  .then(() => {
                    if (this.testData && this.testData.group_test && this.isTaskValidateTest()) {
                      const result = _.findIndex(this.groupList, (groupFromList) => groupFromList._id === this.selectedGroupData._id);

                      this.groupSelected(this.filteredGroupList[result]);
                    } else {
                      this.getFilteredStudentList();
                    }
                    this.generatePdfData();
                  });
              }
            }
          },
          (err) => {
            this.isWaitingForResponse = false;
          },
        );
      } else {
        // create test correction
        this.isWaitingForResponse = true;
        this.subs.sink = this.testCorrectionService.createTestCorrection(payload).subscribe(
          (resp) => {
            this.isDataSaved = true;
            this.isDataSubmit = false;
            this.isWaitingForResponse = false;
            this.firstForm = _.cloneDeep(this.testCorrectionForm.value);
            swal
              .fire({
                type: 'success',
                title: this.translate.instant('CORR_S10.TITLE'),
                text: this.translate.instant('CORR_S10.TEXT', {
                  civility: this.studentSelectDetail.civility ? this.translate.instant(this.studentSelectDetail.civility) : '',
                  firstName: this.studentSelectDetail.first_name ? this.studentSelectDetail.first_name : '',
                  lastName: this.studentSelectDetail.last_name ? this.studentSelectDetail.last_name : '',
                }),
                confirmButtonText: this.translate.instant('CORR_S10.CONFIRM'),
                allowOutsideClick: false,
              })
              .then(() => {
                if (this.isGroup && this.testData && this.testData.group_test && this.isTaskValidateTest()) {
                  this.groupSelected(this.filteredGroupList[0]);
                } else {
                  this.getFilteredStudentList();
                }
                this.generatePdfData();
              });
          },
          (err) => {
            this.isWaitingForResponse = false;
          },
        );
      }
    }
  }

  generatePdfData() {
    // to create pdf detail html so we can have pdf when click detail button
    if (this.testData && this.testData.group_test) {
      this.pdfGroupDetailRef.assignStudentsToGroup();
    } else {
      this.pdfDetailRef.getAllTestCorrection();
    }
  }

  saveGroupTestCorrection(savingType: string, actionAfterSave?: string) {
    const payload = this.formatPayload();
    if (payload) {
      payload.correction_grid.correction.additional_total = Number(payload.correction_grid.correction.additional_total);
      payload.correction_grid.correction.total_jury_avg_rating = Number(payload.correction_grid.correction.total_jury_avg_rating);
      payload.correction_grid.correction.total = Number(payload.correction_grid.correction.total);
      payload.correction_grid.correction.sections.forEach((element, sectionIndex) => {
        payload.correction_grid.correction.sections[sectionIndex].rating = Number(element.rating);
        payload.correction_grid.correction.sections[sectionIndex].sub_sections.forEach((elementSub, subSectionIndex) => {
          payload.correction_grid.correction.sections[sectionIndex].sub_sections[subSectionIndex].rating = Number(elementSub.rating);
        });
      });
      payload.correction_grid.correction.sections_evalskill.forEach((element, sectionIndex) => {
        payload.correction_grid.correction.sections_evalskill[sectionIndex].rating = Number(element.rating);
        payload.correction_grid.correction.sections_evalskill[sectionIndex].sub_sections.forEach((elementSub, subSectionIndex) => {
          payload.correction_grid.correction.sections_evalskill[sectionIndex].sub_sections[subSectionIndex].rating = Number(
            elementSub.rating,
          );
          if (
            payload.correction_grid.correction.sections_evalskill[sectionIndex].sub_sections[subSectionIndex].multiple_dates &&
            payload.correction_grid.correction.sections_evalskill[sectionIndex].sub_sections[subSectionIndex].multiple_dates.length
          ) {
            payload.correction_grid.correction.sections_evalskill[sectionIndex].sub_sections[subSectionIndex].multiple_dates.forEach(
              (date, dateIndex) => {
                if ((date && date.marks) || date.marks !== 0) {
                  date.marks = Number(date.marks);
                }
              },
            );
            // when saving data, sort from earliest date to latest date
            payload.correction_grid.correction.sections_evalskill[sectionIndex].sub_sections[subSectionIndex].multiple_dates =
              payload.correction_grid.correction.sections_evalskill[sectionIndex].sub_sections[subSectionIndex].multiple_dates.reverse();
          } else {
            delete payload.correction_grid.correction.sections_evalskill[sectionIndex].sub_sections[subSectionIndex].multiple_dates;
          }
        });
      });
      payload.test_group_id = this.test_group_id;
      delete payload.student;
      if (savingType === 'save') {
        payload.is_saved = true;
        payload.is_saved_as_draft = true;
      }
      if (savingType === 'draft') {
        payload.is_saved_as_draft = true;
      }

      if (this.groupTestCorrectionId) {
        this.isWaitingForResponse = true;
        this.subs.sink = this.testCorrectionService.updateGroupTestCorrection(this.groupTestCorrectionId, payload).subscribe(
          (resp) => {
            this.isWaitingForResponse = false;
            this.firstForm = _.cloneDeep(this.testCorrectionForm.value);
            if (resp) {
              if (actionAfterSave === 'validate') {
                this.validateTestCorrection();
              } else {
                swal
                  .fire({
                    type: 'success',
                    title: 'Bravo',
                    text: this.translate.instant('Test correction is updated'),
                  })
                  .then(() => {
                    this.getFilteredGroupList();
                    this.populateGroupList();
                  });
              }
            }
          },
          (err) => {
            this.isWaitingForResponse = false;
          },
        );
      } else {
        this.isWaitingForResponse = true;
        this.subs.sink = this.testCorrectionService.createGroupTestCorrection(payload).subscribe(
          (resp) => {
            this.groupTestCorrectionId = resp._id;
            this.isWaitingForResponse = false;
            this.firstForm = _.cloneDeep(this.testCorrectionForm.value);
            if (resp) {
              swal
                .fire({
                  type: 'success',
                  title: 'Bravo',
                  text: this.translate.instant('Test correction is updated'),
                })
                .then(() => {
                  this.getFilteredGroupList();
                  this.populateGroupList();
                });
            }
          },
          (err) => {
            this.isWaitingForResponse = false;
          },
        );
      }
    }
  }

  displayStudentName(id): string {
    if (id) {
      const foundStudent = _.find(this.studentList, (student) => student._id === id);
      if (foundStudent) {
        const studentName = foundStudent.last_name.toUpperCase() + ' ' + foundStudent.first_name;
        this.testCorrectionForm.get('student').patchValue(id);
        return studentName;
      } else {
        return id;
      }
    } else {
      return '';
    }
  }

  displayGroupName(id): string {
    if (id) {
      const foundGroup = _.find(this.groupList, (name) => name._id === id);
      if (foundGroup) {
        this.test_group_id = foundGroup._id;
        const groupName = foundGroup.name;
        return groupName;
      } else {
        return id;
      }
    } else {
      return '';
    }
  }

  openVoiceRecog() {
    this.dialog
      .open(SpeechToTextDialogComponent, {
        minWidth: '400px',
        minHeight: '250px',
        panelClass: 'certification-rule-pop-up',
        disableClose: true,
      })
      .afterClosed()
      .subscribe((resp) => {});
  }

  openTestDetail() {
    this.dialog.open(TestDetailsComponent, {
      width: '600px',
      disableClose: true,
      data: this.testData,
    });
  }

  formatDataBeforePatch(data) {
    // Change header value
    if (
      data &&
      data.correction_grid &&
      data.correction_grid.header &&
      data.correction_grid.header.fields &&
      data.correction_grid.header.fields.length
    ) {
      data.correction_grid.header.fields.forEach((header_field) => {
        if (header_field && header_field.type) {
          // const tempValue = header_field.value;
          switch (header_field.type) {
            case 'date':
              header_field.value = this.parseUTCtoLocal.transformDateToJavascriptDate(
                header_field.value.date.date,
                header_field.value.date.time,
              );
              break;
            case 'text':
              header_field.value = header_field.value.text;
              break;
            case 'number':
              header_field.value = header_field.value.number;
              break;
            case 'pfereferal':
              header_field.value = header_field.value.pfereferal;
              break;
            case 'jurymember':
              header_field.value = header_field.value.jury_member;
              break;
            case 'longtext':
              header_field.value = header_field.value.long_text;
              break;
            case 'signature':
              header_field.value = header_field.value.signature;
              break;
            case 'correctername':
              header_field.value = header_field.value.correcter_name;
              break;
            case 'mentorname':
              header_field.value = header_field.value.mentor_name;
              break;
            // case 'groupname':
            //   header_field.value = header_field.value.group_name;
            //   break;
            default:
              break;
          }
        }
      });
    }

    // Change footer value
    if (
      data &&
      data.correction_grid &&
      data.correction_grid.footer &&
      data.correction_grid.footer.fields &&
      data.correction_grid.footer.fields.length
    ) {
      data.correction_grid.footer.fields.forEach((footer_field) => {
        if (footer_field && !footer_field.data_type) {
          footer_field.data_type = 'text';
        }
        if (footer_field && footer_field.type) {
          // const tempValue = footer_field.value;
          switch (footer_field.type) {
            case 'date':
              footer_field.value = this.parseUTCtoLocal.transformDateToJavascriptDate(
                footer_field.value.date.date,
                footer_field.value.date.time,
              );
              break;
            case 'text':
              footer_field.value = footer_field.value.text;
              break;
            case 'number':
              footer_field.value = footer_field.value.number;
              break;
            case 'pfereferal':
              footer_field.value = footer_field.value.pfereferal;
              break;
            case 'jurymember':
              footer_field.value = footer_field.value.jury_member;
              break;
            case 'longtext':
              footer_field.value = footer_field.value.long_text;
              break;
            case 'signature':
              footer_field.value = footer_field.value.signature;
              break;
            case 'correctername':
              footer_field.value = footer_field.value.correcter_name;
              break;
            case 'mentorname':
              footer_field.value = footer_field.value.mentor_name;
              break;
            // case 'groupname':
            //   footer_field.value = footer_field.value.group_name;
            //   break;
            default:
              break;
          }
        }
      });
    }

    if (data.test && data.test._id) {
      data.test = data.test._id;
    }

    if (data.corrector && data.corrector._id) {
      data.corrector = data.corrector._id;
    } else {
      delete data.corrector;
    }

    if (data.student && data.student._id) {
      data.student = data.student._id;
    }

    if (data.school_id && data.school_id._id) {
      data.school_id = data.school_id._id;
    }

    if (data && data.expected_documents && data.expected_documents.length) {
      data.expected_documents.forEach((doc) => {
        if (doc && doc.document && doc.document._id) {
          doc.document = doc.document._id;
        }
      });
    }

    if (data && data.document_for_missing_copy && data.document_for_missing_copy.length) {
      this.setMissingCopyDocument(data.document_for_missing_copy[0]);
      data.document_for_missing_copy = data.document_for_missing_copy.map((mc) => mc._id);
    }

    if (data && data.element_of_proof_doc && data.element_of_proof_doc._id) {
      this.setElementOfProofDocument(data.element_of_proof_doc);
      data.element_of_proof_doc = data.element_of_proof_doc._id;
    }

    if (
      data &&
      data.correction_grid &&
      data.correction_grid.correction &&
      data.correction_grid.correction.sections &&
      data.correction_grid.correction.sections.length
    ) {
      data.correction_grid.correction.sections.forEach((section) => {
        section.sub_sections.forEach((subsec) => {
          // remove directions from test correction data if it's empty
          if (!subsec.directions) {
            delete subsec.directions;
          }
        });
      });
    }

    if (
      data &&
      data.correction_grid &&
      data.correction_grid.correction.sections_evalskill &&
      data.correction_grid.correction.sections_evalskill.length
    ) {
      data.correction_grid.correction.sections_evalskill.forEach((sec, secIndex) => {
        if (sec && sec.academic_skill_competence_template_id && sec.academic_skill_competence_template_id._id) {
          sec.academic_skill_competence_template_id = sec.academic_skill_competence_template_id._id;
        }
        if (sec && sec.soft_skill_competence_template_id && sec.soft_skill_competence_template_id._id) {
          sec.soft_skill_competence_template_id = sec.soft_skill_competence_template_id._id;
        }
        if (sec && sec.academic_skill_block_template_id && sec.academic_skill_block_template_id._id) {
          sec.academic_skill_block_template_id = sec.academic_skill_block_template_id._id;
        }
        if (sec && sec.soft_skill_block_template_id && sec.soft_skill_block_template_id._id) {
          sec.soft_skill_block_template_id = sec.soft_skill_block_template_id._id;
        }
        sec.sub_sections.forEach((subsec, subsecIndex) => {
          if (
            subsec &&
            subsec.academic_skill_criteria_of_evaluation_competence_id &&
            subsec.academic_skill_criteria_of_evaluation_competence_id._id
          ) {
            subsec.academic_skill_criteria_of_evaluation_competence_id = subsec.academic_skill_criteria_of_evaluation_competence_id._id;
          }
          if (
            subsec &&
            subsec.soft_skill_criteria_of_evaluation_competence_id &&
            subsec.soft_skill_criteria_of_evaluation_competence_id._id
          ) {
            subsec.soft_skill_criteria_of_evaluation_competence_id = subsec.soft_skill_criteria_of_evaluation_competence_id._id;
          }
          if (subsec && subsec.academic_skill_competence_template_id && subsec.academic_skill_competence_template_id._id) {
            subsec.academic_skill_competence_template_id = subsec.academic_skill_competence_template_id._id;
          }
          if (subsec && subsec.soft_skill_competence_template_id && subsec.soft_skill_competence_template_id._id) {
            subsec.soft_skill_competence_template_id = subsec.soft_skill_competence_template_id._id;
          }
          if (subsec.is_criteria_evaluated === null) {
            subsec.is_criteria_evaluated = true;
          }
          if (subsec && subsec.multiple_dates && subsec.multiple_dates.length) {
            const lastDateIndex = subsec.multiple_dates.length - 1;

            if (
              this.taskData &&
              this.taskData.due_date &&
              this.taskData.due_date.date &&
              this.taskData.due_date.date !== subsec.multiple_dates[lastDateIndex].date &&
              !this.isTaskValidateTest()
            ) {
              subsec.multiple_dates.push({
                date: this.taskData.due_date.date,
                // tempTime: this.taskData.due_date.time,
                marks: null,
                observation: '',
                score_conversion_id: '',
              });
              this.getSubSectionEvalskillForm(secIndex).at(subsecIndex).get('rating').clearValidators();
              this.getSubSectionEvalskillForm(secIndex).at(subsecIndex).get('rating').updateValueAndValidity();
            } else {
              // data already saved before. so enable the submit button
              this.isDataSaved = true;
              this.isDataSubmit = true;
            }
            // sort from latest date to earliest date so user can easier to access the field and inputting mark
            subsec.multiple_dates = subsec.multiple_dates.reverse();
            this.setMultipleDatesFormData(subsec.multiple_dates);
          }
        });
      });
    }

    return data;
  }

  formatDataBeforePatchGroup(data) {
    // Change header value
    if (
      data &&
      data.correction_grid &&
      data.correction_grid.header &&
      data.correction_grid.header.fields &&
      data.correction_grid.header.fields.length
    ) {
      data.correction_grid.header.fields.forEach((header_field) => {
        if (header_field && header_field.type) {
          // const tempValue = header_field.value;
          switch (header_field.type) {
            case 'date':
              header_field.value = this.parseUTCtoLocal.transformDateToJavascriptDate(
                header_field.value.date.date,
                header_field.value.date.time,
              );
              break;
            case 'text':
              header_field.value = header_field.value.text;
              break;
            case 'number':
              header_field.value = header_field.value.number;
              break;
            case 'pfereferal':
              header_field.value = header_field.value.pfereferal;
              break;
            case 'jurymember':
              header_field.value = header_field.value.jury_member;
              break;
            case 'longtext':
              header_field.value = header_field.value.long_text;
              break;
            case 'signature':
              header_field.value = header_field.value.signature;
              break;
            case 'correctername':
              header_field.value = header_field.value.correcter_name;
              break;
            case 'mentorname':
              header_field.value = header_field.value.mentor_name;
              break;
            // case 'groupname':
            //   header_field.value = header_field.value.group_name;
            //   break;
            default:
              break;
          }
        }
      });
    }

    // Change footer value
    if (
      data &&
      data.correction_grid &&
      data.correction_grid.footer &&
      data.correction_grid.footer.fields &&
      data.correction_grid.footer.fields.length
    ) {
      data.correction_grid.footer.fields.forEach((footer_field) => {
        if (footer_field && !footer_field.data_type) {
          footer_field.data_type = 'text';
        }
        if (footer_field && footer_field.type) {
          // const tempValue = footer_field.value;
          switch (footer_field.type) {
            case 'date':
              footer_field.value = this.parseUTCtoLocal.transformDateToJavascriptDate(
                footer_field.value.date.date,
                footer_field.value.date.time,
              );
              break;
            case 'text':
              footer_field.value = footer_field.value.text;
              break;
            case 'number':
              footer_field.value = footer_field.value.number;
              break;
            case 'pfereferal':
              footer_field.value = footer_field.value.pfereferal;
              break;
            case 'jurymember':
              footer_field.value = footer_field.value.jury_member;
              break;
            case 'longtext':
              footer_field.value = footer_field.value.long_text;
              break;
            case 'signature':
              footer_field.value = footer_field.value.signature;
              break;
            case 'correctername':
              footer_field.value = footer_field.value.correcter_name;
              break;
            case 'mentorname':
              footer_field.value = footer_field.value.mentor_name;
              break;
            // case 'groupname':
            //   footer_field.value = footer_field.value.group_name;
            //   break;
            default:
              break;
          }
        }
      });
    }

    if (data.test && data.test._id) {
      data.test = data.test._id;
    }

    if (data.test_group_id && data.test_group_id._id) {
      data.test_group_id = data.test_group_id._id;
    }

    if (data.corrector && data.corrector._id) {
      data.corrector = data.corrector._id;
    } else {
      delete data.corrector;
    }

    if (data.student && data.student._id) {
      data.student = data.student._id;
    }

    if (data.school_id && data.school_id._id) {
      data.school_id = data.school_id._id;
    }

    if (data && data.expected_documents && data.expected_documents.length) {
      data.expected_documents.forEach((doc) => {
        if (doc && doc.document && doc.document._id) {
          doc.document = doc.document._id;
        }
      });
    }

    if (data && data.document_for_missing_copy && data.document_for_missing_copy.length) {
      this.setMissingCopyDocument(data.document_for_missing_copy[0]);
      data.document_for_missing_copy = data.document_for_missing_copy.map((mc) => mc._id);
    }

    if (data && data.element_of_proof_doc && data.element_of_proof_doc._id) {
      this.setElementOfProofDocument(data.element_of_proof_doc);
      data.element_of_proof_doc = data.element_of_proof_doc._id;
    }

    if (
      data &&
      data.correction_grid &&
      data.correction_grid.correction &&
      data.correction_grid.correction.sections &&
      data.correction_grid.correction.sections.length
    ) {
      data.correction_grid.correction.sections.forEach((section) => {
        section.sub_sections.forEach((subsec) => {
          // remove directions from test correction data if it's empty
          if (!subsec.directions) {
            delete subsec.directions;
          }
        });
      });
    }

    if (
      data &&
      data.correction_grid &&
      data.correction_grid.correction.sections_evalskill &&
      data.correction_grid.correction.sections_evalskill.length
    ) {
      data.correction_grid.correction.sections_evalskill.forEach((sec) => {
        if (sec && sec.academic_skill_competence_template_id && sec.academic_skill_competence_template_id._id) {
          sec.academic_skill_competence_template_id = sec.academic_skill_competence_template_id._id;
        }
        if (sec && sec.soft_skill_competence_template_id && sec.soft_skill_competence_template_id._id) {
          sec.soft_skill_competence_template_id = sec.soft_skill_competence_template_id._id;
        }
        if (sec && sec.academic_skill_block_template_id && sec.academic_skill_block_template_id._id) {
          sec.academic_skill_block_template_id = sec.academic_skill_block_template_id._id;
        }
        if (sec && sec.soft_skill_block_template_id && sec.soft_skill_block_template_id._id) {
          sec.soft_skill_block_template_id = sec.soft_skill_block_template_id._id;
        }
        sec.sub_sections.forEach((subsec) => {
          if (
            subsec &&
            subsec.academic_skill_criteria_of_evaluation_competence_id &&
            subsec.academic_skill_criteria_of_evaluation_competence_id._id
          ) {
            subsec.academic_skill_criteria_of_evaluation_competence_id = subsec.academic_skill_criteria_of_evaluation_competence_id._id;
          }
          if (
            subsec &&
            subsec.soft_skill_criteria_of_evaluation_competence_id &&
            subsec.soft_skill_criteria_of_evaluation_competence_id._id
          ) {
            subsec.soft_skill_criteria_of_evaluation_competence_id = subsec.soft_skill_criteria_of_evaluation_competence_id._id;
          }
          if (subsec && subsec.academic_skill_competence_template_id && subsec.academic_skill_competence_template_id._id) {
            subsec.academic_skill_competence_template_id = subsec.academic_skill_competence_template_id._id;
          }
          if (subsec && subsec.soft_skill_competence_template_id && subsec.soft_skill_competence_template_id._id) {
            subsec.soft_skill_competence_template_id = subsec.soft_skill_competence_template_id._id;
          }
          if (subsec.is_criteria_evaluated === null) {
            // delete subsec.is_criteria_evaluated;
            subsec.is_criteria_evaluated = false;
          }
        });
      });
    }

    return data;
  }

  checkNotValid() {}

  submitTestCorrection() {
    this.isWaitingForResponse = true;

    if (this.testData && this.testData.correction_type === 'cross_correction' && !this.taskId) {
      const studentPdfResults = this.getStudentPdfResults();
      this.subs.sink = this.testCorrectionService
        .submitMarkEntryCrossCorrectionFromAcadKit(
          this.testData.parent_rncp_title._id,
          this.schoolId,
          this.testId,
          this.testData.class_id._id,
          this.translate.currentLang,
          studentPdfResults,
        )
        .subscribe(
          (res) => {
            this.isWaitingForResponse = false;

            Swal.fire({
              type: 'success',
              title: this.translate.instant('TESTCORRECTIONS.MESSAGE.ALLCORRECTIONSSUBMITTEDTitle'),
              allowEscapeKey: true,
              html: this.translate.instant('TESTCORRECTIONS.MESSAGE.ALLCORRECTIONSSUBMITTED'),
              confirmButtonText: this.translate.instant('TESTCORRECTIONS.MESSAGE.ALLCORRECTIONSSUBMITTEDBtn'),
            }).then((result) => {
              this._location.back();
            });
          },
          (err) => (this.isWaitingForResponse = false),
        );
    } else if (
      this.testData.correction_type === 'cross_correction' &&
      this.taskId &&
      this.testData.parent_rncp_title &&
      this.testData.class_id
    ) {
      // *************** Submit for cross correction, also need to generate the PDF
      const studentPdfResults = this.getStudentPdfResults();
      this.subs.sink = this.testCorrectionService
        .submitMarkEntryCrossCorrection(
          this.taskId,
          this.testData.parent_rncp_title._id,
          this.testData.class_id._id,
          this.translate.currentLang,
          studentPdfResults,
        )
        .subscribe(
          (resp) => {
            if (resp) {
              Swal.fire({
                type: 'success',
                title: this.translate.instant('TESTCORRECTIONS.MESSAGE.ALLCORRECTIONSSUBMITTEDTitle'),
                allowEscapeKey: true,
                html: this.translate.instant('TESTCORRECTIONS.MESSAGE.ALLCORRECTIONSSUBMITTED'),
                confirmButtonText: this.translate.instant('TESTCORRECTIONS.MESSAGE.ALLCORRECTIONSSUBMITTEDBtn'),
              }).then((result) => {
                this._location.back();
              });
            }
          },
          (err) => (this.isWaitingForResponse = false),
        );
    } else if (this.testData.type === 'memoire_oral') {
      // submit test correction for jury organization
      this.submitJuryOrganizationMarkEntry();
    } else if (this.testCorrectionForm.get('final_retake').value) {
      // submit test correction for final retake test
      this.submitFinalRetakeMarkEntry();
    } else if (this.testData.type === 'academic_recommendation') {
      // submit test correction for jury organization
      const studentPdfResults = this.getStudentPdfResults();
      this.subs.sink = this.testCorrectionService
        .submitMarkEntryAcadRec(this.testId, this.schoolId, this.taskId, studentPdfResults)
        .subscribe((resp) => {
          if (resp) {
            if (this.taskData && this.taskData.task_status === 'todo') {
              this.subs.sink = this.testCorrectionService.markDoneTask(this.taskId, this.translate.currentLang).subscribe((response) => {
                if (response) {
                  this.isWaitingForResponse = false;
                  this.firstForm = _.cloneDeep(this.testCorrectionForm.value);
                  this.triggerSwalSubmit();
                }
              });
            } else {
              this.isWaitingForResponse = false;
              this.firstForm = _.cloneDeep(this.testCorrectionForm.value);
              this.triggerSwalSubmit();
            }
          }
        });
    } else if (this.testData.type === 'preparation_center_eval_soft_skill') {
      this.subs.sink = this.testCorrectionService.submitMarkEntry(this.testId, this.schoolId, this.taskId).subscribe((resp) => {
        if (resp) {
          this.triggerSwalSubmit();
          this.validateTestCorrection();
        }
      });
    } else {
      // submit test correction for normal test
      this.subs.sink = this.testCorrectionService.submitMarkEntry(this.testId, this.schoolId, this.taskId).subscribe((resp) => {
        if (resp) {
          if (this.taskData && this.taskData.task_status === 'todo') {
            this.subs.sink = this.testCorrectionService.markDoneTask(this.taskId, this.translate.currentLang).subscribe((response) => {
              if (response) {
                this.isWaitingForResponse = false;
                this.firstForm = _.cloneDeep(this.testCorrectionForm.value);
                this.triggerSwalSubmit();
                if (this.testData.type === 'preparation_center_eval_soft_skill') {
                  this.validateTestCorrection();
                }
              }
            });
          } else {
            this.isWaitingForResponse = false;
            this.firstForm = _.cloneDeep(this.testCorrectionForm.value);
            this.triggerSwalSubmit();
            if (this.testData.type === 'preparation_center_eval_soft_skill') {
              this.validateTestCorrection();
            }
          }
        }
      });
    }
  }

  submitFinalRetakeMarkEntry() {
    this.subs.sink = this.testCorrectionService.submitFinalRetakeMarkEntry(this.testId, this.schoolId, this.taskId).subscribe((resp) => {
      if (resp) {
        this.isWaitingForResponse = false;
        this.firstForm = _.cloneDeep(this.testCorrectionForm.value);
        this.triggerSwalSubmit();
      }
    });
  }

  submitJuryOrganizationMarkEntry() {
    this.subs.sink = this.testCorrectionService
      .SubmitMarksEntryForJury(
        this.testId,
        this.schoolId,
        this.taskId,
        this.testCorrectionForm.get('jury_organization_id').value,
        this.testCorrectionForm.get('jury_member_id').value,
      )
      .subscribe((resp) => {
        if (resp) {
          this.isWaitingForResponse = false;
          this.firstForm = _.cloneDeep(this.testCorrectionForm.value);
          this.triggerSwalSubmit();
        }
      });
  }

  triggerSwalSubmit() {
    if (this.testData.correction_type === 'certifier') {
      swal
        .fire({
          type: 'success',
          title: this.translate.instant('SUCCESS'),
          html: this.translate.instant('TESTCORRECTIONS.MESSAGE.CORR_S8.TEXT'),
          allowOutsideClick: false,
          confirmButtonText: this.translate.instant('TESTCORRECTIONS.MESSAGE.Validate_S1.BTN_OK'),
        })
        .then(() => {
          this.routeToDashBoard();
        });
    } else {
      if (this.permissions.getPermission('ADMTC Director') || this.permissions.getPermission('ADMTC Admin')) {
        swal
          .fire({
            type: 'success',
            title: this.translate.instant('TESTCORRECTIONS.MESSAGE.ALLCORRECTIONSSUBMITTEDTitle'),
            html: this.translate.instant('TESTCORRECTIONS.MESSAGE.ALLCORRECTIONSSUBMITTEDADMTC'),
            confirmButtonText: this.translate.instant('TESTCORRECTIONS.MESSAGE.ALLCORRECTIONSSUBMITTEDBtn'),
            allowOutsideClick: false,
          })
          .then(() => {
            this.routeToDashBoard();
          });
      } else if (this.permissions.getPermission('Student')) {
        swal
          .fire({
            type: 'success',
            title: this.translate.instant('TESTCORRECTIONS.MESSAGE.ALLCORRECTIONSSUBMITTEDTitle'),
            html: this.translate.instant('TESTCORRECTIONS.MESSAGE.ALLCORRECTIONSSUBMITTED'),
            confirmButtonText: this.translate.instant('TESTCORRECTIONS.MESSAGE.ALLCORRECTIONSSUBMITTEDBtn'),
            allowOutsideClick: false,
          })
          .then(() => {
            this.routeToTaskTable();
          });
      } else {
        swal
          .fire({
            type: 'success',
            title: this.translate.instant('TESTCORRECTIONS.MESSAGE.ALLCORRECTIONSSUBMITTEDTitle'),
            html: this.translate.instant('TESTCORRECTIONS.MESSAGE.ALLCORRECTIONSSUBMITTED'),
            confirmButtonText: this.translate.instant('TESTCORRECTIONS.MESSAGE.ALLCORRECTIONSSUBMITTEDBtn'),
            allowOutsideClick: false,
          })
          .then(() => {
            this.routeToDashBoard();
          });
      }
    }
  }

  saveAndvalidateTestCorrection() {
    if (this.isGroup && this.testData.group_test) {
      // save for group in group test mark entry
      this.subs.sink = this.showPerStudentPDFDialog().subscribe((res) => {
        this.isWaitingForResponse = false;
        if (res) {
          this.dialogData = res;
          if (this.comparisonSaveThisScore()) {
            this.validateTestCorrection();
          } else {
            this.saveGroupTestCorrection('save', 'validate');
          }
        }
      });
    } else if (this.isStudent && this.testData.group_test) {
      // save for student in group test mark entry
      this.subs.sink = this.showPerStudentPDFDialog().subscribe((res) => {
        this.isWaitingForResponse = false;
        if (res) {
          this.dialogData = res;
          if (this.comparisonSaveThisScore()) {
            this.validateTestCorrection();
          } else {
            this.saveTestCorrection('save', 'validate');
          }
        }
      });
    } else {
      // save for individual student mark entry
      // this.showPerStudentPDFDialog();
      this.saveTestCorrection('save', 'validate');
    }
  }

  validateTestCorrection() {
    let timeDisabledinSec = 6;

    swal
      .fire({
        type: 'warning',
        title: this.translate.instant('TESTCORRECTIONS.MESSAGE.Validate_S1.TITLE'),
        html: this.translate.instant('TESTCORRECTIONS.MESSAGE.Validate_S1.TEXT', {
          TestName: this.testData.name,
          RNCPTitle: this.titleData.short_name,
        }),
        confirmButtonText: this.translate.instant('TESTCORRECTIONS.MESSAGE.Validate_S1.BTN_OK'),
        showCancelButton: true,
        allowOutsideClick: false,
        cancelButtonText: this.translate.instant('TESTCORRECTIONS.MESSAGE.Validate_S1.BTN_CANCEL'),
        onOpen: () => {
          swal.disableConfirmButton();
          const confirmButtonRef = swal.getConfirmButton();

          // TimerLoop for derementing timeDisabledinSec
          const intervalVar = setInterval(() => {
            timeDisabledinSec -= 1;
            confirmButtonRef.innerText = this.translate.instant('TESTCORRECTIONS.MESSAGE.Validate_S1.BTN_OK') + `(${timeDisabledinSec})`;
          }, 1000);
          const timeoutVar = setTimeout(() => {
            (confirmButtonRef.innerText = this.translate.instant('TESTCORRECTIONS.MESSAGE.Validate_S1.BTN_OK')), swal.enableConfirmButton();
            clearInterval(intervalVar);
            clearTimeout(timeoutVar);
          }, timeDisabledinSec * 1000);
        },
      })
      .then((result) => {
        if (result.value) {
          if (this.testData.group_test) {
            this.isWaitingForResponse = true;
            this.subs.sink = this.testCorrectionService
              .validateStudentMissingCopyForGroup(this.testId, this.schoolId)
              .subscribe((respValidate) => {
                if (respValidate) {
                  const groupPdfResults = this.getGroupPdfResults();
                  this.subs.sink = this.testCorrectionService
                    .validatesMarkEntryPDF(
                      this.testId,
                      this.schoolId,
                      this.dialogData.pdf_result,
                      this.dialogData.pdf_results_students_in_group,
                    )
                    .subscribe((resp) => {
                      if (resp) {
                        if (this.taskId && this.taskData.task_status === 'todo') {
                          this.subs.sink = this.testCorrectionService
                            .markDoneTask(this.taskId, this.translate.currentLang)
                            .subscribe((response) => {
                              this.firstForm = _.cloneDeep(this.testCorrectionForm.value);
                              this.isWaitingForResponse = false;
                              if (response) {
                                this.triggerSwalValidate();
                              }
                            });
                        } else {
                          this.firstForm = _.cloneDeep(this.testCorrectionForm.value);
                          this.isWaitingForResponse = false;
                          // generate pdf here
                          this.triggerSwalValidate();
                        }
                      }
                    });
                }
              });
          } else {
            const studentPdfResults = this.getStudentPdfResults();

            this.isWaitingForResponse = true;
            if (this.testData && this.testData.is_retake_test) {
              // submit test correction for final retake test
              this.validateFinalRetakeMarkEntryPDF(studentPdfResults);
            } else {
              this.subs.sink = this.testCorrectionService.validatesMarkEntryPDF(this.testId, this.schoolId, studentPdfResults).subscribe(
                (resp) => {
                  if (resp) {
                    if (this.taskId && this.taskData.task_status === 'todo') {
                      this.subs.sink = this.testCorrectionService
                        .markDoneTask(this.taskId, this.translate.currentLang)
                        .subscribe((response) => {
                          this.firstForm = _.cloneDeep(this.testCorrectionForm.value);
                          this.isWaitingForResponse = false;
                          if (response) {
                            this.triggerSwalValidate();
                          }
                        });
                    } else {
                      this.firstForm = _.cloneDeep(this.testCorrectionForm.value);
                      this.isWaitingForResponse = false;
                      // generate pdf here
                      this.triggerSwalValidate();
                    }
                  }
                },
                (err) => {
                  this.isWaitingForResponse = false;

                  if (err.message.includes('GraphQL error: sorry there is still at least one document missing to be upload')) {
                    swal.fire({
                      type: 'error',
                      title: this.translate.instant('TESTCORRECTIONS.SWAL_VALIDATE_MISSING_DOC.TITLE'),
                      html: this.translate.instant('TESTCORRECTIONS.SWAL_VALIDATE_MISSING_DOC.TEXT'),
                      footer: `<span style="margin-left: auto">SWAL_VALIDATE_MISSING_DOC</span>`,
                      confirmButtonText: this.translate.instant('TESTCORRECTIONS.SWAL_VALIDATE_MISSING_DOC.BTN_OK'),
                      showCancelButton: false,
                      allowOutsideClick: false,
                    });
                  } else {
                    Swal.fire({
                      type: 'error',
                      title: 'Error',
                      text: err.message,
                      confirmButtonText: this.translate.instant('OK'),
                    });
                  }
                },
              );
            }
          }
        }
      });
  }

  validateFinalRetakeMarkEntry(studentPdfResults) {
    this.subs.sink = this.testCorrectionService
      .validateFinalRetakeTestCorrection(this.testId, this.schoolId, studentPdfResults)
      .subscribe((resp) => {
        if (resp) {
          this.firstForm = _.cloneDeep(this.testCorrectionForm.value);
          this.isWaitingForResponse = false;
          // generate pdf here
          this.triggerSwalValidate();
        }
      });
  }

  validateFinalRetakeMarkEntryPDF(studentPdfResults) {
    this.subs.sink = this.testCorrectionService
      .validateFinalRetakeMarkEntryPDF(this.testId, this.schoolId, studentPdfResults)
      .subscribe((resp) => {
        if (resp) {
          this.firstForm = _.cloneDeep(this.testCorrectionForm.value);
          this.isWaitingForResponse = false;
          // generate pdf here
          this.triggerSwalValidate();
        }
      });
  }

  getStudentPdfResults() {
    const studentResults = this.filteredStudentList.map((student) => ({
      document_name: `${student.last_name} ${student.first_name}`,
      html: this.pdfDetailRef.generateStudentPdfHtml(student._id),
      test_correction: student.testCorrectionId,
      student: student._id,
      corrector: this.testCorrectionForm.get('corrector').value,
    }));

    return studentResults;
  }

  getStudentPdfResultsMentor() {
    const studentResults = this.filteredStudentList
      .filter((list) => list._id === this.selectedStudentId)
      .map((student) => ({
        document_name: `${student.last_name} ${student.first_name}`,
        html: this.pdfDetailRef.generateStudentPdfHtml(student._id, 'mark'),
        test_correction: student.testCorrectionId,
        student: student._id,
        corrector: this.testCorrectionForm.get('corrector').value,
      }));

    return studentResults;
  }

  getGroupPdfResults() {
    const groupResults = this.filteredGroupList.map((grp) => ({
      document_name: `${grp.name}`,
      html: this.pdfGroupDetailRef.generateGroupPdfHtml(grp._id),
      test_correction: grp.groupTestCorrectionId,
      group: grp._id,
      corrector: this.testCorrectionForm.get('corrector').value,
    }));

    return groupResults;
  }

  triggerSwalValidate() {
    swal
      .fire({
        type: 'success',
        title: this.translate.instant('TESTCORRECTIONS.MESSAGE.VALIDATE-SUBMIT-TITLE'),
        allowEscapeKey: true,
        text: this.translate.instant('TESTCORRECTIONS.MESSAGE.VALIDATE-SUBMIT-TEXT'),
        confirmButtonText: this.translate.instant('TESTCORRECTIONS.MESSAGE.VALIDATE-SUBMIT-OK'),
      })
      .then(() => {
        this.routeToDashBoard();
      });
  }

  isSaveValidated() {
    // for now, remove validation that disable the notation grid form when validating group test
    // if (this.testCorrectionForm.get('missing_copy').value) {
    //   return true;
    // }
    return this.testCorrectionForm.valid;
    // later if we need that validation again, just uncomment code below
    // if (this.isGroup && this.testData && this.testData.group_test && this.isTaskValidateTest()) {
    //   return false;
    // } else {
    //   return this.testCorrectionForm.valid;
    // }
  }

  isSubmitMentorValidated() {
    let allow = false;
    if (this.isDataSaved && this.testCorrectionForm.valid && !this.isDataSubmit) {
      allow = true;
    }
    return allow;
  }

  isValidateGroupTestGroup() {
    // for now, remove validation that disable the notation grid form when validating group test
    return false;
    // later if we need that validation again, just uncomment code below
    // if (this.isGroup && this.testData && this.testData.group_test && this.isTaskValidateTest()) {
    //   return true;
    // } else {
    //   return false;
    // }
  }
  isValidatedByAcadirOrCertAdmin() {
    this.disabledCke = false;
    if (this.testData) {
      const schoolCorrectionStatus: { school: { _id: string }; correction_status: string }[] = this.testData?.correction_status_for_schools;
      if (schoolCorrectionStatus?.length) {
        const correctionStatus = schoolCorrectionStatus.find((correction) => correction?.school?._id === this.schoolId);
        // ***************** Condition Below to avoid Acadir and Cert Admin Modify Test Mark Entry that already validated by they self
        if (
          correctionStatus &&
          ((this.isAcadir && ['validated_by_acad_dir', 'validated_by_certi_admin'].includes(correctionStatus?.correction_status)) ||
            (this.isCertifierAdmin && ['validated_by_acad_dir', 'validated_by_certi_admin'].includes(correctionStatus?.correction_status)))
        ) {
          this.disabledCke = true;
        }
        // ***************** Condition Below to avoid Acadir and Cert Admin Modify Test Mark Entry that already validated
        // ***************** and for correction type admtc
        if (
          correctionStatus &&
          ((this.isAcadir && correctionStatus?.correction_status === 'corrected' && this.testData?.correction_type === 'admtc') ||
            (this.isCertifierAdmin && correctionStatus?.correction_status === 'corrected' && this.testData?.correction_type === 'admtc'))
        ) {
          this.disabledCke = true;
        }
      }
    }
  }

  validForm() {}

  isSubmitValidated() {
    let validate = true;
    if (this.filteredStudentList && this.filteredStudentList.length) {
      if (
        (this.testData.date_type === 'multiple_date' && this.testData.correction_type === 'student') ||
        (this.testData.date_type === 'multiple_date' &&
          this.testData.type === 'preparation_center_eval_soft_skill' &&
          this.testData.correction_type === 'prep_center')
      ) {
        // condition for test type academic_auto_evaluation or soft_skill_auto_evaluation
        validate = this.testCorrectionForm.valid && this.isDataSaved;
      } else if (
        this.testData.date_type === 'multiple_date' &&
        this.testData.type !== 'preparation_center_eval_soft_skill' &&
        this.testData.correction_type === 'prep_center'
      ) {
        // condition for test type academic_pro_evaluation or soft_skill_pro_evaluation
        validate = this.testCorrectionForm.valid && this.isAllStudentInputLatestMultipleDate;
      } else if (
        (this.testData.date_type === 'marks' && this.testData.correction_type === 'student') ||
        (this.testData.date_type === 'marks' &&
          this.testData.type === 'preparation_center_eval_soft_skill' &&
          this.testData.correction_type === 'prep_center')
      ) {
        validate = this.testCorrectionForm.valid && this.isDataSaved && this.isSaveThisScore;
      }

      for (const student of this.filteredStudentList) {
        // Check if all student already input mark. if any student has no score yet, return false to disable the button
        if (student && student.score !== 0 && !student.score && !student.missing_copy && !student.is_do_not_participated) {
          validate = false;
          break;
        }
        // Check if the test has document expected for student or for each student, the student has to upload doc or missing copy the mark
        if (
          this.isTestHasDocumentExpected &&
          (!student.doc || (student.doc && !student.doc.length)) &&
          !student.missing_copy &&
          !student.is_do_not_participated
        ) {
          validate = false;
          break;
        }
      }
    }

    return validate;
  }

  isGroupSubmitValidated() {
    let validate = true;
    if (this.filteredGroupList && this.filteredGroupList.length) {
      for (const groupData of this.filteredGroupList) {
        // Check if all groupData already input mark. if any groupData has no score yet, return false to disable the button
        if (groupData && groupData.score !== 0 && !groupData.score && !groupData.missing_copy && !groupData.is_do_not_participated) {
          validate = false;
          break;
        }
        // Check if the test has document expected for groupData or for each groupData,
        // the groupData has to upload doc or missing copy the mark
        if (
          this.isTestHasDocumentExpected &&
          (!groupData.doc || (groupData.doc && !groupData.doc.length)) &&
          !groupData.missing_copy &&
          !groupData.is_do_not_participated
        ) {
          validate = false;
          break;
        }
      }
    }
    return validate;
  }

  isValidateValidated() {
    let validate = true;
    if (this.testData.group_test) {
      if (this.dataFilledStudentOfAllGroupList && this.dataFilledStudentOfAllGroupList.length) {
        for (const student of this.dataFilledStudentOfAllGroupList) {
          if (student && !student.testCorrectionId) {
            validate = false;
            break;
          }
          if (student && student.is_do_not_participated) {
            validate = true;
            break;
          }
          if (student && student.missing_copy && !student.is_justified) {
            validate = false;
            break;
          }
        }
      }
    } else {
      if (this.filteredStudentList && this.filteredStudentList.length) {
        for (const student of this.filteredStudentList) {
          if (student && !student.testCorrectionId) {
            validate = false;
            break;
          }
          if (student && student.is_do_not_participated) {
            validate = true;
            break;
          }
          if (student && student.missing_copy && !student.is_justified) {
            validate = false;
            break;
          }
        }
      }
    }
    return validate;
  }

  isTaskMarkEntry() {
    let validate = false;
    if (this.taskData && (this.taskData.description === 'Marks Entry' || this.taskData.type === 'final_retake_marks_entry')) {
      validate = true;
    }
    if (!this.taskData) {
      const schoolCorrectionStatus: { school: { _id: string }; correction_status: string }[] = this.testData.correction_status_for_schools;
      const correctionStatus = schoolCorrectionStatus.find((correction) => correction.school._id === this.schoolId);
      // if there is no correction status for this school yet, then show the button
      if (!correctionStatus || this.testData.type === 'academic_recommendation') {
        validate = true;
      }
    }
    return validate;
  }

  isTaskValidateTest() {
    let validate = false;
    if (
      this.taskData &&
      (this.taskData.description === 'Validate Test' ||
        this.taskData.type === 'validate_test_correction_for_final_retake' ||
        this.taskData.type === 'validate_jury_organization' ||
        this.taskData.type === 'certifier_validation') &&
      this.testData.type !== 'academic_recommendation'
    ) {
      validate = true;
    }
    // if there is no task data, which mean we open it from folder 06 acadkit,
    // then get the correction status from correction_status data in correction_status_for_schools
    if (!this.taskData) {
      const schoolCorrectionStatus: { school: { _id: string }; correction_status: string }[] = this.testData.correction_status_for_schools;
      const correctionStatus = schoolCorrectionStatus.find((correction) => correction.school._id === this.schoolId);
      if (
        correctionStatus &&
        correctionStatus.correction_status &&
        correctionStatus.correction_status !== 'pending' &&
        this.testData.type !== 'academic_recommendation'
      ) {
        // ***************** Condition Below to avoid Acadir and Cert Admin Modify Test Mark Entry that already validated by they self
        if (
          !(this.isAcadir && ['validated_by_acad_dir', 'validated_by_certi_admin'].includes(correctionStatus.correction_status)) &&
          !(this.isCertifierAdmin && ['validated_by_acad_dir', 'validated_by_certi_admin'].includes(correctionStatus.correction_status))
        ) {
          validate = true;
        }
      }
      // ***************** Condition Below to avoid Acadir and Cert Admin Modify Test Mark Entry that already validated
      // ***************** and for correction type admtc
      if (
        correctionStatus &&
        ((this.isAcadir && correctionStatus?.correction_status === 'corrected' && this.testData?.correction_type === 'admtc') ||
          (this.isCertifierAdmin && correctionStatus?.correction_status === 'corrected' && this.testData?.correction_type === 'admtc'))
      ) {
        validate = false;
      }
    }
    return validate;
  }

  // Used to wait for PDF to be populated
  isWaitingPDFDone(event) {
    if (event && event === 'start') {
      this.isWaitingPdf = true;
    } else if (event && event === 'done' && this.isWaitingPdf) {
      setTimeout((time) => {
        this.isWaitingPdf = false;
      }, 500);
    }
  }

  routeToDashBoard() {
    this.router.navigate(['/rncpTitles', this.titleId, 'dashboard']);
  }

  routeToTaskTable() {
    this.router.navigate(['/task']);
  }

  mutateMissingCopyValidation(event: MatCheckboxChange) {
    if (event.checked) {
      const student_ids = this.isGroup ? null : this.studentList.map(student => student._id);
      const group_id = this.isGroup ? this.test_group_id : null;
      
      this.subs.sink = this.testCorrectionService.getDocumentExpectedDueDatePassed(this.testId, student_ids, group_id).subscribe(resp => {
        const isDocumentExpectedDueDatePassed = resp;
  
        if (!isDocumentExpectedDueDatePassed) {
          Swal.fire({
            type: 'info',
            title: this.translate.instant('MISSING_COPY_S1.TITLE'),
            html: this.translate.instant('MISSING_COPY_S1.TEXT'),
            footer: `<span style="margin-left: auto">MISSING_COPY_S1</span>`,
            showCancelButton: false,
            confirmButtonText: this.translate.instant('MISSING_COPY_S1.BUTTON_1'),
            allowOutsideClick: false
          })
  
          this.testCorrectionForm.get('missing_copy').patchValue(false);
          this.testCorrectionForm.get('is_do_not_participated').patchValue(false);
          return;
        }
      })

      this.testCorrectionForm.get('is_do_not_participated').patchValue(false);   
    }

    const sections: TestCorrectionCorrectionGridCorrectionSectionInput[] = this.getSectionForm().value;
    sections.forEach((section, sectionIndex) => {
      if (event.checked) {
        this.getSectionForm().at(sectionIndex).get('rating').clearValidators();
        this.getSectionForm().at(sectionIndex).get('rating').updateValueAndValidity();
      } else {
        if (this.testData.type !== 'academic_recommendation') {
          this.getSectionForm().at(sectionIndex).get('rating').setValidators([Validators.required]);
          this.getSectionForm().at(sectionIndex).get('rating').updateValueAndValidity();
        }
      }
      if (section.sub_sections && section.sub_sections.length) {
        section.sub_sections.forEach((subSection, subSectionIndex) => {
          // if missing copy true, then remove required validation
          if (event.checked) {
            this.getSubSectionForm(sectionIndex).at(subSectionIndex).get('rating').clearValidators();
            this.getSubSectionForm(sectionIndex).at(subSectionIndex).get('rating').updateValueAndValidity();
            this.getSubSectionForm(sectionIndex).at(subSectionIndex).get('comments').clearValidators();
            this.getSubSectionForm(sectionIndex).at(subSectionIndex).get('comments').updateValueAndValidity();
          } else {
            // if missing copy false and not academic recommendation, then add required validation
            if (this.testData.type === 'academic_recommendation') {
              this.getSubSectionForm(sectionIndex).at(subSectionIndex).get('comments').setValidators([Validators.required]);
              this.getSubSectionForm(sectionIndex).at(subSectionIndex).get('comments').updateValueAndValidity();
            } else {
              this.getSubSectionForm(sectionIndex).at(subSectionIndex).get('rating').setValidators([Validators.required]);
              this.getSubSectionForm(sectionIndex).at(subSectionIndex).get('rating').updateValueAndValidity();
            }
          }
        });
      }
    });
    const sectionEvalskill: TestCorrectionCorrectionGridCorrectionSectionEvalskillInput[] = this.getSectionEvalskillForm().value;
    sectionEvalskill.forEach((section, sectionIndex) => {
      if (section.sub_sections && section.sub_sections.length) {
        section.sub_sections.forEach((subSection, subSectionIndex) => {
          // if missing copy true, then remove required validation
          if (event.checked) {
            this.getSubSectionEvalskillForm(sectionIndex).at(subSectionIndex).get('rating').clearValidators();
            this.getSubSectionEvalskillForm(sectionIndex).at(subSectionIndex).get('rating').updateValueAndValidity();
          } else if (subSection.is_selected) {
            // if missing copy false, then add required validation
            this.getSubSectionEvalskillForm(sectionIndex).at(subSectionIndex).get('rating').setValidators([Validators.required]);
            this.getSubSectionEvalskillForm(sectionIndex).at(subSectionIndex).get('rating').updateValueAndValidity();
          }
        });
      }
    });
    const correction: TestCorrectionCorrectionGridCorrectionInput = this.getCorrectionForm().value;
    if (correction.penalties && correction.penalties.length) {
      correction.penalties.forEach((penalty, penaltyIndex) => {
        if (event.checked) {
          this.getPenaltiesFieldForm().at(penaltyIndex).get('rating').clearValidators();
          this.getPenaltiesFieldForm().at(penaltyIndex).get('rating').updateValueAndValidity();
        } else {
          this.getPenaltiesFieldForm().at(penaltyIndex).get('rating').setValidators([Validators.required]);
          this.getPenaltiesFieldForm().at(penaltyIndex).get('rating').updateValueAndValidity();
        }
      });
    }
    if (correction.bonuses && correction.bonuses.length) {
      correction.bonuses.forEach((bonus, bonusIndex) => {
        if (event.checked) {
          this.getBonusesFieldForm().at(bonusIndex).get('rating').clearValidators();
          this.getBonusesFieldForm().at(bonusIndex).get('rating').updateValueAndValidity();
        } else {
          this.getBonusesFieldForm().at(bonusIndex).get('rating').setValidators([Validators.required]);
          this.getBonusesFieldForm().at(bonusIndex).get('rating').updateValueAndValidity();
        }
      });
    }

    // to enable save as draft if student the first time is missing copy
    if (this.firstForm.missing_copy) {
      if (!event.checked) {
        this.testCorrectionForm.get('is_saved').patchValue(false);
      } else {
        this.testCorrectionForm.get('is_saved').patchValue(this.firstForm.is_saved);
      }
    }
  }

  mutateDoNotParticipateValidation(event: MatCheckboxChange) {
    if (event.checked) {
      this.testCorrectionForm.get('missing_copy').patchValue(false);
    }

    const sections: TestCorrectionCorrectionGridCorrectionSectionInput[] = this.getSectionForm().value;
    sections.forEach((section, sectionIndex) => {
      if (event.checked) {
        this.getSectionForm().at(sectionIndex).get('rating').patchValue(0);
        this.getSectionForm().at(sectionIndex).get('rating').clearValidators();
        this.getSectionForm().at(sectionIndex).get('rating').updateValueAndValidity();
      } else {
        this.getSectionForm().at(sectionIndex).get('rating').patchValue(null);
        if (this.testData.type !== 'academic_recommendation') {
          this.getSectionForm().at(sectionIndex).get('rating').setValidators([Validators.required]);
          this.getSectionForm().at(sectionIndex).get('rating').updateValueAndValidity();
        }
      }
      if (section.sub_sections && section.sub_sections.length) {
        section.sub_sections.forEach((subSection, subSectionIndex) => {
          // if do not participate is true, then remove required validation
          if (event.checked) {
            this.getSubSectionForm(sectionIndex).at(subSectionIndex).get('rating').patchValue(0);
            this.getSubSectionForm(sectionIndex).at(subSectionIndex).get('rating').clearValidators();
            this.getSubSectionForm(sectionIndex).at(subSectionIndex).get('rating').updateValueAndValidity();
            this.getSubSectionForm(sectionIndex).at(subSectionIndex).get('comments').clearValidators();
            this.getSubSectionForm(sectionIndex).at(subSectionIndex).get('comments').updateValueAndValidity();
          } else {
            // if do not participate false and not academic recommendation, then add required validation
            this.getSubSectionForm(sectionIndex).at(subSectionIndex).get('rating').patchValue(null);
            if (this.testData.type === 'academic_recommendation') {
              this.getSubSectionForm(sectionIndex).at(subSectionIndex).get('comments').setValidators([Validators.required]);
              this.getSubSectionForm(sectionIndex).at(subSectionIndex).get('comments').updateValueAndValidity();
            } else {
              this.getSubSectionForm(sectionIndex).at(subSectionIndex).get('rating').setValidators([Validators.required]);
              this.getSubSectionForm(sectionIndex).at(subSectionIndex).get('rating').updateValueAndValidity();
            }
          }
        });
      }
    });
    const sectionEvalskill: TestCorrectionCorrectionGridCorrectionSectionEvalskillInput[] = this.getSectionEvalskillForm().value;
    sectionEvalskill.forEach((section, sectionIndex) => {
      if (section.sub_sections && section.sub_sections.length) {
        section.sub_sections.forEach((subSection, subSectionIndex) => {
          // if do not participate true, then remove required validation
          if (event.checked) {
            this.getSubSectionEvalskillForm(sectionIndex).at(subSectionIndex).get('rating').patchValue(0);
            this.getSubSectionEvalskillForm(sectionIndex).at(subSectionIndex).get('rating').clearValidators();
            this.getSubSectionEvalskillForm(sectionIndex).at(subSectionIndex).get('rating').updateValueAndValidity();
          } else if (subSection.is_selected) {
            // if do not participate false, then add required validation
            this.getSubSectionEvalskillForm(sectionIndex).at(subSectionIndex).get('rating').patchValue(null);
            this.getSubSectionEvalskillForm(sectionIndex).at(subSectionIndex).get('rating').setValidators([Validators.required]);
            this.getSubSectionEvalskillForm(sectionIndex).at(subSectionIndex).get('rating').updateValueAndValidity();
          } else {
            this.getSubSectionEvalskillForm(sectionIndex).at(subSectionIndex).get('rating').patchValue(null);
          }
        });
      }
    });
    const correction: TestCorrectionCorrectionGridCorrectionInput = this.getCorrectionForm().value;
    if (correction.penalties && correction.penalties.length) {
      correction.penalties.forEach((penalty, penaltyIndex) => {
        if (event.checked) {
          this.getPenaltiesFieldForm().at(penaltyIndex).get('rating').patchValue(0);
          this.getPenaltiesFieldForm().at(penaltyIndex).get('rating').clearValidators();
          this.getPenaltiesFieldForm().at(penaltyIndex).get('rating').updateValueAndValidity();
        } else {
          this.getPenaltiesFieldForm().at(penaltyIndex).get('rating').patchValue(null);
          this.getPenaltiesFieldForm().at(penaltyIndex).get('rating').setValidators([Validators.required]);
          this.getPenaltiesFieldForm().at(penaltyIndex).get('rating').updateValueAndValidity();
        }
      });
    }
    if (correction.bonuses && correction.bonuses.length) {
      correction.bonuses.forEach((bonus, bonusIndex) => {
        if (event.checked) {
          this.getBonusesFieldForm().at(bonusIndex).get('rating').patchValue(0);
          this.getBonusesFieldForm().at(bonusIndex).get('rating').clearValidators();
          this.getBonusesFieldForm().at(bonusIndex).get('rating').updateValueAndValidity();
        } else {
          this.getBonusesFieldForm().at(bonusIndex).get('rating').patchValue(null);
          this.getBonusesFieldForm().at(bonusIndex).get('rating').setValidators([Validators.required]);
          this.getBonusesFieldForm().at(bonusIndex).get('rating').updateValueAndValidity();
        }
      });
    }

    // to enable save as draft if student the first time is do not participate
    if (this.firstForm.is_do_not_participated) {
      if (!event.checked) {
        this.testCorrectionForm.get('is_saved').patchValue(false);
      } else {
        this.testCorrectionForm.get('is_saved').patchValue(this.firstForm.is_saved);
      }
    }
  }

  downloadPDFSummary() {
    const ele = document.getElementById('pdfdoc');
    let html = PRINTSTYLES;
    html = html + ele.innerHTML;
    // ele.style.visibility = 'hidden';
    ele.innerHTML = html;
    ele.className = 'apple';
    const filename = 'Summary-' + this.titleData.short_name + ' - ' + this.testData.name;
    const landscape = false;
    this.subs.sink = this.transcriptBuilderService.generatePdf(html, filename).subscribe((res: any) => {
      const link = document.createElement('a');
      link.setAttribute('type', 'hidden'); // make it hidden if needed
      link.download = res.filename;
      link.href = environment.PDF_SERVER_URL + res.filePath;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      link.remove();
    });
  }

  getFilteredGroupList() {
    if (this.testData && this.testData.group_test) {
      this.isWaitingForResponse = true;
      this.subs.sink = this.testCorrectionService.getAllGroupTestCorrection(this.testId, this.schoolId).subscribe((response) => {
        this.isWaitingForResponse = false;
        const tempGroupList = _.cloneDeep(this.groupList);
        const tempResult = [];
        if (response && response.length) {
          response.forEach((testCorrection) => {
            const found = _.find(tempGroupList, (groupList) => groupList._id === testCorrection.test_group_id._id);
            if (found) {
              tempResult.push({
                groupTestCorrectionId: testCorrection._id,
                _id: found._id,
                name: found.name,
                doc: testCorrection.expected_documents,
                missing_copy: testCorrection.missing_copy ? testCorrection.missing_copy : false,
                is_do_not_participated: testCorrection.is_do_not_participated ? testCorrection.is_do_not_participated : false,
                is_justified: testCorrection.is_justified ? testCorrection.is_justified : null,
                score:
                  testCorrection.is_saved && testCorrection.correction_grid && testCorrection.correction_grid.correction
                    ? this.getScore(testCorrection.correction_grid.correction)
                    : null,
                company: null,
                correctorId: testCorrection && testCorrection.corrector ? testCorrection.corrector._id : null,
              });
            }
          });

          tempGroupList.forEach((data) => {
            const found = _.find(tempResult, (tempGroup) => tempGroup._id === data._id);
            if (!found) {
              tempResult.push({
                groupTestCorrectionId: null,
                _id: data._id,
                name: data.name,
                doc: null,
                missing_copy: false,
                is_justified: null,
                is_do_not_participated: false,
                score: null,
                company: null,
                correctorId: null,
              });
            }
          });
        } else {
          this.groupData.forEach((data) => {
            tempResult.push({
              groupTestCorrectionId: null,
              _id: data._id,
              name: data.name,
              doc: null,
              missing_copy: false,
              is_do_not_participated: false,
              is_justified: null,
              score: null,
              company: null,
              correctorId: null,
            });
          });
        }
        this.filteredGroupList = tempResult;

        this.firstSelectGroup();
      });
    }
  }

  populateGroupList() {
    const data = _.cloneDeep(this.taskData);
    if (this.testData && this.testData.group_test) {
      if (data && (data.description === 'Marks Entry' || data.type === 'final_retake_marks_entry')) {
        const correctorAssigned = this.getCorrectorAssigned(data);
        const selectedCorrector = _.find(
          correctorAssigned,
          (corrector) =>
            corrector.corrector_id !== null &&
            corrector.corrector_id._id === data.user_selection.user_id._id &&
            corrector.school_id._id === this.schoolId,
        );
        if (selectedCorrector) {
          this.groupList = selectedCorrector.test_groups;
          this.groupData = selectedCorrector.test_groups;
          this.selectedCorrector = selectedCorrector;

          if (this.selectedCorrector && this.selectedCorrector.corrector_id && this.selectedCorrector.corrector_id._id) {
            const selectorID = this.selectedCorrector.corrector_id._id;
            this.selectedCorrectorId = selectorID;
            this.testCorrectionForm.get('corrector').patchValue(this.selectedCorrectorId);
          }
          this.getFilteredGroupList();
        }
      } else if (this.isTaskValidateTest()) {
        this.getAllGroupByTestIdAndGroupId();
      }
    }
  }

  getAllGroupByTestIdAndGroupId() {
    this.isWaitingForResponse = true;
    this.subs.sink = this.testCorrectionService.getAllGroup(this.testId, this.schoolId).subscribe((resp) => {
      this.isWaitingForResponse = false;
      this.groupList = resp;
      this.groupData = resp;
      this.getFilteredGroupList();
    });
  }

  firstSelectGroup() {
    if (this.testData && this.testData.group_test) {
      const group = _.filter(this.filteredGroupList, (dataGroup) => dataGroup.score === null);
      const sortedGroups = _.sortBy(group, 'name');
      if (sortedGroups && sortedGroups.length) {
        this.studentSelect = this.displayGroupName(sortedGroups[0]._id);
        this.groupSelected(sortedGroups[0]);
      } else {
        // this.isWaitingForResponse = true;
        // this.subs.sink = this.testCorrectionService
        //   .getOneGroupTestCorrection(this.filteredGroupList[0].groupTestCorrectionId)
        //   .subscribe((resp) => {
        //     this.isWaitingForResponse = false;
        //     const patchData = this.formatDataBeforePatch(_.cloneDeep(resp));
        //     this.formUpdated(patchData);
        //   });
        this.studentSelect = this.displayGroupName(this.filteredGroupList[0]._id);
        this.groupSelected(this.filteredGroupList[0]);
      }
    }
  }

  headerFormatFields(data) {
    if (data.correction_grid.header.fields) {
      const dataTest = _.filter(
        data.correction_grid.header.fields,
        (dataa: any) =>
          dataa.type !== 'etablishmentname' &&
          dataa.type !== 'studentname' &&
          dataa.type !== 'groupname' &&
          dataa.type !== 'mentorname' &&
          dataa.type !== 'companyname' &&
          dataa.type !== 'eventName' &&
          dataa.type !== 'dateRange' &&
          dataa.type !== 'dateFixed' &&
          dataa.type !== 'titleName' &&
          dataa.type !== 'status',
      );
      this.testData.correction_grid.header.fields = dataTest;
    }
  }

  footerFormatFields(data) {
    if (data.correction_grid.footer.fields) {
      const dataTest = _.filter(
        data.correction_grid.footer.fields,
        (dataa: any) =>
          dataa.type !== 'etablishmentname' &&
          dataa.type !== 'studentname' &&
          dataa.type !== 'groupname' &&
          dataa.type !== 'eventName' &&
          dataa.type !== 'dateRange' &&
          dataa.type !== 'dateFixed' &&
          dataa.type !== 'titleName' &&
          dataa.type !== 'status',
      );
      this.testData.correction_grid.footer.fields = dataTest;
    }
  }

  getOneGroupTest() {
    if (this.testData && this.testData.group_test) {
      this.subs.sink = this.testCorrectionService.GetOneTestGroup(this.groupId).subscribe((resp) => {});
    }
  }

  checkTestDocumentExpected(): boolean {
    let result = false;

    if (this.testData && this.testData.expected_documents && this.testData.expected_documents.length) {
      for (const expected_document of this.testData.expected_documents) {
        if (
          (expected_document && expected_document.is_for_all_student) ||
          (expected_document && expected_document.is_for_all_group) ||
          (expected_document.document_user_type && expected_document.document_user_type.name === 'Student')
        ) {
          result = true;
          break;
        }
      }
    }
    return result;
  }

  showPerStudentPDFDialog() {
    this.isWaitingForResponse = true;
    return this.dialog
      .open(PdfGroupDetailDialogComponent, {
        data: {
          testId: this.testData._id,
          schoolId: this.schoolData._id,
          testData: this.testData,
          filteredGroupList: this.filteredGroupList,
          schoolData: this.schoolData,
          studentList: this.dataFilledStudentOfAllGroupList,
          titleData: this.titleData,
          maximumFinalMark: this.maximumFinalMark,
        },
      })
      .afterClosed();
  }

  getPdfPersonalizedInZip() {
    const titleName = this.titleData && this.titleData.short_name ? this.titleData.short_name : '';
    const testName = this.testData && this.testData.name ? this.testData.name : '';
    const schoolName = this.schoolData && this.schoolData.short_name ? this.schoolData.short_name : '';
    if (this.testData.group_test) {
      const groupPdfResults = this.getGroupPdfResults().map((pdf) => {
        return {
          document_name: pdf.document_name,
          html: pdf.html,
          landscape:
            this.testData && this.testData.correction_grid && this.testData.correction_grid.orientation === 'landscape' ? true : false,
        };
      });
      const payload = {
        pdfs: groupPdfResults,
        zip_name: `${titleName} - ${testName} - ${schoolName}`,
        test_id: this.testId,
        lang: this.translate.currentLang,
      };

      this.subs.sink = this.testCorrectionService.getPdfPersonalizedInZip(payload).subscribe((resp) => {
        if (resp) {
          Swal.fire({
            type: 'success',
            title: this.translate.instant('PROEVAL_S4.TITLE'),
            html: this.translate.instant('PROEVAL_S4.TEXT'),
            confirmButtonText: this.translate.instant('PROEVAL_S4.BUTTON'),
          });
        }
      });
    } else {
      const studentPdfResults = this.getStudentPdfResults().map((pdf) => {
        return {
          document_name: pdf.document_name,
          html: pdf.html,
          landscape:
            this.testData && this.testData.correction_grid && this.testData.correction_grid.orientation === 'landscape' ? true : false,
        };
      });

      const payload = {
        pdfs: studentPdfResults,
        zip_name: `${titleName} - ${testName} - ${schoolName}`,
        test_id: this.testId,
        lang: this.translate.currentLang,
      };

      this.subs.sink = this.testCorrectionService.getPdfPersonalizedInZip(payload).subscribe((resp) => {
        if (resp) {
          Swal.fire({
            type: 'success',
            title: this.translate.instant('PROEVAL_S4.TITLE'),
            html: this.translate.instant('PROEVAL_S4.TEXT'),
            confirmButtonText: this.translate.instant('PROEVAL_S4.BUTTON'),
          });
        }
      });
    }
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  /*
    Down here are the formArray function such as add, remove, get.
  */
  getCorrectionForm() {
    return this.testCorrectionForm.get('correction_grid').get('correction') as UntypedFormGroup;
  }

  getHeaderFieldsFormArray(): UntypedFormArray {
    return this.testCorrectionForm.get('correction_grid').get('header').get('fields') as UntypedFormArray;
  }

  addHeaderFieldsFormArray() {
    this.getHeaderFieldsFormArray().push(this.initHeaderFooterFieldsForm());
  }

  removeHeaderFieldsFormArray(index) {
    this.getHeaderFieldsFormArray().removeAt(index);
  }

  getFooterFieldsFormArray(): UntypedFormArray {
    return this.testCorrectionForm.get('correction_grid').get('footer').get('fields') as UntypedFormArray;
  }

  addFooterFieldsFormArray() {
    this.getFooterFieldsFormArray().push(this.initHeaderFooterFieldsForm());
  }

  removeFooterFieldsFormArray(index) {
    this.getFooterFieldsFormArray().removeAt(index);
  }

  getSectionForm() {
    return this.getCorrectionForm().get('sections') as UntypedFormArray;
  }

  addSectionForm() {
    this.getSectionForm().push(this.initSectionForm());
  }

  removeSectionForm(index: number) {
    this.getSectionForm().removeAt(index);
  }

  resetHeaderForm() {
    this.getHeaderFieldsFormArray().controls.forEach((header) => {
      header.get('value').setValue(null);
    });
  }

  resetFooterForm() {
    this.getFooterFieldsFormArray().controls.forEach((footer) => {
      footer.get('value').setValue(null);
    });
  }

  resetBonusForm() {
    this.getBonusesFieldForm().controls.forEach((bonus) => {
      bonus.get('rating').setValue(null);
    });
  }

  resetPenaltyForm() {
    this.getPenaltiesFieldForm().controls.forEach((penalty) => {
      penalty.get('rating').setValue(null);
    });
  }

  resetSectionForm() {
    this.getSectionForm().controls.forEach((section, secIndex) => {
      section.get('rating').setValue(null);
      section.get('comment').setValue('');
      this.getSubSectionForm(secIndex).controls.forEach((subsec, subsecIndex) => {
        subsec.get('rating').setValue(null);
        subsec.get('score_conversion_id').setValue(null);
        subsec.get('comments').setValue('');
        this.getJurysSubSectionForm(secIndex, subsecIndex).controls.forEach((jury, juryIndex) => {
          jury.get('marks').setValue(null);
          jury.get('score_conversion_id').setValue(null);
        });
      });
    });
  }

  getSubSectionForm(sectionIndex: number) {
    return this.getSectionForm().at(sectionIndex).get('sub_sections') as UntypedFormArray;
  }

  addSubSectionForm(sectionIndex: number) {
    this.getSubSectionForm(sectionIndex).push(this.initSubSectionForm());
  }

  removeSubSectionForm(sectionIndex: number, subSectionIndex: number) {
    this.getSubSectionForm(sectionIndex).removeAt(subSectionIndex);
  }

  getSectionEvalskillForm() {
    return this.getCorrectionForm().get('sections_evalskill') as UntypedFormArray;
  }

  addSectionEvalskillForm() {
    this.getSectionEvalskillForm().push(this.initSectionEvalskillForm());
  }

  removeSectionEvalskillForm(index: number) {
    this.getSectionEvalskillForm().removeAt(index);
  }

  reMapSectionEvalSkillForm() {
    this.getSectionEvalskillForm().clear();
    if (this.testData?.correction_grid?.correction?.sections_evalskill?.length) {
      const sections: SectionEvalskill[] = this.testData.correction_grid.correction.sections_evalskill;
      sections
        .filter((section) => !section?.specialization_id || section?.specialization_id === this.studentSpecializationId)
        .forEach((section, sectionIndex) => {
          // add title to notation grid form table
          this.addSectionEvalskillForm();
          this.getSectionEvalskillForm().at(sectionIndex).get('ref_id').setValue(section.ref_id);
          this.getSectionEvalskillForm().at(sectionIndex).get('is_selected').setValue(section.is_selected);
          this.getSectionEvalskillForm().at(sectionIndex).get('title').setValue(section.title);
          if (section.academic_skill_competence_template_id && section.academic_skill_competence_template_id._id) {
            this.getSectionEvalskillForm()
              .at(sectionIndex)
              .get('academic_skill_competence_template_id')
              .setValue(section.academic_skill_competence_template_id._id);
          }
          section.sub_sections.forEach((subSection, subSectionIndex) => {
            // add text and direction value to notation grid form table
            this.addSubSectionEvalskillForm(sectionIndex);
            this.getSubSectionEvalskillForm(sectionIndex).at(subSectionIndex).get('ref_id').setValue(subSection.ref_id);
            this.getSubSectionEvalskillForm(sectionIndex).at(subSectionIndex).get('is_selected').setValue(subSection.is_selected);
            this.getSubSectionEvalskillForm(sectionIndex).at(subSectionIndex).get('title').setValue(subSection.title);
            this.getSubSectionEvalskillForm(sectionIndex).at(subSectionIndex).get('directions').setValue(subSection.direction);
            // add jury subsection form array if test type is jury organization
            this.testData.jury_max = 3; // hard coded as 3 in admtc v1
            this.testData.jury_max = 3;
            if ((this.testData.type === 'memoire_oral_non_jury' || this.testData.type === 'memoire_oral') && this.testData.jury_max >= 0) {
              for (let i = 0; i < this.testData.jury_max; i++) {
                this.addJurysSubSectionForm(sectionIndex, subSectionIndex);
              }
            }
            if (
              subSection.academic_skill_criteria_of_evaluation_competence_id &&
              subSection.academic_skill_criteria_of_evaluation_competence_id._id
            ) {
              this.getSubSectionEvalskillForm(sectionIndex)
                .at(subSectionIndex)
                .get('academic_skill_criteria_of_evaluation_competence_id')
                .setValue(subSection.academic_skill_criteria_of_evaluation_competence_id._id);
            }
            if (subSection.is_selected) {
              this.getSubSectionEvalskillForm(sectionIndex).at(subSectionIndex).get('rating').setValidators([Validators.required]);
              this.getSubSectionEvalskillForm(sectionIndex).at(subSectionIndex).get('rating').updateValueAndValidity();
            }
            if (this.testData.date_type === 'multiple_date') {
              this.initMultipleDateForm(sectionIndex, subSectionIndex);
            }
          });
        });
    }
  }

  resetSectionEvalskillForm() {
    // **************************************************************************
    // this function is to handle when user already upload document expected before inputting mark in mark entry.
    // when user already upload document expected before inputting mark in mark entry, the section become empty.
    // so need to fill the section and subsection data from test creation data.
    // **************************************************************************
    // this.getSectionEvalskillForm().controls.forEach((section, secIndex) => {
    //   section.get('rating').setValue(null);
    //   section.get('comment').setValue('');
    //   this.getSubSectionEvalskillForm(secIndex).controls.forEach((subsec, subsecIndex) => {
    //     subsec.get('rating').setValue(null);
    //     subsec.get('score_conversion_id').setValue(null);
    //     subsec.get('comments').setValue('');
    //     if (this.testData.date_type === 'multiple_date') {
    //       this.initMultipleDateForm(secIndex, subsecIndex);
    //     }
    //     this.getJurysSubSectionForm(secIndex, subsecIndex).controls.forEach((jury, juryIndex) => {
    //       jury.get('marks').setValue(null);
    //       jury.get('score_conversion_id').setValue(null);
    //     });
    //   });
    // });
  }

  initMultipleDateForm(sectionIndex: number, subsectionIndex: number) {
    // add initial multiple date form based on task's due_date
    this.getMultipleDatesSubSectionForm(sectionIndex, subsectionIndex).clear();
    if (this.taskData && this.taskData.due_date && this.taskData.due_date.date) {
      const taskDueDate = this.taskData.due_date.date;
      this.addMultipleDatesSubSectionForm(sectionIndex, subsectionIndex);
      this.getMultipleDatesSubSectionForm(sectionIndex, subsectionIndex).at(0).get('date').setValue(taskDueDate);
      this.getMultipleDatesSubSectionForm(sectionIndex, subsectionIndex).at(0).get('marks').setValue(null);
      if (this.testData.correction_grid.correction.show_number_marks_column) {
        this.getMultipleDatesSubSectionForm(sectionIndex, subsectionIndex).at(0).get('marks').setValidators([Validators.required]);
      } else {
        this.getMultipleDatesSubSectionForm(sectionIndex, subsectionIndex)
          .at(0)
          .get('score_conversion_id')
          .setValidators([Validators.required]);
      }
      const multipleDatesData = this.getMultipleDatesSubSectionForm(sectionIndex, subsectionIndex).value;
      this.setMultipleDatesFormData(multipleDatesData);
      this.getSubSectionEvalskillForm(sectionIndex).at(subsectionIndex).get('rating').clearValidators();
      this.getSubSectionEvalskillForm(sectionIndex).at(subsectionIndex).get('rating').updateValueAndValidity();
    }
  }

  updateMultipleDateFormArray(multipleDates: any[]) {
    if (multipleDates && multipleDates.length) {
      this.setMultipleDatesFormData(multipleDates);
    }
  }

  getSubSectionEvalskillForm(sectionIndex: number) {
    return this.getSectionEvalskillForm().at(sectionIndex).get('sub_sections') as UntypedFormArray;
  }

  addSubSectionEvalskillForm(sectionIndex: number) {
    this.getSubSectionEvalskillForm(sectionIndex).push(this.initSubSectionEvalskillForm());
  }

  removeSubSectionEvalskillForm(sectionIndex: number, subSectionIndex: number) {
    this.getSubSectionEvalskillForm(sectionIndex).removeAt(subSectionIndex);
  }

  getPenaltiesFieldForm() {
    return this.getCorrectionForm().get('penalties') as UntypedFormArray;
  }

  addPenaltyFieldForm() {
    this.getPenaltiesFieldForm().push(this.initBonusPenaltyFieldForm());
  }

  removePenaltyFieldForm(index: number) {
    this.getPenaltiesFieldForm().removeAt(index);
  }

  getBonusesFieldForm() {
    return this.getCorrectionForm().get('bonuses') as UntypedFormArray;
  }

  addBonusFieldForm() {
    this.getBonusesFieldForm().push(this.initBonusPenaltyFieldForm());
  }

  removeBonusFieldForm(index: number) {
    this.getBonusesFieldForm().removeAt(index);
  }

  getExpectedDocumentForm() {
    return this.testCorrectionForm.get('expected_documents') as UntypedFormArray;
  }

  addExpectedDocumentForm() {
    this.getExpectedDocumentForm().push(this.initExpectedDocumentForm());
  }

  removeExpectedDocumentForm(index: number) {
    this.getExpectedDocumentForm().removeAt(index);
  }

  getJurysSubSectionForm(sectionIndex: number, subSectionIndex: number) {
    if (this.testData.block_type === 'competence' || this.testData.block_type === 'soft_skill') {
      return this.getSubSectionEvalskillForm(sectionIndex).at(subSectionIndex).get('jurys') as UntypedFormArray;
    } else {
      return this.getSubSectionForm(sectionIndex).at(subSectionIndex).get('jurys') as UntypedFormArray;
    }
  }

  addJurysSubSectionForm(sectionIndex: number, subSectionIndex: number) {
    this.getJurysSubSectionForm(sectionIndex, subSectionIndex).push(this.initJurysSubSectionForm());
  }

  removeJurysSubSectionForm(sectionIndex: number, subSectionIndex: number, juryIndex: number) {
    this.getJurysSubSectionForm(sectionIndex, subSectionIndex).removeAt(juryIndex);
  }

  getMultipleDatesSubSectionForm(sectionIndex: number, subSectionIndex: number) {
    return this.getSubSectionEvalskillForm(sectionIndex).at(subSectionIndex).get('multiple_dates') as UntypedFormArray;
  }

  addMultipleDatesSubSectionForm(sectionIndex: number, subSectionIndex: number) {
    this.getMultipleDatesSubSectionForm(sectionIndex, subSectionIndex).push(this.initMultipleDatesSubSectionForm());
  }

  removeMultipleDatesSubSectionForm(sectionIndex: number, subSectionIndex: number, juryIndex: number) {
    this.getMultipleDatesSubSectionForm(sectionIndex, subSectionIndex).removeAt(juryIndex);
  }

  addMultipleDatesForm() {
    this.multipleDatesFormArray.push(this.initMultipleDatesSubSectionForm());
  }

  setMultipleDatesFormData(multipleDatesData: MultipleDateCorrection[]) {
    this.multipleDatesFormArray.clear();
    multipleDatesData.forEach((dateData) => {
      this.addMultipleDatesForm();
    });
    if (!this.taskData) {
      multipleDatesData = multipleDatesData.reverse();
    }
    this.multipleDatesFormArray.patchValue(multipleDatesData);
  }

  getJuryEnabledList() {
    return this.testCorrectionForm.get('jury_enabled_list') as UntypedFormArray;
  }

  addJuryEnabledList(index) {
    this.getJuryEnabledList().push(this.initJuryEnabledList(index));
  }

  removeJuryEnabledList(index: number) {
    this.getJuryEnabledList().removeAt(index);
  }
  /*
    End of formArray functions
  */

  getDataChanges() {
    const lastForm = _.cloneDeep(this.testCorrectionForm.value);

    return _.isEqual(this.firstForm, lastForm);
  }

  canDeactivate(): Observable<boolean> | Promise<boolean> | boolean {
    let validation = true;

    // The actual validation, by comparing data saved and current data in the form
    if (this.getDataChanges()) {
      validation = true;
    } else {
      validation = false;
    }

    // Passing the validation into the canExitService, if we return true, meaning user are allowed to go, otherwise user will stay
    if (!validation && !this.emptyTask) {
      return new Promise((resolve, reject) => {
        Swal.fire({
          type: 'warning',
          title: this.translate.instant('TMTC_S01.TITLE'),
          text: this.translate.instant('TMTC_S01.TEXT'),
          confirmButtonText: this.translate.instant('TMTC_S01.BUTTON_1'),
          showCancelButton: true,
          cancelButtonText: this.translate.instant('TMTC_S01.BUTTON_2'),
          allowEscapeKey: false,
          allowOutsideClick: false,
        }).then((result) => {
          if (result.value) {
            resolve(false);
          } else {
            resolve(true);
          }
        });
      });
    } else {
      return true;
    }
  }

  getAllTestCorrection() {
    if (this.testData && this.testData.correction_type && this.testData.correction_type === 'cross_correction') {
      const student_ids = [];
      if (this.studentList && this.studentList.length) {
        this.studentList.forEach((student) => {
          student_ids.push(student._id);
        });
      }
      // if there is task data (open mark entry page from pending task or task table), execute this block of code
      this.subs.sink = this.testCorrectionService
        .getAllCompleteTestCorrectionWithStudent(this.testId, student_ids)
        .subscribe((response) => {
          this.originalStudentList = [];
          const data = response;
          if (this.filteredStudentList) {
            this.filteredStudentList.forEach((student) => {
              // find correction grid data and assign it to student
              const correction = data.find((corr) => corr.student && corr.student._id && corr.student._id === student._id);
              this.originalStudentList.push({ ...student, correction_grid: correction ? correction.correction_grid : null });
            });
          }
          this.isAllStudentInputLatestMultipleDate = this.checkIsAllStudentInputLatestMultipleDate();
        });
    } else {
      this.subs.sink = this.testCorrectionService.getAllCompleteTestCorrection(this.testData._id, this.schoolData._id).subscribe((resp) => {
        this.originalStudentList = [];
        const data = resp;
        if (this.filteredStudentList) {
          this.filteredStudentList.forEach((student) => {
            // find correction grid data and assign it to student
            const correction = data.find((corr) => corr.student && corr.student._id && corr.student._id === student._id);
            this.originalStudentList.push({ ...student, correction_grid: correction ? correction.correction_grid : null });
          });
        }
        this.isAllStudentInputLatestMultipleDate = this.checkIsAllStudentInputLatestMultipleDate();
      });
    }
  }

  checkIsAllStudentInputLatestMultipleDate(): boolean {
    let isAllStudentHasMark = true;
    for (const student of this.originalStudentList) {
      if (!student.testCorrectionId || !student.correction_grid) {
        isAllStudentHasMark = false;
        break;
      } else {
        for (const section of student.correction_grid.correction.sections_evalskill) {
          for (const subsec of section.sub_sections) {
            const multipleDates = _.cloneDeep(subsec.multiple_dates);
            // find task's due date in student's multiple date mark.
            // ex: if task's due date is "20/11/2020", but student dont have mark in date "20/11/2020"
            // then disable the submit button
            const isDateExist = multipleDates.find((dateData: MultipleDateCorrection) => this.taskData.due_date.date === dateData.date);
            if (!isDateExist) {
              isAllStudentHasMark = false;
              break;
            }
          }
        }
      }
    }
    return isAllStudentHasMark;
  }

  getContainerWidth() {
    let offsetWidth = this.notationGridContainer.nativeElement.offsetWidth;
    // minus 20 becase there is padding and border. padding 8px and border 2px for each side.
    offsetWidth = offsetWidth ? +offsetWidth - 20 : 0;
    return offsetWidth;
  }

  getFooterContainerHeight() {
    let offsetHeight = this.footerContainer.nativeElement.offsetHeight;
    offsetHeight = offsetHeight ? +offsetHeight : 0;
    return offsetHeight;
  }

  // *************** To Get Height window screen and put in style css height
  getAutomaticHeight() {
    if (
      this.testData.correction_grid.header.fields &&
      this.testData.correction_grid.header.fields.length &&
      this.testData.correction_grid.footer.fields &&
      this.testData.correction_grid.footer.fields.length < 1 &&
      !this.testData.correction_grid.correction.show_final_comment
    ) {
      this.myInnerHeight = window.innerHeight - 271;
      return this.myInnerHeight;
    } else if (
      this.testData.correction_grid.footer.fields &&
      this.testData.correction_grid.footer.fields.length &&
      this.testData.correction_grid.header.fields &&
      this.testData.correction_grid.header.fields.length < 1 &&
      !this.testData.correction_grid.correction.show_final_comment
    ) {
      this.myInnerHeight = window.innerHeight - 271;
      return this.myInnerHeight;
    } else if (
      this.testData.correction_grid.header.fields &&
      this.testData.correction_grid.header.fields.length &&
      this.testData.correction_grid.footer.fields &&
      this.testData.correction_grid.footer.fields.length &&
      !this.testData.correction_grid.correction.show_final_comment
    ) {
      this.myInnerHeight = window.innerHeight - 321;
      return this.myInnerHeight;
    } else if (
      this.testData.correction_grid.header.fields &&
      this.testData.correction_grid.header.fields.length &&
      this.testData.correction_grid.footer.fields &&
      this.testData.correction_grid.footer.fields.length &&
      this.testData.correction_grid.correction.show_final_comment
    ) {
      this.myInnerHeight = window.innerHeight - 391;
      return this.myInnerHeight;
    } else if (
      this.testData.correction_grid.header.fields &&
      this.testData.correction_grid.header.fields.length &&
      this.testData.correction_grid.footer.fields &&
      this.testData.correction_grid.footer.fields.length < 1 &&
      this.testData.correction_grid.correction.show_final_comment
    ) {
      // this.myInnerHeight = window.innerHeight - 328;
      this.myInnerHeight = window.innerHeight - 299;
      return this.myInnerHeight;
    } else if (
      this.testData.correction_grid.header.fields &&
      this.testData.correction_grid.header.fields.length < 1 &&
      this.testData.correction_grid.footer.fields &&
      this.testData.correction_grid.footer.fields.length &&
      this.testData.correction_grid.correction.show_final_comment
    ) {
      // this.myInnerHeight = window.innerHeight - 328;
      this.myInnerHeight = window.innerHeight - 335;
      return this.myInnerHeight;
    } else if (
      this.testData.correction_grid.header.fields &&
      this.testData.correction_grid.header.fields.length < 1 &&
      this.testData.correction_grid.footer.fields &&
      this.testData.correction_grid.footer.fields.length < 1 &&
      this.testData.correction_grid.correction.show_final_comment
    ) {
      this.myInnerHeight = window.innerHeight - 284;
      return this.myInnerHeight;
    } else {
      this.myInnerHeight = window.innerHeight - 228;
      return this.myInnerHeight;
    }
  }

  comparison() {
    const firstForm = JSON.stringify(this.firstForm);
    const form = JSON.stringify(this.testCorrectionForm.value);
    if (firstForm === form) {
      return true;
    } else {
      return false;
    }
  }

  comparisonSaveThisScore() {
    const firstForm = JSON.stringify(this.firstForm);
    const form = JSON.stringify(this.testCorrectionForm.value);
    if (
      firstForm === form &&
      !this.testCorrectionForm.get('missing_copy').value &&
      !this.testCorrectionForm.get('is_do_not_participated').value
    ) {
      return true;
    } else {
      return false;
    }
  }

  submitTestCorrectionMentor() {
    // this.cdr.detectChanges();
    const studentPdfResults = this.getStudentPdfResultsMentor();

    this.isWaitingForResponse = true;
    // submit test correction for normal test
    this.subs.sink = this.testCorrectionService.submitMarkEntryMentor(this.testId, this.schoolId, studentPdfResults).subscribe((ressp) => {
      if (ressp) {
        this.isDataSubmit = true;
        this.isWaitingForResponse = false;
        this.firstForm = _.cloneDeep(this.testCorrectionForm.value);
        swal
          .fire({
            type: 'success',
            title: this.translate.instant('TESTCORRECTIONS.MESSAGE.ALLCORRECTIONSSUBMITTEDTitle'),
            html: this.translate.instant('TESTCORRECTIONS.MESSAGE.ALLCORRECTIONSSUBMITTED'),
            confirmButtonText: this.translate.instant('TESTCORRECTIONS.MESSAGE.ALLCORRECTIONSSUBMITTEDBtn'),
            allowOutsideClick: false,
          })
          .then(() => {
            this.subs.sink = this.testCorrectionService.getTest(this.testId).subscribe((test) => {
              if (test) {
                this.getDataFromParam();
                this.getFilteredStudentList();
              }
            });
          });
      }
    });
  }
}
