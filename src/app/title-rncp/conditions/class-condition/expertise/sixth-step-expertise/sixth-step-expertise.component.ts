import {
  Component,
  OnInit,
  Input,
  ViewChildren,
  QueryList,
  EventEmitter,
  Output,
  OnDestroy,
  ChangeDetectorRef,
  AfterViewChecked,
  HostListener,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTable } from '@angular/material/table';
import { BlockCompetencyModel } from '../second-step-expertise/blocks.model';
import { UntypedFormGroup, UntypedFormBuilder, Validators, UntypedFormArray } from '@angular/forms';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import { TranslateService } from '@ngx-translate/core';
import Swal from 'sweetalert2';
import { BlockCompetencyDialogComponent } from '../second-step-expertise/popup/block-competency-dialog/block-competency-dialog.component';
import { CompetencyDialogComponent } from '../second-step-expertise/popup/competency-dialog/competency-dialog.component';
import { CriteriaEvaluationDialogComponent } from '../second-step-expertise/popup/criteria-evaluation-dialog/criteria-evaluation-dialog.component';
import * as _ from 'lodash';
import { moveItemInArray } from '@angular/cdk/drag-drop';
import { SubSink } from 'subsink';
import { removeSpaces } from 'app/service/customvalidator.validator';
import { AddEditPhraseDialogComponent } from '../add-edit-phrase-dialog.component';
import { UtilityService } from 'app/service/utility/utility.service';
import { ImportTemplateEvalCompetenceDialogComponent } from '../import-template-eval-competence-dialog/import-template-eval-competence-dialog.component';
import * as moment from 'moment';
import { ExportCsvService } from 'app/service/export-csv/export-csv.service';
import { environment } from 'environments/environment';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'ms-sixth-step-expertise',
  templateUrl: './sixth-step-expertise.component.html',
  styleUrls: ['./sixth-step-expertise.component.scss'],
})
export class SixthStepExpertiseComponent implements OnInit, OnDestroy, AfterViewChecked {
  @Input() selectedRncpTitleId: string;
  @Input() selectedClassId: string;
  @Input() evaluationStep: string;
  @Output() updateStep = new EventEmitter<string>();
  displayedParameterColumns = ['correlation', 'validation_type', 'validation_parameter', 'min_level_mastery', 'action'];
  @HostListener('window:scroll', ['$event']) // for window scroll events
  @ViewChildren(MatTable)
  matTables: QueryList<MatTable<any>>;
  templateForm: UntypedFormGroup;
  scoreForm: UntypedFormGroup;
  private subs = new SubSink();
  isWaitingForResponse = false;
  isFinalTranscript = false;
  className: any;
  scroll = false;
  firstForm: any;
  // default form to check if there is a change
  defaultForm: any;
  scrollEvent: any;
  exportName: 'Export';
  dataBlock: any;
  grandOralData: any;
  dataBlockSoft: any;
  blockList = [];
  blockSoftList = [];
  competenceList = [];
  competenceSoftList = [];
  oriPharseBlock = [];
  oriPharseCompetence = [];
  oriPharseAllBlock = [];
  oriPharseAllBlockSoft = [];
  oriPharseAutoEval = [];
  oriPharseProEval = [];
  pharseBlock: any[][] = [];
  pharseCompetence: any[][] = [];
  pharseAllBlock: any[][] = [];
  pharseAllBlockSoft: any[][] = [];
  pharseAutoEval: any[][] = [];
  pharseProEval: any[][] = [];
  private timeOutVal: any;
  private intVal: any;
  juryProcessName: string;

  constructor(
    public dialog: MatDialog,
    private rncpTitleService: RNCPTitlesService,
    private translate: TranslateService,
    private fb: UntypedFormBuilder,
    private cdr: ChangeDetectorRef,
    public utilService: UtilityService,
    private exportCsvService: ExportCsvService,
  ) {}

  ngOnInit() {
    // this.blocks = [];
    // this.scoreConversion.push([]);
    this.initForm();
    this.populateDataGrandOralValidation();
    this.defaultForm = _.cloneDeep(this.templateForm.value);
    this.subs.sink = this.rncpTitleService.getScrollEvent$.subscribe((resp) => (this.scrollEvent = resp));
    this.checkFinalTranscript()
  }

