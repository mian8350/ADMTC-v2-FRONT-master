import { Component, OnInit, Output, Input, EventEmitter, ChangeDetectorRef, AfterViewChecked, ViewChild, OnDestroy } from '@angular/core';
import { UntypedFormBuilder, FormGroup, Validators } from '@angular/forms';
import { DateAdapter } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from 'app/service/auth-service/auth.service';
import { FileUploadService } from 'app/service/file-upload/file-upload.service';
import { SchoolService } from 'app/service/schools/school.service';
import { StudentsService } from 'app/service/students/students.service';
import { UtilityService } from 'app/service/utility/utility.service';
import { ParseStringDatePipe } from 'app/shared/pipes/parse-string-date.pipe';
import { ApplicationUrls } from 'app/shared/settings';
import * as moment from 'moment';
import { SubSink } from 'subsink';
import Swal from 'sweetalert2';
import * as _ from 'lodash';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'ms-first-correction-eval-pro',
  templateUrl: './first-correction-eval-pro.component.html',
  styleUrls: ['./first-correction-eval-pro.component.scss'],
  providers: [ParseStringDatePipe],
})
export class FirstCorrectionEvalProComponent implements OnInit, AfterViewChecked, OnDestroy {
  @Input() longDirective: any;
  private subs = new SubSink();
  today = new Date();
  isLoadingUpload = false;
  photo: string;
  photo_s3_path: string;
  is_photo_in_s3: boolean;
  maleStudentIcon = '../../../../../assets/img/student_icon.png';
  femaleStudentIcon = '../../../../../assets/img/student_icon_fem.png';
  @ViewChild('fileUpload', { static: false }) uploadInput: any;
  datePipe: DatePipe;

  @Output() currentIndex = new EventEmitter<any>();
  serverimgPath = `${ApplicationUrls.baseApi}/fileuploads/`.replace('/graphql', '');

  constructor(
    public authService: AuthService,
    public translate: TranslateService,
    private fb: UntypedFormBuilder,
    private studentService: StudentsService,
    private schoolService: SchoolService,
    private parseStringDatePipe: ParseStringDatePipe,
    private dateAdapter: DateAdapter<Date>,
    private fileUploadService: FileUploadService,
    private sanitizer: DomSanitizer,
    private utilService: UtilityService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    public dialog: MatDialog,
  ) {}
  ngOnInit() {
    this.dateAdapter.setLocale(this.translate.currentLang);
  }

  ngAfterViewChecked() {
    this.cdr.detectChanges();
  }

  translateDate(date) {
    return moment(date, 'DD/MM/YYYY').format('DD/MM/YYYY');
  }

  openUploadWindow() {
    const file = this.uploadInput.nativeElement.click();
  }

  identityUpdated() {
  }

  handleInputChange(fileInput: Event) {
  }

  editIdentity() {}

  resetFileState() {
    this.uploadInput.nativeElement.value = '';
  }

  openPopUpValidation(data, type) {}
  ngOnDestroy() {
    // this.subs.unsubscribe();
  }
}
