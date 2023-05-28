import { SelectionModel } from '@angular/cdk/collections';
import { AfterViewInit, ChangeDetectorRef, Component, EventEmitter, NgZone, OnInit, Output, ViewChild } from '@angular/core';
import { FormArray, FormControl, UntypedFormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from 'app/service/auth-service/auth.service';
import { CertidegreeService } from 'app/service/certidegree/certidegree.service';
import { EmployabilitySurveyService } from 'app/service/employability-survey/employability-survey.service';
import { SchoolService } from 'app/service/schools/school.service';
import { StudentsService } from 'app/service/students/students.service';
import { UtilityService } from 'app/service/utility/utility.service';
import { ApplicationUrls } from 'app/shared/settings';
import * as _ from 'lodash';
import { NgxPermissionsService } from 'ngx-permissions';
import { Observable } from 'rxjs';
import { debounceTime, map, startWith, take, tap } from 'rxjs/operators';
import { SubSink } from 'subsink';
import Swal from 'sweetalert2';
import { StudentCertificationDateDialogComponent } from '../student-certification-date-dialog/student-certification-date-dialog.component';

@Component({
  selector: 'ms-student-certificate-issuance-table',
  templateUrl: './student-certificate-issuance-table.component.html',
  styleUrls: ['./student-certificate-issuance-table.component.scss'],
})
export class StudentCertificateIssuanceTableComponent implements OnInit, AfterViewInit {
  dataSource = new MatTableDataSource([]);
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild('matTable', { static: false }) table: MatTable<any>;
  @Output() isDownloading = new EventEmitter<Boolean>();
  selection = new SelectionModel<any>(true, []);
  dataLoaded = false;
  isReset = false;
  userSelected: any[];
  userSelectedId: any[];
  isCheckedAll = false;
  disabledExport = true;
  selectType: any;
  allESParamId: string[] = []
  dynamicESMatrix: string[][] = []

  displayedColumns: string[] = [
    'select',
    'school',
    'student',
    'date_issuance',
    'identity_verification_status',
    'is_thumbups_green',
    'diploma',
    'certifier',
    'CD',
    'action',
  ];
  filterColumns: string[] = [
    'selectFilter',
    'schoolFilter',
    'studentFilter',
    'date_issuance_filter',
    'identityFilter',
    'is_thumbups_green_filter',
    'diplomaFilter',
    'certifierFilter',
    'CDFilter',
    'actionFilter',
  ];

  // ********* ANYTHING FILTERS ********************

  schoolFilter = new UntypedFormControl(null);
  studentFilter = new UntypedFormControl(null);
  certificationDateFilter = new UntypedFormControl(null);
  identityFilter = new UntypedFormControl('AllM');
  is_thumbups_green_filter = new UntypedFormControl('AllM');
  diplomaFilter = new UntypedFormControl('AllM');
  certifierFilter = new UntypedFormControl('AllM');
  CDFilter = new UntypedFormControl('AllM');
  // statusFilter = new FormControl('AllM');

  empSurveyFilters: FormArray = new FormArray([])
  empSurveyFilterList = [
    { key: 'Not Sent', value: 'not_sent' },
    { key: 'Sent To Student', value: 'sent_to_student' },
    { key: 'Completed By Student', value: 'completed_by_student' },
    { key: 'Rejected By Validator', value: 'rejected_by_validator' },
    { key: 'Validated By Validator', value: 'validated_by_validator' },
  ];

  certifierFilterList = [
    { key: 'AllM', value: 'AllM' },
    { key: 'Passed', value: 'pass' },
    { key: 'Failed', value: 'failed' },
    { key: 'Eliminated', value: 'eliminated' },
    { key: 'Initial', value: 'initial' },
    { key: 'Re-Take', value: 'retaking' },
    { key: 'Pass after retake', value: 'student_retake_pass'},
    { key: 'FAIL after retake', value: 'student_retake_fail'}
  ];

  // statusFilterList = [
  //   { key: 'AllM', value: 'AllM' },
  //   { key: 'Active', value: 'active' },
  //   { key: 'Pending', value: 'pending' },
  //   { key: 'Incorrect Email', value: 'incorrect_email' },
  // ];

  verificationFilterList = [
    { key: 'AllM', value: 'AllM' },
    { key: 'Not Send', value: 'not_sent' },
    { key: 'Sent to Student', value: 'sent_to_student' },
    { key: 'Completed', value: 'details_confirmed' },
    { key: 'Due date passed', value: 'due_date_passed' },
  ];

  transcripList = [
    {
      value: 'AllM',
      name: 'All',
    },
    {
      value: true,
      name: 'OK',
    },
    {
      value: false,
      name: 'NOT_OK',
    },
  ];

  diplomaList = [
    {
      value: 'AllM',
      name: 'All',
    },
    {
      value: true,
      name: 'Yes',
    },
    {
      value: false,
      name: 'No',
    },
  ];

  CDList = [
    {
      value: 'AllM',
      name: 'All',
    },
    {
      value: 'certificate_not_issued',
      name: 'Certificate Not Issued',
    },
    {
      value: 'certificate_issued',
      name: 'Certificate Issued',
    },
    {
      value: 'certificate_published',
      name: 'Certificate Published',
    },
  ];

  filteredValues = {
    school_id: null,
    full_name: null,
    identity_verification_status: null,
    toward_administration: null,
    employability_survey_dynamic: null,
    diploma: null,
    certifier_school: null,
    status: null,
    certificate_issuance_date: null,
  };
  // ********************************************* */

  private subs = new SubSink();
  noData: any;
  isWaitingForResponse = true;
  dataCount: any;
  sortValue: { [x: string]: 'asc' | 'desc' };
  entityData: any;
  currentProcessData: any;
  currentProcessId: any;
  schoolFilterList = [];
  filteredSchoolList: Observable<any[]>;
  serverimgPath = `${ApplicationUrls.baseApi}/fileuploads/`.replace('/graphql', '');
  allStudentForExport = [];

  private timeOutVal: any;

  constructor(
    private studentService: StudentsService,
    private esService: EmployabilitySurveyService,
    private permissions: NgxPermissionsService,
    private authService: AuthService,
    private utilService: UtilityService,
    private certiDegreeService: CertidegreeService,
    private route: ActivatedRoute,
    private schoolService: SchoolService,
    private router: Router,
    private dialog: MatDialog,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef,
    public translate: TranslateService,
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe((param) => {
      this.currentProcessId = param.get('id');
    });
    this.checkCertificateIsGeneratedForAllStudents();
    // this.certiDegreeService.processData ? this.setProcessData() : this.fetchProcessData();
    this.paginator.pageSize = 10;
    this.subs.sink = this.translate.onLangChange.subscribe(() => {
      this.sortESFilterDropdown()
    })
  }

  ngAfterViewInit() {
    this.subs.sink = this.paginator.page
      .pipe(
        startWith(null),
        tap(() => {
          if (!this.isReset) {
            this.fetchAndPopulateTable();
          }
          this.dataLoaded = true;
        }),
      )
      .subscribe();
     this.subs.sink = this.ngZone.onMicrotaskEmpty
      .pipe(
        take(3),
        tap(() => {
          this.table.updateStickyColumnStyles();
        }),
      )
      .subscribe();
  }

  //  to check if certificate already generated for all student or not
  checkCertificateIsGeneratedForAllStudents() {
    this.isWaitingForResponse = true;
    this.subs.sink = this.certiDegreeService.getCertificateGenerateStatus(this.currentProcessId).subscribe(
      (resp) => {
        if (resp === false) {

          Swal.fire({
            title: this.translate.instant('CERTIDEGREE_S3.TITLE'),
            html: this.translate.instant('CERTIDEGREE_S3.TEXT'),
            type: 'warning',
            allowEscapeKey: true,
            confirmButtonText: this.translate.instant('CERTIDEGREE_S3.BUTTON'),
          }).then(() => {
            this.router.navigate(['/certidegree']);
          });
          this.isWaitingForResponse = false;
        } else {

          this.certiDegreeService.processData ? this.setProcessData() : this.fetchProcessData();
        }
      },
      (error) => {
        this.isWaitingForResponse = false;

      },
    );
  }

  // get process details from stashed value
  setProcessData() {
    this.currentProcessData = this.certiDegreeService.processData;

    this.initialFetchAndPopulateTable();
    this.getAllSchoolsDropdown();
    this.setUpFiltersChangeListeners();
  }

  // fetch process details from API
  fetchProcessData() {
    this.isWaitingForResponse = true;
    return this.certiDegreeService.getOneCertificateIssuanceProcess(this.currentProcessId).subscribe((resp) => {

      this.currentProcessData = resp;
      this.isWaitingForResponse = false;
      this.initialFetchAndPopulateTable();
      this.getAllSchoolsDropdown();
      return resp;
    });
  }

  initialFetchAndPopulateTable() {
    const filter = {
      rncp_title_id: this.currentProcessData?.rncp_id?._id,
      class_id: this.currentProcessData?.class_id?._id,
    }
    this.esService.getAllESForDynamicCol(filter).subscribe((data) => {
      if (Array.isArray(data)) {
        this.populateAllESId(data);
        this.updateDynamicESFilterForms();
        this.shapeDynamicESCols();
        this.sortESFilterDropdown();
        this.fetchAndPopulateTable()
      }
    })
  }

  // fetch student data and populate the table
  fetchAndPopulateTable() {
    if (!this.currentProcessData) {
      // this.isWaitingForResponse = false;
      return;
    }

    this.isWaitingForResponse = true;
    const pagination = {
      limit: this.paginator.pageSize ? this.paginator.pageSize : 10,
      page: this.paginator.pageIndex ? this.paginator.pageIndex : 0,
    };
    this.studentService
      .getAllStudentsByTitleAndClassOnly(
        this.currentProcessData?.rncp_id?._id,
        this.currentProcessData?.class_id?._id,
        pagination,
        this.sortValue,
        this.filteredValues,
        this.currentProcessData?._id,
      )
      .subscribe(
        (students) => {

          if (students && students.length) {
            this.constructDynamicESMatrix(students)
            const studentsList = this.formatDataPDF(students);

            this.dataSource.data = studentsList;
            this.paginator.length = students.length && students[0].count_document ? students[0].count_document : 0;
            this.dataCount = students.length && students[0].count_document ? students[0].count_document : 0;
          } else {
            this.dataSource.data = [];
            this.paginator.length = 0;
            this.dataCount = 0;
          }
          this.noData = this.dataSource.connect().pipe(map((dataa) => dataa.length === 0));
          this.isReset = false;
          this.isWaitingForResponse = false;
        },
        (error) => {

          this.isWaitingForResponse = false;
        },
      );
  }

  populateAllESId(data) {
    this.allESParamId = []
    data?.forEach(data => {
      data?.employability_surveys?.forEach(survey => {
        const id = survey?._id
        if (id && this.allESParamId.indexOf(id) < 0) {
          this.allESParamId.push(id)
        }
      })
    })
  }

  updateDynamicESFilterForms() {
    this.allESParamId.forEach((_, idx) => {
      if (!this.empSurveyFilters[idx]) {
        this.empSurveyFilters.push(new FormControl('AllF'), { emitEvent: false })
      }
    })
  }

  shapeDynamicESCols() {
    this.displayedColumns = [
      'select',
      'school',
      'student',
      'date_issuance',
      'identity_verification_status',
      'is_thumbups_green',
      ...this.allESParamId.map((_, idx) => `es${idx+1}`),
      'diploma',
      'certifier',
      'CD',
      'action',
    ]
    this.filterColumns = [
      'selectFilter',
      'schoolFilter',
      'studentFilter',
      'date_issuance_filter',
      'identityFilter',
      'is_thumbups_green_filter',
      ...this.allESParamId.map((_, idx) => `es${idx+1}Filter`),
      'diplomaFilter',
      'certifierFilter',
      'CDFilter',
      'actionFilter',
    ]
  }

  sortESFilterDropdown() {
    this.empSurveyFilterList = this.empSurveyFilterList.sort((a, b) => {
      const translatedA = this.utilService.simpleDiacriticSensitiveRegex(this.translate.instant(String(a.key)))
      const translatedB = this.utilService.simpleDiacriticSensitiveRegex(this.translate.instant(String(b.key)))
      if (translatedA > translatedB) return 1
      if (translatedA < translatedB) return -1
      return 0
    })
  }

  constructDynamicESMatrix(students) {
    this.dynamicESMatrix = []
    students?.forEach((student, idx) => {
      this.dynamicESMatrix[idx] = this.allESParamId.map(id => {
        return student?.employability_survey_ids?.find(survey => survey?.employability_survey_parameter_id?._id === id)?.survey_status || null
      })
    })
  }

  formatDataPDF(students) {
    if (!students || !students?.length) {
      return []
    }
    return students.map((list) => {
      // sanity check when find on certificate_process_pdfs to prevent if doesnt have value (null)
      const certificatePdf =
        list && list.certificate_process_pdfs && list.certificate_process_pdfs.length
          ? list.certificate_process_pdfs.find(
              (resp) =>
                resp.certificate_process_id &&
                resp.certificate_process_id._id &&
                resp.certificate_process_id._id === this.currentProcessData._id,
            )
          : null;


      return {
        count_document: list.count_document,
        incorrect_email: list.incorrect_email,
        _id: list._id,
        civility: list.civility,
        first_name: list.first_name,
        last_name: list.last_name,
        photo: list.photo,
        date_of_birth: list.date_of_birth,
        place_of_birth: list.place_of_birth,
        academic_journey_id: list.academic_journey_id,
        certificate_process_pdfs: certificatePdf,
        createdAt: list.createdAt,
        certification_process_status: list.certification_process_status,
        certificate_issuance_status: list.certificate_issuance_status,
        identity_verification_status: list.identity_verification_status,
        is_photo_in_s3: list.is_photo_in_s3,
        photo_s3_path: list.photo_s3_path,
        is_thumbups_green: list.is_thumbups_green,
        status: list.status,
        school: list.school,
        rncp_title: list.rncp_title,
        current_class: list.current_class,
        final_transcript_id: list.final_transcript_id,
        user_id: list.user_id,
        job_description_id: list.job_description_id,
        problematic_id: list.problematic_id,
        mentor_evaluation_id: list.mentor_evaluation_id,
        employability_survey_ids: list.employability_survey_ids,
        soft_skill_pro_evaluation: list.soft_skill_pro_evaluation,
        academic_pro_evaluation: list.academic_pro_evaluation,
        companies: list.companies,
      };
    });
  }

  // fetch drop down list for school filter
  getAllSchoolsDropdown() {
    this.isWaitingForResponse = true;
    this.subs.sink = this.schoolService.getSchoolsByTitle(this.currentProcessData?.rncp_id?._id).subscribe(
      (resp) => {

        this.schoolFilterList = _.cloneDeep(resp.preparation_centers.filter((pc) => pc !== null));

        this.setUpFiltersChangeListeners();
      },
      (err) => {
        this.isWaitingForResponse = false;
        this.authService.postErrorLog(err);
      },
    );
  }

  sortData(sort: Sort) {
    this.sortValue = sort.direction ? { [sort.active]: sort.direction ? sort.direction : `asc` } : null;
    if (this.dataLoaded) {
      this.paginator.pageIndex = 0;
      if (!this.isReset) {
        this.fetchAndPopulateTable();
      }
    }
  }

  setUpFiltersChangeListeners() {
    this.subs.sink = this.empSurveyFilters.valueChanges.subscribe(arr => {
      if (arr?.every(value => !value || value === 'AllF')) {
        this.filteredValues.employability_survey_dynamic = null
      } else {
        this.filteredValues.employability_survey_dynamic = arr.map((value, idx) => {
          return {
            employability_status: value,
            employability_survey_parameter_id: this.allESParamId[idx] || null
          }
        }).filter((value) => {
          return value.employability_status && value.employability_status !== 'AllF' && value.employability_survey_parameter_id
        })
      }
      this.paginator.pageIndex = 0;
      if (!this.isReset) {
        this.fetchAndPopulateTable();
      }
    })
    this.subs.sink = this.studentFilter.valueChanges.pipe(debounceTime(500)).subscribe((input) => {
      if (typeof input === 'string') {
        this.filteredValues.full_name = this.utilService.simplifyRegex(input);
        if (input === '') {
          this.filteredValues.full_name = null;
        }
        this.paginator.pageIndex = 0;
        if (!this.isReset) {
          this.fetchAndPopulateTable();
        }
      }
    });
    // this.filteredSchoolList = this.schoolFilter.valueChanges.pipe(
    //   startWith(''),
    //   map((searchTxt) =>
    //     this.schoolFilterList.filter(
    //       (school) => school && school.short_name.toLowerCase().includes(searchTxt ? searchTxt.toLowerCase() : ''),
    //     ),
    //   ),
    // );
    this.filteredSchoolList = this.schoolFilter.valueChanges.pipe(
      startWith(''),
      map((searchTxt) =>
        this.schoolFilterList
          .filter((option) => option && option.short_name.toLowerCase().includes(searchTxt ? searchTxt.toLowerCase() : ''))
          .sort((firstData, secondData) => {
            if (
              this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(firstData.short_name)).toLowerCase() <
              this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(secondData.short_name)).toLowerCase()
            ) {
              return -1;
            } else if (
              this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(firstData.short_name)).toLowerCase() >
              this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(secondData.short_name)).toLowerCase()
            ) {
              return 1;
            } else {
              return 0;
            }
          }),
      ),
    );
    // this.subs.sink = this.statusFilter.valueChanges.subscribe((statusSearch) => {

    //   this.filteredValues.status = statusSearch === 'AllM' ? null : statusSearch;
    //   this.paginator.pageIndex = 0;
    //   if (!this.isReset) {
    //     this.fetchAndPopulateTable();
    //   }
    // });

    this.subs.sink = this.certificationDateFilter.valueChanges.subscribe((dateInput) => {
      if(dateInput) {
        const dateString = dateInput.toLocaleDateString('en-GB');

        this.filteredValues.certificate_issuance_date = dateString;
        this.paginator.pageIndex = 0;
        if (!this.isReset) {
          this.fetchAndPopulateTable();
        }
      }
    })

    this.subs.sink = this.identityFilter.valueChanges.subscribe((statusSearch) => {
      this.filteredValues.identity_verification_status = statusSearch === 'AllM' ? null : statusSearch;
      this.paginator.pageIndex = 0;
      if (!this.isReset) {
        this.fetchAndPopulateTable();
      }
    });

    this.subs.sink = this.is_thumbups_green_filter.valueChanges.subscribe((statusSearch) => {
      this.filteredValues.toward_administration = statusSearch === 'AllM' ? null : statusSearch;
      this.paginator.pageIndex = 0;
      if (!this.isReset) {
        this.fetchAndPopulateTable();
      }
    });

    this.subs.sink = this.diplomaFilter.valueChanges.subscribe((statusSearch) => {
      this.filteredValues.diploma = statusSearch === 'AllM' ? null : statusSearch;
      this.paginator.pageIndex = 0;
      if (!this.isReset) {
        this.fetchAndPopulateTable();
      }
    });

    this.subs.sink = this.CDFilter.valueChanges.subscribe((statusSearch) => {
      if (statusSearch !== 'AllM') {
        this.filteredValues['certification_process_status'] = statusSearch;
      } else {
        delete this.filteredValues['certification_process_status'];
      }
      this.paginator.pageIndex = 0;
      if (!this.isReset) {
        this.fetchAndPopulateTable();
      }
    });

    this.subs.sink = this.certifierFilter.valueChanges.subscribe((statusSearch) => {
      if (statusSearch !== 'AllM') {
        this.filteredValues['final_transcript'] = statusSearch;
      } else {
        delete this.filteredValues['final_transcript'];
      }
      this.paginator.pageIndex = 0;
      if (!this.isReset) {
        this.fetchAndPopulateTable();
      }
    });
  }

  // function below set the filter and repopulate table data on school filter click
  setSchoolFilter(school) {
    this.filteredValues.school_id = school ? school._id : null;
    this.paginator.pageIndex = 0;
    this.fetchAndPopulateTable();
  }

  cleanFilterData() {
    this.filteredValues = {
      school_id: null,
      full_name: null,
      identity_verification_status: null,
      toward_administration: null,
      employability_survey_dynamic: null,
      diploma: null,
      certifier_school: null,
      status: null,
      certificate_issuance_date: null,
    };
  }

  openDateDialog(element) {
    const dialogRef = this.dialog.open(StudentCertificationDateDialogComponent, {
      disableClose: true,
      minWidth: '420px',
      panelClass: 'no-padding-dialog',
      data: element,
    })
    .afterClosed()
    .subscribe(resp => {

      if(resp){
        this.fetchAndPopulateTable();
      }
    })
  }

  leaveDetails() {
    this.router.navigate(['certidegree']);
  }

  /** Whether the number of selected elements matches the total number of rows. */
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  masterToggle() {
    if (this.isAllSelected()) {
      this.selection.clear();
      this.isCheckedAll = false;
    } else {
      this.isCheckedAll = true;
      this.dataSource.data.forEach((row) => this.selection.select(row));
    }
  }

  /** The label for the checkbox on the passed row */
  checkboxLabel(row?: any): string {
    if (!row) {
      return `${this.isAllSelected() ? 'select' : 'deselect'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${row.position + 1}`;
  }

  showOptions(info) {
    const numSelected = this.selection.selected.length;
    if (numSelected > 0) {
      this.disabledExport = false;
    } else {
      this.disabledExport = true;
    }
    this.selectType = info;
    const data = this.selection.selected;
    this.userSelected = [];
    this.userSelectedId = [];
    data.forEach((user) => {
      this.userSelected.push(user);
      this.userSelectedId.push(user._id);
    });
  }

  resetFilter() {
    this.selection.clear();
    this.isReset = true;
    this.paginator.pageIndex = 0;
    this.sort.sort({ id: '', start: 'asc', disableClear: false });

    this.filteredValues = {
      school_id: null,
      full_name: null,
      identity_verification_status: null,
      toward_administration: null,
      employability_survey_dynamic: null,
      diploma: null,
      certifier_school: null,
      status: null,
      certificate_issuance_date: null,
    };
    this.schoolFilter.setValue(null, { emitEvent: false });
    this.studentFilter.setValue(null, { emitEvent: false });
    this.certificationDateFilter.setValue(null, {emitEvent: false});
    this.identityFilter.setValue('AllM', { emitEvent: false });
    this.is_thumbups_green_filter.setValue('AllM', { emitEvent: false });
    this.empSurveyFilters.controls.forEach(control => control.setValue('AllF', { emitEvent: false }))
    this.diplomaFilter.setValue('AllM', { emitEvent: false });
    this.certifierFilter.setValue('AllM', { emitEvent: false });
    this.CDFilter.setValue('AllM', { emitEvent: false });
    // this.statusFilter.setValue('AllM', { emitEvent: false });

    this.sort.direction = '';
    this.sort.active = '';
    this.sortValue = null;
    this.fetchAndPopulateTable();
    this.getAllSchoolsDropdown();
  }

  generateParcheminCertificate(){

    let timeDisabled = 5;
    Swal.fire({
      type: 'warning',
      title: this.translate.instant('CERTIFICATE_ISSUANCE.CERT_S11.TITLE'),
      html: this.translate.instant('CERTIFICATE_ISSUANCE.CERT_S11.TEXT'),
      confirmButtonText: this.translate.instant('CERTIFICATE_ISSUANCE.CERT_S11.BUTTON1', { timer: timeDisabled }),
      cancelButtonText: this.translate.instant('CERTIFICATE_ISSUANCE.CERT_S11.BUTTON2'),
      showCancelButton: true,
      allowOutsideClick: false,
      onOpen: () => {
        Swal.disableConfirmButton();
        const confirmBtnRef = Swal.getConfirmButton();
        const time = setInterval(() => {
          timeDisabled -= 1;
          confirmBtnRef.innerText = this.translate.instant('CERTIFICATE_ISSUANCE.CERT_S11.BUTTON1') + ' in ' + timeDisabled + ' sec';
        }, 1000);

        this.timeOutVal = setTimeout(() => {
          confirmBtnRef.innerText = this.translate.instant('CERTIFICATE_ISSUANCE.CERT_S11.BUTTON1');
          Swal.enableConfirmButton();
          clearInterval(time);
          clearTimeout(this.timeOutVal);
        }, timeDisabled * 1000);
      },
    }).then((result) => {
      clearTimeout(this.timeOutVal);
      if(result.value){
        this.subs.sink = this.certiDegreeService.generateParcheminCertificate(this.currentProcessData._id, this.currentProcessData.rncp_id._id, this.currentProcessData.class_id._id)
        .subscribe((resp) => {
          if (resp) {
            Swal.fire({
              type: 'success',
              title: 'Bravo'
            })
            this.router.navigate(['/certidegree']);
          }
        })
      }
    });
  }

  viewCertificate(element) {
    this.certiDegreeService.setStudentIssuingData(element);
  }

  verifyStudentListIdentitiesAndDownload() {
      Swal.fire({
        type: 'question',
        title: this.translate.instant('CERTIFICATE_ISSUANCE.CERT_S6.TITLE'),
        html: this.translate.instant('CERTIFICATE_ISSUANCE.CERT_S6.TEXT'),
        confirmButtonText: this.translate.instant('CERTIFICATE_ISSUANCE.CERT_S6.BTN_1'),
        cancelButtonText: this.translate.instant('CERTIFICATE_ISSUANCE.CERT_S6.BTN_2'),
        showCancelButton: true,
        allowOutsideClick: false,
      }).then((resp) => {
        if (resp.value) {
          this.checkCertificateGeneratedForStudents('multiple', '');
        } else {
          return;
        }
      });
  }

  downloadPDFCertificate() {
    // this.isWaitingForResponse = true;
    // **************** Put the spinner on the parent on downloading
    this.isDownloading.emit(true);
    const isDownloadMultiple = true;
    this.subs.sink = this.certiDegreeService
      .downloadCertificatePdf(
        this.currentProcessId,
        this.currentProcessData.rncp_id._id,
        this.currentProcessData.class_id._id,
        isDownloadMultiple,
        'active_completed_suspended',
        this.isAllSelected() ? null : this.userSelectedId,
        this.filteredValues,
      )
      .subscribe(
        (list) => {
          // this.isWaitingForResponse = false;
          // **************** Put the spinner on the parent on downloading
          this.isDownloading.emit(false);
          if (list) {
            Swal.fire({
              type: 'success',
              title: this.translate.instant('CERT_S7.TITLE'),
              text: this.translate.instant('CERT_S7.TEXT'),
              confirmButtonText: this.translate.instant('CERT_S7.BUTTON 1'),
            });
          }
        },
        (err) => {
          // **************** Put the spinner on the parent on downloading
            this.authService.postErrorLog(err);
          this.isDownloading.emit(false);
        },
      );
  }

  downloadPDFCertidficateIndividual(student) {
    // *************** Put the loading for download on parent component instead of the table
    this.isDownloading.emit(true);
    this.subs.sink = this.certiDegreeService
      .downloadCertificatePdfSingle(this.currentProcessId, this.currentProcessData.rncp_id._id, student._id)
      .subscribe(
        (list) => {
          // this.isWaitingForResponse = false;
          // *************** Put the loading for download on parent component instead of the table
          if (list) {
            const result = this.serverimgPath + list;

            const a = document.createElement('a');
            a.target = 'blank';
            a.href = `${result}?download=true`.replace('/graphql', '');
            a.click();
            a.remove();
            Swal.fire({
              type: 'success',
              title: this.translate.instant('Bravo !'),
            }).then(() => {
              this.isDownloading.emit(false);
            });
          }
        },
        (err) => {
          // *************** Put the loading for download on parent component instead of the table
          this.isDownloading.emit(false);
        },
      );
  }

  getFinalResultAfterReTake(result: string) {
    if (result === 'PASS1' || result === 'PASS2' || result === 'PASS3') {
      return 'PASS';
    } else if (result === 'FAILED' || result === 'ELIMINATED') {
      return 'FAILED';
    }
  }

  checkPublishValidation(studentData$) {
    const selectedStudent = _.cloneDeep(studentData$);
    if (
      selectedStudent &&
      selectedStudent.academic_journey_id &&
      selectedStudent.final_transcript_id &&
      selectedStudent.employability_survey_ids &&
      selectedStudent.employability_survey_ids.length &&
      selectedStudent.identity_verification_status === 'details_confirmed' &&
      selectedStudent.is_thumbups_green === true &&
      selectedStudent.academic_journey_id.diplomas &&
      selectedStudent.academic_journey_id.diplomas.length &&
      selectedStudent.certificate_process_pdfs &&
      selectedStudent.certificate_process_pdfs.certification_process_status &&
      selectedStudent.certificate_process_pdfs.certification_process_status !== 'certificate_not_issued' &&
      selectedStudent.employability_survey_ids[selectedStudent.employability_survey_ids.length - 1].survey_status ===
        'validated_by_validator' &&
      (selectedStudent.final_transcript_id.jury_decision_for_final_transcript === 'pass' ||
        this.getFinalResultAfterReTake(selectedStudent.final_transcript_id.after_final_retake_decision) === 'PASS')
    ) {
      return true;
    } else {
      return false;
    }
  }

  publishCertificateIndividual(student) {
    // const studentId = [];
    // if (student && student._id) {
    //   studentId.push(student._id);
    // }

    // this.isWaitingForResponse = true;
    // *************** Put the spinner on the parent on publish certificate
    this.isDownloading.emit(true);
    this.subs.sink = this.certiDegreeService.publishCertificateSingleStudent(this.currentProcessId, student._id).subscribe(
      (list) => {
        // this.isWaitingForResponse = false;
        // *************** Put the spinner on the parent on publish certificate
        this.isDownloading.emit(false);
        if (list) {
          Swal.fire({
            title: 'Bravo!',
            type: 'success',
            allowEscapeKey: true,
            confirmButtonText: 'Okay',
          }).then(() => {
            this.fetchAndPopulateTable();
          });
        }
      },
      (err) => {
        // this.isWaitingForResponse = false;
        // *************** Put the spinner on the parent on publish certificate
            this.authService.postErrorLog(err);
        this.isDownloading.emit(false);

      },
    );
  }

  publishCertificateIndividualSelect(student) {
    // this.isWaitingForResponse = true;
    // *************** Put the spinner on the parent on publish certificate
    this.isDownloading.emit(true);
    this.subs.sink = this.certiDegreeService.publishCertificatePdf(this.currentProcessId, this.userSelectedId).subscribe(
      (list) => {
        // this.isWaitingForResponse = false;
        // *************** Put the spinner on the parent on publish certificate
        this.isDownloading.emit(false);
        if (list) {
          Swal.fire({
            title: 'Bravo!',
            type: 'success',
            allowEscapeKey: true,
            confirmButtonText: 'Okay',
          }).then(() => {
            this.fetchAndPopulateTable();
          });
        }
      },
      (err) => {
        // this.isWaitingForResponse = false;
        // *************** Put the spinner on the parent on publish certificate
        this.isDownloading.emit(false);
        this.authService.postErrorLog(err);

      },
    );
  }

  checkIsEnableToPublish() {
    let disabled = true;
    if (this.selection.selected.length) {
      for (const index of this.selection.selected) {
        if (this.checkPublishValidation(index) === false) {
          disabled = true;
          break;
        } else {
          disabled = false;
        }
      }
    }
    return disabled;
  }

  checkCertificateGeneratedForStudents(type, student) {
    this.isDownloading.emit(true);
    this.subs.sink = this.certiDegreeService.checkCertificateGeneratedForStudents(this.currentProcessId, this.userSelectedId).subscribe(
      (resp) => {
        if (resp) {
          this.downloadPDFCertificate();
        } else {
          Swal.fire({
            type: 'warning',
            title: this.translate.instant('CERT_S9.TITLE'),
            html: this.translate.instant('CERT_S9.TEXT'),
            confirmButtonText: this.translate.instant('CERT_S9.BUTTON'),
          }).then((ressp) => {
            this.downloadPDFCertificate();
          });
        }
      },
      (err) => {
        this.authService.postErrorLog(err);
        this.isDownloading.emit(false);
      },
    );
  }

  checkCertificatePublishForStudents(type, student) {
    if (type === 'individual') {
      const studentId = [];
      if (student && student._id) {
        studentId.push(student._id);
      }
      this.isDownloading.emit(true);
      this.subs.sink = this.certiDegreeService.checkStudentsReadyToPublishCertificate(this.currentProcessId, studentId).subscribe(
        (resp) => {
          if (resp) {
            this.publishCertificateIndividual(student);
          } else {
            Swal.fire({
              type: 'warning',
              title: this.translate.instant('CERT_S5.TITLE'),
              html: this.translate.instant('CERT_S5.TEXT'),
              confirmButtonText: this.translate.instant('CERT_S5.BUTTON'),
              showCancelButton: false,
              allowOutsideClick: false,
            }).then((ressp) => {
              this.isDownloading.emit(false);
            });
          }
        },
        (err) => {
          this.isDownloading.emit(false);
          this.authService.postErrorLog(err);
          Swal.fire({
            type: 'error',
            title: 'Error',
            text: err && err['message'] ? err['message'] : err,
            confirmButtonText: 'OK',
          });
        },
      );
    } else {
      if (this.selectType === 'one') {
        this.isDownloading.emit(true);
        this.subs.sink = this.certiDegreeService
          .checkStudentsReadyToPublishCertificate(this.currentProcessId, this.userSelectedId)
          .subscribe(
            (resp) => {
              if (resp) {
                this.publishCertificateIndividualSelect(student);
              } else {
                Swal.fire({
                  type: 'warning',
                  title: this.translate.instant('CERT_S5.TITLE'),
                  html: this.translate.instant('CERT_S5.TEXT'),
                  confirmButtonText: this.translate.instant('CERT_S5.BUTTON'),
                  showCancelButton: false,
                  allowOutsideClick: false,
                }).then((ressp) => {
                  this.publishCertificateIndividualSelect(student);
                });
              }
            },
            (err) => {
              this.isDownloading.emit(false);
              this.authService.postErrorLog(err);
              Swal.fire({
                type: 'error',
                title: 'Error',
                text: err && err['message'] ? err['message'] : err,
                confirmButtonText: 'OK',
              });
            },
          );
      } else {
        this.isDownloading.emit(true);
        this.subs.sink = this.certiDegreeService
          .checkStudentsReadyToPublishCertificateAllStudent(this.currentProcessId, this.filteredValues)
          .subscribe(
            (resp) => {
              if (resp) {
                this.publishCertificateMultipleStudent();
              } else {
                Swal.fire({
                  type: 'warning',
                  title: this.translate.instant('CERT_S5.TITLE'),
                  html: this.translate.instant('CERT_S5.TEXT'),
                  confirmButtonText: this.translate.instant('CERT_S5.BUTTON'),
                  showCancelButton: false,
                  allowOutsideClick: false,
                }).then((ressp) => {
                  this.publishCertificateMultipleStudent();
                });
              }
            },
            (err) => {
              this.isDownloading.emit(false);
              this.authService.postErrorLog(err);
              Swal.fire({
                type: 'error',
                title: 'Error',
                text: err && err['message'] ? err['message'] : err,
                confirmButtonText: 'OK',
              });
            },
          );
      }
    }
  }

  publishCertificateMultipleStudent() {
    this.subs.sink = this.certiDegreeService.publishCertificatePdfAll(this.currentProcessId, this.filteredValues).subscribe(
      (list) => {
        this.isDownloading.emit(false);
        Swal.fire({
          title: 'Bravo!',
          type: 'success',
          allowEscapeKey: true,
          confirmButtonText: 'Okay',
        }).then(() => {
          this.selection.clear();
          this.isCheckedAll = false;
          this.fetchAndPopulateTable();
        });
      },
      (err) => {
        this.authService.postErrorLog(err);
        this.isDownloading.emit(false);

      },
    );
  }
}
