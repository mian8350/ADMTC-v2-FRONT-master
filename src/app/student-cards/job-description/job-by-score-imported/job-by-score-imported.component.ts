import { CertidegreeService } from './../../../service/certidegree/certidegree.service';
import { Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { DateAdapter } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import * as _ from 'lodash';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { removeSpaces, requiredTrueIfValidator } from 'app/service/customvalidator.validator';
import { FileUploadService } from 'app/service/file-upload/file-upload.service';
import { JobDescService } from 'app/service/job-desc/job-desc.service';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import { StudentsService } from 'app/service/students/students.service';
import { UtilityService } from 'app/service/utility/utility.service';
import { ParseLocalToUtcPipe } from 'app/shared/pipes/parse-local-to-utc.pipe';
import { ParseStringDatePipe } from 'app/shared/pipes/parse-string-date.pipe';
import { ParseUtcToLocalPipe } from 'app/shared/pipes/parse-utc-to-local.pipe';
import * as moment from 'moment';
import { forkJoin } from 'rxjs';
import { SubSink } from 'subsink';
import Swal from 'sweetalert2';
import { RejectionReasonDialogComponent } from '../rejection-reason-dialog/rejection-reason-dialog.component';
import { Router } from '@angular/router';
import { JobPDFComponent } from '../job-description-pdf/job-description-pdf.component';
import { STYLE } from 'app/title-rncp/conditions/class-condition/score/second-step-score/condition-score-preview/pdf-styles';
import { TranscriptBuilderService } from 'app/service/transcript-builder/transcript-builder.service';
import { environment } from 'environments/environment';

@Component({
  selector: 'ms-job-by-score-imported',
  templateUrl: './job-by-score-imported.component.html',
  styleUrls: ['./job-by-score-imported.component.scss'],
  providers: [ParseStringDatePipe, ParseLocalToUtcPipe, ParseUtcToLocalPipe],
})
export class JobByScoreImportedComponent implements OnInit, OnDestroy, OnChanges {
  private subs = new SubSink();
  @Input() studentId = '';
  @Input() studentPrevCourseData: any;
  @Input() schoolId: string;
  @Input() classId: string;
  @Input() titleId: string;
  @Input() jobDescriptionId: string;
  @Input() typeDisplay: boolean;
  @Output() continue = new EventEmitter<boolean>();
  @ViewChild('jobDescriptionPDF', { static: false }) jobDescriptionPDF: JobPDFComponent;
  @ViewChild('fileUploadDoc', { static: false }) fileUploaderDoc: ElementRef;
  jobDescriptionType = 'import';
  jobDescTemp:any
  classData: any;
  studentData: any;
  jobDescData: any;
  statusCard = {
    sent_to_student: false,
    sent_to_mentor: false,
    validated_by_mentor: false,
    sent_to_school: false,
    rejected_by_acad_dir: false,
    validated_by_acad_staff: false,
    expedite_by_acad_staff: false,
    expedite_by_acad_staff_student: false,
  };
  academicTemplate: any;

  jobDescForm: UntypedFormGroup;
  allowEditForm = false;

  autonomyLevel = [
    {
      value: 'JOBDESCRIPTIONFORM.MISSIONSACTIVITIESANDAUTONOMY.AUTONOMYLEVEL.OPT1',
      viewValue: 'JOBDESCRIPTIONFORM.MISSIONSACTIVITIESANDAUTONOMY.AUTONOMYLEVEL.OPT1',
    },
    {
      value: 'JOBDESCRIPTIONFORM.MISSIONSACTIVITIESANDAUTONOMY.AUTONOMYLEVEL.OPT2',
      viewValue: 'JOBDESCRIPTIONFORM.MISSIONSACTIVITIESANDAUTONOMY.AUTONOMYLEVEL.OPT2',
    },
    {
      value: 'JOBDESCRIPTIONFORM.MISSIONSACTIVITIESANDAUTONOMY.AUTONOMYLEVEL.OPT3',
      viewValue: 'JOBDESCRIPTIONFORM.MISSIONSACTIVITIESANDAUTONOMY.AUTONOMYLEVEL.OPT3',
    },
    {
      value: 'JOBDESCRIPTIONFORM.MISSIONSACTIVITIESANDAUTONOMY.AUTONOMYLEVEL.OPT4',
      viewValue: 'JOBDESCRIPTIONFORM.MISSIONSACTIVITIESANDAUTONOMY.AUTONOMYLEVEL.OPT4',
    },
  ];
  industrySectorList = [];

  intVal: any;
  timeOutVal: any;

  isStudent = false;
  isADMTC = false;
  isMentor = false;
  isAcadDirAdmin = false;

  isWaitingForResponse = false;
  myInnerHeight = 1920;
  scrollEvent: any;
  constructor(
    private fb: UntypedFormBuilder,
    private studentService: StudentsService,
    public dialog: MatDialog,
    private router: Router,
    private rncpTitleService: RNCPTitlesService,
    public utilService: UtilityService,
    private jobDescService: JobDescService,
    public translate: TranslateService,
    private fileUploadService: FileUploadService,
    private parseStringDatePipe: ParseStringDatePipe,
    private parseLocalToUTCPipe: ParseLocalToUtcPipe,
    private parseUTCToLocalPipe: ParseUtcToLocalPipe,
    private dateAdapter: DateAdapter<Date>,
    private transcriptBuilderService: TranscriptBuilderService,
    private certieDegreeService: CertidegreeService
  ) {
    this.industrySectorList = this.jobDescService.getIndustrySectorList();
  }

  ngOnInit() {
    this.dateAdapter.setLocale(this.translate.currentLang);
    this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      this.dateAdapter.setLocale(this.translate.currentLang);
    });
  }

  ngOnChanges() {
    this.jobDescTemp = null
    this.subs.unsubscribe();
    this.initForm();
    this.getDataInit();
  }

  // *************** To Get Height window screen and put in style css height
  getAutomaticHeight() {
    if (this.router.url.includes('/my-file')) {
      this.myInnerHeight = window.innerHeight - 193;
      return this.myInnerHeight;
    } else if (this.router.url.includes('/students-card')) {
      this.myInnerHeight = window.innerHeight - 271;
      return this.myInnerHeight;
    } else if (this.typeDisplay) {
      this.myInnerHeight = window.innerHeight - 128;
      return this.myInnerHeight;
    } else {
      this.myInnerHeight = window.innerHeight - 356;
      return this.myInnerHeight;
    }
  }

  getDataInit() {
    this.isWaitingForResponse = true;
    // ************ Get Data User for permission of button
    this.isADMTC = this.utilService.isUserEntityADMTC();
    this.isAcadDirAdmin = this.utilService.isUserAcadDirAdmin();
    this.isMentor = this.utilService.isUserMentor();
    this.isStudent = this.utilService.isUserStudent();

    // ************ Get Data of Job Desc
    const forkParam = [];
    forkParam.push(this.rncpTitleService.getClassById(this.classId));
    if (this.studentPrevCourseData) {
      // student's previous course data
      forkParam.push(
        this.studentService.getStudentsPreviousCourseJobDescIdentityData(
          this.schoolId,
          this.studentPrevCourseData.rncp_title._id,
          this.studentPrevCourseData.current_class._id,
          this.studentId,
        ),
      );
    } else {
      forkParam.push(this.studentService.getStudentsJobDescIdentityData(this.studentId));
    }

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
            this.studentData = this.studentPrevCourseData ? _.cloneDeep(response[count][0]) : _.cloneDeep(response[count]);
            if (this.jobDescriptionId) {
              if (this.studentData && this.studentData.companies && this.studentData.companies.length) {
                this.studentData.companies = this.studentData.companies.filter(
                  (company) => company.job_description_id && company.job_description_id._id === this.jobDescriptionId,
                );
              }
            } else {
              if (this.studentData && this.studentData.companies && this.studentData.companies.length) {
                this.studentData.companies = this.studentData.companies.filter((company) => company.status === 'active');
              }
            }
            count++;
          }
        }

        if (this.jobDescriptionId) {
          this.subs.sink = this.jobDescService.getOneJobDescImported(this.jobDescriptionId).subscribe((resp) => {

            this.jobDescData = _.cloneDeep(resp);

            // *************** Process the status of the job desc
            this.processStatusCard();
            if(this.jobDescData?.job_description_status === 'validated_by_acad_staff') {
              this.jobDescForm.disable();
            }

            // *************** Process the form
            const temp = _.cloneDeep(resp);

            if (temp && temp.rncp_id && temp.rncp_id._id) {
              temp.rncp_id = temp.rncp_id._id;
            }
            if (temp && temp.school_id && temp.school_id._id) {
              temp.school_id = temp.school_id._id;
            }
            if (temp && temp.student_id && temp.student_id._id) {
              temp.student_id = temp.student_id._id;
            }

            if (temp.date_of_the_mission && temp.date_of_the_mission.from && temp.date_of_the_mission && temp.date_of_the_mission.to) {
              if (temp.date_of_the_mission && temp.date_of_the_mission.from) {
                const startTime = temp.date_of_the_mission.from.time ? temp.date_of_the_mission.from.time : '15:59';
                temp.date_of_the_mission.from.date = this.parseStringDatePipe.transformStringToDate(
                  this.parseUTCToLocalPipe.transformDate(temp.date_of_the_mission.from.date, startTime),
                );
                temp.date_of_the_mission.from.time = this.parseUTCToLocalPipe.transform(startTime)
                  ? this.parseUTCToLocalPipe.transform(startTime)
                  : this.parseUTCToLocalPipe.transform('15:59');
              }
              if (temp.date_of_the_mission && temp.date_of_the_mission.to) {
                const endTime = temp.date_of_the_mission.to.time ? temp.date_of_the_mission.to.time : '15:59';
                temp.date_of_the_mission.to.date = this.parseStringDatePipe.transformStringToDate(
                  this.parseUTCToLocalPipe.transformDate(temp.date_of_the_mission.to.date, endTime),
                );
                temp.date_of_the_mission.to.time = this.parseUTCToLocalPipe.transform(endTime)
                  ? this.parseUTCToLocalPipe.transform(endTime)
                  : this.parseUTCToLocalPipe.transform('15:59');
              }
            } else {
              if (this.studentData.companies) {
                const activeCompany = _.find(this.studentData.companies, (company) => company.status === 'active');
                if (activeCompany && activeCompany.start_date.date && activeCompany.end_date.date) {
                  const startTime = activeCompany.start_date.time ? activeCompany.start_date.time : '15:59';
                  const endTime = activeCompany.end_date.time ? activeCompany.end_date.time : '15:59';
                  temp.date_of_the_mission = {
                    from: {
                      date: this.parseStringDatePipe.transformStringToDate(
                        this.parseUTCToLocalPipe.transformDate(activeCompany.start_date.date, startTime),
                      ),
                      time: this.parseUTCToLocalPipe.transform(startTime)
                        ? this.parseUTCToLocalPipe.transform(startTime)
                        : this.parseUTCToLocalPipe.transform('15:59'),
                    },
                    to: {
                      date: this.parseStringDatePipe.transformStringToDate(
                        this.parseUTCToLocalPipe.transformDate(activeCompany.end_date.date, endTime),
                      ),
                      time: this.parseUTCToLocalPipe.transform(endTime)
                        ? this.parseUTCToLocalPipe.transform(endTime)
                        : this.parseUTCToLocalPipe.transform('15:59'),
                    },
                  };
                } else {
                  if (temp && !temp.date_of_the_mission) {
                    temp.date_of_the_mission = {
                      from: {
                        date: null,
                        time: this.parseUTCToLocalPipe.transform('15:59'),
                      },
                      to: {
                        date: null,
                        time: this.parseUTCToLocalPipe.transform('15:59'),
                      },
                    };
                  } else {
                    if (temp.date_of_the_mission && temp.date_of_the_mission.from) {
                      temp.date_of_the_mission.from.date = this.parseStringDatePipe.transformStringToDate(
                        this.parseUTCToLocalPipe.transformDate(temp.date_of_the_mission.from.date, temp.date_of_the_mission.from.time),
                      );
                      temp.date_of_the_mission.from.time = this.parseUTCToLocalPipe.transform(temp.date_of_the_mission.from.time);
                    }
                    if (temp.date_of_the_mission && temp.date_of_the_mission.to) {
                      temp.date_of_the_mission.to.date = this.parseStringDatePipe.transformStringToDate(
                        this.parseUTCToLocalPipe.transformDate(temp.date_of_the_mission.to.date, temp.date_of_the_mission.to.time),
                      );
                      temp.date_of_the_mission.to.time = this.parseUTCToLocalPipe.transform(temp.date_of_the_mission.to.time);
                    }
                  }
                }
              }
            }

            if (temp && !temp.company_presentation) {
              temp.company_presentation = {
                file_name: null,
                file_url: null,
              };
            }

            if (temp && temp.job_desc_rejections && temp.job_desc_rejections.length) {
              temp.job_desc_rejections.forEach((reason) => {
                this.addRejectionForm();
                if (reason.rejection_date) {
                  reason.rejection_date.date = this.parseStringDatePipe.transformStringToDate(
                    this.parseUTCToLocalPipe.transformDate(reason.rejection_date.date, reason.rejection_date.time),
                  );
                  reason.rejection_date.time = this.parseUTCToLocalPipe.transform(reason.rejection_date.time);
                }
              });
            } else {
              temp.job_desc_rejections = [];
            }
            if (temp && temp.old_job_desc) {
              if (temp && temp.old_job_desc.missions_activities_autonomy && temp.old_job_desc.missions_activities_autonomy.length) {
                // *************** If Data of activity previously saved, then populate the activity from here
                temp.old_job_desc.missions_activities_autonomy.forEach((activity, activityIndex) => {
                  this.addMissionActivityToForm();
                });
              } else {
                temp.old_job_desc.missions_activities_autonomy = [];
              }
              if (temp && temp.old_job_desc.expected_from_the_students && temp.old_job_desc.expected_from_the_students.length) {
                // *************** If Data of expected previously saved, then populate the expected_from_the_students from here
                temp.old_job_desc.expected_from_the_students.forEach((activity, activityIndex) => {
                  this.addExpectedStudentForm();
                });
              } else {
                temp.old_job_desc.expected_from_the_students = [];
              }

              if (temp && temp.old_job_desc.know_how && temp.old_job_desc.know_how.length) {
                temp.old_job_desc.know_how.forEach((activity, activityIndex) => {
                  const dataMap = {
                    know_how: temp.old_job_desc.know_how[activityIndex],
                  };
                  temp.old_job_desc.know_how[activityIndex] = dataMap;
                  this.addKnowHow();
                });
              } else {
                temp.old_job_desc.know_how = [];
              }

              if (temp && temp.old_job_desc.knowledges && temp.old_job_desc.knowledges.length) {
                temp.old_job_desc.knowledges.forEach((activity, activityIndex) => {
                  const dataMap = {
                    knowledges: temp.old_job_desc.knowledges[activityIndex],
                  };
                  temp.old_job_desc.knowledges[activityIndex] = dataMap;
                  this.addKnowledge();
                });
              } else {
                temp.old_job_desc.knowledges = [];
              }

              if (temp && temp.old_job_desc.objectives_of_the_department && temp.old_job_desc.objectives_of_the_department.length) {
                temp.old_job_desc.objectives_of_the_department.forEach((activity, activityIndex) => {
                  const dataMap = {
                    objectives_of_the_department: temp.old_job_desc.objectives_of_the_department[activityIndex],
                  };
                  temp.old_job_desc.objectives_of_the_department[activityIndex] = dataMap;
                  this.addObjectiveDepartment();
                });
              } else {
                temp.old_job_desc.objectives_of_the_department = [];
              }
            } else {
              temp.old_job_desc = {};
            }


            this.jobDescForm.patchValue(temp);
            this.jobDescTemp = this.jobDescForm.value
            this.jobDescForm.valueChanges.subscribe(resp=>{
              this.isFormSame()
            })

          });
        } else {
          if (this.studentData && this.studentData.job_description_id && this.studentData.job_description_id._id) {
            this.subs.sink = this.jobDescService.getOneJobDescImported(this.studentData.job_description_id._id).subscribe((resp) => {

              this.jobDescData = _.cloneDeep(resp);
              if(this.jobDescData?.job_description_status === 'validated_by_acad_staff') {
                this.jobDescForm.disable();
              }

              // *************** Process the status of the job desc
              this.processStatusCard();

              // *************** Process the form
              const temp = _.cloneDeep(resp);

              if (temp && temp.rncp_id && temp.rncp_id._id) {
                temp.rncp_id = temp.rncp_id._id;
              }
              if (temp && temp.school_id && temp.school_id._id) {
                temp.school_id = temp.school_id._id;
              }
              if (temp && temp.student_id && temp.student_id._id) {
                temp.student_id = temp.student_id._id;
              }

              if (temp.date_of_the_mission && temp.date_of_the_mission.from && temp.date_of_the_mission && temp.date_of_the_mission.to) {
                if (temp.date_of_the_mission && temp.date_of_the_mission.from) {
                  const startTime = temp.date_of_the_mission.from.time ? temp.date_of_the_mission.from.time : '15:59';
                  temp.date_of_the_mission.from.date = this.parseStringDatePipe.transformStringToDate(
                    this.parseUTCToLocalPipe.transformDate(temp.date_of_the_mission.from.date, startTime),
                  );
                  temp.date_of_the_mission.from.time = this.parseUTCToLocalPipe.transform(startTime)
                    ? this.parseUTCToLocalPipe.transform(startTime)
                    : this.parseUTCToLocalPipe.transform('15:59');
                }
                if (temp.date_of_the_mission && temp.date_of_the_mission.to) {
                  const endTime = temp.date_of_the_mission.to.time ? temp.date_of_the_mission.to.time : '15:59';
                  temp.date_of_the_mission.to.date = this.parseStringDatePipe.transformStringToDate(
                    this.parseUTCToLocalPipe.transformDate(temp.date_of_the_mission.to.date, endTime),
                  );
                  temp.date_of_the_mission.to.time = this.parseUTCToLocalPipe.transform(endTime)
                    ? this.parseUTCToLocalPipe.transform(endTime)
                    : this.parseUTCToLocalPipe.transform('15:59');
                }
              } else {
                if (this.studentData.companies) {
                  const activeCompany = _.find(this.studentData.companies, (company) => company.status === 'active');
                  if (activeCompany && activeCompany.start_date.date && activeCompany.end_date.date) {
                    const startTime = activeCompany.start_date.time ? activeCompany.start_date.time : '15:59';
                    const endTime = activeCompany.end_date.time ? activeCompany.end_date.time : '15:59';
                    temp.date_of_the_mission = {
                      from: {
                        date: this.parseStringDatePipe.transformStringToDate(
                          this.parseUTCToLocalPipe.transformDate(activeCompany.start_date.date, startTime),
                        ),
                        time: this.parseUTCToLocalPipe.transform(startTime)
                          ? this.parseUTCToLocalPipe.transform(startTime)
                          : this.parseUTCToLocalPipe.transform('15:59'),
                      },
                      to: {
                        date: this.parseStringDatePipe.transformStringToDate(
                          this.parseUTCToLocalPipe.transformDate(activeCompany.end_date.date, endTime),
                        ),
                        time: this.parseUTCToLocalPipe.transform(endTime)
                          ? this.parseUTCToLocalPipe.transform(endTime)
                          : this.parseUTCToLocalPipe.transform('15:59'),
                      },
                    };
                  } else {
                    if (temp && !temp.date_of_the_mission) {
                      temp.date_of_the_mission = {
                        from: {
                          date: null,
                          time: this.parseUTCToLocalPipe.transform('15:59'),
                        },
                        to: {
                          date: null,
                          time: this.parseUTCToLocalPipe.transform('15:59'),
                        },
                      };
                    } else {
                      if (temp.date_of_the_mission && temp.date_of_the_mission.from) {
                        temp.date_of_the_mission.from.date = this.parseStringDatePipe.transformStringToDate(
                          this.parseUTCToLocalPipe.transformDate(temp.date_of_the_mission.from.date, temp.date_of_the_mission.from.time),
                        );
                        temp.date_of_the_mission.from.time = this.parseUTCToLocalPipe.transform(temp.date_of_the_mission.from.time);
                      }
                      if (temp.date_of_the_mission && temp.date_of_the_mission.to) {
                        temp.date_of_the_mission.to.date = this.parseStringDatePipe.transformStringToDate(
                          this.parseUTCToLocalPipe.transformDate(temp.date_of_the_mission.to.date, temp.date_of_the_mission.to.time),
                        );
                        temp.date_of_the_mission.to.time = this.parseUTCToLocalPipe.transform(temp.date_of_the_mission.to.time);
                      }
                    }
                  }
                }
              }

              if (temp && !temp.company_presentation) {
                temp.company_presentation = {
                  file_name: null,
                  file_url: null,
                };
              }

              if (temp && temp.job_desc_rejections && temp.job_desc_rejections.length) {
                temp.job_desc_rejections.forEach((reason) => {
                  this.addRejectionForm();
                  if (reason.rejection_date) {
                    reason.rejection_date.date = this.parseStringDatePipe.transformStringToDate(
                      this.parseUTCToLocalPipe.transformDate(reason.rejection_date.date, reason.rejection_date.time),
                    );
                    reason.rejection_date.time = this.parseUTCToLocalPipe.transform(reason.rejection_date.time);
                  }
                });
              } else {
                temp.job_desc_rejections = [];
              }
              if (temp && temp.old_job_desc) {
                if (temp && temp.old_job_desc.missions_activities_autonomy && temp.old_job_desc.missions_activities_autonomy.length) {
                  // *************** If Data of activity previously saved, then populate the activity from here
                  temp.old_job_desc.missions_activities_autonomy.forEach((activity, activityIndex) => {
                    this.addMissionActivityToForm();
                  });
                } else {
                  temp.old_job_desc.missions_activities_autonomy = [];
                }
                if (temp && temp.old_job_desc.expected_from_the_students && temp.old_job_desc.expected_from_the_students.length) {
                  // *************** If Data of expected previously saved, then populate the expected_from_the_students from here
                  temp.old_job_desc.expected_from_the_students.forEach((activity, activityIndex) => {
                    this.addExpectedStudentForm();
                  });
                } else {
                  temp.old_job_desc.expected_from_the_students = [];
                }

                if (temp && temp.old_job_desc.know_how && temp.old_job_desc.know_how.length) {
                  temp.old_job_desc.know_how.forEach((activity, activityIndex) => {
                    const dataMap = {
                      know_how: temp.old_job_desc.know_how[activityIndex],
                    };
                    temp.old_job_desc.know_how[activityIndex] = dataMap;
                    this.addKnowHow();
                  });
                } else {
                  temp.old_job_desc.know_how = [];
                }

                if (temp && temp.old_job_desc.knowledges && temp.old_job_desc.knowledges.length) {
                  temp.old_job_desc.knowledges.forEach((activity, activityIndex) => {
                    const dataMap = {
                      knowledges: temp.old_job_desc.knowledges[activityIndex],
                    };
                    temp.old_job_desc.knowledges[activityIndex] = dataMap;
                    this.addKnowledge();
                  });
                } else {
                  temp.old_job_desc.knowledges = [];
                }

                if (temp && temp.old_job_desc.objectives_of_the_department && temp.old_job_desc.objectives_of_the_department.length) {
                  temp.old_job_desc.objectives_of_the_department.forEach((activity, activityIndex) => {
                    const dataMap = {
                      objectives_of_the_department: temp.old_job_desc.objectives_of_the_department[activityIndex],
                    };
                    temp.old_job_desc.objectives_of_the_department[activityIndex] = dataMap;
                    this.addObjectiveDepartment();
                  });
                } else {
                  temp.old_job_desc.objectives_of_the_department = [];
                }
              } else {
                temp.old_job_desc = {};
              }


              this.jobDescForm.patchValue(temp);
              this.jobDescTemp = this.jobDescForm.value
              this.jobDescForm.valueChanges.subscribe(resp=>{
                this.isFormSame()
              })

            });
          }
        }
      },
      (err) => {
        this.isWaitingForResponse = false;

      },
    );
  }

  initForm() {
    this.jobDescForm = this.fb.group({
      rncp_id: [this.titleId],
      school_id: [this.schoolId],
      job_name: ['', [Validators.required]],
      student_id: [this.studentId, [Validators.required]],
      date_of_the_mission: this.fb.group({
        from: this.fb.group({
          date: ['', Validators.required],
          time: [this.parseUTCToLocalPipe.transform('15:59')],
        }),
        to: this.fb.group({
          date: ['', Validators.required],
          time: [this.parseUTCToLocalPipe.transform('15:59')],
        }),
      }),
      main_mission_of_the_department: ['', [Validators.required]],
      organization_of_the_department: ['', [Validators.required]],
      main_mission: ['', [Validators.required]],
      company_web_url: [''],
      company_presentation: this.fb.group({
        file_name: [''],
        file_url: [''],
      }),
      company_main_activity: [''],
      industry_sector: [''],
      signature_of_the_student: [
        false,
        [requiredTrueIfValidator(() => this.jobDescData && this.jobDescData.job_description_status === 'sent_to_student')],
      ],
      signature_of_the_company_mentor: [
        false,
        [requiredTrueIfValidator(() => this.jobDescData && this.jobDescData.job_description_status === 'sent_to_mentor')],
      ],
      signature_of_the_acadir: [
        false,
        [requiredTrueIfValidator(() => this.jobDescData && this.jobDescData.job_description_status === 'sent_to_school')],
      ],
      old_job_desc: this.fb.group({
        knowledges: this.fb.array([]),
        know_how: this.fb.array([]),
        objectives_of_the_department: this.fb.array([]),
        expected_from_the_students: this.fb.array([]),
        missions_activities_autonomy: this.fb.array([]),
      }),
      job_desc_rejections: this.fb.array([]),
    });
    // this.jobDescForm.valueChanges.subscribe(resp=>{
    //   this.isFormSame()
    // })
  }

  isFormSame() {

    const secondForm = JSON.stringify(this.jobDescTemp);
    const formType = JSON.stringify(this.jobDescForm.value);
    if (secondForm === formType) {
      this.certieDegreeService.childrenFormValidationStatus = true;
      return true;
    } else {
      this.certieDegreeService.childrenFormValidationStatus = false;
      return false;
    }
  }

  initKnowledges() {
    return this.fb.group({
      knowledges: ['', [Validators.required]],
    });
  }

  initKnowHow() {
    return this.fb.group({
      know_how: ['', [Validators.required]],
    });
  }

  initObjective() {
    return this.fb.group({
      objectives_of_the_department: ['', [Validators.required]],
    });
  }

  initExpectedStudentForm() {
    return this.fb.group({
      contribution: ['', [Validators.required]],
      objective: ['', [Validators.required]],
    });
  }

  initMissionActivityAutonomyForm() {
    return this.fb.group({
      mission: ['', [Validators.required, removeSpaces]],
      activity: ['', [Validators.required, removeSpaces]],
      autonomy_level: ['', [Validators.required, removeSpaces]],
    });
  }

  initRejectionForm() {
    return this.fb.group({
      reason_of_rejection: [''],
      rejection_date: this.fb.group({
        date: ['', Validators.required],
        time: ['00:00', Validators.required],
      }),
    });
  }

  // ************** Called on init to check the status of job desc
  processStatusCard() {
    // Reset first, so if triggered by ngonchanges, data of old job desc(other student) not corrupting the data
    this.statusCard = {
      sent_to_student: false,
      sent_to_mentor: false,
      validated_by_mentor: false,
      sent_to_school: false,
      rejected_by_acad_dir: false,
      validated_by_acad_staff: false,
      expedite_by_acad_staff: false,
      expedite_by_acad_staff_student: false,
    };
    this.allowEditForm = false;
    if (this.jobDescData) {
      switch (this.jobDescData.job_description_status) {
        case 'sent_to_student':
          this.statusCard.sent_to_student = true;
          if (this.isADMTC || this.isAcadDirAdmin || this.isStudent) {
            this.allowEditForm = true;
          }
          break;
        case 'sent_to_mentor':
          this.statusCard.sent_to_student = true;
          this.statusCard.sent_to_mentor = true;
          if (this.isADMTC || this.isAcadDirAdmin || this.isMentor) {
            this.allowEditForm = true;
          }
          break;
        case 'validated_by_mentor':
          this.statusCard.sent_to_student = true;
          this.statusCard.sent_to_mentor = true;
          this.statusCard.validated_by_mentor = true;
          break;
        case 'sent_to_school':
          this.statusCard.sent_to_student = true;
          this.statusCard.sent_to_school = true;
          if (this.classData && this.classData.is_mentor_selected_in_job_description) {
            this.statusCard.sent_to_mentor = true;
            this.statusCard.validated_by_mentor = true;
          }
          if (this.isADMTC || this.isAcadDirAdmin) {
            this.allowEditForm = true;
          }
          break;
        case 'rejected_by_acad_dir':
          this.statusCard.sent_to_student = true;
          this.statusCard.sent_to_school = true;
          this.statusCard.rejected_by_acad_dir = true;
          if (this.classData && this.classData.is_mentor_selected_in_job_description) {
            this.statusCard.sent_to_mentor = true;
            this.statusCard.validated_by_mentor = true;
          }
          if (this.isADMTC || this.isAcadDirAdmin || this.isStudent) {
            this.allowEditForm = true;
          }
          break;
        case 'validated_by_acad_staff':
        case 'expedite_by_acad_staff':
        case 'expedite_by_acad_staff_student':
          this.statusCard.sent_to_student = true;
          this.statusCard.sent_to_school = true;
          this.statusCard.validated_by_acad_staff = true;
          this.statusCard.expedite_by_acad_staff = true;
          this.statusCard.expedite_by_acad_staff_student = true;
          if (this.classData && this.classData.is_mentor_selected_in_job_description) {
            this.statusCard.sent_to_mentor = true;
            this.statusCard.validated_by_mentor = true;
          }
          if (this.isADMTC || this.isAcadDirAdmin) {
            this.allowEditForm = true;
          }
          break;
        default:
          break;
      }
    }

  }

  getRejectionArray(): UntypedFormArray {
    return this.jobDescForm.get('job_desc_rejections') as UntypedFormArray;
  }

  getMissionActivityArray(): UntypedFormArray {
    return this.jobDescForm.get('old_job_desc').get('missions_activities_autonomy') as UntypedFormArray;
  }

  getExpectedStudentArray(): UntypedFormArray {
    return this.jobDescForm.get('old_job_desc').get('expected_from_the_students') as UntypedFormArray;
  }

  getKnowledge(): UntypedFormArray {
    return this.jobDescForm.get('old_job_desc').get('knowledges') as UntypedFormArray;
  }

  getKnowHow(): UntypedFormArray {
    return this.jobDescForm.get('old_job_desc').get('know_how') as UntypedFormArray;
  }

  getObjectiveDepartment(): UntypedFormArray {
    return this.jobDescForm.get('old_job_desc').get('objectives_of_the_department') as UntypedFormArray;
  }

  addMissionActivityToForm() {
    this.getMissionActivityArray().push(this.initMissionActivityAutonomyForm());
  }

  addExpectedStudentForm() {
    this.getExpectedStudentArray().push(this.initExpectedStudentForm());
  }

  addKnowledge() {
    this.getKnowledge().push(this.initKnowledges());
  }

  addKnowHow() {
    this.getKnowHow().push(this.initKnowHow());
  }

  addObjectiveDepartment() {
    this.getObjectiveDepartment().push(this.initObjective());
  }

  removeMissionActivityFromForm(missionIndex) {
    const emptyMission = JSON.stringify(this.initMissionActivityAutonomyForm().value);
    const selectedMission = JSON.stringify(this.getMissionActivityArray().at(missionIndex).value);

    if (emptyMission !== selectedMission) {
      let timeDisabled = 5;
      Swal.fire({
        title: this.translate.instant('DASHBOARD_DELETE.deletedTitle'),
        html: this.translate.instant('this action will delete Mission Activity Entry !'),
        footer: `<span style="margin-left: auto">DASHBOARD_DELETE</span>`,
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
          this.intVal = setInterval(() => {
            timeDisabled -= 1;
            confirmBtnRef.innerText = this.translate.instant('DELETE_ITEM_TEMPLATE.BUTTON_1') + ` (${timeDisabled})`;
          }, 1000);
          clearInterval(this.timeOutVal);
          this.timeOutVal = setTimeout(() => {
            confirmBtnRef.innerText = this.translate.instant('DELETE_ITEM_TEMPLATE.BUTTON_1');
            Swal.enableConfirmButton();
            clearInterval(this.intVal);
            clearTimeout(this.timeOutVal);
          }, timeDisabled * 1000);
        },
      }).then((res) => {
        clearTimeout(this.timeOutVal);
        if (res.value) {
          this.getMissionActivityArray().removeAt(missionIndex);
        }
      });
    } else {
      this.getMissionActivityArray().removeAt(missionIndex);
    }
  }

  removeKnowHow(expectedIndex: number) {
    this.getKnowHow().removeAt(expectedIndex);
  }

  removeObjectiveDepartment(expectedIndex: number) {
    this.getObjectiveDepartment().removeAt(expectedIndex);
  }

  removeKnowledge(expectedIndex: number) {
    this.getKnowledge().removeAt(expectedIndex);
  }

  removeExpectedStudent(expectedIndex: number) {
    this.getExpectedStudentArray().removeAt(expectedIndex);
  }

  addRejectionForm() {
    this.getRejectionArray().push(this.initRejectionForm());
  }

  saveForm() {
    const payload = this.createPayload();

    let timeDisabled = 10;
    this.subs.sink = this.jobDescService
      .updateJobDescription(payload, this.studentData.job_description_id._id, this.translate.currentLang)
      .subscribe((resp) => {

        Swal.fire({
          type: 'success',
          title: this.translate.instant('JOBDESC_S9.TITLE'),
          html: this.translate.instant('JOBDESC_S9.TEXT'),
          footer: `<span style="margin-left: auto">JOBDESC_S9</span>`,
          confirmButtonText: this.translate.instant('JOBDESC_S9.BUTTON'),
          allowEnterKey: false,
          allowEscapeKey: false,
          allowOutsideClick: false,
          onOpen: () => {
            Swal.disableConfirmButton();
            const confirmBtnRef = Swal.getConfirmButton();
            const time = setInterval(() => {
              timeDisabled -= 1;
              confirmBtnRef.innerText = this.translate.instant('JOBDESC_S9.BUTTON') + ` (${timeDisabled})`;
            }, 1000);

            setTimeout(() => {
              confirmBtnRef.innerText = this.translate.instant('JOBDESC_S9.BUTTON');
              Swal.enableConfirmButton();
              clearTimeout(time);
            }, timeDisabled * 1000);
          },
        });
      });
  }

  submitForm(type) {
    // this.translate.currentLang;
    if (this.jobDescForm.invalid) {
      this.formInvalidSwal();
    } else {
      const payload = this.createPayload();

      if (type === 'mentor') {
        Swal.fire({
          title: this.translate.instant('JOBDESC_S3.TITLE'),
          text: this.translate.instant('JOBDESC_S3.TEXT'),
          footer: `<span style="margin-left: auto">JOBDESC_S3</span>`,
          type: 'warning',
          allowEscapeKey: true,
          showCancelButton: true,
          confirmButtonText: this.translate.instant('JOBDESC_S3.BUTTON_1'),
          cancelButtonText: this.translate.instant('JOBDESC_S3.BUTTON_2'),
          allowOutsideClick: false,
          allowEnterKey: false,
        }).then((res) => {
          if (res.value) {
            this.subs.sink = this.jobDescService
              .updateJobDescription(payload, this.studentData.job_description_id._id, this.translate.currentLang)
              .subscribe((resp) => {

                if (resp) {
                  this.subs.sink = this.jobDescService
                    .submitStudentFormEval(this.studentData.job_description_id._id, this.translate.currentLang)
                    .subscribe((response) => {

                      if (response) {
                        Swal.fire({
                          type: 'success',
                          title: this.translate.instant('JOBDESC_S3B.TITLE'),
                          text: this.translate.instant('JOBDESC_S3B.TEXT'),
                          footer: `<span style="margin-left: auto">JOBDESC_S3B</span>`,
                          confirmButtonText: this.translate.instant('JOBDESC_S3B.BUTTON'),
                          allowEnterKey: false,
                          allowEscapeKey: false,
                          allowOutsideClick: false,
                        }).then((responseSwal) => {
                          this.getDataInit();
                        });
                      }
                    });
                }
              });
          }
        });
      } else if (type === 'academic') {
        Swal.fire({
          title: this.translate.instant('JOBDESC_S4.TITLE'),
          text: this.translate.instant('JOBDESC_S4.TEXT'),
          footer: `<span style="margin-left: auto">JOBDESC_S4</span>`,
          type: 'warning',
          allowEscapeKey: true,
          showCancelButton: true,
          confirmButtonText: this.translate.instant('JOBDESC_S4.BUTTON_1'),
          cancelButtonText: this.translate.instant('JOBDESC_S4.BUTTON_2'),
          allowOutsideClick: false,
          allowEnterKey: false,
        }).then((res) => {
          if (res.value) {
            this.subs.sink = this.jobDescService
              .updateJobDescription(payload, this.studentData.job_description_id._id, this.translate.currentLang)
              .subscribe((resp) => {

                if (resp) {
                  this.subs.sink = this.jobDescService
                    .submitStudentFormEval(this.studentData.job_description_id._id, this.translate.currentLang)
                    .subscribe((response) => {

                      if (response) {
                        Swal.fire({
                          type: 'success',
                          title: this.translate.instant('JOBDESC_S4B.TITLE'),
                          html: this.translate.instant('JOBDESC_S4B.TEXT'),
                          footer: `<span style="margin-left: auto">JOBDESC_S4B</span>`,
                          confirmButtonText: this.translate.instant('JOBDESC_S4B.BUTTON'),
                          allowEnterKey: false,
                          allowEscapeKey: false,
                          allowOutsideClick: false,
                        }).then((responseSwal) => {
                          this.getDataInit();
                        });
                      }
                    });
                }
              });
          }
        });
      } else {
        this.subs.sink = this.jobDescService
          .updateJobDescription(payload, this.studentData.job_description_id._id, this.translate.currentLang)
          .subscribe((resp) => {

            if (resp) {
              this.subs.sink = this.jobDescService
                .submitStudentFormEval(this.studentData.job_description_id._id, this.translate.currentLang)
                .subscribe((response) => {

                  if (response) {
                    Swal.fire({
                      type: 'success',
                      title: this.translate.instant('JOBDESC_S10.TITLE'),
                      text: this.translate.instant('JOBDESC_S10.TEXT'),
                      footer: `<span style="margin-left: auto">JOBDESC_S10</span>`,
                      confirmButtonText: this.translate.instant('JOBDESC_S10.BUTTON'),
                      allowEnterKey: false,
                      allowEscapeKey: false,
                      allowOutsideClick: false,
                    }).then((responseSwal) => {
                      this.getDataInit();
                    });
                  }
                });
            }
          });
      }
    }
  }

  formInvalidSwal() {
    Swal.fire({
      type: 'error',
      title: this.translate.instant('TMTC_S02.TITLE'),
      text: this.translate.instant('TMTC_S02.TEXT'),
      footer: `<span style="margin-left: auto">TMTC_S02</span>`,
      confirmButtonText: this.translate.instant('TMTC_S02.BUTTON_1'),
      allowOutsideClick: false,
    });
    this.jobDescForm.markAllAsTouched();
  }

  rejectForm() {
    this.dialog
      .open(RejectionReasonDialogComponent, {
        width: '600px',
        minHeight: '300px',
        panelClass: 'certification-rule-pop-up',
        disableClose: true,
      })
      .afterClosed()
      .subscribe((respReason) => {

        if (respReason && respReason.submit) {
          const jobDescId = this.studentData.job_description_id._id;
          const currentLang = this.translate.currentLang;
          const reason = respReason.reason;
          const date = {
            date: this.parseLocalToUTCPipe.transformDate(moment().format('DD/MM/YYYY'), '00:01'),
            time: this.parseLocalToUTCPipe.transform('00:01'),
          };
          const payload = this.createPayload();
          payload.signature_of_the_acadir = false;

          this.subs.sink = this.jobDescService.updateJobDescription(payload, jobDescId, currentLang).subscribe((resp) => {

            if (resp) {
              this.subs.sink = this.jobDescService.rejectStudentFormEval(jobDescId, currentLang, reason, date).subscribe((response) => {

                if (response) {
                  Swal.fire({
                    type: 'success',
                    title: this.translate.instant('JOBDESC_S8.TITLE'),
                    text: this.translate.instant('JOBDESC_S8.TEXT', {
                      reason: reason,
                    }),
                    footer: `<span style="margin-left: auto">JOBDESC_S8</span>`,
                    confirmButtonText: this.translate.instant('JOBDESC_S8.BUTTON'),
                    allowEnterKey: false,
                    allowEscapeKey: false,
                    allowOutsideClick: false,
                  }).then((responseSwal) => {
                    this.getDataInit();
                  });
                }
              });
            }
          });
        }
      });
  }

  createPayload() {
    const payload = _.cloneDeep(this.jobDescForm.value);

    if (this.jobDescForm.get('rncp_id').value === null) {
      this.jobDescForm.get('rncp_id').setValue(this.titleId);
    }
    if (this.jobDescForm.get('school_id').value === null) {
      this.jobDescForm.get('school_id').setValue(this.schoolId);
    }

    if (payload.date_of_the_mission) {
      payload.date_of_the_mission.from.date = this.parseLocalToUTCPipe.transformDate(
        moment(payload.date_of_the_mission.from.date).format('DD/MM/YYYY'),
        '00:01',
      );
      payload.date_of_the_mission.to.date = this.parseLocalToUTCPipe.transformDate(
        moment(payload.date_of_the_mission.to.date).format('DD/MM/YYYY'),
        '23:59',
      );
      payload.date_of_the_mission.from.time = this.parseLocalToUTCPipe.transform('00:01');
      payload.date_of_the_mission.to.time = this.parseLocalToUTCPipe.transform('23:59');
    }

    if (payload.job_desc_rejections && payload.job_desc_rejections.length) {
      payload.job_desc_rejections.forEach((reason) => {
        if (reason.rejection_date) {
          reason.rejection_date.date = this.parseLocalToUTCPipe.transformDate(
            moment(reason.rejection_date.date).format('DD/MM/YYYY'),
            reason.rejection_date.time,
          );
          reason.rejection_date.time = this.parseLocalToUTCPipe.transform(reason.rejection_date.time);
        }
      });
    }

    if (payload.old_job_desc.know_how && payload.old_job_desc.know_how.length) {
      const dataMap = [];
      payload.old_job_desc.know_how.forEach((know) => {
        dataMap.push(know.know_how);
      });
      payload.old_job_desc.know_how = dataMap;
    }

    if (payload.old_job_desc.knowledges && payload.old_job_desc.knowledges.length) {
      const dataMap = [];
      payload.old_job_desc.knowledges.forEach((know) => {
        dataMap.push(know.knowledges);
      });
      payload.old_job_desc.knowledges = dataMap;
    }

    if (payload.old_job_desc.objectives_of_the_department && payload.old_job_desc.objectives_of_the_department.length) {
      const dataMap = [];
      payload.old_job_desc.objectives_of_the_department.forEach((objective) => {
        dataMap.push(objective.objectives_of_the_department);
      });
      payload.old_job_desc.objectives_of_the_department = dataMap;
    }

    return payload;
  }

  openUploadWindow() {
    this.fileUploaderDoc.nativeElement.click();
  }

  uploadFile(fileInput: Event) {
    this.isWaitingForResponse = true;
    const file = (<HTMLInputElement>fileInput.target).files[0];


    // *************** Accept Reject File Upload outside allowed accept
    const acceptable = ['doc', 'docx', 'ppt', 'pptx', 'txt', 'pdf', 'xlsx', 'xls'];
    const fileType = this.utilService.getFileExtension(file.name).toLocaleLowerCase();

    if (acceptable.includes(fileType)) {
      // this.file = (<HTMLInputElement>fileInput.target).files[0];
      this.subs.sink = this.fileUploadService.singleUpload(file).subscribe((resp) => {
        this.isWaitingForResponse = false;
        if (resp) {
          this.jobDescForm.get('company_presentation').get('file_name').patchValue(resp.file_name);
          this.jobDescForm.get('company_presentation').get('file_url').patchValue(resp.file_url);
        }
      });
    } else {
      this.isWaitingForResponse = false;
      Swal.fire({
        type: 'error',
        title: this.translate.instant('UPLOAD_ERROR.WRONG_TYPE_TITLE'),
        text: this.translate.instant('UPLOAD_ERROR.WRONG_TYPE_TEXT', { file_exts: '.doc, .docx, .ppt, .pptx, .txt, .pdf, .xlsx, .xls' }),
        footer: `<span style="margin-left: auto">UPLOAD_ERROR</span>`,
        allowEscapeKey: false,
        allowOutsideClick: false,
        allowEnterKey: false,
      });
    }
  }

  openFullScreen() {
    if (this.isStudent) {
      window.open(
        `./my-file?school=${this.schoolId}&student=${this.studentId}&title=${this.titleId}&class=${this.classId}&type=jobfullscreen`,
        '_blank',
      );
    } else if (this.isMentor) {
      window.open(
        `./students-card?school=${this.schoolId}&student=${this.studentId}&title=${this.titleId}&class=${this.classId}&type=jobfullscreen`,
        '_blank',
      );
    } else {
      window.open(
        `./school/${this.schoolId}?student=${this.studentId}&title=${this.titleId}&class=${this.classId}&type=jobfullscreen`,
        '_blank',
      );
    }
  }

  showSignature(isStudent: boolean, signatureValue: boolean) {
    let result = true;
    if (isStudent) {
      result = false;
      if (signatureValue) {
        result = true;
      }
    }
    return result;
  }

  translateDate(date: any) {
    if (date) {
      return moment(date).format('DD/MM/YYYY');
    } else {
      return moment().format('DD/MM/YYYY');
    }
  }
  downloadFile(fileUrl: string) {
    window.open(fileUrl, '_blank');
  }
  onScroll(event) {
    this.scrollEvent = event;
  }
  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  exportPdf() {

    const html = STYLE + this.jobDescriptionPDF.getPdfHtml();
    const filename = `Student Job Description PDF`;
    this.transcriptBuilderService.generatePdf(html, filename).subscribe((res: any) => {
      const link = document.createElement('a');
      link.setAttribute('type', 'hidden');
      link.download = res.filename;
      link.href = environment.PDF_SERVER_URL + res.filePath;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      link.remove();
    });

    // this.subs.sink = this.transcriptBuilderService.generateJobDescPDF(this.jobDescData._id, this.studentId).subscribe((data: any) => {

    //   const link = document.createElement('a');
    //   link.setAttribute('type', 'hidden');
    //   // link.download = data;
    //   link.href = `${environment.apiUrl}/fileuploads/${data}`.replace('/graphql', '');
    //   link.target = '_blank';
    //   // document.body.appendChild(link);
    //   link.click();
    //   link.remove();
    // });
  }
}
