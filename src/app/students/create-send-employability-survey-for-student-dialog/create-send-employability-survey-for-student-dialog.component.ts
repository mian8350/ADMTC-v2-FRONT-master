import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder, FormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import * as moment from 'moment';
import { Observable } from 'rxjs';
import { SubSink } from 'subsink';
import * as _ from 'lodash';
import { map, startWith } from 'rxjs/operators';
import { UtilityService } from 'app/service/utility/utility.service';
import { TranslateService } from '@ngx-translate/core';
import { ParseLocalToUtcPipe } from 'app/shared/pipes/parse-local-to-utc.pipe';

@Component({
  selector: 'ms-create-send-employability-survey-for-student-dialog',
  templateUrl: './create-send-employability-survey-for-student-dialog.component.html',
  styleUrls: ['./create-send-employability-survey-for-student-dialog.component.scss'],
  providers: [ParseLocalToUtcPipe],
})
export class CreateSendEmployabilitySurveyForStudentDialogComponent implements OnInit {
  isWaitingForResponse = false;
  today: any;
  SendOneTimeEmployabilitySurveyProcessForm: UntypedFormGroup;
  private subs = new SubSink();
  esList = [];
  esTemplateListFilter: Observable<any[]>;
  enumValidatorList = ['operator', 'certifier', 'academic_director'];

  esValidatoreListFilter: Observable<any[]>;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: UntypedFormBuilder,
    public dialogRef: MatDialogRef<CreateSendEmployabilitySurveyForStudentDialogComponent>,
    private rncpTitleService: RNCPTitlesService,
    private utilService: UtilityService,
    private translate: TranslateService,
    private parseLocalToUTCPipe: ParseLocalToUtcPipe,
  ) {}

  ngOnInit() {
    this.today = new Date();
    this.initForm();
    this.getESTemplate();
    // this.getValidatorDropdown();

    if (this.data) {
      this.SendOneTimeEmployabilitySurveyProcessForm.get('rncp_title_id').patchValue(this.data.rncp_title_id);
      this.SendOneTimeEmployabilitySurveyProcessForm.get('students').patchValue(this.data.students);
      this.SendOneTimeEmployabilitySurveyProcessForm.get('class_id').patchValue(this.data.class_id);


    }
  }

  initForm() {
    this.SendOneTimeEmployabilitySurveyProcessForm = this.fb.group({
      name: ['', [Validators.required]],
      form_builder_id: ['', [Validators.required]],
      is_es_new_flow_form_builder: [true],
      send_date: ['', [Validators.required]],
      expiration_date: ['', [Validators.required]],
      is_required_for_certificate: [false],
      rncp_title_id: ['', [Validators.required]],
      class_id: ['', [Validators.required]],
      students: [[], [Validators.required]],
    });
  }

  submitDialog() {

    if (this.SendOneTimeEmployabilitySurveyProcessForm.value) {
      const payload = this.SendOneTimeEmployabilitySurveyProcessForm.value;
      const sendDateUTC = this.convertLocalDateToUTC(payload.send_date);
      const expDateUTC = this.convertLocalDateToUTC(payload.expiration_date);
      payload['send_date'] = sendDateUTC;
      payload['expiration_date'] = expDateUTC;
      payload['send_time'] = "15:59";
      payload['expiration_time'] = "15:59";

      this.dialogRef.close(payload);
    }
  }

  convertLocalDateToUTC(data) {

    const date = moment(data).format('DD/MM/YYYY');
    const time = "15:59"

    const dateTimeInUTC = this.parseLocalToUTCPipe.transformDate(date + time, 'DD/MM/YYYY');
    return dateTimeInUTC;
  }

  closeDialog() {
    this.dialogRef.close();
  }

  getESTemplate() {
    this.subs.sink = this.rncpTitleService.getESFormBuilderTemplate().subscribe((resp) => {

      if (resp) {
        this.esList = _.cloneDeep(resp);
        this.esTemplateListFilter = this.SendOneTimeEmployabilitySurveyProcessForm.get('form_builder_id').valueChanges.pipe(
          startWith(''),
          map((searchText) =>
            this.esList
              .filter((eslist) => (eslist ? eslist.form_builder_name.toLowerCase().includes(searchText.toLowerCase()) : false))
              .sort((a: any, b: any) => a.form_builder_name.localeCompare(b.form_builder_name)),
          ),
        );
      }
    });
  }

  displayFnES(value: any) {
    if (value) {
      const list = _.cloneDeep(this.esList);
      const found = _.find(list, (res) => res._id === value);
      let result = '';
      if (found) {
        result = found.form_builder_name;
      }
      return result;
    }
  }

  getValidatorDropdown() {
    this.enumValidatorList = this.enumValidatorList.sort((validatorA, validatorB) => {
      if (
        this.utilService.simplifyRegex(this.translate.instant('056_ES.validator_dropdown.' + validatorA)) <
        this.utilService.simplifyRegex(this.translate.instant('056_ES.validator_dropdown.' + validatorB))
      ) {
        return -1;
      } else if (
        this.utilService.simplifyRegex(this.translate.instant('056_ES.validator_dropdown.' + validatorA)) >
        this.utilService.simplifyRegex(this.translate.instant('056_ES.validator_dropdown.' + validatorB))
      ) {
        return 1;
      } else {
        return 0;
      }
    });
    this.esValidatoreListFilter = this.SendOneTimeEmployabilitySurveyProcessForm.get('validator').valueChanges.pipe(
      startWith(''),
      map((searchText) =>
        this.enumValidatorList.filter((eslist) =>
          eslist
            ? this.translate
                .instant('056_ES.validator_dropdown.' + eslist)
                .toLowerCase()
                .includes(searchText.toLowerCase())
            : false,
        ),
      ),
    );
  }

  setValidatorToNone() {
    this.SendOneTimeEmployabilitySurveyProcessForm.get('with_rejection_flow').patchValue(false);
  }

  displayFnValidator(value: any) {
    if (value) {
      let result = '';
      if(value === 'no_validator') {
        result = this.translate.instant('056_ES.validator_dropdown.no_validator');
      } else {
        const list = _.cloneDeep(this.enumValidatorList);
        const found = _.find(list, (res) => res === value);
        if (found) {
          result = this.translate.instant('056_ES.validator_dropdown.' + found);
        }
      }
      return result;
    }
  }
}
