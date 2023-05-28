import { CertidegreeService } from './../../../service/certidegree/certidegree.service';
import { Component, Input, OnChanges, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ProblematicService } from 'app/service/problematic/problematic.service';
import { SubSink } from 'subsink';
import * as _ from 'lodash';
import { RespProblematicImported } from '../problematic.model';
import { StudentsService } from 'app/service/students/students.service';

import * as DecoupledEditor from 'assets/ckeditor5-custom/ckeditor.js'
import { UtilityService } from 'app/service/utility/utility.service';
import { TranslateService } from '@ngx-translate/core';
import Swal from 'sweetalert2';
import { ProblematicRejectionDialogComponent } from 'app/shared/components/problematic-rejection-dialog/problematic-rejection-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { requiredTrueIfValidator } from 'app/service/customvalidator.validator';
import { ParseLocalToUtcPipe } from 'app/shared/pipes/parse-local-to-utc.pipe';
import * as moment from 'moment';
import { ParseStringDatePipe } from 'app/shared/pipes/parse-string-date.pipe';
import { ParseUtcToLocalPipe } from 'app/shared/pipes/parse-utc-to-local.pipe';
import { ProblematicPDFComponent } from '../problematic-pdf/problematic-pdf.component';
import { STYLE } from 'app/title-rncp/conditions/class-condition/score/second-step-score/condition-score-preview/pdf-styles';
import { environment } from 'environments/environment';
import { TranscriptBuilderService } from 'app/service/transcript-builder/transcript-builder.service';

@Component({
  selector: 'ms-imported-problematic-form',
  templateUrl: './imported-problematic-form.component.html',
  styleUrls: ['./imported-problematic-form.component.scss'],
  providers: [ParseLocalToUtcPipe, ParseUtcToLocalPipe, ParseStringDatePipe],
})
export class ImportedProblematicFormComponent implements OnInit, OnDestroy, OnChanges {
  private subs = new SubSink();
  @Input() studentId = '';
  @Input() studentPrevCourseData?: any;
  @Input() schoolId: string;
  @Input() classId: string;
  @Input() titleId: string;
  @Input() historyData: string;
  @Input() problematicId: string;
  problematicTemp

  problematicForm: UntypedFormGroup;
  @ViewChild('problematicPDF', { static: false }) problematicPDF: ProblematicPDFComponent;
  problematicType = 'import';
  studentData;
  problematicData;
  statusCard = {
    sent_to_student: false,
    sent_to_acadDpt: false,
    rejected_by_acadDpt: false,
    validated_by_acadDpt: false,
    sent_to_certifier: false,
    rejected_by_certifier: false,
    validated_by_certifier: false,
    resubmitted_to_certifier: false,
  };

  IsFinalTranscriptStarted = false;
  isStudent = false;
  isADMTC = false;
  isAcadDirAdmin = false;
  isCertifierDirAdmin = false;
  allowEditForm = false;

  public Editor = DecoupledEditor;
  public onReady(editor) {
    editor.ui.getEditableElement().parentElement.insertBefore(editor.ui.view.toolbar.element, editor.ui.getEditableElement());
  }

  constructor(
    private problematicService: ProblematicService,
    private fb: UntypedFormBuilder,
    private studentService: StudentsService,
    public utilService: UtilityService,
    private translate: TranslateService,
    public dialog: MatDialog,
    private parseStringDatePipe: ParseStringDatePipe,
    private parseLocalToUTCPipe: ParseLocalToUtcPipe,
    private parseUTCToLocalPipe: ParseUtcToLocalPipe,
    private transcriptBuilderService: TranscriptBuilderService,
    private certieDegreeService: CertidegreeService
  ) {}

  ngOnInit() {
    this.getDataInit();
    this.checkFinalTranscripsIsStarted();
  }

  ngOnChanges() {
    this.subs.unsubscribe();
    this.getDataInit();
  }

  getDataInit() {
    // ************ Get Data User for permission of button
    this.isADMTC = this.utilService.isUserEntityADMTC();
    this.isAcadDirAdmin = this.utilService.isUserAcadDirAdmin();
    this.isCertifierDirAdmin = this.utilService.isUserCRDirAdmin();
    this.isStudent = this.utilService.isUserStudent();

    // this.initForm();
    this.getStudentData();
    this.getProblematicData();
    this.getProblematicCorrectorData();
  }

