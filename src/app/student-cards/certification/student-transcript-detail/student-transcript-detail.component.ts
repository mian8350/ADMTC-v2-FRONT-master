import { Component, OnInit, Output, Input, EventEmitter, OnChanges, OnDestroy } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { FileUploadService } from 'app/service/file-upload/file-upload.service';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import { StudentsService } from 'app/service/students/students.service';
import { UtilityService } from 'app/service/utility/utility.service';
import { ParseLocalToUtcPipe } from 'app/shared/pipes/parse-local-to-utc.pipe';
import { ParseStringDatePipe } from 'app/shared/pipes/parse-string-date.pipe';
import { ParseUtcToLocalPipe } from 'app/shared/pipes/parse-utc-to-local.pipe';
import { SubSink } from 'subsink';
import * as _ from 'lodash';
import * as moment from 'moment';
import { DatePipe } from '@angular/common';
import { TranscriptProcessService } from 'app/service/transcript-process/transcript-process.service';
import { JOBSTYLES } from '../../job-description/job-description-pdf/job-pdf-style';
import Swal from 'sweetalert2';
import { NgxPermissionsService } from 'ngx-permissions';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { DateAdapter } from '@angular/material/core';

@Component({
  selector: 'ms-student-transcript-detail',
  templateUrl: './student-transcript-detail.component.html',
  styleUrls: ['./student-transcript-detail.component.scss'],
  providers: [ParseStringDatePipe, ParseLocalToUtcPipe, ParseUtcToLocalPipe, DatePipe],
})
export class StudenntTranscriptDetailComponent implements OnInit, OnChanges, OnDestroy {
  private subs = new SubSink();
  listOfDecision: any;
  @Input() studentId: string;
  @Input() titleId: string;
  @Input() classId: string;
  @Input() transcriptId: string;
  @Input() currTranscriptId;
  studentTranscripId: any;
  @Output() continue = new EventEmitter<boolean>();
  myInnerHeight = 600;
  isWaitingForResponse = false;
  studentData: any;
  transcriptData: any;
  datePipe: DatePipe;
  juryForStudent: any;
  juryRetakeBlock: any;
  displayDetailTranscript: any[] = [];
  latestDecision: any;
  jurySelectedBlockMap = [];

  retakeBlocks = [];
  retakeForm: UntypedFormGroup;
  isDecisionInputted = false;
  isUserAcadir = false;
  transcriptDetail

  today = moment.utc().format('DD/MM/YYYY');
  currentTime = '15:59';

  studentDecisions = [
    {
      value: 'initial',
      label: 'NONEN',
    },
    {
      value: 'accept',
      label: 'accept_retake',
    },
    {
      value: 'refuse',
      label: 'reject_retake',
    },
  ];

  constructor(
    private fb: UntypedFormBuilder,
    private studentService: StudentsService,
    private router: Router,
    private rncpTitleService: RNCPTitlesService,
    public utilService: UtilityService,
    public translate: TranslateService,
    private fileUploadService: FileUploadService,
    private parseStringDatePipe: ParseStringDatePipe,
    private parseLocalToUTCPipe: ParseLocalToUtcPipe,
    private parseUTCToLocalPipe: ParseUtcToLocalPipe,
    private transcriptService: TranscriptProcessService,
    private permissions: NgxPermissionsService,
    private dateAdapter: DateAdapter<Date>,
  ) { }

  ngOnInit() {
    this.isUserAcadir = !!this.permissions.getPermission('Academic Director');

    this.getInitData();
  }

