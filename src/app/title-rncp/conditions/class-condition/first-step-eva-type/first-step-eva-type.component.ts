import { Component, OnInit, Input, EventEmitter, Output, OnDestroy } from '@angular/core';
import { Observable } from 'rxjs';
import { UntypedFormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
import { startWith, map, debounceTime } from 'rxjs/operators';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import * as _ from 'lodash';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MatSelectChange } from '@angular/material/select';
import { TranslateService } from '@ngx-translate/core';
import Swal from 'sweetalert2';
import { SubSink } from 'subsink';
import { GlobalErrorService } from 'app/service/global-error-service/global-error-service.service';
import { truncate } from 'fs';
import { ConditionsService } from 'app/service/conditions/conditions.service';

@Component({
  selector: 'ms-first-step-eva-type',
  templateUrl: './first-step-eva-type.component.html',
  styleUrls: ['./first-step-eva-type.component.scss'],
})
export class FirstStepEvaTypeComponent implements OnInit, OnDestroy {
  private subs = new SubSink();
  @Input() selectedRncpTitleId: string;
  @Input() selectedClassId: string;
  @Input() typeEvaluation: string;
  @Input() subTypeEvaluation: string;
  @Input() className: string;
  @Input() titleName: string;
  @Input() classConditionData: any;
  @Output() update = new EventEmitter<any>();
  titleList = [];
  filteredTitle: Observable<any[]>;
  titleLoading = false;
  classList = [];
  filteredClass: Observable<any[]>;
  classLoading = false;
  isWaitingForResponse = false;

  firstStepForm: UntypedFormGroup;
  evaType = ['score', 'expertise'];
  evaSubType = ['point_weight', 'point_coefficient', 'mark'];

  duplicateForm: UntypedFormGroup;
  isDuplicate = false;

  isSelected = false;

  // temp var
  is_condition_setup = false;
  evaSelected;
  private intVal: any;
  private timeOutVal: any;

  constructor(
    private fb: UntypedFormBuilder,
    private rncpTitleService: RNCPTitlesService,
    private translate: TranslateService,
    private globalErrorService: GlobalErrorService,
    private conditionService: ConditionsService,
  ) {}

  ngOnInit() {
    // Caught error from global error handler
    this.subs.sink = this.globalErrorService.globalErrorData$.subscribe((isError) => {
      if (isError) {
        this.isWaitingForResponse = false;
        this.globalErrorService.setGlobalError(false);
      }
    });

    this.initFirstStepForm();
    this.initDuplicateForm();


    if (this.typeEvaluation) {
      this.is_condition_setup = true;
    }
    if (this.classConditionData) {

      const temp = _.cloneDeep(this.classConditionData);
      this.firstStepForm.patchValue(temp);


    }
  }

  changeSelectedTitle() {
    this.duplicateForm.get('duplicate_from_class').enable();
    this.duplicateForm.get('duplicate_from_class').setValue(null);
    this.classList = [];
    if (this.firstStepForm.get('type_evaluation').value === 'score') {
      this.getClassList('');
    } else {
      this.getClassListNotScore('');
    }
  }

  initFirstStepForm() {
    this.firstStepForm = this.fb.group({
      type_evaluation: this.typeEvaluation ? [this.typeEvaluation, Validators.required] : [null, Validators.required],
      sub_type_evaluation: this.subTypeEvaluation ? [this.subTypeEvaluation] : [null],
      evaluation_step: ['first'],
      competency: this.fb.group({
        allow_competency_auto_evaluation: [true],
        allow_competency_pro_evaluation: [true]
      }),
      soft_skill: this.fb.group({
        allow_soft_skill: [true],
        allow_soft_skill_auto_evaluation: [true],
        allow_soft_skill_pro_evaluation: [true],
        allow_pc_soft_skill_eval: [true]
      })
    });
    this.conditionService.validationDataFormControls = this.firstStepForm;
  }

  initDuplicateForm() {
    this.duplicateForm = this.fb.group({
      duplicate_from_title: [null, Validators.required],
      duplicate_from_class: [{ value: null, disabled: true }, Validators.required],
    });
  }

