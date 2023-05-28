import { Component, OnInit, Output, Input, EventEmitter, OnDestroy, OnChanges } from '@angular/core';
import { SubSink } from 'subsink';
import * as _ from 'lodash';
import { UntypedFormBuilder } from '@angular/forms';
import { StudentsService } from 'app/service/students/students.service';
import { TranslateService } from '@ngx-translate/core';
import { CompanyService } from 'app/service/company/company.service';
import { MatDialog } from '@angular/material/dialog';
import { MailboxService } from 'app/service/mailbox/mailbox.service';
import { SchoolService } from 'app/service/schools/school.service';
import { ParseStringDatePipe } from 'app/shared/pipes/parse-string-date.pipe';
import { ParseLocalToUtcPipe } from 'app/shared/pipes/parse-local-to-utc.pipe';
import { ParseUtcToLocalPipe } from 'app/shared/pipes/parse-utc-to-local.pipe';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import { AuthService } from 'app/service/auth-service/auth.service';
import { forkJoin } from 'rxjs';
import { JobDescService } from 'app/service/job-desc/job-desc.service';
import { environment } from 'environments/environment';
import { UtilityService } from 'app/service/utility/utility.service';


@Component({
  selector: 'ms-job-description',
  templateUrl: './job-description.component.html',
  styleUrls: ['./job-description.component.scss'],
  providers: [ParseStringDatePipe, ParseLocalToUtcPipe, ParseUtcToLocalPipe],
})
export class JobDescriptionComponent implements OnInit, OnDestroy, OnChanges {
  private subs = new SubSink();
  @Input() studentId = '';
  @Input() studentPrevCourseData: any;
  @Input() schoolId: string;
  @Input() classId: string;
  @Input() titleId: string;
  @Input() jobDescriptionId: string;
  @Input() typeDisplay: boolean;
  @Output() continue = new EventEmitter<boolean>();

  classData: any;
  studentData: any;
  isOldJobDesc: boolean;
  isWaitingForResponse = false;  
  studentDomain = environment.studentEnvironment;  
  forStudentLogin = false;
  studentJobDescDomain;
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
    private authService: AuthService,
    private jobDescService: JobDescService,    
    private utilService: UtilityService,    
  ) {}

  ngOnInit() {
    this.getDataInit();

    this.studentJobDescDomain =`${this.studentDomain}/student-form-fill/job-description-form-fill?studentID=${this.studentId}`;
  }

  ngOnChanges() {
    this.subs.unsubscribe();
    this.getDataInit();
  }

  getDataInit() {
    this.isWaitingForResponse = true;
    const forkParam = [];
    forkParam.push(this.rncpTitleService.getClassById(this.classId));
    forkParam.push(this.studentService.getStudentsIdentityData(this.studentId));
    forkParam.push(this.jobDescService.getOneJobDescOldNew(this.studentId));

    this.subs.sink = forkJoin(forkParam).subscribe(
      (response) => {
        this.isWaitingForResponse = false;
        if (response && response.length) {
          let count = 0;
          if (response[count]) {
            this.classData = _.cloneDeep(response[count]);
            count++;
          }
          if (response[count]) {
            this.studentData = _.cloneDeep(response[count]);
            count++;
          }
          if (this.jobDescriptionId) {
            this.subs.sink = this.jobDescService.getOneJobDescOldNew(this.jobDescriptionId).subscribe(
              (resp) => {

                this.isOldJobDesc = resp && resp.is_old_job_desc ? resp.is_old_job_desc : false;

              },
              (err) => {

                this.isWaitingForResponse = false;
              },
            );
          } else {
            if (this.studentData && this.studentData.job_description_id && this.studentData.job_description_id._id) {
              this.subs.sink = this.jobDescService.getOneJobDescOldNew(this.studentData.job_description_id._id).subscribe(
                (resp) => {

                  this.isOldJobDesc = resp && resp.is_old_job_desc ? resp.is_old_job_desc : false;

                },
                (err) => {

                  this.isWaitingForResponse = false;
                },
              );
            }
          }
        }
      },
      (err) => {

        this.isWaitingForResponse = false;
      },
    );
  }  

  connectAsUser() {    
    const currentUser = this.utilService.getCurrentUser();
    const studentUserId = this.studentData?.user_id?._id ? this.studentData?.user_id?._id : null;
    const unixUserType = _.uniqBy(this.studentData?.entities, 'type.name');

    if (currentUser && studentUserId) {
      this.isWaitingForResponse = true;
      this.subs.sink = this.authService.loginAsUser(currentUser._id, studentUserId).subscribe((resp) => {        
        this.isWaitingForResponse = false;
        if (resp && resp.user) {          
          const tempUser = resp.user;
          this.accessStudentJobDesc(resp,tempUser.entities[0].type.name,'ifr');
        }
      }, (err) => {
        this.isWaitingForResponse =false;
      });
    }
  }

  accessStudentJobDesc(user, permissions, frame) {
    // Connect As    
    const iframe = document.getElementById(frame) as HTMLIFrameElement;

    if (iframe) {
      this.authService.connectAsForJobDesc(user, permissions, frame, this.studentId);
    } else {
      setTimeout(() => {
        this.accessStudentJobDesc(user, permissions, frame);
      }, 100);
    }    
  }


  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