  ngOnChanges() {

    this.getInitData();

    this.dateAdapter.setLocale(this.translate.currentLang);
    this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      this.dateAdapter.setLocale(this.translate.currentLang);
    });
  }

  getInitData() {
    this.isWaitingForResponse = true;

    this.subs.sink = this.transcriptService
      .getOneStudentTranscriptsDetails(this.transcriptId, this.studentId, this.titleId, this.classId)
      .subscribe((response) => {
        this.isWaitingForResponse = false;
        this.getTrasncriptDetail()
        const resp = _.cloneDeep(response);

        let currTranscript
        if (this.currTranscriptId) {
          currTranscript = resp.filter(transcript => transcript._id === this.currTranscriptId)

        } else {
          currTranscript = resp
        }
        currTranscript.forEach((studentTranscript) => {
          studentTranscript.block_competence_condition_details = studentTranscript.block_competence_condition_details.filter((block) => {
            return block.is_block_selected_in_transcript_process;
          });
        });
        this.listOfDecision = _.cloneDeep(currTranscript);


        this.getRetakeBlocks();
      });
  }
  getTrasncriptDetail() {
    this.isWaitingForResponse=true
    this.transcriptService.getOneTranscriptDetailProcess(this.transcriptId).subscribe(resp => {
      if (resp) {
        this.transcriptDetail = _.cloneDeep(resp)

      }
      this.isWaitingForResponse=false
    })
  }

  getRetakeBlocks() {
    const retakeTranscript = this.listOfDecision.find((decision) => decision.decision_school_board === 'retake');
    if (retakeTranscript) {

      this.studentTranscripId = retakeTranscript._id;
      // populate form with retake transcript data
      this.initRetakeForm();
      this.populateRetakeForm(retakeTranscript);

      // get block subject and evaluation tree data
      this.retakeBlocks = [];
      if (!this.isDecisionInputted) {
        // if decision not inputted yet, take block > subject > evaluation tree data from API
        this.isWaitingForResponse = true;
        this.subs.sink = this.transcriptService.GetRetakeBlocks(this.studentTranscripId).subscribe((resp) => {
          this.isWaitingForResponse = false;
          this.retakeBlocks = _.cloneDeep(resp);
          this.setToggleState();

          if (this.retakeBlocks && this.retakeBlocks.length) {
            this.retakeBlocks.forEach((block) => {
              if (block.subjects && block.subjects.length) {
                block.subjects.forEach((subject) => {
                  if (subject.evaluations && subject.evaluations.length) {
                    subject.evaluations.forEach((evaluation) => {
                      this.toggleSelectedRetakeTest(
                        { checked: false, source: null },
                        evaluation,
                        block._id,
                        block.selected_block_retake._id,
                      );
                    });
                  }
                });
              }
            });
          }
        });
      } else {
        // if decision already inputted, take block > subject > evaluation tree data from retake_blocks
        retakeTranscript.block_competence_condition_details.forEach((block) => {
          if (block.retake_blocks && block.retake_blocks[0] && block.retake_blocks[0].block_id) {
            this.retakeBlocks.push(block.retake_blocks[0].block_id);
          }
        });
        this.setToggleState();
      }

    }
  }

  setToggleState() {
    // add isDisplayed to block and subject so we can toggle show/hide the tree
    this.retakeBlocks.forEach((block) => {
      block.isDisplayed = true;
      block.subjects.forEach((subject) => {
        subject.isDisplayed = true;
      });
    });
  }

  toggleBlock(block: any) {
    block.isDisplayed = !block.isDisplayed;
  }

  toggleSubject(subject: any) {
    subject.isDisplayed = !subject.isDisplayed;
  }

  isDecisionSelected() {
    // check if student already input decision or not
    if (this.retakeForm.get('student_accept_retake').value === 'refuse') {
      return true;
    } else if (this.retakeForm.get('student_accept_retake').value === 'accept') {
      // if select 'accept', student need to select/check in checkbox at least one of retake evaluation
      let isAnyRetakeEvaluationChecked = false;
      this.getBlockDecisionForm().controls.forEach((block, blockIdx) => {
        this.getRetakeBlockForm(blockIdx).controls.forEach((evaluation) => {
          if (evaluation.get('decision_student').value) {
            isAnyRetakeEvaluationChecked = true;
          }
        });
      });
      return isAnyRetakeEvaluationChecked;
    }
    return false;
  }

  populateRetakeForm(retakeTranscript: any) {
    retakeTranscript.block_competence_condition_details.forEach((blockDecision, blockDecisionIdx) => {
      // add form array fields
      this.addBlockDecisionForm();
      // format form data
      const blockCompetenceCondition = this.formatBlockCompetenceConditionData(_.cloneDeep(blockDecision), blockDecisionIdx);
      // populate form with data
      this.getBlockDecisionForm().at(blockDecisionIdx).patchValue(blockCompetenceCondition);
    });
    this.retakeForm.get('student_accept_retake').setValue(retakeTranscript.student_accept_retake);
    if (retakeTranscript.student_accept_retake === 'accept' || retakeTranscript.student_accept_retake === 'refuse') {
      this.isDecisionInputted = true;
    }

  }

  toggleSelectedRetakeTest(event: MatCheckboxChange, evaluation: any, blockId: string, selectedRetakeBlockId: string) {
    if (selectedRetakeBlockId) {
      // find the selected block_competence_condition_details
      const selectedBlockIndex = this.getBlockDecisionForm().controls.findIndex(
        (blc) => blc.get('block_id').value === selectedRetakeBlockId,
      );
      if (selectedBlockIndex >= 0) {
        // find if retake_block already exist in this block
        const retakeBlockIndex = this.getRetakeBlockForm(selectedBlockIndex).controls.findIndex(
          (rtkBlc) => rtkBlc.get('evaluation_id').value === evaluation._id,
        );
        if (retakeBlockIndex >= 0) {
          // if yes, change the value of decision_student
          const decision = this.getRetakeBlockForm(selectedBlockIndex).at(retakeBlockIndex).get('decision_student').value;
          this.getRetakeBlockForm(selectedBlockIndex).at(retakeBlockIndex).get('decision_student').setValue(!decision);
        } else {
          // if no, add new form, then fill that form with data
          this.addRetakeBlockForm(selectedBlockIndex);
          const lastRetakeIndex = this.getRetakeBlockForm(selectedBlockIndex).length - 1;
          this.getRetakeBlockForm(selectedBlockIndex).at(lastRetakeIndex).get('block_id').setValue(blockId);
          this.getRetakeBlockForm(selectedBlockIndex).at(lastRetakeIndex).get('test_id').setValue(evaluation.published_test_id._id);
          this.getRetakeBlockForm(selectedBlockIndex).at(lastRetakeIndex).get('evaluation_id').setValue(evaluation._id);
          this.getRetakeBlockForm(selectedBlockIndex).at(lastRetakeIndex).get('decision_student').setValue(false);
        }
      }
    }
  }

  isChecked(evaluationId: string) {
    let isTestSelected = false;
    this.getBlockDecisionForm().controls.forEach((block, blockIdx) => {
      this.getRetakeBlockForm(blockIdx).controls.forEach((evaluation) => {
        if (evaluation.get('evaluation_id').value === evaluationId && evaluation.get('decision_student').value) {
          isTestSelected = true;
        }
      });
    });
    return isTestSelected;
  }

  formatBlockCompetenceConditionData(block: any, blockDecisionIdx: number) {
    // this function is to map object to _id so it match the required payload
    const blockFormData = block;
    blockFormData.block_id = block.block_id && block.block_id._id ? block.block_id._id : null;

    blockFormData.decision_school_board_id =
      block.decision_school_board_id && block.decision_school_board_id._id ? block.decision_school_board_id._id : null;

    blockFormData.pass_fail_decision_obtained_id =
      block.pass_fail_decision_obtained_id && block.pass_fail_decision_obtained_id._id ? block.pass_fail_decision_obtained_id._id : null;

    if (blockFormData.retake_blocks && blockFormData.retake_blocks.length) {
      // populate retake_blocks in form
      blockFormData.retake_blocks = blockFormData.retake_blocks.map((retakeBlock) => {
        this.addRetakeBlockForm(blockDecisionIdx);
        const retakeBlockData = retakeBlock;
        retakeBlockData.block_id = retakeBlockData.block_id && retakeBlockData.block_id._id ? retakeBlockData.block_id._id : null;
        retakeBlockData.test_id = retakeBlockData.test_id && retakeBlockData.test_id._id ? retakeBlockData.test_id._id : null;
        retakeBlockData.evaluation_id =
          retakeBlockData.evaluation_id && retakeBlockData.evaluation_id._id ? retakeBlockData.evaluation_id._id : null;
        return retakeBlockData;
      });
    }


    return blockFormData;
  }

  initRetakeForm() {
    this.retakeForm = this.fb.group({
      block_competence_condition_details: this.fb.array([]),
      student_accept_retake: [''],
    });
  }

  getBlockDecisionForm(): UntypedFormArray {
    return this.retakeForm.get('block_competence_condition_details') as UntypedFormArray;
  }

  addBlockDecisionForm() {
    this.getBlockDecisionForm().push(this.initBlockDecisionForm());
  }

  initBlockDecisionForm() {
    return this.fb.group({
      block_id: [null],
      decision_school_board: [''],
      date_decision_school_board: this.fb.group({
        date: [this.today],
        time: [this.currentTime],
      }),
      decision_school_board_id: [null],
      decision_platform: [''],
      overall_decision: [''],
      pass_fail_decision_obtained_id: [null],
      retake_blocks: this.fb.array([]),
      is_block_selected_in_transcript_process: [false],
    });
  }

  getRetakeBlockForm(BlockIndex: number): UntypedFormArray {
    return this.getBlockDecisionForm().at(BlockIndex).get('retake_blocks') as UntypedFormArray;
  }

  addRetakeBlockForm(BlockIndex: number) {
    this.getRetakeBlockForm(BlockIndex).push(this.initEvaluationForm());
  }

  initEvaluationForm() {
    return this.fb.group({
      block_id: [null],
      test_id: [null],
      evaluation_id: [null],
      decision_student: [false],
      date_decision_student: this.fb.group({
        date: [this.today],
        time: [this.currentTime],
      }),
    });
  }

  formatPayload() {
    const payload = _.cloneDeep(this.retakeForm.value);
    // when decision is refuse retake, send all the retake_blocks but with decision_student false
    if (payload.student_accept_retake === 'refuse') {
      payload.block_competence_condition_details.forEach((block) => {
        const selectedRetakeBlock = this.retakeBlocks.find((blc) => blc.selected_block_retake._id === block.block_id);
        const retakeBlocks = [];
        if (selectedRetakeBlock) {
          selectedRetakeBlock.subjects.forEach((subject) => {
            subject.evaluations.forEach((evaluation) => {
              retakeBlocks.push({
                block_id: selectedRetakeBlock._id,
                test_id: evaluation.published_test_id._id,
                evaluation_id: evaluation._id,
                decision_student: false,
                date_decision_student: {
                  date: this.today,
                  time: this.currentTime,
                },
              });
            });
          });
        }
        block.retake_blocks = retakeBlocks;
      });
      payload.decision_school_board = 'fail';
    }
    return payload;
  }

  submitDecision() {
    const payload = this.formatPayload();

    this.isWaitingForResponse = true;
    this.subs.sink = this.transcriptService.submitStudentDecision(this.studentTranscripId, payload).subscribe(
      (resp) => {
        this.isWaitingForResponse = false;
        if (!resp.errors) {
          Swal.fire({
            type: 'success',
            title: 'Bravo !',
            confirmButtonText: 'OK',
          }).then(() => {
            this.getInitData();
          });
        } else {
          let errMsg = 'Error';
          if (resp.errors && resp.errors[0] && resp.errors[0].message) {
            errMsg = resp.errors[0].message;
          }
          Swal.fire({
            type: 'error',
            title: this.translate.instant('Error'),
            text: errMsg,
            confirmButtonText: 'OK',
          });
        }
      },
      (err) => (this.isWaitingForResponse = false),
    );
  }

  translateDate(datee, timee) {

    if (datee && datee !== 'Invalid date') {
      const finalTime = timee ? timee : '15:59';
      const date = this.parseStringDatePipe.transformStringToDate(this.parseUTCToLocalPipe.transformDate(datee, finalTime));
      return moment(date, 'DD/MM/YYYY');
      // return moment(date, 'DD/MM/YYYY').format('MM/DD/YYYY');
    }
  }

  translateDateDecision(datee, timee) {

    if (datee && datee !== 'Invalid date') {
      const finalTime = timee ? timee : '15:59';
      const date = this.parseStringDatePipe.transformStringToDate(this.parseUTCToLocalPipe.transformDate(datee, finalTime));
      this.datePipe = new DatePipe(this.translate.currentLang);
      // return moment(date, 'DD/MM/YYYY');
      return moment(date, 'DD/MM/YYYY').format('MM/DD/YYYY');
    }
  }

  getDateDecisionStudent(decision) {
    let dateDecision = moment().format('MM/DD/YYYY');
    for (const block of decision.block_competence_condition_details) {
      for (const retakeBlock of block.retake_blocks) {
        if (retakeBlock.date_decision_student && retakeBlock.date_decision_student.date) {
          dateDecision = this.translateDateDecision(retakeBlock.date_decision_student.date, retakeBlock.date_decision_student.time);
          break;
        }
      }
    }
    return dateDecision;
  }

  checkSchoolBoardIsDone(decision) {
    let display = false;
    decision.block_competence_condition_details.forEach((element) => {
      if (element.decision_school_board !== 'initial') {
        display = true;
      }
    });
    return display;
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
