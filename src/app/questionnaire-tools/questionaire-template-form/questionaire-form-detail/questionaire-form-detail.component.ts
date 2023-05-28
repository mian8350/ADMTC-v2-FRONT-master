import {
  AfterViewChecked,
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatSelectChange } from '@angular/material/select';
import { Questionnaire, QuestionnaireConsts, Questions } from 'app/questionnaire-tools/questionaire.model';
import Swal from 'sweetalert2';
import * as _ from 'lodash';
import { AuthService } from 'app/service/auth-service/auth.service';
import { QuetionaireService } from 'app/questionnaire-tools/quetionaire.service';
import { CkeditorInputDialogComponent } from 'app/shared/components/ckeditor-input-dialog/ckeditor-input-dialog.component';
import { SubSink } from 'subsink';
import { UtilityService } from 'app/service/utility/utility.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'ms-questionaire-form-detail',
  templateUrl: './questionaire-form-detail.component.html',
  styleUrls: ['./questionaire-form-detail.component.scss'],
})
export class QuestionaireFormDetailComponent implements OnInit, AfterViewChecked, OnDestroy {
  // Copy from V1
  @ViewChild('questionnaire_name', { static: false }) questionnaire_name: ElementRef;
  @Input() isValid: boolean = false;
  @ViewChildren('blockPanel') blockPanel: QueryList<ElementRef>;
  form: UntypedFormArray;

  selectedQuestionare: any;
  public segmentNumber = 0;
  public competenceNumber = 0;
  public questionNumber = 0;
  blockOfCompetencePlaceholder = [];
  questionnaireForm: UntypedFormGroup;
  competenceList = [];
  // textDialog: MdDialogRef<TextDialogComponent>;
  // config: MdDialogConfig = {
  //   disableClose: true
  // };
  footerFields = [];
  headerFields = [];
  // public dialogRefCompetence: MatDialogRef<AddCompetenceComponent>;
  // AddCompetenceDialogConfig: MdDialogConfig = {
  //   disableClose: true,
  //   width: '40%',
  //   height: '40%'
  // };
  questionnaire = new Questionnaire();
  questionnaire_type = 'employability_survey';

  formSubmit = false;
  user = null;
  questionIndex = 1;
  optionSelectionType = [
    {
      selectionType: 'always_visible',
      name: 'Always Visible',
    },
    {
      selectionType: 'visible_on_option',
      name: 'Visible Option',
    },
    {
      selectionType: 'router',
      name: 'Router',
    },
  ];

  optionBlockValue: { id: string; blockName: string; blockIndex: number }[] = [];

  questionnaireConsts = QuestionnaireConsts;
  is_published = false;
  hideContinueStudy = false;
  selectedIndex: any;
  selectedSegment: any;

  // Uncopied from V1
  private subs = new SubSink();

  constructor(
    private fb: UntypedFormBuilder,
    private cdr: ChangeDetectorRef,
    private loginService: AuthService,
    private questionnaireservice: QuetionaireService,
    private dialog: MatDialog,
    public utilService: UtilityService,
    private translate: TranslateService,
  ) {}

  // *************** Start of Functions from V1

  ngOnInit() {
    this.user = this.loginService.getLocalStorageUser();

    this.form = this.fb.array([]);
    this.questionnaireservice.updateFormValidateStatus(false);
    this.questionnaireservice.updateFormValidateIndicate(false);
    // this.questionnaire_name.nativeElement.value = '';
    this.questionnaire.created_by = this.user._id;
    this.questionnaireservice.updateQuestionnaire('');
    this.subs.sink = this.questionnaireservice.getQuestionnaire().subscribe((questionnaire) => {


      if (this.form.controls.length < 1) {
        if (questionnaire) {
          this.questionnaire = questionnaire;
          this.getCompetence(this.questionnaire);
          this.headerFields = this.questionnaire.questionnaire_grid.header.fields;
          this.footerFields = this.questionnaire.questionnaire_grid.footer.fields;
          this.is_published = this.questionnaire.is_published;
          this.questionnaire_type = this.questionnaire.questionnaire_type;
          this.questionnaire.created_by = this.user._id;
          if (this.questionnaire_name && this.questionnaire_name.nativeElement) {
            this.questionnaire_name.nativeElement.value = this.questionnaire.questionnaire_name;
          }

          this.updateFormValidateStatus();
          this.renderBlockOptionValue();
        } else {
          this.form = this.fb.array([]);
          this.segmentNumber = 0;
          this.competenceNumber = 0;
          this.questionNumber = 0;
          if (this.questionnaire_name && this.questionnaire_name.nativeElement) {
            this.questionnaire_name.nativeElement.value = '';
          }
        }
      }
    });
    this.subs.sink = this.questionnaireservice.getFormValidateIndicate().subscribe((status) => {
      this.formSubmit = status;
    });
    this.questionnaireservice.updateQuestionnaire(this.questionnaire);
  }

