import { Component, OnInit, AfterViewChecked, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { CoreService } from 'app/service/core/core.service';
import { JuryOrganizationService } from 'app/service/jury-organization/jury-organization.service';
import { TranscriptBuilderService } from 'app/service/transcript-builder/transcript-builder.service';
import { SpeechToTextDialogComponent } from 'app/shared/components/speech-to-text-dialog/speech-to-text-dialog.component';
import { STYLE } from 'app/title-rncp/conditions/class-condition/score/second-step-score/condition-score-preview/pdf-styles';
import { ImageBase64 } from 'app/transcript-builder/transcript-builder/image-base64';
import { environment } from 'environments/environment';
import { SubSink } from 'subsink';
import { JURYSTYLES } from './jury-pdf-style';
// import { PRINTSTYLES } from '../../../dist/assets/scss/theme/doc-style';

@Component({
  selector: 'ms-pdf-jury-grand-oral',
  templateUrl: './pdf-jury-grand-oral.component.html',
  styleUrls: ['./pdf-jury-grand-oral.component.scss'],
})
export class PdfJuryGrandOralComponent implements OnInit, AfterViewInit {
  private subs = new SubSink();
  imcpTransparent = '../../../../../assets/img/imcp-transparent.png';
  imcpLogo = '../../../../../assets/img/imcp-logo.png';
  @ViewChild('pagesElement', { static: false }) documentPagesRef: ElementRef;
  @ViewChild('pagesElementStudents', { static: false }) pagesElementStudents: ElementRef;
  imcp46 = ImageBase64.imcpLogoTransparent;
  justification = new UntypedFormControl();
  competence = new UntypedFormControl();
  block = new UntypedFormControl();
  templateForm: UntypedFormGroup;
  dataGrandOral: any;
  totalCriteria = 0;
  constructor(
    public coreService: CoreService,
    private fb: UntypedFormBuilder,
    public dialog: MatDialog,
    private juryService: JuryOrganizationService,
    private transcriptBuilderService: TranscriptBuilderService,
  ) {}

  ngOnInit() {
    this.coreService.sidenavOpen = false;
    this.initForm();
    this.getGrandOralData();
  }
  ngAfterViewInit() {
    this.coreService.sidenavOpen = false;
  }

  getGrandOralData() {
    this.subs.sink = this.juryService.getMarkGrandOral().subscribe((list) => {
      if (list) {
        this.dataGrandOral = list;
        if (this.dataGrandOral.conpetences && this.dataGrandOral.conpetences.length) {
          this.dataGrandOral.conpetences.forEach((element) => {
            this.totalCriteria += element.criteria.length;
            this.addBlockFormArray();
          });
        }

      }
    });
  }

  getGrandOralDataPDF() {
    this.subs.sink = this.juryService.getMarkGrandOral().subscribe((list) => {
      if (list) {
        this.dataGrandOral = list;
        if (this.dataGrandOral.conpetences && this.dataGrandOral.conpetences.length) {
          this.dataGrandOral.conpetences.forEach((element) => {
            this.totalCriteria += element.criteria.length;
            this.addBlockFormArray();
          });
        }

      }
    });
  }

  initForm() {
    this.templateForm = this.fb.group({
      block: this.fb.array([]),
    });
  }

  initBlockForm() {
    return this.fb.group({
      justification: [''],
      competence: [''],
      block: [''],
    });
  }
  // Function to get each formarray
  get getBlockFormArray(): UntypedFormArray {
    return this.templateForm.get('block') as UntypedFormArray;
  }
  // Add into array
  addBlockFormArray() {
    this.getBlockFormArray.push(this.initBlockForm());
  }
  // Remove from array
  removeBlockFormArray(blockIndex) {
    this.getBlockFormArray.removeAt(blockIndex);
  }
  openVoiceRecog() {

    this.dialog
      .open(SpeechToTextDialogComponent, {
        width: '800px',
        minHeight: '300px',
        panelClass: 'certification-rule-pop-up',
        disableClose: true,
        data: this.justification.value,
      })
      .afterClosed()
      .subscribe((resp) => {

        this.justification.patchValue(resp);
      });
  }

  generatePDF() {
    const fileDoc = document.getElementById('grand-oral').innerHTML;
    let html = JURYSTYLES;
    html = html + fileDoc;
    html = STYLE + html;
    return html;
  }
}
