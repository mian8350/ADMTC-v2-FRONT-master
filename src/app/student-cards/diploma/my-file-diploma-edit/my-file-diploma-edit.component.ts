import {
  AfterViewChecked,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { AcademicJourneyService } from 'app/service/academic-journey/academic-journey.service';
import { AuthService } from 'app/service/auth-service/auth.service';
import { FileUploadService } from 'app/service/file-upload/file-upload.service';
import { ParseLocalToUtcPipe } from 'app/shared/pipes/parse-local-to-utc.pipe';
import { ParseStringDatePipe } from 'app/shared/pipes/parse-string-date.pipe';
import { ParseUtcToLocalPipe } from 'app/shared/pipes/parse-utc-to-local.pipe';
import { UserProfileData } from 'app/users/user.model';
import { SubSink } from 'subsink';
import Swal from 'sweetalert2';
import * as _ from 'lodash';
import * as moment from 'moment';
import { DateAdapter } from '@angular/material/core';
import { MatSelectChange } from '@angular/material/select';
import { UtilityService } from 'app/service/utility/utility.service';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { environment } from 'environments/environment';
import { ApplicationUrls } from 'app/shared/settings';
import { SchoolService } from 'app/service/schools/school.service';
@Component({
  selector: 'ms-my-file-diploma-edit',
  templateUrl: './my-file-diploma-edit.component.html',
  styleUrls: ['./my-file-diploma-edit.component.scss'],
  providers: [ParseLocalToUtcPipe, ParseUtcToLocalPipe, ParseStringDatePipe],
})
export class MyFileDiplomaEditComponent implements OnInit, AfterViewChecked, OnDestroy {
  @Input() studentId = '';
  @Input() schoolId: string;
  @Input() selectedDiplomaIndex: number;
  @Output() updateStatusViewEdit = new EventEmitter<{ type: string; index: number }>();
  private subs = new SubSink();

  userData: UserProfileData;
  acadJourneyId = '';
  diplomaForm: UntypedFormGroup;
  @ViewChild('fileUploadDoc', { static: false }) fileUploaderDoc: ElementRef;

  diplomaData;
  modifyType = '';
  filteredCountry = [];
  qualificationList = [
    {
    value: 'bac', name: 'Bac'
    },
    {
    value: 'bac1', name: 'Bac+1'
    },
    {
    value: 'bac2', name: 'Bac+2'
    },
    {
    value: 'bac3', name: 'Bac+3'
    },
    {
    value: 'bac4', name: 'Bac+4'
    },
    {
    value: 'bac5', name: 'Bac+5'
    },
  ]

  countries;
  countryList;
  pdfIcon = '../../../../../../assets/img/pdf.png';
  serverimgPath = `${ApplicationUrls.baseApi}/fileuploads/`.replace('/graphql', '');

  constructor(
    private acadJourneyService: AcademicJourneyService,
    private authService: AuthService,
    private router: Router,
    private fb: UntypedFormBuilder,
    private fileUploadService: FileUploadService,
    private route: ActivatedRoute,
    private parseLocalToUTCPipe: ParseLocalToUtcPipe,
    private parseUTCToLocalPipe: ParseUtcToLocalPipe,
    private parseStringDatePipe: ParseStringDatePipe,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef,
    private utilService: UtilityService,
    private translate: TranslateService,
    private schoolService: SchoolService,
    private dateAdapter: DateAdapter<Date>,
  ) {}

  ngOnInit() {
    this.dateAdapter.setLocale(this.translate.currentLang);
    this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      this.dateAdapter.setLocale(this.translate.currentLang);
    });
    this.subs.sink = this.schoolService.getCountry().subscribe((list: any[]) => {
      this.countries = list;
      this.countryList = list;
      this.filteredCountry = list;
    });
    this.initForm();
    this.subs.sink = this.acadJourneyService.getMyDiplomas(this.studentId).subscribe((response) => {

      const temp = _.cloneDeep(response);
      if (temp) {
        this.diplomaData = temp;
        if (temp && temp._id) {
          this.acadJourneyId = temp._id;
        }
        if (temp && temp.student_id && temp.student_id._id) {
          temp.student_id = temp.student_id._id;
        }

        // *************** Check if its adding new diploma or edit diploma
        if (this.selectedDiplomaIndex === 0 || this.selectedDiplomaIndex) {
          this.modifyType = 'edit'
          if (this.diplomaData.diplomas && this.diplomaData.diplomas.length) {
            this.diplomaData.diplomas.forEach((diploma) => {
              if (diploma.graduation_date && diploma.graduation_date.date && diploma.graduation_date.time) {
                diploma.graduation_date.date = this.parseStringDatePipe.transformStringToDate(
                  this.parseUTCToLocalPipe.transformDate(diploma.graduation_date.date, diploma.graduation_date.time),
                );
                diploma.graduation_date.time = this.parseUTCToLocalPipe.transform(diploma.graduation_date.time);
              } else {
                diploma.graduation_date.date = '';
                diploma.graduation_date.time = '00:01'
              }
            });
          }

          const selectedDiploma = this.diplomaData.diplomas[this.selectedDiplomaIndex];
          this.diplomaForm.get('student_id').patchValue(temp.student_id);
          this.getDiplomaForm().patchValue(selectedDiploma);
        } else {
          this.modifyType = 'add'
        }
      }
    });
  }

  ngAfterViewChecked() {
    this.cdr.detectChanges();
  }

  initForm() {
    this.diplomaForm = this.fb.group({
      student_id: [this.studentId, [Validators.required]],
      diplomas: this.fb.group({
        institute_name: [''],
        graduation_date: this.fb.group({
          date: ['', [Validators.required]],
          time: ['00:01', [Validators.required]],
        }),
        qualification: ['', [Validators.required]],
        diploma_name: ['', [Validators.required]],
        city: [''],
        country: [''],
        additional_information: [''],
        diploma_upload_date: [''],
        diploma_photo: ['', [Validators.required]],
      }),
    });
  }

  getDiplomaForm(): UntypedFormGroup {
    return this.diplomaForm.get('diplomas') as UntypedFormGroup;
  }

  chooseFile(fileInput: Event) {
    const acceptable = ['jpg', 'jpeg', 'png', 'pdf'];
    const file = (<HTMLInputElement>fileInput.target).files[0];
    const fileType = this.utilService.getFileExtension(file.name).toLocaleLowerCase();
    if (acceptable.includes(fileType)) {
      this.subs.sink = this.fileUploadService.singleUpload(file).subscribe((resp) => {
        if (resp) {
          this.getDiplomaForm().get('diploma_photo').setValue(resp.s3_file_name);
        } else {
          Swal.fire({
            type: 'error',
            title: 'Error',
          });
        }
      });
    } else {
      Swal.fire({
        type: 'error',
        title: this.translate.instant('UPLOAD_ERROR.WRONG_TYPE_TITLE'),
        text: this.translate.instant('UPLOAD_ERROR.WRONG_TYPE_TEXT', {file_exts: '.jpg, .jpeg, .png, .pdf'}),
        footer: `<span style="margin-left: auto">UPLOAD_ERROR</span>`,
        allowEscapeKey: false,
        allowOutsideClick: false,
        allowEnterKey: false
      });
    }
  }

  translateGraduationDate(dateRaw) {
    if (dateRaw && dateRaw.date && dateRaw.time) {
      return moment(moment(dateRaw.date).format('DD/MM/YYYY') + dateRaw.time, 'DD/MM/YYYYHH:mm').format('DD/MM/YYYY');
    } else {
      return '';
    }
  }

  imgURL(src: string) {
    const isPDF = this.utilService.getFileExtension(src).toLocaleLowerCase() === 'pdf' || this.utilService.getFileExtension(src).toLocaleLowerCase() === 'PDF';
    if (isPDF) {
      return this.pdfIcon;
    } else {
      return this.sanitizer.bypassSecurityTrustUrl(this.serverimgPath + src);
    }
  }

  createPayload() {
    const payload = _.cloneDeep(this.diplomaForm.value);
    const formData = _.cloneDeep(this.getDiplomaForm().value);
    if (this.modifyType === 'add') {
      payload.diplomas = this.diplomaData && this.diplomaData.diplomas ? this.diplomaData.diplomas : [];

      payload.diplomas.push(formData);
    } else if (this.modifyType === 'edit' && (this.selectedDiplomaIndex === 0 || this.selectedDiplomaIndex)) {
      const diplomasIndex = this.selectedDiplomaIndex;
      payload.diplomas = this.diplomaData && this.diplomaData.diplomas ? this.diplomaData.diplomas : [];
      payload.diplomas[diplomasIndex] = formData;
    }

    if (payload && payload.diplomas && payload.diplomas.length) {
      payload.diplomas.forEach((diploma) => {
        if (diploma.graduation_date) {
          diploma.graduation_date.date = this.parseLocalToUTCPipe.transformDate(
            moment(diploma.graduation_date.date).format('DD/MM/YYYY'),
            diploma.graduation_date.time,
          );
          diploma.graduation_date.time = this.parseLocalToUTCPipe.transform(diploma.graduation_date.time);
        }
      });
    }
    return payload;
  }

  submitForm() {
    const payload = this.createPayload();

    if (this.acadJourneyId) {
      this.subs.sink = this.acadJourneyService.updateAcademicJourney(this.acadJourneyId, payload).subscribe((resp) => {

        if (resp && resp._id) {
          Swal.fire({
            type: 'success',
            title: 'Bravo',
          });
          this.acadJourneyId = resp._id;
          this.updateStatusViewEdit.emit({ type: 'view', index: null });
        }
      });
    } else {
      this.subs.sink = this.acadJourneyService.createAcademicJourney(payload).subscribe((resp) => {

        if (resp && resp._id) {
          Swal.fire({
            type: 'success',
            title: 'Bravo',
          });
          this.acadJourneyId = resp._id;
          this.updateStatusViewEdit.emit({ type: 'view', index: null });
        }
      });
    }
  }

  openUploadWindow() {
    this.fileUploaderDoc.nativeElement.click();
  }

  downloadFile(fileUrl: string) {
    // window.open(fileUrl, '_blank');downloadDoc() {
    const a = document.createElement('a');
    a.target = 'blank';
    a.href = `${environment.apiUrl}/fileuploads/${fileUrl}?download=true`.replace('/graphql', '');
    a.click();
    a.remove();
  }

  cancel() {
    this.updateStatusViewEdit.emit({ type: 'view', index: null });
    // this.router.navigate(['/academic-journeys/my-diploma']);
  }

  resetGradeIfNotCGPA(event: MatSelectChange) {

    if (event && event.value !== 'cgpa_percentage') {
      this.getDiplomaForm().get('score').patchValue(null);
      this.getDiplomaForm().get('out_of_score').patchValue(null);
    }
  }

  showDiploma(diplomaIndex) {
    if (this.modifyType === 'add') {
      return true;
    } else if (this.modifyType === 'edit') {
      // const selectedIndex = parseInt(this.route.snapshot.queryParamMap.get('index'), 10);
      const selectedIndex = this.selectedDiplomaIndex;
      if (diplomaIndex !== selectedIndex) {
        return true;
      }
    }
    return false;
  }

  filterCountry() {
    const searchString = this.getDiplomaForm().get('country').value.toLowerCase().trim();
    this.filteredCountry = this.countries.filter((country) => country.name.toLowerCase().trim().includes(searchString));
  }

  dateUpdate() {
    this.getDiplomaForm().get('graduation_date').get('time').patchValue('00:01');
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