  ngAfterViewChecked() {
    this.cdr.detectChanges();
  }

  getCompetence(result) {
    this.form = this.fb.array([]);
    this.competenceNumber = 0;
    result['competence'] = _.orderBy(result['competence'], ['sort_order'], ['asc']);
    for (let i = 0; i < result['competence'].length; i++) {
      this.competenceList.push(result['competence'][i]);
      this.GenerateCompetenceForm(result['competence'][i]);
    }
  }

  openTextDialog(forSection: string) {
    switch (forSection) {
      case 'top-header':
        const headerText = this.questionnaire.questionnaire_grid.header.text;
        this.subs.sink = this.dialog
          .open(CkeditorInputDialogComponent, {
            disableClose: true,
            width: '1000px',
            data: headerText,
          })
          .afterClosed()
          .subscribe((val) => {
            if (val !== false) {
              this.questionnaire.questionnaire_grid.header.text = val || '';
              this.questionnaireservice.updateQuestionnaire(this.questionnaire);
            }
          });
        break;
      case 'footer-text':
        const footerText = this.questionnaire.questionnaire_grid.footer.text;
        this.subs.sink = this.dialog
          .open(CkeditorInputDialogComponent, {
            disableClose: true,
            width: '1000px',
            data: footerText,
          })
          .afterClosed()
          .subscribe((val) => {
            if (val !== false) {
              this.questionnaire.questionnaire_grid.footer.text = val || '';
              this.questionnaireservice.updateQuestionnaire(this.questionnaire);
            }
          });
        break;
      case 'direction-text':
        const directionText = this.questionnaire.questionnaire_grid.header.direction;
        this.subs.sink = this.dialog
          .open(CkeditorInputDialogComponent, {
            disableClose: true,
            width: '1000px',
            data: directionText,
          })
          .afterClosed()
          .subscribe((val) => {
            if (val !== false) {
              this.questionnaire.questionnaire_grid.header.direction = val || '';
              this.questionnaireservice.updateQuestionnaire(this.questionnaire);
            }
          });
        break;
      case 'questionnaire-title-text':
        const titleText = this.questionnaire.questionnaire_grid.header.title;
        this.subs.sink = this.dialog
          .open(CkeditorInputDialogComponent, {
            disableClose: true,
            width: '1000px',
            data: titleText,
          })
          .afterClosed()
          .subscribe((val) => {
            if (val !== false) {
              this.questionnaire.questionnaire_grid.header.title = val || '';
              this.questionnaireservice.updateQuestionnaire(this.questionnaire);
            }
          });
        break;
      default:
    }
  }

  footerTextPositionChanged(event: MatCheckboxChange) {
    this.questionnaire.questionnaire_grid.footer.text_below = event.checked;
    this.questionnaireservice.updateQuestionnaire(this.questionnaire);
  }

  addFooterField(field) {
    const ff = this.footerFields;
    const align =
      ff.length === 0 || ff[ff.length - 1].data_type === 'longtext' ? 'left' : ff[ff.length - 1].align === 'left' ? 'right' : 'left';
    ff.push({
      editing: true,
      value: field.view,
      type: field.value,
      data_type: field.type,
      align: align,
    });
    this.questionnaireservice.updateQuestionnaire(this.questionnaire);
  }

  removeFooterField(index) {
    this.footerFields.splice(index, 1);
    this.questionnaire.questionnaire_grid.footer.fields.splice(index, 1);
    this.questionnaireservice.updateQuestionnaire(this.questionnaire);
  }