  checkFinalTranscript(){
    const filter = {
      rncp_title_id: this.selectedRncpTitleId, 
      class_id : this.selectedClassId,
      is_already_started: true,
    }

    this.subs.sink = this.rncpTitleService.checkTranscriptProcess(filter).subscribe((resp)=>{

      if(resp && resp.length){
       this.isFinalTranscript = true
      }
    })
  }

  populateData() {
    this.isWaitingForResponse = true;
    this.subs.sink = this.rncpTitleService
      .getOneGrandOralValidation(this.selectedRncpTitleId, this.selectedClassId)
      .subscribe((response) => {
        const res = _.cloneDeep(response);
        this.grandOralData = res;
        this.isWaitingForResponse = false;
        if (res) {
          this.juryProcessName = response?.class_id?.jury_process_name;
          if (res && res.rncp_id && res.rncp_id._id) {
            res.rncp_id = res.rncp_id._id;
          }
          if (res && res.class_id && res.class_id._id) {
            res.class_id = res.class_id._id;
          }
          if (res.phrase_names && res.phrase_names.length) {
            res.phrase_names.forEach((phraseName, phraseIndex) => {
              this.getBlockFormArray.push(this.initBlockForm());
              if (phraseName.phrase_parameters && phraseName.phrase_parameters.length) {
                phraseName.phrase_parameters.forEach((parameter, parameterIndex) => {
                  this.addBlockPhraseParameterFormArray(phraseIndex);
                  if (
                    parameter &&
                    parameter.validation_parameter &&
                    parameter.validation_parameter.competence_id &&
                    parameter.validation_parameter.competence_id._id
                  ) {
                    parameter.validation_parameter.competence_id = parameter.validation_parameter.competence_id._id;
                    this.compFetch(parameter.validation_parameter.competence_id, parameterIndex);
                  }
                  if (
                    parameter &&
                    parameter.validation_parameter &&
                    parameter.validation_parameter.block_id &&
                    parameter.validation_parameter.block_id._id
                  ) {
                    parameter.validation_parameter.block_id = parameter.validation_parameter.block_id._id;
                    this.blockFetch(parameter.validation_parameter.block_id, parameterIndex);
                  }
                });
              } else {
                phraseName.phrase_parameters = [];
              }
            });
          }
          this.templateForm.patchValue(res);
          this.firstForm = this.templateForm.value;

        }
      }, err => this.isWaitingForResponse = false);
  }

  ngAfterViewChecked() {
    this.cdr.detectChanges();
    this.subs.sink = this.rncpTitleService.getScrollEvent$.subscribe((resp) => (this.scrollEvent = resp));
  }

  initForm() {
    this.templateForm = this.fb.group({
      rncp_id: [this.selectedRncpTitleId, Validators.required],
      class_id: [this.selectedClassId, Validators.required],
      phrase_names: this.fb.array([]),
    });
    this.firstForm = _.cloneDeep(this.templateForm.value);
  }

  initBlockForm() {
    return this.fb.group({
      _id: [null],
      phrase_type: [null],
      name: ['', [Validators.required, removeSpaces]],
      phrase_parameters: this.fb.array([]),
    });
  }

  initBlockPhraseParametersForm(): UntypedFormGroup {
    return this.fb.group({
      correlation: [null],
      validation_type: [''],
      validation_parameter: this.fb.group({
        parameter_type: [null],
        percentage_value: [null, Validators.max(100)],
        sign: [null],
        ratio_value: [null],
        block_id: [null],
        competence_id: [null],
        soft_skill_id: [null],
      }),
      min_level_mastery: [''],
    });
  }

  // *************** Start of get formarray functionalities
  get getBlockFormArray(): UntypedFormArray {
    return this.templateForm.get('phrase_names') as UntypedFormArray;
  }

