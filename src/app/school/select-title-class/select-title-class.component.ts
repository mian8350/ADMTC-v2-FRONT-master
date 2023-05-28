import { Component, OnInit, Input, OnDestroy, Output, EventEmitter } from '@angular/core';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import { SchoolService } from 'app/service/schools/school.service';
import { UntypedFormControl } from '@angular/forms';
import { SubSink } from 'subsink';
import { Observable } from 'apollo-link';
import { UtilityService } from 'app/service/utility/utility.service';
import { NgxPermissionsService } from 'ngx-permissions';
import { TranslateService } from '@ngx-translate/core';
import Swal from 'sweetalert2';
import { PermissionService } from 'app/service/permission/permission.service';
import * as _ from 'lodash';
import { AuthService } from 'app/service/auth-service/auth.service';
import { CoreService } from 'app/service/core/core.service';
import { TutorialService } from 'app/service/tutorial/tutorial.service';
import { environment } from 'environments/environment';
import { O } from '@angular/cdk/keycodes';
import { MatDialog } from '@angular/material/dialog';
import { ImportStudentCompaniesDialogComponent } from 'app/shared/components/import-student-companies-dialog/import-student-companies-dialog.component';
import * as moment from 'moment';
import { debounceTime } from 'rxjs/operators';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'ms-select-title-class',
  templateUrl: './select-title-class.component.html',
  styleUrls: ['./select-title-class.component.scss'],
})
export class SelectTitleClassComponent implements OnInit, OnDestroy {
  private subs = new SubSink();
  @Input() schoolId: string;
  @Input() selectedRncpTitleId: string | null = null;
  @Input() selectedClassId: string | null = null;
  @Input() searchStudent: string;
  @Input() isStudentCardTab = false;
  @Input() isStudentTable = false;
  @Input() selectedStatusId: string | null = null;
  @Output() isRefresh = new EventEmitter<Boolean>();
  filteredStudentCardData: Observable<any[]>;

  studentFilter = new UntypedFormControl('');
  registerStudent = false;
  isUserCertifier = false;
  isUserCertifierDir = false;
  isUserCorrectorOfProblematic = false;
  isWaitingForResponse = false;
  currentUser;
  isUserAdmtc = false;

  rncpTitles = [];
  classes = [];

  statusList = [
    {
      key: 'Active',
      value: 'active',
    },
    {
      key: 'suspended',
      value: 'suspended',
    },
    {
      key: 'deactivated',
      value: 'deactivated',
    },
  ];

  isTutorialAdded = false;
  dataTutorial: any;
  tutorialData: any;
  isPermission: any;
  showFilterStudentStatus: boolean = false;

  constructor(
    private rncpTitleService: RNCPTitlesService,
    private schoolService: SchoolService,
    private utilityService: UtilityService,
    private permissions: NgxPermissionsService,
    private translate: TranslateService,
    public permissionService: PermissionService,
    private utilService: UtilityService,
    private authService: AuthService,
    public coreService: CoreService,
    public tutorialService: TutorialService,
    public dialog: MatDialog,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    this.isPermission = this.authService.getPermission();
    this.isUserCertifier = !!this.permissions.getPermission('Certifier Admin');
    this.isUserCertifierDir = !!this.permissions.getPermission('CR School Director');
    this.isUserCorrectorOfProblematic = !!this.permissions.getPermission('Corrector of Problematic');
    this.currentUser = this.authService.getLocalStorageUser();
    this.isUserAdmtc = this.utilService.isUserEntityADMTC();

    this.schoolService.setIsSelectedStatusId(false);

    const statusStudent = this.route?.snapshot?.queryParams?.studentStatus
    if(statusStudent) {
      this.schoolService.setSelectedStatusId(statusStudent)
    } else {
      this.schoolService.setSelectedStatusId('active')
    }

    this.getRncpTitles();
    if (this.selectedRncpTitleId) {
      this.getClasses();
    }
    this.studentFilterTrigger();

    if (this.isStudentCardTab) {
      this.getInAppTutorial('Student Cards');
    }

    // Check index active for hide student status
    this.schoolService.indexActiveTab$.subscribe((res) => {
      this.showFilterStudentStatus = res && res === 2 ? true : false;
    });
  }

  autoSetFirstTitle() {
    if (!this.rncpTitles?.length) return;
    this.selectedRncpTitleId = this.rncpTitles[0]?._id;
    this.onSelectedTitleChanged();
    this.getClasses();
  }