  saveFooterField(index) {
    const field = this.footerFields[index];
    if (field.value !== '') {
      field.editing = false;
      this.questionnaire.questionnaire_grid.footer.fields[index] = {
        value: field.value,
        data_type: field.data_type,
        type: field.type,
        align: field.align,
      };
      this.questionnaireservice.updateQuestionnaire(this.questionnaire);
    } else {
      Swal.fire('Error!', 'Cannot create empty field', 'warning');
    }
  }

  editFooterField(index) {
    this.footerFields[index].editing = true;
  }

  addHeaderField(field, index, required) {
    const hf = this.headerFields;
    const align =
      hf.length === 0 || hf[hf.length - 1].data_type === 'longtext' ? 'left' : hf[hf.length - 1].align === 'left' ? 'right' : 'left';
    hf.push({
      required: required,
      editing: true,
      value: field.view,
      type: field.value,
      data_type: field.type,
      align: align,
    });
    if (index !== -1) {
      this.questionnaireConsts.requiredFieldsTypes[index].removed = true;
    }
    this.questionnaireservice.updateQuestionnaire(this.questionnaire);
  }

  removeHeaderField(index) {
    let field = this.headerFields[index];
    if (field.required === true) {
      const a = this.questionnaireConsts.requiredFieldsTypes.find((f) => {
        return f.value === field.type;
      });
      if (a) {
        a.removed = false;
      }
    }
    this.headerFields.splice(index, 1);
    this.questionnaire.questionnaire_grid.header.fields.splice(index, 1);
    this.questionnaireservice.updateQuestionnaire(this.questionnaire);
  }

  saveHeaderField(index) {
    const field = this.headerFields[index];
    if (field.value !== '') {
      field.editing = false;
      this.questionnaire.questionnaire_grid.header.fields[index] = {
        value: field.value,
        data_type: field.data_type,
        type: field.type,
        align: field.align,
      };
      this.questionnaireservice.updateQuestionnaire(this.questionnaire);
    } else {
      Swal.fire('Error!', 'Cannot create empty field', 'warning');
    }
  }

  editHeaderField(index) {
    this.headerFields[index].editing = true;
  }

  setquestionnaire_name(value) {
    this.questionnaire.questionnaire_name = value;
    this.questionnaire.is_published = false; // placeholder for the is_published data
    this.questionnaireservice.updateQuestionnaire(this.questionnaire);
    this.updateFormValidateStatus();
  }

  setCommentsHeader(value) {
    // Code to do processing will come here
  }
  GenerateCompetenceForm(data) {
    this.segmentNumber = 0;
    // const control = _.clone(this.form);
    const control = this.form;
    const addrCtrl = this.fb.group({
      competence_name: [data ? data.competence_name : '', Validators.required],
      page_break: data ? data.page_break : false,
      block_type: [data ? data.block_type : '', Validators.required],
      segment: this.fb.array([]),
      sort_order: [Number(this.form.value.length) + 1],
    });
    control.insert(control.length, addrCtrl);
    if (data.segment && data.segment.length) {
      data.segment = _.orderBy(data.segment, ['sort_order'], ['asc']);
      data.segment.forEach((element) => {
        this.GenerateSegmentForm(this.competenceNumber, element);
        this.segmentNumber = this.segmentNumber + 1;
      });
    }
    this.competenceNumber = this.competenceNumber + 1;
    this.updateFormValidateStatus();
  }

  addNewSegment(competenceIndex) {
    const segments = this.form.value[competenceIndex].segment;
    this.GenerateSegmentForm(competenceIndex, {
      segment_name: '',
      id: '',
      question: [],
    });
  }

  AddQuestion(competenceIndex, segmentIndex) {
    this.GenerateQuestionForm(competenceIndex, segmentIndex, {
      question_type: 'none',
      question_name: '',
      id: '',
    });
  }