  getTitleList(search: string) {
    this.duplicateForm.get('duplicate_from_title').setValue(null);
    this.duplicateForm.get('duplicate_from_class').setValue(null);
    this.subs.sink = this.rncpTitleService
      .getTitleConditionSearchDropdown(this.firstStepForm.get('type_evaluation').value, this.firstStepForm.get('sub_type_evaluation').value)
      .subscribe((resp) => {

        if (resp) {
          this.titleList = _.cloneDeep(resp);
          this.filteredTitle = this.duplicateForm.get('duplicate_from_title').valueChanges.pipe(
            startWith(search),
            map((searchVal) =>
              this.titleList.filter((opt) => {
                if (typeof searchVal === 'string') {
                  return this.simpleDiacriticSensitiveRegex(opt.short_name)
                    .toLowerCase()
                    .includes(this.simpleDiacriticSensitiveRegex(searchVal).toLowerCase());
                }
              }),
            ),
          );
        }
      });
  }

  getTitleListNotScore(search: string) {
    this.duplicateForm.get('duplicate_from_title').setValue(null);
    this.duplicateForm.get('duplicate_from_class').setValue(null);
    this.subs.sink = this.rncpTitleService
      .getTitleConditionSearchNotScore(this.firstStepForm.get('type_evaluation').value)
      .subscribe((resp) => {

        if (resp) {
          this.titleList = _.cloneDeep(resp);
          this.filteredTitle = this.duplicateForm.get('duplicate_from_title').valueChanges.pipe(
            startWith(search),
            map((searchVal) =>
              this.titleList.filter((opt) => {
                if (typeof searchVal === 'string') {
                  return this.simpleDiacriticSensitiveRegex(opt.short_name)
                    .toLowerCase()
                    .includes(this.simpleDiacriticSensitiveRegex(searchVal).toLowerCase());
                }
              }),
            ),
          );
        }
      });
  }

  getClassList(search: string) {
    this.titleLoading = true;
    this.subs.sink = this.rncpTitleService
      .getClassConditionDropdownWithScore(
        this.duplicateForm.get('duplicate_from_title').value,
        search,
        this.firstStepForm.get('type_evaluation').value,
        this.firstStepForm.get('sub_type_evaluation').value,
      )
      .subscribe((resp) => {
        if (resp) {
          this.classList = _.cloneDeep(resp);
          this.filteredClass = this.duplicateForm.get('duplicate_from_class').valueChanges.pipe(
            startWith(search),
            map((searchVal) =>
              this.classList.filter((opt) => {
                if (typeof searchVal === 'string') {
                  return this.simpleDiacriticSensitiveRegex(opt.name)
                    .toLowerCase()
                    .includes(this.simpleDiacriticSensitiveRegex(searchVal).toLowerCase());
                }
              }),
            ),
          );
        } else {
          this.filteredClass = null;
        }
      });
  }

  getClassListNotScore(search: string) {
    this.titleLoading = true;
    this.subs.sink = this.rncpTitleService
      .getClassConditionDropdown(
        this.duplicateForm.get('duplicate_from_title').value,
        search,
        this.firstStepForm.get('type_evaluation').value,
      )
      .subscribe((resp) => {
        if (resp) {
          this.classList = _.cloneDeep(resp);
          this.filteredClass = this.duplicateForm.get('duplicate_from_class').valueChanges.pipe(
            startWith(search),
            map((searchVal) =>
              this.classList.filter((opt) => {
                if (typeof searchVal === 'string') {
                  return this.simpleDiacriticSensitiveRegex(opt.name)
                    .toLowerCase()
                    .includes(this.simpleDiacriticSensitiveRegex(searchVal).toLowerCase());
                }
              }),
            ),
          );
        } else {
          this.filteredClass = null;
        }
      });
  }

  selectType(event: MatSelectChange) {

    if (event.value !== 'score') {
      this.firstStepForm.get('type_evaluation').patchValue(event.value);
      this.firstStepForm.get('sub_type_evaluation').patchValue(null);
      this.firstStepForm.get('sub_type_evaluation').clearValidators();
      this.getTitleListNotScore('');
    } else {
      this.firstStepForm.get('type_evaluation').patchValue(event.value);
      this.firstStepForm.get('sub_type_evaluation').setValidators([Validators.required]);
    }
    this.firstStepForm.get('sub_type_evaluation').updateValueAndValidity();
  }