  getRncpTitles() {
    if (this.isUserCorrectorOfProblematic) {

      const correctorProblematicId = '5a2e1ecd53b95d22c82f9551';
      this.subs.sink = this.rncpTitleService
        .getRncpTitlesDropdownForCorrectorProblematic(this.schoolId, correctorProblematicId)
        .subscribe((resp) => {
          this.rncpTitles = _.cloneDeep(resp);
          if (this.selectedRncpTitleId === null) {
            this.autoSetFirstTitle();
          }
        });
    } else {
      this.subs.sink = this.rncpTitleService.getRncpTitlesBySchoolId(this.schoolId).subscribe((resp) => {
        let temp = _.cloneDeep(resp);
        this.rncpTitles = temp;
        if (this.selectedRncpTitleId === null) {
          this.autoSetFirstTitle();
        }

        // *************** IF user is Acad Admin/Dir or CR Admin/Dir, then will only get title of their assigned title
        if (this.utilService.isUserAcadDirAdmin() || this.utilService.isUserCRDirAdmin()) {
          const userType = this.currentUser.entities ? this.currentUser.entities[0].type.name : '';
          const school =
            this.currentUser.entities && this.currentUser.entities[0].school ? this.currentUser.entities[0].school.short_name : '';
          this.subs.sink = this.authService.getUserById(this.currentUser._id).subscribe((respp) => {
            const academicUser = respp.entities.filter((ent) => ent.type.name === userType && ent.school.short_name === school);

            const titles = this.utilService.getAcademicAllAssignedTitle(academicUser);
            // temp = temp.filter((title) => titles.includes(title._id));
            // this.rncpTitles = temp;
            this.subs.sink = this.rncpTitleService.getRncpTitlesForAcademic(titles).subscribe((response) => {
              let tempp = _.cloneDeep(response);
              tempp = tempp.filter((title) => titles.includes(title._id));
              this.rncpTitles = tempp;
              if (this.selectedRncpTitleId === null) {
                this.autoSetFirstTitle();
              }

            });
          });
        }
      });
    }
  }

  getClasses() {
    if (this.isUserCorrectorOfProblematic) {
      const correctorProblematicId = '5a2e1ecd53b95d22c82f9551';
      this.subs.sink = this.rncpTitleService
        .getClassDropdownForCorrectorProblematic(this.selectedRncpTitleId, correctorProblematicId)
        .subscribe((resp) => {
          const temp = _.cloneDeep(resp);
          this.classes = temp.filter((classs) => {
            return classs.status === 'active';
          });

          // *************** If only one class or there is no setted initial class, then auto select them
          if ((this.classes && this.classes.length === 1) || this.selectedClassId === null || this.selectedClassId === '') {
            this.selectedClassId = this.classes[0]?._id;
            this.onSelectedClassChanged();
          }
        });
    } else {
      this.subs.sink = this.rncpTitleService.getClassesByTitleAndPC(this.selectedRncpTitleId, this.schoolId).subscribe((resp) => {
        let temp = _.cloneDeep(resp);

        // *************** IF user is acad dir or admin, then will only get class of their assigned class
        if (this.utilService.isUserAcadDirAdmin()) {
          const userType = this.currentUser.entities ? this.currentUser.entities[0].type.name : '';
          this.subs.sink = this.authService.getUserById(this.currentUser._id).subscribe((respp) => {
            const academicUser = respp.entities.filter((ent) => ent.type.name === userType);
            const classes = this.utilService.getAcademicAllAssignedClass(academicUser);
            temp = temp.filter((classData) => classes.includes(classData._id));
            this.classes = temp.filter((classs) => {
              return classs.status === 'active';
            });
            this.changeSelectedClass();
          });
        } else {
          this.classes = temp.filter((classs) => {
            return classs.status === 'active';
          });
          this.changeSelectedClass();
        }
       
      });
    }
  }

  changeSelectedClass() {
    // *************** If only one class or there is no setted initial class, then auto select them
    if ((this.classes && this.classes.length === 1) || this.selectedClassId === null || this.selectedClassId === '') {
      this.selectedClassId = this.classes[0]?._id;
      this.onSelectedClassChanged();
    }
  }