  GenerateSegmentForm(competenceIndex, data) {
    this.questionNumber = 0;
    const control = this.form;
    const segmentControl = this.form.controls[competenceIndex]['controls']['segment'];
    const addrCtrl = this.fb.group({
      segment_name: [data ? data.segment_name : '', Validators.required],
      question: this.fb.array([]),
      sort_order: [Number(this.form.value[competenceIndex].segment.length) + 1],
    });
    segmentControl.push(addrCtrl);
    if (data.question.length) {
      data.question = _.orderBy(data.question, ['sort_order'], ['asc']);
      data.question.forEach((element) => {
        this.GenerateQuestionForm(competenceIndex, this.segmentNumber, element, this.questionNumber);
        this.questionNumber = this.questionNumber + 1;
      });
    }
    this.updateFormValidateStatus();
  }

  GenerateQuestionForm(competenceIndex, segmentIndex, data, questionNumber?) {
    const control = this.form;

    if (data) {
      if (data.question_type === 'continues_student') {
        this.hideContinueStudy = true;
        this.selectedSegment = segmentIndex;
        this.selectedIndex = questionNumber;
      }
    }
    const questionControl = this.form.controls[competenceIndex]['controls']['segment'].controls[segmentIndex]['controls']['question'];
    const addrCtrl = this.fb.group({
      question_type: [data && data.question_type ? data.question_type : 'none', data && data.is_field ? [] : Validators.required],
      question_name: [data && data.question_name ? data.question_name : '', data && data.is_field ? [] : Validators.required],
      is_field: [data && data.is_field ? data.is_field : false, Validators.required],
      is_answer_required: [data && data.is_answer_required ? data.is_answer_required : false],
      options: [data && typeof data.options === 'object' ? data.options : []],
      answer: [''],
      answer_multiple: [data && data.answer_multiple ? data.answer_multiple : []],
      questionnaire_field_key: [data && data.questionnaire_field_key ? data.questionnaire_field_key : ''],
      sort_order: [Number(this.form.value[competenceIndex].segment[segmentIndex].question.length) + 1],
      parent_child_options: [data && data.parent_child_options ? data.parent_child_options : []],
    });
    questionControl.push(addrCtrl);
    this.form.value[competenceIndex].segment[segmentIndex].question.push(data);
    this.updateFormValidateStatus();
  }

  checkIsMutiOption(question) {
    if (
      question &&
      (question.question_type === 'multiple_option' || question.question_type === 'single_option') &&
      question.is_field === false
    ) {
      return true;
    }
    return false;
  }

  checkingForSingleOption(question) {
    if (question.question_type === 'single_option' && question.is_field === false) {
      return true;
    }
    return false;
  }

  checkIsContinousRouter(question, segment, competence) {
    if (question.question_type === 'continues_student' && competence && competence.block_type === 'router') {
      return true;
    } else {
      return false;
    }
  }

  addMoreOptions(competenceIndex, segmentIndex, questionIndex) {
    const optionValue = this.form.value[competenceIndex]['segment'][segmentIndex]['question'][questionIndex].answer;
    if (optionValue) {
      const optionPosition = this.form.value[competenceIndex]['segment'][segmentIndex]['question'][questionIndex].options.length;
      this.form.value[competenceIndex]['segment'][segmentIndex]['question'][questionIndex].options.push({
        option_text: optionValue,
        position: optionPosition,
      });
      this.form.value[competenceIndex]['segment'][segmentIndex]['question'][questionIndex].answer = '';
      this.form.controls[competenceIndex]['controls']['segment'].controls[segmentIndex]['controls']['question'].controls[questionIndex][
        'controls'
      ]['answer'].setValue('');
      this.updateDocumentObject();
    }
  }

  addOptionContinousRouter(competenceIndex, segmentIndex, questionIndex) {
    const answers = ['Yes', 'No'];
    const arrOption = [];
    this.form.value[competenceIndex]['segment'][segmentIndex]['question'][questionIndex].options = [];
    answers.forEach((answer, inAns) => {
      const optionPosition = inAns;
      const objOption = {
        option_text: answer,
        position: optionPosition,
      };
      arrOption.push(objOption);
    });
    this.form.value[competenceIndex]['segment'][segmentIndex]['question'][questionIndex].options = arrOption;
    this.updateDocumentObject();
    this.form.value[competenceIndex]['segment'][segmentIndex]['question'][questionIndex].options = arrOption;
    this.form.value[competenceIndex]['segment'][segmentIndex]['question'][questionIndex].answer = '';
    this.form.controls[competenceIndex]['controls']['segment'].controls[segmentIndex]['controls']['question'].controls[questionIndex][
      'controls'
    ]['answer'].setValue('');



    this.form.value[competenceIndex]['segment'][segmentIndex]['question'][questionIndex].options = arrOption;
  }

