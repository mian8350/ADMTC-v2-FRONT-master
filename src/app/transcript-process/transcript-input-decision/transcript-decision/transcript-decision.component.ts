import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { TranscriptProcessService } from 'app/service/transcript-process/transcript-process.service';
import { SubSink } from 'subsink';
import Swal from 'sweetalert2';
import * as _ from 'lodash';
import { UtilityService } from 'app/service/utility/utility.service';
import { ParseStringDatePipe } from 'app/shared/pipes/parse-string-date.pipe';
import { ParseLocalToUtcPipe } from 'app/shared/pipes/parse-local-to-utc.pipe';
import { ParseUtcToLocalPipe } from 'app/shared/pipes/parse-utc-to-local.pipe';
import * as moment from 'moment';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'ms-transcript-decision',
  templateUrl: './transcript-decision.component.html',
  styleUrls: ['./transcript-decision.component.scss'],
  providers: [ParseStringDatePipe, ParseLocalToUtcPipe, ParseUtcToLocalPipe],
})
export class TranscriptDecisionComponent implements OnInit, OnChanges, OnDestroy {
  private subs = new SubSink();
  listOfDecision: any;
  blockDecisionDropdown = [];
  classPassFailParameter: any;
  failedOverallId = '';
  passOverallId = '';
  today: Date;

  @Input() transcriptData: any;
  @Input() studentId: string;
  @Input() titleId: string;
  @Input() classId: string;
  @Input() certifierId: string;
  @Input() transcriptId: string;
  @Input() transcriptDetail: any;
  @Input() classType: string;
  @Output() refreshTable = new EventEmitter<boolean>(false);
  @Output() loadSuccessfully = new EventEmitter<boolean>(false);
  studentTranscripId: any;
  isDisplayInputDecision = false;
  inputDecisionForm: UntypedFormGroup;
  savedForm;
  isWaitingForResponse = false;
  toggleChangeDecision = false;
  specializationBlocks = [];

  myInnerHeight = 450;
  decisions = [
    {
      label: 'PASSES',
      value: 'pass',
    },
    {
      label: 'FAILED',
      value: 'fail',
    },
    {
      label: 'ELIMINATED',
      value: 'eliminated',
    },
    {
      label: 'RETAKE',
      value: 'retake',
    },
  ];

  isExpertise = false;
  isSaveDisabled = false;
  constructor(
    private fb: UntypedFormBuilder,
    private transcriptService: TranscriptProcessService,
    public utilService: UtilityService,
    private parseStringDatePipe: ParseStringDatePipe,
    private parseLocalToUTCPipe: ParseLocalToUtcPipe,
    private parseUTCToLocalPipe: ParseUtcToLocalPipe,
    private translate: TranslateService,
  ) {}

  ngOnInit() {
    this.today = new Date();
    this.subs.sink = this.transcriptService.tableAttribute.subscribe((val: any) => {
      this.myInnerHeight = val;
    });
    this.isExpertise = this.classType === 'expertise' ? true : false;
    for (const block of this.transcriptDetail.block_competence_condition_details) {
      if (block.is_block_selected && block?.block_id?.is_specialization) {
        this.specializationBlocks.push(block.block_id);
      }
    }
  }

  ngOnChanges() {

    this.isDisplayInputDecision = false;
    this.getBlockDropdownData();
    this.getClassPassFailParameter();
    this.getInitData();
  }

  // *************** To Get Height window screen and put in style css height
  getAutomaticHeight() {
    this.subs.sink = this.transcriptService.tableAttribute.subscribe((val: any) => {
      this.myInnerHeight = val;
    });
    if (this.myInnerHeight > 435) {
      this.myInnerHeight = this.myInnerHeight + 49;
    } else {
      this.myInnerHeight = window.innerHeight - 225;
    }
    return this.myInnerHeight;
  }
  getClassPassFailParameter() {
    this.isWaitingForResponse = true;
    this.transcriptService.getClassPassFailParameter(this.classId).subscribe(
      (resp) => {
        this.isWaitingForResponse = false;
        this.classPassFailParameter = resp;
        if (this.classPassFailParameter.pass_fail_conditions && this.classPassFailParameter.pass_fail_conditions.length) {
          const failFound = this.classPassFailParameter.pass_fail_conditions.find((con) => con.condition_type === 'fail');
          this.failedOverallId = failFound ? failFound._id : '';
          const passFound = this.classPassFailParameter.pass_fail_conditions.find((con) => con.condition_type === 'pass');
          this.passOverallId = passFound ? passFound._id : '';
        }
      },
      (err) => (this.isWaitingForResponse = false),
    );
  }