  allowSoftSkillChange(event: MatCheckboxChange) {

    if (event && event.checked) {
      this.firstStepForm.get('soft_skill').get('allow_soft_skill_auto_evaluation').patchValue(true);
      this.firstStepForm.get('soft_skill').get('allow_soft_skill_pro_evaluation').patchValue(true);
      this.firstStepForm.get('soft_skill').get('allow_pc_soft_skill_eval').patchValue(true);

      this.firstStepForm.get('soft_skill').get('allow_soft_skill_auto_evaluation').setValidators([Validators.requiredTrue]);
      this.firstStepForm.get('soft_skill').get('allow_soft_skill_pro_evaluation').setValidators([Validators.requiredTrue]);
      this.firstStepForm.get('soft_skill').get('allow_pc_soft_skill_eval').setValidators([Validators.requiredTrue]);

      this.firstStepForm.get('soft_skill').get('allow_soft_skill_auto_evaluation').updateValueAndValidity();
      this.firstStepForm.get('soft_skill').get('allow_soft_skill_pro_evaluation').updateValueAndValidity();
      this.firstStepForm.get('soft_skill').get('allow_pc_soft_skill_eval').updateValueAndValidity();
    } else {
      this.firstStepForm.get('soft_skill').get('allow_soft_skill_auto_evaluation').patchValue(false);
      this.firstStepForm.get('soft_skill').get('allow_soft_skill_pro_evaluation').patchValue(false);
      this.firstStepForm.get('soft_skill').get('allow_pc_soft_skill_eval').patchValue(false);

      this.firstStepForm.get('soft_skill').get('allow_soft_skill_auto_evaluation').clearValidators()
      this.firstStepForm.get('soft_skill').get('allow_soft_skill_pro_evaluation').clearValidators();
      this.firstStepForm.get('soft_skill').get('allow_pc_soft_skill_eval').clearValidators();

      this.firstStepForm.get('soft_skill').get('allow_soft_skill_auto_evaluation').updateValueAndValidity();
      this.firstStepForm.get('soft_skill').get('allow_soft_skill_pro_evaluation').updateValueAndValidity();
      this.firstStepForm.get('soft_skill').get('allow_pc_soft_skill_eval').updateValueAndValidity();
    }
  }

  sofSkillEvaluationChange(event: MatCheckboxChange) {
    const temp = this.firstStepForm.get('soft_skill').value;

    if (temp.allow_soft_skill) {
      if (temp.allow_soft_skill_auto_evaluation || temp.allow_soft_skill_pro_evaluation) {
        this.firstStepForm.get('soft_skill').get('allow_soft_skill_auto_evaluation').clearValidators()
        this.firstStepForm.get('soft_skill').get('allow_pc_soft_skill_eval').clearValidators()
        this.firstStepForm.get('soft_skill').get('allow_soft_skill_pro_evaluation').clearValidators()

        this.firstStepForm.get('soft_skill').get('allow_soft_skill_auto_evaluation').updateValueAndValidity();
        this.firstStepForm.get('soft_skill').get('allow_pc_soft_skill_eval').updateValueAndValidity();
        this.firstStepForm.get('soft_skill').get('allow_soft_skill_pro_evaluation').updateValueAndValidity();
      } else {
        this.firstStepForm.get('soft_skill').get('allow_soft_skill_auto_evaluation').setValidators([Validators.requiredTrue]);
        this.firstStepForm.get('soft_skill').get('allow_pc_soft_skill_eval').setValidators([Validators.requiredTrue]);
        this.firstStepForm.get('soft_skill').get('allow_soft_skill_pro_evaluation').setValidators([Validators.requiredTrue]);

        this.firstStepForm.get('soft_skill').get('allow_soft_skill_auto_evaluation').updateValueAndValidity();
        this.firstStepForm.get('soft_skill').get('allow_pc_soft_skill_eval').updateValueAndValidity();
        this.firstStepForm.get('soft_skill').get('allow_soft_skill_pro_evaluation').updateValueAndValidity();
      }
    }
  }

  methodSelection(type: string) {
    if (type && type === 'duplicate') {
      this.isDuplicate = true;
    } else {
      this.saveFirstTab();
    }
  }

