import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from 'app/service/auth-service/auth.service';
import { StudentsService } from 'app/service/students/students.service';
import { ParseLocalToUtcPipe } from 'app/shared/pipes/parse-local-to-utc.pipe';
import { ParseUtcToLocalPipe } from 'app/shared/pipes/parse-utc-to-local.pipe';
import * as moment from 'moment';
import { forkJoin } from 'rxjs';
import { SubSink } from 'subsink';
import Swal from 'sweetalert2';
import * as _ from 'lodash';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import { debounceTime } from 'rxjs/operators';
import { SchoolService } from 'app/service/schools/school.service';
import { Router } from '@angular/router';

@Component({
  selector: 'ms-send-job-description-dialog',
  templateUrl: './send-job-description-dialog.component.html',
  styleUrls: ['./send-job-description-dialog.component.scss'],
  providers: [ParseLocalToUtcPipe, ParseUtcToLocalPipe],
})
export class SendJobDescriptionDialogComponent implements OnInit {
  isWaitingForResponse = false;
  sendJobDescForm: UntypedFormGroup;
  mentors: any[];
  originalMentors: any;
  subs = new SubSink();
  classData: any;
  schoolId: any;
  classId: any;
  titleId: any;
  studentId: any;
  studentData: any;
  companies: any;
  originalCompanies: any;
  contractData: any[];
  active: boolean;
  status: string;
  typeMentorId = '5a2e603f53b95d22c82f9590';
  companyName: string = '';
  mentorName: string = '';

  constructor(
    private fb: UntypedFormBuilder,
    private studentService: StudentsService,
    private translate: TranslateService,
    public dialogRef: MatDialogRef<SendJobDescriptionDialogComponent>,
    private parseLocalToUTCPipe: ParseLocalToUtcPipe,
    private parseUTCToLocalPipe: ParseUtcToLocalPipe,
    private rncpTitleService: RNCPTitlesService,
    private authService: AuthService,
    private schoolService: SchoolService,
    private router: Router,
    @Inject(MAT_DIALOG_DATA) public parentData: any,
  ) {}

  ngOnInit() {

    this.setInputVariables(this.parentData);
    this.initForm();
    this.initData();
  }

  setInputVariables(parentData) {
    this.schoolId = parentData.school._id;
    this.classId = parentData.class_id._id;
    this.titleId = parentData.rncp._id;
    this.studentId = parentData.student_id._id;
  }

  initForm() {
    this.sendJobDescForm = this.fb.group({
      company: [null, Validators.required],
      mentor: [null, Validators.required],
      start_date: ['', Validators.required],
      end_date: [''],
    });
  }

  closeDialog(resp?) {
    this.dialogRef.close(resp);
  }

  get companyId() {
    return this.sendJobDescForm.get('company').value;
  }

  get mentorId() {
    return this.sendJobDescForm.get('mentor').value;
  }

  initData() {
    const forkArray = [];
    forkArray.push(this.rncpTitleService.getClassByIdOnCompany(this.classId));
    forkArray.push(this.studentService.getStudentsIdentityData(this.studentId, this.titleId, this.classId));
    this.isWaitingForResponse = true;
    this.subs.sink = forkJoin(forkArray).subscribe((resp) => {
      this.isWaitingForResponse = false;
      if (resp) {
        let count = 0;
        if (resp[count]) {
          this.classData = _.cloneDeep(resp[count]);

          count++;
        }
        if (resp[count]) {
          this.studentData = _.cloneDeep(resp[count]);
          this.patchCompanyAndMentor(this.studentData);

          count++;
        }
        // this.getCompanyData();
        // this.getMentor();
      }
    });
  }

  patchCompanyAndMentor(studentData) {
    const activeCompany = studentData.companies.find((company) => company.status === 'active');

    if (activeCompany) {
      this.companyName = activeCompany.company.company_name;
      this.mentorName = `${activeCompany.mentor.first_name} ${activeCompany.mentor.last_name}`;
      activeCompany.start_date && activeCompany.start_date.date
        ? this.sendJobDescForm.get('start_date').patchValue(moment(activeCompany.start_date.date, 'DD/MM/YYYY').toDate())
        : null;
      activeCompany.end_date && activeCompany.end_date.date
        ? this.sendJobDescForm.get('end_date').patchValue(moment(activeCompany.end_date.date, 'DD/MM/YYYY').toDate())
        : null;
      this.sendJobDescForm.get('company').patchValue(activeCompany.company._id);
      this.sendJobDescForm.get('mentor').patchValue(activeCompany.mentor._id);
    }

  }