  getBlockDropdownData() {
    this.isWaitingForResponse = true;
    this.transcriptService.getBlockDecisionDropdown(this.titleId, this.classId).subscribe(
      (resp) => {
        this.isWaitingForResponse = false; 
        let temp = _.cloneDeep(resp);
        temp.forEach((data) => {
          if (data?.block_of_tempelate_competence?.phrase_names?.length) {
            data.block_of_tempelate_competence.phrase_names = data?.block_of_tempelate_competence?.phrase_names.sort((a: any, b: any) => a.name.localeCompare(b.name))
          } else if (data?.block_of_tempelate_soft_skill?.phrase_names?.length) {
            data.block_of_tempelate_soft_skill.phrase_names = data?.block_of_tempelate_soft_skill?.phrase_names.sort((a: any, b: any) => a.name.localeCompare(b.name))
          }
        });
        this.blockDecisionDropdown = temp;
      },
      (err) => (this.isWaitingForResponse = false),
    );
  }

  getDropdownData(blockId: string) {
    if (blockId && this.blockDecisionDropdown.length) {
      const blockConditionFound = this.blockDecisionDropdown.find((blockCondition) => blockCondition._id === blockId);
      if (blockConditionFound) {
        if (this.isExpertise) {
          if (
            blockConditionFound.block_of_tempelate_competence &&
            blockConditionFound.block_of_tempelate_competence.phrase_names.length > 0
          ) {
            return blockConditionFound.block_of_tempelate_competence.phrase_names;
          } else if (
            blockConditionFound.block_of_tempelate_soft_skill &&
            blockConditionFound.block_of_tempelate_soft_skill.phrase_names.length > 0
          ) {
            return blockConditionFound.block_of_tempelate_soft_skill.phrase_names;
          } else {
            return [];
          }
        } else {
          return blockConditionFound.pass_fail_conditions;
        }
      }
    } else {
      return [];
    }
  }

  setDecisionSchoolBoard(blockIndex: number, conditionType: string) {
    this.getBlockDecisionForm().at(blockIndex).get('decision_school_board').setValue(conditionType);
  }

  onDatePickerClosed(formControlName) {
    this.inputDecisionForm.get(formControlName).markAsTouched();
  }

  getInitData(isFromSave = false) {
    this.toggleChangeDecision = false;

    this.initStudentDecisionForm();
    this.isWaitingForResponse = true;
    this.loadSuccessfully.emit(true);
    this.subs.sink = this.transcriptService
      .getOneStudentTranscripts(this.transcriptId, this.studentId, this.titleId, this.classId)
      .subscribe(
        (response) => {
          const resp = _.cloneDeep(response);
          resp.forEach((studentTranscript) => {
            studentTranscript.block_competence_condition_details = studentTranscript.block_competence_condition_details.filter((block) => {
              return (!block?.block_id?.is_specialization && block?.is_block_selected_in_transcript_process) || (block?.block_id?.specialization?._id === resp[0]?.student_id?.specialization?._id)
            });
          });
          this.isWaitingForResponse = false;
          this.refreshTable.emit(false);
          this.loadSuccessfully.emit(false);

          this.listOfDecision = _.cloneDeep(resp);
          if (resp && resp.length) {
            for(let i = 0; i < this.listOfDecision.length; i++){
              for (const block of this.listOfDecision[i].block_competence_condition_details) {
                if (block?.block_id?.is_specialization) {
                  block.block_id.ref_id = `S${this.specializationBlocks.map( data => data?._id).indexOf(block?.block_id?._id) + 1}`
                }
                if (resp[i]?.is_latest) {
                  this.addBlockDecisionForm()
                }
              }
            }
            const lastDecision = resp[resp.length - 1];

            if (this.transcriptDetail.jury_decision && !this.checkSchoolBoardIsDone(lastDecision)) {
              this.isDisplayInputDecision = true;
            }
            resp.forEach((element, indexResp) => {
              if (element.is_latest) {
                this.studentTranscripId = element._id;

                resp[indexResp].block_competence_condition_details.forEach((elmt, elmtIndex) => {
                  this.inputDecisionForm
                    .get('block_competence_condition_details')
                    .get(elmtIndex.toString())
                    .get('is_block_selected_in_transcript_process')
                    .setValue(elmt.is_block_selected_in_transcript_process);
                  if (elmt.date_decision_school_board) {
                    this.inputDecisionForm
                      .get('block_competence_condition_details')
                      .get(elmtIndex.toString())
                      .get('date_decision_school_board')
                      .patchValue(elmt.date_decision_school_board);
                  }
                });
              }
            });
            this.savedForm = _.cloneDeep(this.inputDecisionForm.value);
            if(isFromSave) {
              this.transcriptService.isReloadAfterSave.next(true);
            }
          }
        },
        (err) => {
          (this.isWaitingForResponse = false), this.loadSuccessfully.emit(false);
        },
      );
  }