  createPayload(dataForm) {
    const result = _.cloneDeep(dataForm);
    if (result) {
      if (result.evaluation_step === 'none') {
        result.evaluation_step = 'first'
      }
      if (result.type_evaluation !== 'expertise') {
        result.competency.allow_competency_auto_evaluation = false;
        result.competency.allow_competency_pro_evaluation = false;
        result.soft_skill.allow_soft_skill = false;
        result.soft_skill.allow_soft_skill_auto_evaluation = false;
        result.soft_skill.allow_soft_skill_pro_evaluation = false;
      }
    }
    return result;
  }

  saveFirstTab(type?: string) {
    this.isDuplicate = false;
    const payload = this.createPayload(this.firstStepForm.value);
    if (!type) {
      let timeDisabledinSec = 6;
      Swal.fire({
        type: 'warning',
        title: this.translate.instant('CCFT_S02.TITLE', { className: this.className, titleName: this.titleName }),
        text: this.translate.instant('CCFT_S02.TEXT', { className: this.className, titleName: this.titleName }),
        confirmButtonText: this.translate.instant('CCFT_S02.BUTTON_1'),
        showCancelButton: true,
        cancelButtonText: this.translate.instant('CCFT_S02.BUTTON_2'),
        allowEscapeKey: false,
        allowOutsideClick: false,
        onOpen: () => {
          Swal.disableConfirmButton();
          const confirmButtonRef = Swal.getConfirmButton();

          // TimerLoop for derementing timeDisabledinSec
          this.intVal = setInterval(() => {
            timeDisabledinSec -= 1;
            confirmButtonRef.innerText = this.translate.instant('CCFT_S02.BUTTON_1') + `(${timeDisabledinSec})`;
          }, 1000);
          this.timeOutVal = setTimeout(() => {
            confirmButtonRef.innerText = this.translate.instant('CCFT_S02.BUTTON_1');
            Swal.enableConfirmButton();
            // clearTimeout(timerLoop);
            clearInterval(this.intVal);
          }, timeDisabledinSec * 1000);
          // clearTimeout(this.timeOutVal);
        },
      }).then((result) => {
        if (result.value) {
          this.isWaitingForResponse = true;
          this.subs.sink = this.rncpTitleService
            .saveFirstCondition(this.selectedClassId, payload)
            .subscribe((response) => {
              if (response && response.data && response.data.CreateUpdateCondition) {
                const resp = response.data.CreateUpdateCondition;

                this.isWaitingForResponse = false;
                this.is_condition_setup = true;
                if (resp && resp.type_evaluation) {
                  this.firstStepForm.get('type_evaluation').patchValue(resp.type_evaluation);
                }
                if (resp && resp.sub_type_evaluation) {
                  this.firstStepForm.get('sub_type_evaluation').patchValue(resp.sub_type_evaluation);
                }
                this.update.emit();
              }
            });
        }
      });
    } else {
      // if (this.typeEvaluation !== this.firstStepForm.get('type_evaluation').value) {
      this.isWaitingForResponse = true;
      this.subs.sink = this.rncpTitleService.saveFirstCondition(this.selectedClassId, payload).subscribe((response) => {
        this.isWaitingForResponse = false;

        if (response && response.data && response.data.CreateUpdateCondition && !response.errors) {
          const resp = response.data.CreateUpdateCondition;
          this.is_condition_setup = true;
          if (resp && resp.type_evaluation) {
            this.firstStepForm.get('type_evaluation').patchValue(resp.type_evaluation);
          }
          if (resp && resp.sub_type_evaluation) {
            this.firstStepForm.get('sub_type_evaluation').patchValue(resp.sub_type_evaluation);
          }
          this.update.emit();
        } else if (response.errors && response.errors.length) {
          Swal.fire({
            type: 'error',
            title: this.translate.instant('EVAL_BY_EXPERTISE.EVAL_S6.TITLE'),
            text: this.translate.instant('EVAL_BY_EXPERTISE.EVAL_S6.TEXT'),
            confirmButtonText: this.translate.instant('EVAL_BY_EXPERTISE.EVAL_S6.BUTTON'),
          });
        }
      });
      // }
    }
  }

