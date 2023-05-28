import { Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { FormArray, UntypedFormBuilder, FormGroup, Validators } from '@angular/forms';
import { DateAdapter } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import * as _ from 'lodash';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { removeSpaces, requiredTrueIfValidator } from 'app/service/customvalidator.validator';
import { FileUploadService } from 'app/service/file-upload/file-upload.service';
import { JobDescService } from 'app/service/job-desc/job-desc.service';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import { StudentsService } from 'app/service/students/students.service';
import { UtilityService } from 'app/service/utility/utility.service';
import { ParseLocalToUtcPipe } from 'app/shared/pipes/parse-local-to-utc.pipe';
import { ParseStringDatePipe } from 'app/shared/pipes/parse-string-date.pipe';
import { ParseUtcToLocalPipe } from 'app/shared/pipes/parse-utc-to-local.pipe';
import * as moment from 'moment';
import { forkJoin } from 'rxjs';
import { SubSink } from 'subsink';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { JOBSTYLES } from './problematic-pdf-style';

@Component({
  selector: 'ms-problematic-pdf',
  templateUrl: './problematic-pdf.component.html',
  styleUrls: ['./problematic-pdf.component.scss'],
  providers: [ParseStringDatePipe, ParseLocalToUtcPipe, ParseUtcToLocalPipe],
})
export class ProblematicPDFComponent implements OnInit, OnDestroy, OnChanges {
  private subs = new SubSink();
  @Input() problematicForm: any;
  @Input() questionResponseForm: any;
  @Input() problematicData: any;
  @Input() problematicType: any;
  @Input() studentData: any;
  @Input() schoolId: string;
  @Input() classData: any;
  @Input() statusCard: any;
  @Input() relatedBlockIndex: any;
  @Input() titleId: string;
  @Input() typeDisplay: boolean;
  @Output() continue = new EventEmitter<boolean>();

  constructor(
    private fb: UntypedFormBuilder,
    private studentService: StudentsService,
    public dialog: MatDialog,
    private router: Router,
    private rncpTitleService: RNCPTitlesService,
    public utilService: UtilityService,
    private jobDescService: JobDescService,
    public translate: TranslateService,
    private fileUploadService: FileUploadService,
    private parseStringDatePipe: ParseStringDatePipe,
    private parseLocalToUTCPipe: ParseLocalToUtcPipe,
    private parseUTCToLocalPipe: ParseUtcToLocalPipe,
    private dateAdapter: DateAdapter<Date>,
  ) {}

  ngOnInit() {
  }

  ngOnChanges() {}

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  getPdfHtml() {

    const fileDoc = document.getElementById('pdf-old').innerHTML;
    let html = JOBSTYLES;
    html = html + fileDoc;
    return html;
  }

  translateDate(date: any) {
    if (date) {
      return moment(date).format('DD/MM/YYYY');
    } else {
      return moment().format('DD/MM/YYYY');
    }
  }

  getPdfNewHtml() {

    const fileDoc = document.getElementById('pdf-new').innerHTML;
    let html = JOBSTYLES;
    html = html + fileDoc;
    return html;
  }

  renderBlockHideAndShow(competence, compIndex: number) {
    if (competence.block_type === 'always_visible') {
      return true;
    } else if (competence.block_type === 'router') {
      return true;
    }
    let finalDecide = false;

    for (let i = 0; i < this.relatedBlockIndex.length; i++) {
      if (compIndex === this.relatedBlockIndex[i]) {
        finalDecide = true;
        break;
      }
    }
    return finalDecide;
  }

  showSignature(signatureValue: boolean) {
    let result = false;
      if (signatureValue) {
        result = true;
      }
    return result;
  }

}