  routeParameter() {
    const queryParams = this.route.snapshot.queryParams;
    const paramStudentStatus = queryParams?.studentStatus ? queryParams?.studentStatus : 'active';
    this.schoolService.setQueryParamsStatus(paramStudentStatus);
    this.selectedStatusId = paramStudentStatus;
    this.schoolService.setSelectedStatusId(this.selectedStatusId);
  }

  getInAppTutorial(type) {
    // const permission = this.isPermission && this.isPermission.length && this.isPermission[0] ? this.isPermission[0] : [];
    const userType = this.currentUser.entities[0].type.name;
    this.subs.sink = this.tutorialService.GetAllInAppTutorialsByModule(type, userType).subscribe((list) => {
      if (list && list.length) {
        this.dataTutorial = list;
        const tutorialData = this.dataTutorial.filter((tutorial) => {
          return tutorial.is_published === true && tutorial.module === type;
        });
        this.tutorialData = tutorialData[0];
        if (this.tutorialData) {
          this.isTutorialAdded = true;
        } else {
          this.isTutorialAdded = false;
        }
      }
    });
  }

  toggleTutorial(data) {
    this.tutorialService.setTutorialView(data);
    if (this.coreService.sidenavOpen) {
      this.coreService.sidenavOpen = !this.coreService.sidenavOpen;
    }
    this.coreService.sidenavTutorialOpen = !this.coreService.sidenavTutorialOpen;
  }

  onSelectedTitleChanged() {
    if (this.selectedRncpTitleId !== '0') {
      this.schoolService.setSelectedRncpTitleId(this.selectedRncpTitleId);
      this.schoolService.setSelectedClassId('');
      this.schoolService.setCurrentStudentTitleId(this.selectedRncpTitleId);
      this.schoolService.setCurrentStudentClassId('');
      this.schoolService.setSelectedStatusId('');
      this.getClasses();
    } else {
      this.selectedRncpTitleId = null;
      this.schoolService.setSelectedRncpTitleId('');
      this.schoolService.setSelectedClassId('');
      this.schoolService.setCurrentStudentTitleId('');
      this.schoolService.setCurrentStudentClassId('');
      this.schoolService.setSelectedStatusId('');
    }
  }

  onSelectedClassChanged() {
    // *************** If the value is not 0(none) and the current selectedClassId(dropdown selected) is different than the one in service. we need to replace the class data in service
    if (this.selectedClassId !== '0') {
      this.schoolService.setSelectedRncpTitleId(this.selectedRncpTitleId);
      this.schoolService.setCurrentStudentTitleId(this.selectedRncpTitleId);
      this.schoolService.setSelectedClassId(this.selectedClassId);
      this.schoolService.setCurrentStudentClassId(this.selectedClassId);
      this.schoolService.setSelectedStatusId('');
      this.schoolService.setIsSelectedStatusId(true);
      this.routeParameter();
    } else {
      this.selectedClassId = null;
      this.schoolService.setSelectedClassId('');
      this.schoolService.setCurrentStudentClassId('');
      this.schoolService.setSelectedStatusId('');
    }
  }

  onSelectedStatusChanged() {
    console.log('_test', this.selectedStatusId);

    if (this.selectedStatusId !== '0') {
      this.schoolService.setSelectedRncpTitleId(this.selectedRncpTitleId);
      this.schoolService.setCurrentStudentTitleId(this.selectedRncpTitleId);
      this.schoolService.setSelectedClassId(this.selectedClassId);
      this.schoolService.setCurrentStudentClassId(this.selectedClassId);
      this.schoolService.setSelectedStatusId(this.selectedStatusId);
      this.schoolService.setIsSelectedStatusId(true);
    } else {
      this.selectedStatusId = null;
      this.schoolService.setSelectedStatusId('');
    }
  }

  studentFilterTrigger() {
    this.subs.sink = this.studentFilter.valueChanges.pipe(debounceTime(400)).subscribe((value) => { 
      if (value && value.length) {
        this.schoolService.setcurrentSearchStudent(value);
      }
    });
  }

  createStudent() {
    // check if user ADMTC Admin or Director else display swal
    if (this.isUserAdmtc) {
      // reset all the service before creating new student
      this.schoolService.setDataStudent(null);
      this.schoolService.setCurrentStudentId(null);
      this.schoolService.setDataStudentIdentity(null);
      this.schoolService.setDataStudentCompany(null);
      this.schoolService.setDataStudentParents(null);
      this.schoolService.setAddStudent(true);
    } else {
      if (this.selectedClassId && this.selectedRncpTitleId) {
        this.checkRegisPeriod('create');
      } else {
        this.swalAddStudentS03();
      }
    }
  }

