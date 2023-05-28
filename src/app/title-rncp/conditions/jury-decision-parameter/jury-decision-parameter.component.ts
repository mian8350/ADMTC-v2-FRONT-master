import { Component, OnInit, Input, OnDestroy, QueryList, ViewChildren } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSelectChange } from '@angular/material/select';
import { MatTable } from '@angular/material/table';
import { AddPassFailDialogComponent } from './add-pass-fail-dialog/add-pass-fail-dialog.component';
import { ConditionsService } from 'app/service/conditions/conditions.service';
import { ExpertiseBlockDropdown, SubjectDropdown, TestDropdown, JuryDecisionParameterPayload } from './jury-decision-parameter.model';
import { UntypedFormBuilder, UntypedFormGroup, UntypedFormArray, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { SubSink } from 'subsink';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'ms-jury-decision-parameter',
  templateUrl: './jury-decision-parameter.component.html',
  styleUrls: ['./jury-decision-parameter.component.scss'],
})
export class JuryDecisionParameterComponent implements OnInit, OnDestroy {
  private subs = new SubSink();

  @Input() selectedRncpTitleId: string;
  @Input() selectedRncpTitleName: string;
  @Input() selectedRncpTitleLongName: string;
  @Input() selectedClassId: string;
  @Input() selectedClassName: string;

  juryDecisionParameterForm: UntypedFormGroup;
  @ViewChildren(MatTable)
  matTables: QueryList<MatTable<any>>;

  displayedScoreColumns = ['correlation', 'validation_type', 'validation_parameters', 'score', 'action'];
  passFailConditions: { value: string; label: string }[];
  correlations: { value: string; label: string }[];
  validationTypes: { value: string; label: string }[];
  signs: string[];
  expertises: ExpertiseBlockDropdown[];
  subjects: SubjectDropdown[];
  tests: TestDropdown[];

  overallAverageSelected = 'overall_average';
  operation: string;
  juryDecisionParameterId: string;
  isWaitingForResponse = false;
  private timeOutVal: any;

  constructor(
    public passFailDialog: MatDialog,
    private conditionService: ConditionsService,
    private fb: UntypedFormBuilder,
    private translate: TranslateService,
  ) {}

  ngOnInit() {
    this.getConditionDropdownData();
    this.initJuryDecisionParameterForm();
  }

  getConditionDropdownData() {
    this.isWaitingForResponse = true;
    this.passFailConditions = this.conditionService.getConditionTypes();
    this.correlations = this.conditionService.getCorrelations();
    this.validationTypes = this.conditionService.getValidationTypes();
    this.signs = this.conditionService.getParameterSigns();
    this.subs.sink = this.conditionService.getExpertiseDropdownData(this.selectedRncpTitleId, this.selectedClassId).subscribe((exp) => {
      this.expertises = exp;
      this.subs.sink = this.conditionService.getSubjectDropdownData(this.selectedRncpTitleId, this.selectedClassId).subscribe((subj) => {
        this.subjects = subj;
        this.subs.sink = this.conditionService.getTestDropdownData(this.selectedRncpTitleId, this.selectedClassId).subscribe((test) => {
          this.tests = test;
          this.setFormData();
          this.isWaitingForResponse = false;
        });
      });
    });
  }

  initJuryDecisionParameterForm() {
    this.juryDecisionParameterForm = this.fb.group({
      rncp_id: [this.selectedRncpTitleId],
      class_id: [this.selectedClassId],
      decision_parameters: this.fb.array([this.initDecisionParameterFormArray()]),
    });
  }

  initDecisionParameterFormArray(condition?: string, name?: string) {
    return this.fb.group({
      condition_type: [condition ? condition : ''],
      condition_name: [name ? name : ''],
      parameters: this.fb.array([this.initParameterFormArray()]),
    });
  }

  initParameterFormArray() {
    return this.fb.group({
      correlation: [''],
      validation_type: [''],
      block_parameters: [''],
      subject_parameters: [''],
      evaluation_parameters: [''],
      sign: [''],
      score: [null, Validators.min(0)],
    });
  }

  setFormData() {
    // fill form with existing data
    this.subs.sink = this.conditionService.getJuryDecisionParameter(this.selectedRncpTitleId, this.selectedClassId).subscribe((resp) => {
      if (resp) {
        this.operation = 'update';
        this.juryDecisionParameterId = resp._id;

        // path value for each decision parameter block (the block that has yellow border)
        resp.decision_parameters.forEach((decisionParameter, i) => {
          if (i > 0) {
            this.addpassFailDecisionParameters();
          }
          this.passFailDecisionParameters.get(i.toString()).patchValue(decisionParameter);
          decisionParameter.parameters.forEach((param, j) => {
            const blocks = [];
            const subjects = [];
            const tests = [];

            // convert object { subject_name, _id } to be string array of _id
            if (param.block_parameters.length > 0) {
              param.block_parameters.forEach((block) => {
                blocks.push(block._id);
              });
              // if blocks is more than one,
              // it mean the user select average block on validation type,
              // so the parameter dropdown is multiple.

              // if blocks has only one element,
              // it mean the user select block on validation type,
              // so the parameter dropdown is not multiple
              param.block_parameters = blocks.length > 1 ? blocks : blocks[0];
            }
            if (param.subject_parameters.length > 0) {
              param.subject_parameters.forEach((subject) => {
                subjects.push(subject._id);
              });
              param.subject_parameters = subjects.length > 1 ? subjects : subjects[0];
            }
            if (param.evaluation_parameters.length > 0) {
              param.evaluation_parameters.forEach((test) => {
                tests.push(test._id);
              });
              param.evaluation_parameters = tests.length > 1 ? tests : tests[0];
            }

            if (j > 0) {
              this.addParameters(i.toString());
            }

            this.getParameters(i.toString()).get(j.toString()).patchValue(param);
          });
        });
      } else {
        this.operation = 'create';
      }
    });
  }