  addTemplate(index) {
    this.subs.sink = this.dialog
      .open(AddEditPhraseDialogComponent, {
        width: '400px',
        minHeight: '100px',
        panelClass: 'certification-rule-pop-up',
        disableClose: true,
        data: {
          type: 'add',
          block_or_competence: 'block',
          is_grand_oral: true,
          list: this.getBlockFormArray.value,
        },
      })
      .afterClosed()
      .subscribe((response) => {

        if (response && response.name) {

          this.getBlockFormArray.push(this.initBlockForm());
          const lastIndex = this.getBlockFormArray.length - 1;
          this.getBlockFormArray.at(lastIndex).get('name').patchValue(response.name);
          this.getBlockFormArray.at(lastIndex).get('phrase_type').patchValue(response.phrase_type);
          this.addBlockPhraseParameterFormArray(lastIndex);
        }
      });
  }

  getBlockPhraseParameterFormArray(blockIndex: number): UntypedFormArray {
    return this.getBlockFormArray.at(blockIndex).get('phrase_parameters') as UntypedFormArray;
  }

  addBlockPhraseParameterFormArray(blockIndex: number) {
    this.getBlockPhraseParameterFormArray(blockIndex).push(this.initBlockPhraseParametersForm());
    this.pharseBlock.push(this.oriPharseBlock);
    this.pharseCompetence.push(this.oriPharseCompetence);
    this.pharseAllBlock.push(this.oriPharseAllBlock);
    this.pharseAllBlockSoft.push(this.oriPharseAllBlockSoft);
    this.pharseAutoEval.push(this.oriPharseAutoEval);
    this.pharseProEval.push(this.oriPharseAutoEval);
    this.matTables.forEach((each) => each.renderRows());
  }

  editBlockPhraseName(blockIndex: number) {
    const temp = [...this.getBlockFormArray.value];
    const list = _.cloneDeep(temp.splice(blockIndex - 1, 1));
    this.subs.sink = this.dialog
      .open(AddEditPhraseDialogComponent, {
        width: '400px',
        minHeight: '100px',
        panelClass: 'certification-rule-pop-up',
        disableClose: true,
        data: {
          type: 'edit',
          block_or_competence: 'block',
          is_grand_oral: true,
          _id: this.getBlockFormArray.at(blockIndex).get('_id').value,
          name: this.getBlockFormArray.at(blockIndex).get('name').value,
          phrase_type: this.getBlockFormArray.at(blockIndex).get('phrase_type').value,
          list: list,
        },
      })
      .afterClosed()
      .subscribe((response) => {
        if (response && response.name) {

          this.getBlockFormArray.at(blockIndex).get('phrase_type').patchValue(response.phrase_type);
          this.getBlockFormArray.at(blockIndex).get('name').patchValue(response.name);
          this.getBlockFormArray.at(blockIndex).get('_id').patchValue(response._id);
          if(this.translate.currentLang === 'fr') {
            this.translate.use('en');
            this.isWaitingForResponse = true;
            setTimeout(() => {
              this.isWaitingForResponse = false;
              this.translate.use('fr');
            }, 50);            
          } else if(this.translate.currentLang === 'en') {
            this.translate.use('fr');
            this.isWaitingForResponse = true;
            setTimeout(() => {
              this.isWaitingForResponse = false;
              this.translate.use('en');
            }, 50); 
          }
        }
      });
  }