  removeCompetence(competenceIndex) {
    const self = this;
    Swal.fire({
      title: self.translate.instant('MENTOREVALUATION.QUESTIONNAIRE.Messages.deletedCompetenceWarningTitle'),
      // html: self.translate.instant('MENTOREVALUATION.QUESTIONNAIRE.Messages.deletedCompetenceWarningMessage'),
      type: 'warning',
      showCancelButton: true,
      allowEscapeKey: true,
      footer: `<span style="margin-left: auto">deletedCompetenceWarningTitle</span>`,
      confirmButtonText: self.translate.instant('YES'),
      cancelButtonText: self.translate.instant('NO'),
    }).then(
      function () {
        self.form.controls.splice(competenceIndex, 1);
        self.form.value.splice(competenceIndex, 1);
        self.updateDocumentObject();
        self.renderBlockOptionValue();
        Swal.fire({
          // title: 'Deleted!',
          title: self.translate.instant('MENTOREVALUATION.QUESTIONNAIRE.Messages.deletedCompetenceSuccess'),
          footer: `<span style="margin-left: auto">deletedCompetenceSuccess</span>`,
          allowEscapeKey: true,
          type: 'success',
        });
      },
      function (dismiss) {
        if (dismiss === 'cancel') {
        }
      },
    );
  }

  removeSegment(competenceIndex, segmentIndex) {
    const self = this;
    Swal.fire({
      title: self.translate.instant('MENTOREVALUATION.QUESTIONNAIRE.Messages.deletedSegmentWarningTitle'),
      // html: self.translate.instant('MENTOREVALUATION.QUESTIONNAIRE.Messages.deletedSegmentWarningMessage'),
      type: 'warning',
      showCancelButton: true,
      allowEscapeKey: true,
      footer: `<span style="margin-left: auto">deletedSegmentWarningTitle</span>`,
      confirmButtonText: self.translate.instant('YES'),
      cancelButtonText: self.translate.instant('NO'),
    }).then(
      function () {
        // delete the selected segment
        self.form.controls[competenceIndex]['controls']['segment']['controls'].splice(segmentIndex, 1);
        self.form.value[competenceIndex]['segment'].splice(segmentIndex, 1);

        // check if there is any segment that has no name, then dont make the button valid
        self.questionnaireservice.updateFormValidateStatus(true);
        self.form.value[competenceIndex]['segment'].forEach((segment) => {
          if (segment.segment_name === '') {
            self.questionnaireservice.updateFormValidateStatus(false);
          }
        });

        self.questionnaire.competence = self.form.value;
        self.questionnaireservice.updateQuestionnaire(self.questionnaire);

        Swal.fire({
          title: self.translate.instant('MENTOREVALUATION.QUESTIONNAIRE.Messages.deletedSegmentSuccess'),
          footer: `<span style="margin-left: auto">deletedSegmentSuccess</span>`,
          // text: self.translate.instant('MENTOREVALUATION.QUESTIONNAIRE.Messages.deletedSegmentSuccess'),
          allowEscapeKey: true,
          type: 'success',
        });
      },
      function (dismiss) {
        if (dismiss === 'cancel') {
        }
      },
    );
  }

