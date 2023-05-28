import { Component, OnInit, OnChanges, OnDestroy, NgZone, ViewChild, Input, SimpleChanges } from '@angular/core';
import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { take } from 'rxjs/operators';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { RNCPTitlesService } from '../../../service/rncpTitles/rncp-titles.service';
import { UntypedFormControl } from '@angular/forms';
import { SubSink } from 'subsink';

import * as DecoupledEditor from 'assets/ckeditor5-custom/ckeditor.js'
import { ChangeEvent } from '@ckeditor/ckeditor5-angular/ckeditor.component';
import Swal from 'sweetalert2';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { DateAdapter } from '@angular/material/core';

@Component({
  selector: 'ms-final-transcript-parameter',
  templateUrl: './final-transcript-parameter.component.html',
  styleUrls: ['./final-transcript-parameter.component.scss'],
})
export class FinalTranscriptParameterComponent implements OnInit, OnChanges, OnDestroy {
  @Input() selectedRncpTitleId: string;
  @Input() selectedClassId: string;
  private subs = new SubSink();
  @ViewChild('autosize', { static: false }) autosize: CdkTextareaAutosize;
  textValue: String = '';
  N2: Date;
  N3: Date;
  text: String = '';
  N7Jury: Date;
  N7Retake: Date;

  isNew: Boolean = true;
  parameterID = '';
  finalN2Deadline = new UntypedFormControl('');
  finalN3Deadline = new UntypedFormControl('');
  specialText = new UntypedFormControl('');
  finalN7JuryDecision = new UntypedFormControl('');
  finalN7ExtraRetake = new UntypedFormControl('');

  isWaitingForResponse = false;

  public Editor = DecoupledEditor;
  public onReady(editor) {
    editor.ui.getEditableElement().parentElement.insertBefore(editor.ui.view.toolbar.element, editor.ui.getEditableElement());
  }

  constructor(
    private _ngZone: NgZone,
    private rncpTitlesService: RNCPTitlesService,
    public translate: TranslateService,
    private dateAdapter: DateAdapter<Date>,
    ) {}