  populateDataDropdown(response, response1) {
    if (response && response.length) {
      const res = _.cloneDeep(response);
      this.dataBlock = _.cloneDeep(res);
      this.blockList = this.dataBlock.map((list) => {
        return {
          name: list.ref_id + ' ' + this.utilService.cleanHTML(list.name),
          _id: list._id,
          phrase: list.phrase_names,
        };
      });
      this.competenceList = [];
      this.dataBlock.forEach((element) => {
        element.competence_templates_id.forEach((list) => {
          const data = {
            name: list.ref_id + ' ' + this.utilService.cleanHTML(list.name),
            _id: list._id,
            phrase: list.phrase_names,
          };
          this.competenceList.push(data);
        });
      });
      this.oriPharseAllBlock = [];
      this.dataBlock.forEach((element) => {
        element.phrase_names.forEach((list) => {
          const data = {
            name: this.utilService.cleanHTML(list.name),
            type: list.phrase_type,
          };
          this.oriPharseAllBlock.push(data);
        });
      });
      this.oriPharseAllBlock = _.uniqBy(this.oriPharseAllBlock, 'type');

    }

    if (response1 && response1.length) {
      const res = _.cloneDeep(response1);
      this.dataBlockSoft = _.cloneDeep(res);
      this.blockSoftList = this.dataBlockSoft.map((list) => {
        return {
          name: list.ref_id + ' ' + list.name,
          _id: list._id,
        };
      });

      this.competenceSoftList = [];
      this.dataBlockSoft.forEach((element) => {
        element.competence_softskill_templates_id.forEach((list) => {
          const data = {
            name: list.ref_id + ' ' + this.utilService.cleanHTML(list.name),
            _id: list._id,
            phrase: list.phrase_names,
          };
          this.competenceSoftList.push(data);
        });
      });

      this.oriPharseAllBlockSoft = [];
      this.dataBlockSoft.forEach((element) => {
        element.phrase_names.forEach((list) => {
          const data = {
            name: this.utilService.cleanHTML(list.name),
            type: list.phrase_type,
          };
          this.oriPharseAllBlockSoft.push(data);
        });
      });
      this.oriPharseAllBlockSoft = _.uniqBy(this.oriPharseAllBlockSoft, 'type');

    }
  }

  compSelected(id, blockIndex, paramIndex) {
    this.pharseCompetence[paramIndex] = [];
    this.getBlockPhraseParameterFormArray(blockIndex).at(paramIndex).get('min_level_mastery').setValue(null);
    if (this.competenceList && this.competenceList.length) {
      const arr = this.competenceList.filter((list) => list._id === id).map((list) => list.phrase);
      if (arr && arr.length) {
        this.pharseCompetence[paramIndex] = arr[0];
      }
    }
  }

  validationSelected(blockIndex, paramIndex) {
    this.getBlockPhraseParameterFormArray(blockIndex).at(paramIndex).get('min_level_mastery').setValue(null);
    this.getBlockPhraseParameterFormArray(blockIndex).at(paramIndex).get('validation_parameter').get('block_id').setValue(null);
  }

  validationSelectedCompetence(blockIndex, paramIndex) {
    this.getBlockPhraseParameterFormArray(blockIndex).at(paramIndex).get('min_level_mastery').setValue(null);
    this.getBlockPhraseParameterFormArray(blockIndex).at(paramIndex).get('validation_parameter').get('competence_id').setValue(null);
  }

  blockSelected(id, blockIndex, paramIndex) {
    this.pharseBlock[paramIndex] = [];
    this.getBlockPhraseParameterFormArray(blockIndex).at(paramIndex).get('min_level_mastery').setValue(null);
    if (this.blockList && this.blockList.length) {
      const arr = this.blockList.filter((list) => list._id === id).map((list) => list.phrase);
      if (arr && arr.length) {
        this.pharseBlock[paramIndex] = arr[0];
      }

    }
  }

  compFetch(id, paramIndex) {
    this.pharseCompetence[paramIndex] = [];
    if (this.competenceList && this.competenceList.length) {
      const arr = this.competenceList.filter((list) => list._id === id).map((list) => list.phrase);
      if (arr && arr.length) {
        this.pharseCompetence[paramIndex] = arr[0];
      }
    }
  }

  blockFetch(id, paramIndex) {
    this.pharseBlock[paramIndex] = [];
    if (this.blockList && this.blockList.length) {
      const arr = this.blockList.filter((list) => list._id === id).map((list) => list.phrase);
      if (arr && arr.length) {
        this.pharseBlock[paramIndex] = arr[0];
      }

    }
  }

  allowSelectBlockScorePhrase(blockIndex, paramIndex) {
    let result = false;
    const temp = this.getBlockPhraseParameterFormArray(blockIndex).at(paramIndex).value;
    if (
      temp.validation_type &&
      temp.validation_type === 'competence' &&
      temp.validation_parameter &&
      temp.validation_parameter.competence_id
    ) {
      result = true;
    }
    if (temp.validation_type && temp.validation_type === 'block' && temp.validation_parameter && temp.validation_parameter.block_id) {
      result = true;
    }
    return result;
  }