  get passFailDecisionParameters() {
    return this.juryDecisionParameterForm.get('decision_parameters') as UntypedFormArray;
  }

  getPassFailDecisionParameters(): UntypedFormArray {
    return this.juryDecisionParameterForm.get('decision_parameters') as UntypedFormArray;
  }

  addpassFailDecisionParameters(condition?: string, name?: string) {
    this.passFailDecisionParameters.push(this.initDecisionParameterFormArray(condition, name));

    this.matTables.forEach((each) => each.renderRows());
  }

  removepassFailDecisionParameters(index: number) {
    let timeDisabled = 5;
    Swal.fire({
      title: this.translate.instant('DASHBOARD_DELETE.deletedTitle'),
      html: this.translate.instant('DELETE_PASS_FAIL_DECISION'),
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
        this.passFailDecisionParameters.removeAt(index);

        this.matTables.forEach((each) => each.renderRows());
        Swal.fire({
          type: 'success',
          title: this.translate.instant('EVENT_S1.TITLE'),
          html: this.translate.instant('PASS_FAIL_DELETED'),
          confirmButtonText: this.translate.instant('EVENT_S1.BUTTON'),
        });
      }
    });
  }

  getParameters(index): UntypedFormArray {
    return this.passFailDecisionParameters.get(index).get('parameters') as UntypedFormArray;
  }

  addParameters(index: string) {

    this.getParameters(index).push(this.initParameterFormArray());

    this.matTables.forEach((each) => each.renderRows());
  }

  removeParameters(indexDecisionParameter: string, indexParameter: string) {
    let timeDisabled = 5;
    Swal.fire({
      title: this.translate.instant('PARAM_S1.deletedTitle'),
      html: this.translate.instant('PARAM_S1.deletedMessage'),
      footer: `<span style="margin-left: auto">PARAM_S1</span>`,
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
        this.getParameters(indexDecisionParameter.toString()).removeAt(+indexParameter);

        this.matTables.forEach((each) => each.renderRows());
        Swal.fire({
          type: 'success',
          title: this.translate.instant('EVENT_S1.TITLE'),
          confirmButtonText: this.translate.instant('EVENT_S1.BUTTON'),
        });
      }
    });
  }

  getValidationType(i: string, j: string) {
    return this.getParameters(i).get(j).get('validation_type').value;
  }

  openPassFailDialog() {
    const dialogRef = this.passFailDialog.open(AddPassFailDialogComponent, {
      width: '50%',
      disableClose: true,
      panelClass: 'pass-fail-pop-up',
    });
    this.subs.sink = dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.addpassFailDecisionParameters(result.condition, result.name);
      }
    });
  }

  saveJuryDecisionParameter() {
    let payload: JuryDecisionParameterPayload = this.juryDecisionParameterForm.getRawValue();
    payload = this.cleanPayloadObject(payload);

    if (this.operation === 'create') {
      this.subs.sink = this.conditionService.createJuryDecisionParameter(payload).subscribe((resp) => {
        Swal.fire({
          title: 'Save success!',
          type: 'success',
        });
      });
    } else if (this.operation === 'update') {
      this.subs.sink = this.conditionService.updateJuryDecisionParameter(this.juryDecisionParameterId, payload).subscribe((resp) => {
        Swal.fire({
          title: 'Update success!',
          type: 'success',
        });
      });
    }
  }

  generatePdf() {

  }

  // remove object properties that has null or "" value
  cleanPayloadObject(payload: JuryDecisionParameterPayload) {
    payload.decision_parameters.forEach((decParam, i) => {
      decParam.parameters.forEach((parameterData, j) => {
        if (!parameterData.correlation) {
          delete payload.decision_parameters[i].parameters[j].correlation;
        }
        if (!parameterData.block_parameters) {
          delete payload.decision_parameters[i].parameters[j].block_parameters;
        }
        if (!parameterData.subject_parameters) {
          delete payload.decision_parameters[i].parameters[j].subject_parameters;
        }
        if (!parameterData.evaluation_parameters) {
          delete payload.decision_parameters[i].parameters[j].evaluation_parameters;
        }
      });
    });
    return payload;
  }

  // validation to make sure user choose more than 2 parameter when selecting average block, subject, and title
  isMultipleSelected(event: MatSelectChange, passFailDecisionParameterIndex: string, parameterIndex: string, formControlName: string) {
    if (event.value.length < 2) {
      this.getParameters(passFailDecisionParameterIndex).get(parameterIndex).get(formControlName).setErrors({ invalid: true });
    } else {
      this.getParameters(passFailDecisionParameterIndex).get(parameterIndex).get(formControlName).setErrors(null);
    }
  }

  ngOnDestroy(): void {
    clearTimeout(this.timeOutVal);
    this.subs.unsubscribe();
  }
}