  resetFilter() {
    this.studentFilter.setValue('');
    this.schoolService.setcurrentSearchStudent(null);
  }

  importStudent() {
    if (!this.selectedClassId) {
      Swal.fire({
        allowOutsideClick: false,
        type: 'warning',
        title: this.translate.instant('IMPORT_S4.TITLE'),
        confirmButtonText: this.translate.instant('IMPORT_S4.BUTTON'),
      });
      return;
    }
    if (this.isUserAdmtc) {
      this.schoolService.setImportStudent(true);
    } else {
      if (this.selectedClassId && this.selectedRncpTitleId) {
        this.checkRegisPeriod('import');
      } else {
        this.swalAddStudentS03();
      }
    }
  }

  checkRegisPeriod(from) {
    const classSelected = this.classes.find((classes) => classes._id === this.selectedClassId);

    const today = moment().toDate();
    if (classSelected && classSelected.registration_period) {
      const startPeriod = new Date(classSelected.registration_period.start_date.date);
      const endPeriod = new Date(classSelected.registration_period.end_date.date);

      if (today >= startPeriod && today <= endPeriod) {
        if (from === 'create') {
          this.schoolService.setDataStudent(null);
          this.schoolService.setCurrentStudentId(null);
          this.schoolService.setDataStudentIdentity(null);
          this.schoolService.setDataStudentCompany(null);
          this.schoolService.setDataStudentParents(null);
          this.schoolService.setAddStudent(true);
        } else {
          this.schoolService.setImportStudent(true);
        }
      } else {
        this.swalAddStudentS02();
      }
    } else {
      this.swalAddStudentS02();
    }
  }

  swalAddStudentS02() {
    Swal.fire({
      type: 'error',
      title: this.translate.instant('ADDSTUDENT_S02.TITLE'),
      html: this.translate.instant('ADDSTUDENT_S02.TEXT'),
      confirmButtonText: this.translate.instant('ADDSTUDENT_S02.BUTTON'),
      allowEnterKey: false,
      allowEscapeKey: false,
      allowOutsideClick: false,
    });
  }

  swalAddStudentS03() {
    Swal.fire({
      type: 'error',
      title: this.translate.instant('ADDSTUDENT_S03.TITLE'),
      text: this.translate.instant('ADDSTUDENT_S03.TEXT'),
      confirmButtonText: this.translate.instant('ADDSTUDENT_S03.BUTTON'),
      allowEnterKey: false,
      allowEscapeKey: false,
      allowOutsideClick: false,
    });
  }