  duplicateNow() {
    let timeDisabledinSec = 6;
    let selectedClassName = '';
    const filteredData = this.classList.filter((classes) => classes._id === this.duplicateForm.get('duplicate_from_class').value);


    if (filteredData && filteredData.length > 0) {
      selectedClassName = filteredData[0].name;
    } else {
      selectedClassName = '';
    }
    Swal.fire({
      type: 'warning',
      title: this.translate.instant('CCFT_S01.TITLE', { className: selectedClassName }),
      text: this.translate.instant('CCFT_S01.TEXT'),
      confirmButtonText: this.translate.instant('CCFT_S01.BUTTON_1'),
      showCancelButton: true,
      cancelButtonText: this.translate.instant('CCFT_S01.BUTTON_2'),
      allowEscapeKey: false,
      allowOutsideClick: false,
      onOpen: () => {
        Swal.disableConfirmButton();
        const confirmButtonRef = Swal.getConfirmButton();

        // TimerLoop for derementing timeDisabledinSec
        this.intVal = setInterval(() => {
          timeDisabledinSec -= 1;
          confirmButtonRef.innerText = this.translate.instant('CCFT_S01.BUTTON_1') + `(${timeDisabledinSec})`;
        }, 1000);
        this.timeOutVal = setTimeout(() => {
          confirmButtonRef.innerText = this.translate.instant('CCFT_S01.BUTTON_1');
          Swal.enableConfirmButton();
          // clearTimeout(this.intVal);
          clearInterval(this.intVal);
        }, timeDisabledinSec * 1000);
        // clearTimeout(this.timeOutVal);
      },
    }).then((result) => {
      if (result.value) {
        this.subs.sink = this.rncpTitleService.duplicateCondition(this.selectedClassId, this.duplicateForm.value).subscribe(
          (resp) => {
            if (resp && resp.data && resp.data.CreateUpdateCondition) {

              const respp = resp.data.CreateUpdateCondition;

              this.isWaitingForResponse = false;
              this.is_condition_setup = true;
              if (respp && respp.type_evaluation) {
                this.firstStepForm.get('type_evaluation').patchValue(respp.type_evaluation);
              }
              if (respp && respp.sub_type_evaluation) {
                this.firstStepForm.get('sub_type_evaluation').patchValue(respp.sub_type_evaluation);
              }
              this.update.emit();
              Swal.fire({
                type: 'success',
                title: this.translate.instant('CCFT_S01b.TITLE'),
                text: this.translate.instant('CCFT_S01b.TEXT', { className: this.className }),
                confirmButtonText: this.translate.instant('CCFT_S01b.BUTTON_1'),
                allowEscapeKey: false,
                allowOutsideClick: false,
              });
            } else {

              Swal.fire({
                type: 'error',
                title: 'Error !',
                text: resp.errors[0].message,
              });
            }
          },
          (err) => {

            const text = String(err);
            const message = text.slice(21);
            const alert = message;

            Swal.fire({
              type: 'error',
              title: 'Error !',
              text: alert,
            });
          },
        );
      }
    });
  }

  simpleDiacriticSensitiveRegex(text: string): string {
    if (text) {
      return text
        .replace(/[a,á,à,ä]/g, 'a')
        .replace(/[e,é,ë,è]/g, 'e')
        .replace(/[i,í,ï,Î,î]/g, 'i')
        .replace(/[o,ó,ö,ò,ô]/g, 'o')
        .replace(/[u,ü,ú,ù]/g, 'u')
        .replace(/[ ,-]/g, ' ');
    } else {
      return '';
    }
  }

  displayTitleName(data: string): string | undefined {
    const filteredData = this.titleList.filter((title) => title._id === data);

    if (filteredData && filteredData.length > 0) {
      return filteredData[0].short_name;
    } else {
      return '';
    }
  }

  displayClassName(data: string): string | undefined {
    const filteredData = this.classList.filter((classes) => classes._id === data);

    if (filteredData && filteredData.length > 0) {
      return filteredData[0].name;
    } else {
      return '';
    }
  }

  scrollToElement($element): void {
    $element.scrollIntoView({behavior: 'smooth', block: 'start', inline: 'nearest'});
  }

  ngOnDestroy(): void {
    clearTimeout(this.timeOutVal);
    clearInterval(this.intVal);
    this.subs.unsubscribe();
  }
}
