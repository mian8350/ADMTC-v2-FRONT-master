import {
  AfterContentChecked,
  AfterViewChecked,
  ChangeDetectorRef,
  Component,
  OnChanges,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { StepperSelectionEvent, STEPPER_GLOBAL_OPTIONS } from '@angular/cdk/stepper';
import { SubSink } from 'subsink';
import { StudentsService } from 'app/service/students/students.service';
import { SchoolService } from 'app/service/schools/school.service';
import * as _ from 'lodash';
import * as moment from 'moment';
import { ParseStringDatePipe } from 'app/shared/pipes/parse-string-date.pipe';
import { DateAdapter } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { MatStep } from '@angular/material/stepper';
import { ApplicationUrls } from 'app/shared/settings';
import Swal from 'sweetalert2';
import { FileUploadService } from 'app/service/file-upload/file-upload.service';
import { UtilityService } from 'app/service/utility/utility.service';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { PromoService } from 'app/service/promo/promo.service';
import * as DecoupledEditor from 'assets/ckeditor5-custom/ckeditor.js';
import { CKEditorComponent } from '@ckeditor/ckeditor5-angular';
import { SpeechToTextDialogComponent } from 'app/shared/components/speech-to-text-dialog/speech-to-text-dialog.component';
import { StepMessageDialogComponent } from './step-message-dialog/step-message-dialog.component';
import { TestCorrectionService } from 'app/service/test-correction/test-correction.service';
import { removeSpaces } from 'app/service/customvalidator.validator';
import { Correction, PenaltiesBonuses, Section, SectionEvalskill } from 'app/test/test-creation/test-creation.model';
import { ParseLocalToUtcPipe } from 'app/shared/pipes/parse-local-to-utc.pipe';
import { ParseUtcToLocalPipe } from 'app/shared/pipes/parse-utc-to-local.pipe';
import { MultipleDateCorrection, TestCorrectionInput } from 'app/test-correction/test-correction.model';
import { PdfDetailComponent } from 'app/test-correction/pdf-detail/pdf-detail.component';
import { JobDescService } from 'app/service/job-desc/job-desc.service';
import { NgxPermissionsService } from 'ngx-permissions';
import { AuthService } from 'app/service/auth-service/auth.service';

interface FilteredStudentList {
  testCorrectionId: string;
  _id: string;
  first_name: string;
  last_name: string;
  doc: string;
  missing_copy: boolean;
  score: number;
  is_justified: string;
}

interface FilteredGroupList {
  groupTestCorrectionId: string;
  _id: string;
  name: string;
  doc: string;
  missing_copy: boolean;
  is_justified: string;
  score: number;
}
@Component({
  selector: 'ms-correction-eval-pro-step',
  templateUrl: './correction-eval-pro-step.component.html',
  styleUrls: ['./correction-eval-pro-step.component.scss'],
  encapsulation: ViewEncapsulation.None,
  providers: [
    {
      provide: STEPPER_GLOBAL_OPTIONS,
      useValue: { displayDefaultIndicatorType: false },
    },
    ParseStringDatePipe,
    ParseLocalToUtcPipe,
    ParseUtcToLocalPipe,
  ],
})
export class CorrectionEvalProComponent implements OnInit, OnChanges, AfterViewChecked, OnDestroy {
  name: string;
  email: string;
  password: string;
  private subs = new SubSink();
  @ViewChild('stepperForm', { static: false }) stepperForm: any;

  finishMark = false;
  slideConfig = { slidesToShow: 1, slidesToScroll: 1, autoplay: true, autoplaySpeed: 3000, dots: false, arrows: false };
  myInnerHeight = 600;
  sessionSlider: any[] = [
    {
      image: 'assets/img/correction.png',
      title: 'Mme Elena Andrieu',
      sub_title: 'Assistante de ressources humaines',
      company: 'AFPI',
      mentor: 'M. Gregoire TROLLE',
    },
  ];
  @ViewChild(PdfDetailComponent, { static: false }) pdfDetailRef: PdfDetailComponent;
  correctionData: any;
  questionFormGroup: UntypedFormGroup;
  directiveFormGroup: UntypedFormGroup;
  lastFormGroup: UntypedFormGroup;
  myIdentityForm: UntypedFormGroup;
  paymentForm: UntypedFormGroup;
  paymentSelected: any;
  methodOne = true;
  methodTwo = true;
  methodThree = true;
  downloadCondition = true;
  agreeCondition = true;
  paymentMethod: any;
  nextProcessPayment = false;
  isWaitingForResponse = false;
  identityEditMode = false;
  selectOptionTwo = false;
  scrollDone = false;
  selectCandidate = {
    photo: 'assets/img/user-1.jpg',
    civility: 'Mrs',
    first_name: 'Cindy',
    last_name: 'Lacour',
    weight: 8546321232,
    priority: 'low',
  };
  // sessionSlider: any[] = [];
  showSessionSlider = false;
  candidateId = '5fe1c81dcae641204052c742';
  candidateData: any;
  today = new Date();
  @ViewChild('fileUpload', { static: false }) uploadInput: any;

  toggleExpand: any[] = [];
  nationalitiesList = [];
  nationalList = [];
  nationalitySelected: string;
  nationalitiesListSecond = [];
  nationalListSecond = [];
  nationalitySelectedSecond: string;
  multipleDatesFormArray = new UntypedFormArray([]);
  countries;
  countryList;
  filteredCountry = [];
  countriesSecond;
  countryListSecond;
  filteredCountrySecond = [];
  countriesFinance;
  countryListFinance;
  filteredCountryFinance = [];
  photo: string;
  photo_s3_path: string;
  is_photo_in_s3: boolean;
  maleStudentIcon = '../../../../../assets/img/student_icon.png';
  femaleStudentIcon = '../../../../../assets/img/student_icon_fem.png';
  paymentImg = '../../../../../assets/img/payment.png';
  transferPayment = '../../../../../assets/img/transfer-payment.png';
  successPayment = '../../../../../assets/img/payment-success.png';
  selectedIndex = 0;
  isLoadingUpload = false;
  firstStepDone = false;
  secondStepDone = false;
  thirdStepDone = false;
  fourthStepDone = false;
  paymentChoiced = false;
  paymentFinalStep = false;
  paymentDone = false;
  autoTicks = false;
  disabled = false;
  invert = false;
  max = 100;
  min = 0;
  showTicks = true;
  step = 1;
  thumbLabel = false;
  value = 0;
  vertical = false;
  tickInterval = 0.5;
  public Editor = DecoupledEditor;
  @ViewChild('editor', { static: true }) editor: CKEditorComponent;
  public config = {
    placeholder:
      "Justification obligatoire (merci de prendre le temps d'argumenter le résultat afin de permettre à l'apprenant de mesurer son niveau d'acquisition des compétences)",
    height: '20rem',
    toolbar: [
      'heading',
      '|',
      'fontsize',
      '|',
      'bold',
      'italic',
      'Underline',
      'strikethrough',
      'highlight',
      '|',
      'alignment',
      '|',
      'numberedList',
      'bulletedList',
      '|',
    ],
  };
  slider1 = new UntypedFormControl(null);
  slider2 = new UntypedFormControl(null);
  slider3 = new UntypedFormControl(null);
  slider4 = new UntypedFormControl(null);
  slider5 = new UntypedFormControl(null);
  slider6 = new UntypedFormControl(null);
  slider7 = new UntypedFormControl(null);
  slider8 = new UntypedFormControl(null);

  // First Step Configuration
  dataModify: any;
  isLinear = true;
  dataLoaded = false;
  dataReady = false;
  fullDataCandidate: any;
  testCorrectionForm: UntypedFormGroup;
  testData;
  titleData;
  schoolData;
  testId;
  schoolId;
  userId;
  studentId: string;
  studentSpecializationId: string = '';
  titleId: string;
  testCorrectionId: string;
  missingCopyDocument: any;
  elementOfProofDocument: any;

  isDataSaved = false;
  firstForm: any;
  studentSelectDetail: any;
  competenceJobDetail: any;
  selectedCorrector;
  selectedCorrectorId = '';
  jobDescriptionId = '';
  jobDescriptionData: any;
  studentList: any[];
  filteredStudentList: FilteredStudentList[];
  filteredGroupList: FilteredGroupList[];
  isWaitingPdf = false;
  isUserMentor = false;
  isUserAcadir = false;
  maximumFinalMark = 0;
  serverimgPath = `${ApplicationUrls.baseApi}/fileuploads/`.replace('/graphql', '');
  triggerLoadPdf = false;

  // New Configuration
  isSubmitted = false;
  totalStep: any;
  statusStepper: any[][] = [];
  listStepper = [];
  linear = true;

  acadEval = ['academic_pro_evaluation', 'academic_auto_evaluation'];
  softEval = ['soft_skill_pro_evaluation', 'soft_skill_auto_evaluation'];

  constructor(
    public translate: TranslateService,
    private fb: UntypedFormBuilder,
    private studentService: StudentsService,
    private schoolService: SchoolService,
    private parseStringDatePipe: ParseStringDatePipe,
    private dateAdapter: DateAdapter<Date>,
    private fileUploadService: FileUploadService,
    private sanitizer: DomSanitizer,
    public utilService: UtilityService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    public dialog: MatDialog,
    private testCorrectionService: TestCorrectionService,
    private router: Router,
    private promoService: PromoService,
    private parseUTCtoLocal: ParseUtcToLocalPipe,
    private parseLocaltoUTC: ParseLocalToUtcPipe,
    private jobDescService: JobDescService,
    private authService: AuthService,
    private permissions: NgxPermissionsService, // private utilService: UtilityService,
  ) {}

  ngOnInit() {
    this.dateAdapter.setLocale(this.translate.currentLang);
    this.testId = this.route.snapshot.queryParamMap.get('testId');
    this.studentId = this.route.snapshot.queryParamMap.get('studentId');
    this.schoolId = this.route.snapshot.queryParamMap.get('schoolId');
    this.userId = this.route.snapshot.queryParamMap.get('userId');
    this.isUserAcadir = this.permissions.getPermission('Academic Director') ? true : false;
    this.isUserMentor = this.permissions.getPermission('Mentor') ? true : false;
    if (!this.testId || !this.studentId || !this.schoolId) {
      this.routeTologin();
    }
    // if (this.testId && this.studentId && this.schoolId && this.userId) {
    //   this.checkUserAccess();
    // }


    this.initStepper();
    this.initTestCorrectionForm();
    this.getDataTest();
    this.subs.sink = this.studentService.getOneStudentSpecialization(this.studentId).subscribe((id) => {
      this.studentSpecializationId = id
    })
    this.subs.sink = this.studentService.getCorrectionData().subscribe((list) => {
      if (list && list.competences && list.competences.length) {
        list.competences.forEach((competences, parentIndex) => {
          this.addCompetences();
          this.toggleExpand.push(false);
          if (competences.criteria && competences.criteria.length) {
            competences.criteria.forEach((criteria, criteriaIndex) => {
              this.addCriterias(parentIndex);
            });
          }
        });
        this.myIdentityForm.get('competences').patchValue(list.competences);
        this.correctionData = list;

        this.dataReady = true;

      }
    });
  }

  checkUserAccess() {
    this.subs.sink = this.testCorrectionService.checkProEvalUserAccess(this.userId, this.testId, this.schoolId, this.studentId).subscribe(
      (list) => {
        if (!list) {
          this.routeTologin();
        }

      },
      (err) => {
        this.routeTologin();
      },
    );
  }

  checkValidationSubmit() {
    let disabled = true;
    const section = this.getCorrectionForm().get('sections_evalskill').value;

    if (section && section.length) {
      section.forEach((sec, sectionIdx) => {
        if (sec.sub_sections && sec.sub_sections.length) {
          sec.sub_sections.forEach((element) => {
            if (element && element.is_criteria_evaluated) {
              if (element.rating !== null && element.rating > -1) {
                disabled = false;
              } else {
                disabled = true;
              }
            } else {
              disabled = false;
            }
          });
        }
      });
    }
    return disabled;
  }

  initTestCorrectionForm() {
    this.testCorrectionForm = this.fb.group({
      test: [this.testId, Validators.required],
      corrector: [undefined, Validators.required],
      student: [this.studentId],
      school_id: [this.schoolId],
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
      is_criteria_evaluated_dummy: [false],
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

  getDataTest() {
    if (this.testId && this.studentId && this.schoolId) {
      this.subs.sink = this.testCorrectionService.getTestEvalPro(this.testId, this.studentId, this.schoolId).subscribe((list) => {
        if (list?.correction_grid?.correction?.sections_evalskill?.length) {
          list.correction_grid.correction.sections_evalskill = list.correction_grid.correction.sections_evalskill.filter((section: SectionEvalskill) => {
            return !section?.specialization_id || section.specialization_id === this.studentSpecializationId
          })
        }
        if (list) {
          this.testData = _.cloneDeep(list);

          this.headerFormatFields(list);
          this.footerFormatFields(list);
          this.populateTestData(this.testData);
          this.calculateMaximumFinalMark();
          this.getStudentFromCorrectorAssigned();
        }
      });
    }
    if (this.schoolId) {
      this.subs.sink = this.testCorrectionService.getSchool(this.schoolId).subscribe((list) => {
        this.schoolData = list;

      });
    }
    if (this.studentId) {
      this.subs.sink = this.studentService.getOneStudent(this.studentId).subscribe((list) => {
        this.studentSelectDetail = list;
        this.studentList = [];
        this.studentList.push(this.studentSelectDetail);
        this.competenceJobDetail = this.studentList;
        let comp = [];
        if (list && list.companies && list.companies.length) {
        }
        comp = list.companies.filter((comps) => {
          return comps.status === 'active';
        });

        if (comp && comp.length) {
          this.studentSelectDetail.companies = comp[0];
        }


        const tempResult = [];

        if (this.studentSelectDetail) {
          tempResult.push({
            testCorrectionId: this.testCorrectionId ? this.testCorrectionId : null,
            _id: this.studentId,
            first_name: this.studentSelectDetail.first_name,
            last_name: this.studentSelectDetail.last_name,
            civility: this.studentSelectDetail.civility,
            company: this.studentSelectDetail.companies,
            doc: null,
            missing_copy: false,
            is_justified: null,
            score: null,
            specialization_id: this.studentSelectDetail?.specialization?._id || this.studentSpecializationId || null
          });
          this.filteredStudentList = tempResult;
          if (this.studentSelectDetail && this.studentSelectDetail.rncp_title) {
            this.titleId = this.studentSelectDetail.rncp_title._id;
          }
          const temp = [];
          if (!this.testCorrectionForm.get('corrector').value && this.studentSelectDetail && this.studentSelectDetail.companies) {
            this.testCorrectionForm.get('corrector').patchValue(this.studentSelectDetail.companies.mentor._id);
            this.competenceJobDetail = this.studentSelectDetail;
          }
          temp.push(this.studentSelectDetail);
          this.studentList = temp;
        }

        if (this.titleId) {
          this.subs.sink = this.testCorrectionService.getTitle(this.titleId).subscribe((listTitle) => {
            this.titleData = listTitle;

          });
        }

        if (list && list.job_description_id && list.job_description_id._id) {
          this.competenceJobDetail = [];
          this.jobDescriptionId = list.job_description_id._id;
        }
      });
    }
  }

  formatHeader(data) {

    let header = '';
    header = data.replace(/&amp;/, '&');
    header = header.replace(/&lt;/, '<');
    header = _.unescape(header);
    // let header = this.utilService.decodeHTMLEntities(data);

    return header;
  }

  headerFormatFields(data) {
    if (data.correction_grid.header.fields) {
      const dataTest = _.filter(
        data.correction_grid.header.fields,
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
      this.testData.correction_grid.header.fields = dataTest;
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

        if (correction.sections_evalskill && correction.sections_evalskill.length) {
          const sections: SectionEvalskill[] = correction.sections_evalskill;
          let sectionIndex: number = 0
          for (const section of sections) {
            this.listStepper.push(100 + sectionIndex);
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
            sectionIndex += 1
          }
          this.generateFormValidation();
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

      if (this.testId && this.studentId) {

        this.subs.sink = this.testCorrectionService.checkIfTestCorrectionExistsForStudent(this.studentId, this.testId).subscribe((list) => {
          if (list) {

            this.testCorrectionId = list._id;
            this.autoPopulateFormWithStudentTestCorrection(this.testCorrectionId);
          } else {
            this.generateFormValidation();
            this.saveTestCorrection();
          }

        });
      }
    }
  }

  calculateMaximumFinalMark() {
    if (this.testData && this.testData.correction_grid && this.testData.correction_grid.correction) {
      const correctionData: Correction = this.testData.correction_grid.correction;
      correctionData.sections.forEach((section) => {
        this.maximumFinalMark = this.maximumFinalMark + (section.maximum_rating ? section.maximum_rating : 0);
      });
    }
  }

  autoPopulateFormWithStudentTestCorrection(testCorrectionId: string) {
    this.isWaitingForResponse = true;
    this.testCorrectionService.getTestCorrection(testCorrectionId).subscribe((resp) => {
      this.isWaitingForResponse = false;

      const patchData = this.formatDataBeforePatch(_.cloneDeep(resp));
      this.dataUpdated(patchData);
      this.testCorrectionForm.get('student').patchValue(patchData.student);
      this.firstForm = _.cloneDeep(this.testCorrectionForm.value);
      this.testCorrectionId = testCorrectionId;
    });
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

  expandChange(ins) {
    this.toggleExpand[ins] = false;
  }

  expandOpened(ins) {
    this.toggleExpand[ins] = true;
  }

  ngOnChanges() {}

  ngAfterViewChecked() {
    this.cdr.detectChanges();
  }

  getOneCandidate() {}

  initStepper() {
    this.myIdentityForm = this.fb.group({
      start_evaluation: ['', Validators.required],
      competences: this.fb.array([]),
    });
    this.lastFormGroup = this.fb.group({
      ctrl: ['', Validators.required],
    });
    this.directiveFormGroup = this.fb.group({
      ctrl: ['', Validators.required],
    });
  }

  initCompetences() {
    return this.fb.group({
      ref_id: [null],
      name: [null],
      short_name: [null],
      justification: [null],
      criteria: this.fb.array([]),
    });
  }

  initCriterias() {
    return this.fb.group({
      ref_id: [null],
      name: [null],
      note: [null],
      not_evaluated: [false],
    });
  }

  addCompetences() {
    this.competences.push(this.initCompetences());
  }

  removeCompetences(index: number) {
    this.competences.removeAt(index);
  }

  addCriterias(parentIndex) {
    this.criterias(parentIndex).push(this.initCriterias());
  }

  removeCriterias(parentIndex, index: number) {
    this.criterias(parentIndex).removeAt(index);
  }

  get competences() {
    return this.myIdentityForm.get('competences') as UntypedFormArray;
  }

  criterias(index) {
    return this.myIdentityForm.get('competences').get(index.toString()).get('criteria') as UntypedFormArray;
  }

  register(value) {}

  getAutomaticHeight() {
    this.myInnerHeight = window.innerHeight - 103;
    return this.myInnerHeight;
  }

  getTabIndex(tabName: string): number {
    if (tabName === this.translate.instant('Directives')) {
      return 0;
    } else if (tabName === this.translate.instant('RH: Les principales activités')) {
      return 1;
    } else if (tabName === this.translate.instant('La stratégie de dév. RH')) {
      return 2;
    } else if (tabName === this.translate.instant('Les prestataires')) {
      return 3;
    } else if (tabName === this.translate.instant('La gestion de projet RH')) {
      return 4;
    } else if (tabName === this.translate.instant('La communication')) {
      return 5;
    } else if (tabName === this.translate.instant('Supports & Outils')) {
      return 6;
    } else if (tabName === this.translate.instant('Summary & Submission')) {
      return 7;
    } else {
      return -1;
    }
  }

  getValidTab(tabName: string): any {
    if (tabName === this.translate.instant('RH: Les principales activités')) {
      return true;
    } else if (tabName === this.translate.instant('La stratégie de dév. RH')) {
      return true;
    } else if (tabName === this.translate.instant('Les prestataires')) {
      return true;
    } else if (tabName === this.translate.instant('La gestion de projet RH')) {
      return true;
    } else if (tabName === this.translate.instant('La communication')) {
      return true;
    } else if (tabName === this.translate.instant('Supports & Outils')) {
      return true;
    } else if (tabName === this.translate.instant('Summary & Submission')) {
      return true;
    } else if (tabName === 'save ' + this.translate.instant('Continue')) {
      return true;
    } else if (tabName === 'reply ' + this.translate.instant('Go Back')) {
      return true;
    } else if (tabName === 'save') {
      return true;
    } else if (tabName === 'reply') {
      return true;
    } else {
      return false;
    }
  }

  selectionChange(event: StepperSelectionEvent) {
    this.selectedIndex = event.selectedIndex;
    if (
      event &&
      event.selectedStep &&
      (event.selectedStep.label === 'Summary & Submission' || event.selectedStep.label === 'Synthèse & Envoi')
    ) {
      this.triggerLoadPDF();
    } else {
      this.triggerLoadPdf = false;
    }
  }

  selectionValidation(event) {

    let validation: Boolean;
    let validTab: Boolean;
    validation = false;
    if (event && event.target) {
      validTab = this.getValidTab(event.target.textContent);
      // if (validTab) {
      //   if (this.getTabIndex(event.target.innerText) !== -1) {
      //     this.selectedIndex = this.getTabIndex(event.target.innerText);
      //   }
      // }
    }
  }

  currentIndex(data) {

  }
  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  getSliderTickInterval(): number | 'auto' {
    if (this.showTicks) {
      return this.autoTicks ? 'auto' : this.tickInterval;
    }

    return 0;
  }

  onReady(editor) {
    editor.ui.getEditableElement().parentElement.insertBefore(editor.ui.view.toolbar.element, editor.ui.getEditableElement());
  }

  recordNote(ins) {
    this.dialog
      .open(SpeechToTextDialogComponent, {
        width: '800px',
        minHeight: '300px',
        panelClass: 'certification-rule-pop-up',
        disableClose: true,
        data: '',
      })
      .afterClosed()
      .subscribe((text) => {
        if (text.trim()) {
          const voiceText = `${text}`;
          const justification = this.getSectionEvalskillForm().get(ins.toString()).get('comment').value;
          this.getSectionEvalskillForm()
            .get(ins.toString())
            .get('comment')
            .setValue(justification ? justification + ' ' + voiceText : voiceText);
        }
      });
  }

  stateTest(ins, data) {
    let state = '';
    if (ins === 100) {
      state = this.directiveFormGroup.get('ctrl').value
        ? 'done'
        : this.selectedIndex === 0 && this.directiveFormGroup.get('ctrl').value
        ? 'edit'
        : ins + 1;
    }
    if (data !== 0) {
      const inStep = this.listStepper.findIndex((i) => i === data);
      if (
        this.formArray &&
        this.formArray.value &&
        this.formArray.controls &&
        this.formArray.controls.length &&
        this.formArray.get(inStep.toString()).value
      ) {
        if (this.formArray.at(inStep).get('ctrl').value !== '') {
          state = 'done';
        } else {
          state =
            this.testData &&
            this.testData.correction_grid &&
            this.testData.correction_grid.header &&
            this.testData.correction_grid.header.directive_long
              ? (inStep + 2).toString()
              : (inStep + 1).toString();
        }
      }
      const firstCode = _.cloneDeep(data.toString());
      const middleCode = _.cloneDeep(data.toString());
      const lastCode = _.cloneDeep(data.toString());
      const first = firstCode.charAt(0);
      const middle = middleCode.charAt(1);
      const last = lastCode.charAt(2);
      const indexForm = middle !== '0' ? parseInt(middle + last) : last === '0' ? 0 : parseInt(last);
      if (
        this.selectedIndex ===
        indexForm +
          (this.testData &&
          this.testData.correction_grid &&
          this.testData.correction_grid.header &&
          this.testData.correction_grid.header.directive_long
            ? 1
            : 0)
      ) {
        state = 'edit';
      }
    }
    return state;
  }

  startEvaluation() {}

  openPopUpValidation(type) {
    this.subs.sink = this.dialog
      .open(StepMessageDialogComponent, {
        width: '600px',
        minHeight: '100px',
        panelClass: 'certification-rule-pop-up',
        disableClose: true,
        data: {
          type: type,
          step: 1,
        },
      })
      .afterClosed()
      .subscribe((resp) => {

        if (resp.type === 'cancel') {
        } else {
          if (type === 'stepValidation') {
            this.directiveFormGroup.get('ctrl').setValue('done');
            this.selectedIndex = 1;
          } else {
            this.formArray.get('0').get('ctrl').setValue('done');
            this.selectedIndex = 2;
          }
        }
      });
  }

  continueButton(data) {
    const inStep = this.listStepper.findIndex((i) => i === data);

    if (inStep === 0) {
      this.openPopUpValidation('stepValidation 2');
    } else {

      if (this.formArray.at(inStep).get('ctrl').value === '') {
        this.formArray.at(inStep).get('ctrl').setValue('done');
      }
      this.selectedIndex = this.selectedIndex + 1;
    }
  }

  validateButton(field) {
    let disabled = true;
    if (field && field.valid) {
      disabled = false;
    }
    return disabled;
  }

  addHeaderFieldsFormArray() {
    this.getHeaderFieldsFormArray().push(this.initHeaderFooterFieldsForm());
  }
  getHeaderFieldsFormArray(): UntypedFormArray {
    return this.testCorrectionForm.get('correction_grid').get('header').get('fields') as UntypedFormArray;
  }

  getFooterFieldsFormArray(): UntypedFormArray {
    return this.testCorrectionForm.get('correction_grid').get('footer').get('fields') as UntypedFormArray;
  }
  addFooterFieldsFormArray() {
    this.getFooterFieldsFormArray().push(this.initHeaderFooterFieldsForm());
  }

  getExpectedDocumentForm() {
    return this.testCorrectionForm.get('expected_documents') as UntypedFormArray;
  }
  addExpectedDocumentForm() {
    this.getExpectedDocumentForm().push(this.initExpectedDocumentForm());
  }
  getSectionForm() {
    return this.getCorrectionForm().get('sections') as UntypedFormArray;
  }
  addSectionForm() {
    this.getSectionForm().push(this.initSectionForm());
  }
  getCorrectionForm() {
    return this.testCorrectionForm.get('correction_grid').get('correction') as UntypedFormGroup;
  }

  getSubSectionForm(sectionIndex: number) {
    return this.getSectionForm().at(sectionIndex).get('sub_sections') as UntypedFormArray;
  }
  addSubSectionForm(sectionIndex: number) {
    this.getSubSectionForm(sectionIndex).push(this.initSubSectionForm());
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
  getSubSectionEvalskillForm(sectionIndex: number) {
    return this.getSectionEvalskillForm().at(sectionIndex).get('sub_sections') as UntypedFormArray;
  }
  getSectionEvalskillForm() {
    return this.getCorrectionForm().get('sections_evalskill') as UntypedFormArray;
  }
  addSectionEvalskillForm() {
    this.getSectionEvalskillForm().push(this.initSectionEvalskillForm());
  }
  addSubSectionEvalskillForm(sectionIndex: number) {
    this.getSubSectionEvalskillForm(sectionIndex).push(this.initSubSectionEvalskillForm());
  }
  addPenaltyFieldForm() {
    this.getPenaltiesFieldForm().push(this.initBonusPenaltyFieldForm());
  }
  getPenaltiesFieldForm() {
    return this.getCorrectionForm().get('penalties') as UntypedFormArray;
  }
  getBonusesFieldForm() {
    return this.getCorrectionForm().get('bonuses') as UntypedFormArray;
  }
  addBonusFieldForm() {
    this.getBonusesFieldForm().push(this.initBonusPenaltyFieldForm());
  }
  getJuryEnabledList() {
    return this.testCorrectionForm.get('jury_enabled_list') as UntypedFormArray;
  }
  addJuryEnabledList(index) {
    this.getJuryEnabledList().push(this.initJuryEnabledList(index));
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
  resetSectionEvalskillForm() {
    // **************************************************************************
    // this function is to handle when user already upload document expected before inputting mark in mark entry.
    // when user already upload document expected before inputting mark in mark entry, the section become empty.
    // so need to fill the section and subsection data from test creation data.
    // **************************************************************************
    this.getSectionEvalskillForm().controls.forEach((section, secIndex) => {
      section.get('rating').setValue(null);
      section.get('comment').setValue('');
      this.getSubSectionEvalskillForm(secIndex).controls.forEach((subsec, subsecIndex) => {
        subsec.get('rating').setValue(null);
        subsec.get('score_conversion_id').setValue(null);
        subsec.get('comments').setValue('');
        if (this.testData.date_type === 'multiple_date') {
          this.initMultipleDateForm(secIndex, subsecIndex);
        }
        this.getJurysSubSectionForm(secIndex, subsecIndex).controls.forEach((jury, juryIndex) => {
          jury.get('marks').setValue(null);
          jury.get('score_conversion_id').setValue(null);
        });
      });
    });
  }
  addMultipleDatesSubSectionForm(sectionIndex: number, subSectionIndex: number) {
    this.getMultipleDatesSubSectionForm(sectionIndex, subSectionIndex).push(this.initMultipleDatesSubSectionForm());
  }

  initMultipleDateForm(sectionIndex: number, subsectionIndex: number) {
    // add initial multiple date form based on task's due_date
    this.getMultipleDatesSubSectionForm(sectionIndex, subsectionIndex).clear();
  }
  getMultipleDatesSubSectionForm(sectionIndex: number, subSectionIndex: number) {
    return this.getSubSectionEvalskillForm(sectionIndex).at(subSectionIndex).get('multiple_dates') as UntypedFormArray;
  }
  getStudentFromCorrectorAssigned() {
    const temp = [];
    // Find the corrector by filtering corrector_assigned array in test data with task's user_selection id
    const correctorAssigned = this.getCorrectorAssigned();
    correctorAssigned.forEach((corrector) => {
      // 5b6c52cc81935943d24d49d7
      if (corrector && corrector.school_id && corrector.school_id._id === this.schoolId) {
        this.testCorrectionForm.get('corrector').patchValue(corrector.corrector_id._id);
        // if (corrector.students && corrector.students.length > 1) {
        //   this.competenceJobDetail = corrector.students.filter((resp) => resp._id === this.studentId);
        // } else {
        //   this.competenceJobDetail = corrector.students;
        // }
        // corrector.students.forEach((student) => {
        //   temp.push(student);
        // });
      }
    });
    // this.studentList = temp;

    this.selectedCorrector = null;
  }

  getJobDescData(section) {
    let missionActivitiesAutonomy = [];
    if (this.competenceJobDetail && this.competenceJobDetail.length) {
      const selectedStudentData = this.studentList.find((studentData) => studentData._id === this.studentId);
      // const selectedStudentData = this.studentSelectDetail;

      if (
        selectedStudentData &&
        selectedStudentData.job_description_id &&
        selectedStudentData.job_description_id.block_of_template_competences &&
        selectedStudentData.job_description_id.block_of_template_competences.length
      ) {
        selectedStudentData.job_description_id.block_of_template_competences.forEach((block) => {
          if (block && block.competence_templates && block.competence_templates.length) {
            const selectedblockTemplate = block.competence_templates.find(
              (competence) =>
                competence &&
                competence.competence_template_id &&
                competence.competence_template_id._id &&
                section.academic_skill_competence_template_id &&
                section.academic_skill_competence_template_id._id === competence.competence_template_id._id &&
                selectedStudentData._id === this.studentId,
            );
            if (selectedblockTemplate && selectedblockTemplate.missions_activities_autonomy && !missionActivitiesAutonomy.length) {
              missionActivitiesAutonomy = _.cloneDeep(selectedblockTemplate.missions_activities_autonomy);
            }
          }
        });
      }
    }
    return missionActivitiesAutonomy;
  }

  getCorrectorAssigned(taskData?: any): any[] {
    let correctorAssigned = [];
    if (taskData && (taskData.type === 'final_retake_marks_entry' || taskData.type === 'validate_test_correction_for_final_retake')) {
      // for final retake test, get student list from corrector_assigned_for_final_retake
      correctorAssigned = _.cloneDeep(this.testData.corrector_assigned_for_final_retake);
    } else if (this.testData.corrector_assigned_for_final_retake.length) {
      // if there is no task data (we open it from folder 06, then we can check if corrector_assigned_for_final_retake has value or not)
      // if has value, then this test is retake test
      correctorAssigned = _.cloneDeep(this.testData.corrector_assigned_for_final_retake);
    } else {
      // for normal test, get student list from corrector_assigned
      correctorAssigned = _.cloneDeep(this.testData.corrector_assigned);
    }


    return correctorAssigned;
  }

  formatPayload() {
    const data = _.cloneDeep(this.testCorrectionForm.value);


    // remove document expected data if student dont upload document expected yet
    if (data && data.expected_documents && data.expected_documents[0] && !data.expected_documents[0].document) {
      data.expected_documents = [];
    }

    // Remove unnessecary data from correction form
    if (data && data.correction_grid && data.correction_grid.correction) {
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
              delete sub_section.is_criteria_evaluated_dummy;
            });
          }
        });
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
            case 'companyname':
              header_field.value = {
                company_name: tempValue,
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
            case 'companyname':
              footer_field.value = {
                company_name: tempValue,
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
    if (data.missing_copy && data.correction_grid && data.correction_grid.correction) {
      data.correction_grid.correction.additional_total = 0;
      data.correction_grid.correction.total = 0;
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

  saveTestCorrection(actionAfterSave?: string) {
    this.isSubmitted = false;
    const payload = _.cloneDeep(this.formatPayload());
    this.isWaitingForResponse = true;
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
          payload.correction_grid.correction.sections_evalskill[sectionIndex].sub_sections[subSectionIndex].rating = elementSub.rating
            ? Number(elementSub.rating)
            : null;

          // *************** Start : Assign Mark Letter and Score Conversion ID if show_letter_marks_column = true
          if (
            this.testData &&
            this.testData.correction_grid &&
            this.testData.correction_grid.correction &&
            this.testData.correction_grid.correction.show_letter_marks_column
          ) {
            // *************** First we need too map the score conversions array first
            let selectedScoreConversions = [];
            if (
              (this.acadEval.includes(this.testData.type) || this.softEval.includes(this.testData.type)) &&
              this.testData.correction_grid.correction.sections_evalskill &&
              this.testData.correction_grid.correction.sections_evalskill.find((evalskill) => evalskill.ref_id === element.ref_id)
            ) {
              const selectedEvalskill = this.testData.correction_grid.correction.sections_evalskill.find(
                (evalskill) => evalskill.ref_id === element.ref_id,
              );
              if (this.acadEval.includes(this.testData.type)) {
                selectedScoreConversions = selectedEvalskill.score_conversions.map(
                  (conversion) => conversion.academic_skill_score_conversion_id,
                );
              } else if (this.softEval.includes(this.testData.type)) {
                selectedScoreConversions = selectedEvalskill.score_conversions.map(
                  (conversion) => conversion.soft_skill_score_conversion_id,
                );
              }
            }
            // *************** Second we need to get the correct score conversion

            if (selectedScoreConversions && selectedScoreConversions.length) {
              const selectedScoreConversion = this.getScoreConversion(selectedScoreConversions, elementSub.rating);
              payload.correction_grid.correction.sections_evalskill[sectionIndex].sub_sections[subSectionIndex].marks_letter =
                selectedScoreConversion ? selectedScoreConversion.letter : '';
              payload.correction_grid.correction.sections_evalskill[sectionIndex].sub_sections[subSectionIndex].score_conversion_id =
                selectedScoreConversion ? selectedScoreConversion._id : null;



            }
          }
          // *************** END : Assign Mark Letter and Score Conversion ID if show_letter_marks_column = true

          if (
            payload.correction_grid.correction.sections_evalskill[sectionIndex].sub_sections[subSectionIndex].multiple_dates &&
            payload.correction_grid.correction.sections_evalskill[sectionIndex].sub_sections[subSectionIndex].multiple_dates.length
          ) {
            payload.correction_grid.correction.sections_evalskill[sectionIndex].sub_sections[subSectionIndex].multiple_dates.forEach(
              (date, dateIndex) => {
                if (date && date.marks) {
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
          delete payload.correction_grid.correction.sections_evalskill[sectionIndex].sub_sections[subSectionIndex]
            .is_criteria_evaluated_dummy;
        });
      });
      payload.is_saved = true;
      payload.is_saved_as_draft = true;
      this.getCorrectionForm().get('additional_total').setValue(1);
      this.getCorrectionForm().get('total').setValue(1);
      if (this.testCorrectionId) {
        // update test correction
        this.subs.sink = this.testCorrectionService.updateTestCorrection(this.testCorrectionId, payload).subscribe(
          (resp) => {
            this.isWaitingForResponse = false;
            this.isDataSaved = true;
            this.firstForm = _.cloneDeep(this.testCorrectionForm.value);
          },
          (err) => {
            this.isWaitingForResponse = false;
            this.authService.postErrorLog(err);
          },
        );
      } else {
        // create test correction
        this.subs.sink = this.testCorrectionService.createTestCorrection(payload).subscribe(
          (resp) => {
            this.isWaitingForResponse = false;
            this.isDataSaved = true;
            this.testCorrectionId = resp._id;
            this.firstForm = _.cloneDeep(this.testCorrectionForm.value);
          },
          (err) => {
            this.authService.postErrorLog(err);
            this.isWaitingForResponse = false;
            Swal.fire({
              type: 'error',
              title: 'Error !',
              text: err,
            });
          },
        );
      }
    }
  }
  validateTestCorrection() {


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
            case 'companyname':
              header_field.value = header_field.value.company_name;
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
            case 'companyname':
              footer_field.value = footer_field.value.company_name;
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
    } else {
      data.school_id = this.schoolId;
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

            // data already saved before. so enable the submit button
            this.isDataSaved = true;
            // sort from latest date to earliest date so user can easier to access the field and inputting mark
            subsec.multiple_dates = subsec.multiple_dates.reverse();
            this.setMultipleDatesFormData(subsec.multiple_dates);
          }
        });
      });
    }

    return data;
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
  setMultipleDatesFormData(multipleDatesData: MultipleDateCorrection[]) {
    this.multipleDatesFormArray.clear();
    multipleDatesData.forEach((dateData) => {
      this.addMultipleDatesForm();
    });
    this.multipleDatesFormArray.patchValue(multipleDatesData);
  }
  addMultipleDatesForm() {
    this.multipleDatesFormArray.push(this.initMultipleDatesSubSectionForm());
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
    if (!event.correction_grid.correction.sections_evalskill.length) {
      this.resetSectionEvalskillForm();
    } else {
      event.correction_grid.correction.sections_evalskill.forEach((section, sectionIndex) => {
        section.sub_sections.forEach((subsec, subsecIndex) => {
          // remove rating validator in subsection if is_criteria_evaluated false
          if (subsec.is_criteria_evaluated === false) {
            this.getSubSectionEvalskillForm(sectionIndex).at(subsecIndex).get('rating').clearValidators();
            this.getSubSectionEvalskillForm(sectionIndex).at(subsecIndex).get('rating').updateValueAndValidity();
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
    this.generateFormValidation();


  }
  resetMissingCopyDoc() {
    this.missingCopyDocument = null;
    this.testCorrectionForm.get('document_for_missing_copy').setValue([]);
  }
  resetElementOfProofDoc() {
    this.elementOfProofDocument = null;
    this.testCorrectionForm.get('element_of_proof_doc').setValue(null);
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
    // this.checkValidationSubmit();
  }

  submitTestCorrection() {
    this.isSubmitted = true;
    // this.cdr.detectChanges();
    const studentPdfResults = this.getStudentPdfResults();

    this.isWaitingForResponse = true;
    // submit test correction for normal test
    this.subs.sink = this.testCorrectionService.submitMarkEntryMentor(this.testId, this.schoolId, studentPdfResults).subscribe((resp) => {
      if (resp) {
        this.isWaitingForResponse = false;
        this.firstForm = _.cloneDeep(this.testCorrectionForm.value);
        Swal.fire({
          type: 'success',
          title: this.translate.instant('TESTCORRECTIONS.MESSAGE.ALLCORRECTIONSSUBMITTEDTitle'),
          html: this.translate.instant('TESTCORRECTIONS.MESSAGE.ALLCORRECTIONSSUBMITTED'),
          confirmButtonText: this.translate.instant('TESTCORRECTIONS.MESSAGE.ALLCORRECTIONSSUBMITTEDBtn'),
          allowOutsideClick: false,
        }).then(() => {
          this.finishMark = true;
        });
      }
    });
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
    window.open(`./rncpTitles`, '_self');
  }

  routeTologin() {
    window.open(`./session/login`, '_self');
  }

  getStudentPdfResults() {
    const arrayResult = [];
    if (this.testData.type === 'academic_pro_evaluation' || this.testData.type === 'soft_skill_pro_evaluation') {
      const studentResults = {
        document_name: `${this.studentSelectDetail.last_name} ${this.studentSelectDetail.first_name}`,
        html: this.pdfDetailRef.generateStudentPdfHtml(this.studentId, 'mark', true),
        test_correction: this.testCorrectionId,
        student: this.studentId,
        corrector: this.testCorrectionForm.get('corrector').value,
      };
      arrayResult.push(studentResults);
      return arrayResult;
    } else {
      const studentResults = {
        document_name: `${this.studentSelectDetail.last_name} ${this.studentSelectDetail.first_name}`,
        html: this.pdfDetailRef.generateStudentPdfHtml(this.studentId),
        test_correction: this.testCorrectionId,
        student: this.studentId,
        corrector: this.testCorrectionForm.get('corrector').value,
      };
      arrayResult.push(studentResults);
      return arrayResult;
    }

  }

  triggerLoadPDF() {

    this.triggerLoadPdf = true;
  }

  generateHeader(section) {
    let header = '';
    if (section) {
      if (section.academic_skill_competence_template_id && section.academic_skill_competence_template_id.short_name) {
        header = this.utilService.cleanHTML(section.academic_skill_competence_template_id.short_name);
      } else if (section.soft_skill_competence_template_id && section.soft_skill_competence_template_id.short_name) {
        header = this.utilService.cleanHTML(section.soft_skill_competence_template_id.short_name);
      } else {
        header = this.utilService.cleanHTML(section.title);
      }
    }
    return header;
  }

  checkEvaluation(ins, insCriteria) {
    if (!this.getSubSectionEvalskillForm(ins).get(insCriteria.toString()).get('is_criteria_evaluated').value) {
      this.getSubSectionEvalskillForm(ins).get(insCriteria.toString()).get('rating').setValue(null);
      this.getSubSectionEvalskillForm(ins).at(insCriteria).get('rating').clearValidators();
      this.getSubSectionEvalskillForm(ins).at(insCriteria).get('rating').updateValueAndValidity();
    } else if (this.getSubSectionEvalskillForm(ins).at(insCriteria).get('is_selected').value) {
      this.getSubSectionEvalskillForm(ins).at(insCriteria).get('rating').setValidators([Validators.required]);
      this.getSubSectionEvalskillForm(ins).at(insCriteria).get('rating').updateValueAndValidity();
    }
  }

  // New Configuration
  generateFormValidation() {
    const data = [];
    if (this.listStepper && this.listStepper.length) {
      this.listStepper.forEach((element) => {
        data.push(this.iniValidationStep());
      });
      this.totalStep =
        this.listStepper.length +
        (this.testData &&
        this.testData.correction_grid &&
        this.testData.correction_grid.header &&
        this.testData.correction_grid.header.directive_long
          ? 1
          : 0) +
        1;
    }
    this.questionFormGroup = this.fb.group({
      formArray: this.fb.array([...data]),
    });

    this.validationStepPosition();
  }

  get formArray() {
    return this.questionFormGroup.get('formArray') as UntypedFormArray;
  }

  validateStep(data) {
    const inStep = this.listStepper.findIndex((i) => i === data);
    if (this.formArray && this.formArray.value && this.formArray.controls && this.formArray.controls.length) {
      if (this.formArray && this.formArray.value && this.formArray.get(inStep.toString()).value) {
        return this.formArray.get(inStep.toString());
      } else {
        return null;
      }
    }
  }

  iniValidationStep() {
    return this.fb.group({
      ctrl: ['', Validators.required],
    });
  }

  validationStepPosition() {
    // if (this.dataCorrection && this.dataCorrection.is_submit) {
    //   if (this.formArray && this.formArray.value && this.formArray.controls && this.formArray.controls.length) {
    //     this.formArray.controls.forEach((element, ins) => {
    //       this.formArray.get(ins.toString()).get('ctrl').setValue('done');
    //     });
    //     this.directiveFormGroup.get('ctrl').setValue('done');
    //     this.lastFormGroup.get('ctrl').setValue('done');
    //     // this.selectedIndex = this.listStepper.length;
    //     this.linear = false;
    //     if (this.totalStep && this.listStepper && this.listStepper.length) {
    //       setTimeout(() => (this.selectedIndex = this.totalStep - 1), 0);
    //     }
    //   }
    // } else {
    const formData = _.cloneDeep(this.testCorrectionForm.value);

    if (this.formArray && this.formArray.value && this.formArray.controls && this.formArray.controls.length) {
      if (
        formData &&
        formData.correction_grid &&
        formData.correction_grid.correction &&
        formData.correction_grid.correction.sections_evalskill &&
        formData.correction_grid.correction.sections_evalskill.length
      ) {
        formData.correction_grid.correction.sections_evalskill.forEach((section, inParent) => {
          if (section && section.sub_sections) {
            const inStep = this.listStepper.findIndex((i) => i === 100 + inParent);
            section.sub_sections.forEach((sub, inChild) => {
              if (sub && sub.is_criteria_evaluated) {
                if (sub.rating) {
                  if (this.directiveFormGroup.get('ctrl').value !== 'done') {
                    this.directiveFormGroup.get('ctrl').setValue('done');
                  }
                  this.formArray.get(inStep.toString()).get('ctrl').setValue('done');
                  const firstCode = _.cloneDeep((100 + inParent).toString());
                  const middleCode = _.cloneDeep((100 + inParent).toString());
                  const lastCode = _.cloneDeep((100 + inParent).toString());
                  const first = firstCode.charAt(0);
                  const middle = middleCode.charAt(1);
                  const last = lastCode.charAt(2);
                  const indexForm = middle !== '0' ? parseInt(middle + last) : last === '0' ? 0 : parseInt(last);

                  setTimeout(
                    () =>
                      (this.selectedIndex =
                        indexForm +
                        (this.testData &&
                        this.testData.correction_grid &&
                        this.testData.correction_grid.header &&
                        this.testData.correction_grid.header.directive_long
                          ? 1
                          : 0)),
                    0,
                  );
                }
              } else {
                if (this.directiveFormGroup.get('ctrl').value !== 'done') {
                  this.directiveFormGroup.get('ctrl').setValue('done');
                }
                this.formArray.get(inStep.toString()).get('ctrl').setValue('done');
                const firstCode = _.cloneDeep((100 + inParent).toString());
                const middleCode = _.cloneDeep((100 + inParent).toString());
                const lastCode = _.cloneDeep((100 + inParent).toString());
                const first = firstCode.charAt(0);
                const middle = middleCode.charAt(1);
                const last = lastCode.charAt(2);
                const indexForm = middle !== '0' ? parseInt(middle + last) : last === '0' ? 0 : parseInt(last);
                setTimeout(
                  () =>
                    (this.selectedIndex =
                      indexForm +
                      (this.testData &&
                      this.testData.correction_grid &&
                      this.testData.correction_grid.header &&
                      this.testData.correction_grid.header.directive_long
                        ? 1
                        : 0)),
                  0,
                );

              }
            });
            const dataStep = this.formArray.value;
            const dataInvalid = dataStep.filter((list) => list.ctrl !== 'done');
            if (dataInvalid && dataInvalid.length === 0) {
              this.linear = false;
              if (this.totalStep && this.listStepper && this.listStepper.length) {
                setTimeout(() => (this.selectedIndex = this.totalStep - 1), 0);
              }
            }
          }
        });
      }
    }
    // }
  }

  buttonFormValidation(stepCode) {
    const firstCode = _.cloneDeep(stepCode.toString());
    const middleCode = _.cloneDeep(stepCode.toString());
    const lastCode = _.cloneDeep(stepCode.toString());
    let disabled = true;
    const first = firstCode.charAt(0);
    const middle = middleCode.charAt(1);
    const last = lastCode.charAt(2);
    const indexForm = middle !== '0' ? parseInt(middle + last) : last === '0' ? 0 : parseInt(last);

    if (
      this.getSectionEvalskillForm() &&
      this.getSectionEvalskillForm().controls &&
      this.getSectionEvalskillForm().controls.length &&
      this.getSectionEvalskillForm().at(indexForm).valid
    ) {
      disabled = false;
    };
    return disabled;
  }

  getScoreConversion(scoreConversions, score) {
    if (scoreConversions.length > 0) {
      const scoreConversionFound = scoreConversions.find(
        (conversion) =>
          (conversion.sign === 'less_than' && score < conversion.score) ||
          (conversion.sign === 'less_than_or_equal' && score <= conversion.score) ||
          (conversion.sign === 'equal' && score === conversion.score) ||
          (conversion.sign === 'more_than_or_equal' && score >= conversion.score) ||
          (conversion.sign === 'more_than' && score > conversion.score)
      );
      if (scoreConversionFound) {
        return scoreConversionFound;
      }
    }
  }
}
