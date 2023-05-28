import {
  Component,
  OnInit,
  OnDestroy,
  OnChanges,
  ViewChild,
  ViewChildren,
  QueryList,
  AfterViewInit,
  ElementRef,
  Renderer2,
  AfterViewChecked,
} from '@angular/core';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import { SubSink } from 'subsink';
import { RncpTitleCardData, ClassIdAndName, ClassData } from 'app/rncp-titles/RncpTitle.model';
import { UntypedFormGroup, UntypedFormBuilder, UntypedFormArray, Validators } from '@angular/forms';
import { ConditionsService } from 'app/service/conditions/conditions.service';
import {
  BlockSubjectTestIdAndName,
  SubjectsIdAndName,
  TestsData,
  TestCreationPayloadData,
  SchoolTestDatePayload,
  CompetenceTemplate,
  CriteriaEvaluationTemplate,
  DuplicateDialogData,
  BlockTemplate,
  BlockTemplateCompetence,
  TestDateUTC,
} from 'app/test/test-creation/test-creation.model';
import { TestCreationService } from 'app/service/test/test-creation.service';
import * as moment from 'moment';
import * as _ from 'lodash';
import { ParseStringDatePipe } from 'app/shared/pipes/parse-string-date.pipe';
import { SchoolService } from 'app/service/schools/school.service';
import { SchoolIdAndShortName } from 'app/school/School.model';
import { Router, ActivatedRoute } from '@angular/router';
import { GlobalConstants } from 'app/shared/settings';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import Swal from 'sweetalert2';
import swal from 'sweetalert2';
import { TestService } from 'app/service/test/test.service';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { isString } from 'util';
import { Test } from 'app/models/test.model';
import { DateAdapter } from '@angular/material/core';
import { MatDatepicker, MatDatepickerIntl } from '@angular/material/datepicker';
import { MatDialog } from '@angular/material/dialog';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { ParseUtcToLocalPipe } from 'app/shared/pipes/parse-utc-to-local.pipe';
import { ParseLocalToUtcPipe } from 'app/shared/pipes/parse-local-to-utc.pipe';
import { AuthService } from 'app/service/auth-service/auth.service';
import { GlobalErrorService } from 'app/service/global-error-service/global-error-service.service';
import { DuplicateTestDialogComponent } from './duplicate-test-dialog/duplicate-test-dialog.component';
import { UtilityService } from 'app/service/utility/utility.service';
import { clear } from 'console';
// import { TestService } from '../../../service/test/test.service';

@Component({
  selector: 'ms-first-step',
  templateUrl: './first-step.component.html',
  styleUrls: ['./first-step.component.scss'],
  providers: [ParseStringDatePipe, ParseLocalToUtcPipe, ParseUtcToLocalPipe],
})
export class FirstStepComponent implements OnInit, OnDestroy, AfterViewInit, AfterViewChecked {
  private subs = new SubSink();
  @ViewChild('testDatePicker', { static: false }) testDatePicker: MatDatepicker<any>;
  @ViewChild('testTimeDiv', { static: false }) testTimeDiv: ElementRef;
  @ViewChildren('testSchoolDatePicker') testSchoolDatePicker: QueryList<MatDatepicker<any>>;
  @ViewChildren('multipleDateDatePicker') multipleDateDatePicker: QueryList<MatDatepicker<any>>;
  @ViewChildren('testPCTimeDiv') testPCTimeDiv: QueryList<ElementRef>;
  // test: any;
  firstStepForm: UntypedFormGroup;

  // form data variables
  rncpTitle: RncpTitleCardData;
  classes: ClassIdAndName[];
  blockList: BlockSubjectTestIdAndName[];
  subjectList: SubjectsIdAndName[];
  testList: TestsData[];
  testData: TestsData;
  correctionTypes: string[];
  dateTypes = ['marks', 'different', 'fixed'];
  schoolList: SchoolIdAndShortName[] = [];
  formData: TestCreationPayloadData;
  test: Test;
  retakeInformation = {};
  isTestPublished = false;
  isWaitingForResponse = false;
  isSpecializationBlock = false

  isLoadingBlockList: boolean = false;
  isLoadingSubjectList: boolean = false;
  isLoadingEvaluationList: boolean = false;

  today: Date;
  // utility variables
  operation: string;
  isFreeControlDisabled = false;
  isGroupTestDisabled = false;
  isDateDisabled = false;
  isQualityControlDisabled = false;
  dataLoaded = false;
  testId = '';
  titleId = '';
  categoryId = '';
  classId = '';
  duplicateTestId = '';
  classData: ClassData;
  isResetSectionEvalskill = false;

  getNoneClass = true;
  getNoneBlock = true;
  getNoneSubject = true;
  getNoneTest = true;
  dataNoneBlock: any;
  rncpTitleData: any;
  minDate = new Date();

  testProgress;
  init = false;
  currentLoad = 0;

  element: ElementRef;

  constructor(
    private rncpTitlesService: RNCPTitlesService,
    private fb: UntypedFormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private conditionService: ConditionsService,
    public testCreationService: TestCreationService,
    private parseStringDatePipe: ParseStringDatePipe,
    private parseLocalToUTCPipe: ParseLocalToUtcPipe,
    private parseUTCToLocalPipe: ParseUtcToLocalPipe,
    public dialog: MatDialog,
    private schoolService: SchoolService,
    private testService: TestService,
    private translate: TranslateService, // private testService: TestService
    private authService: AuthService,
    private globalErrorService: GlobalErrorService,
    el: ElementRef,
    private renderer: Renderer2,
    private utilService: UtilityService,
    private dateAdapter: DateAdapter<Date>,
  ) {
    this.minDate.setHours(0, 0, 0, 0);
    this.element = el;
  }

