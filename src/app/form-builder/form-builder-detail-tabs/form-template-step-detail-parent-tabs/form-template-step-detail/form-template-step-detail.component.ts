import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  QueryList,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { removeSpaces } from 'app/service/customvalidator.validator';
import { UtilityService } from 'app/service/utility/utility.service';
import { SubSink } from 'subsink';
import * as _ from 'lodash';
import Swal from 'sweetalert2';
import { FormBuilderService } from 'app/service/form-builder/form-builder.service';
import { AddFormStepDialogComponent } from './add-form-step-dialog/add-form-step-dialog.component';
import { AddFormValidatorDialogComponent } from './add-form-validator-dialog/add-form-validator-dialog.component';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

@Component({
  selector: 'ms-form-template-step-detail',
  templateUrl: './form-template-step-detail.component.html',
  styleUrls: ['./form-template-step-detail.component.scss'],
})
export class FormTemplateStepDetailComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() templateId;
  @Input() templateType;
  @Output() routeTabIndex = new EventEmitter<number>();
  @Output() finalValidation = new EventEmitter<boolean>();
  @ViewChildren('stepperForm') public stepper: QueryList<any>;
  private stepperForm;
  // @ViewChild('stepperForm', {static: false}) stepperForm;

  templateDetailForm: UntypedFormGroup;
  templateData: any;
  private subs = new SubSink();
  noData = false;
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  isPublishable = false;
  dataSource = new MatTableDataSource([]);
  dataSourceValidator = new MatTableDataSource([]);
  isWaitingForResponse = false;

  displayedColumns: string[] = ['number', 'stepName', 'action'];
  displayedColumnsValidator: string[] = ['number', 'userType', 'action'];
  stepCount = 0;
  validatorCount = 0;
  selectedStepIndex = 0;
  initialForm: any;
  templateSteps = [];

  templateTypeFiltered: Observable<any[]>;
  templateTypeList = [
    {
      value: 'student_admission',
      name: 'Student Admission',
    },
    { value: 'quality_file', name: 'Quality File' },
    { value: 'employability_survey', name: 'Employability Survey' },
  ];
  intVal: any;
  timeOutVal: any;
  isStepOverflowing: boolean = false;

  constructor(
    private fb: UntypedFormBuilder,
    public dialog: MatDialog,
    private formBuilderService: FormBuilderService,
    private router: Router,
    private translate: TranslateService,
    private utilService: UtilityService,
  ) {}

  ngOnInit() {
    this.initTemplateDetailForm();
    this.formBuilderService.setStepData(null);

    if (this.templateId) {
      this.populateTemplateData();
    } else {
      this.initialForm = this.templateDetailForm.getRawValue();
    }
    this.initTemplateTypeFilter();    
    this.initValueChange();

    this.subs.sink = this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      this.templateTypeList = this.templateTypeList.map((element) => {
        if (element.value === this.templateDetailForm.get('template_type').value && element.value !== 'alumni') {
          element.name = this.translate.instant(element.value);
        } else if (element.value === 'alumni') {
          element.name = this.translate.instant('Alumni survey');
        }
        return element;
      });
      this.initTemplateTypeFilter();
    });
  }

  initValueChange(){
    this.isFormUnchanged();
    this.subs.sink = this.templateDetailForm.valueChanges.subscribe((status) => {            
        this.isFormUnchanged();
    });
  }

  initTemplateTypeFilter() {
    this.templateTypeFiltered = this.templateDetailForm.get('template_type').valueChanges.pipe(
      startWith(''),
      map((searchText) =>
        searchText
          ? this.templateTypeList
              .filter((type) => (type ? type.name.toLowerCase().includes(searchText.toLowerCase()) : false))
              .sort((a: any, b: any) => a.name.localeCompare(b.name))
          : this.templateTypeList,
      ),
    );    
  }

  ngAfterViewInit() {
    this.subs.sink = this.stepper.changes.subscribe((stepperRef: QueryList<any>) => {
      if (stepperRef.length) {
        this.stepperForm = stepperRef.first;
        this.checkIfOverflown();
      }
    });

    this.dataSourceValidator.paginator = this.paginator;
    this.dataSource.paginator = this.paginator;
  }



  populateTemplateData() {
    this.isWaitingForResponse = true;
    this.subs.sink = this.formBuilderService.getFormBuilderTemplateFirstTab(this.templateId).subscribe(
      (resp) => {
        this.isWaitingForResponse = false;
        const tempData = _.cloneDeep(resp);
        this.templateData = tempData;
        if (tempData) {
          // If the data is already published, we need to disable all button and form. But ng-select need to be disable via the form
          if (tempData && tempData.is_published) {
            this.templateDetailForm.get('template_type').disable();
          } else {
            this.templateDetailForm.get('template_type').enable();
          }

          if (tempData.created_by && tempData.created_by._id) {
            tempData.created_by = tempData.created_by._id;
          }
          if (tempData.steps && tempData.steps.length) {
            tempData.steps.forEach((step) => {
              if (step) {
                this.pushTemplateStep();
              }
            });
          }
          if (tempData.contract_signatory && tempData.contract_signatory.length) {
            tempData.contract_signatory.forEach((signatory) => {
              if (signatory) {
                this.pushTemplateValidator();
              }
            });
          }
          this.templateDetailForm.patchValue(tempData);
          this.initialForm = this.templateDetailForm.getRawValue();
          this.finalValidation.emit(this.templateDetailForm.get('is_final_validator_active').value);
          this.templateSteps = this.getTemplateStep().value;
          this.updateTableData();
        }
      },
      (err) => this.swalError(err),
    );
  }

  onStepChange(event) {

    this.selectedStepIndex = event.selectedIndex;
    this.setStepPreview(event.selectedIndex);
  }

  setStepPreview(index: any) {
    // this.formBuilderService.setStepData(this.templateData.steps[index]);
  }

  checkPublishable(templateData: any) {
    if (
      !this.templateDetailForm.valid ||
      !templateData.contract_template_text ||
      !templateData.steps.some(
        (step) =>
          step &&
          step.segments &&
          step.segments.length &&
          step.segments.some((segment) => segment && segment.question_fields && segment.question_fields.length),
      ) // check if at least one step has segment and at least one segment has a question
    ) {
      this.isPublishable = false;
    } else {
      this.isPublishable = true;
    }
  }

  updateTableData() {
    this.dataSource.data = this.getTemplateStep().value;
    this.stepCount = this.getTemplateStep().length;

    this.dataSourceValidator.data = this.getTemplateValidator().value;
    this.validatorCount = this.getTemplateValidator().length;
  }

  initTemplateDetailForm() {
    const currentUser = this.utilService.getCurrentUser();
    this.templateDetailForm = this.fb.group({
      form_builder_name: ['', [Validators.required, removeSpaces]],
      is_published: [false],
      is_contract_signatory_in_order: [false],
      created_by: [currentUser._id, [Validators.required]],
      steps: this.fb.array([]),
      contract_signatory: this.fb.array([]),
      template_type: [null, Validators.required],
      is_final_validator_active: [false],
    });
  }

  initStepsForm() {
    return this.fb.group({
      _id: [null, [Validators.required]],
      step_title: ['', [Validators.required]],
      step_type: ['', [Validators.required]],
      is_final_step: [false],
    });
  }

  pushTemplateStep() {
    this.getTemplateStep().push(this.initStepsForm());
  }

  getTemplateStep(): UntypedFormArray {
    return this.templateDetailForm.get('steps') as UntypedFormArray;
  }

  initValidatorsForm() {
    return this.fb.group({
      _id: [null, [Validators.required]],
      name: ['', [Validators.required]],
    });
  }

  pushTemplateValidator() {
    this.getTemplateValidator().push(this.initValidatorsForm());
  }

  getTemplateValidator(): UntypedFormArray {
    return this.templateDetailForm.get('contract_signatory') as UntypedFormArray;
  }

  addTemplateStep() {
    this.subs.sink = this.dialog
      .open(AddFormStepDialogComponent, {
        width: '400px',
        minHeight: '100px',
        panelClass: 'certification-rule-pop-up',
        disableClose: true,
        data: this.templateSteps ? this.templateSteps : null,
      })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          this.pushTemplateStep();
          this.isWaitingForResponse = true;
          this.subs.sink = this.formBuilderService.createFormBuilderStep(this.templateId, result).subscribe(
            (resp) => {
              this.isWaitingForResponse = false;
              this.getTemplateStep()
                .at(this.getTemplateStep().length - 1)
                .patchValue(resp);
              this.saveTemplateDetail();
            },
            (err) => this.swalError(err),
          );
        }
      });
  }

  

  isFormUnchanged(from?) {    
    const initialForm = JSON.stringify(this.initialForm);
    const currentForm = JSON.stringify(this.templateDetailForm.getRawValue());       
    if (initialForm === currentForm && from !== 'touched') {      
      this.formBuilderService.childrenFormValidationStatus = true;      
      return true;
    } else {      
        this.formBuilderService.childrenFormValidationStatus = false;
    }      
      return false;
    
  }

  addTemplateValidator() {
    this.subs.sink = this.dialog
      .open(AddFormValidatorDialogComponent, {
        width: '400px',
        minHeight: '100px',
        panelClass: 'certification-rule-pop-up',
        disableClose: true,
        data: {
          validators: this.getTemplateValidator().value,
          templateType: this.templateDetailForm.get('template_type').value,
        },
      })
      .afterClosed()
      .subscribe((result) => {
        if (result && result.length) {
          result.forEach((userType) => {
            this.pushTemplateValidator();
            this.getTemplateValidator()
              .at(this.getTemplateValidator().length - 1)
              .patchValue({ _id: userType, name: '' });
          });
          this.saveTemplateDetail();
        }
      });
  }

  onMoveItem(event: CdkDragDrop<any[]>) {

    const unallowedTypes = ['step_with_signing_process', 'final_message'];
    if (
      event.item.data &&
      event.item.data.step_type &&
      (unallowedTypes.includes(event.item.data.step_type) || event.item.data.is_final_step)
    ) {
      Swal.fire({
        type: 'error',
        title: 'Error',
        html: this.translate.instant('You can not move Contract Signing, Final Message, or Final Step'),
      });
      return;
    }
    const prevIndex = this.dataSource.data.findIndex((d) => d === event.item.data);
    const temp = _.cloneDeep(this.templateDetailForm.getRawValue());
    if (temp.steps && temp.steps.length) {
      moveItemInArray(temp.steps, prevIndex, event.currentIndex);
    }
    this.templateDetailForm.patchValue(temp);
    this.saveTemplateDetail(true);
  }

  onMoveItemValidator(event: CdkDragDrop<any[]>) {
    const prevIndex = this.dataSourceValidator.data.findIndex((d) => d === event.item.data);
    const temp = _.cloneDeep(this.templateDetailForm.getRawValue());
    if (temp.contract_signatory && temp.contract_signatory.length) {
      moveItemInArray(temp.contract_signatory, prevIndex, event.currentIndex);
    }
    this.templateDetailForm.patchValue(temp);
    this.saveTemplateDetail(true);
  }

  editStep(stepData) {
    // this.routeTabIndex.emit(rowIndex);
    this.subs.sink = this.dialog
      .open(AddFormStepDialogComponent, {
        width: '400px',
        minHeight: '100px',
        panelClass: 'certification-rule-pop-up',
        disableClose: true,
        data: {
          stepData: stepData,
          edit: true,
          templateSteps: this.templateSteps,
        },
      })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          this.isWaitingForResponse = true;
          const payload = {
            _id: stepData._id,
            ...result,
          };
          this.subs.sink = this.formBuilderService.createUpdateFormBuilderStep(payload).subscribe(
            (resp) => {
              if (resp) {
                this.isWaitingForResponse = false;
                this.saveTemplateDetail();
              }
            },
            (err) => this.swalError(err),
          );
        }
      });
  }

  deleteStep(stepId, rowIndex, stepName) {
    let timeDisabled = 4;
    Swal.fire({
      title: this.translate.instant('UserForm_S2.TITLE'),
      text: this.translate.instant('UserForm_S2.TEXT'),
      type: 'warning',
      allowEscapeKey: true,
      showCancelButton: true,
      confirmButtonText: this.translate.instant('UserForm_S2.BUTTON 1', { timer: timeDisabled }),
      cancelButtonText: this.translate.instant('UserForm_S2.BUTTON 2'),
      allowOutsideClick: false,
      allowEnterKey: false,
      onOpen: () => {
        Swal.disableConfirmButton();
        const confirmBtnRef = Swal.getConfirmButton();
        this.intVal = setInterval(() => {
          timeDisabled -= 1;
          confirmBtnRef.innerText = this.translate.instant('UserForm_S2.BUTTON 1') + ` (${timeDisabled})`;
        }, 1000);
        clearInterval(this.timeOutVal);
        this.timeOutVal = setTimeout(() => {
          confirmBtnRef.innerText = this.translate.instant('UserForm_S2.BUTTON 1');
          Swal.enableConfirmButton();
          clearInterval(this.intVal);
          clearTimeout(this.timeOutVal);
        }, timeDisabled * 1000);
      },
    }).then((res) => {
      clearTimeout(this.timeOutVal);
      if (res.value) {
        this.isWaitingForResponse = true;
        this.subs.sink = this.formBuilderService.deleteFormBuilderStep(stepId).subscribe(
          (resp) => {
            this.isWaitingForResponse = false;
            if (resp) {
              const temp = _.cloneDeep(this.templateDetailForm.getRawValue());
              if (temp && temp.steps && temp.steps[rowIndex]) {
                temp.steps.splice(rowIndex, 1);
              }
              this.saveTemplateDetail(false, temp);
            }
          },
          (err) => this.swalError(err, stepName),
        );
      }
    });
  }

  deleteValidator(rowIndex, userType) {
    const user_type = this.translate.instant('USER_TYPES.' + userType.name);
    let timeDisabled = 3;
    Swal.fire({
      type: 'warning',
      title: this.translate.instant('UserForm_S13.TITLE'),
      html: this.translate.instant('UserForm_S13.TEXT', { user_type: user_type }),
      confirmButtonText: this.translate.instant('UserForm_S13.CONFIRM', { timer: timeDisabled }),
      cancelButtonText: this.translate.instant('UserForm_S13.CANCEL'),
      showCancelButton: true,
      allowOutsideClick: false,
      allowEnterKey: false,
      allowEscapeKey: true,
      onOpen: () => {
        Swal.disableConfirmButton();
        const confirmBtnRef = Swal.getConfirmButton();
        const intVal = setInterval(() => {
          timeDisabled -= 1;
          confirmBtnRef.innerText = this.translate.instant('UserForm_S13.CONFIRM') + ` (${timeDisabled})`;
        }, 1000);

        this.timeOutVal = setTimeout(() => {
          confirmBtnRef.innerText = this.translate.instant('UserForm_S13.CONFIRM');
          Swal.enableConfirmButton();
          clearInterval(intVal);
          clearTimeout(this.timeOutVal);
        }, timeDisabled * 1000);
      },
    }).then((result) => {
      if (result.value) {
        const temp = _.cloneDeep(this.templateDetailForm.getRawValue());
        if (temp && temp.contract_signatory && temp.contract_signatory[rowIndex]) {
          temp.contract_signatory.splice(rowIndex, 1);
        }
        this.saveTemplateDetail(false, temp);
      }
    });
  }

  saveTemplateDetail(noNeedSwal?: boolean, customPayload?) {
    // Create payload first
    let payload = this.templateDetailForm.getRawValue();
    if (customPayload) {
      payload = customPayload;
    }
    if (payload.steps && payload.steps.length) {
      const tempSteps = [];
      payload.steps.forEach((step) => {
        tempSteps.push(step._id);
      });
      payload.steps = tempSteps;
    }
    if (payload.contract_signatory && payload.contract_signatory.length) {
      const tempSignatory = [];
      payload.contract_signatory.forEach((signatory) => {
        tempSignatory.push(signatory._id);
      });
      payload.contract_signatory = tempSignatory;
    }

    // If templateId exist, we call update, but if not, then we call create
    if (this.templateId) {
      this.isWaitingForResponse = true;
      this.subs.sink = this.formBuilderService.updateFormBuilderTemplate(this.templateId, payload).subscribe(
        (resp) => {
          this.isWaitingForResponse = false;
          this.initialForm = this.templateDetailForm.getRawValue();

          if (resp && resp._id) {
            if (noNeedSwal) {
              this.router
                .navigateByUrl('/', { skipLocationChange: true })
                .then(() => this.router.navigate([`/form-builder/template-detail`], { queryParams: { templateId: resp._id } }));
            } else {
              this.bravoSwalOnSave(resp);
            }
          }
        },
        (err) => this.swalError(err),
      );
    } else {
      this.isWaitingForResponse = true;
      this.subs.sink = this.formBuilderService.createFormBuilderTemplate(payload).subscribe(
        (resp) => {
          this.isWaitingForResponse = false;
          this.initialForm = this.templateDetailForm.getRawValue();

          if (resp && resp._id) {
            if (noNeedSwal) {
              this.router
                .navigateByUrl('/', { skipLocationChange: true })
                .then(() => this.router.navigate([`/form-builder/template-detail`], { queryParams: { templateId: resp._id } }));
            } else {
              this.bravoSwalOnSave(resp);
            }
          }
        },
        (err) => {
          this.swalError(err);
          // Remove the added step from the form if get error when add step
          const temp = _.cloneDeep(this.templateDetailForm.getRawValue());
          if (temp && temp.steps && temp.steps.length) {
            temp.steps.forEach((step, stepIndex) => {
              this.getTemplateStep().removeAt(stepIndex);
            });
          }
        },
      );
    }
  }

  bravoSwalOnSave(resp) {
    Swal.fire({
      type: 'success',
      title: this.translate.instant('Bravo!'),
      confirmButtonText: this.translate.instant('OK'),
      allowEnterKey: false,
      allowEscapeKey: false,
      allowOutsideClick: false,
    }).then((res) => {
      this.router
        .navigateByUrl('/', { skipLocationChange: true })
        .then(() => this.router.navigate([`/form-builder/template-detail`], { queryParams: { templateId: resp._id } }));
    });
  }

  swalError(err, stepName?) {
    this.isWaitingForResponse = false;

    if (err['message'] === 'GraphQL error: pre contract template name already exist') {
      Swal.fire({
        type: 'error',
        title: this.translate.instant('UserForm_S3.TITLE'),
        text: this.translate.instant('UserForm_S3.TEXT'),
        confirmButtonText: this.translate.instant('UserForm_S3.BUTTON 1'),
      });
    } else if (err['message'] === 'GraphQL error: pre contract template step name already exist') {
      Swal.fire({
        type: 'error',
        title: this.translate.instant('Uniquename_S1.TITLE'),
        text: this.translate.instant('Uniquename_S1.TEXT'),
        confirmButtonText: this.translate.instant('Uniquename_S1.BUTTON'),
      });
    } else if (err['message'] === 'GraphQL error: form builder already published') {
      this.formBuilderService.childrenFormValidationStatus = true;
      Swal.fire({
        type: 'error',
        title: this.translate.instant('UserForm_S18.TITLE'),
        text: this.translate.instant('UserForm_S18.TEXT'),
        confirmButtonText: this.translate.instant('UserForm_S18.CONFIRM'),
      });
    } else if (err['message'].includes('GraphQL error: cant delete step, this step connected to ')) {
      this.formBuilderService.childrenFormValidationStatus = true;
      const errorMessage = err['message'].replace('GraphQL error: cant delete step, this step connected to ', '');

      Swal.fire({
        type: 'error',
        title: this.translate.instant('Delete_Step_S1.TITLE'),
        html: this.translate.instant('Delete_Step_S1.TEXT', { step_deleted: stepName, step_connected: errorMessage }),
        confirmButtonText: this.translate.instant('UserForm_S18.CONFIRM'),
      });
    } else {
      Swal.fire({
        type: 'error',
        title: 'Error',
        text: err && err['message'] ? err['message'] : err,
        confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
      });
    }
  }

  publishFormBuilderTemplate(event: MatSlideToggleChange) {

    if (event && event.checked) {
      Swal.fire({
        type: 'warning',
        title: this.translate.instant('Are you sure?'),
        text: this.translate.instant('This will publish the Form Template Detail'),
        confirmButtonText: this.translate.instant('Yes'),
        cancelButtonText: this.translate.instant('No'),
        showCancelButton: true,
      }).then((result) => {
        if (result.value) {
          this.templateDetailForm.get('is_published').patchValue(true, { emitEvent: false });
          this.publishTemplateCallAPI();
        } else {
          this.templateDetailForm.get('is_published').patchValue(false, { emitEvent: false });
        }
      });
    } else {
      Swal.fire({
        type: 'warning',
        title: this.translate.instant('Are you sure?'),
        text: this.translate.instant('This will unpublish Form Template Detail'),
        confirmButtonText: this.translate.instant('Yes'),
        cancelButtonText: this.translate.instant('No'),
        showCancelButton: true,
      }).then((result) => {
        if (result.value) {
          this.templateDetailForm.get('is_published').patchValue(false, { emitEvent: false });
          this.unpublishTemplateCallAPI();
          // this.saveTemplateDetail(false);
        } else {
          this.templateDetailForm.get('is_published').patchValue(true, { emitEvent: false });
        }
      });
    }
  }

  onPreview() {
    const url = this.router.createUrlTree(['/form-fill'], { queryParams: { templateId: this.templateId, isPreview: true } });
    window.open(url.toString(), '_blank');
  }

  publishTemplateCallAPI() {
    this.isWaitingForResponse = true;
    this.subs.sink = this.formBuilderService.publishContractTemplateFirstTab(this.templateId).subscribe(
      (resp) => {
        this.isWaitingForResponse = false;
        Swal.fire({
          type: 'success',
          title: this.translate.instant('Bravo!'),
          confirmButtonText: this.translate.instant('OK'),
          allowEnterKey: false,
          allowEscapeKey: false,
          allowOutsideClick: false,
        }).then((res) => {
          this.router
            .navigateByUrl('/', { skipLocationChange: true })
            .then(() => this.router.navigate([`/form-builder/template-detail`], { queryParams: { templateId: this.templateId } }));
        });
      },
      (err) => {
        this.isWaitingForResponse = false;
        this.templateDetailForm.get('is_published').patchValue(false, { emitEvent: false });
        const cleanGrapQLErrorTag = err['message'].replaceAll('GraphQL error: ', '');

        if (cleanGrapQLErrorTag === 'form builder must have final step') {
          Swal.fire({
            type: 'error',
            title: this.translate.instant('Publish_S4.TITLE'),
            text: err && err['message'] ? this.translate.instant('Publish_S4.TEXT') : err,
            confirmButtonText: this.translate.instant('Publish_S4.BUTTON1'),
          });
        } else {
          Swal.fire({
            type: 'error',
            title: this.translate.instant('UserForm_S15.TITLE'),
            text: this.translate.instant('UserForm_S15.TEXT'),
            confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
          });
        }
      },
    );
  }

  unpublishTemplateCallAPI() {
    this.isWaitingForResponse = true;
    this.subs.sink = this.formBuilderService.unpublishContractTemplateFirstTab(this.templateId).subscribe(
      (resp) => {
        this.isWaitingForResponse = false;
        Swal.fire({
          type: 'success',
          title: this.translate.instant('Bravo!'),
          confirmButtonText: this.translate.instant('OK'),
          allowEnterKey: false,
          allowEscapeKey: false,
          allowOutsideClick: false,
        }).then((res) => {
          this.router
            .navigateByUrl('/', { skipLocationChange: true })
            .then(() => this.router.navigate([`/form-builder/template-detail`], { queryParams: { templateId: this.templateId } }));
        });
      },
      (err) => {
        this.isWaitingForResponse = false;
        this.templateDetailForm.get('is_published').patchValue(true, { emitEvent: false });
        if (err['message'] === 'GraphQL error: form_builder already user by employability process') {
          Swal.fire({
            title: this.translate.instant('SURVEY_S5_Publish_Status.TITLE'),
            html: this.translate.instant('SURVEY_S5_Publish_Status.TEXT'),
            type: 'error',
            showConfirmButton: true,
            confirmButtonText: this.translate.instant('SURVEY_S5_Publish_Status.BUTTON'),
          });
        } else {
          Swal.fire({
            type: 'error',
            title: this.translate.instant('UserForm_S12.TITLE'),
            text: this.translate.instant('UserForm_S12.TEXT'),
            confirmButtonText: this.translate.instant('UserForm_S12.CONFIRM'),
          });
        }
      },
    );
  }

  displayFn(selectedValue: any) {
    if (selectedValue) {
      const found = this.templateTypeList.find((res) => res.value === selectedValue);
      if (found) {
        return found.name;
      }
    }
  }

  handleFinalValidator(event) {
    this.finalValidation.emit(this.templateDetailForm.get('is_final_validator_active').value);
    if (!event.checked && !this.templateDetailForm.get('is_final_validator_active').value) {
      this.templateDetailForm.get('is_contract_signatory_in_order').setValue(false);
      this.getTemplateValidator().clear();

      this.updateTableData();
    }
  }

  leave() {
    this.checkIfAnyChildrenFormInvalid();
  }

  checkIfAnyChildrenFormInvalid() {
    if (!this.formBuilderService.childrenFormValidationStatus) {
      this.fireUnsavedDataWarningSwal();
    } else {
      this.router.navigate(['form-builder']);
    }
  }

  fireUnsavedDataWarningSwal() {
    return Swal.fire({
      type: 'warning',
      title: this.translate.instant('TMTC_S01.TITLE'),
      text: this.translate.instant('TMTC_S01.TEXT'),
      confirmButtonText: this.translate.instant('TMTC_S01.BUTTON_1'),
      showCancelButton: true,
      cancelButtonText: this.translate.instant('TMTC_S01.BUTTON_2'),
      allowEscapeKey: false,
      allowOutsideClick: false,
    }).then((result) => {
      if (result.value) {
        // I will save first
        return;
      } else {
        // discard changes
        this.formBuilderService.childrenFormValidationStatus = true;
        this.router.navigate(['form-builder']);
      }
    });
  }

  scrollLeft() {
    const element = this.stepperForm?._elementRef?.nativeElement?.children[0]?.children[0];
    if (!element) return;
    element.scrollBy({
      top: 0,
      left: -150,
      behavior: 'smooth',
    });
  }

  scrollRight() {
    const element = this.stepperForm?._elementRef?.nativeElement?.children[0]?.children[0];
    if (!element) return;
    element.scrollBy({
      top: 0,
      left: 150,
      behavior: 'smooth',
    });
  }

  checkIfOverflown() {

    if (this.stepperForm?._elementRef?.nativeElement?.children[0]?.children[0]) {
      const element = this.stepperForm?._elementRef?.nativeElement?.children[0]?.children[0];
      this.isStepOverflowing = element.scrollWidth > element.clientWidth;
    }
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