  removeBlockPhraseParameterFormArray(blockIndex: number, parameterIndex: number) {
    const data = this.getBlockPhraseParameterFormArray(blockIndex).at(parameterIndex).value;
    // const result = this.getBlockPhraseParameterFormArray(blockIndex, phraseIndex).at(parameterIndex).pristine;
    const emptyParameter = JSON.stringify(this.initBlockPhraseParametersForm().value);
    const selectedAddress = JSON.stringify(data);
    const result = emptyParameter === selectedAddress;
    if (!result) {
      let timeDisabled = 5;
      Swal.fire({
        title: this.translate.instant('DASHBOARD_DELETE.deletedTitle'),
        html: this.translate.instant('DELETE_PHRASE_PARAMETER'),
        footer: `<span style="margin-left: auto">DELETE_PHRASE_PARAMETER</span>`,
        type: 'warning',
        allowEscapeKey: false,
        showCancelButton: true,
        confirmButtonText: this.translate.instant('THUMBSUP.SWEET_ALERT.CONFIRM', { timer: timeDisabled }),
        cancelButtonText: this.translate.instant('DASHBOARD_DELETE.NO'),
        allowOutsideClick: false,
        allowEnterKey: false,
        onOpen: () => {
          Swal.disableConfirmButton();
          const confirmBtnRef = Swal.getConfirmButton();
          const intVal = setInterval(() => {
            timeDisabled -= 1;
            confirmBtnRef.innerText = this.translate.instant('DELETE_ITEM_TEMPLATE.BUTTON_1') + ` (${timeDisabled})`;
          }, 1000);

          this.timeOutVal = setTimeout(() => {
            confirmBtnRef.innerText = this.translate.instant('DELETE_ITEM_TEMPLATE.BUTTON_1');
            Swal.enableConfirmButton();
            clearInterval(intVal);
            clearTimeout(this.timeOutVal);
          }, timeDisabled * 1000);
        },
      }).then((res) => {
        clearTimeout(this.timeOutVal);
        if (res.value) {
          this.getBlockPhraseParameterFormArray(blockIndex).removeAt(parameterIndex);
          this.pharseBlock.splice(parameterIndex, 1);
          this.pharseCompetence.splice(parameterIndex, 1);
          this.pharseAllBlock.splice(parameterIndex, 1);
          this.pharseAllBlockSoft.splice(parameterIndex, 1);
          this.pharseAutoEval.splice(parameterIndex, 1);
          this.pharseProEval.splice(parameterIndex, 1);
          this.matTables.forEach((each) => each.renderRows());
          Swal.fire({
            type: 'success',
            title: this.translate.instant('EVENT_S1.TITLE'),
            html: this.translate.instant('PHRASE_PARAMETER_DELETED'),
            footer: `<span style="margin-left: auto">PHRASE_PARAMETER_DELETED</span>`,
            confirmButtonText: this.translate.instant('EVENT_S1.BUTTON'),
          });
        }
      });
    } else {
      this.getBlockPhraseParameterFormArray(blockIndex).removeAt(parameterIndex);
      this.pharseBlock.splice(parameterIndex, 1);
      this.pharseCompetence.splice(parameterIndex, 1);
      this.pharseAllBlock.splice(parameterIndex, 1);
      this.pharseAllBlockSoft.splice(parameterIndex, 1);
      this.pharseAutoEval.splice(parameterIndex, 1);
      this.pharseProEval.splice(parameterIndex, 1);
      this.matTables.forEach((each) => each.renderRows());
    }
  }

  handlePercentageChange(blockIndex, i) {
    const x = this.getBlockPhraseParameterFormArray(blockIndex).at(i).get('validation_parameter').get('percentage_value');
    if (x.value < 0) {
      x.patchValue(0);
    }
    if (x.value > 100) {
      x.patchValue(100);
    }
  }