  ngOnInit() {
    this.dateAdapter.setLocale(this.translate.currentLang);
    this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      this.dateAdapter.setLocale(this.translate.currentLang);
    });
    this.getData();
  }

  getData() {
    this.isWaitingForResponse = true;
    this.subs.sink = this.rncpTitlesService
    .getOneFinalTranscriptParameter(this.selectedRncpTitleId, this.selectedClassId)
    .subscribe((data) => {
        this.isWaitingForResponse = false;
        if (data.data.GetOneFinalTranscriptParameter) {
          this.isNew = false;
          const realData = data.data.GetOneFinalTranscriptParameter;
          this.parameterID = realData._id;

          this.N2 = realData.final_n2_deadline;
          this.N2 = this.toDate(this.N2);

          this.N3 = realData.final_n3_deadline;
          this.N3 = this.toDate(this.N3);

          this.textValue = realData.final_n3_special_text;

          this.N7Jury = realData.final_n7_jury_decision;
          this.N7Jury = this.toDate(this.N7Jury);

          this.N7Retake = realData.final_n7_extra_retake;
          this.N7Retake = this.toDate(this.N7Retake);

          this.finalN2Deadline = new UntypedFormControl(this.N2);
          this.finalN3Deadline = new UntypedFormControl(this.N3);
          this.finalN7JuryDecision = new UntypedFormControl(this.N7Jury);
          this.finalN7ExtraRetake = new UntypedFormControl(this.N7Retake);
        }
      });
  }

  ngOnChanges(changes: SimpleChanges) {
    this.getData();
  }

  triggerResize() {
    this.subs.sink = this._ngZone.onStable.pipe(take(1)).subscribe(() => this.autosize.resizeToFitContent(true));
  }

  save() {
    //To test the fields are empty replace them with string to avoid console errors
    let N22, N33, N7J, N7R;
    if (this.N2 == null) {
      N22 = '';
    } else {
      N22 = this.toString(this.N2);
    }
    if (this.N3 == null) {
      N33 = '';
    } else {
      N33 = this.toString(this.N3);
    }
    if (this.N7Jury == null) {
      N7J = '';
    } else {
      N7J = this.toString(this.N7Jury);
    }
    if (this.N7Retake == null) {
      N7R = '';
    } else {
      N7R = this.toString(this.N7Retake);
    }
    
    this.isWaitingForResponse = true;
    if (this.isNew) {
      this.textValue = this.textValue.replace(/["']/g, "'");
      this.subs.sink = this.rncpTitlesService
      .createFinalTranscriptParameter({
        rncp_id: this.selectedRncpTitleId,
        class_id: this.selectedClassId,
        N2_Deadline: N22,
          N3_Deadline: N33,
          N3_Special_Text: this.textValue,
          N7_Date_Jury_Decision: N7J,
          N7_Retake_Date: N7R,
        })
        .subscribe((data) => {
          this.isWaitingForResponse = false;
          Swal.fire({
            type: 'success',
            title: this.translate.instant('CCED_S01.TITLE'),
            text: this.translate.instant('CCED_S01.TEXT'),
            confirmButtonText: this.translate.instant('CCED_S01.BUTTON_1'),
          });
          const realData = data.data.CreateFinalTranscriptParameter;
          this.parameterID = realData._id;
          this.isNew = false;
          this.N2 = realData.final_n2_deadline;
          this.N2 = this.toDate(this.N2);
          
          this.N3 = realData.final_n3_deadline;
          this.N3 = this.toDate(this.N3);
          
          this.textValue = realData.final_n3_special_text;
          
          this.N7Jury = realData.final_n7_jury_decision;
          this.N7Jury = this.toDate(this.N7Jury);
          
          this.N7Retake = realData.final_n7_extra_retake;
          this.N7Retake = this.toDate(this.N7Retake);

          this.finalN2Deadline = new UntypedFormControl(this.N2);
          this.finalN3Deadline = new UntypedFormControl(this.N3);
          this.finalN7JuryDecision = new UntypedFormControl(this.N7Jury);
          this.finalN7ExtraRetake = new UntypedFormControl(this.N7Retake);
        });
      } else {
      this.textValue = this.textValue.replace(/["']/g, "'");
      this.subs.sink = this.rncpTitlesService
      .updateFinalTranscriptParameter(this.parameterID, {
        rncp_id: this.selectedRncpTitleId,
        class_id: this.selectedClassId,
        N2_Deadline: N22,
        N3_Deadline: N33,
        N3_Special_Text: this.textValue,
        N7_Date_Jury_Decision: N7J,
        N7_Retake_Date: N7R,
      })
      .subscribe((data) => {
        this.isWaitingForResponse = false;
          Swal.fire({
            type: 'success',
            title: this.translate.instant('CCED_S01.TITLE'),
            text: this.translate.instant('CCED_S01.TEXT'),
            confirmButtonText: this.translate.instant('CCED_S01.BUTTON_1'),
          });
          const realData = data.data.CreateFinalTranscriptParameter;
          this.isNew = false;
          this.N2 = realData.final_n2_deadline;
          this.N2 = this.toDate(this.N2);

          this.N3 = realData.final_n3_deadline;
          this.N3 = this.toDate(this.N3);

          this.textValue = realData.final_n3_special_text;

          this.N7Jury = realData.final_n7_jury_decision;
          this.N7Jury = this.toDate(this.N7Jury);

          this.N7Retake = realData.final_n7_extra_retake;
          this.N7Retake = this.toDate(this.N7Retake);

          this.finalN2Deadline = new UntypedFormControl(this.N2);
          this.finalN3Deadline = new UntypedFormControl(this.N3);
          this.finalN7JuryDecision = new UntypedFormControl(this.N7Jury);
          this.finalN7ExtraRetake = new UntypedFormControl(this.N7Retake);
        });
    }
  }

  addEvent(type: Number, event: MatDatepickerInputEvent<Date>) {

    switch (type) {
      case 1: {
        this.N2 = event.value;
        this.finalN2Deadline.patchValue(this.N2);
        break;
      }
      case 2: {
        this.N3 = event.value;
        this.finalN3Deadline.patchValue(this.N3);
        break;
      }
      case 3: {
        this.N7Jury = event.value;
        this.finalN7JuryDecision.patchValue(this.N7Jury);
        break;
      }
      case 4: {
        this.N7Retake = event.value;
        this.finalN7ExtraRetake.patchValue(this.N7Retake);

        break;
      }
      default:
    }
  }

  toDate(dateStr) {
    const [day, month, year] = dateStr.split('/');
    return new Date(year, month - 1, day);
  }

  toString(dateDate) {
    return dateDate.toLocaleDateString('id-ID');
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