  sendRegistrationEmail() {
    if (this.selectedRncpTitleId && this.selectedClassId) {
      this.isWaitingForResponse = true;
      this.schoolService
        .sendRegistrationEmail(this.selectedRncpTitleId, this.selectedClassId, this.schoolId, this.translate.currentLang)
        .subscribe(
          (resp) => {
            this.isWaitingForResponse = false;
            if (resp) {
              Swal.fire({
                type: 'success',
                title: 'Bravo',
              });
            }
          },
          (err) => {

            this.isWaitingForResponse = false;
            if (err['message'] === 'GraphQL error: There is no Academic Director on this class') {
              Swal.fire({
                type: 'error',
                title: this.translate.instant('SENDREG_S1.TITLE'),
                text: this.translate.instant('SENDREG_S1.TEXT'),
                confirmButtonText: this.translate.instant('SENDREG_S1.BUTTON'),
                allowEnterKey: false,
                allowEscapeKey: false,
                allowOutsideClick: false,
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
  }

  svTypeSelectionDownload() {
    const inputOptions = {
      ',': this.translate.instant('IMPORT_TEMPLATE_S1.COMMA'),
      ';': this.translate.instant('IMPORT_TEMPLATE_S1.SEMICOLON'),
      tab: this.translate.instant('IMPORT_TEMPLATE_S1.TAB'),
    };

    Swal.fire({
      type: 'question',
      title: this.translate.instant('IMPORT_TEMPLATE_S1.TITLE'),
      width: 465,
      allowEscapeKey: true,
      showCancelButton: true,
      cancelButtonText: this.translate.instant('IMPORT_TEMPLATE_S1.CANCEL'),
      confirmButtonText: this.translate.instant('IMPORT_TEMPLATE_S1.OK'),
      input: 'radio',
      inputOptions: inputOptions,
      inputValue: this.translate && this.translate.currentLang === 'fr' ? ';' : '',
      inputValidator: (value) => {
        return new Promise((resolve, reject) => {
          if (value) {
            resolve('');
            Swal.enableConfirmButton();
          } else {
            Swal.disableConfirmButton();
            reject(this.translate.instant('IMPORT_TEMPLATE_S1.INVALID'));
          }
        });
      },
      onOpen: function () {
        Swal.disableConfirmButton();
        Swal.getContent().addEventListener('click', function (e) {
          Swal.enableConfirmButton();
        });
        const input = Swal.getInput();
        const inputValue = input.getAttribute('value');
        if (inputValue === ';') {
          Swal.enableConfirmButton();
        }
      },
    }).then((separator) => {
      if (separator.value) {
        const fileType = separator.value;
        this.downloadCSVTemplate(fileType);
      }
    });
  }

  downloadCSVTemplate(fileType) {
    let url = environment.apiUrl;
    url = url.replace('graphql', '');
    const element = document.createElement('a');
    let delimeter = null;
    switch (fileType) {
      case ',':
        delimeter = 'comma';
        break;
      case ';':
        delimeter = 'semicolon';
        break;
      case 'tab':
        delimeter = 'tab';
        break;
      default:
        delimeter = null;
        break;
    }
    let path = `download/downloadStudentCompanyTemplate/${this.selectedClassId}/${this.selectedRncpTitleId}/${this.schoolId}/${this.translate.currentLang}/${delimeter}`;
    element.href = url + path;


    element.target = '_blank';
    element.download = 'Template Import CSV';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  csvTypeSelectionUpload() {
    const inputOptions = {
      ',': this.translate.instant('IMPORT_DECISION_S1.COMMA'),
      ';': this.translate.instant('IMPORT_DECISION_S1.SEMICOLON'),
      tab: this.translate.instant('IMPORT_DECISION_S1.TAB'),
    };

    Swal.fire({
      type: 'question',
      title: this.translate.instant('IMPORT_DECISION_S1.TITLE'),
      width: 465,
      allowEscapeKey: true,
      showCancelButton: true,
      cancelButtonText: this.translate.instant('IMPORT_DECISION_S1.CANCEL'),
      confirmButtonText: this.translate.instant('IMPORT_DECISION_S1.OK'),
      input: 'radio',
      inputOptions: inputOptions,
      inputValue: this.translate && this.translate.currentLang === 'fr' ? ';' : '',
      inputValidator: (value) => {
        return new Promise((resolve, reject) => {
          if (value) {
            resolve('');
            Swal.enableConfirmButton();
          } else {
            Swal.disableConfirmButton();
            reject(this.translate.instant('IMPORT_DECISION_S1.INVALID'));
          }
        });
      },
      onOpen: function () {
        Swal.disableConfirmButton();
        Swal.getContent().addEventListener('click', function (e) {
          Swal.enableConfirmButton();
        });
        const input = Swal.getInput();
        const inputValue = input.getAttribute('value');
        if (inputValue === ';') {
          Swal.enableConfirmButton();
        }
      },
    }).then((separator) => {
      if (separator.value) {
        const fileType = separator.value;
        this.openImportDialog(fileType);
      }
    });
  }

  openImportDialog(fileType) {

    let delimeter = null;
    switch (fileType) {
      case ',':
        delimeter = 'comma';
        break;
      case ';':
        delimeter = 'semicolon';
        break;
      case 'tab':
        delimeter = 'tab';
        break;
      default:
        delimeter = null;
        break;
    }
    this.dialog
      .open(ImportStudentCompaniesDialogComponent, {
        width: '500px',
        minHeight: '200px',
        panelClass: 'certification-rule-pop-up',
        disableClose: true,
        data: {
          schoolId: this.schoolId,
          titleId: this.selectedRncpTitleId,
          classId: this.selectedClassId,
          delimeter: delimeter,
        },
      })
      .afterClosed()
      .subscribe((resp) => {
        if (resp) {
          if (resp?.data === 'success') {
            this.isRefresh.emit(true);
          }
          // this.getTableData();
          // this.ngOnInit();
        }
      });
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