  removeQuestion(competenceIndex, segmentIndex, questionIndex) {
    const self = this;
    Swal.fire({
      title: self.translate.instant('MENTOREVALUATION.QUESTIONNAIRE.Messages.deletedQuestionWarningTitle'),
      type: 'warning',
      showCancelButton: true,
      allowEscapeKey: true,
      footer: `<span style="margin-left: auto">deletedQuestionWarningTitle</span>`,
      confirmButtonText: self.translate.instant('YES'),
      cancelButtonText: self.translate.instant('NO'),
    }).then(
      function () {
        // delete the selected question
        self.form.controls[competenceIndex]['controls']['segment']['controls'][segmentIndex]['controls']['question']['controls'].splice(
          questionIndex,
          1,
        );

        self.form.value[competenceIndex]['segment'][segmentIndex]['question'].splice(questionIndex, 1);

        // check if there is any question that has no name, then dont make the button valid
        self.questionnaireservice.updateFormValidateStatus(true);
        self.form.value[competenceIndex]['segment'][segmentIndex]['question'].forEach((question) => {
          if (question.question_name === '') {
            self.questionnaireservice.updateFormValidateStatus(false);
          }
        });

        self.questionnaire.competence = self.form.value;
        self.questionnaireservice.updateQuestionnaire(self.questionnaire);

        Swal.fire({
          title: self.translate.instant('MENTOREVALUATION.QUESTIONNAIRE.Messages.deletedQuestionSuccess'),
          text: '',
          confirmButtonText: self.translate.instant('MENTOREVALUATION.QUESTIONNAIRE.Messages.deletedQuestionSuccessOk'),
          footer: `<span style="margin-left: auto">deletedQuestionSuccess</span>`,
          allowEscapeKey: true,
          type: 'success',
        }).then(() => {
          if (self.hideContinueStudy) {
            if (self.selectedSegment === segmentIndex) {
              if (self.selectedIndex === questionIndex) {
                self.hideContinueStudy = false;
                self.selectedIndex = null;
                self.selectedSegment = null;
              }
            }
          }
        });
      },
      function (dismiss) {
        if (dismiss === 'cancel') {
        }
      },
    );
  }

  removeOption(competenceIndex, segmentIndex, questionIndex, optionIndex) {
    const self = this;
    Swal.fire({
      title: self.translate.instant('MENTOREVALUATION.QUESTIONNAIRE.Messages.deletedOptionWarningTitle'),
      // html: self.translate.instant('MENTOREVALUATION.QUESTIONNAIRE.Messages.deletedOptionWarningMessage'),
      type: 'warning',
      showCancelButton: true,
      allowEscapeKey: true,
      footer: `<span style="margin-left: auto">deletedOptionWarningTitle</span>`,
      confirmButtonText: self.translate.instant('YES'),
      cancelButtonText: self.translate.instant('NO'),
    }).then(
      function () {
        self.form.value[competenceIndex]['segment'][segmentIndex]['question'][questionIndex].options.splice(optionIndex, 1);
        self.updateDocumentObject();
        Swal.fire({
          title: 'Deleted!',
          text: self.translate.instant('MENTOREVALUATION.QUESTIONNAIRE.Messages.deletedOptionSuccess'),
          footer: `<span style="margin-left: auto">deletedOptionSuccess</span>`,
          allowEscapeKey: true,
          type: 'success',
        });
      },
      function (dismiss) {
        if (dismiss === 'cancel') {
        }
      },
    );
  }

  addNewCompetenceDialog() {
    const valueTests = this.form.value;
    this.GenerateCompetenceForm('');
    this.competenceList.push('');
    this.renderBlockOptionValue();

    setTimeout(() => {
      if (this.blockPanel && this.blockPanel.last && this.blockPanel.length) {


        this.blockPanel.toArray()[this.blockPanel.length - 1].nativeElement.scrollIntoView({ behavior: 'smooth' });
      }
    }, 1000);
  }

  changeis_answer_required(checkboxValue, competenceIndex, segmentIndex, questionIndex) {
    this.questionnaire.competence = this.form.value;
    this.questionnaire['competence'][competenceIndex]['segment'][segmentIndex]['question'][questionIndex].is_answer_required =
      checkboxValue.checked;
    this.questionnaireservice.updateQuestionnaire(this.questionnaire);
  }

