import { ValidateSiretDialogComponent } from './validate-siret-dialog/validate-siret-dialog.component';
import { CloseCompanyContractDialogComponent } from './close-company-contract-dialog/close-company-contract-dialog.component';
import { ReasonOfDeactivationDialogComponent } from './reason-of-deactivation-dialog/reason-of-deactivation-dialog.component';
import { CertidegreeService } from './../../service/certidegree/certidegree.service';
import {
  Component,
  Input,
  OnInit,
  ViewChild,
  EventEmitter,
  Output,
  OnDestroy,
  OnChanges,
  ChangeDetectorRef,
  AfterViewChecked,
} from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { forkJoin, Observable } from 'rxjs';
import { DateAdapter } from '@angular/material/core';
import { MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';
import { MatSort } from '@angular/material/sort';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { SubSink } from 'subsink';
import { ReplyUrgentMessageDialogComponent } from 'app/mailbox/reply-urgent-message-dialog/reply-urgent-message-dialog.component';
import { MailboxService } from 'app/service/mailbox/mailbox.service';
import { debounceTime } from 'rxjs/operators';
import * as _ from 'lodash';
import { SchoolService } from 'app/service/schools/school.service';
import Swal from 'sweetalert2';
import { StudentsService } from 'app/service/students/students.service';
import * as moment from 'moment';
import { ParseLocalToUtcPipe } from 'app/shared/pipes/parse-local-to-utc.pipe';
import { ParseUtcToLocalPipe } from 'app/shared/pipes/parse-utc-to-local.pipe';
import { ParseStringDatePipe } from 'app/shared/pipes/parse-string-date.pipe';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import { AuthService } from 'app/service/auth-service/auth.service';
import { JobDescService } from 'app/service/job-desc/job-desc.service';
import { PermissionService } from 'app/service/permission/permission.service';
import { NgxPermissionsService } from 'ngx-permissions';
import { CheckCompanyDialogComponent } from 'app/companies/check-company-dialog/check-company-dialog.component';
import { CompanyCreationTabComponent } from 'app/companies/company-creation-tab/company-creation-tab.component';
import { ActivatedRoute, Router } from '@angular/router';
import { AddCompanyStaffDialogComponent } from 'app/companies/add-company-staff-dialog/add-company-staff-dialog.component';
import { ProblematicService } from 'app/service/problematic/problematic.service';
import { NgSelectComponent } from '@ng-select/ng-select';
import { CompanyService } from 'app/service/company/company.service';
import { AddCompanyDialogComponent } from 'app/companies/shared-company-components/add-company-dialog/add-company-dialog.component';
import { UtilityService } from 'app/service/utility/utility.service';
import { environment } from 'environments/environment';
export interface PeriodicElement {
  column1: string;
  column2: boolean;
  column3: string;
}

const ELEMENT_DATA: PeriodicElement[] = [
  { column1: 'Job Description', column2: true, column3: 'Send Job description' },
  { column1: 'Problematic', column2: true, column3: 'Send Problematic' },
  { column1: 'Mentor Evaluation', column2: false, column3: 'Send Mentor Evaluation' },
];
@Component({
  selector: 'ms-company',
  templateUrl: './company.component.html',
  styleUrls: ['./company.component.scss'],
  providers: [ParseStringDatePipe, ParseLocalToUtcPipe, ParseUtcToLocalPipe],
})
export class CompanyComponent implements OnInit, OnDestroy, OnChanges, AfterViewChecked {
  replyUrgentMessageDialogComponent: MatDialogRef<ReplyUrgentMessageDialogComponent>;
  @ViewChild('companyCreate', { static: false }) companyCreate: CompanyCreationTabComponent;
  private subs = new SubSink();
  @Input() studentId = '';
  @Input() studentPrevCourseData: any;
  @Input() schoolId: string;
  @Input() classId: string;
  @Input() titleId: string;
  @Output() continue = new EventEmitter<string>();
  @Output() updateJobDesc = new EventEmitter<boolean>();
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  companyName: any;
  mentorMail: any;
  selectedMentorId: string | null = null;
  today = new Date();
  listOfCompanies = [];
  companyForm: UntypedFormGroup;
  isLoadingDetail = true;
  isLoadingUpdateStudent = false;
  isMentorEnable = false;
  displayedColumns: string[] = ['position', 'status', 'name', 'weight'];
  displayedColumnsCompany: string[] = ['companyName', 'selectMentor', 'dFrom', 'dTo', 'closed', 'J', 'P', 'M', 'actions'];
  fieldOneOption = [
    { key: 'FORMATION_INITIALE_HORS_APPRENTISSAGE', value: 'Formation initiale hors apprentissage' },
    { key: 'FORMATION_INITIALE_APPRENTISSAGE', value: 'Formation initiale apprentissage' },
    { key: 'FORMATION_CONTINUE_HORS_CONTRAT_DE_PROFESSIONNALISATION', value: 'Formation continue hors contrat de professionnalisation' },
    { key: 'FORMATION_CONTINUE_CONTRAT_DE_PROFESSIONNALISATION', value: 'Formation continue contrat de professionnalisation' },
    { key: 'VAE', value: 'VAE' },
  ];

  fieldTwoOption = [
    { key: 'FORMATION_INITIALE', value: 'Formation initiale (=convention de stage)' },
    { key: 'CONTRAT_DAPPRENTISSAGE', value: "Contrat d'apprentissage" },
    { key: 'CONTRAT_DE_PROFESSIONNALISATION', value: 'Contrat de professionnalisation' },
    {
      key: 'STATUT_DE_STAGIAIRE_DE_LA_FORMATION_PROFESSIONNELLE',
      value: "Statut de stagiaire de la formation professionnelle (=demandeur d'emploi / salarié)",
    },
  ];

  dataSource = ELEMENT_DATA;
  dataSource2 = new MatTableDataSource([]);
  entityData: any;
  dataPass: any;
  jobDescId: string;
  dataSourceCompanyHistory: any = [
    {
      companyName: 'IBM',
      selectMentor: 'Ahmed',
      status: true,
      dFrom: 'Thu Apr 16 2020 00:00:00 GMT+0100 (West Africa Standard Time)',
      dTo: 'Thu Apr 16 2020 00:00:00 GMT+0100 (West Africa Standard Time)',
      J: true,
      P: false,
      M: true,
    },
    {
      companyName: 'ESPRIT',
      selectMentor: 'Mohamed',
      status: true,
      dFrom: 'Thu Apr 16 2020 00:00:00 GMT+0100 (West Africa Standard Time)',
      dTo: 'Thu Apr 16 2020 00:00:00 GMT+0100 (West Africa Standard Time)',
      J: false,
      P: true,
      M: false,
    },
  ];
  filterColumns: string[] = ['companyFilter', 'mentorFilter', 'fromFilter', 'toFilter'];
  filteredValues = {
    company: '',
    mentor: '',
    dFrom: '',
    dTo: '',
  };
  configCat: MatDialogConfig = {
    disableClose: true,
    width: '1070px',
    minHeight: '81%',
  };
  disabledForm = false;
  typeMentorId = '5a2e603f53b95d22c82f9590';
  companys: any;
  originalCompanys: any;
  originalMentors: any;
  mentors: any;
  data: any;
  active: boolean;
  status: string;
  companyFilter = new UntypedFormControl('');
  filtredCompany: Observable<string[]>;
  filtredCompanyList = [];
  userTypeMentor: string;
  companyId: string;
  mentorId: string;
  classData: any;
  studentData: any;
  currentUser: any;
  contractData: any;
  contractHistory: any;
  contractStatus: any;
  isStudent: any;
  isUserAdmtc = false;
  isUserChiefGroup = false;
  IsFinalTranscriptStarted = false;
  isUserAcadir = false;
  isUserAcadAdmin = false;
  companyCreation = false;
  connectCompany = false;
  currentUserTypeId: string;
  CurUser: any;
  companyTemp: any;
  mentorActive: string;
  mentorEmailStatus;
  mentorEmail;

  // ************ Variable to store company id that was passed after creating new company from company tab
  newlyCreatedCompanyId;
  newlyCreatedCompanyData;

  // ************ For Spinner Loading
  isWaitingForResponse = false;
  companyStaff: boolean = false;
  typeInformation: { key: string; value: string }[];

  constructor(
    private fb: UntypedFormBuilder,
    private studentService: StudentsService,
    private translate: TranslateService,
    private companyService: CompanyService,
    public dialog: MatDialog,
    private mailboxService: MailboxService,
    private schoolService: SchoolService,
    private parseStringDatePipe: ParseStringDatePipe,
    private parseLocalToUTCPipe: ParseLocalToUtcPipe,
    private parseUTCToLocalPipe: ParseUtcToLocalPipe,
    private rncpTitleService: RNCPTitlesService,
    private userService: AuthService,
    private jobDescService: JobDescService,
    public permissionService: PermissionService,
    private permissions: NgxPermissionsService,
    private router: Router,
    private problematicService: ProblematicService,
    private dateAdapter: DateAdapter<Date>,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private certiDegreeService: CertidegreeService,
    private utilService: UtilityService,
  ) {}

  ngOnInit() {
    this.checkFinalTranscripsIsStarted();
    this.dateAdapter.setLocale(this.translate.currentLang);
    this.isStudent = this.permissions.getPermission('Student') ? true : false;
    // this.getDataClass();
    // this.getDataStudent();
    this.dataSource2.data = this.dataSourceCompanyHistory;
    this.dataSource2.sort = this.sort;
    this.active = false;
    this.typeInformation = this.fieldOneOption;

    this.currentUser = this.userService.getLocalStorageUser();
    this.status = this.active ? 'active' : 'inActive';
    // this.initForm();
    // this.getCompanyForm();
    // this.getCompanyData();
    this.initData();
    // this.getUrgentMail();
    this.schoolService.setCurrentStudentId(null);
    if (this.studentId) {
      this.schoolService.setCurrentStudentIdCompany(this.studentId);
    }
    // *************** Cek User Type & Permission Access User to Company Data
    this.isUserAcadir = !!this.permissions.getPermission('Academic Director');
    this.isUserAcadAdmin = !!this.permissions.getPermission('Academic Admin');
    this.isUserAdmtc = this.utilService.isUserEntityADMTC();
    this.isUserChiefGroup = !!this.permissions.getPermission('Chief Group Academic');
    this.currentUserTypeId = this.currentUser.entities.find(
      (entity) => entity.type.name === this.userService.getPermission()[0],
    )?.type?._id;
    this.CurUser = this.userService.getLocalStorageUser();
    if (this.isUserAcadir) {
      this.entityData = this.CurUser.entities.find((entity) => entity.type.name === 'Academic Director');
    } else if (this.isUserAcadAdmin) {
      this.entityData = this.CurUser.entities.find((entity) => entity.type.name === 'Academic Admin');
    }
    this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      this.getCompanyForm();
      this.dateAdapter.setLocale(this.translate.currentLang);
    });
  }

  ngAfterViewChecked() {
    this.cdr.detectChanges();
  }

  initData() {
    const forkArray = [];
    forkArray.push(this.rncpTitleService.getClassByIdOnCompany(this.classId));
    if (this.studentPrevCourseData) {
      // student's previous course data
      forkArray.push(
        this.studentService.getStudentsPreviousCourseIdentityData(
          this.schoolId,
          this.studentPrevCourseData.rncp_title._id,
          this.studentPrevCourseData.current_class._id,
          this.studentId,
        ),
      );
    } else {
      // 19/05/2022 RA_0528 we don't need to pass titleId and classId to get student data
      forkArray.push(this.studentService.getStudentsIdentityData(this.studentId, this.titleId, this.classId));
    }

    this.subs.sink = forkJoin(forkArray).subscribe((resp) => {
      if (resp) {
        let count = 0;
        if (resp[count]) {
          this.classData = _.cloneDeep(resp[count]);

          count++;
        }
        if (resp[count]) {
          this.studentData = this.studentPrevCourseData ? _.cloneDeep(resp[count][0]) : _.cloneDeep(resp[count]);

          count++;
        }
        this.initForm();
        this.getCompanyForm();
        this.getCompanyData();
      }
    });
  }

  ngOnChanges() {
    this.cdr.detectChanges();
    this.initData();
    this.isMentorEnable = false;
    // this.getDataClass();
    // this.getDataStudent();
    // this.initForm();
    // this.getCompanyForm();
  }

  initForm() {
    this.companyForm = this.fb.group({
      company: ['', Validators.required],
      mentor: [null, Validators.required],
      start_date: ['', Validators.required],
      end_date: [''],
      is_active: [''],
      type_of_formation: ['', Validators.required],
      category_insertion: [{ value: '', disabled: true }, Validators.required],
    });
    this.companyForm.valueChanges.subscribe((resp) => {
      this.isFormSame();
    });
  }

  isFormSame() {
    const secondForm = JSON.stringify(this.companyTemp);
    const formType = JSON.stringify(this.companyForm.value);
    if (secondForm === formType) {
      this.certiDegreeService.childrenFormValidationStatus = true;
      return true;
    } else {
      this.certiDegreeService.childrenFormValidationStatus = false;
      return false;
    }
  }

  onClickActiveContract() {
    Swal.fire({
      title: this.translate.instant('CONTRACT_S1.TITLE'),
      type: 'warning',
      allowEscapeKey: true,
      showCancelButton: true,
      confirmButtonText: this.translate.instant('CONTRACT_S1.BUTTON_1'),
      cancelButtonText: this.translate.instant('CONTRACT_S1.BUTTON_2'),
      footer: `<span style="margin-left: auto">CONTRACT_S1</span>`,
      allowOutsideClick: false,
      allowEnterKey: false,
    }).then((res) => {
      if (res.value) {
        this.isLoadingDetail = true;
        this.active = true;
        this.status = this.active ? 'active' : 'inActive';
        this.disabledForm = true;
        this.disableFormField();
        this.companyForm.get('is_active').setValue('active');
        const contract = this.companyForm.value;
        this.updateStudentCompany();
        this.subs.sink = this.studentService.getStudentsCompanyData(this.studentId).subscribe(
          (response) => {
            const ress = _.cloneDeep(response);
            this.contractData = ress;
            this.generateStatusContract(this.contractData);

            this.initData();
            this.isLoadingDetail = false;
          },
          (err) => {
            this.isLoadingDetail = false;

            Swal.fire({
              type: 'error',
              title: 'Error',
              text: err && err['message'] ? err['message'] : err,
              confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
            });
          },
        );
      }
    });
  }

  onClickInActiveContract() {
    Swal.fire({
      title: this.translate.instant('CONTRACT_S2.TITLE'),
      html: this.translate.instant('CONTRACT_S2.TEXT'),
      type: 'warning',
      allowEscapeKey: true,
      showCancelButton: true,
      confirmButtonText: this.translate.instant('CONTRACT_S2.BUTTON_1'),
      cancelButtonText: this.translate.instant('CONTRACT_S2.BUTTON_2'),
      footer: `<span style="margin-left: auto">CONTRACT_S2</span>`,
      allowOutsideClick: false,
      allowEnterKey: false,
    }).then((res) => {
      if (res.value) {
        const mentorName = this.mentors.find((obj) => obj._id === this.companyForm.get('mentor').value).name;
        this.dialog
          .open(CloseCompanyContractDialogComponent, {
            disableClose: true,
            width: '590px',
            panelClass: 'certification-rule-pop-up',
            data: {
              studentName: {
                civility: this.studentData.civility,
                first_name: this.studentData.first_name,
                last_name: this.studentData.last_name,
              },
              mentorCiv: this.studentData?.companies[0]?.mentor?.civility,
              mentorLast: this.studentData?.companies[0]?.mentor?.last_name,
              mentorFirst: this.studentData?.companies[0]?.mentor?.first_name,
              companyName: this.companyForm.get('company').value,
            },
          })
          .afterClosed()
          .subscribe((data?: any) => {
            if (data) {
              this.closeContractActive(data);
            }
          });
      }
    });
  }

  onClickResignationReasonDialog(data) {
    this.dialog.open(ReasonOfDeactivationDialogComponent, {
      disableClose: true,
      width: '500px',
      minHeight: '100px',
      panelClass: 'certification-rule-pop-up',
      data: {
        reason_deactivating_contract: data
      }
    });
  }

  initializeUserFilter() {}

  // *************** Function to disable/enable form field
  disableFormField() {
    this.companyForm.get('company').disable();
    this.companyForm.get('mentor').disable();
    this.companyForm.get('category_insertion').disable();
    if (this.companyForm.get('start_date').value) {
      this.companyForm.get('start_date').disable();
    }
    if (this.companyForm.get('end_date').value && !this.dateIsInvalid(this.companyForm.get('end_date').value)) {
      this.companyForm.get('end_date').disable();
    }
  }

  dateIsInvalid(date: any) {
    return date instanceof Date && !!isNaN(date.valueOf());
  }

  changeMentorButton() {
    if (this.companyForm.get('mentor').disabled) {
      this.companyForm.get('mentor').enable();
      Swal.fire({
        type: 'info',
        title: this.translate.instant('SWAL_CHANGE_MENTOR.TITLE'),
        text: this.translate.instant('SWAL_CHANGE_MENTOR.TEXT'),
        confirmButtonText: this.translate.instant('SWAL_CHANGE_MENTOR.BUTTON'),
        footer: `<span style="margin-left: auto">SWAL_CHANGE_MENTOR</span>`,
      });
    } else {
      this.updateCompany();
    }
  }

  enableFormField() {
    this.companyForm.get('company').enable();
    this.companyForm.get('company').clearValidators();
    this.companyForm.get('company').updateValueAndValidity();
    this.companyForm.get('company').setValidators([Validators.required]);
    this.companyForm.get('company').updateValueAndValidity();
    this.companyForm.get('mentor').enable();
    this.companyForm.get('mentor').clearValidators();
    this.companyForm.get('mentor').updateValueAndValidity();
    this.companyForm.get('mentor').setValidators([Validators.required]);
    this.companyForm.get('mentor').updateValueAndValidity();
    this.companyForm.get('start_date').enable();
    this.companyForm.get('start_date').clearValidators();
    this.companyForm.get('start_date').updateValueAndValidity();
    this.companyForm.get('start_date').setValidators([Validators.required]);
    this.companyForm.get('start_date').updateValueAndValidity();
    if (this.active && !this.isStudent) {
      this.companyForm.get('end_date').enable();
      this.companyForm.get('end_date').clearValidators();
      this.companyForm.get('end_date').updateValueAndValidity();
      this.companyForm.get('end_date').setValidators([Validators.required]);
      this.companyForm.get('end_date').updateValueAndValidity();
    } else if (!this.active && !this.isStudent) {
      this.companyForm.get('end_date').enable();
      this.companyForm.get('end_date').clearValidators();
      this.companyForm.get('end_date').updateValueAndValidity();
      this.companyForm.get('end_date').patchValue(null);
    }
  }
  // *************** End of Function to disable/enable form field

  getCompanyData() {
    this.isLoadingDetail = true;
    const search = '';
    this.subs.sink = this.schoolService.getAllCompany(search, this.schoolId).subscribe((resp) => {
      this.isLoadingDetail = false;
      if (resp?.length) {
        const temp = resp.filter((company) => company?.company_name);
        this.companys = _.orderBy(temp, [(company) => company?.company_name?.toLowerCase()], ['asc']);
        this.originalCompanys = _.orderBy(temp, ['company_name'], ['asc']);
        this.CompanyData();
      }
    });
  }

  CompanyData() {
    this.subs.sink = this.companyForm
      .get('company')
      .valueChanges.pipe(debounceTime(100))
      .subscribe((searchString) => {
        if (searchString) {
          if (this.originalCompanys && this.originalCompanys.length) {
            const foundName = this.originalCompanys.filter((com) =>
              com ? com.company_name.toLowerCase().includes(searchString ? searchString.toLowerCase() : '') : '',
            );
            if (foundName.length) {
              this.companys = foundName;
            } else {
              const foundRC = this.originalCompanys.filter((com) =>
                com && com.no_RC ? com.no_RC.includes(searchString ? searchString : '') : '',
              );
              if (foundRC.length) {
                this.companys = foundRC;
              } else {
                this.companys = [];
              }
            }
          } else {
            this.companys = [];
          }
        } else {
          this.companys = this.originalCompanys && this.originalCompanys.length ? this.originalCompanys : [];
        }
        this.companys = _.orderBy(this.companys, ['company_name'], ['asc']);
      });
  }

  filterMentor() {
    this.subs.sink = this.companyForm
      .get('mentor')
      .valueChanges.pipe(debounceTime(100))
      .subscribe((searchString) => {
        if (searchString) {
          if (this.originalMentors && this.originalMentors.length) {
            this.mentors = this.originalMentors.filter((option) =>
              option ? option.last_name.toLowerCase().trim().includes(searchString.toLowerCase()) : '',
            );
          } else {
            this.mentors = [];
          }
        } else {
          this.mentors = this.originalMentors && this.originalMentors.length ? this.originalMentors : [];
        }
      });
  }

  getUserType() {
    this.subs.sink = this.schoolService.getUserTypeMentor().subscribe((resp: any) => {
      if (resp && resp.length) {
        resp.forEach((element) => {
          this.userTypeMentor = element._id;
        });
      }
    });
  }

  changeCompany(data: any) {
    this.CompanyData();
    if (data === '') {
      this.isMentorEnable = false;
      this.mentors = [];
      this.companyForm.get('company').setValue('');
      this.companyForm.get('mentor').setValue(null);
    } else if (data === 'NEW') {
      // this.subs.sink = this.dialog
      //   .open(CheckCompanyDialogComponent, {
      //     minWidth: '400px',
      //     minHeight: '100px',
      //     panelClass: 'certification-rule-pop-up',
      //     disableClose: true,
      //   })
      //   .afterClosed()
      //   .subscribe((e) => {
      //     if (e) {
      //       this.companyCreation = e.createCompany;
      //       this.connectCompany = e.connectCompany;
      //       this.dataPass = e.dataAdd;
      //       if (this.companyCreation) {
      //         this.generateData(this.dataPass);
      //       }
      //       if (this.connectCompany) {
      //         this.connectingCompany(e.companyId);
      //       }
      //       this.mentors = [];
      //       this.companyForm.get('company').setValue('');
      //       this.companyForm.get('mentor').setValue(null);
      //     } else {
      //       this.mentors = [];
      //       this.companyForm.get('company').setValue('');
      //       this.companyForm.get('mentor').setValue(null);
      //     }
      //   });

      this.subs.sink = this.dialog
        .open(AddCompanyDialogComponent, {
          disableClose: true,
          width: '50%',
          minHeight: '100px',
          data: {
            from: 'studentcard',
            schoolStudentCard: this.schoolId,
          },
        })
        .afterClosed()
        .subscribe((e) => {
          this.mentors = [];
          this.companyForm.get('mentor').setValue(null);
          if (e && e.companies && e.companies.length) {
            // for fr companies
            this.companyForm.get('company').setValue(e.companies[0].company_name);
            this.isMentorEnable = true;
            this.companyId = e.companies.find((company) => company.company_type === 'branch')
              ? e.companies.find((company) => company.company_type === 'branch')._id
              : e.companies[0]._id;
            this.getMentor();
          } else if (e && e.company_name) {
            // for non-fr companies
            this.companyForm.get('company').setValue(e.company_name);
            this.isMentorEnable = true;
            this.companyId = e._id;
            this.getMentor();
          } else {
            this.companyForm.get('company').setValue('');
          }
          this.getCompanyData();
        });
    } else {
      this.isMentorEnable = true;
      this.companyForm.get('mentor').setValue(null);
      this.companyId = data._id;
      this.getMentor();
      if (
        data &&
        data.company_addresses &&
        data.company_addresses.length &&
        data.company_addresses[0].country &&
        data.company_addresses[0].country.toLowerCase().trim() === 'france' &&
        !data.no_RC
      ) {
        this.dialog
          .open(ValidateSiretDialogComponent, {
            disableClose: true,
            minWidth: '720px',
            minHeight: '100px',
            panelClass: 'certification-rule-pop-up',
            data: data._id,
          })
          .afterClosed()
          .subscribe((resp) => {
            if (resp && resp.company_name) {
              this.companyForm.get('company').setValue(resp.company_name);
              this.getCompanyData();
            } else {
              this.companyForm.get('company').setValue('');
            }
          });
      }
    }
  }

  // *************** Function to Connecting Company to user school
  connectingCompany(companyId) {
    const schoolId = this.entityData.school._id;
    this.subs.sink = this.companyService.connectSchoolToCompany(companyId, schoolId).subscribe(
      (resp) => {
        if (resp) {
          Swal.fire({
            type: 'success',
            title: 'Bravo !',
            confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
          });
        }
      },
      (err) => {},
    );
  }

  addMentor(select: NgSelectComponent) {
    select.close();
    this.subs.sink = this.dialog
      .open(AddCompanyStaffDialogComponent, {
        ...this.configCat,
        data: {
          operation: 'add',
          companyId: this.companyId,
          schoolId: this.schoolId,
          userTypeId: this.currentUserTypeId,
        },
      })
      .afterClosed()
      .subscribe((e) => {
        this.selectedMentorId = e?.mentorId || e?.mentorResp?._id || e?.dataMentor?._id || null
        this.mentorId = e?.mentorId || e?.mentorResp?._id || e?.dataMentor?._id || null
        if (e) {
          this.isMentorEnable = true;
          this.mentorMail = e.mentorResp && e.mentorResp.email ? e.mentorResp.email : '';
        }
        if (e && e.mentorResp) {
          this.connectingMentorToCompany(e.mentorResp);
        } else if (e?.connectToCompany && e?.dataMentor) {
          this.connectingMentorToCompany(e.dataMentor);
        } else if (this.selectedMentorId) {
          Swal.fire({
            type: 'success',
            title: 'Bravo !',
            allowOutsideClick: false,
            allowEscapeKey: false,
          }).then(() => {
            this.getMentor();
          });
        } else {
          this.companyForm.get('mentor').setValue(null);
        }
      });
  }

  changeMentor(data: any) {
    if (data) {
      this.mentorId = data._id;
    } else {
      this.mentorId = null;
    }
  }

  getMentor() {
    if (this.isUserAcadAdmin || this.isUserAcadir) {
      this.companyStaff = true;
    }
    if (this.companyId && this.schoolId && this.typeMentorId) {
      this.subs.sink = this.schoolService
        .getMentorStudent(this.typeMentorId, this.companyId, this.schoolId, this.companyStaff)
        .subscribe((resp) => {
          if (resp && resp.length) {
            this.mentors = resp;
            this.originalMentors = resp.map((list) => {
              return {
                _id: list._id,
                first_name: list.first_name,
                last_name: list.last_name,
                civility: list.civility,
                email: list.email,
                full_name: list.full_name,
                name: (list.civility ? this.translate.instant(list.civility) : '') + ' ' + list.first_name + ' ' + list.last_name,
              };
            });
            this.mentors = this.originalMentors;
            const comp = this.studentData.companies.filter((list) => list.status === 'active');
            if (this.selectedMentorId) {
              this.companyForm.get('mentor').patchValue(this.selectedMentorId);
              this.selectedMentorId = null;
            } else if (comp && comp.length) {
              this.companyForm.get('mentor').patchValue(comp[0].mentor._id);
            }
            if (this.companyForm.get('mentor').value && this.mentorMail) {
              const mentorSelected = this.mentors.filter((list) => list.email === this.mentorMail);
              if (mentorSelected && mentorSelected.length) {
                this.mentorId = mentorSelected[0]._id;
              }
            }
          } else {
            this.mentors = [];
            this.originalMentors = [];
          }
        });
    } else {
      this.mentors = [];
      this.originalMentors = [];
    }
  }
  setCompanyFilter(name) {}

  setMentorFilter(name) {}

  // getUrgentMail() {
  //   this.subs.sink = this.mailboxService.getUrgentMail().subscribe((mailList: any[]) => {
  //     if (mailList && mailList.length) {
  //       this.subs.sink = this.dialog
  //         .open(ReplyUrgentMessageDialogComponent, {
  //           disableClose: true,
  //           width: '825px',
  //           panelClass: 'certification-rule-pop-up',
  //           data: mailList,
  //         })
  //         .afterClosed()
  //         .subscribe((resp) => {
  //           this.subs.sink = this.mailboxService.getUrgentMail().subscribe((mailUrgent: any[]) => {
  //             if (mailUrgent && mailUrgent.length) {
  //               this.replyUrgentMessageDialogComponent = this.dialog.open(ReplyUrgentMessageDialogComponent, {
  //                 disableClose: true,
  //                 width: '825px',
  //                 panelClass: 'certification-rule-pop-up',
  //                 data: mailUrgent,
  //               });
  //             }
  //           });
  //         });
  //     }
  //   });
  // }

  generateData(company) {
    this.router.navigate(['/companies'], {
      queryParams: {
        open: 'company-creation',
        company: company.company_name,
        country: company.country,
        code: company.zip_code.toString(),
        schoolId: this.schoolId,
        titleId: this.titleId,
        classId: this.classId,
        studentId: this.studentId,
      },
    });
  }

  updateStudentCompany() {
    this.isLoadingDetail = true;
    this.isLoadingUpdateStudent = true;
    const temp = this.companyForm.value;
    // validation for main address
    const lang = this.translate.currentLang.toLowerCase();
    const companies = {
      company: this.companyId,
      mentor: this.mentorId,
      status: this.companyForm.get('is_active').value,
      start_date: {
        date: this.getConvertDate(this.companyForm.get('start_date').value, this.parseUTCToLocalPipe.transform('15:59')),
        time: this.getTodayTime(),
      },
      end_date: {
        date: this.getConvertDate(this.companyForm.get('end_date').value, this.parseUTCToLocalPipe.transform('15:59')),
        time: this.getEndTime(),
      },
      category_insertion: this.companyForm.get('category_insertion').value || null,
      type_of_formation: this.companyForm.get('type_of_formation').value || null,
    };
    let company = [];
    if (this.contractData.companies && this.contractData.companies.length) {
      company = this.contractData.companies.filter((resp) => {
        return resp.status !== 'active' && resp.status !== 'pending';
      });
      if (company && company.length) {
        company = company.map((com) => ({
          company: com && com.company ? com.company._id : null,
          job_description_id: com && com.job_description_id ? com.job_description_id._id : null,
          problematic_id: com && com.problematic_id ? com.problematic_id._id : null,
          mentor_evaluation_id: com && com.mentor_evaluation_id ? com.mentor_evaluation_id._id : null,
          mentor: com && com.mentor ? com.mentor._id : undefined,
          status: com.status,
          start_date: {
            date: com.start_date.date,
            time: com.start_date.time,
          },
          end_date: {
            date: com.end_date.date,
            time: com.end_date.time,
          },
          contract_closed_date: {
            date: com.contract_closed_date ? com.contract_closed_date.date : null,
            time: com.contract_closed_date ? com.contract_closed_date.time : null,
          },
          category_insertion: com.category_insertion ? com.category_insertion : null,
          type_of_formation: com.type_of_formation ? com.type_of_formation : null,
        }));
      }
    }
    company = company.concat(companies);
    const comp = {
      companies: company,
    };
    this.schoolService.setDataStudentCompany(this.companyForm.value);
    this.subs.sink = this.schoolService.updateStudent(this.studentId, comp, lang).subscribe(
      (resp) => {
        if (resp) {
          if (
            resp &&
            resp.academic_pro_evaluation &&
            resp.academic_pro_evaluation.test_id &&
            resp.academic_pro_evaluation.test_id.send_date_to_mentor &&
            resp.academic_pro_evaluation.test_id.send_date_to_mentor.date_utc &&
            resp.academic_pro_evaluation.test_id.send_date_to_mentor.time_utc &&
            resp.soft_skill_pro_evaluation &&
            resp.soft_skill_pro_evaluation.test_id &&
            resp.soft_skill_pro_evaluation.test_id.send_date_to_mentor &&
            resp.soft_skill_pro_evaluation.test_id.send_date_to_mentor.date_utc &&
            resp.soft_skill_pro_evaluation.test_id.send_date_to_mentor.time_utc
          ) {
            const evalDate = resp.academic_pro_evaluation.test_id.send_date_to_mentor.date_utc;
            const evalTime = resp.academic_pro_evaluation.test_id.send_date_to_mentor.time_utc;
            const skillDate = resp.soft_skill_pro_evaluation.test_id.send_date_to_mentor.date_utc;
            const skillTime = resp.soft_skill_pro_evaluation.test_id.send_date_to_mentor.time_utc;
            const today = moment().toDate();
            const evalProDate = this.parseUTCToLocalPipe.transformDateInDateFormat(evalDate, evalTime);
            const skillProDate = this.parseUTCToLocalPipe.transformDateInDateFormat(skillDate, skillTime);

            if (today <= evalProDate.toDate() || today <= skillProDate.toDate()) {
              const sendDate = evalProDate.format('DD/MM/YYYY');
              Swal.fire({
                type: 'warning',
                title: this.translate.instant('ACTIVATE_CONTRACT_S2.TITLE'),
                text: this.translate.instant('ACTIVATE_CONTRACT_S2.TEXT', { send_date: sendDate }),
                confirmButtonText: this.translate.instant('ACTIVATE_CONTRACT_S2.BUTTON'),
                footer: `<span style="margin-left: auto">ACTIVATE_CONTRACT_S2</span>`,
              }).then(() => {
                this.isLoadingUpdateStudent = false;
                this.initData();
                this.studentService.refreshStudentSummaryCard(true);
              });
              this.isLoadingDetail = false;
            } else {
              Swal.fire({
                type: 'warning',
                title: this.translate.instant('ACTIVATE_CONTRACT_S1.TITLE'),
                text: this.translate.instant('ACTIVATE_CONTRACT_S1.TEXT'),
                confirmButtonText: this.translate.instant('ACTIVATE_CONTRACT_S1.BUTTON'),
                footer: `<span style="margin-left: auto">ACTIVATE_CONTRACT_S1</span>`,
              }).then(() => {
                this.isLoadingUpdateStudent = false;
                this.initData();
                this.studentService.refreshStudentSummaryCard(true);
              });
              this.isLoadingDetail = false;
            }
          } else {
            Swal.fire({
              type: 'success',
              title: this.translate.instant('CONTRACT_S1B.TITLE'),
              confirmButtonText: this.translate.instant('CONTRACT_S1B.BUTTON'),
              footer: `<span style="margin-left: auto">CONTRACT_S1B</span>`,
            }).then(() => {
              this.isLoadingUpdateStudent = false;
              this.initData();
              this.studentService.refreshStudentSummaryCard(true);
            });
            this.isLoadingDetail = false;
          }
        }
      },
      (err) => {
        this.isLoadingUpdateStudent = false;
        this.isLoadingDetail = false;
        if (
          err['message'] === 'GraphQL error: Error: Email Registered As Student' ||
          err['message'] === 'GraphQL error: Error: Email Registered As User'
        ) {
          Swal.fire({
            type: 'error',
            title: this.translate.instant('ADDSTUDENT_ST.TITLE'),
            html: this.translate.instant('ADDSTUDENT_ST.TEXT'),
            footer: `<span style="margin-left: auto">ADDSTUDENT_ST</span>`,
            confirmButtonText: this.translate.instant('ADDSTUDENT_ST.BUTTON'),
          }).then(() => {
            this.studentService.updateStudentCard(true);
          });
        } else {
          Swal.fire({
            type: 'error',
            title: 'Error',
            text: err && err['message'] ? err['message'] : err,
            confirmButtonText: 'OK',
          });
        }
      },
    );
  }

  updateCompany() {
    this.isLoadingDetail = true;
    const temp = this.companyForm.value;
    // validation for main address
    const lang = this.translate.currentLang.toLowerCase();
    const companies = {
      company: this.companyId,
      mentor: this.mentorId,
      status: 'pending',
      start_date: {
        date: this.getConvertDate(this.companyForm.get('start_date').value, this.parseUTCToLocalPipe.transform('15:59')),
        time: this.getTodayTime(),
      },
      end_date: {
        date: this.getConvertDate(this.companyForm.get('end_date').value, this.parseUTCToLocalPipe.transform('15:59')),
        time: this.getEndTime(),
      },
      category_insertion: this.companyForm.get('category_insertion').value,
      type_of_formation: this.companyForm.get('type_of_formation').value,
    };
    let company = [];

    if (this.active) {
      const tempCompanies = _.cloneDeep(this.contractData.companies);
      const activeContract = tempCompanies.find((compData) => compData.status === 'active');
      const activeIndex = tempCompanies.findIndex((compData) => compData.status === 'active');

      // ****************** To be able to edit mentor, we check first.
      if (
        activeContract &&
        this.mentorId &&
        (!activeContract.mentor || (activeContract.mentor && activeContract.mentor._id !== this.mentorId))
      ) {
        activeContract.mentor = {
          _id: this.mentorId,
        };
      }

      if (activeContract && activeContract.start_date && activeContract.end_date) {
        activeContract.start_date = {
          date: this.getConvertDate(this.companyForm.get('start_date').value, this.parseUTCToLocalPipe.transform('15:59')),
          time: this.getTodayTime(),
        };
        activeContract.end_date = {
          date: this.getConvertDate(this.companyForm.get('end_date').value, this.parseUTCToLocalPipe.transform('15:59')),
          time: this.getEndTime(),
        };
        activeContract.category_insertion = this.companyForm.get('category_insertion').value;
        activeContract.type_of_formation = this.companyForm.get('type_of_formation').value;
      }

      this.contractData.companies[activeIndex] = activeContract;
    }

    if (this.contractData.companies && this.contractData.companies.length) {
      company = this.contractData.companies.filter((resp) => {
        return resp.status !== 'pending' || resp.status !== 'active';
      });
      if (company && company.length) {
        company = company.map((com) => ({
          company: com && com.company ? com.company._id : null,
          mentor: com && com.mentor ? com.mentor._id : undefined,
          job_description_id: com && com.job_description_id ? com.job_description_id._id : null,
          problematic_id: com && com.problematic_id ? com.problematic_id._id : null,
          mentor_evaluation_id: com && com.mentor_evaluation_id ? com.mentor_evaluation_id._id : null,
          status: com.status,
          start_date: {
            date: com.start_date ? com.start_date.date : null,
            time: com.start_date ? com.start_date.time : null,
          },
          end_date: {
            date: com.end_date ? com.end_date.date : null,
            time: com.end_date ? com.end_date.time : null,
          },
          contract_closed_date: {
            date: com.contract_closed_date ? com.contract_closed_date.date : null,
            time: com.contract_closed_date ? com.contract_closed_date.time : null,
          },
          category_insertion: com.category_insertion ? com.category_insertion : null,
          type_of_formation: com.type_of_formation ? com.type_of_formation : null,
        }));
      }
    }

    if (!this.active) {
      company = company.concat(companies);
    }
    const comp = {
      companies: company,
    };
    this.schoolService.setDataStudentCompany(this.companyForm.value);
    this.subs.sink = this.schoolService.updateStudent(this.studentId, comp, lang).subscribe(
      (resp) => {
        this.isLoadingDetail = false;

        if (this.active) {
          this.disableFormField();
        }

        if (resp) {
          Swal.fire({
            type: 'success',
            title: 'Bravo !',
          }).then((resp) => {
            this.initData();
            this.studentService.refreshStudentSummaryCard(true);
          });
        }
      },
      (err) => {
        this.isLoadingDetail = false;
        if (
          err['message'] === 'GraphQL error: Error: Email Registered As Student' ||
          err['message'] === 'GraphQL error: Error: Email Registered As User'
        ) {
          Swal.fire({
            type: 'error',
            title: this.translate.instant('ADDSTUDENT_ST.TITLE'),
            html: this.translate.instant('ADDSTUDENT_ST.TEXT'),
            footer: `<span style="margin-left: auto">ADDSTUDENT_ST</span>`,
            confirmButtonText: this.translate.instant('ADDSTUDENT_ST.BUTTON'),
          }).then(() => {
            this.studentService.updateStudentCard(true);
          });
        } else {
          Swal.fire({
            type: 'error',
            title: 'Error',
            text: err && err['message'] ? err['message'] : err,
            confirmButtonText: 'OK',
          });
        }
      },
    );
  }

  getCompanyForm() {
    this.isLoadingDetail = true;
    if (this.studentPrevCourseData) {
      this.subs.sink = this.studentService
        .getStudentsPreviousCourseCompanyData(
          this.schoolId,
          this.studentPrevCourseData.rncp_title._id,
          this.studentPrevCourseData.current_class._id,
          this.studentId,
        )
        .subscribe((response) => {
          // student's previous course data
          if (response && response[0]) {
            const res = _.cloneDeep(response[0]);
            this.setCompanyFormData(res);
          }
        });
    } else {
      // 19/05/2022 RA_0528 we don't need to pass titleId and classId to get student data
      this.subs.sink = this.studentService.getStudentsCompanyData(this.studentId, this.titleId, this.classId).subscribe((response) => {
        const res = _.cloneDeep(response);
        this.setCompanyFormData(res);
      });
    }
  }

  setCompanyFormData(res: any) {
    this.active = false;
    this.contractData = [];
    if (res) {
      this.contractData = _.cloneDeep(res);
      if (res.companies && res.companies.length) {
        let dataCompany = res.companies.filter((comp) => {
          return comp.status === 'active';
        });
        this.generateHistoryTable(res);
        if (dataCompany.length < 1) {
          dataCompany = res.companies.filter((comp) => {
            return comp.status === 'pending';
          });
        }
        if (dataCompany && dataCompany.length) {
          this.companyForm.get('is_active').patchValue(dataCompany[0].status);
          if (dataCompany[0].status === 'active') {
            this.active = true;
            this.status = this.active ? 'active' : 'inActive';
            this.disabledForm = true;
            this.disableFormField();
          } else if (dataCompany[0].status === 'pending') {
            this.enableFormField();
          }
          this.generateStatusContract(this.contractData);
          if (res.job_description_id) {
            this.getDataJobDesc(res.job_description_id._id);
            this.jobDescId = res.job_description_id._id;
          }
          if (res.problematic_id) {
            this.getDataProblematic(res.problematic_id._id);
          }

          this.getDataAutoEval();
          this.getDataEvalPro();

          this.companyId =
            dataCompany && dataCompany[0] && dataCompany[0].company && dataCompany[0].company._id ? dataCompany[0].company._id : '';
          this.mentorId =
            dataCompany && dataCompany[0] && dataCompany[0].mentor && dataCompany[0].mentor._id ? dataCompany[0].mentor._id : '';
          this.getMentor();
          if (dataCompany && dataCompany[0]) {
            if (dataCompany[0].start_date) {
              const startDate = this.parseStringDatePipe.transformStringToDate(
                this.parseUTCToLocalPipe.transformDate(dataCompany[0].start_date.date, dataCompany[0].start_date.time),
              );
              this.companyForm.get('start_date').patchValue(startDate);
            } else {
              this.companyForm.get('start_date').patchValue('');
            }
            if (dataCompany[0].end_date) {
              const endDate = this.parseStringDatePipe.transformStringToDate(
                this.parseUTCToLocalPipe.transformDate(dataCompany[0].end_date.date, dataCompany[0].end_date.time),
              );
              this.companyForm.get('end_date').patchValue(endDate);
            } else {
              this.companyForm.get('end_date').patchValue('');
            }

            if (dataCompany[0].company) {
              this.isMentorEnable = true;
              this.companyForm.get('company').patchValue(dataCompany[0].company.company_name);
            }
            if (dataCompany[0].type_of_formation) {
              this.companyForm.get('type_of_formation').patchValue(dataCompany[0].type_of_formation);
            }
            if (dataCompany[0].category_insertion) {
              this.companyForm.get('category_insertion').patchValue(dataCompany[0].category_insertion);
            }
            if (dataCompany[0].mentor) {
              this.isMentorEnable = true;
              this.companyForm
                .get('mentor')
                .setValue(
                  this.translate.instant(dataCompany[0].mentor.civility) +
                    ' ' +
                    dataCompany[0].mentor.first_name +
                    ' ' +
                    dataCompany[0].mentor.last_name,
                );
              this.mentorActive =
                this.translate.instant(dataCompany[0].mentor.civility) +
                ' ' +
                dataCompany[0].mentor.first_name +
                ' ' +
                dataCompany[0].mentor.last_name;
              this.mentorEmail = dataCompany[0].mentor.email;
              this.mentorEmailStatus = dataCompany[0].mentor.user_status;
            }
            if (dataCompany[0].status === 'active') {
              this.disableFormField();
            } else if (dataCompany[0].status === 'pending') {
              this.enableFormField();
            }
          }
        } else {
          this.contractStatus = [];
          this.active = false;
          this.status = this.active ? 'active' : 'inActive';
          this.companyForm.get('is_active').setValue('inactive');
          this.disabledForm = false;
          this.enableFormField();
          this.companyForm.reset();
          this.generateStatusContract(this.contractData);
          if (res.problematic_id) {
            this.getDataProblematic(res.problematic_id._id);
          }
          this.getDataAutoEval();
          this.getDataEvalPro();
        }
      } else {
        this.generateStatusContract(this.contractData);
        if (res.problematic_id) {
          this.getDataProblematic(res.problematic_id._id);
        }
        this.getDataAutoEval();
        this.getDataEvalPro();
      }
    }

    this.isLoadingDetail = false;
    this.companyTemp = this.companyForm.value;

    // Check if there is newly created company to patch
    this.patchNewlyCreatedCompany();
  }

  getHistoryContract() {
    this.subs.sink = this.studentService.getStudentsCompanyData(this.studentId).subscribe((response) => {
      const res = _.cloneDeep(response);
      this.generateHistoryTable(res);
    });
  }

  closeContractActive(data?) {
    this.isLoadingDetail = true;
    const temp = this.companyForm.value;
    // validation for main address
    const lang = this.translate.currentLang.toLowerCase();
    const companies = {
      company: this.companyId,
      mentor: this.mentorId,
      status: 'pending',
      start_date: {
        date: this.getConvertDate(this.companyForm.get('start_date').value, this.parseUTCToLocalPipe.transform('15:59')),
        time: this.getTodayTime(),
      },
      end_date: {
        date: this.getConvertDate(this.companyForm.get('end_date').value, this.parseUTCToLocalPipe.transform('15:59')),
        time: this.getEndTime(),
      },
    };
    let company = [];

    if (this.active) {
      const tempCompanies = _.cloneDeep(this.contractData.companies);
      const activeContract = tempCompanies.find((compData) => compData.status === 'active');
      const activeIndex = tempCompanies.findIndex((compData) => compData.status === 'active');

      if (activeContract && activeContract.start_date && activeContract.end_date) {
        activeContract.start_date = {
          date: this.getConvertDate(this.companyForm.get('start_date').value, this.parseUTCToLocalPipe.transform('15:59')),
          time: this.getTodayTime(),
        };
        activeContract.end_date = {
          date: this.getConvertDate(this.companyForm.get('end_date').value, this.parseUTCToLocalPipe.transform('15:59')),
          time: this.getEndTime(),
        };
        activeContract.contract_closed_date = {
          date: data?.resignationDate ? this.getConvertDate(data.resignationDate, this.parseUTCToLocalPipe.transform('15:59')) : "",
          time: this.getEndTime(),
        };
        activeContract.reason_deactivating_contract = data?.resignationReason ? data.resignationReason : "";

      }

      this.contractData.companies[activeIndex] = activeContract;
    }

    if (this.contractData.companies && this.contractData.companies.length) {
      company = this.contractData.companies.filter((resp) => {
        return resp.status !== 'pending' || resp.status !== 'active';
      });
      if (company && company.length) {
        company = company.map((com) => ({
          company: com && com.company ? com.company._id : '',
          mentor: com && com.mentor ? com.mentor._id : undefined,
          job_description_id: com && com.job_description_id ? com.job_description_id._id : null,
          problematic_id: com && com.problematic_id ? com.problematic_id._id : null,
          mentor_evaluation_id: com && com.mentor_evaluation_id ? com.mentor_evaluation_id._id : null,
          status: com.status,
          start_date: {
            date: com.start_date.date,
            time: com.start_date.time,
          },
          end_date: {
            date: com.end_date.date,
            time: com.end_date.time,
          },
          contract_closed_date: {
            date: com.contract_closed_date ? com.contract_closed_date.date : null,
            time: com.contract_closed_date ? com.contract_closed_date.time : null,
          },
          reason_deactivating_contract: com.reason_deactivating_contract ? com.reason_deactivating_contract : null
        }));
      }
    }
    if (!this.active) {
      company = company.concat(companies);
    }
    const comp = {
      companies: company,
    };
    this.schoolService.setDataStudentCompany(this.companyForm.value);
    console.log('COMPANY', company);
    this.subs.sink = this.schoolService.updateStudent(this.studentId, comp, lang).subscribe(
      (resp) => {
        this.subs.sink = this.studentService.closeContractStudent(this.studentId, this.companyId, this.mentorId).subscribe(
          (resp) => {
            if (resp) {
              this.active = false;
              this.status = this.active ? 'active' : 'inActive';
              this.companyForm.get('is_active').setValue('inactive');
              this.disabledForm = false;
              this.enableFormField();
              this.companyForm.reset();
              this.updateJobDesc.emit(true);
              this.getHistoryContract();
              this.isMentorEnable = false;
              Swal.fire({
                type: 'success',
                title: this.translate.instant('CONTRACT_S2B.TITLE'),
                confirmButtonText: this.translate.instant('CONTRACT_S2B.BUTTON'),
                footer: `<span style="margin-left: auto">CONTRACT_S2B</span>`,
              }).then((res) => {
                this.companyForm.reset();
                this.initData();
                this.studentService.refreshStudentSummaryCard(true);
                this.isMentorEnable = false;
                this.companyId = '';
                this.mentorId = '';
                this.isLoadingDetail = false;
              });
              // *************** After Incantive, refresh the data in the page
              // this.ngOnInit();
            }
          },
          (err) => {
            this.isMentorEnable = false;
            this.initData();
          },
        );
      },
      (err) => {
        this.isLoadingDetail = false;
        if (
          err['message'] === 'GraphQL error: Error: Email Registered As Student' ||
          err['message'] === 'GraphQL error: Error: Email Registered As User'
        ) {
          Swal.fire({
            type: 'error',
            title: this.translate.instant('ADDSTUDENT_ST.TITLE'),
            html: this.translate.instant('ADDSTUDENT_ST.TEXT'),
            footer: `<span style="margin-left: auto">ADDSTUDENT_ST</span>`,
            confirmButtonText: this.translate.instant('ADDSTUDENT_ST.BUTTON'),
          });
        } else {
          Swal.fire({
            type: 'error',
            title: 'Error',
            text: err && err['message'] ? err['message'] : err,
            confirmButtonText: 'OK',
          });
        }
      },
    );
  }

  generateHistoryTable(data) {
    this.contractHistory = [];
    this.contractHistory = data.companies.filter((comp) => {
      return comp.status === 'inactive';
    });
    if (this.contractHistory && this.contractHistory.length) {
      this.contractHistory.forEach((element, elementIndex) => {
        if (element.job_description_id) {
          this.contractHistory[elementIndex].job_description_id = {
            job_description_status: element.job_description_id.job_description_status,
            status: element.job_description_id.status,
            _id: element.job_description_id._id,
          };
        }
        if (element.mentor_evaluation_id) {
          this.contractHistory[elementIndex].mentor_evaluation_id = {
            mentor_evaluation_status: element.mentor_evaluation_id.mentor_evaluation_status,
            status: element.mentor_evaluation_id.status,
            _id: element.mentor_evaluation_id._id,
          };
        }
        if (element.problematic_id) {
          this.contractHistory[elementIndex].problematic_id = {
            problematic_status: element.problematic_id.problematic_status,
            status: element.problematic_id.status,
            _id: element.problematic_id._id,
          };
        }
      });
    }
    console.log('CONTRACT HISTORY', this.contractHistory)
  }

  generateStatusContract(contractData) {
    this.isLoadingDetail = true;
    this.contractStatus = [];
    const jobDescDate = this.classData && this.classData.job_desc_activation_date && this.classData.job_desc_activation_date.date;
    const jobDescTime = this.classData && this.classData.job_desc_activation_date && this.classData.job_desc_activation_date.time;
    const jobDescStartDate = this.parseStringDatePipe.transformStringToDate(
      this.parseUTCToLocalPipe.transformDate(jobDescDate, jobDescTime),
    );
    if (moment(this.today).isAfter(jobDescStartDate) && this.companyForm.get('is_active').value === 'active') {
      if (this.classData && this.classData.allow_job_description) {
        const data = {
          name: 'Job Description',
          status: '',
          lattest_status: '',
        };
        this.contractStatus.push(data);
      }
    }

    const problematicDate = this.classData && this.classData.problematic_activation_date && this.classData.problematic_activation_date.date;
    const problematicTime = this.classData && this.classData.problematic_activation_date && this.classData.problematic_activation_date.time;
    const problematicStartDate = this.parseStringDatePipe.transformStringToDate(
      this.parseUTCToLocalPipe.transformDate(problematicDate, problematicTime),
    );
    if (moment(this.today).isAfter(problematicStartDate)) {
      if (this.classData && this.classData.allow_problematic) {
        const data = {
          name: 'Problematic',
          status: '',
          lattest_status: '',
        };
        this.contractStatus.push(data);
      }
    }

    // if (this.classData && this.classData.type_evaluation === 'expertise' && this.classData.test_auto_pro_published) {
    //   const data = {
    //     name: 'Send Pro Evaluation to Mentor',
    //     status: '',
    //     lattest_status: 'Not Send to Mentor',
    //   };
    //   this.contractStatus.push(data);
    // }

    this.isLoadingDetail = false;

    // if (this.classData && this.classData.allow_mentor_evaluation) {
    //   const data = {
    //     name: 'Mentor Evaluation',
    //     status: '',
    //     lattest_status: '',
    //   };
    //   this.contractStatus.push(data);
    // }
    // if (this.classData && this.classData.allow_problematic) {
    //   const data = {
    //     name: 'Problematic',
    //     status: '',
    //     lattest_status: '',
    //   };
    //   this.contractStatus.push(data);
    // }
  }

  swalEvalProS1() {
    Swal.fire({
      title: this.translate.instant('SEND_EVALPRO_S1.TITLE'),
      html: this.translate.instant('SEND_EVALPRO_S1.TEXT'),
      type: 'warning',
      allowOutsideClick: false,
      confirmButtonText: this.translate.instant('SEND_EVALPRO_S1.BUTTON'),
      footer: `<span style="margin-left: auto">SEND_EVALPRO_S1</span>`,
    });
  }

  resend(name) {
    const jobDesc = this.contractStatus.find((element) => element.name === 'Job Description');
    if ((this.isUserAcadAdmin || this.isUserAcadir) && jobDesc && jobDesc.lattest_status !== 'validated_by_acad_staff') {
      this.swalEvalProS1();
      return;
    } else {
      if (name === 'Soft Skill Evaluation Professionnelle') {
        if (this.studentData && this.studentData.soft_skill_pro_evaluation && this.studentData.soft_skill_pro_evaluation.test_id) {
          const test_id = this.studentData.soft_skill_pro_evaluation.test_id._id;
          this.isLoadingDetail = true;
          this.subs.sink = this.schoolService.sendEvalProN1(this.studentData._id, test_id).subscribe((list) => {
            this.isLoadingDetail = false;
            Swal.fire({
              type: 'success',
              title: 'Bravo !',
              confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
            }).then((result) => {
              this.initData();
            });
          });
        }
      } else {
        if (this.studentData && this.studentData.academic_pro_evaluation && this.studentData.academic_pro_evaluation.test_id) {
          const test_id = this.studentData.academic_pro_evaluation.test_id._id;
          this.isLoadingDetail = true;
          this.subs.sink = this.schoolService.sendEvalProN1(this.studentData._id, test_id).subscribe((list) => {
            this.isLoadingDetail = false;
            Swal.fire({
              type: 'success',
              title: 'Bravo !',
              confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
            }).then((result) => {
              this.initData();
            });
          });
        }
      }
    }
  }
  remider(name) {
    if (name === 'Soft Skill Evaluation Professionnelle') {
      if (this.studentData && this.studentData.soft_skill_pro_evaluation && this.studentData.soft_skill_pro_evaluation.test_id) {
        const test_id = this.studentData.soft_skill_pro_evaluation.test_id._id;
        this.isLoadingDetail = true;
        this.subs.sink = this.schoolService.sendEvalProN3(this.studentData._id, test_id).subscribe((list) => {
          this.isLoadingDetail = false;
          Swal.fire({
            type: 'success',
            title: 'Bravo !',
            confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
          }).then((result) => {});
        });
      }
    } else {
      if (this.studentData && this.studentData.academic_pro_evaluation && this.studentData.academic_pro_evaluation.test_id) {
        const test_id = this.studentData.academic_pro_evaluation.test_id._id;
        this.isLoadingDetail = true;
        this.subs.sink = this.schoolService.sendEvalProN3(this.studentData._id, test_id).subscribe((list) => {
          this.isLoadingDetail = false;
          Swal.fire({
            type: 'success',
            title: 'Bravo !',
            confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
          }).then((result) => {});
        });
      }
    }
  }

  sendJobDesc() {
    let payload: any;
    payload = {
      school_id: this.schoolId,
      rncp_id: this.titleId,
      sender_id: this.currentUser._id,
      student_id: this.studentId,
      class_id: this.classId,
      status: 'active',
      mentor: this.mentorId,
      company: this.companyId,
      job_description_status: 'sent_to_student',
      date_send: {
        date: this.getTodayDate(),
        time: this.getTodayTime(),
      },
    };
    if (this.classData && this.classData.questionnaire_template_id) {
      payload.questionnaire_template_id = this.classData.questionnaire_template_id._id;
    } else {
      payload.is_use_default_template = true;
    }
    Swal.fire({
      title: this.translate.instant('JOBDESC_S1.TITLE'),
      text: this.translate.instant('JOBDESC_S1.TEXT'),
      type: 'warning',
      allowEscapeKey: true,
      showCancelButton: true,
      confirmButtonText: this.translate.instant('JOBDESC_S1.BUTTON_1'),
      cancelButtonText: this.translate.instant('JOBDESC_S1.BUTTON_2'),
      footer: `<span style="margin-left: auto">JOBDESC_S1</span>`,
      allowOutsideClick: false,
      allowEnterKey: false,
    }).then((res) => {
      if (res.value) {
        this.isLoadingDetail = true;
        this.subs.sink = this.studentService.sendJobDesc(payload).subscribe(
          (resp) => {
            this.updateJobDesc.emit(true);
            Swal.fire({
              type: 'success',
              title: this.translate.instant('JOBDESC_S1B.TITLE'),
              text: this.translate.instant('JOBDESC_S1B.TEXT'),
              confirmButtonText: this.translate.instant('JOBDESC_S1B.BUTTON'),
              footer: `<span style="margin-left: auto">JOBDESC_S1B</span>`,
            });
            this.getDataJobDesc(resp._id);
            this.isLoadingDetail = false;
          },
          (err) => {
            this.isLoadingDetail = false;
            if (err['message'] === "GraphQL error: Error: Can't send the job description before finish admission") {
              Swal.fire({
                allowOutsideClick: false,
                type: 'info',
                title: this.translate.instant("Can't send the job description before finish admission"),
                confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
              });
            } else {
              Swal.fire({
                type: 'error',
                title: 'Error',
                text: err && err['message'] ? err['message'] : err,
                confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
              });
            }
          },
        );
      }
    });
  }

  sendProblematic() {
    let payload: any;
    payload = {
      school_id: this.schoolId,
      rncp_id: this.titleId,
      student_id: this.studentId,
      class_id: this.classId,
      status: 'active',
      problematic_status: 'sent_to_student',
      date: {
        date_utc: this.getTodayDate(),
        time_utc: this.getTodayTime(),
      },
    };
    if (this.classData && this.classData.problematic_questionnaire_template_id) {
      payload.questionnaire_template_id = this.classData.problematic_questionnaire_template_id._id;
    }

    const fullName =
      this.translate.instant(this.studentData.civility) + ' ' + this.studentData.last_name + ' ' + this.studentData.first_name;
    Swal.fire({
      title: this.translate.instant('PROB_S1.TITLE'),
      html: this.translate.instant('PROB_S1.TEXT', { studentFullName: fullName }),
      type: 'question',
      allowEscapeKey: true,
      showCancelButton: true,
      confirmButtonText: this.translate.instant('PROB_S1.BUTTON1'),
      cancelButtonText: this.translate.instant('PROB_S1.BUTTON2'),
      footer: `<span style="margin-left: auto">PROB_S1</span>`,
      allowOutsideClick: false,
      allowEnterKey: false,
    }).then((res) => {
      if (res.value) {
        this.isLoadingDetail = true;
        this.subs.sink = this.problematicService.sendOneProblematic(payload, this.translate.currentLang).subscribe(
          (resp) => {
            this.isLoadingDetail = false;
            if (resp && resp.length && resp[0]) {
              this.updateJobDesc.emit(true);
              Swal.fire({
                type: 'success',
                title: this.translate.instant('PROB_S11.TITLE'),
                html: this.translate.instant('PROB_S11.TEXT', { studentFullName: fullName }),
                confirmButtonText: this.translate.instant('PROB_S11.BUTTON'),
                footer: `<span style="margin-left: auto">PROB_S11</span>`,
                allowEnterKey: false,
                allowEscapeKey: false,
                allowOutsideClick: false,
              });
              this.getDataProblematic(resp[0]._id);
            }
          },
          (err) => {
            this.isLoadingDetail = false;
            Swal.fire({
              type: 'error',
              title: 'Error',
              text: err && err['message'] ? err['message'] : err,
              confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
            });
          },
        );
      }
    });
  }

  getConvertDate(date, time) {
    const today = moment(date).format('DD/MM/YYYY');
    return this.parseLocalToUTCPipe.transformDate(today, time);
  }

  getTodayTime() {
    return this.parseLocalToUTCPipe.transform(this.parseUTCToLocalPipe.transform('15:59'));
  }

  getEndTime() {
    return this.parseLocalToUTCPipe.transform(this.parseUTCToLocalPipe.transform('15:59'));
  }

  getTodayDate() {
    const today = moment(this.today).format('DD/MM/YYYY');
    return this.parseLocalToUTCPipe.transformDate(today, this.parseUTCToLocalPipe.transform('15:59'));
  }

  getDataClass() {
    this.subs.sink = this.rncpTitleService.getClassByIdOnCompany(this.classId).subscribe((resp) => {
      this.classData = _.cloneDeep(resp);
    });
  }

  getDataStudent() {
    this.subs.sink = this.studentService.getStudentsIdentityData(this.studentId).subscribe((response) => {
      this.studentData = _.cloneDeep(response);
    });
  }

  getDataJobDesc(jobId) {
    this.subs.sink = this.jobDescService.getOneJobDesStatus(jobId).subscribe((resp) => {
      if (resp) {
        let dateSend;
        if (resp.date_send && resp.date_send.date) {
          dateSend = this.parseStringDatePipe.transformStringToDate(
            this.parseUTCToLocalPipe.transformDate(resp.date_send.date, resp.date_send.time),
          );
        }
        const contractData = [];
        if (this.contractStatus && this.contractStatus.length) {
          this.contractStatus.forEach((element) => {
            if (element.name !== 'Job Description') {
              contractData.push(element);
            }
          });
          this.contractStatus = [];
          const data = {
            name: 'Job Description',
            status: resp.date_send ? moment(dateSend).format('DD/MM/YYYY') : '',
            lattest_status: resp.job_description_status,
          };
          this.contractStatus = contractData.concat(data);
        }
      }
    });
  }

  getDataProblematic(problematicId) {
    this.isLoadingDetail = true;
    this.subs.sink = this.problematicService.getOneProblematicImported(problematicId).subscribe(
      (resp) => {
        this.isLoadingDetail = false;
        if (resp) {
          let dateProblematic;
          if (resp.date && resp.date.date_utc) {
            dateProblematic = this.parseStringDatePipe.transformStringToDate(
              this.parseUTCToLocalPipe.transformDate(resp.date.date_utc, resp.date.time_utc),
            );
          }
          const contractData = [];
          if (this.contractStatus && this.contractStatus.length) {
            this.contractStatus.forEach((element) => {
              if (element.name !== 'Problematic') {
                contractData.push(element);
              }
            });
            this.contractStatus = [];
            const data = {
              name: 'Problematic',
              status: resp.date ? moment(dateProblematic).format('DD/MM/YYYY') : '',
              lattest_status: resp.problematic_status,
            };
            this.contractStatus = contractData.concat(data);
          }
        }
      },
      (err) => {
        this.isLoadingDetail = false;
        Swal.fire({
          type: 'error',
          title: 'Error',
          text: err && err['message'] ? err['message'] : err,
          confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
        });
      },
    );
  }

  getDataAutoEval() {
    if (this.studentData) {
      if (
        this.studentData.academic_auto_evaluation &&
        this.studentData.academic_auto_evaluation.test_id &&
        this.studentData.academic_auto_evaluation.test_id.is_published
      ) {
        const dateUTC =
          this.studentData.academic_auto_evaluation &&
          this.studentData.academic_auto_evaluation.test_id &&
          this.studentData.academic_auto_evaluation.test_id.published_date
            ? this.studentData.academic_auto_evaluation.test_id.published_date
            : '';
        const dateLocal = dateUTC ? this.parseUTCToLocalPipe.transformDate(dateUTC, '00:00') : '-';
        const lattest_status =
          this.studentData.academic_auto_evaluation && this.studentData.academic_auto_evaluation.status
            ? this.studentData.academic_auto_evaluation.status
            : '';
        const name =
          this.studentData.academic_auto_evaluation &&
          this.studentData.academic_auto_evaluation.test_id &&
          this.studentData.academic_auto_evaluation.test_id.name
            ? this.studentData.academic_auto_evaluation.test_id.name
            : '';

        const id =
          this.studentData.academic_auto_evaluation &&
          this.studentData.academic_auto_evaluation.test_id &&
          this.studentData.academic_auto_evaluation.test_id._id
            ? this.studentData.academic_auto_evaluation.test_id._id
            : '';

        const taskId =
          this.studentData.academic_auto_evaluation &&
          this.studentData.academic_auto_evaluation.task_id &&
          this.studentData.academic_auto_evaluation.task_id._id
            ? this.studentData.academic_auto_evaluation.task_id._id
            : '';

        this.contractStatus.push({
          type: 'auto-eval',
          name,
          status: dateLocal,
          lattest_status,
          testId: id,
          taskId,
        });
      }

      if (
        this.studentData.soft_skill_auto_evaluation &&
        this.studentData.soft_skill_auto_evaluation.test_id &&
        this.studentData.soft_skill_auto_evaluation.test_id.is_published
      ) {
        const dateUTC =
          this.studentData.soft_skill_auto_evaluation &&
          this.studentData.soft_skill_auto_evaluation.test_id &&
          this.studentData.soft_skill_auto_evaluation.test_id.published_date
            ? this.studentData.soft_skill_auto_evaluation.test_id.published_date
            : '';
        const dateLocal = dateUTC ? this.parseUTCToLocalPipe.transformDate(dateUTC, '00:00') : '-';
        const lattest_status =
          this.studentData.soft_skill_auto_evaluation && this.studentData.soft_skill_auto_evaluation.status
            ? this.studentData.soft_skill_auto_evaluation.status
            : '';
        const name =
          this.studentData.soft_skill_auto_evaluation &&
          this.studentData.soft_skill_auto_evaluation.test_id &&
          this.studentData.soft_skill_auto_evaluation.test_id.name
            ? this.studentData.soft_skill_auto_evaluation.test_id.name
            : '';

        const id =
          this.studentData.soft_skill_auto_evaluation &&
          this.studentData.soft_skill_auto_evaluation.test_id &&
          this.studentData.soft_skill_auto_evaluation.test_id._id
            ? this.studentData.soft_skill_auto_evaluation.test_id._id
            : '';

        const taskId =
          this.studentData.soft_skill_auto_evaluation &&
          this.studentData.soft_skill_auto_evaluation.task_id &&
          this.studentData.soft_skill_auto_evaluation.task_id._id
            ? this.studentData.soft_skill_auto_evaluation.task_id._id
            : '';
        this.contractStatus.push({
          type: 'auto-eval',
          name,
          status: dateLocal,
          lattest_status,
          testId: id,
          taskId,
        });
      }
    }
  }

  getDataEvalPro() {
    let acadProDate;
    let acadProTime;
    let acadProLastAccess;

    if (this.studentData.send_date_acad_pro && this.studentData.send_date_acad_pro.date_utc) {
      acadProDate = this.studentData && this.studentData.send_date_acad_pro && this.studentData.send_date_acad_pro.date_utc;
    } else {
      acadProDate =
        this.studentData &&
        this.studentData.academic_pro_evaluation &&
        this.studentData.academic_pro_evaluation.test_id &&
        this.studentData.academic_pro_evaluation.test_id.send_date_to_mentor &&
        this.studentData.academic_pro_evaluation.test_id.send_date_to_mentor.date_utc;
    }

    if (this.studentData.send_date_acad_pro && this.studentData.send_date_acad_pro.time_utc) {
      acadProTime = this.studentData && this.studentData.send_date_acad_pro && this.studentData.send_date_acad_pro.time_utc;
    } else {
      acadProTime =
        this.studentData &&
        this.studentData.academic_pro_evaluation &&
        this.studentData.academic_pro_evaluation.test_id &&
        this.studentData.academic_pro_evaluation.test_id.send_date_to_mentor &&
        this.studentData.academic_pro_evaluation.test_id.send_date_to_mentor.time_utc;
    }

    const acadProTestId =
      this.studentData &&
      this.studentData.academic_pro_evaluation &&
      this.studentData.academic_pro_evaluation.test_id &&
      this.studentData.academic_pro_evaluation.test_id._id
        ? this.studentData.academic_pro_evaluation.test_id._id
        : '';
    const acadProStatus =
      this.studentData && this.studentData.academic_pro_evaluation && this.studentData.academic_pro_evaluation.status
        ? this.studentData.academic_pro_evaluation.status
        : '';
    const acadProStartDate = this.parseStringDatePipe.transformStringToDate(
      this.parseUTCToLocalPipe.transformDate(acadProDate, acadProTime),
    );

    if (
      acadProStatus === 'opened' &&
      this.studentData &&
      this.studentData.academic_pro_evaluation &&
      this.studentData.academic_pro_evaluation.last_access &&
      this.studentData.academic_pro_evaluation.last_access.date_utc &&
      this.studentData.academic_pro_evaluation.last_access.time_utc
    ) {
      acadProLastAccess = this.parseUTCToLocalPipe.transformDate(
        this.studentData.academic_pro_evaluation.last_access.date_utc,
        this.studentData.academic_pro_evaluation.last_access.time_utc,
      );
    } else if (acadProStatus === 'sent' || acadProStatus === 'resend') {
      acadProLastAccess = this.parseUTCToLocalPipe.transformDate(acadProDate, acadProTime);
    }

    if (acadProStatus) {
      const dataAcad = {
        testId: acadProTestId,
        name: 'Evaluation professionnelle pédagogique',
        status: moment(acadProStartDate).format('DD/MM/YYYY'),
        lattest_status: acadProStatus,
        last_access: acadProLastAccess,
      };
      this.contractStatus.push(dataAcad);
    }

    let softProDate;
    let softProTime;
    let softProLastAccess;

    if (this.studentData.send_date_soft_skill && this.studentData.send_date_soft_skill.date_utc) {
      softProDate = this.studentData && this.studentData.send_date_soft_skill && this.studentData.send_date_soft_skill.date_utc;
    } else {
      softProDate =
        this.studentData &&
        this.studentData.soft_skill_pro_evaluation &&
        this.studentData.soft_skill_pro_evaluation.test_id &&
        this.studentData.soft_skill_pro_evaluation.test_id.send_date_to_mentor &&
        this.studentData.soft_skill_pro_evaluation.test_id.send_date_to_mentor.date_utc;
    }

    if (this.studentData.send_date_soft_skill && this.studentData.send_date_soft_skill.time_utc) {
      softProTime = this.studentData && this.studentData.send_date_soft_skill && this.studentData.send_date_soft_skill.time_utc;
    } else {
      softProTime =
        this.studentData &&
        this.studentData.soft_skill_pro_evaluation &&
        this.studentData.soft_skill_pro_evaluation.test_id &&
        this.studentData.soft_skill_pro_evaluation.test_id.send_date_to_mentor &&
        this.studentData.soft_skill_pro_evaluation.test_id.send_date_to_mentor.time_utc;
    }

    const softProTestId =
      this.studentData &&
      this.studentData.soft_skill_pro_evaluation &&
      this.studentData.soft_skill_pro_evaluation.test_id &&
      this.studentData.soft_skill_pro_evaluation.test_id._id
        ? this.studentData.soft_skill_pro_evaluation.test_id._id
        : '';
    const softProStatus =
      this.studentData && this.studentData.soft_skill_pro_evaluation && this.studentData.soft_skill_pro_evaluation.status
        ? this.studentData.soft_skill_pro_evaluation.status
        : '';
    const softProStartDate = this.parseStringDatePipe.transformStringToDate(
      this.parseUTCToLocalPipe.transformDate(softProDate, softProTime),
    );

    if (
      softProStatus === 'opened' &&
      this.studentData &&
      this.studentData.soft_skill_pro_evaluation &&
      this.studentData.soft_skill_pro_evaluation.last_access &&
      this.studentData.soft_skill_pro_evaluation.last_access.date_utc &&
      this.studentData.soft_skill_pro_evaluation.last_access.time_utc
    ) {
      softProLastAccess = this.parseUTCToLocalPipe.transformDate(
        this.studentData.soft_skill_pro_evaluation.last_access.date_utc,
        this.studentData.soft_skill_pro_evaluation.last_access.time_utc,
      );
    } else if (softProStatus === 'sent' || softProStatus === 'resend') {
      softProLastAccess = this.parseUTCToLocalPipe.transformDate(softProDate, softProTime);
    }

    if (softProStatus) {
      const dataSoft = {
        testId: softProTestId,
        name: 'Soft Skill Evaluation Professionnelle',
        status: moment(softProStartDate).format('DD/MM/YYYY'),
        lattest_status: softProStatus,
        last_access: softProLastAccess,
      };
      this.contractStatus.push(dataSoft);
    }
  }

  // *************** Function to connecting Mentor to company and School
  connectingMentorToCompany(data, showSwal = true) {
    this.subs.sink = this.companyService
      .connectSchoolToMentor(this.currentUserTypeId, data._id, this.companyId, this.schoolId, data?.status === 'deleted')
      .subscribe(
        (resp) => {
          if (resp) {
            if (showSwal) {
              Swal.fire({
                type: 'success',
                title: 'Bravo !',
                confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
              }).then((result) => {
                this.getMentor();
              });
            } else {
              this.getMentor();
            }
          }
        },
        (err) => {
          Swal.fire({
            type: 'error',
            title: 'Error !',
            text: err && err['message'] ? err['message'] : err,
            confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
          }).then((res) => {});
        },
      );
  }

  moveToProblematic() {
    // this.moveTab.emit(true);

    this.continue.emit('Problematic');
  }

  moveToJobDesc() {
    // this.moveTab.emit(true);

    this.continue.emit('JobDescription');
  }

  sendReminderToStudent() {
    if (this.jobDescId) {
      this.jobDescService.sendReminderToCompleteJobDescription(this.jobDescId, this.translate.currentLang).subscribe((resp) => {
        Swal.fire({
          type: 'success',
          title: this.translate.instant('SUCCESS'),
        });
      });
    }
  }

  patchNewlyCreatedCompany() {
    // *************** Used only if reroute back from company creation and need to populate the form
    let validation = false;

    if (this.route.snapshot && this.route.parent.snapshot) {
      const titleId = this.route.parent.snapshot.queryParamMap.get('title');
      const classId = this.route.parent.snapshot.queryParamMap.get('class');
      const studentId = this.route.parent.snapshot.queryParamMap.get('student');
      if (this.titleId === titleId && this.classId === classId && this.studentId === studentId) {
        validation = true;
      }
    }

    if (validation && this.route.snapshot && this.route.parent.snapshot && this.route.parent.snapshot.queryParamMap.get('newCompanyId')) {
      this.newlyCreatedCompanyId = this.route.parent.snapshot.queryParamMap.get('newCompanyId');
      this.subs.sink = this.schoolService.getOneDetailCompany(this.newlyCreatedCompanyId).subscribe(
        (response) => {
          if (response) {
            this.newlyCreatedCompanyData = response;
            this.companyForm.get('company').patchValue(response.company_name);
            this.changeCompany(this.newlyCreatedCompanyData);
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
    }
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
    this.studentService.resetStudentCardTrigger(true);
  }

  checkFinalTranscripsIsStarted() {
    if (this.titleId && this.classId) {
      this.subs.sink = this.studentService.IsFinalTranscriptStarted(this.titleId, this.classId).subscribe((resp) => {
        this.IsFinalTranscriptStarted = resp;
      });
    }
  }

  openJobDesc(jobdescId) {
    window.open(`./academic/jobdescription/${this.schoolId}/${this.titleId}/${this.classId}/${this.studentId}/${jobdescId}`, '_blank');
  }

  openProblematic(problematicId) {
    window.open(`./academic/problematic/${this.schoolId}/${this.titleId}/${this.classId}/${this.studentId}/${problematicId}`, '_blank');
  }

  openEvalPro(testId) {
    if (this.studentId && testId && this.schoolId && this.currentUser && this.currentUser._id) {
      const urlTree = this.router.createUrlTree(['/correction-eval-pro-step'], {
        queryParams: {
          studentId: this.studentId,
          testId,
          schoolId: this.schoolId,
          userId: this.mentorId,
        },
      });
      // const url = environment.apiUrl.replace('api.', 'zetta-form.').replace('/graphql', urlTree.toString());
      const url = `${environment.formEnvironment}${urlTree.toString()}`;
      window.open(url, '_blank');
    }
  }
  openAutoEval(testId, taskId) {
    if (testId && taskId && this.titleId && this.schoolId) {
      window.open(`/test-correction/${this.titleId}/${testId}?task=${taskId}&school=${this.schoolId}`, '_blank');
      // this.router.navigate(['/test-correction', this.titleId, testId], { queryParams: { task: taskId, school: this.schoolId } });
    }
  }

  filterFormation() {
    this.typeInformation = this.fieldOneOption;
    if (this.companyForm.get('type_of_formation').value) {
      const searchString = this.companyForm.get('type_of_formation').value.toLowerCase().trim();
      this.typeInformation = this.fieldOneOption.filter((formation) => formation.value.toLowerCase().trim().includes(searchString));
    } else {
      this.companyForm.get('category_insertion').setValue('');
      this.typeInformation = this.fieldOneOption;
    }
  }

  checkTypeFormation() {
    const type = this.companyForm.get('type_of_formation').value;
    switch (type) {
      case 'FORMATION_INITIALE_HORS_APPRENTISSAGE':
        this.companyForm.get('category_insertion').setValue(this.fieldTwoOption[0].key);
        break;
      case 'FORMATION_INITIALE_APPRENTISSAGE':
        this.companyForm.get('category_insertion').setValue(this.fieldTwoOption[1].key);
        break;
      case 'FORMATION_CONTINUE_HORS_CONTRAT_DE_PROFESSIONNALISATION':
        this.companyForm.get('category_insertion').setValue(this.fieldTwoOption[3].key);
        break;
      case 'FORMATION_CONTINUE_CONTRAT_DE_PROFESSIONNALISATION':
        this.companyForm.get('category_insertion').setValue(this.fieldTwoOption[2].key);
        break;
      case 'VAE':
        this.companyForm.get('category_insertion').setValue(this.fieldTwoOption[3].key);
        break;
      default:
        this.companyForm.get('category_insertion').setValue('');
    }
  }

  displayFormation(value) {
    let display;
    if (value) {
      this.fieldOneOption.map((data) => {
        if (data.key === value) {
          display = data.value;
        }
      });
    }
    return display;
  }

  displayInsertion(value) {
    let display;
    if (value) {
      this.fieldTwoOption.map((data) => {
        if (data.key === value) {
          display = data.value;
        }
      });
    }
    return display;
  }
}
