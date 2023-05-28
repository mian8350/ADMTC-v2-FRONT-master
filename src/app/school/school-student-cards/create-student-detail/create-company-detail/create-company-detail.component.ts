import { Component, OnInit, Input, EventEmitter, Output, OnDestroy } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import { StudentsService } from 'app/service/students/students.service';
import { SchoolService } from 'app/service/schools/school.service';
import { SubSink } from 'subsink';
import Swal from 'sweetalert2';
import { TranslateService } from '@ngx-translate/core';
import { debounceTime, startWith } from 'rxjs/operators';
import * as _ from 'lodash';
import { Observable } from 'apollo-link';

@Component({
  selector: 'ms-create-company-detail',
  templateUrl: './create-company-detail.component.html',
  styleUrls: ['./create-company-detail.component.scss'],
})
export class CreateCompanyDetailComponent implements OnInit, OnDestroy {
  private subs = new SubSink();
  @Input() registrationForm: UntypedFormGroup;
  @Input() schoolId: string;
  @Input() selectedRncpTitleId: string;
  @Input() selectedClassId: string;
  @Output() continue = new EventEmitter<boolean>();
  @Output() back = new EventEmitter<boolean>();

  companys: any;
  originalCompanys: any;
  originalMentors: any;
  mentors = [];
  specializations = [];
  companyForm: UntypedFormGroup;
  studentId: string;
  isWaitingForResponse = false;
  userTypeMentor: string;
  companyId: string;
  mentorId: string;
  dataStudent: any;
  companies = [];
  private intVal: any;
  private timeOutVal: any;
  constructor(
    private fb: UntypedFormBuilder,
    private studentService: StudentsService,
    private schoolService: SchoolService,
    private titleService: RNCPTitlesService,
    private translate: TranslateService,
  ) {}

  ngOnInit() {
    this.initCompanyForm();
    this.getCompanyData();
    this.CompanyData();
    this.getUserType();

    this.subs.sink = this.schoolService.selectedDataStudentCompany$.subscribe((resp) => {
      if (resp && resp.length) {
        this.dataStudent = resp;
        this.companyForm.patchValue(this.dataStudent);
      }
    });
  }