  changeis_field(is_field, competenceIndex, segmentIndex, questionIndex, question) {

    if (is_field.checked) {
      /*this.form.value[competenceIndex]['segment'][segmentIndex]['question'][
        questionIndex
        ].options = [];*/
      this.form.value[competenceIndex]['segment'][segmentIndex]['question'][questionIndex]['question_type'] = 'none';
      this.form.value[competenceIndex]['segment'][segmentIndex]['question'][questionIndex]['question_name'] = '';
      this.form.value[competenceIndex]['segment'][segmentIndex]['question'][questionIndex]['options'] = [];
      this.cdr.detectChanges();
      this.updateDocumentObject();

      this.questionnaire.competence = this.form.value;

      this.questionnaire['competence'][competenceIndex]['segment'][segmentIndex]['question'][questionIndex].parent_child_options = [];
      this.questionnaire['competence'][competenceIndex]['segment'][segmentIndex]['question'][questionIndex].options = [];
      this.questionnaireservice.updateQuestionnaire(this.questionnaire);
      this.updateFormValidateStatus();
    }
    this.questionnaire['competence'][competenceIndex]['segment'][segmentIndex]['question'][questionIndex].is_field = is_field.checked;
    const stringPath = `${competenceIndex}.segment.${segmentIndex}.question.${questionIndex}`;

    const valueOfQuestion = this.form.get(stringPath).value;
    if (valueOfQuestion.is_field) {
      this.form.get(stringPath + '.questionnaire_field_key').setValidators([Validators.required]);
      this.form.get(stringPath + '.question_name').clearValidators();
      this.form.get(stringPath + '.question_type').clearValidators();
      if (this.form.get(stringPath + '.question_name').invalid) {
        this.form.get(stringPath + '.question_name').setValue('');
        this.form.get(stringPath + '.question_type').setValue('none');
      }
    } else {
      this.form.get(stringPath + '.questionnaire_field_key').clearValidators();
      this.form.get(stringPath + '.question_name').setValidators([Validators.required]);
      this.form.get(stringPath + '.question_type').setValidators([Validators.required]);
    }

    this.questionnaireservice.updateQuestionnaire(this.questionnaire);
    this.updateFormValidateStatus();
  }

  updateDocumentObject() {
    this.questionnaire.competence = this.form.value;
    this.updateFormValidateStatus();
    this.questionnaireservice.updateQuestionnaire(this.questionnaire);
  }

  updateFormValidateStatus() {
    let status = this.form.valid;
    if (!this.questionnaire.questionnaire_name || !this.questionnaire.questionnaire_type) {
      status = false;
    }
    this.questionnaireservice.updateFormValidateStatus(status);
  }

  changequestionnaire_type(queType: MatSelectChange) {

    this.questionnaire.questionnaire_type = queType.value;
    this.questionnaireservice.updateQuestionnaire(this.questionnaire);
    this.updateFormValidateStatus();
  }

  selectType(queType) {

    this.questionnaire.questionnaire_type = queType;
    this.questionnaireservice.updateQuestionnaire(this.questionnaire);
    this.updateFormValidateStatus();
  }

  onQuestionnaireFieldsChange(field, competenceIndex, segmentIndex, questionIndex) {

    this.questionnaire.competence = this.form.value;
    this.questionnaire['competence'][competenceIndex]['segment'][segmentIndex]['question'][questionIndex].questionnaire_field_key =
      field.value;
    this.form.value[competenceIndex]['segment'][segmentIndex]['question'][questionIndex]['options'] = [];
    this.form.value[competenceIndex]['segment'][segmentIndex]['question'][questionIndex]['question_type'] = 'none';
    this.questionnaire['competence'][competenceIndex]['segment'][segmentIndex]['question'][questionIndex].parent_child_options = [];
    this.questionnaire['competence'][competenceIndex]['segment'][segmentIndex]['question'][questionIndex].options = [];
    this.questionnaire['competence'][competenceIndex]['segment'][segmentIndex]['question'][questionIndex].question_type = 'none';
    this.questionnaireservice.updateQuestionnaire(this.questionnaire);
    this.updateFormValidateStatus();
  }

  toggleis_published(event) {
    this.questionnaire.is_published = this.is_published;
    this.questionnaireservice.updateQuestionnaire(this.questionnaire);
    this.updateFormValidateStatus();
  }