  toggleInputDecision(isDisplayed: boolean) {
    this.isDisplayInputDecision = isDisplayed;
  }

  initStudentDecisionForm() {
    this.inputDecisionForm = this.fb.group({
      decision_school_board_id: [''],
      date_decision_school_board: this.fb.group({
        date: [this.today],
        time: [moment(this.today).format('HH:mm')],
      }),
      retake_date: this.fb.group({
        date: [],
        time: [moment(this.today).format('HH:mm')],
      }),
      student_accept_retake: [''],
      block_competence_condition_details: this.fb.array([]),
    });
  }

  initBlockDecisionForm() {
    return this.fb.group({
      block_id: [''],
      decision_school_board: [null],
      decision_school_board_id: [''],
      date_decision_school_board: this.fb.group({
        date: [''],
        time: [''],
      }),
      is_block_selected_in_transcript_process: [null],
    });
  }

  getBlockDecisionForm(): UntypedFormArray {
    return this.inputDecisionForm.get('block_competence_condition_details') as UntypedFormArray;
  }

  addBlockDecisionForm() {
    this.getBlockDecisionForm().push(this.initBlockDecisionForm());
  }

  createPayload(decisionIndex) {
    const payload = this.inputDecisionForm.value;
    // format payload before save
    const currentTime = moment(this.today).format('HH:mm');
    const selectedDate = this.today;



    const selectedDateRetake = payload && payload.retake_date && payload.retake_date.date ? payload.retake_date.date : null;
    if (selectedDate && currentTime) {
      payload.date_decision_school_board = {
        date: this.parseLocalToUTCPipe.transformDate(moment(selectedDate).format('DD/MM/YYYY'), currentTime),
        time: this.parseLocalToUTCPipe.transform(currentTime),
      };
    }

    if (this.checkIfRetakeSelected()) {
      if (selectedDateRetake && currentTime) {
        payload.retake_date = {
          date: this.parseLocalToUTCPipe.transformDate(moment(selectedDateRetake).format('DD/MM/YYYY'), currentTime),
          time: this.parseLocalToUTCPipe.transform(currentTime),
        };
      }
    } else {
      delete payload.retake_date;
    }

    const isOverallFailed = payload.block_competence_condition_details.find((blc) => blc.decision_school_board !== 'pass');
    if (isOverallFailed) {
      payload.decision_school_board_id = this.failedOverallId;
    } else {
      payload.decision_school_board_id = this.passOverallId;
    }

    if (payload.student_accept_retake === 'school_board_decision_after_retake') {
      payload.student_accept_retake = null;
    } else if (!payload.student_accept_retake) {
      delete payload.student_accept_retake;
    }

    payload.block_competence_condition_details.forEach((element, indexParam) => {
      element.block_id = this.listOfDecision[decisionIndex].block_competence_condition_details[indexParam].block_id._id;
      element.overall_decision = this.listOfDecision[decisionIndex].block_competence_condition_details[indexParam].overall_decision;
      element.decision_platform = this.listOfDecision[decisionIndex].block_competence_condition_details[indexParam].decision_platform;
      element.pass_fail_decision_obtained_id =
        this.listOfDecision[decisionIndex].block_competence_condition_details[indexParam].pass_fail_decision_obtained_id &&
        this.listOfDecision[decisionIndex].block_competence_condition_details[indexParam].pass_fail_decision_obtained_id._id
          ? this.listOfDecision[decisionIndex].block_competence_condition_details[indexParam].pass_fail_decision_obtained_id._id
          : null;
      element.date_decision_school_board = {
        date: this.parseLocalToUTCPipe.transformDate(moment(selectedDate).format('DD/MM/YYYY'), currentTime),
        time: this.parseLocalToUTCPipe.transform(currentTime),
      };
      element.retake_blocks =
        element.retake_blocks && element.retake_blocks.length
          ? element.retake_blocks.map((retakeBlock) => {
              const retakeBlockData = retakeBlock;
              retakeBlockData.block_id = retakeBlockData.block_id && retakeBlockData.block_id._id ? retakeBlockData.block_id._id : null;
              retakeBlockData.test_id = retakeBlockData.test_id && retakeBlockData.test_id._id ? retakeBlockData.test_id._id : null;
              retakeBlockData.evaluation_id =
                retakeBlockData.evaluation_id && retakeBlockData.evaluation_id._id ? retakeBlockData.evaluation_id._id : null;
              return retakeBlockData;
            })
          : [];
    });

    return payload;
  }