  initForm() {
    this.problematicForm = this.fb.group({
      student_id: [this.studentId, [Validators.required]],
      school_id: [this.schoolId, [Validators.required]],
      rncp_id: [this.titleId, [Validators.required]],
      class_id: [this.classId, [Validators.required]],
      date: this.fb.group({
        date_utc: moment().format('DD/MM/YYYY'),
        time_utc: ['00:01'],
      }),
      question_1: this.initQuestionFormGroup(),
      question_2: this.initQuestionFormGroup(),
      question_3: this.initQuestionFormGroup(),
      general_comments: this.fb.array([]),
      signature_of_the_student: [
        false,
        [requiredTrueIfValidator(() => this.problematicData && this.problematicData.problematic_status === 'sent_to_student')],
      ],
      signature_of_the_acad_dir: [
        false,
        [requiredTrueIfValidator(() => this.problematicData && this.problematicData.problematic_status === 'sent_to_acadDpt')],
      ],
      signature_of_the_certifier: [
        false,
        [requiredTrueIfValidator(() => this.problematicData && this.problematicData.problematic_status === 'sent_to_certifier')],
      ],
    });
    this.problematicForm.valueChanges.subscribe(resp=>{
      this.isFormSame()
    })
  }
  isFormSame() {
    const secondForm = JSON.stringify(this.problematicTemp);
    const formType = JSON.stringify(this.problematicForm.value);
    if (secondForm === formType) {
      this.certieDegreeService.childrenFormValidationStatus = true;
      return true;
    } else {
      this.certieDegreeService.childrenFormValidationStatus = false;
      return false;
    }
  }

  initQuestionFormGroup() {
    return this.fb.group({
      question: [''],
      answer: [''],
      comments: this.fb.array([]),
    });
  }

  initCommentFormGroup() {
    return this.fb.group({
      comment: [''],
      date: this.fb.group({
        date_utc: moment().format('DD/MM/YYYY'),
        time_utc: ['00:01'],
      }),
    });
  }

  getStudentData() {
    if (this.studentPrevCourseData) {
      this.subs.sink = this.studentService.getStudentsPreviousCourseJobDescIdentityData(
        this.schoolId,
        this.studentPrevCourseData.rncp_title._id,
        this.studentPrevCourseData.current_class._id,
        this.studentId,
      ).subscribe((resp_student) => {
        // student's previous course data
        if (resp_student && resp_student[0]) {
          const tempData = _.cloneDeep(resp_student[0]);
          this.setStudentData(tempData);
        }
      });
    } else {
      this.subs.sink = this.studentService.getStudentsJobDescIdentityData(this.studentId).subscribe((resp_student) => {
        const tempData = _.cloneDeep(resp_student);
        this.setStudentData(tempData);
      });
    }
  }

  setStudentData(tempData) {
    if (this.historyData) {
      tempData.companies = tempData.companies.filter(
        (company) => company.problematic_id && company.problematic_id._id === this.problematicId,
      );
    } else {
      if (tempData && tempData.companies && tempData.companies.length) {
        tempData.companies = tempData.companies.filter((company) => company.status === 'active');
      }
    }
    this.studentData = tempData;
  }

  getProblematicData() {
    this.subs.sink = this.problematicService.getOneProblematicImported(this.problematicId).subscribe((resp_prob) => {


      this.problematicData = _.cloneDeep(resp_prob);
      this.initForm();

      // *************** Process the status of the job desc
      this.processStatusCard();

      const formattedData = this.formatProblematic(_.cloneDeep(resp_prob));

      this.problematicForm.patchValue(formattedData);
      this.problematicTemp = this.problematicForm.value




    });
  }

  getProblematicCorrectorData() {
    const currentUser = this.utilService.getCurrentUser();
    this.subs.sink = this.problematicService.getAllProblematicCorrector(this.titleId, this.schoolId, currentUser._id).subscribe((resp) => {

      if (resp && resp.length) {
        this.isCertifierDirAdmin = true;
      }
    });
  }

