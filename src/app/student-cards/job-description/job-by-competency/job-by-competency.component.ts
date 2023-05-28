import { CertidegreeService } from './../../../service/certidegree/certidegree.service';
import {
  Component,
  OnInit,
  Output,
  Input,
  EventEmitter,
  OnDestroy,
  OnChanges,
  ViewChild,
  ElementRef,
  AfterViewChecked,
} from '@angular/core';
import { AbstractControl, UntypedFormArray, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import * as _ from 'lodash';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { DateAdapter } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { AuthService } from 'app/service/auth-service/auth.service';
import { CompanyService } from 'app/service/company/company.service';
import { MailboxService } from 'app/service/mailbox/mailbox.service';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import { SchoolService } from 'app/service/schools/school.service';
import { StudentsService } from 'app/service/students/students.service';
import { ParseLocalToUtcPipe } from 'app/shared/pipes/parse-local-to-utc.pipe';
import { ParseStringDatePipe } from 'app/shared/pipes/parse-string-date.pipe';
import { ParseUtcToLocalPipe } from 'app/shared/pipes/parse-utc-to-local.pipe';
import { SubSink } from 'subsink';
import { forkJoin } from 'rxjs';
import { removeSpaces, requiredIfValidator, requiredTrueIfValidator } from 'app/service/customvalidator.validator';
import { UtilityService } from 'app/service/utility/utility.service';
import Swal from 'sweetalert2';
import { FileUploadService } from 'app/service/file-upload/file-upload.service';
import * as moment from 'moment';
import { JobDescService } from 'app/service/job-desc/job-desc.service';
import { RejectionReasonDialogComponent } from '../rejection-reason-dialog/rejection-reason-dialog.component';
import { Router } from '@angular/router';
import { JobPDFComponent } from '../job-description-pdf/job-description-pdf.component';
import { TranscriptBuilderService } from 'app/service/transcript-builder/transcript-builder.service';
import { STYLE } from 'app/title-rncp/conditions/class-condition/score/second-step-score/condition-score-preview/pdf-styles';
import { environment } from 'environments/environment';

@Component({
  selector: 'ms-job-by-competency',
  templateUrl: './job-by-competency.component.html',
  styleUrls: ['./job-by-competency.component.scss'],
  providers: [ParseStringDatePipe, ParseLocalToUtcPipe, ParseUtcToLocalPipe],
})
export class JobDescCompetencyComponent implements OnInit, OnDestroy, OnChanges {
  private subs = new SubSink();
  @Input() studentId = '';
  @Input() studentPrevCourseData: any;
  @Input() schoolId: string;
  @Input() classId: string;
  @Input() titleId: string;
  @Input() jobDescriptionId: string;
  @Input() typeDisplay: boolean;
  @Output() continue = new EventEmitter<boolean>();

  @ViewChild('fileUploadDoc', { static: false }) fileUploaderDoc: ElementRef;
  @ViewChild('jobDescriptionPDF', { static: false }) jobDescriptionPDF: JobPDFComponent;

  jobDescriptionType = 'competence';

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
  jobDescTemp;

  autonomyLevel = ['Decide Alone', 'Decide After Info', 'Decide After Approval', 'Execute'];
  industrySectorList = [];

  intVal: any;
  timeOutVal: any;
  routeInfo: any;

  isStudent = false;
  isADMTC = false;
  isMentor = false;
  isAcadDirAdmin = false;
  allowEditForm = false;

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
    private certieDegreeService: CertidegreeService,
  ) {
    this.industrySectorList = this.jobDescService.getIndustrySectorList();
  }

  ngOnInit() {
    this.dateAdapter.setLocale(this.translate.currentLang);
    this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      this.dateAdapter.setLocale(this.translate.currentLang);
    });
    this.getDataInit();
  }

  ngOnChanges() {
    this.jobDescTemp = null;
    this.subs.unsubscribe();
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
    forkParam.push(this.rncpTitleService.getAllBlockOfCompetenceTemplate(this.titleId, this.classId, this.studentId));

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
            const tempData = this.studentPrevCourseData ? _.cloneDeep(response[count][0]) : _.cloneDeep(response[count]);
            if (this.jobDescriptionId) {
              if (tempData && tempData.companies && tempData.companies.length) {
                tempData.companies = tempData.companies.filter(
                  (company) => company.job_description_id && company.job_description_id._id === this.jobDescriptionId,
                );
              }
            } else {
              if (tempData && tempData.companies && tempData.companies.length) {
                tempData.companies = tempData.companies.filter((company) => company.status === 'active');
              }
            }
            this.studentData = tempData;
            count++;
          }
          if (response[count]) {
            this.academicTemplate = _.cloneDeep(response[count]);
            count++;
          }
        }

        if (this.jobDescriptionId) {
          this.subs.sink = this.jobDescService.getOneJobDescEval(this.jobDescriptionId).subscribe((resp) => {

            this.jobDescData = _.cloneDeep(resp);

            // *************** Process the status of the job desc
            this.processStatusCard();

            // *************** Process the form
            const temp = _.cloneDeep(resp);
            this.initForm();
            if(this.jobDescData?.job_description_status === 'validated_by_acad_staff') {
              this.jobDescForm.disable();
            }

            if (temp && temp.rncp_id && temp.rncp_id._id) {
              temp.rncp_id = temp.rncp_id._id;
            }
            if (temp && temp.school_id && temp.school_id._id) {
              temp.school_id = temp.school_id._id;
            }
            if (temp && temp.student_id && temp.student_id._id) {
              temp.student_id = temp.student_id._id;
            }

            // ************** Previously user can input date mission and it will be populated. Now we use date of contract instead

            if (temp.date_of_the_mission && temp.date_of_the_mission.from && temp.date_of_the_mission && temp.date_of_the_mission.to) {
              if (temp.date_of_the_mission && temp.date_of_the_mission.from) {
                const startTime = temp.date_of_the_mission.from.time ? temp.date_of_the_mission.from.time : '15:59';
                temp.date_of_the_mission.from.date = this.parseStringDatePipe.transformStringToDate(
                  this.parseUTCToLocalPipe.transformDate(temp.date_of_the_mission.from.date, startTime),
                );
                temp.date_of_the_mission.from.time = this.parseUTCToLocalPipe.transform(startTime)
                  ? this.parseUTCToLocalPipe.transform(startTime)
                  : this.parseUTCToLocalPipe.transform('15:59');
                // temp.date_of_the_mission.from.time = this.parseUTCToLocalPipe.transform(temp.date_of_the_mission.from.time);
              }
              if (temp.date_of_the_mission && temp.date_of_the_mission.to) {
                const endTime = temp.date_of_the_mission.to.time ? temp.date_of_the_mission.to.time : '15:59';
                temp.date_of_the_mission.to.date = this.parseStringDatePipe.transformStringToDate(
                  this.parseUTCToLocalPipe.transformDate(temp.date_of_the_mission.to.date, endTime),
                );
                temp.date_of_the_mission.to.time = this.parseUTCToLocalPipe.transform(endTime)
                  ? this.parseUTCToLocalPipe.transform(endTime)
                  : this.parseUTCToLocalPipe.transform('15:59');
                // temp.date_of_the_mission.to.time = this.parseUTCToLocalPipe.transform(temp.date_of_the_mission.to.time);
              }
            } else {
              if (this.studentData.companies) {
                const activeCompany = _.find(this.studentData.companies, (company) => company.status === 'active');

                if (activeCompany && activeCompany.start_date && activeCompany.end_date) {
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

            if (temp && temp.block_of_template_competences && temp.block_of_template_competences.length) {
              // *************** If Data of block previously saved, then populate the block from here
              temp.block_of_template_competences.forEach((block, blockIndex) => {
                if (block && block.block_of_template_competence_id && block.block_of_template_competence_id._id) {
                  block.block_of_template_competence_id = block.block_of_template_competence_id._id;
                }
                this.getBlockTemplateArray().push(this.initBlockTemplateForm());
                if (block.competence_templates && block.competence_templates.length) {
                  block.competence_templates.forEach((competence, compIndex) => {
                    if (competence && competence.competence_template_id && competence.competence_template_id._id) {
                      competence.competence_template_id = competence.competence_template_id._id;
                    }
                    this.getCompetenceTemplateArray(blockIndex).push(this.initCompetenceTemplateForm());
                    if (
                      competence &&
                      competence.missions_activities_autonomy &&
                      competence.missions_activities_autonomy.length &&
                      !competence.is_mission_related_to_competence
                    ) {
                      competence.missions_activities_autonomy.forEach((mission) => {
                        this.getMissionActivityArray(blockIndex, compIndex).push(this.initMissionActivityAutonomyForm());
                      });
                    }
                  });
                }
              });
            } else {
              // *************** If Data of block never saved before, then get from template
              this.populateBlockTemplate();
            }

            const tempOmit = _.omitBy(temp, _.isNil);



            this.jobDescForm.patchValue(temp);
            this.jobDescTemp = this.jobDescForm.value;
            this.jobDescForm.valueChanges.subscribe((resp) => {
              this.isFormSame();
            });

          });
        } else {
          if (this.studentData && this.studentData.job_description_id && this.studentData.job_description_id._id) {
            this.subs.sink = this.jobDescService.getOneJobDescEval(this.studentData.job_description_id._id).subscribe((resp) => {

              this.jobDescData = _.cloneDeep(resp);
              // *************** Process the status of the job desc
              this.processStatusCard();

              // *************** Process the form
              const temp = _.cloneDeep(resp);
              this.initForm();
              if(this.jobDescData?.job_description_status === 'validated_by_acad_staff') {
                this.jobDescForm.disable();
              }


              if (temp && temp.rncp_id && temp.rncp_id._id) {
                temp.rncp_id = temp.rncp_id._id;
              }
              if (temp && temp.school_id && temp.school_id._id) {
                temp.school_id = temp.school_id._id;
              }
              if (temp && temp.student_id && temp.student_id._id) {
                temp.student_id = temp.student_id._id;
              }

              // ************** Previously user can input date mission and it will be populated. Now we use date of contract instead

              if (temp.date_of_the_mission && temp.date_of_the_mission.from && temp.date_of_the_mission && temp.date_of_the_mission.to) {
                if (temp.date_of_the_mission && temp.date_of_the_mission.from) {
                  const startTime = temp.date_of_the_mission.from.time ? temp.date_of_the_mission.from.time : '15:59';
                  temp.date_of_the_mission.from.date = this.parseStringDatePipe.transformStringToDate(
                    this.parseUTCToLocalPipe.transformDate(temp.date_of_the_mission.from.date, startTime),
                  );
                  temp.date_of_the_mission.from.time = this.parseUTCToLocalPipe.transform(startTime)
                    ? this.parseUTCToLocalPipe.transform(startTime)
                    : this.parseUTCToLocalPipe.transform('15:59');
                  // temp.date_of_the_mission.from.time = this.parseUTCToLocalPipe.transform(temp.date_of_the_mission.from.time);
                }
                if (temp.date_of_the_mission && temp.date_of_the_mission.to) {
                  const endTime = temp.date_of_the_mission.to.time ? temp.date_of_the_mission.to.time : '15:59';
                  temp.date_of_the_mission.to.date = this.parseStringDatePipe.transformStringToDate(
                    this.parseUTCToLocalPipe.transformDate(temp.date_of_the_mission.to.date, endTime),
                  );
                  temp.date_of_the_mission.to.time = this.parseUTCToLocalPipe.transform(endTime)
                    ? this.parseUTCToLocalPipe.transform(endTime)
                    : this.parseUTCToLocalPipe.transform('15:59');
                  // temp.date_of_the_mission.to.time = this.parseUTCToLocalPipe.transform(temp.date_of_the_mission.to.time);
                }
              } else {
                if (this.studentData.companies) {
                  const activeCompany = _.find(this.studentData.companies, (company) => company.status === 'active');

                  if (activeCompany && activeCompany.start_date && activeCompany.end_date) {
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

              if (temp && temp.block_of_template_competences && temp.block_of_template_competences.length) {
                // *************** If Data of block previously saved, then populate the block from here
                temp.block_of_template_competences = temp.block_of_template_competences.filter((block) => {
                  const templates = this.academicTemplate
                  return !templates || Boolean(templates?.find(template => {
                    return template?._id === (block?.block_of_template_competence_id?._id || block?.block_of_template_competence_id)
                  }))
                })
                temp.block_of_template_competences.forEach((block, blockIndex) => {
                  if (block && block.block_of_template_competence_id && block.block_of_template_competence_id._id) {
                    block.block_of_template_competence_id = block.block_of_template_competence_id._id;
                  }
                  this.getBlockTemplateArray().push(this.initBlockTemplateForm());
                  if (block.competence_templates && block.competence_templates.length) {
                    block.competence_templates.forEach((competence, compIndex) => {
                      if (competence && competence.competence_template_id && competence.competence_template_id._id) {
                        competence.competence_template_id = competence.competence_template_id._id;
                      }
                      this.getCompetenceTemplateArray(blockIndex).push(this.initCompetenceTemplateForm());
                      if (competence && !competence.is_mission_related_to_competence) {
                        if (competence && competence.missions_activities_autonomy && competence.missions_activities_autonomy.length) {
                          competence.missions_activities_autonomy.forEach((mission) => {
                            this.getMissionActivityArray(blockIndex, compIndex).push(this.initMissionActivityAutonomyForm());
                          });
                        } else {
                          this.getMissionActivityArray(blockIndex, compIndex).push(this.initMissionActivityAutonomyForm());
                        }
                      }
                    });
                  }
                });
              } else {
                // *************** If Data of block never saved before, then get from template
                this.populateBlockTemplate();
              }

              const tempOmit = _.omitBy(temp, _.isNil);



              this.jobDescForm.patchValue(temp);
              this.jobDescTemp = this.jobDescForm.value;
              this.jobDescForm.valueChanges.subscribe((resp) => {
                this.isFormSame();
              });

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
      rncp_id: [this.titleId, [Validators.required]],
      school_id: [this.schoolId, [Validators.required]],
      job_name: ['', [Validators.required]],
      student_id: [this.studentId, [Validators.required]],
      date_of_the_mission: this.fb.group({
        from: this.fb.group({
          date: ['', Validators.required],
          time: [this.parseUTCToLocalPipe.transform('15:59'), Validators.required],
        }),
        to: this.fb.group({
          date: ['', Validators.required],
          time: [this.parseUTCToLocalPipe.transform('15:59'), Validators.required],
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
      block_of_template_competences: this.fb.array([]),
      job_desc_rejections: this.fb.array([]),
    });
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

  initBlockTemplateForm() {
    return this.fb.group({
      block_of_template_competence_id: ['', [Validators.required]],
      competence_templates: this.fb.array([]),
    });
  }

  initCompetenceTemplateForm() {
    return this.fb.group({
      competence_template_id: ['', [Validators.required]],
      is_mission_related_to_competence: [false],
      missions_activities_autonomy: this.fb.array([]),
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

  addMissionActivityToForm(blockIndex, compIndex) {
    this.getMissionActivityArray(blockIndex, compIndex).push(this.initMissionActivityAutonomyForm());
  }

  addRejectionForm() {
    this.getRejectionArray().push(this.initRejectionForm());
  }

  removeMissionActivityFromForm(blockIndex, compIndex, missionIndex) {
    const emptyMission = JSON.stringify(this.initMissionActivityAutonomyForm().value);
    const selectedMission = JSON.stringify(this.getMissionActivityArray(blockIndex, compIndex).at(missionIndex).value);

    if (emptyMission !== selectedMission) {
      let timeDisabled = 5;
      Swal.fire({
        title: this.translate.instant('DASHBOARD_DELETE.deletedTitle'),
        html: this.translate.instant('this action will delete Mission Activity Entry !'),
        type: 'warning',
        allowEscapeKey: true,
        showCancelButton: true,
        confirmButtonText: this.translate.instant('THUMBSUP.SWEET_ALERT.CONFIRM', { timer: timeDisabled }),
        cancelButtonText: this.translate.instant('DASHBOARD_DELETE.NO'),
        footer: `<span style="margin-left: auto">DASHBOARD_DELETE</span>`,
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
          this.getMissionActivityArray(blockIndex, compIndex).removeAt(missionIndex);
        }
      });
    } else {
      this.getMissionActivityArray(blockIndex, compIndex).removeAt(missionIndex);
    }
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

  // *************** Called if form never saved before
  populateBlockTemplate() {
    if (this.academicTemplate && this.academicTemplate.length) {
      this.academicTemplate.forEach((block, blockIndex) => {
        this.getBlockTemplateArray().push(this.initBlockTemplateForm());
        this.getBlockTemplateArray().at(blockIndex).get('block_of_template_competence_id').patchValue(block._id);
        if (block.competence_templates_id && block.competence_templates_id.length) {
          block.competence_templates_id.forEach((competence, compIndex) => {
            this.getCompetenceTemplateArray(blockIndex).push(this.initCompetenceTemplateForm());
            this.getCompetenceTemplateArray(blockIndex).at(compIndex).get('competence_template_id').patchValue(competence._id);
            this.getMissionActivityArray(blockIndex, compIndex).push(this.initMissionActivityAutonomyForm());
          });
        }
      });
    }
  }

  getBlockTemplateArray(): UntypedFormArray {
    return this.jobDescForm.get('block_of_template_competences') as UntypedFormArray;
  }

  getCompetenceTemplateArray(blockIndex): UntypedFormArray {
    return this.getBlockTemplateArray().at(blockIndex).get('competence_templates') as UntypedFormArray;
  }

  getMissionActivityArray(blockIndex, compIndex): UntypedFormArray {
    return this.getCompetenceTemplateArray(blockIndex).at(compIndex).get('missions_activities_autonomy') as UntypedFormArray;
  }

  getRejectionArray(): UntypedFormArray {
    return this.jobDescForm.get('job_desc_rejections') as UntypedFormArray;
  }

  addMissionActivity(blockIndex: number, compIndex: number) {
    this.getMissionActivityArray(blockIndex, compIndex).push(this.initMissionActivityAutonomyForm());
  }

  removeMissionActivity(blockIndex: number, compIndex: number, missionIndex: number) {
    this.getMissionActivityArray(blockIndex, compIndex).removeAt(missionIndex);
  }

  createPayload() {
    const payload = _.cloneDeep(this.jobDescForm.value);


    if (payload.date_of_the_mission) {
      payload.date_of_the_mission.from.date = this.parseLocalToUTCPipe.transformDate(
        moment(payload.date_of_the_mission.from.date).format('DD/MM/YYYY'),
        payload.date_of_the_mission.from.time,
      );
      payload.date_of_the_mission.to.date = this.parseLocalToUTCPipe.transformDate(
        moment(payload.date_of_the_mission.to.date).format('DD/MM/YYYY'),
        payload.date_of_the_mission.to.time,
      );
      payload.date_of_the_mission.from.time = this.parseLocalToUTCPipe.transform(payload.date_of_the_mission.from.time);
      payload.date_of_the_mission.to.time = this.parseLocalToUTCPipe.transform(payload.date_of_the_mission.to.time);
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

    return payload;
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
          confirmButtonText: this.translate.instant('JOBDESC_S9.BUTTON'),
          footer: `<span style="margin-left: auto">JOBDESC_S9</span>`,
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
        }).then((resp) => {
          this.getDataInit();
        });
      });
  }

  getFormInvalid() {
    const invalidForm = [];
    Object.keys(this.jobDescForm.controls).forEach((controlEl) => {
      const control = this.jobDescForm.get(controlEl);
      if (control instanceof UntypedFormControl && !control.valid) {

        switch (controlEl) {
          case 'job_name':
            invalidForm.push(this.translate.instant('JOB_DESCRIPTION_TEXT.Job Name'));
            break;
          case 'main_mission_of_the_department':
            invalidForm.push(this.translate.instant('JOB_DESCRIPTION_TEXT.Main Mission Of The Department'));
            break;
          case 'organization_of_the_department':
            invalidForm.push(this.translate.instant('JOB_DESCRIPTION_TEXT.Organisation of the Department'));
            break;
          case 'main_mission':
            invalidForm.push(this.translate.instant('JOB_DESCRIPTION_TEXT.Main Mission'));
            break;
          case 'signature_of_the_student':
            invalidForm.push(this.translate.instant('JOB_DESCRIPTION_SIGNATURE.Signature For Student'));
            break;
          case 'signature_of_the_company_mentor':
            invalidForm.push(this.translate.instant('JOB_DESCRIPTION_SIGNATURE.Signature For Mentor'));
            break;
          case 'signature_of_the_acadir':
            invalidForm.push(this.translate.instant('JOB_DESCRIPTION_SIGNATURE.Signature For Acad Dir'));
            break;
          default:
            break;
        }
      } else if (control instanceof UntypedFormGroup && !control.valid) {
        switch (controlEl) {
          case 'date_of_the_mission':
            invalidForm.push(this.translate.instant('JOB_DESCRIPTION_TEXT.Date of Mission'));
            break;
        }
      } else if (control instanceof UntypedFormArray && !control.valid) {
        if (controlEl === 'block_of_template_competences') {
          Object.keys(control.controls).forEach((btc) => {
            const btcEl = control.get(btc);

            if (btcEl instanceof UntypedFormGroup && !btcEl.valid) {
              Object.keys(btcEl.controls).forEach((ct) => {

                if (ct === 'competence_templates') {
                  const ctEl = btcEl.get(ct);

                  if (ctEl instanceof UntypedFormArray && !ctEl.valid) {
                    Object.keys(ctEl.controls).forEach((maa) => {

                      const maaEl = ctEl.get(maa);
                      if (maaEl instanceof UntypedFormGroup && !maaEl.valid) {
                        Object.keys(maaEl.controls).forEach((element) => {
                          const field = maaEl.get(element);

                          if (element === 'missions_activities_autonomy') {
                            if (field instanceof UntypedFormArray && !field.valid) {
                              Object.keys(field.controls).forEach((maaArray) => {

                                const maaGroup = field.get(maaArray);

                                if (maaGroup instanceof UntypedFormGroup && !maaGroup.valid) {
                                  Object.keys(maaGroup.controls).forEach((maaControl) => {

                                    const block = maaGroup.get(maaControl);
                                    if (block instanceof UntypedFormControl && !block.valid) {
                                      switch (maaControl) {
                                        case 'mission':
                                          invalidForm.push(this.translate.instant('mission'));
                                          break;
                                        case 'activity':
                                          invalidForm.push(this.translate.instant('activity'));
                                          break;
                                        case 'autonomy_level':
                                          invalidForm.push(this.translate.instant('autonomy level'));
                                          break;

                                        default:
                                          break;
                                      }
                                    }
                                  });
                                }
                              });
                            }
                          }
                        });
                      }
                    });
                  }
                }
              });
            }
          });
        }
      }
    });
    const formInvalid = _.uniqBy(invalidForm);
    return formInvalid;
  }

  submitForm(type) {
    // this.translate.currentLang;
    if (this.jobDescForm.invalid) {
      const formInvalid = this.getFormInvalid();
      let li = '';
      formInvalid.forEach((item) => {
        return (li = li + `<li>${item}</li>`);
      });
      const formatTextSwal = `<ul style="text-align: start;">${li}</ul>`;
      this.formInvalidSwal(formatTextSwal);
    } else {
      const payload = this.createPayload();

      if (type === 'mentor') {
        Swal.fire({
          title: this.translate.instant('JOBDESC_S3.TITLE'),
          text: this.translate.instant('JOBDESC_S3.TEXT'),
          type: 'warning',
          allowEscapeKey: true,
          showCancelButton: true,
          confirmButtonText: this.translate.instant('JOBDESC_S3.BUTTON_1'),
          cancelButtonText: this.translate.instant('JOBDESC_S3.BUTTON_2'),
          footer: `<span style="margin-left: auto">JOBDESC_S3</span>`,
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

  formInvalidSwal(formatTextSwal) {
    Swal.fire({
      type: 'error',
      title: this.translate.instant('TMTC_S02.TITLE'),
      html: `${this.translate.instant('TMTC_S02.TEXT')} <br><br>
             ${this.translate.instant('Required section')} : <br> 
             ${formatTextSwal}`,
      footer: `<span style="margin-left: auto">TMTC_S02</span>`,
      confirmButtonText: this.translate.instant('TMTC_S02.BUTTON_1'),
      allowOutsideClick: false,
    });
    this.jobDescForm.markAllAsTouched();
  }

  rejectForm() {
    this.dialog
      .open(RejectionReasonDialogComponent, {
        width: '800px',
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

  openUploadWindow() {
    this.fileUploaderDoc.nativeElement.click();
  }

  translateDate(date: any) {
    if (date) {
      return moment(date).format('DD/MM/YYYY');
    } else {
      return moment().format('DD/MM/YYYY');
    }
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

  downloadFile(fileUrl: string) {
    window.open(fileUrl, '_blank');
  }

  onScroll(event) {
    this.scrollEvent = event;
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

  allowMissionChange(event: MatCheckboxChange, blockIndex: number, compIndex: number) {

    const mission = this.getMissionActivityArray(blockIndex, compIndex).value;

    if (event.checked) {
      if (mission && mission.length) {
        this.getMissionActivityArray(blockIndex, compIndex).clear();
      }
    } else {
      if (mission && mission.length === 0) {
        this.addMissionActivityToForm(blockIndex, compIndex);
      }
    }
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
  exportPdf() {

    const html = STYLE + this.jobDescriptionPDF.getPdfCompetenceHtml();
    const filename = `Student Job Description PDF`;

    this.subs.sink = this.transcriptBuilderService.generateJobDescPDF(this.jobDescData._id, this.studentId).subscribe((data: any) => {

      const link = document.createElement('a');
      link.setAttribute('type', 'hidden');
      // link.download = data;
      link.href = `${environment.apiUrl}/fileuploads/${data}`.replace('/graphql', '');
      link.target = '_blank';
      // document.body.appendChild(link);
      link.click();
      link.remove();
    });
    // this.transcriptBuilderService.generatePdf(html, filename).subscribe((res: any) => {
    //   const link = document.createElement('a');
    //   link.setAttribute('type', 'hidden');
    //   link.download = res.filename;
    //   link.href = environment.PDF_SERVER_URL + res.filePath;
    //   link.target = '_blank';
    //   document.body.appendChild(link);
    //   link.click();
    //   link.remove();
    // });
  }
}