  createPayloadChangeDecision(payload) {
    const payloadChangeDecision = payload;
  }

  submitDecision(decisionIndex) {
    this.isSaveDisabled = true;
    this.isWaitingForResponse = true;
    const payload = this.createPayload(decisionIndex);

    this.subs.sink = this.transcriptService.updateStudentTranscript(this.studentTranscripId, payload).subscribe(
      (list) => {
        this.isWaitingForResponse = false;

        Swal.fire({
          type: 'success',
          title: 'Bravo !',
          confirmButtonText: 'OK',
        }).then(() => {
          this.isSaveDisabled = false;
          this.isDisplayInputDecision = false;
          this.savedForm = this.inputDecisionForm.value;
          // this.refreshTable.emit(true);
          this.getInitData();
        });
      },
      (err) => {
        this.isWaitingForResponse = false;
        this.isSaveDisabled = false;
        const errMessage = String(err['message']);
        if (errMessage.includes('class not have retake title validation')) {
          Swal.fire({
            type: 'error',
            title: this.translate.instant('RGO_S13.TITLE'),
            html: this.translate.instant('RGO_S13.TEXT'),
            confirmButtonText: this.translate.instant('RGO_S13.BUTTON 1'),
          });
        } else if (errMessage.includes('Cannot Edit decision, Please revalidate jury mark entry first.')) {
          const civility = this.translate.instant(String(this.transcriptData?.student_id?.civility));
          const first_name = this.transcriptData?.student_id?.first_name;
          const last_name = String(this.transcriptData?.student_id?.last_name).toUpperCase();
          
          Swal.fire({
            type: 'warning',
            title: this.translate.instant('TRANSCRIPT_S25.TITLE'),
            html: this.translate.instant('TRANSCRIPT_S25.TEXT', { civility, first_name, last_name }),
            confirmButtonText: this.translate.instant('TRANSCRIPT_S25.BUTTON 1'),
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

  cancelRetake(isRefresh: boolean) {
    // this.refreshTable.emit(true);
    this.getInitData();
  }

  changeDecisionSubmit(decisionIndex) {
    this.isSaveDisabled = true;
    this.isWaitingForResponse = true;
    const payload = this.createPayload(decisionIndex);
    payload['student_id'] = this.studentId;
    (payload['transcript_process_id'] = this.transcriptId), this.submitDecisionCallAPI(payload);
  }

  submitDecisionCallAPI(payload) {
    this.subs.sink = this.transcriptService.createStudentTranscriptForChangeDecision(payload).subscribe(
      (list) => {
        this.isWaitingForResponse = false;

        Swal.fire({
          type: 'success',
          title: 'Bravo !',
          confirmButtonText: 'OK',
        }).then(() => {
          this.isDisplayInputDecision = false;
          this.savedForm = this.inputDecisionForm.value;
          // this.refreshTable.emit(true);
          this.isSaveDisabled = false;
          this.getInitData(true);
        });
      },
      (err) => {
        this.isWaitingForResponse = false;
        this.isSaveDisabled = false;
        const errMessage = String(err['message']);
        if (errMessage.includes('class not have retake title validation')) {
          Swal.fire({
            type: 'error',
            title: this.translate.instant('RGO_S13.TITLE'),
            html: this.translate.instant('RGO_S13.TEXT'),
            confirmButtonText: this.translate.instant('RGO_S13.BUTTON 1'),
          });
        } else if (errMessage.includes('Cannot Edit decision, Please revalidate jury mark entry first.')) {
          const civility = this.translate.instant(String(this.transcriptData?.student_id?.civility));
          const first_name = this.transcriptData?.student_id?.first_name;
          const last_name = String(this.transcriptData?.student_id?.last_name).toUpperCase();
          
          Swal.fire({
            type: 'warning',
            title: this.translate.instant('TRANSCRIPT_S25.TITLE'),
            html: this.translate.instant('TRANSCRIPT_S25.TEXT', { civility, first_name, last_name }),
            confirmButtonText: this.translate.instant('TRANSCRIPT_S25.BUTTON 1'),
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

  cancelAppeal() {
    this.savedForm = this.inputDecisionForm.value;
    this.toggleChangeDecision = false;
    this.isSaveDisabled = false;
  }

  translateDate(datee, timee) {
    if (datee && datee !== 'Invalid date') {
      const finalTime = timee ? timee : '15:59';
      const date = this.parseStringDatePipe.transformStringToDate(this.parseUTCToLocalPipe.transformDate(datee, finalTime));
      return moment(date, 'DD/MM/YYYY').format('MM/DD/YYYY');
    }
  }

  getDateDecisionStudent(decision) {
    let dateDecision = moment().format('MM/DD/YYYY');
    for (const block of decision.block_competence_condition_details) {
      for (const retakeBlock of block.retake_blocks) {
        if (retakeBlock.date_decision_student && retakeBlock.date_decision_student.date) {
          dateDecision = this.translateDate(retakeBlock.date_decision_student.date, retakeBlock.date_decision_student.time);
          break;
        }
      }
    }
    return dateDecision;
  }

  checkAllSchoolBoardAreDone() {
    let result = true;
    if (this.listOfDecision && this.listOfDecision.length) {
      this.listOfDecision.forEach((decision, decisionIndex) => {
        if (decision.is_latest && decision.block_competence_condition_details && decision.block_competence_condition_details.length) {
          decision.block_competence_condition_details.forEach((element) => {
            if (element.decision_school_board === 'initial') {
              result = false;
            }
          });
        }
      });
    }
    return result;
  }

  isChangeDecisionBtnDisabled() {
    let isDisabled = false;
    if (this.listOfDecision && this.listOfDecision.length) {
      const latestDecision = this.listOfDecision.find((decision) => decision.is_latest);
      // change button will be disabled when retake transcript is already published and retake not canceled.
      if (
        latestDecision &&
        latestDecision.decision_school_board === 'retake' &&
        latestDecision.is_published &&
        !latestDecision.cancel_retake
      ) {
        isDisabled = true;
      }
    }
    return isDisabled;
  }

  isAllRetakeDecisionInputted() {
    // check if student_accept_retake not inputted yet in the latest student transcript history
    let isInputted = true;
    if (this.listOfDecision && this.listOfDecision.length) {
      const latestDecision = this.listOfDecision.find((decision) => decision.is_latest);
      // disable button when transcript not published and decision not inputted yet
      if (
        latestDecision &&
        latestDecision.is_published &&
        latestDecision.decision_school_board === 'retake' &&
        latestDecision.student_accept_retake !== 'accept' &&
        latestDecision.student_accept_retake !== 'refuse'
      ) {
        isInputted = false;
      }
      // when retake canceled, enable the button
      if (latestDecision && latestDecision.cancel_retake) {
        isInputted = true;
      }
    }
    return isInputted;
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

  checkIsRetakeDecision(decision) {
    let display = false;
    decision.block_competence_condition_details.forEach((element) => {
      if (element.decision_school_board === 'retake') {
        display = true;
      }
    });
    return display;
  }

  checkIfRetakeSelected() {
    this.inputDecisionForm.get('retake_date.date').markAsTouched();
    let display = false;
    const data = this.getBlockDecisionForm().value;
    if (data && data.length) {

      data.forEach((block, blockIndex) => {
        if (block.decision_school_board === 'retake') {
          display = true;
        }
      });
    }
    return display;
  }

  changeDecision() {

    this.savedForm = this.inputDecisionForm.value;
    this.toggleChangeDecision = true;
    this.isSaveDisabled = false;
  }

  isFormValid() {
    const formData = this.inputDecisionForm.value;
    if (this.checkIfRetakeSelected() && !(formData.retake_date && formData.retake_date.date) && !this.isExpertise) {

      return false;
    }

    const data = this.getBlockDecisionForm().value;
    let validate = true;
    if (data && data.length) {
      data.forEach((block, blockIndex) => {
        if (!block.decision_school_board) {
          validate = false;
          return false;
        }
      });
    }

    return validate;
  }

  getBlockPhraseName(block) {
    if (block && block.decision_platform && this.isExpertise) {
      if (
        block.block_id.block_of_tempelate_competence &&
        block.block_id.block_of_tempelate_competence.phrase_names &&
        block.block_id.block_of_tempelate_competence.phrase_names.length
      ) {
        const phrase = block.block_id.block_of_tempelate_competence.phrase_names.find(
          (phrComp) => phrComp.phrase_type === block.decision_platform,
        );
        return phrase && phrase.name ? phrase.name : '';
      } else if (
        block.block_id.block_of_tempelate_soft_skill &&
        block.block_id.block_of_tempelate_soft_skill.phrase_names &&
        block.block_id.block_of_tempelate_soft_skill.phrase_names.length
      ) {
        const phraseSoft = block.block_id.block_of_tempelate_soft_skill.phrase_names.find(
          (phrSoft) => phrSoft.phrase_type === block.decision_platform,
        );
        return phraseSoft && phraseSoft.name ? phraseSoft.name : '';
      }
    }
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
    this.toggleChangeDecision = false;
  }
}