  updateStudentCompany() {
    const companies= []
    this.studentData.companies.forEach((com) =>{
      if(com.company._id === this.companyId){
        const company = {
          company: this.companyId,
          mentor: this.mentorId,
          status: com.status,
          start_date: {
            date: moment(this.sendJobDescForm.get('start_date').value).format('DD/MM/YYYY'),
            time: com.start_date.time,
          },
          end_date: {
            date: moment(this.sendJobDescForm.get('end_date').value).format('DD/MM/YYYY'),
            time: com.end_date.time,
          }          
      };
        companies.push(company)
      }else{
        companies.push({
          company: com.company._id,
          mentor: com.mentor._id,
          status: com.status,
          start_date: {
            date: com.start_date.date,
            time: com.start_date.time,
          },
          end_date: {
            date: com.end_date.date,
            time: com.end_date.time,
          }
      })
    } });

    return companies
  }

  // // for dropdowns
  // getCompanyData() {
  //   this.isWaitingForResponse = true;
  //   const search = '';
  //   this.subs.sink = this.schoolService.getAllCompany(search, this.schoolId).subscribe((resp) => {
  //     this.isWaitingForResponse = false;
  //     if (resp && resp.length) {
  //       this.companies = _.orderBy(resp, ['company_name'], ['asc']);
  //       this.originalCompanies = _.orderBy(resp, ['company_name'], ['asc']);
  //     }
  //   });
  // }

  // // for mentor dropdowns
  // getMentor() {
  //   this.isWaitingForResponse = true;
  //   if (this.companyId && this.schoolId && this.typeMentorId) {
  //     this.subs.sink = this.schoolService.getMentorStudent(this.typeMentorId, this.companyId, this.schoolId).subscribe((resp) => {
  //       this.isWaitingForResponse = false;
  //       if (resp && resp.length) {
  //         this.originalMentors = resp.map((list) => {
  //           return {
  //             _id: list._id,
  //             first_name: list.first_name,
  //             last_name: list.last_name,
  //             civility: list.civility,
  //             email: list.email,
  //             full_name: list.full_name,
  //             name: (list.civility ? this.translate.instant(list.civility) : '') + ' ' + list.first_name + ' ' + list.last_name,
  //           };
  //         });
  //         this.mentors = this.originalMentors;
  //       } else {
  //         this.mentors = [];
  //         this.originalMentors = [];
  //       }
  //     });
  //   } else {
  //     this.mentors = [];
  //     this.originalMentors = [];
  //   }
  // }

  onChangeCompanyAndMentor() {
    this.router.navigate(['/school', this.schoolId], {
      queryParams: {
        title: this.titleId,
        class: this.classId,
        student: this.studentId,
        open: 'student-cards',
        selectedTab: 'Company',
        selectedSubTab: 'Company',
      },
    });
    this.closeDialog();
  }

  submit() {
    const currentUser = this.authService.getLocalStorageUser();
    let payload: any;
    payload = {
      school_id: this.parentData.school._id,
      rncp_id: this.parentData.rncp._id,
      sender_id: currentUser._id,
      student_id: this.parentData.student_id._id,
      class_id: this.parentData.class_id._id,
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
      allowOutsideClick: false,
      allowEnterKey: false,
    }).then((res) => {
      if (res.value) {
        this.isWaitingForResponse = true;
        const lang = this.translate.currentLang.toLowerCase();
        const company = this.updateStudentCompany()
        const companies = {
          companies: company
        }

        this.subs.sink = this.studentService.updateStudent(this.parentData.student_id._id,companies,lang).subscribe(resp=>{

          if(resp){
            this.subs.sink = this.studentService.sendJobDesc(payload).subscribe(
              (resp) => {
                this.isWaitingForResponse = false;
                Swal.fire({
                  type: 'success',
                  title: this.translate.instant('JOBDESC_S1B.TITLE'),
                  text: this.translate.instant('JOBDESC_S1B.TEXT'),
                  confirmButtonText: this.translate.instant('JOBDESC_S1B.BUTTON'),
                }).then((action) => {
                  this.closeDialog(resp);
                });
              },
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
        })
      }
    });
  }

  getTodayTime() {
    return this.parseLocalToUTCPipe.transform(this.parseUTCToLocalPipe.transform('15:59'));
  }

  getTodayDate() {
    const today = moment().format('DD/MM/YYYY');
    return this.parseLocalToUTCPipe.transformDate(today, this.parseUTCToLocalPipe.transform('15:59'));
  }
}
