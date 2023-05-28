import { AfterViewChecked, ChangeDetectorRef, Component, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { SubSink } from 'subsink';
import Swal from 'sweetalert2';
import { Questionnaire } from '../questionaire.model';
import { QuetionaireService } from '../quetionaire.service';

@Component({
  selector: 'ms-questionaire-template-form',
  templateUrl: './questionaire-template-form.component.html',
  styleUrls: ['./questionaire-template-form.component.scss'],
})
export class QuestionaireTemplateFormComponent implements OnInit, OnChanges, AfterViewChecked, OnDestroy {
  // public dialogRefQuestionnaire: MatDialogRef<ListQuestionnaireComponent>;
  private subs = new SubSink();

  selectedQuestionare: any;
  is_published: boolean;
  editable = true;
  questionnaire = new Questionnaire();
  ListQuestionnaireConfig: MatDialogConfig = {
    disableClose: true,
    width: '30%',
    height: '50%',
  };
  readyToSave = false;

  ListEditQuestionnaireConfig: MatDialogConfig = {
    disableClose: true,
    data: this.editable,
    width: '30%',
    height: '50%',
  };
  isValid = false;
  templateId = '';

  isWaitingForResponse = false;

  constructor(
    public questionnaireservice: QuetionaireService,
    private cdr: ChangeDetectorRef,
    public translate: TranslateService,
    private dialog: MatDialog,
    private activatedRoute: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit() {
    this.subs.sink = this.activatedRoute.params.subscribe(params => {

      if (params.hasOwnProperty('templateId')) {
        this.templateId = params['templateId'];
        this.subs.sink = this.questionnaireservice.getOneQuestionnaireTemplateById(this.templateId).subscribe(questionnaire => {

          this.selectedQuestionare = questionnaire;
          this.is_published = this.selectedQuestionare.is_published;
          this.questionnaireservice.updateQuestionnaire(this.selectedQuestionare);
        });
      }
    });
    this.questionnaireservice.updateFormValidateIndicate(false);
    this.subs.sink = this.questionnaireservice.getFormValidateStatus().subscribe((status) => {
      this.readyToSave = status;
    });
  }

  ngAfterViewChecked() {
    this.cdr.detectChanges();
  }

  ngOnChanges(changes: SimpleChanges) {
    this.questionnaireservice.updateQuestionnaire(changes);
  }

  validateQuestionnaire() {


    this.questionnaireservice.updateFormValidateIndicate(true);
  }

  saveQuestionnaire() {
    const self = this;
    if (this.selectedQuestionare !== undefined) {
      // if is_published exist or when editing data
      this.selectedQuestionare.is_published = this.is_published;

      this.questionnaireservice.updateQuestionnaire(this.selectedQuestionare);
    }

    // Remove this validation as we do not need to check for continue student for now.
    // ************** if its ES and is published is checked, then we need to check if continues_study exist or not to enabled it
    // if (this.selectedQuestionare && this.selectedQuestionare.questionnaire_type === 'employability_survey' && this.is_published) {
    //   const result = this.questionnaireservice.checkIsContinueStudyExist(this.selectedQuestionare);
    //   if (!result) {
    //     Swal.fire({
    //       type: 'error',
    //       title: this.translate.instant('TEMPLATE_ES_WITHOUT_CONTINUE.TITLE'),
    //       text: this.translate.instant('TEMPLATE_ES_WITHOUT_CONTINUE.TEXT'),
    //       confirmButtonText: this.translate.instant('TEMPLATE_ES_WITHOUT_CONTINUE.BUTTON'),
    //       footer: `<span style="margin-left: auto">TEMPLATE_ES_WITHOUT_CONTINUE</span>`
    //       allowEnterKey: false,
    //       allowEscapeKey: false,
    //       allowOutsideClick: false
    //     });
    //     return;
    //   }
    // }


    if (this.templateId) {
      this.isWaitingForResponse = true;
      this.subs.sink = this.questionnaireservice.updateQuestionnaireTemplate(this.templateId).subscribe((value) => {
        this.isWaitingForResponse = false;

        if (value) {
          Swal.fire({
            type: 'success',
            text: 'Bravo'
          }).then((resp) => this.router.navigate(['questionnaire-tools']))
        }
      }, (err) => {
        this.swalError(err);
      });
    } else {
      this.isWaitingForResponse = true;
      this.subs.sink = this.questionnaireservice.updateQuestionData(this.is_published).subscribe((value) => {
        this.isWaitingForResponse = false;

        if (value) {
          Swal.fire({
            type: 'success',
            text: 'Bravo'
          }).then((resp) => this.router.navigate(['questionnaire-tools']))
        }
      }, (err) => {
        this.swalError(err);
      });
    }
  }

  toggleis_published(event) {
    this.is_published = event.checked;
    this.questionnaireservice.updatePublishedStatus(event.checked);
    // this.questionnaireservice.updateQuestionnaire(this.selectedQuestionare);
  }

  leaveForm() {
    this.router.navigate(['questionnaire-tools']);
  }

  swalError(err) {
    this.isWaitingForResponse = false;

    Swal.fire({
      type: 'error',
      title: 'Error',
      text: err && err['message'] ? err['message'] : err,
      confirmButtonText: 'OK',
    });
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
    this.questionnaireservice.resetQuestionnaire();
  }
}