  getGeneralCommentsArray(): UntypedFormArray {
    return this.problematicForm.get('general_comments') as UntypedFormArray;
  }

  getQuestion1CommentArray(): UntypedFormArray {
    return this.problematicForm.get('question_1').get('comments') as UntypedFormArray;
  }

  getQuestion2CommentArray(): UntypedFormArray {
    return this.problematicForm.get('question_2').get('comments') as UntypedFormArray;
  }

  getQuestion3CommentArray(): UntypedFormArray {
    return this.problematicForm.get('question_3').get('comments') as UntypedFormArray;
  }

  formatProblematic(resp_prob: RespProblematicImported) {
    const temp: any = resp_prob;
    if (temp.student_id && temp.student_id._id) {
      temp.student_id = temp.student_id._id;
    }
    if (temp.school_id && temp.school_id._id) {
      temp.school_id = temp.school_id._id;
    }
    if (temp.rncp_id && temp.rncp_id._id) {
      temp.rncp_id = temp.rncp_id._id;
    }
    if (temp.class_id && temp.class_id._id) {
      temp.class_id = temp.class_id._id;
    }

    if (temp.date && temp.date.date_utc && temp.date.time_utc) {
      temp.date = {
        date_utc: this.parseUTCToLocalPipe.transformDate(temp.date.date_utc, temp.date.time_utc),
        time_utc: this.parseUTCToLocalPipe.transform(temp.date.time_utc),
      };
    } else {
      delete temp.date;
    }

    if (temp.question_1 && temp.question_1.comments && temp.question_1.comments.length) {
      temp.question_1.comments.forEach((comment) => {
        this.getQuestion1CommentArray().push(this.initCommentFormGroup());
        if (comment.date && comment.date.date_utc && comment.date.time_utc) {
          comment.date = {
            date_utc: this.parseUTCToLocalPipe.transformDate(comment.date.date_utc, comment.date.time_utc),
            time_utc: this.parseUTCToLocalPipe.transform(comment.date.time_utc),
          };
        } else {
          delete comment.date;
        }
      });
    }

    if (temp.question_2 && temp.question_2.comments && temp.question_2.comments.length) {
      temp.question_2.comments.forEach((comment) => {
        this.getQuestion2CommentArray().push(this.initCommentFormGroup());
        if (comment.date && comment.date.date_utc && comment.date.time_utc) {
          comment.date = {
            date_utc: this.parseUTCToLocalPipe.transformDate(comment.date.date_utc, comment.date.time_utc),
            time_utc: this.parseUTCToLocalPipe.transform(comment.date.time_utc),
          };
        } else {
          delete comment.date;
        }
      });
    }

    if (temp.question_3 && temp.question_3.comments && temp.question_3.comments.length) {
      temp.question_3.comments.forEach((comment) => {
        this.getQuestion3CommentArray().push(this.initCommentFormGroup());
        if (comment.date && comment.date.date_utc && comment.date.time_utc) {
          comment.date = {
            date_utc: this.parseUTCToLocalPipe.transformDate(comment.date.date_utc, comment.date.time_utc),
            time_utc: this.parseUTCToLocalPipe.transform(comment.date.time_utc),
          };
        } else {
          delete comment.date;
        }
      });
    }

    if (temp.general_comments && temp.general_comments.length) {
      temp.general_comments.forEach((gen_comment) => {
        this.getGeneralCommentsArray().push(this.initCommentFormGroup());
        if (gen_comment.date && gen_comment.date.date_utc && gen_comment.date.time_utc) {
          gen_comment.date = {
            date_utc: this.parseUTCToLocalPipe.transformDate(gen_comment.date.date_utc, gen_comment.date.time_utc),
            time_utc: this.parseUTCToLocalPipe.transform(gen_comment.date.time_utc),
          };
        } else {
          delete gen_comment.date;
        }
      });
    }

    // *************** If the status of the problematic is sent_to_certifier or resubmitted,
    // then add one field that will be the new input for certifier
    if (temp.problematic_status === 'sent_to_certifier' || temp.problematic_status === 'resubmitted_to_certifier') {
      this.getQuestion1CommentArray().push(this.initCommentFormGroup());
      this.getQuestion2CommentArray().push(this.initCommentFormGroup());
      this.getQuestion3CommentArray().push(this.initCommentFormGroup());
      this.getGeneralCommentsArray().push(this.initCommentFormGroup());
    }

    const tempResult = _.omitBy(temp, _.isNil);

    return tempResult;
  }