  // Sumit Logic
  selectAnswerType(answerType, competenceIndex, segmentIndex, questionIndex, competence?) {

    if (answerType.name === 'CONTINUE_STUDY') {
      this.hideContinueStudy = true;
      this.selectedIndex = questionIndex;
      this.selectedSegment = segmentIndex;

      if (competence && competence.block_type === 'router') {


        this.addOptionContinousRouter(competenceIndex, segmentIndex, questionIndex);
      }
    }
    if (this.hideContinueStudy) {
      if (this.selectedSegment === segmentIndex) {
        if (this.selectedIndex === questionIndex && answerType.name !== 'CONTINUE_STUDY') {
          this.hideContinueStudy = false;
          this.selectedIndex = null;
          this.selectedSegment = null;
        }
      }
    }
    if (answerType.key !== 'parent_child') {
      this.questionnaire['competence'][competenceIndex]['segment'][segmentIndex]['question'][questionIndex].parent_child_options = [];
      this.questionnaireservice.updateQuestionnaire(this.questionnaire);
      this.updateFormValidateStatus();
    }

    if (answerType.key !== 'multiple_option' && answerType.key !== 'single_option' && answerType.name !== 'CONTINUE_STUDY') {
      this.form.value[competenceIndex]['segment'][segmentIndex]['question'][questionIndex]['options'] = [];
      this.questionnaireservice.updateQuestionnaire(this.questionnaire);
      this.updateFormValidateStatus();
    }
  }

  checkIsParentChild(question) {
    if (question && question.question_type === 'parent_child') {
      return true;
    }
    return false;
  }

  addMoreAnswers(competenceIndex, segmentIndex, questionIndex) {
    const optionValue = this.form.value[competenceIndex]['segment'][segmentIndex]['question'][questionIndex].answer;
    if (optionValue) {
      const optionPosition =
        this.form.value[competenceIndex]['segment'][segmentIndex]['question'][questionIndex].parent_child_options.length;
      this.form.value[competenceIndex]['segment'][segmentIndex]['question'][questionIndex].parent_child_options.push({
        option_text: optionValue,
        position: optionPosition,
        questions: [],
      });
      this.form.value[competenceIndex]['segment'][segmentIndex]['question'][questionIndex].answer = '';
      this.form.controls[competenceIndex]['controls']['segment'].controls[segmentIndex]['controls']['question'].controls[questionIndex][
        'controls'
      ]['answer'].setValue('');

      this.updateDocumentObject();
    }
  }

  isHeaderValid() {
    return false;
  }

  isFooterValid() {
    return false;
  }

  addpage_break(index: number) {
    this.questionnaire.competence[index].page_break = true;
    this.questionnaireservice.updateQuestionnaire(this.questionnaire);
  }

  removepage_break(index: number) {
    this.questionnaire.competence[index].page_break = false;
    this.questionnaireservice.updateQuestionnaire(this.questionnaire);
  }

  changeSelectionOption(value, indexComp: number) {
    if (this.form.value[indexComp]['competence_name'] !== '') {
      this.questionnaireservice.updateFormValidateStatus(true);
    }
    this.form.value[indexComp]['block_type'] = value['value'];
    this.questionnaire.competence[indexComp] = this.form.value[indexComp];
    this.questionnaireservice.updateQuestionnaire(this.questionnaire);
    this.renderBlockOptionValue();
  }

  changeSelectionBlock(value, index: { block: number; segment: number; question: number; answer: number }) {
    this.form.value[index.block]['segment'][index.segment]['question'][index.question]['options'][index.answer]['related_block_index'] =
      value['value'];
  }

  renderBlockOptionValue() {
    this.optionBlockValue = [];
    const comp = this.form.value;
    for (let i = 0; i < comp.length; i++) {
      if (comp[i]['block_type'] === 'visible_on_option') {
        this.optionBlockValue.push({ id: comp[i]._id, blockName: comp[i].competence_name, blockIndex: i });
      }
    }
  }

  returnBindingForm(competenceIndex: number, segmentIndex: number, questionIndex: number, optionIndex: number) {
    const indexing =
      this.questionnaire.competence[competenceIndex].segment[segmentIndex].question[questionIndex].options[optionIndex][
        'related_block_index'
      ];
    if (indexing !== undefined) {
      return indexing;
    }
    return -1;
  }

  showRequiredCheckBox(question: Questions) {
    if (question.is_field) {
      if (question.questionnaire_field_key === 'STUDENT_CIVILITY') {
        return false;
      } else if (question.questionnaire_field_key === 'STUDENT_FIRST_NAME') {
        return false;
      } else if (question.questionnaire_field_key === 'STUDENT_LAST_NAME') {
        return false;
      }
    }
    if (question.question_type === 'mission_activity' || question.question_type === 'continues_student') {
      return false;
    }
    return true;
  }
  // *************** End of Functions from V1

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