  reCalculateGrandOralResult() {
    Swal.fire({
      type: 'warning',
      title: this.translate.instant('TRANSCRIPT_S22.TITLE'),
      text: this.translate.instant('TRANSCRIPT_S22.TEXT'),
      confirmButtonText: this.translate.instant('TRANSCRIPT_S22.BUTTON 1'),
      cancelButtonText: this.translate.instant('TRANSCRIPT_S22.BUTTON 2'),
      showCancelButton: true,
      allowOutsideClick: false,
    }).then((resp) => {
      if (resp.value) {
        this.subs.sink = this.rncpTitleService
          .reCalculateGrandOralCorrectionDecision(this.selectedRncpTitleId, this.selectedClassId)
          .subscribe(
            (resp) => {
              if (resp && resp === 'calculation process on progress') {
                Swal.fire({
                  type: 'success',
                  title: this.translate.instant('TRANSCRIPT_S24.TITLE'),
                  text: this.translate.instant('TRANSCRIPT_S24.TEXT'),
                  confirmButtonText: this.translate.instant('TRANSCRIPT_S24.BUTTON 1'),
                });
              }
            },
            (err) => {
              if (err['message'] === 'GraphQL error: calculation process still on progress') {
                Swal.fire({
                  type: 'warning',
                  title: this.translate.instant('TRANSCRIPT_S23.TITLE'),
                  text: this.translate.instant('TRANSCRIPT_S23.TEXT'),
                  confirmButtonText: this.translate.instant('TRANSCRIPT_S23.BUTTON 1'),
                });
              }
            },
          );
      }
    });
  }
  


  populateScore(resp) {
    if (resp) {
      if (resp.score_conversions_competency) {
        this.oriPharseAutoEval = resp.score_conversions_competency;
      }
      if (resp.score_conversions_soft_skill) {
        this.oriPharseProEval = resp.score_conversions_soft_skill;
        // let arr = _.cloneDeep(resp.score_conversions_soft_skill);
        // arr = arr.map((list) => {
        //   return {
        //     _id: list._id,
        //     sign: list.sign,
        //     score: list.score,
        //     phrase: 'SF ' + list.phrase,
        //     letter: list.letter,
        //   };
        // });
        // this.oriPharseAutoEval = this.oriPharseAutoEval.concat(arr);
      }
    }
  }