  ngOnInit() {
    this.today = new Date();
    this.dateAdapter.setLocale(this.translate.currentLang);
    this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      this.dateAdapter.setLocale(this.translate.currentLang);
    });
    this.initFirstStepForm();
    this.subs.sink = this.route.parent.paramMap.subscribe((params) => {
      // get data from url
      this.titleId = params.get('titleId') ? params.get('titleId') : '';
      this.testId = params.get('testId') ? params.get('testId') : '';
      this.categoryId = params.get('categoryId') ? params.get('categoryId') : '';
      this.classId = params.get('classId') ? params.get('classId') : '';
      this.duplicateTestId = this.route.snapshot.queryParamMap.get('duplicate');


      if (this.titleId) {
        this.firstStepForm.get('parent_rncp_title').patchValue(this.titleId, { emitEvent: false });
        this.firstStepForm.get('parent_category').patchValue(this.categoryId, { emitEvent: false });
        this.isWaitingForResponse = true;
        this.subs.sink = this.rncpTitlesService.getOneTitleById(this.titleId).subscribe((resp) => {
          if (resp) {
            this.rncpTitle = resp;

            this.correctionTypes = this.sortCorrectionTypes(GlobalConstants.CorrectionTypesStringArr);

            this.dateTypes = GlobalConstants.DateTypeStringArr;
            this.getClassData();
            this.eventListener();
            this.subs.sink = this.firstStepForm.valueChanges
              .pipe(debounceTime(50))
              .pipe(
                distinctUntilChanged((a, b) => {
                  delete a.schools;
                  delete b.schools;
                  delete a.date;
                  delete b.date;
                  return _.isEqual(a, b);
                }),
              )
              .subscribe((changes) => {
                if (changes) {
                  this.UpdateService();
                }
              });
          } else {
            this.router.navigate(['/rncpTitles']);
          }
        });
      }
    });
    this.subs.sink = this.testService.getTest().subscribe((resp) => {
      this.test = resp;
    });
    this.subs.sink = this.testCreationService.updateTestContinueData$.subscribe((data) => {
      if (data === 'first') {
        this.goToSecondStep();
      }
    });

    this.retakeInformation = this.testService.getRetakeInformation();

    // Caught error from global error handler
    this.subs.sink = this.globalErrorService.globalErrorData$.subscribe((isError) => {
      if (isError) {
        this.isWaitingForResponse = false;
        this.globalErrorService.setGlobalError(false);
      }
    });
  }

  ngAfterViewInit() {
    const hostElem = this.testTimeDiv.nativeElement;
    this.renderer.setStyle(hostElem.children[0].children[0].children[0].children[1], 'align-self', 'end');
  }

  ngAfterViewChecked() {
    const hostElemPC = this.testPCTimeDiv;
    if (hostElemPC && hostElemPC.length) {
      hostElemPC.forEach((hostelem) => {
        const hostElem = hostelem.nativeElement;
        this.renderer.setStyle(hostElem.children[0].children[0].children[0].children[1], 'align-self', 'end');
      });
    }
  }

  // method to sort correction types alphabetically
  sortCorrectionTypes(types: string[]): string[] {
    let sorted = types;

    // exclude 'none' from types
    sorted = sorted.filter(a => {
      const isNone = /none|Aucune/i.test(a);  
      return !isNone;
    });

    sorted = sorted.sort((a, b) => {
      a = this.translate.instant('TEST.CORRECTIONTYPES.' + a);
      b = this.translate.instant('TEST.CORRECTIONTYPES.' + b);

      return a.trim().localeCompare(b);
    });

    return sorted;
  }

  UpdateService() {
    const currentTime = moment(this.today).format('HH:mm');
    if (this.firstStepForm && this.firstStepForm.getRawValue()) {
      const payload = this.firstStepForm.getRawValue();
      payload.type = payload.type === 'Memoire-ECRIT' ? 'memoire_ecrit' : payload.type;

      if (this.firstStepForm.get('date_type').value === 'multiple_date') {
        this.firstStepForm.get('date').get('date_utc').clearValidators();
        this.firstStepForm.get('date').get('time_utc').clearValidators();
        if (!payload.date.date_utc) {
          payload.date.date_utc = new Date();
        }
      } else {
        this.firstStepForm.get('date').get('date_utc').setValidators([Validators.required]);
        this.firstStepForm.get('date').get('time_utc').setValidators([Validators.required]);
      }

      if (payload.date.date_utc && !payload.date.time_utc) {
        payload.date.time_utc = '00:01';
      }

      payload.send_date_to_mentor.time_utc = '15:59';

      payload.date.date_utc = this.parseLocalToUTCPipe.transformDate(
        moment(payload.date.date_utc).format('DD/MM/YYYY'),
        payload.date.time_utc,
      );

      payload.send_date_to_mentor.date_utc = this.parseLocalToUTCPipe.transformDate(
        moment(payload.send_date_to_mentor.date_utc).format('DD/MM/YYYY'),
        '15:59',
      );

      if (payload.date.date_utc && payload.date.date_utc.length !== 10) {
        payload.date.date_utc = '';
      }

      if (payload.send_date_to_mentor.date_utc && payload.send_date_to_mentor.date_utc.length !== 10) {
        payload.send_date_to_mentor.date_utc = '';
      }

      payload.date.time_utc = this.parseLocalToUTCPipe.transform(payload.date.time_utc);
      payload.send_date_to_mentor.time_utc = '15:59';

      if (payload.schools && payload.schools.length) {
        const tempSchool = [];        
        payload.schools.forEach((schoolTestDate: SchoolTestDatePayload, index: number) => {
          if (schoolTestDate && schoolTestDate.school_id) {
            if (schoolTestDate?.test_date?.date_utc && !schoolTestDate?.test_date?.time_utc) {
              schoolTestDate.test_date.time_utc = '00:01';
            }

            payload.schools[index].test_date.date_utc = this.parseLocalToUTCPipe.transformDate(
              moment(schoolTestDate.test_date.date_utc).format('DD/MM/YYYY'),
              schoolTestDate.test_date.time_utc,
            );

            if (payload.schools[index]?.test_date?.date_utc && payload.schools[index]?.test_date?.date_utc?.length !== 10) {
              payload.schools[index].test_date.date_utc = '';
            }

            payload.schools[index].test_date.time_utc = this.parseLocalToUTCPipe.transform(schoolTestDate.test_date.time_utc);
            this.schoolTestDateFormArray.at(index).get('test_date').get('date_utc').clearValidators();
            this.schoolTestDateFormArray.at(index).get('test_date').get('date_utc').setValidators([Validators.required]);
            this.schoolTestDateFormArray.at(index).get('test_date').get('date_utc').updateValueAndValidity({ emitEvent: false });
            tempSchool.push(payload.schools[index]);
          }
        });
        payload.schools = tempSchool;
      }

      if (this.formData) {
        if (payload.schools && !payload.schools.length) {
          this.formData.schools = [];
        }
        this.testCreationService.setTestCreationData(_.merge(_.cloneDeep(this.formData), payload));
      } else {
        this.testCreationService.setTestCreationData(
          _.merge(_.cloneDeep(this.testCreationService.getTestCreationDataWithoutSubscribe()), payload),
        );
      }

      if (payload.multiple_dates && payload.multiple_dates.length) {
        const tempdates = [];
        payload.multiple_dates.forEach((testDate: TestDateUTC, index: number) => {
          if (testDate.date_utc && !testDate.time_utc) {
            testDate.time_utc = '00:01';
          }

          payload.multiple_dates[index].date_utc = this.parseLocalToUTCPipe.transformDate(
            moment(testDate.date_utc).format('DD/MM/YYYY'),
            testDate.time_utc,
          );

          if (payload.multiple_dates[index].date_utc && payload.multiple_dates[index].date_utc.length !== 10) {
            payload.multiple_dates[index].date_utc = '';
          }

          payload.multiple_dates[index].time_utc = this.parseLocalToUTCPipe.transform(testDate.time_utc);
          this.multipleDateFormArray.at(index).get('date_utc').clearValidators();
          this.multipleDateFormArray.at(index).get('date_utc').setValidators([Validators.required]);
          this.multipleDateFormArray.at(index).get('date_utc').updateValueAndValidity({ emitEvent: false });
          tempdates.push(payload.multiple_dates[index]);
        });
        payload.multiple_dates = tempdates;
      }

      if (this.formData) {
        this.formData.multiple_dates = [];
        this.testCreationService.setTestCreationData(_.merge(_.cloneDeep(this.formData), payload));
      } else {
        this.testCreationService.setTestCreationData(
          _.merge(_.cloneDeep(this.testCreationService.getTestCreationDataWithoutSubscribe()), payload),
        );
      }

      this.firstStepForm.get('date').get('date_utc').updateValueAndValidity({ emitEvent: false });
      this.testCreationService.setFirstTabValidation(this.firstStepForm.valid);
    }
  }

  getSchoolList() {
    const classId = this.firstStepForm.get('class_id').value;
    this.subs.sink = this.rncpTitlesService.getSchoolListByClass(this.rncpTitle._id, classId).subscribe((res) => {
      if (res) {
        res = _.cloneDeep(_.filter(res, (school) => school && school._id && school.short_name));
        this.schoolList = res.sort((school1, school2) => school1.short_name.toLowerCase() > school2.short_name.toLowerCase() ? 1 : school1.short_name.toLowerCase() < school2.short_name.toLowerCase() ? -1 : 0);
      } else {
        this.schoolList = [];
      }
    });
  }

  initFirstStepForm() {
    this.firstStepForm = this.fb.group({
      _id: [''],
      is_published: [false],
      parent_rncp_title: [''],
      parent_category: [''],
      name: ['', Validators.required],
      class_id: ['', Validators.required],
      block_of_competence_condition_id: ['', Validators.required],
      block_type: [null],
      subject_id: ['', Validators.required],
      evaluation_id: ['', Validators.required],
      coefficient: [null],
      weight: [null],
      type: [''],
      correction_type: ['', Validators.required],
      organiser: ['prep_center', Validators.required],
      date: this.testDateInit(),
      send_date_to_mentor: this.testDateInit(),
      date_type: ['', Validators.required],
      multiple_dates: this.fb.array([]),
      quality_control: [false],
      student_per_school_for_qc: [null],
      quality_control_difference: [null],
      controlled_test: [false],
      with_assign_corrector: [false],
      group_test: [false],
      schools: this.fb.array([]),
      cross_corr_paperless: [true, Validators.required],
      correction_grid: this.fb.group({
        group_detail: this.fb.group({ min_no_of_student: [null], no_of_student: [null] }),
        correction: this.fb.group({ sections_evalskill: this.fb.array([]) }),
      }),
      is_retake_test: [false],
    });
  }

  testDateInit(): UntypedFormGroup {
    return this.fb.group({
      date_utc: [''],
      time_utc: [''],
    });
  }

  get schoolTestDateFormArray() {
    return this.firstStepForm.get('schools') as UntypedFormArray;
  }

  addSchoolTestDateFormArray() {
    this.schoolTestDateFormArray.push(this.initSchoolTestDateFormArray());
  }

  initSchoolTestDateFormArray() {
    return this.fb.group({
      school_id: [''],
      test_date: this.fb.group({ date_utc: [''], time_utc: [''] }),
    });
  }

  get multipleDateFormArray(): UntypedFormArray {
    return this.firstStepForm.get('multiple_dates') as UntypedFormArray;
  }

  addMultipleDateFormArray() {
    this.multipleDateFormArray.push(this.initMultipleDateFormArray());
  }

  removeMultipleDateFormArray(dateIndex: number) {
    this.multipleDateFormArray.removeAt(dateIndex);
  }

  initMultipleDateFormArray() {
    return this.fb.group({
      date_utc: [''],
      time_utc: [''],
    });
  }

  getMinDate(dateIndex: number) {
    if (!this.multipleDateFormArray.at(dateIndex - 1)) {
      return this.minDate;
    } else {
      const previousDate: TestDateUTC = _.cloneDeep(this.multipleDateFormArray.at(dateIndex - 1).value);
      if (previousDate && previousDate.date_utc) {
        const datePlusOneMonth = previousDate.date_utc.setMonth(previousDate.date_utc.getMonth() + 1);
        const minimumDate = new Date(datePlusOneMonth);
        return minimumDate;
      } else {
        return this.minDate;
      }
    }
  }

  initAdditionalParameter() {
    this.firstStepForm.get('controlled_test').patchValue(false);
    this.firstStepForm.get('group_test').patchValue(false);
    this.firstStepForm.get('quality_control').patchValue(false);
  }

  getTestCreationData() {
    this.subs.sink = this.testCreationService.isTestCreationLoaded$.subscribe((isLoaded) => {
      if (isLoaded) {
        // *************** when edit test
        this.operation = 'edit';
        this.formData = _.cloneDeep(this.testCreationService.getTestCreationDataWithoutSubscribe());
        this.populateMultipleDateForm();
        this.populateForm('if isloaded');
        this.getBlockList();
        this.eventListener();
      } else if (!this.dataLoaded && !this.testId) {
        // *************** when create test
        this.dataLoaded = true;
        this.UpdateService();
        const temp = this.testCreationService.getTestCreationDataWithoutSubscribe();
        this.testCreationService.setSavedTestCreationData(temp);
        this.formData = _.cloneDeep(temp);
      }
      this.getSchoolList();
      // *************** update formData and form everytime there is change in service
      this.subs.sink = this.testCreationService.testCreationData$.subscribe((resp) => {
        if (resp && resp.evaluation_id) {
          this.formData = _.cloneDeep(resp);
          this.populateForm('every time change service');
        }
      });
    });
  }

  populateMultipleDateForm() {
    if (this.formData.multiple_dates && this.formData.multiple_dates.length) {
      this.formData.multiple_dates.forEach((date) => {
        this.addMultipleDateFormArray();
      });
    }
  }

  populateForm(from?) {
    if (this.formData.date.date_utc && this.formData.date.date_utc.length !== 10) {
      this.formData.date.date_utc = '';
    }
    if (this.formData.date.date_utc && this.formData.date.time_utc) {
      this.formData.date.date_utc = this.parseStringDatePipe.transformStringToDate(
        this.parseUTCToLocalPipe.transformDate(this.formData.date.date_utc, this.formData.date.time_utc),
      );
    }
    this.formData.date.time_utc = this.parseUTCToLocalPipe.transform(this.formData.date.time_utc);

    if (
      this.formData.send_date_to_mentor &&
      this.formData.send_date_to_mentor.date_utc &&
      this.formData.send_date_to_mentor.date_utc.length !== 10
    ) {
      this.formData.date.date_utc = '';
    }
    if (this.formData.send_date_to_mentor && this.formData.send_date_to_mentor.date_utc && this.formData.send_date_to_mentor.time_utc) {
      this.formData.send_date_to_mentor.date_utc = this.parseStringDatePipe.transformStringToDate(
        this.parseUTCToLocalPipe.transformDate(this.formData.send_date_to_mentor.date_utc, this.formData.send_date_to_mentor.time_utc),
      );
    }
    this.formData.send_date_to_mentor.time_utc = this.parseUTCToLocalPipe.transform(this.formData.send_date_to_mentor.time_utc);

    if (this.formData.schools && this.formData.schools.length) {
      const tempSchool = [];
      this.schoolTestDateFormArray.clear();
      this.formData.schools.forEach((date) => {
        if (date && date.school_id) {
          this.addSchoolTestDateFormArray();
          if (date.test_date.date_utc && date.test_date.date_utc.length !== 10) {
            date.test_date.date_utc = '';
          }
          if (date.test_date.date_utc && date.test_date.time_utc) {
            date.test_date.date_utc = this.parseStringDatePipe.transformStringToDate(
              this.parseUTCToLocalPipe.transformDate(date.test_date.date_utc, date.test_date.time_utc),
            );
          } else {
            date.test_date.date_utc = '';
          }
          date.test_date.time_utc = this.parseUTCToLocalPipe.transform(date.test_date.time_utc);
          tempSchool.push(date);
        }
      });
      this.formData.schools = tempSchool;
    }

    if (this.formData.multiple_dates && this.formData.multiple_dates.length) {
      const tempDates = [];
      this.formData.multiple_dates.forEach((date) => {
        if (date.date_utc && date.date_utc.length !== 10) {
          date.date_utc = '';
        }
        if (date.date_utc && date.time_utc) {
          date.date_utc = this.parseStringDatePipe.transformStringToDate(
            this.parseUTCToLocalPipe.transformDate(date.date_utc, date.time_utc),
          );
        } else {
          date.date_utc = '';
        }
        date.time_utc = this.parseUTCToLocalPipe.transform(date.time_utc);
        tempDates.push(date);
      });
      this.formData.multiple_dates = tempDates;
    }

    // patch value to form
    this.firstStepForm.patchValue(this.formData);
    
    if (!this.dataLoaded) {
      this.dataLoaded = true;
      if (this.formData.is_published) {
        this.subs.sink = this.testCreationService.testProgressData$.subscribe((testProgress) => {
          this.testProgress = testProgress;
          if (this.testProgress && this.testProgress.is_assign_corrector_done) {
            this.firstStepForm.disable();
          }
        });
      }
    }
  }

  getClassData(from?) {
    this.isWaitingForResponse = true;
    this.subs.sink = this.rncpTitlesService.getClassesByTitle(this.rncpTitle._id).subscribe((resp) => {
      if (this.classes && this.classes.length && this.classes !== resp) {
        this.firstStepForm.get('class_id').patchValue('');
      }

      // If there is parameter of class on create-test, then we populate it
      if (this.classId) {
        this.firstStepForm.get('class_id').patchValue(this.classId);
        this.getBlockList();
      }

      this.classes = resp;
      if (!this.testId) {
        this.init = true;
        this.isWaitingForResponse = false;
      }
      this.getTestCreationData();
    });
  }

  getBlockList() {
    const classId = this.firstStepForm.get('class_id').value;

    if (classId) {
      const testId = this.testId ? this.testId : '';
      this.isLoadingBlockList = true
      this.subs.sink = this.conditionService.getFilteredBlockCondition(this.rncpTitle._id, classId, true, testId).subscribe((resp) => {

        if (this.blockList && this.blockList.length && this.blockList !== resp && this.init) {
          this.firstStepForm.get('block_of_competence_condition_id').patchValue('');
        }

        // clean html tag from block_of_competence_condition
        const respCleanBlockNames = resp.map(data => {
          const cleanName = this.utilService.cleanHTML(data.block_of_competence_condition);
          data.block_of_competence_condition = cleanName.trim();
          return data;
        });

        // sort blockList alphabetically
        const sortedBlocks = respCleanBlockNames.sort((a, b) => {
          return a.block_of_competence_condition.localeCompare(b.block_of_competence_condition);
        });

        this.blockList = sortedBlocks;
        
        this.getSubjectList();
        this.isLoadingBlockList = false
        if (this.isWaitingForResponse && !this.init && resp.length === 0) {
          this.isWaitingForResponse = false;
          this.init = true;
        }
      });
    } else {
      this.firstStepForm.get('class_id').patchValue('');
      this.blockList = [];
      this.firstStepForm.get('block_of_competence_condition_id').patchValue('');
      this.getSubjectList();
    }
  }

  getSectionEvalskill() {
    return this.firstStepForm.get('correction_grid').get('correction').get('sections_evalskill') as UntypedFormArray;
  }

  initSectionEvalskillForm() {
    return this.fb.group({
      ref_id: [''],
      is_selected: [false],
      title: [''],
      page_break: [false],
      academic_skill_competence_template_id: [null],
      soft_skill_competence_template_id: [null],
      academic_skill_block_template_id: [null],
      soft_skill_block_template_id: [null],
      score_conversions: this.fb.array([]),
      sub_sections: this.fb.array([]),
    });
  }

  addSectionEvalskillForm() {
    this.getSectionEvalskill().push(this.initSectionEvalskillForm());
  }

  getSectionEvalskillScoreConversionForm(sectionIndex: number) {
    return this.getSectionEvalskill().at(sectionIndex).get('score_conversions') as UntypedFormArray;
  }

  initSectionEvalskillScoreConversionForm() {
    return this.fb.group({
      _id: [null],
      score: [null],
      phrase: [''],
      letter: [''],
      academic_skill_score_conversion_id: [null],
      soft_skill_score_conversion_id: [null],
    });
  }

  addSectionEvalskillScoreConversionForm(sectionIndex: number) {
    this.getSectionEvalskillScoreConversionForm(sectionIndex).push(this.initSectionEvalskillScoreConversionForm());
  }

  getSubSectionEvalskillForm(sectionIndex: number) {
    return this.getSectionEvalskill().at(sectionIndex).get('sub_sections') as UntypedFormArray;
  }

  initSubSectionEvalskillForm() {
    return this.fb.group({
      ref_id: [''],
      is_selected: [false],
      title: [''],
      direction: [''],
      maximum_rating: [null],
      academic_skill_criteria_of_evaluation_competence_id: [null],
      soft_skill_criteria_of_evaluation_competence_id: [null],
      academic_skill_competence_template_id: [null],
      soft_skill_competence_template_id: [null],
    });
  }

  addSubSectionEvalskillForm(sectionIndex: number) {
    this.getSubSectionEvalskillForm(sectionIndex).push(this.initSubSectionEvalskillForm());
  }

  populateSectionEvalskillScoreConversionForm(sectionIndex: number, type: string) {
    this.getSectionEvalskillScoreConversionForm(sectionIndex).clear();
    if (type === 'competence') {
      if (this.classData && this.classData.score_conversions_competency && this.classData.score_conversions_competency.length) {
        this.classData.score_conversions_competency.forEach((scoreConv, scoreConvIdx) => {
          this.addSectionEvalskillScoreConversionForm(sectionIndex);
          this.getSectionEvalskillScoreConversionForm(sectionIndex).at(scoreConvIdx).patchValue(scoreConv);
          this.getSectionEvalskillScoreConversionForm(sectionIndex)
            .at(scoreConvIdx)
            .get('academic_skill_score_conversion_id')
            .setValue(scoreConv._id);
          this.UpdateService();
          this.testCreationService.setSavedTestCreationData(this.testCreationService.getTestCreationDataWithoutSubscribe());
        });
      }
    } else if (type === 'soft_skill') {
      if (this.classData && this.classData.score_conversions_soft_skill && this.classData.score_conversions_soft_skill.length) {
        this.classData.score_conversions_soft_skill.forEach((scoreConv, scoreConvIdx) => {
          this.addSectionEvalskillScoreConversionForm(sectionIndex);
          this.getSectionEvalskillScoreConversionForm(sectionIndex).at(scoreConvIdx).patchValue(scoreConv);
          this.getSectionEvalskillScoreConversionForm(sectionIndex)
            .at(scoreConvIdx)
            .get('soft_skill_score_conversion_id')
            .setValue(scoreConv._id);
          this.UpdateService();
          this.testCreationService.setSavedTestCreationData(this.testCreationService.getTestCreationDataWithoutSubscribe());
        });
      }
    }
  }

  // *************** automatically populate section_evalskill and it's sub_section with competence or soft skill block data
  populateNewlyCreatedBlockCriteria(block: BlockSubjectTestIdAndName, templateData?: BlockTemplate[]) {
    const formData = _.cloneDeep(this.testCreationService.getTestCreationDataWithoutSubscribe());
    // this.firstStepForm.get('block_type').setValue(block.block_type ? block.block_type : 'manual');
    this.firstStepForm.get('block_type').setValue(block.block_type);
    if (
      block &&
      (block.block_type === 'competence' || block.block_type === 'soft_skill') &&
      (block.block_of_tempelate_competence || block.block_of_tempelate_soft_skill) &&
      !templateData
    ) {
      // code for normal evaluation by competence
      if (block.block_type === 'competence' && block.block_of_tempelate_competence) {
        this.getSectionEvalskill().clear();
        block.block_of_tempelate_competence.competence_templates_id.forEach((template, templateIndex) => {
          this.populateEvalskillCompetency(template, templateIndex, formData, 'competence');
          this.populateSectionEvalskillScoreConversionForm(templateIndex, 'competence');
          this.getSubSectionEvalskillForm(templateIndex).clear();
          template.criteria_of_evaluation_templates_id.forEach((evaluation, evalIndex) => {
            this.populateEvalskillEvaluation(templateIndex, evaluation, evalIndex, formData, 'competence');
          });
        });
        this.autoSave();
      } else if (block.block_type === 'soft_skill' && block.block_of_tempelate_soft_skill) {
        this.getSectionEvalskill().clear();
        block.block_of_tempelate_soft_skill.competence_softskill_templates_id.forEach((template, templateIndex) => {
          this.populateEvalskillCompetency(template, templateIndex, formData, 'soft_skill');
          this.populateSectionEvalskillScoreConversionForm(templateIndex, 'soft_skill');
          this.getSubSectionEvalskillForm(templateIndex).clear();
          template.criteria_of_evaluation_softskill_templates_id.forEach((evaluation, evalIndex) => {
            this.populateEvalskillEvaluation(templateIndex, evaluation, evalIndex, formData, 'soft_skill');
          });
        });
        this.autoSave();
      }
    } else if (block && (block.block_type === 'competence' || block.block_type === 'soft_skill') && templateData) {
      // code for auto/pro evaluation by competence
      if (block.block_type === 'competence' && templateData && templateData.length) {
        this.getSectionEvalskill().clear();
        let sectionIndex = 0;
        templateData.forEach((blockData, blockIndex) => {
          blockData.competence_templates_id.forEach((template, templateIndex) => {
            this.populateEvalskillCompetency(template, sectionIndex, formData, 'competence');
            this.getSectionEvalskill().at(sectionIndex).get('academic_skill_block_template_id').setValue(blockData._id);
            this.populateSectionEvalskillScoreConversionForm(sectionIndex, 'competence');
            this.getSubSectionEvalskillForm(sectionIndex).clear();
            template.criteria_of_evaluation_templates_id.forEach((evaluation, evalIndex) => {
              this.populateEvalskillEvaluation(sectionIndex, evaluation, evalIndex, formData, 'competence');
            });
            sectionIndex = sectionIndex + 1;
          });
        });
        this.autoSave();
      } else if (block.block_type === 'soft_skill' && templateData && templateData.length) {
        this.getSectionEvalskill().clear();
        let sectionIndex = 0;
        templateData.forEach((blockData, blockIndex) => {
          blockData.competence_softskill_templates_id.forEach((template, templateIndex) => {
            this.populateEvalskillCompetency(template, sectionIndex, formData, 'soft_skill');
            this.getSectionEvalskill().at(sectionIndex).get('soft_skill_block_template_id').setValue(blockData._id);
            this.populateSectionEvalskillScoreConversionForm(sectionIndex, 'soft_skill');
            this.getSubSectionEvalskillForm(sectionIndex).clear();
            template.criteria_of_evaluation_softskill_templates_id.forEach((evaluation, evalIndex) => {
              this.populateEvalskillEvaluation(sectionIndex, evaluation, evalIndex, formData, 'soft_skill');
            });
            sectionIndex = sectionIndex + 1;
          });
        });
        this.autoSave();
      }
    }
  }

  // *************** populate section_evalskill form
  populateEvalskillCompetency(template: CompetenceTemplate, templateIndex: number, formData: TestCreationPayloadData, type: string) {
    this.addSectionEvalskillForm();
    if (type === 'competence') {
      this.getSectionEvalskill().at(templateIndex).get('academic_skill_competence_template_id').setValue(template._id);
    } else if (type === 'soft_skill') {
      this.getSectionEvalskill().at(templateIndex).get('soft_skill_competence_template_id').setValue(template._id);
    }
    this.getSectionEvalskill().at(templateIndex).get('ref_id').setValue(template.ref_id);
    let sectionTitle = '';
    // if we already set the title in step 2, dont replace it with data from template
    if (
      formData &&
      formData.correction_grid.correction.sections_evalskill[templateIndex] &&
      formData.correction_grid.correction.sections_evalskill[templateIndex].title
    ) {
      sectionTitle = formData.correction_grid.correction.sections_evalskill[templateIndex].title;
      const sectionSelected = formData.correction_grid.correction.sections_evalskill[templateIndex].is_selected;
      const sectionPageBreak = formData.correction_grid.correction.sections_evalskill[templateIndex].page_break;
      this.getSectionEvalskill().at(templateIndex).get('is_selected').setValue(sectionSelected);
      this.getSectionEvalskill().at(templateIndex).get('page_break').setValue(sectionPageBreak);
    } else {
      this.getSectionEvalskill().at(templateIndex).get('is_selected').setValue(true);
    }
    if (sectionTitle && template.name !== sectionTitle) {
      this.getSectionEvalskill().at(templateIndex).get('title').setValue(sectionTitle);
    } else {
      this.getSectionEvalskill().at(templateIndex).get('title').setValue(template.name);
    }
  }

  // *************** populate sub_section of section_evalskill form
  populateEvalskillEvaluation(
    templateIndex: number,
    evaluation: CriteriaEvaluationTemplate,
    evalIndex: number,
    formData: TestCreationPayloadData,
    type: string,
  ) {
    this.addSubSectionEvalskillForm(templateIndex);
    this.getSubSectionEvalskillForm(templateIndex).at(evalIndex).get('ref_id').setValue(evaluation.ref_id);
    if (type === 'competence') {
      this.getSubSectionEvalskillForm(templateIndex).at(evalIndex).get('maximum_rating').setValue(this.classData.max_score_competency);
      this.getSubSectionEvalskillForm(templateIndex)
        .at(evalIndex)
        .get('academic_skill_criteria_of_evaluation_competence_id')
        .setValue(evaluation._id);
    } else if (type === 'soft_skill') {
      this.getSubSectionEvalskillForm(templateIndex).at(evalIndex).get('maximum_rating').setValue(this.classData.max_score_soft_skill);
      this.getSubSectionEvalskillForm(templateIndex)
        .at(evalIndex)
        .get('soft_skill_criteria_of_evaluation_competence_id')
        .setValue(evaluation._id);
    }
    // if we already set the title in step 2, dont replace it with data from template
    let subsectionTitle = '';
    let subsectionDirective = '';
    if (
      formData &&
      formData.correction_grid.correction.sections_evalskill[templateIndex] &&
      formData.correction_grid.correction.sections_evalskill[templateIndex].sub_sections &&
      formData.correction_grid.correction.sections_evalskill[templateIndex].sub_sections[evalIndex] &&
      formData.correction_grid.correction.sections_evalskill[templateIndex].sub_sections[evalIndex].title
    ) {
      subsectionTitle = formData.correction_grid.correction.sections_evalskill[templateIndex].sub_sections[evalIndex].title;
      subsectionDirective = formData.correction_grid.correction.sections_evalskill[templateIndex].sub_sections[evalIndex].direction;
      const subSelected = formData.correction_grid.correction.sections_evalskill[templateIndex].sub_sections[evalIndex].is_selected;
      this.getSubSectionEvalskillForm(templateIndex).at(evalIndex).get('is_selected').setValue(subSelected);
    } else {
      this.getSubSectionEvalskillForm(templateIndex).at(evalIndex).get('is_selected').setValue(true);
    }
    if (subsectionTitle && evaluation.name !== subsectionTitle) {
      this.getSubSectionEvalskillForm(templateIndex).at(evalIndex).get('title').setValue(subsectionTitle);
    } else {
      this.getSubSectionEvalskillForm(templateIndex).at(evalIndex).get('title').setValue(evaluation.name);
    }
    if (subsectionDirective) {
      this.getSubSectionEvalskillForm(templateIndex).at(evalIndex).get('direction').setValue(subsectionDirective);
    }
  }

  getSubjectList() {
    const blockId = this.firstStepForm.get('block_of_competence_condition_id').value;



    if (blockId && this.blockList) {
      this.blockList.forEach((block) => {
        if (block._id === blockId) {
          // determine if this test is retake test or not
          this.firstStepForm.get('is_retake_test').setValue(block.is_retake_by_block);
          // get subjects dropdown list
          const payload = {
            rncp_title_id: this.rncpTitle._id,
            class_id: this.firstStepForm.get('class_id').value,
            test_not_created: true,
            block_of_competence_condition_id: blockId,
            test_id: this.testId ? this.testId : '',
          };
          this.isLoadingSubjectList = true;
          this.subs.sink = this.conditionService.getFilteredSubjectCondition(payload).subscribe((subjects) => {
            if (this.subjectList && this.subjectList.length && this.subjectList !== block.subjects && this.init) {
              this.firstStepForm.get('subject_id').patchValue('');
            }

            // sort subjectList alphabetically
            const sortedSubjects = subjects.sort((a, b) => a?.subject_name?.trim()?.localeCompare(b?.subject_name?.trim()));
            this.subjectList = sortedSubjects;

            this.getTestList();
            this.isLoadingSubjectList = false;
            if (this.isWaitingForResponse && !this.init && subjects.length === 0) {
              this.isWaitingForResponse = false;
              this.init = true;
            }
          });
        }
      });
    } else {
      this.firstStepForm.get('block_of_competence_condition_id').patchValue('');
      this.subjectList = [];
      this.firstStepForm.get('subject_id').patchValue('');
      this.getTestList();
    }
  }

  getTestList() {
    const subjectId = this.firstStepForm.get('subject_id').value;

    if (subjectId && this.subjectList) {
      this.subjectList.forEach((subject) => {
        if (subject._id === subjectId) {
          const payload = {
            rncp_title_id: this.rncpTitle._id,
            class_id: this.firstStepForm.get('class_id').value,
            test_not_created: true,
            subject_id: subjectId,
            test_id: this.testId ? this.testId : '',
          };
          this.isLoadingEvaluationList = true;
          this.subs.sink = this.conditionService.getFilteredEvaluationCondition(payload).subscribe((evaluation) => {
            if (this.testList && this.testList.length && this.testList !== evaluation.evaluations && this.init) {
              this.firstStepForm.get('evaluation_id').patchValue('');
            }
            this.firstStepForm.get('coefficient').patchValue(subject.coefficient ? subject.coefficient : null);

            // sort testList alphabetically
            const sortedTests = evaluation.sort((a, b) => a?.evaluation?.trim()?.localeCompare(b?.evaluation?.trim()));
            this.testList = sortedTests;

            this.getTestData();
            this.isLoadingEvaluationList = false;
            if (this.isWaitingForResponse && !this.init && evaluation.length === 0) {
              this.isWaitingForResponse = false;
              this.init = true;
            }
          });
        }
      });
    } else {
      this.firstStepForm.get('subject_id').patchValue('');
      this.firstStepForm.get('coefficient').patchValue(null);
      this.testList = [];
      this.firstStepForm.get('evaluation_id').patchValue('');
      this.getTestData();
    }
  }

  getTestData(type: string = 'event') {
    const testId = this.firstStepForm.get('evaluation_id').value;
    const classId = this.firstStepForm.get('class_id').value;

    if (testId && this.testList) {
      this.testList.forEach((test) => {
        if (test._id === testId) {
          this.testData = test;
          this.firstStepForm.get('name').setValue(this.testData.evaluation);
          this.firstStepForm.get('weight').setValue(this.testData.weight);
          this.firstStepForm.get('type').setValue(this.testData.type.toLowerCase());
        }
      });
    } else {
      this.testData = null;
      this.firstStepForm.get('name').setValue('');
      this.firstStepForm.get('evaluation_id').patchValue('');
      this.firstStepForm.get('weight').setValue(null);
      this.firstStepForm.get('type').setValue('');
    }

    if (classId) {
      this.rncpTitlesService.getClassScoreConversionById(classId).subscribe((classData) => {
        this.classData = classData;
        if (this.classData && this.classData.type_evaluation === 'expertise') {
          // reset section_evalskill if selected test is free control
          if (this.firstStepForm.get('type').value && this.firstStepForm.get('type').value === 'free_continuous_control') {
            this.resetSectionEvalskill();
          } else {
            this.processEvalByCompetenceData();
          }
        }
      });
    }

    // reset section_evalskill when select other block in dropdown UI
    if (this.isResetSectionEvalskill) {
      this.resetSectionEvalskill();
      this.toggleResetSectionEvalskill(false);
    }

    // reset with_assign_corrector field when user change the test type
    if (this.firstStepForm.get('with_assign_corrector').dirty || this.firstStepForm.get('with_assign_corrector').touched) {
      this.firstStepForm.get('with_assign_corrector').patchValue(false);
    }

    // trigger valueChanges manually so the code in eventListener() will executed again
    this.firstStepForm.updateValueAndValidity({ emitEvent: true });
    this.isWaitingForResponse = false;
  }

  resetSectionEvalskill() {
    // reset section_evalskill field in form
    this.getSectionEvalskill().clear();
    // reset section_evalskill data in service
    const form = this.testCreationService.getTestCreationDataWithoutSubscribe();
    form.correction_grid.correction.sections_evalskill = [];
    this.testCreationService.setTestCreationData(form);
  }

  checkIfCompetencyExist(blockId: string, blockType: string, is_specialization) {
    this.isSpecializationBlock = is_specialization;
    if (blockType && (blockType === 'competence' || blockType === 'soft_skill')) {
      this.isWaitingForResponse = true;
      this.testCreationService.isBlockCompetencyExist(blockId).subscribe((resp) => {
        this.isWaitingForResponse = false;
        if (!resp || !resp.have_score_conversion || !resp.have_complete_template) {
          this.showBlockCompetencyEmptySwal();
        }
      });
    }
  }

  toggleResetSectionEvalskill(isReset: boolean) {
    this.isResetSectionEvalskill = isReset;
  }

  showBlockCompetencyEmptySwal() {
    Swal.fire({
      type: 'error',
      allowOutsideClick: false,
      title: this.translate.instant('TEST.TESTCREATE_S4.title'),
      html: this.translate.instant('TEST.TESTCREATE_S4.text'),
      confirmButtonText: this.translate.instant('TEST.TESTCREATE_S4.confirm_btn'),
    }).then((result) => {
      if (result.value) {
        this.firstStepForm.get('block_of_competence_condition_id').patchValue('');
        this.firstStepForm.get('subject_id').patchValue('');
        this.firstStepForm.get('evaluation_id').patchValue('');
      }
    });
  }

  processEvalByCompetenceData() {
    const autoprotype = ['academic_auto_evaluation', 'academic_pro_evaluation', 'soft_skill_auto_evaluation', 'soft_skill_pro_evaluation', 'preparation_center_eval_soft_skill'];
    if (this.testData && autoprotype.includes(this.testData.type.toLowerCase())) {
      // *************** Process Block and Competency data if test type is auto/pro evaluation by competence
      const blockId = this.firstStepForm.get('block_of_competence_condition_id').value;
      const classId = this.firstStepForm.get('class_id').value;
      const titleId = this.rncpTitle._id;
      const selectedBlock = this.blockList.find((block) => block._id === blockId);
      if (selectedBlock && selectedBlock.block_type === 'competence') {
        this.subs.sink = this.conditionService.getBlockAcademicTemplateAutoProEval(titleId, classId).subscribe((resp) => {
          const temp = _.cloneDeep(resp);
          this.populateNewlyCreatedBlockCriteria(selectedBlock, temp);
        });
      } else if (selectedBlock && selectedBlock.block_type === 'soft_skill') {
        this.subs.sink = this.conditionService.getBlockSoftSkillTemplateAutoProEval(titleId, classId).subscribe((resp) => {
          const temp = _.cloneDeep(resp);
          this.populateNewlyCreatedBlockCriteria(selectedBlock, temp);
        });
      }
    } else {
      // *************** Process Block and Competency data if test is normal evaluation by competence
      const blockId = this.firstStepForm.get('block_of_competence_condition_id').value;
      const selectedBlock = this.blockList.find((block) => block._id === blockId);
      if (selectedBlock) {
        this.populateNewlyCreatedBlockCriteria(selectedBlock);
      }
    }
  }

  isTypeWrittenOralMemoireEcrit() {
    const testType = this.firstStepForm.get('type').value;
    return testType.trim() === 'Written' || testType.trim() === 'Oral' || testType.trim() === 'Memoire-ECRIT';
  }

  setTestDate() {
    const dateType = this.firstStepForm.get('date_type').value;
    if (dateType.trim() === 'different' && !(_.cloneDeep(this.schoolTestDateFormArray).length === this.schoolList.length)) {
      if (!(_.cloneDeep(this.schoolTestDateFormArray.length) === this.schoolList.length)) {
        this.schoolTestDateFormArray.clear();
        this.schoolTestDateFormArray.reset();
        this.schoolTestDateFormArray.updateValueAndValidity();
      }
      // *************** create date input form for each school if date type is "different dates/school"
      this.schoolTestDateFormArray.clear();
      this.schoolList.forEach((school: SchoolIdAndShortName, index: number) => {
        if (school) {
          this.addSchoolTestDateFormArray();
          this.schoolTestDateFormArray.at(index).get('school_id').patchValue(school._id);
          this.schoolTestDateFormArray
            .at(index)
            .get('test_date')
            .patchValue(this.firstStepForm.get('date').value ? this.firstStepForm.get('date').value : null);
        }
      });
      this.schoolTestDateFormArray.updateValueAndValidity();
      this.UpdateService();
    } else if (dateType.trim() === 'multiple_date') {
      this.addMultipleDateFormArray();
      this.UpdateService();
    } else {
      if (_.cloneDeep(this.schoolTestDateFormArray).length) {
        this.schoolTestDateFormArray.clear();
        this.schoolTestDateFormArray.reset();
        this.schoolTestDateFormArray.updateValueAndValidity();
        this.UpdateService();
      } else if (_.cloneDeep(this.multipleDateFormArray).length) {
        this.multipleDateFormArray.clear();
        this.multipleDateFormArray.reset();
        this.multipleDateFormArray.updateValueAndValidity();
        this.UpdateService();
      }
    }
  }

  goToSecondStep() {
    const data = this.firstStepForm.getRawValue();
    if (data?.parent_rncp_title && data?.parent_category && data?._id) {
      this.router.navigate([
        '/create-test',
        data.parent_rncp_title,
        {
          categoryId: data.parent_category,
          testId: data._id
        },
        data?.controlled_test ? 'third' : 'second',
      ])
    }
  }

  reloadFirstStep() {
    const data = this.firstStepForm.getRawValue();
    this.blockList = [];
    this.subjectList = [];
    this.testList = [];
    this.init = false;
    this.dataLoaded = false;
    if (data?.parent_rncp_title && data?.parent_category && data?._id) {
      this.router.navigate([
        '/create-test',
        data.parent_rncp_title,
        {
          categoryId: data.parent_category,
          testId: data._id
        },
        'first'
      ])
    }
  }

  ngOnDestroy() {
    if (this.firstStepForm && this.firstStepForm.getRawValue()) {
      this.testCreationService.removeContinueButton();
      this.subs.unsubscribe();
    }
  }

  cancelTest() {
    Swal.fire({
      title: 'Attention',
      text: this.translate.instant('TEST.MESSAGES.CLOSECONFIRM'),
      type: 'question',
      showCancelButton: true,
      cancelButtonText: this.translate.instant('NO'),
      allowEscapeKey: true,
      confirmButtonText: this.translate.instant('YES'),
    }).then(
      () => {
        this.subs.sink = this.testService.cancelTest().subscribe(
          function () {
            this.router.navigateByUrl('/rncpTitles');
          }.bind(this),
        );
      },
      function (dismiss) {
        if (dismiss === 'cancel') {
        }
      },
    );
  }

  saveOrPublishTest(leave, isPublish) {
    if (this.testService.getValidation() || this.test._id) {
      this.subs.sink = this.testService.submitTest(true, isPublish ? isPublish : false).subscribe((status) => {
        if (status) {
          swal
            .fire({
              title: this.translate.instant('CONGRATULATIONS'),
              text: this.translate.instant('TEST.MESSAGES.TESTSAVESUCCESS'), // 'Vous venez de créer l\'épreuve',
              allowEscapeKey: false,
              allowOutsideClick: false,
              type: 'success',
            })
            .then(() => {
              if (leave) {
                this.router.navigate(['/rncpTitles']);
              }
            });
        } else {
          swal.fire({
            title: 'Attention',
            text: this.translate.instant('TEST.ERRORS.TESTCREATIONERROR'),
            allowEscapeKey: true,
            type: 'warning',
          });
        }
      });
    } else { 
      const step = this.router.url.substr(this.router.url.lastIndexOf('/') + 1);
      switch (step) {
        case 'first':
          if (this.test.type === null || this.test.type === '') {
            swal.fire({
              title: 'Attention',
              text: this.translate.instant('TEST.ERRORS.NOTESTTYPE'),
              allowEscapeKey: true,
              type: 'warning',
            });
          } else {
            swal.fire({
              title: 'Attention',
              text: this.translate.instant('TEST.ERRORS.COMPLETECURRENTSTEP'),
              allowEscapeKey: true,
              type: 'warning',
            });
          }
          break;
        case 'second':
          if (!this.testService.checkcorrection_gridSections(this.test)) {
            swal.fire({
              title: 'Attention',
              type: 'warning',
              allowEscapeKey: true,
              html:
                '<b>' +
                this.translate.instant('TEST.ERRORS.COMPLETECURRENTSTEP') +
                '</b>' +
                '<ul style="text-align: center">' +
                '<br>' +
                '<li><span style="position: relative; left: -20px;">' +
                this.translate.instant('TEST.ERRORS.ATLEASTONESECTION') +
                '</span></li>' +
                '</ul>',
            });
          }
          break;
        case 'third':
          swal.fire({
            title: 'Attention',
            text: this.translate.instant('TEST.ERRORS.COMPLETECURRENTSTEP'),
            allowEscapeKey: true,
            type: 'warning',
          });
          break;
        case 'fourth':
          swal.fire({
            title: 'Attention',
            text: this.translate.instant('TEST.ERRORS.COMPLETECURRENTSTEP'),
            allowEscapeKey: true,
            type: 'warning',
          });
          break;
        case 'fifth':
          swal.fire({
            title: 'Attention',
            text: this.translate.instant('TEST.ERRORS.COMPLETECURRENTSTEP'),
            allowEscapeKey: true,
            type: 'warning',
          });
          break;
        default:
      }
    }
  }

  cleanFormData(): TestCreationPayloadData {
    const payload: TestCreationPayloadData = _.cloneDeep(this.testCreationService.getCleanTestCreationData());
    if (payload.current_tab && payload.current_tab === 'first') {
      // *************** if controlled test or evaluation by competence, open tab until tab 4
      if (
        payload.controlled_test ||
        this.firstStepForm.get('block_type').value === 'competence' ||
        this.firstStepForm.get('block_type').value === 'soft_skill'
      ) {
        payload.current_tab = 'fourth';
      } else {
        payload.current_tab = 'second';
      }
    }
    return payload;
  }

  autoSave() {
    // *************** execute auto save if there is any update in competence or soft skill block
    // *************** so section_evalskill form will be updated with that competence or soft skill block data
    const formData = _.cloneDeep(this.testCreationService.getTestCreationDataWithoutSubscribe());
    const apiData = _.cloneDeep(this.testCreationService.getSavedTestCreationDataWithoutSubscribe());
    if (
      JSON.stringify(formData) !== JSON.stringify(apiData) &&
      this.operation === 'edit' &&
      !this.duplicateTestId &&
      !this.formData.is_published
    ) {

      const payload: TestCreationPayloadData = this.cleanFormData();
      this.isWaitingForResponse = true;
      this.subs.sink = this.testCreationService.updateTest(this.firstStepForm.get('_id').value, payload).subscribe((response) => {
        this.isWaitingForResponse = false;
        if (response) {
          this.firstStepForm.get('_id').patchValue(response._id);
          const temp = this.testCreationService.getTestCreationDataWithoutSubscribe();
          if (temp.current_tab && temp.current_tab === 'first') {
            // *************** if controlled test or evaluation by competence, open tab until tab 4
            if (
              payload.controlled_test ||
              this.firstStepForm.get('block_type').value === 'competence' ||
              this.firstStepForm.get('block_type').value === 'soft_skill'
            ) {
              payload.current_tab = 'fourth';
            } else {
              payload.current_tab = 'second';
            }
          }
          this.testCreationService.setTestCreationData(temp);
          this.testCreationService.setSavedTestCreationData(this.testCreationService.getTestCreationDataWithoutSubscribe());
        }
      });
    }
  }

  saveTest(leave?, isPublish?: boolean) {
    const payload: TestCreationPayloadData = this.cleanFormData();
    if (this.firstStepForm.get('_id').value) {
      // *************** update test mutation
      this.isWaitingForResponse = true;
      this.subs.sink = this.testCreationService.updateTest(this.firstStepForm.get('_id').value, payload).subscribe((response) => {
        this.isWaitingForResponse = false;
        if (response) {
          this.firstStepForm.get('_id').patchValue(response._id);
          const temp = this.testCreationService.getTestCreationDataWithoutSubscribe();
          if (temp.current_tab && temp.current_tab === 'first') {
            // *************** if controlled test or evaluation by competence, open tab until tab 4
            if (
              payload.controlled_test ||
              this.firstStepForm.get('block_type').value === 'competence' ||
              this.firstStepForm.get('block_type').value === 'soft_skill'
            ) {
              payload.current_tab = 'fourth';
            } else {
              payload.current_tab = 'second';
            }
          }
          this.testCreationService.setTestCreationData(temp);
          this.testCreationService.setSavedTestCreationData(this.testCreationService.getTestCreationDataWithoutSubscribe());
          swal
            .fire({
              type: 'success',
              title: 'Bravo !',
              text: this.translate.instant('TEST.SAVE_FIRST_TAB.TITLE_CREATE'),
            })
            .then(() => {
              if (leave) {
                const data = this.firstStepForm.getRawValue();
                
                if (data.controlled_test) {
                  this.hardRefreshPage('third');
                } else {
                  this.hardRefreshPage('second');
                }
              } else {
                this.hardRefreshPage('first');
              }
            });
        }
      });
    } else {
      // *************** create test mutation
      this.isWaitingForResponse = true;
      this.subs.sink = this.testCreationService.createTest(payload).subscribe((response) => {
        this.isWaitingForResponse = false;
        if (response && response._id) {
          this.firstStepForm.get('_id').patchValue(response._id, { emitEvent: false });
          this.testId = response._id;
          this.UpdateService();
          this.testCreationService.setSavedTestCreationData(this.testCreationService.getTestCreationDataWithoutSubscribe());
          swal
            .fire({
              type: 'success',
              title: 'Bravo !',
              text: this.translate.instant('TEST.SAVE_FIRST_TAB.TITLE_CREATE'),
            })
            .then(() => {
              if (leave) {
                const data = this.firstStepForm.getRawValue();
                if (data.controlled_test) {
                  this.hardRefreshPage('third');
                } else {
                  this.hardRefreshPage('second');
                }
              } else {
                this.hardRefreshPage('first');
              }
            });
        }
      });
    }
  }

  translateDate(dateRaw) {
    let date = dateRaw;
    if (dateRaw.length === 8) {
      const year: number = +date.substring(0, 4);
      const month: number = +date.substring(4, 6);
      const day: number = +date.substring(6, 8);
      date = new Date(year, month, day);
      return date.toISOString();
    }
  }

  isAnyAdditionalParameterOn(): boolean {
    const qualityControl = this.firstStepForm.get('quality_control').value;
    const freeControl = this.firstStepForm.get('controlled_test').value;
    const groupTest = this.firstStepForm.get('group_test').value;
    let isSetted = false;
    // if there is any additional parameter turned on, return true
    if (qualityControl || freeControl || groupTest) {
      isSetted = true;
    }
    return isSetted;
  }

  triggerTypeChangeFromOutside() {
    const type = this.firstStepForm.get('type').value;
    switch (type.trim()) {
      case 'memoire_oral_non_jury':
      case 'memoire_oral':
        this.correctionTypes = this.sortCorrectionTypes(['certifier']);
        if (this.dataLoaded) {
          this.firstStepForm.get('correction_type').setValue('certifier');
        }
        this.isQualityControlDisabled = true;
        this.isFreeControlDisabled = true;
        this.isGroupTestDisabled = true;
        break;

      case 'academic_recommendation':
        this.correctionTypes = this.sortCorrectionTypes(['prep_center']);
        this.dateTypes = ['marks'];
        this.firstStepForm.get('correction_type').setValue('prep_center');
        this.firstStepForm.get('date_type').setValue('marks');
        this.formData.correction_grid.correction.display_final_total = false;
        this.formData.correction_grid.correction.show_number_marks_column = false;
        this.formData.correction_grid.correction.show_notation_marks = false;
        this.testCreationService.setTestCreationData(_.merge(_.cloneDeep(this.formData)));
        break;

      case 'memoire_ecrit':
        this.correctionTypes = this.sortCorrectionTypes(['certifier']);
        break;

      case 'free_continuous_control':
        this.correctionTypes = this.sortCorrectionTypes(['prep_center']);
        this.dateTypes = ['marks'];
        break;

      case 'mentor_evaluation':
        this.correctionTypes = ['none', 'mentor']; // preparation centre
        this.dateTypes = ['marks'];
        break;

      case 'academic_auto_evaluation':
        this.correctionTypes = this.sortCorrectionTypes(['student']); // preparation centre
        this.dateTypes = ['marks', 'multiple_date'];
        this.isQualityControlDisabled = true;
        this.isFreeControlDisabled = true;
        this.isGroupTestDisabled = true;
        break;

      case 'soft_skill_auto_evaluation':
        this.correctionTypes = this.sortCorrectionTypes(['student']); // preparation centre
        this.dateTypes = ['marks', 'multiple_date'];
        this.isQualityControlDisabled = true;
        this.isFreeControlDisabled = true;
        this.isGroupTestDisabled = true;
        break;

      case 'academic_pro_evaluation':
        this.correctionTypes = this.sortCorrectionTypes(['mentor']); // preparation centre
        this.dateTypes = ['marks', 'multiple_date'];
        this.isQualityControlDisabled = true;
        this.isFreeControlDisabled = true;
        this.isGroupTestDisabled = true;
        break;

      case 'soft_skill_pro_evaluation':
        this.correctionTypes = this.sortCorrectionTypes(['mentor']); // preparation centre
        this.dateTypes = ['marks', 'multiple_date'];
        this.isQualityControlDisabled = true;
        this.isFreeControlDisabled = true;
        this.isGroupTestDisabled = true;
        break;

      case 'preparation_center_eval_soft_skill':
        this.correctionTypes = ['prep_center'];
        this.dateTypes = ['marks', 'multiple_date'];
        this.isQualityControlDisabled = true
        this.isFreeControlDisabled = true;
        this.isGroupTestDisabled = true;
        break;
      

      default:
        // oral and written here
        this.correctionTypes = this.sortCorrectionTypes(GlobalConstants.CorrectionTypesStringArr);
        const indexMentor = this.correctionTypes.indexOf('mentor');
        if (indexMentor >= 0) {
          this.correctionTypes.splice(indexMentor, 1);
        }
        this.dateTypes = GlobalConstants.DateTypeStringArr;
        this.isQualityControlDisabled = false;
        this.isFreeControlDisabled = false;
        this.isGroupTestDisabled = false;
        // if there is any additional parameter setted on, then correction types dropdown will follow additional parameter condition
        if (this.isAnyAdditionalParameterOn()) {
          this.setCorrectionTypeDropdown();
        } else if (this.firstStepForm.get('is_retake_test').value) {
          this.correctionTypes = this.sortCorrectionTypes(['prep_center', 'certifier']);
        }
        if (this.isSpecializationBlock) {
          this.correctionTypes = this.sortCorrectionTypes(['certifier', 'prep_center', 'admtc','mentor']);
        }
        break;
    }
  }

  setCorrectionTypeDropdown() {
    // change dropdown based on additional parameter toggle switch (AV-2097)
    if (this.firstStepForm.get('quality_control').value) {
      // if quality control toggle on
      this.correctionTypes = this.sortCorrectionTypes(['prep_center', 'certifier', 'cross_correction']);
    } else if (this.firstStepForm.get('controlled_test').value) {
      // if free control toggle on
      this.correctionTypes = this.sortCorrectionTypes(['prep_center', 'cross_correction']);
    } else if (this.firstStepForm.get('group_test').value) {
      // if group test on
      this.correctionTypes = this.sortCorrectionTypes(['prep_center', 'certifier', 'cross_correction']);
    } else {
      this.correctionTypes = GlobalConstants.CorrectionTypesStringArr;
    }
  }

  eventListener() {
    // *************** Test Type event listener
    this.subs.sink = this.firstStepForm
      .get('type')
      .valueChanges.pipe(distinctUntilChanged((a, b) => a === b))
      .subscribe((type) => {
        switch (type.trim()) {
          case 'memoire_oral_non_jury':
          case 'memoire_oral':
            this.correctionTypes = this.sortCorrectionTypes(['certifier']);
            if (this.dataLoaded) {
              this.firstStepForm.get('correction_type').setValue('certifier');
            }
            this.isQualityControlDisabled = true;
            this.isFreeControlDisabled = true;
            this.isGroupTestDisabled = true;
            break;

          case 'memoire_ecrit':
            this.correctionTypes = this.sortCorrectionTypes(['certifier']);
            break;

          case 'free_continuous_control':
            this.correctionTypes = this.sortCorrectionTypes(['prep_center']);
            this.dateTypes = ['marks'];

            if (this.dataLoaded) {
              this.firstStepForm.get('correction_type').setValue('prep_center');
              this.firstStepForm.get('controlled_test').setValue(true);
              this.firstStepForm.get('date_type').setValue('marks');
            }
            break;

          case 'mentor_evaluation':
            this.correctionTypes = this.sortCorrectionTypes(['mentor']); // preparation centre
            this.dateTypes = ['marks'];
            if (this.dataLoaded) {
              this.firstStepForm.get('correction_type').setValue('prep_center');
              this.firstStepForm.get('controlled_test').setValue(true);
              this.firstStepForm.get('date_type').setValue('marks');
            }
            break;

          case 'academic_auto_evaluation':
            this.correctionTypes = this.sortCorrectionTypes(['student']); // preparation centre
            this.dateTypes = ['marks', 'multiple_date'];
            this.isQualityControlDisabled = true;
            this.isFreeControlDisabled = true;
            this.isGroupTestDisabled = true;
            if (this.dataLoaded) {
              this.firstStepForm.get('correction_type').setValue('student');
            }
            break;

          case 'soft_skill_auto_evaluation':
            this.correctionTypes = this.sortCorrectionTypes(['student']); // preparation centre
            this.dateTypes = ['marks', 'multiple_date'];
            this.isQualityControlDisabled = true;
            this.isFreeControlDisabled = true;
            this.isGroupTestDisabled = true;
            if (this.dataLoaded) {
              this.firstStepForm.get('correction_type').setValue('student');
            }
            break;

          case 'preparation_center_eval_soft_skill':
            this.correctionTypes = this.sortCorrectionTypes(['prep_center']); // preparation centre
            this.dateTypes = ['marks', 'multiple_date'];
            this.isQualityControlDisabled = true;
            this.isFreeControlDisabled = true;
            this.isGroupTestDisabled = true;
            if (this.dataLoaded) {
              this.firstStepForm.get('correction_type').setValue('prep_center');
            }
            break;

          case 'academic_pro_evaluation':
            this.correctionTypes = this.sortCorrectionTypes(['mentor']); // preparation centre
            this.dateTypes = ['marks', 'multiple_date'];
            this.isQualityControlDisabled = true;
            this.isFreeControlDisabled = true;
            this.isGroupTestDisabled = true;
            if (this.dataLoaded) {
              this.firstStepForm.get('correction_type').setValue('mentor');
            }
            break;

          case 'soft_skill_pro_evaluation':
            this.correctionTypes = this.sortCorrectionTypes(['mentor']); // preparation centre
            this.dateTypes = ['marks', 'multiple_date'];
            this.isQualityControlDisabled = true;
            this.isFreeControlDisabled = true;
            this.isGroupTestDisabled = true;
            if (this.dataLoaded) {
              this.firstStepForm.get('correction_type').setValue('mentor');
            }
            break;

          default:
            // *************** case type oral and written
            this.correctionTypes = this.sortCorrectionTypes(GlobalConstants.CorrectionTypesStringArr);
            this.dateTypes = GlobalConstants.DateTypeStringArr;
            if (this.dataLoaded) {
              this.firstStepForm.get('date_type').setValue('');
              this.firstStepForm.get('correction_type').setValue('');
              this.firstStepForm.get('controlled_test').setValue(false);
            }
            this.isQualityControlDisabled = false;
            this.isFreeControlDisabled = false;
            this.isGroupTestDisabled = false;
            // if there is any additional parameter setted on, then correction types dropdown will follow additional parameter condition
            if (this.isAnyAdditionalParameterOn()) {
              this.setCorrectionTypeDropdown();
            } else if (this.firstStepForm.get('is_retake_test').value) {
              this.correctionTypes = this.sortCorrectionTypes(['prep_center', 'certifier']);
            }
            break;
        }
      });

    // *************** Correction Type event listener
    this.subs.sink = this.firstStepForm
      .get('correction_type')
      .valueChanges.pipe(distinctUntilChanged((a, b) => a === b))
      .subscribe((correctionType) => {
        if (this.dataLoaded) {
          this.initAdditionalParameter();
          switch (correctionType) {
            case 'certifier':
              this.firstStepForm.get('controlled_test').patchValue(false);
              this.isFreeControlDisabled = true;
              this.isGroupTestDisabled = false;
              break;
            case 'cross_correction':
              this.firstStepForm.get('controlled_test').patchValue(false);
              this.firstStepForm.get('group_test').patchValue(false);
              this.isFreeControlDisabled = true;
              this.isGroupTestDisabled = true;
              // remove all data in additional option toggle if correction type cross correction
              this.initAdditionalParameter();
              break;
            case 'prep_center':
              break;
            case 'admtc':
              break;
            case 'student':
              break;
            case 'none':
              this.firstStepForm.get('correction_type').patchValue('');
              break;
            default:
              this.isFreeControlDisabled = false;
              this.isGroupTestDisabled = false;
              break;
          }
          this.triggerTypeChangeFromOutside();
        }
      });

    // *************** Additional Parameter Event Listener
    this.subs.sink = this.firstStepForm
      .get('quality_control')
      .valueChanges.pipe(distinctUntilChanged((a, b) => a === b))
      .subscribe((changes) => {
        if (changes) {
          if (this.dataLoaded) {
            this.firstStepForm.get('student_per_school_for_qc').setValidators([Validators.required]);
            this.firstStepForm.get('quality_control_difference').setValidators([Validators.required]);
            this.firstStepForm.get('student_per_school_for_qc').updateValueAndValidity({ onlySelf: true, emitEvent: true });
            this.firstStepForm.get('quality_control_difference').updateValueAndValidity({ onlySelf: true, emitEvent: true });
            this.firstStepForm.get('controlled_test').patchValue(false);
            this.firstStepForm.get('group_test').patchValue(false);
            this.firstStepForm.get('correction_grid').get('group_detail').get('min_no_of_student').patchValue(null);
            this.firstStepForm.get('correction_grid').get('group_detail').get('no_of_student').patchValue(null);
            this.isFreeControlDisabled = true;
            this.isGroupTestDisabled = true;
          }
        } else {
          if (this.dataLoaded) {
            this.firstStepForm.get('student_per_school_for_qc').clearValidators();
            this.firstStepForm.get('quality_control_difference').clearValidators();
            this.firstStepForm.get('student_per_school_for_qc').updateValueAndValidity({ onlySelf: true, emitEvent: true });
            this.firstStepForm.get('quality_control_difference').updateValueAndValidity({ onlySelf: true, emitEvent: true });
            this.firstStepForm.get('student_per_school_for_qc').patchValue(null);
            this.firstStepForm.get('quality_control_difference').patchValue(null);
            this.isFreeControlDisabled = false;
            this.isGroupTestDisabled = false;
          }
        }
      });

    this.subs.sink = this.firstStepForm
      .get('controlled_test')
      .valueChanges.pipe(distinctUntilChanged((a, b) => a === b))
      .subscribe((changes) => {
        if (changes) {
          this.dateTypes = ['marks'];
          if (this.dataLoaded) {
            this.firstStepForm.get('quality_control').patchValue(false);
            this.firstStepForm.get('group_test').patchValue(false);
            this.firstStepForm.get('student_per_school_for_qc').patchValue(null);
            this.firstStepForm.get('quality_control_difference').patchValue(null);
            this.firstStepForm.get('correction_grid').get('group_detail').get('min_no_of_student').patchValue(null);
            this.firstStepForm.get('correction_grid').get('group_detail').get('no_of_student').patchValue(null);
            this.correctionTypes = this.correctionTypes.filter((type) => type !== 'pc');
            if (this.firstStepForm.get('correction_type').value === 'pc') {
              this.firstStepForm.get('correction_type').patchValue('');
            }
            this.isGroupTestDisabled = true;
            this.firstStepForm.get('date_type').patchValue('marks');
          }
        } else {
          this.isQualityControlDisabled = false;
          this.isGroupTestDisabled = false;
          this.dateTypes = GlobalConstants.DateTypeStringArr;
          this.correctionTypes = this.sortCorrectionTypes(GlobalConstants.CorrectionTypesStringArr);
          if (this.dataLoaded) {
          }
        }
      });

    this.subs.sink = this.firstStepForm
      .get('group_test')
      .valueChanges.pipe(distinctUntilChanged((a, b) => a === b))
      .subscribe((changes) => {
        if (changes) {
          if (this.dataLoaded) {
            this.firstStepForm.get('correction_grid').get('group_detail').get('min_no_of_student').setValidators([Validators.required]);
            this.firstStepForm.get('correction_grid').get('group_detail').get('no_of_student').setValidators([Validators.required]);
            this.firstStepForm
              .get('correction_grid')
              .get('group_detail')
              .get('min_no_of_student')
              .updateValueAndValidity({ onlySelf: true, emitEvent: true });
            this.firstStepForm
              .get('correction_grid')
              .get('group_detail')
              .get('no_of_student')
              .updateValueAndValidity({ onlySelf: true, emitEvent: true });
            this.firstStepForm.get('quality_control').patchValue(false);
            this.firstStepForm.get('controlled_test').patchValue(false);
            this.firstStepForm.get('student_per_school_for_qc').patchValue(null);
            this.firstStepForm.get('quality_control_difference').patchValue(null);
            this.isQualityControlDisabled = true;
            this.isFreeControlDisabled = true;
          }
        } else {
          if (this.dataLoaded) {
            if (this.firstStepForm.get('date_type').value && !(this.firstStepForm.get('date_type').value === 'different')) {
            }
            this.firstStepForm.get('correction_grid').get('group_detail').get('min_no_of_student').clearValidators();
            this.firstStepForm.get('correction_grid').get('group_detail').get('no_of_student').clearValidators();
            this.firstStepForm
              .get('correction_grid')
              .get('group_detail')
              .get('min_no_of_student')
              .updateValueAndValidity({ onlySelf: true, emitEvent: true });
            this.firstStepForm
              .get('correction_grid')
              .get('group_detail')
              .get('no_of_student')
              .updateValueAndValidity({ onlySelf: true, emitEvent: true });
            this.firstStepForm.get('correction_grid').get('group_detail').get('min_no_of_student').patchValue(null);
            this.firstStepForm.get('correction_grid').get('group_detail').get('no_of_student').patchValue(null);

            this.isQualityControlDisabled = false;
            this.isFreeControlDisabled = false;
          }
        }
      });
  }

  resetDateTypeFromMark(event: MatSlideToggleChange) { }

  toggleGroupTest(event: MatSlideToggleChange) {
    if (this.formData.correction_grid.header.fields && this.formData.correction_grid.header.fields.length) {
      this.formData.correction_grid.header.fields.forEach((header) => {
        // *************** when switch group test from false to true, change header from student to group
        if (event.checked && header.type === 'studentname') {
          header.value = 'Nom du Groupe';
          header.type = 'groupname';
        } else if (!event.checked && header.type === 'groupname') {
          // *************** when switch group test from true to false, change header from group to student
          header.value = 'Nom';
          header.type = 'studentname';
        }
      });
      this.UpdateService();
    }
  }

  resetGroupTest() {
    this.correction_grid.reset();
  }

  resetQualityControl() {
    this.student_per_school_for_qc.reset();
    this.quality_control_difference.reset();
  }

  openSchoolDatePicker(index: number) {
    const temp = this.testSchoolDatePicker.toArray();
    if (temp && temp.length) {
      temp[index].open();
    }
  }

  openMultipleDateDatePicker(index: number) {
    const temp = this.multipleDateDatePicker.toArray();
    if (temp && temp.length) {
      temp[index].open();
    }
  }

  dateSendUpdateService(time?: string) {
    if (
      this.firstStepForm.get('send_date_to_mentor').get('date_utc').value &&
      (time || this.firstStepForm.get('send_date_to_mentor').get('time_utc').value)
    ) {
      if (time) {
        this.firstStepForm.get('send_date_to_mentor').get('time_utc').patchValue(time);
      }
      this.UpdateService();
    } else if (
      this.firstStepForm.get('send_date_to_mentor').get('date_utc').value &&
      !(time || this.firstStepForm.get('send_date_to_mentor').get('time_utc').value)
    ) {
      // *************** If for the first time select a date, and time is not set yet, then set the time to be '07:00'
      if (
        this.firstStepForm.get('send_date_to_mentor').get('date_utc').value &&
        !this.firstStepForm.get('send_date_to_mentor').get('time_utc').value
      ) {
        this.firstStepForm.get('send_date_to_mentor').get('time_utc').patchValue('07:00');
      }
      // *************** Close Comment
      this.UpdateService();
    }
  }

  dateUpdateService(time?: string) {
    if (this.firstStepForm.get('date').get('date_utc').value && (time || this.firstStepForm.get('date').get('time_utc').value)) {
      if (time) {
        this.firstStepForm.get('date').get('time_utc').patchValue(time);
      }
      this.UpdateService();
    } else if (this.firstStepForm.get('date').get('date_utc').value && !(time || this.firstStepForm.get('date').get('time_utc').value)) {
      // *************** If for the first time select a date, and time is not set yet, then set the time to be '07:00'
      if (this.firstStepForm.get('date').get('date_utc').value && !this.firstStepForm.get('date').get('time_utc').value) {
        this.firstStepForm.get('date').get('time_utc').patchValue('07:00');
      }
      // *************** Close Comment
      this.UpdateService();
    }
  }

  dateUpdateServicePC(index: number, input, from: string) {
    if (
      from === 'time' &&
      this.schoolTestDateFormArray.at(index).get('test_date').get('date_utc').value &&
      (this.schoolTestDateFormArray.at(index).get('test_date').get('time_utc').value || input)
    ) {
      if (input) {
        this.schoolTestDateFormArray.at(index).get('test_date').get('time_utc').patchValue(input);
      }
      this.UpdateService();
    } else if (
      this.schoolTestDateFormArray.at(index).get('test_date').get('date_utc').value &&
      !(this.schoolTestDateFormArray.at(index).get('test_date').get('time_utc').value || input)
    ) {
      // *************** If for the first time select a date, and time is not set yet, then set the time to be '07:00'
      if (
        this.schoolTestDateFormArray.at(index).get('test_date').get('date_utc').value &&
        !this.schoolTestDateFormArray.at(index).get('test_date').get('time_utc').value
      ) {
        this.schoolTestDateFormArray.at(index).get('test_date').get('time_utc').patchValue('07:00');
      }
      // *************** Close Comment
      this.UpdateService();
    } else if (
      this.schoolTestDateFormArray.at(index).get('test_date').get('date_utc') && 
      this.firstStepForm.get('date_type').value === 'different' && from === 'date'
      ){
        this.schoolTestDateFormArray.at(index).get('test_date').get('date_utc').patchValue(input.value); 
        this.UpdateService(); 
      }
  }

  dateUpdateServiceMultipleDate(index: number, time?: string) {
    if (
      this.multipleDateFormArray.at(index).get('date_utc').value &&
      (this.multipleDateFormArray.at(index).get('time_utc').value || time)
    ) {
      if (time) {
        this.multipleDateFormArray.at(index).get('time_utc').patchValue(time);
      }
      this.UpdateService();
    } else if (
      this.multipleDateFormArray.at(index).get('date_utc').value &&
      !(this.multipleDateFormArray.at(index).get('time_utc').value || time)
    ) {
      // *************** If for the first time select a date, and time is not set yet, then set the time to be '07:00'
      if (this.multipleDateFormArray.at(index).get('date_utc').value && !this.multipleDateFormArray.at(index).get('time_utc').value) {
        this.multipleDateFormArray.at(index).get('time_utc').patchValue('07:00');
      }
      // *************** Close Comment
      this.UpdateService();
    }
  }

  checkIsBiggerThanMax() {
    const min = this.firstStepForm.get('correction_grid').get('group_detail').get('min_no_of_student').value
      ? this.firstStepForm.get('correction_grid').get('group_detail').get('min_no_of_student').value
      : 0;
    const max = this.firstStepForm.get('correction_grid').get('group_detail').get('no_of_student').value
      ? this.firstStepForm.get('correction_grid').get('group_detail').get('no_of_student').value
      : 0;
    if (min < 0) {
      this.firstStepForm.get('correction_grid').get('group_detail').get('min_no_of_student').patchValue(0);
    } else if (min > 0 && min > max) {
      this.firstStepForm.get('correction_grid').get('group_detail').get('no_of_student').patchValue(min);
    }
  }

  checkIsLowerThanMin() {
    const min = this.firstStepForm.get('correction_grid').get('group_detail').get('min_no_of_student').value
      ? this.firstStepForm.get('correction_grid').get('group_detail').get('min_no_of_student').value
      : 0;
    const max = this.firstStepForm.get('correction_grid').get('group_detail').get('no_of_student').value
      ? this.firstStepForm.get('correction_grid').get('group_detail').get('no_of_student').value
      : 0;
    if (max < 0) {
      this.firstStepForm.get('correction_grid').get('group_detail').get('no_of_student').patchValue(0);
    } else if (max > 0 && max < min) {
      this.firstStepForm.get('correction_grid').get('group_detail').get('min_no_of_student').patchValue(max);
    }
  }

  openDuplicateDialog() {
    const formData = _.cloneDeep(this.testCreationService.getTestCreationDataWithoutSubscribe());
    const dialogRef = this.dialog.open(DuplicateTestDialogComponent, {
      minWidth: '400px',
      minHeight: '100px',
      panelClass: 'certification-rule-pop-up',
      disableClose: true,
      data: {
        titleId: this.titleId,
        testId: this.testId,
        // we pass class, block, subject, and evaluation id when duplicate in edit test
        // so the duplicate target will auto populated with current test data
        classId: formData && formData.class_id ? formData.class_id : '',
        subjectId: formData && formData.subject_id ? formData.subject_id : '',
        blockId: formData && formData.block_of_competence_condition_id ? formData.block_of_competence_condition_id : '',
        evalId: formData && formData.evaluation_id ? formData.evaluation_id : '',
      },
    });
    dialogRef.afterClosed().subscribe((data: DuplicateDialogData) => {
      if (data?.duplicateFrom && this.categoryId && this.titleId) {
        if (this.testId) {
          // when duplicate in edit test page, we send testId in url
          this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
            this.router.navigate(['/create-test', this.titleId, { categoryId: this.categoryId, testId: this.testId }, 'first'], {
              queryParams: this.getDuplicateUrlParam(data),
            });
          });
        } else {
          // when duplicate in create test page
          this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
            this.router.navigate(['/create-test', this.titleId, { categoryId: this.categoryId }, 'first'], {
              queryParams: this.getDuplicateUrlParam(data),
            });
          });
        }
      }
    });
  }

  getDuplicateUrlParam(data: DuplicateDialogData) {
    if (data && data.duplicateFrom) {
      return {
        duplicate: data.duplicateFrom,
        class: data.classId,
        block: data.blockId,
        subject: data.subjectId,
        eval: data.evalId,
      };
    } else {
      return null;
    }
  }

  hardRefreshPage(tab: string) {
    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
      this.router.navigate(['/create-test', this.titleId, { categoryId: this.categoryId, testId: this.testId }, tab]);
    });
  }

  get correction_grid(): any {
    return this.firstStepForm.get('correction_grid');
  }

  get student_per_school_for_qc(): any {
    return this.firstStepForm.get('student_per_school_for_qc');
  }

  get quality_control_difference(): any {
    return this.firstStepForm.get('quality_control_difference');
  }
}