  initCompanyForm() {
    this.companyForm = this.fb.group({
      company: [''],
      mentor: [''],
    });
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  CompanyData() {

    this.subs.sink = this.companyForm
      .get('company')
      .valueChanges.pipe(debounceTime(400))
      .subscribe((searchString) => {
          this.companys = this.originalCompanys.filter((com) => com.company_name.toLowerCase().trim().includes(searchString.toLowerCase()));
          this.companys = _.orderBy(this.companys, ['company_name'], ['asc']);
      });
    this.subs.sink = this.companyForm
      .get('mentor')
      .valueChanges.pipe(debounceTime(800))
      .subscribe((searchString) => {
        const data = _.cloneDeep(this.originalMentors);
        this.mentors = data.filter((option) => option ? option.last_name.toLowerCase().includes(searchString.toLowerCase()) : '');
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

  getMentor() {
    this.subs.sink = this.schoolService.getMentorStudent(this.userTypeMentor, this.companyId, this.schoolId).subscribe((resp) => {
      if (resp && resp.length) {
        this.mentors = resp;
        this.originalMentors = resp;
      }
    });
  }

  getCompanyData() {
    this.studentId = this.schoolService.getCurrentStudentId();
    const search = '';
    this.subs.sink = this.schoolService.getAllCompany(search, this.schoolId).subscribe((resp) => {
      if (resp && resp.length) {
        this.companys = _.orderBy(resp, ['company_name'], ['asc']);
        this.originalCompanys = _.orderBy(resp, ['company_name'], ['asc']);
      }
    });
  }

  changeCompany(data: any) {
    if (data === '') {
      this.mentors = [];
      this.companyForm.get('company').setValue('');
      this.companyForm.get('mentor').setValue('');
    } else {
      this.companyForm.get('mentor').setValue('');
      this.companyId = data._id;
      this.getMentor();
    }
  }

  changeMentor(data: any) {
    this.mentorId = data._id;
  }

  updateStudentParents() {
    this.isWaitingForResponse = true;
    const temp = this.companyForm.value;
    // validation for main address
    const lang = this.translate.currentLang.toLowerCase();
    const comp = {
      companies: {
        company: this.companyId,
        mentor: this.mentorId,
      },
    };
    this.schoolService.setDataStudentCompany(this.companyForm.value);
    this.subs.sink = this.schoolService.updateStudent(this.studentId, comp, lang).subscribe((resp) => {
      this.isWaitingForResponse = false;
      if (resp) {
        Swal.fire({
          type: 'success',
          title: 'Bravo !',
        }).then((result) => {
          // redirect to student card
          if (result.value) {
            this.schoolService.setDataStudent(null);
            this.schoolService.setCurrentStudentId(null);
            this.schoolService.setDataStudentIdentity(null);
            this.schoolService.setDataStudentCompany(null);
            this.schoolService.setDataStudentParents(null);
            this.schoolService.setAddStudent(false);
          }
        });
        // this.onCancelAdd();
      } else {
        Swal.fire({
          type: 'error',
          title: 'Error !',
        });
      }
    }), 
    (err) => {
      this.isWaitingForResponse = false;
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
        })
      } else {
        Swal.fire({
          type: 'error',
          title: 'Error !',
          text: err && err['message'] ? err['message'] : err,
          confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
        }).then((res) => {

        });
      }
    };
  }

  filterCompany() {
    // this.subs.sink = this.companyForm.get('company').valueChanges.pipe(debounceTime(400)).subscribe((search) => {
    //   if (search && search.length >= 3) {
    //     this.subs.sink = this.schoolService.getAllCompany(search, this.schoolId).subscribe((resp) => {
    //       if (resp && resp.length) {
    //         this.companys = _.orderBy(resp, ['company_name'], ['asc']);
    //       }
    //     });
    //   }
    // });
    this.companys = this.companyForm
      .get('company')
      .valueChanges.pipe(debounceTime(400))
      .subscribe((searchString) => {
        this.originalCompanys
          .filter((option) => option.company_name.toLowerCase().includes(searchString.toLowerCase()))
          .sort((a: any, b: any) => a.company_name.localeCompare(b.company_name))
      });
  }

  previousTab() {
    this.canDeactivate();
  }

  isTestDataNotchanged(): boolean {
    let formData = null;
    this.subs.sink = this.schoolService.selectedDataStudentCompany$.subscribe(resp => (formData = resp));

    const apiData = _.cloneDeep(this.companyForm.value);

    return _.isEqual(formData, apiData);
  }

  canDeactivate(): Observable<boolean> | Promise<boolean> | boolean {
    let validation = true;

    // The actual validation, by comparing data saved and current data in the form
    if (!this.companyForm.touched || this.isTestDataNotchanged()) {
      validation = true;
    } else {
      validation = false;
    }

    // Passing the validation into the canExitService, if we return true, meaning user are allowed to go, otherwise user will stay
    if (!validation) {
      return new Promise((resolve, reject) => {
        Swal.fire({
          type: 'warning',
          title: this.translate.instant('TMTC_S01.TITLE'),
          text: this.translate.instant('TMTC_S01.TEXT'),
          footer: `<span style="margin-left: auto">TMTC_S01</span>`,
          confirmButtonText: this.translate.instant('TMTC_S01.BUTTON_1'),
          showCancelButton: true,
          cancelButtonText: this.translate.instant('TMTC_S01.BUTTON_2'),
          allowEscapeKey: false,
          allowOutsideClick: false,
        }).then((result) => {
          if (result.value) {
            this.back.emit(false);
          } else {
            this.back.emit(true);
          }
        });
      });
    } else {
      this.back.emit(true);
    }
  }

  onCancelAdd() {
    let timeDisabled = 5;
    Swal.fire({
      title: this.translate.instant('IMP_STUDENT.CANCEL_ACTION.TITLE'),
      html: this.translate.instant('IMP_STUDENT.CANCEL_ACTION.TEXT2'),
      footer: `<span style="margin-left: auto">IMP_STUDENT.CANCEL_ACTION</span>`,
      type: 'warning',
      showCancelButton: true,
      confirmButtonText: this.translate.instant('SWEET_ALERT.DELETE.CONFIRM', { timer: timeDisabled }),
      cancelButtonText: this.translate.instant('IMP_STUDENT.CANCEL_ACTION.DECBTN'),
      onOpen: () => {
        Swal.disableConfirmButton();
        const confirmBtnRef = Swal.getConfirmButton();
        this.intVal = setInterval(() => {
          timeDisabled -= 1;
          confirmBtnRef.innerText = this.translate.instant('SWEET_ALERT.DELETE.CONFIRM') + ' in ' + timeDisabled + ' sec';
        }, 1000);
        this.timeOutVal = setTimeout(() => {
          confirmBtnRef.innerText = this.translate.instant('SWEET_ALERT.DELETE.CONFIRM');
          Swal.enableConfirmButton();
          clearInterval(this.intVal);
        }, timeDisabled * 1000);
      },
    }).then((result) => {
      if (result.value) {
        this.schoolService.setDataStudent(null);
        this.schoolService.setCurrentStudentId(null);
        this.schoolService.setDataStudentIdentity(null);
        this.schoolService.setDataStudentCompany(null);
        this.schoolService.setDataStudentParents(null);
        this.schoolService.setAddStudent(false);
      }
    });
  }
}