  processStatusCard() {
    // ************** Reset first, so if triggered by ngonchanges, data of old job desc(other student) not corrupting the data
    this.statusCard = {
      sent_to_student: false,
      sent_to_acadDpt: false,
      rejected_by_acadDpt: false,
      validated_by_acadDpt: false,
      sent_to_certifier: false,
      rejected_by_certifier: false,
      validated_by_certifier: false,
      resubmitted_to_certifier: false,
    };
    this.allowEditForm = false;
    if (this.problematicData) {
      switch (this.problematicData.problematic_status) {
        case 'sent_to_student':
          this.statusCard.sent_to_student = true;
          if (this.isADMTC || this.isStudent) {
            this.allowEditForm = true;
          }
          break;
        case 'sent_to_acadDpt':
          this.statusCard.sent_to_student = true;
          this.statusCard.sent_to_acadDpt = true;
          if (this.isADMTC || this.isAcadDirAdmin) {
            this.allowEditForm = true;
          }
          break;
        case 'rejected_by_acadDpt':
          this.statusCard.sent_to_student = true;
          this.statusCard.sent_to_acadDpt = true;
          this.statusCard.rejected_by_acadDpt = true;
          if (this.isADMTC || this.isStudent) {
            this.allowEditForm = true;
          }
          break;
        case 'validated_by_acadDpt':
          this.statusCard.sent_to_student = true;
          this.statusCard.sent_to_acadDpt = true;
          this.statusCard.validated_by_acadDpt = true;
          if (this.isADMTC || this.isCertifierDirAdmin) {
            this.allowEditForm = true;
          }
          break;
        case 'sent_to_certifier':
          this.statusCard.sent_to_student = true;
          this.statusCard.sent_to_acadDpt = true;
          this.statusCard.validated_by_acadDpt = true;
          this.statusCard.sent_to_certifier = true;
          if (this.isADMTC || this.isCertifierDirAdmin) {
            this.allowEditForm = true;
          }
          break;
        case 'rejected_by_certifier':
          this.statusCard.sent_to_student = true;
          this.statusCard.sent_to_acadDpt = true;
          this.statusCard.validated_by_acadDpt = true;
          this.statusCard.sent_to_certifier = true;
          this.statusCard.rejected_by_certifier = true;
          if (this.isADMTC || this.isStudent) {
            this.allowEditForm = true;
          }
          break;
        case 'validated_by_certifier':
          this.statusCard.sent_to_student = true;
          this.statusCard.sent_to_acadDpt = true;
          this.statusCard.validated_by_acadDpt = true;
          this.statusCard.sent_to_certifier = true;
          this.statusCard.validated_by_certifier = true;
          break;
        case 'resubmitted_to_certifier':
          this.statusCard.sent_to_student = true;
          this.statusCard.sent_to_acadDpt = true;
          this.statusCard.validated_by_acadDpt = true;
          this.statusCard.sent_to_certifier = true;
          this.statusCard.resubmitted_to_certifier = true;
          if (this.isADMTC || this.isCertifierDirAdmin) {
            this.allowEditForm = true;
          }
          break;
        default:
          break;
      }
    }

    // ************** ADMTC always able to edit the form
    if (this.isADMTC) {
      this.allowEditForm = true;
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

  createPayload() {
    const payload = _.cloneDeep(this.problematicForm.value);

    if (payload.date) {
      if (payload.date.date_utc && payload.date.time_utc) {
        payload.date.date_utc = this.parseLocalToUTCPipe.transformDate(
          moment(payload.date.date_utc).format('DD/MM/YYYY'),
          payload.date.time_utc,
        );
        payload.date.time_utc = this.parseLocalToUTCPipe.transform(payload.date.time_utc);
      }
    }

    if (payload.question_1 && payload.question_1.comments && payload.question_1.comments.length) {
      payload.question_1.comments.forEach((comment) => {
        if (comment && comment.date && comment.date.date_utc && comment.date.time_utc) {
          comment.date.date_utc = this.parseLocalToUTCPipe.transformDate(
            moment(comment.date.date_utc).format('DD/MM/YYYY'),
            comment.date.time_utc,
          );
          comment.date.time_utc = this.parseLocalToUTCPipe.transform(comment.date.time_utc);
        }
      });
    }

    if (payload.question_2 && payload.question_2.comments && payload.question_2.comments.length) {
      payload.question_2.comments.forEach((comment) => {
        if (comment && comment.date && comment.date.date_utc && comment.date.time_utc) {
          comment.date.date_utc = this.parseLocalToUTCPipe.transformDate(
            moment(comment.date.date_utc).format('DD/MM/YYYY'),
            comment.date.time_utc,
          );
          comment.date.time_utc = this.parseLocalToUTCPipe.transform(comment.date.time_utc);
        }
      });
    }

    if (payload.question_3 && payload.question_3.comments && payload.question_3.comments.length) {
      payload.question_3.comments.forEach((comment) => {
        if (comment && comment.date && comment.date.date_utc && comment.date.time_utc) {
          comment.date.date_utc = this.parseLocalToUTCPipe.transformDate(
            moment(comment.date.date_utc).format('DD/MM/YYYY'),
            comment.date.time_utc,
          );
          comment.date.time_utc = this.parseLocalToUTCPipe.transform(comment.date.time_utc);
        }
      });
    }

    if (payload.general_comments && payload.general_comments.length) {
      payload.general_comments.forEach((gen_comment) => {
        if (gen_comment && gen_comment.date && gen_comment.date.date_utc && gen_comment.date.time_utc) {
          gen_comment.date.date_utc = this.parseLocalToUTCPipe.transformDate(
            moment(gen_comment.date.date_utc).format('DD/MM/YYYY'),
            gen_comment.date.time_utc,
          );
          gen_comment.date.time_utc = this.parseLocalToUTCPipe.transform(gen_comment.date.time_utc);
        }
      });
    }

    return payload;
  }

  createPayloadRejectAcad(result) {

    const payload = {
      _id: this.problematicId,
      reason_of_rejection: result && result.description ? result.description : '',
      rejection_date: {
        date: this.getCurrentUtcDate(),
        time: this.getCurrentUtcTime(),
      },
      task_input: result,
      lang: this.translate.currentLang,
    };


    return payload;
  }

  getCurrentUtcDate() {
    return moment.utc().format('DD/MM/YYYY');
  }

  getCurrentUtcTime() {
    return moment.utc().format('HH:mm');
  }

  createPayloadRejectCertifier() {
    const payload = {
      _id: this.problematicId,
      rejection_date: {
        date: this.parseLocalToUTCPipe.transformDate(moment().format('DD/MM/YYYY'), '00:01'),
        time: this.parseLocalToUTCPipe.transform('00:01'),
      },
      lang: this.translate.currentLang,
    };


    return payload;
  }

  saveForm() {
    const payload = this.createPayload();

    this.subs.sink = this.problematicService
      .updateProblematic(payload, this.problematicId, this.translate.currentLang)
      .subscribe((resp) => {

        if (this.isADMTC || this.isAcadDirAdmin) {
          Swal.fire({
            type: 'info',
            title: this.translate.instant('PROB_S15.TITLE'),
            html: this.translate.instant('PROB_S215.TEXT'),
            footer: `<span style="margin-left: auto">PROB_S15</span>`,
            confirmButtonText: this.translate.instant('PROB_S15.BUTTON'),
            allowEnterKey: false,
            allowEscapeKey: false,
            allowOutsideClick: false,
          });
        } else {
          Swal.fire({
            type: 'info',
            title: this.translate.instant('PROB_S2.TITLE'),
            html: this.translate.instant('PROB_S2.TEXT'),
            footer: `<span style="margin-left: auto">PROB_S2</span>`,
            confirmButtonText: this.translate.instant('PROB_S2.BUTTON'),
            allowEnterKey: false,
            allowEscapeKey: false,
            allowOutsideClick: false,
          });
        }
      });
  }

  submitForm(type: string) {
    if (type === 'certifier') {
      const fullName =
        this.translate.instant(this.studentData.civility) + ' ' + this.studentData.last_name + ' ' + this.studentData.first_name;
      Swal.fire({
        type: 'question',
        title: this.translate.instant('PROB_S6.TITLE'),
        html: this.translate.instant('PROB_S6.TEXT', { studentFullName: fullName }),
        footer: `<span style="margin-left: auto">PROB_S6</span>`,
        confirmButtonText: this.translate.instant('PROB_S6.BUTTON1'),
        showCancelButton: true,
        cancelButtonText: this.translate.instant('PROB_S6.BUTTON2'),
        allowEnterKey: false,
        allowEscapeKey: false,
        allowOutsideClick: false,
      }).then((result) => {
        if (result.value) {
          this.submitCallApi(type);
        }
      });
    } else if (type === 'academic' || type === 'student') {
      this.submitCallApi(type);
    }
  }

  submitCallApi(type: string) {
    const payload = this.createPayload();
    this.subs.sink = this.problematicService
      .updateProblematic(payload, this.problematicId, this.translate.currentLang)
      .subscribe((resp) => {

        if (resp) {
          this.subs.sink = this.problematicService
            .submitStudentFormProblematic(this.problematicId, this.translate.currentLang)
            .subscribe((resp_submit) => {

              if (resp_submit && type === 'student') {
                this.triggerSwalProbS3();
              } else if (resp_submit && type === 'academic') {
                this.triggerSwalProbS4();
              } else if (resp_submit && type === 'certifier') {
                this.triggerSwalProbS7();
              }
            });
        }
      });
  }

  rejectFormAcad() {
    const fullName =
      this.translate.instant(this.studentData.civility) + ' ' + this.studentData.last_name + ' ' + this.studentData.first_name;
    Swal.fire({
      type: 'question',
      title: this.translate.instant('PROB_S5.TITLE'),
      html: this.translate.instant('PROB_S5.TEXT', { studentFullName: fullName }),
      footer: `<span style="margin-left: auto">PROB_S5</span>`,
      confirmButtonText: this.translate.instant('PROB_S5.BUTTON1'),
      showCancelButton: true,
      cancelButtonText: this.translate.instant('PROB_S5.BUTTON2'),
      allowEnterKey: false,
      allowEscapeKey: false,
      allowOutsideClick: false,
    }).then((res) => {
      if (res.value) {
        this.dialog
          .open(ProblematicRejectionDialogComponent, {
            width: '600px',
            minHeight: '300px',
            disableClose: true,
            data: this.studentData,
          })
          .afterClosed()
          .subscribe((result) => {
            if (result) {
              const payload = this.createPayload();
              this.subs.sink = this.problematicService
                .updateProblematic(payload, this.problematicId, this.translate.currentLang)
                .subscribe((resp) => {

                  if (resp) {
                    const payloadReject = this.createPayloadRejectAcad(result);
                    this.subs.sink = this.problematicService.rejectFormProblematicAcad(payloadReject).subscribe((response) => {

                      if (response) {
                        this.ngOnInit();
                      }
                    });
                  }
                });
            }
          });
      }
    });
  }

  rejectFormCertifier() {
    const fullName =
      this.translate.instant(this.studentData.civility) + ' ' + this.studentData.last_name + ' ' + this.studentData.first_name;
    Swal.fire({
      type: 'question',
      title: this.translate.instant('PROB_S8.TITLE'),
      html: this.translate.instant('PROB_S8.TEXT', { studentFullName: fullName }),
      footer: `<span style="margin-left: auto">PROB_S8</span>`,
      confirmButtonText: this.translate.instant('PROB_S8.BUTTON1'),
      showCancelButton: true,
      cancelButtonText: this.translate.instant('PROB_S8.BUTTON2'),
      allowEnterKey: false,
      allowEscapeKey: false,
      allowOutsideClick: false,
    }).then((result) => {
      if (result.value) {
        const payload = this.createPayload();
        this.subs.sink = this.problematicService
          .updateProblematic(payload, this.problematicId, this.translate.currentLang)
          .subscribe((resp) => {

            if (resp) {
              const payloadReject = this.createPayloadRejectCertifier();
              this.subs.sink = this.problematicService.rejectFormProblematicCertifier(payloadReject).subscribe((response) => {

                if (response) {
                  this.ngOnInit();
                }
              });
            }
          });
      }
    });
  }

  triggerSwalProbS3() {
    Swal.fire({
      type: 'success',
      title: this.translate.instant('PROB_S3.TITLE'),
      html: this.translate.instant('PROB_S3.TEXT'),
      footer: `<span style="margin-left: auto">PROB_S3</span>`,
      confirmButtonText: this.translate.instant('PROB_S3.BUTTON'),
      allowEnterKey: false,
      allowEscapeKey: false,
      allowOutsideClick: false,
    }).then((result) => {
      this.problematicForm = null;
      this.ngOnInit();
    });
  }

  triggerSwalProbS4() {
    Swal.fire({
      type: 'success',
      title: this.translate.instant('PROB_S4.TITLE'),
      html: this.translate.instant('PROB_S4.TEXT'),
      footer: `<span style="margin-left: auto">PROB_S4</span>`,
      confirmButtonText: this.translate.instant('PROB_S4.BUTTON'),
      allowEnterKey: false,
      allowEscapeKey: false,
      allowOutsideClick: false,
    }).then((result) => {
      this.problematicForm = null;
      this.ngOnInit();
    });
  }

  triggerSwalProbS7() {
    const fullName =
      this.translate.instant(this.studentData.civility) + ' ' + this.studentData.last_name + ' ' + this.studentData.first_name;
    Swal.fire({
      type: 'success',
      title: this.translate.instant('PROB_S7.TITLE'),
      html: this.translate.instant('PROB_S7.TEXT', { studentFullName: fullName }),
      footer: `<span style="margin-left: auto">PROB_S7</span>`,
      confirmButtonText: this.translate.instant('PROB_S7.BUTTON'),
      allowEnterKey: false,
      allowEscapeKey: false,
      allowOutsideClick: false,
    }).then((result) => {
      this.problematicForm = null;
      this.ngOnInit();
    });
  }

  triggerSwalProbS9() {
    const fullName =
      this.translate.instant(this.studentData.civility) + ' ' + this.studentData.last_name + ' ' + this.studentData.first_name;
    Swal.fire({
      type: 'success',
      title: this.translate.instant('PROB_S9.TITLE'),
      html: this.translate.instant('PROB_S9.TEXT', { studentFullName: fullName }),
      footer: `<span style="margin-left: auto">PROB_S9</span>`,
      confirmButtonText: this.translate.instant('PROB_S9.BUTTON'),
      allowEnterKey: false,
      allowEscapeKey: false,
      allowOutsideClick: false,
    }).then((result) => {
      this.problematicForm = null;
      this.ngOnInit();
    });
  }

  // getTranslateTestDate(date) {
  //   if (date && date.date_utc && date.time_utc) {
  //     return this.parseUTCToLocalPipe.transformDate(date.date_utc, date.time_utc);
  //   } else {
  //     return this.parseStringDatePipe.transformStringToDate(date);
  //   }
  // }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
  exportPdf() {

    const html = STYLE + this.problematicPDF.getPdfHtml();
    const filename =
      'Student Problematic PDF -' +
      this.studentData.last_name +
      ' - ' +
      this.studentData.first_name +
      ' - ' +
      this.studentData.rncp_title.short_name +
      ' - ' +
      this.studentData.school.short_name;
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
  }
  checkFinalTranscripsIsStarted() {
    if (this.titleId && this.classId) {
      this.subs.sink = this.studentService.IsFinalTranscriptStarted(this.titleId, this.classId).subscribe((resp) => {

        this.IsFinalTranscriptStarted = resp;
        if (this.IsFinalTranscriptStarted && !this.isADMTC) {
          this.allowEditForm = false;
        }
      });
    }
  }
}