  deleteBlockPhraseName(blockIndex: number) {
    let timeDisabled = 5;
    Swal.fire({
      title: this.translate.instant('DASHBOARD_DELETE.deletedTitle'),
      html: this.translate.instant('DELETE_PASS_FAIL_DECISION'),
      footer: `<span style="margin-left: auto">DELETE_PASS_FAIL_DECISION</span>`,
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
        const intVal = setInterval(() => {
          timeDisabled -= 1;
          confirmBtnRef.innerText = this.translate.instant('DELETE_ITEM_TEMPLATE.BUTTON_1') + ` (${timeDisabled})`;
        }, 1000);

        this.timeOutVal = setTimeout(() => {
          confirmBtnRef.innerText = this.translate.instant('DELETE_ITEM_TEMPLATE.BUTTON_1');
          Swal.enableConfirmButton();
          clearInterval(intVal);
          clearTimeout(this.timeOutVal);
        }, timeDisabled * 1000);
      },
    }).then((res) => {
      clearTimeout(this.timeOutVal);
      if (res.value) {
        this.removeBlockPhraseNameFormArray(blockIndex);

        this.matTables.forEach((each) => each.renderRows());
        Swal.fire({
          type: 'success',
          title: this.translate.instant('EVENT_S1.TITLE'),
          html: this.translate.instant('PASS_FAIL_DELETED'),
          footer: `<span style="margin-left: auto">PASS_FAIL_DELETED</span>`,
          confirmButtonText: this.translate.instant('EVENT_S1.BUTTON'),
        });
      }
    });
  }

  removeBlockPhraseNameFormArray(blockIndex) {
    this.getBlockFormArray.removeAt(blockIndex);
  }

  handleRatioBlockChange(blockIndex, i) {
    const x = this.getBlockPhraseParameterFormArray(blockIndex).at(i).get('validation_parameter').get('ratio_value');
    if (x.value < 0) {
      x.setValue(0);
    }
  }

  save() {
    this.isWaitingForResponse = true;
    const payload = this.templateForm.value;

    for (const nameArray of payload.phrase_names) {
      // below for_of loop make sure that if the phrase names is index 0, the correlation must be null.
      // happens when we make multiple names, and then delete which make last index with corr as first index still with corr
      if (nameArray.phrase_parameters[0].correlation !== null) {
        nameArray.phrase_parameters[0].correlation = null;
      };
      // Delete the _id of phrase if there is no _id, as in its newly created
      if (nameArray && !nameArray._id) {
        delete nameArray._id;
      }
    }

    if (this.grandOralData && this.grandOralData.rncp_id) {
      const id = this.grandOralData._id;
      if (payload && payload.rncp_id && payload.rncp_id._id) {
        payload.rncp_id = payload.rncp_id._id;
      }
      if (payload && payload.class_id && payload.class_id._id) {
        payload.class_id = payload.class_id._id;
      }
      this.subs.sink = this.rncpTitleService.updateGrandOralValidation(payload, id).subscribe((res) => {
        this.grandOralData = res;
        this.firstForm = _.cloneDeep(this.templateForm.value);
        this.isWaitingForResponse = false;
        Swal.fire({
          title: this.translate.instant('Bravo'),
          type: 'success',
        }).then(result => {
          this.isWaitingForResponse = true;
          this.ngOnInit();
        })
      }, err => this.isWaitingForResponse = false);
    } else {
      this.subs.sink = this.rncpTitleService.createGrandOralValidation(payload).subscribe((res) => {
        this.grandOralData = res;
        this.firstForm = _.cloneDeep(this.templateForm.value);
        this.isWaitingForResponse = false;
        Swal.fire({
          title: this.translate.instant('Bravo'),
          type: 'success',
        }).then(result => {
          this.isWaitingForResponse = true;
          this.ngOnInit();
        })
      }, err => this.isWaitingForResponse = false);
    }
  }

  updateGrandOral() {
    const payload = this.templateForm.value;

    if (this.grandOralData && this.grandOralData.rncp_id) {
      const id = this.grandOralData._id;
      if (payload && payload.rncp_id && payload.rncp_id._id) {
        payload.rncp_id = payload.rncp_id._id;
      }
      if (payload && payload.class_id && payload.class_id._id) {
        payload.class_id = payload.class_id._id;
      }
      this.subs.sink = this.rncpTitleService.updateGrandOralValidation(payload, id).subscribe((res) => {
        this.grandOralData = res;
        this.firstForm = _.cloneDeep(this.templateForm.value);
      });
    } else {
      this.subs.sink = this.rncpTitleService.createGrandOralValidation(payload).subscribe((res) => {
        this.grandOralData = res;
        this.firstForm = _.cloneDeep(this.templateForm.value);
      });
    }
  }

  ngOnDestroy(): void {
    clearTimeout(this.timeOutVal);
    this.subs.unsubscribe();
  }

  comparison() {
    const firstForm = JSON.stringify(this.firstForm);
    const form = JSON.stringify(this.templateForm.value);
    if (firstForm === form) {
      return true;
    } else {
      return false;
    }
  }

  populateDataGrandOralValidation() {
    const forkParam = [];
    const form1 = this.rncpTitleService.getAllBlockOfCompetenceTemplateDropdown(this.selectedRncpTitleId, this.selectedClassId);
    forkParam.push(form1);
    const form2 = this.rncpTitleService.getAllBlockOfSoftSkillTemplateDropdown(this.selectedRncpTitleId, this.selectedClassId);
    forkParam.push(form2);
    const form3 = this.rncpTitleService.getClassScoreConversionById(this.selectedClassId);
    forkParam.push(form3);

    this.subs.sink = forkJoin(forkParam).subscribe((response) => {
      if (response && response.length) {
        this.populateDataDropdown(response[0], response[1]);
        this.populateScore(response[2]);
        this.populateData();
      }
    });
  }
}
