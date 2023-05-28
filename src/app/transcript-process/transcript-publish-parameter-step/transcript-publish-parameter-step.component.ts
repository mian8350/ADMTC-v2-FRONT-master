import { Component, Input, OnDestroy, OnInit } from '@angular/core';

import * as DecoupledEditor from 'assets/ckeditor5-custom/ckeditor.js';
import { FormArray, FormControl, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { SubSink } from 'subsink';
import { TranscriptProcessService } from 'app/service/transcript-process/transcript-process.service';
import { Router } from '@angular/router';
import { UtilityService } from 'app/service/utility/utility.service';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import Swal from 'sweetalert2';

@Component({
  selector: 'ms-transcript-publish-parameter-step',
  templateUrl: './transcript-publish-parameter-step.component.html',
  styleUrls: ['./transcript-publish-parameter-step.component.scss'],
})
export class TranscriptPublishParameterStepComponent implements OnInit, OnDestroy {
  @Input() titleId: '';
  @Input() classId: '';
  @Input() transcriptId: '';
  private subs = new SubSink();
  public Editor = DecoupledEditor;

  publishParameterForm: UntypedFormGroup;
  firstForm: any;
  savedForm;

  isWaitingForResponse = false;
  savedTranscriptData;
  private timeOutVal: any;

  blockList = [];

  classData;
  constructor(
    private fb: UntypedFormBuilder,
    private transcriptService: TranscriptProcessService,
    private router: Router,
    private utilService: UtilityService,
    private translate: TranslateService,
  ) {}

  public onReady(editor) {
    editor.ui.getEditableElement().parentElement.insertBefore(editor.ui.view.toolbar.element, editor.ui.getEditableElement());
  }

  public onChange(value) {
    if (value === false) {

      this.publishParameterForm.get('final_n2_text').setValue('');
      this.publishParameterForm.get('transcript_n2b').setValue(this.savedForm.transcript_n2b);

    } else {

      this.publishParameterForm.get('transcript_n2b').setValue('');
      this.publishParameterForm.get('final_n2_text').setValue(this.savedForm.final_n2_text);

    }
  }

  ngOnInit() {
    this.initForm();
    this.getFormData();
  }

  initForm() {
    this.publishParameterForm = this.fb.group({
      is_diploma_must_uploaded: [false],
      is_employability_survey_must_completed: [false],
      is_administrative_must_completed: [false],
      final_n2_text: [''],
      transcript_n2b: [''],
      transcript_process_status: [''],
      is_student_can_give_decision: [true],
    });
    this.firstForm = _.cloneDeep(this.publishParameterForm.value);
  }

  getFormData() {
    this.isWaitingForResponse = true;
    this.subs.sink = this.transcriptService.getOneTranscriptPublishParameter(this.transcriptId).subscribe(
      (resp) => {
        this.isWaitingForResponse = false;

        if (resp) {
          if (resp.transcript_process_status === 'retake' || resp.transcript_process_status === 'completed') {
            this.publishParameterForm.get('is_student_can_give_decision').disable({emitEvent: false});
          }

          // For null is_student_can_give_decision, we set them as null
          if (!resp.is_student_can_give_decision) {
            resp.is_student_can_give_decision = false;
          }

          // We need class Id here simply to check the type of the class. To display/hide slider automatically accept retake
          if (resp.class_id) {
            this.classData = resp.class_id;
            if (this.classData.type_evaluation !== 'expertise') {
              this.publishParameterForm.get('is_student_can_give_decision').patchValue(false);
            }
          }

          this.savedTranscriptData = _.cloneDeep(resp);
          const response = _.cloneDeep(resp);
          this.publishParameterForm.patchValue(response);
          this.savedForm = this.publishParameterForm.value;
          this.firstForm = _.cloneDeep(this.publishParameterForm.value);

          if (response.block_competence_condition_details && response.block_competence_condition_details.length) {
            this.blockList = response.block_competence_condition_details;
          }
        }
      },
      (err) => {
        this.isWaitingForResponse = false;
        this.blockList = [];
        this.savedTranscriptData = null;
      },
    );
  }

  createPayloadBlocksId() {
    const tempPayload = _.cloneDeep(this.blockList);


    const mappedBlocks = [];

    if (tempPayload.length) {
      tempPayload.forEach((block) => {
        if (block.block_id && block.block_id._id && block.is_block_selected) {
          mappedBlocks.push(block.block_id._id);
        }
      });
    }

    return mappedBlocks;
  }

  savePublishParameter() {
    const payload = this.publishParameterForm.value;
    this.isWaitingForResponse = true;
    this.subs.sink = this.transcriptService.saveTranscriptProcessStepOne(this.transcriptId, payload).subscribe(
      (resp) => {
        this.isWaitingForResponse = false;
        Swal.fire({
          type: 'success',
          title: this.translate.instant('Bravo !'),
          confirmButtonText: this.translate.instant('Ok'),
          allowEnterKey: false,
          allowEscapeKey: false,
          allowOutsideClick: false,
        }).then((res) => {

          this.savedForm = this.publishParameterForm.value;
          this.firstForm = _.cloneDeep(this.publishParameterForm.value);
          // this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
          //   this.router.navigate(['transcript-process', this.transcriptId], { queryParams: { tab: 'publishParameters' } });
          // });
        });
      },
      (err) => {
        this.isWaitingForResponse = false;

        Swal.fire({
          type: 'error',
          title: 'Error',
          text: err && err['message'] ? err['message'] : err,
          confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
        });
      },
    );
  }

  startInputDecision() {
    let timeDisabled = 5;
    Swal.fire({
      type: 'warning',
      title: this.translate.instant('TRANSCRIPT_S14.TITLE'),
      html: this.translate.instant('TRANSCRIPT_S14.TEXT'),
      allowEscapeKey: true,
      showCancelButton: true,
      confirmButtonText: this.translate.instant('TRANSCRIPT_S14.CONFIRM', { timer: timeDisabled }),
      cancelButtonText: this.translate.instant('TRANSCRIPT_S14.CANCEL'),
      allowOutsideClick: false,
      allowEnterKey: false,
      onOpen: () => {
        Swal.disableConfirmButton();
        const confirmBtnRef = Swal.getConfirmButton();
        const intVal = setInterval(() => {
          timeDisabled -= 1;
          confirmBtnRef.innerText = this.translate.instant('TRANSCRIPT_S14.CONFIRM') + ` (${timeDisabled})`;
        }, 1000);
        this.timeOutVal = setTimeout(() => {
          confirmBtnRef.innerText = this.translate.instant('TRANSCRIPT_S14.CONFIRM');
          Swal.enableConfirmButton();
          clearInterval(intVal);
          clearTimeout(this.timeOutVal);
        }, timeDisabled * 1000);
      },
    }).then((res) => {
      if (res.value) {
        const payload = this.publishParameterForm.value;
        this.isWaitingForResponse = true;
        this.subs.sink = this.transcriptService.saveTranscriptProcessStepOne(this.transcriptId, payload).subscribe(
          (resp) => {
            this.isWaitingForResponse = false;
            this.savedForm = this.publishParameterForm.value;
            this.firstForm = _.cloneDeep(this.publishParameterForm.value);
            if (resp) {
              this.checkForPassFailParameterDone();
            }
          },
          (err) => {
            this.isWaitingForResponse = false;
            this.swalError(err);
          },
        );
      }
    });
  }

  checkForPassFailParameterDone() {
    this.isWaitingForResponse = true;
    const payloadBlockIds = this.createPayloadBlocksId();

    this.subs.sink = this.transcriptService.getBlockNotHavePassFailCondition(this.titleId, this.classId, payloadBlockIds).subscribe(
      (responseValidation) => {
        this.isWaitingForResponse = false;
        // If classtype is score will return list of blocks that does not have validation yet
        if (responseValidation && responseValidation.length) {
          this.swalPassFailNotDone('score', responseValidation);
        } else {
          this.checkForTestValidation();
        }
      },
      (err) => {
        this.isWaitingForResponse = false;
        // If classtype is expertise will return error grand oral validation is not exist
        if (err['message'] === 'GraphQL error: grand oral validation does not exists') {
          this.swalPassFailNotDone('eval_comp_go_validation');
        } else if (err['message'] === 'GraphQL error: all marks entry not completed') {
          this.swalPassFailNotDone('eval_comp_go_mark_entry');
        } else {
          this.swalError(err);
        }
      },
    );
  }

  checkForTestValidation() {
    this.isWaitingForResponse = true;
    const payloadBlockIds = this.createPayloadBlocksId();

    this.subs.sink = this.transcriptService.checkAllTestsInBlockValidatedUpdated(payloadBlockIds).subscribe(
      (responseValidation) => {
        this.isWaitingForResponse = false;
        if (responseValidation && responseValidation.length) {
          this.swalNotValidated(responseValidation);
        } else {
          this.callAPIStartInputDecision();
        }
      },
      (err) => {
        this.isWaitingForResponse = false;
        this.swalError(err);
      },
    );
  }

  callAPIStartInputDecision() {
    this.isWaitingForResponse = true;
    this.subs.sink = this.transcriptService.startTransriptProcess(this.transcriptId).subscribe(
      (response) => {
        this.isWaitingForResponse = false;
        Swal.fire({
          type: 'success',
          title: this.translate.instant('Bravo !'),
          confirmButtonText: this.translate.instant('OK'),
          allowEnterKey: false,
          allowEscapeKey: false,
          allowOutsideClick: false,
        }).then(() => {


          this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
            this.router.navigate(['transcript-process', response._id], { queryParams: { tab: 'resultInput' } });
          });
        });
      },
      (err) => {
        this.isWaitingForResponse = false;
        this.swalError(err);
      },
    );
  }

  swalError(err) {

    Swal.fire({
      type: 'error',
      title: 'Error',
      text: err && err['message'] ? err['message'] : err,
      confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
    });
  }

  swalPassFailNotDone(type: string, blockList?) {
    if (type === 'score') {

      let blockListOrder = '';
      if (blockList && blockList.length) {
        blockListOrder += '<ul style="text-align: start; margin-left: 20px">';
        blockList.forEach((block) => {
          if (block && block && block.block_of_competence_condition) {
            blockListOrder += `<li> ${this.utilService.cleanHTML(block.block_of_competence_condition)} </li>`;
          }
        });
        blockListOrder += '</ul>';
      }
      Swal.fire({
        type: 'error',
        title: this.translate.instant('TRANSCRIPT_S15.TITLE'),
        html: this.translate.instant('TRANSCRIPT_S15.TEXT', { listOfBlock: blockListOrder }),
        confirmButtonText: this.translate.instant('TRANSCRIPT_S15.BUTTON'),
      });
    } else if (type === 'eval_comp_go_validation') {
      Swal.fire({
        type: 'error',
        title: this.translate.instant('Grand_Oral_Improvement.TRANSCRIPT_S15_GO_VALIDATION.TITLE'),
        html: this.translate.instant('Grand_Oral_Improvement.TRANSCRIPT_S15_GO_VALIDATION.TEXT', {processName: this.savedTranscriptData?.class_id?.jury_process_name}),
        confirmButtonText: this.translate.instant('Grand_Oral_Improvement.TRANSCRIPT_S15_GO_VALIDATION.BUTTON'),
      });
    } else if (type === 'eval_comp_go_mark_entry') {
      Swal.fire({
        type: 'error',
        title: this.translate.instant('Grand_Oral_Improvement.TRANSCRIPT_S15_GO_MARKENTRY.TITLE'),
        html: this.translate.instant('Grand_Oral_Improvement.TRANSCRIPT_S15_GO_MARKENTRY.TEXT', {processName: this.savedTranscriptData?.class_id?.jury_process_name}),
        confirmButtonText: this.translate.instant('Grand_Oral_Improvement.TRANSCRIPT_S15_GO_MARKENTRY.BUTTON'),
      });
    }
  }

  swalNotValidated(blockList) {

    let blockListOrder = '';

    if (blockList && blockList.length) {
      blockListOrder += '<ul style="text-align: start; margin-left: 20px">';
      blockList.forEach((block) => {
        if (block && block.block_id && block.block_id.block_of_competence_condition) {
          blockListOrder += `<li> ${this.utilService.cleanHTML(block.block_id.block_of_competence_condition)} </li>`;
        }
        if (block && block.test_id && block.test_id.length) {
          blockListOrder += '<ul style="text-align: start;">';
          block.test_id.forEach((test) => {
            if (test && test.name) {
              blockListOrder += `<li> ${test.name} </li>`;
            }
          });
          blockListOrder += '</ul>';
        }
        if (block && block.evaluation_id && block.evaluation_id.length) {
          blockListOrder += '<ul style="text-align: start;">';
          block.evaluation_id.forEach((evaluation) => {
            if (evaluation && evaluation.name) {
              blockListOrder += `<li> ${evaluation.evaluation} </li>`;
            }
          });
          blockListOrder += '</ul>';
        }
      });
      blockListOrder += '</ul>';
    }

    Swal.fire({
      type: 'error',
      title: this.translate.instant('TRANSCRIPT_S5.TITLE'),
      html: this.translate.instant('TRANSCRIPT_S5.TEXT', { listOfBlock: blockListOrder }),
      confirmButtonText: this.translate.instant('TRANSCRIPT_S5.BUTTON'),
    });
  }

  comparison() {
    const firstForm = JSON.stringify(this.firstForm);
    const form = JSON.stringify(this.publishParameterForm.value);
    if (firstForm === form) {
      return true;
    } else {
      return false;
    }
  }

  leave() {
    let validation = false;
    const currentData = JSON.stringify(this.publishParameterForm.value);
    const savedData = JSON.stringify(this.savedForm);
    if (currentData === savedData) {
      validation = true;
    }

    if (!validation) {
      Swal.fire({
        type: 'warning',
        title: this.translate.instant('TMTC_S01.TITLE'),
        text: this.translate.instant('TMTC_S01.TEXT'),
        confirmButtonText: this.translate.instant('TMTC_S01.BUTTON_1'),
        showCancelButton: true,
        cancelButtonText: this.translate.instant('TMTC_S01.BUTTON_2'),
        allowOutsideClick: false,
      }).then((res) => {
        if (res.dismiss) {
          this.router.navigate(['/transcript-process']);
        }
      });
    } else {
      this.router.navigate(['/transcript-process']);
    }
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
