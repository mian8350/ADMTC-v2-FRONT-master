import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import { Observable } from 'rxjs';
import { SubSink } from 'subsink';
import * as _ from 'lodash';
import { map, startWith } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { EmployabilitySurveyService } from 'app/service/employability-survey/employability-survey.service';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';

@Component({
  selector: 'ms-create-employability-survey-process-dialog',
  templateUrl: './create-employability-survey-process-dialog.component.html',
  styleUrls: ['./create-employability-survey-process-dialog.component.scss'],
})
export class CreateEmployabilitySurveyProcessDialogComponent implements OnInit {
  student_participant_dropdown_list = [
    {
      name: 'All active students',
      value: 'all_active',
    },
    {
      name: 'All active and suspended students',
      value: 'all_active_and_suspended',
    },
    {
      name: 'Only students who pass the final transcript',
      value: 'all_pass_final_transcript',
    },
    {
      name: 'Only students who retake the final transcript',
      value: 'all_retake_final_transcript',
    },
    {
      name: 'Only students who fail the final transcript',
      value: 'all_fail_final_transcript',
    },
    {
      name: 'Only students who pass after retake the final transcript',
      value: 'all_pass_after_retake_final_transcript',
    },
    {
      name: 'Only students who fail after retake the final transcript',
      value: 'all_fail_after_retake_final_transcript',
    },
  ];
  surveyTypes: any[] = [
    {
      name: 'One time',
      value: 'one_time',
    },
    {
      name: 'Continuous',
      value: 'continuous',
    },
  ];
  filteredTypes: Observable<any>;
  surveyForm: UntypedFormGroup;
  titleList = [];
  classList = [];
  rncp_title_lists: Observable<any>;
  class_lists: Observable<any>;
  private subs = new SubSink();

  isWaitingForResponse = false;

  filteredParticipant = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data,
    private dialogRef: MatDialogRef<CreateEmployabilitySurveyProcessDialogComponent>,
    private fb: UntypedFormBuilder,
    private rncpService: RNCPTitlesService,
    private translate: TranslateService,
    private esService: EmployabilitySurveyService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.initForm();
    this.populate_rncp_list();
    this.initTypeFilter();

  }

  initForm() {
    this.surveyForm = this.fb.group({
      name: ['', Validators.required],
      rncp_title_id: ['', Validators.required],
      class_id: ['', Validators.required],
      employability_survey_type: ['', Validators.required],
      is_es_new_flow_form_builder: [true]
    
    });
  }

  initTypeFilter() {
    this.filteredTypes = this.surveyForm.get('employability_survey_type').valueChanges.pipe(
      startWith(''),
      map((searchText) =>
        this.surveyTypes
          .filter(
            (type) =>
              type.name.toLowerCase().includes(searchText.toLowerCase()) ||
              this.translate
                .instant('CREATE_ES_DIALOG.' + type.name)
                .toLowerCase()
                .includes(searchText.toLowerCase()),
          )
          .sort((a: any, b: any) => a.name.localeCompare(b.name)),
      ),
    );
  }

  populate_rncp_list() {
    this.isWaitingForResponse = true;
    this.subs.sink = this.rncpService.getTitleDropdownHaveStudent(true, true).subscribe((res) => {
      this.isWaitingForResponse = false;
      if (res) {
        this.titleList = _.cloneDeep(res);
        this.rncp_title_lists = this.surveyForm.get('rncp_title_id').valueChanges.pipe(
          startWith(''),
          map((searchText) =>
            this.titleList
              .filter((title) => (title ? title.short_name.toLowerCase().includes(searchText.toLowerCase()) : false))
              .sort((a: any, b: any) => a.short_name.localeCompare(b.short_name)),
          ),
        );
      }
    });
  }

  getClassList() {

    this.isWaitingForResponse = true;
    this.surveyForm.get('class_id').setValue('');
    this.subs.sink = this.rncpService.getClassesByTitleAndHasStudent(this.surveyForm.get('rncp_title_id').value, true).subscribe((resp) => {
      this.isWaitingForResponse = false;
      if (resp) {
        this.classList = _.cloneDeep(resp);
        this.class_lists = this.surveyForm.get('class_id').valueChanges.pipe(
          startWith(''),
          map((searchText) =>
            this.classList
              .filter((classes) => (classes ? classes.name.toLowerCase().includes(searchText.toLowerCase()) : false))
              .sort((a: any, b: any) => a.name.localeCompare(b.name)),
          ),
        );
      }
    });
  }

  submitForm() {

    // this.dialogRef.close(this.surveyForm.value);
    this.submitSurveyProcess(this.surveyForm.value);
  }

  submitSurveyProcess(payload: any) {
    this.isWaitingForResponse = true;
    this.subs.sink = this.esService.createEmployabilitySurveyProcess(payload).subscribe(
      (resp) => {
      if (resp.data) {
        this.isWaitingForResponse = false;

        Swal.fire({
          type: 'success',
          title: 'Bravo',
        }).then(() => {
          this.dialogRef.close();
          this.router.navigate(['/employability-survey/details/', resp.data.CreateEmployabilitySurveyProcess._id]);
        });
      } else {
        this.isWaitingForResponse = false;
        if (resp.errors[0].message === 'Employability process name already exist') {
          this.swalErrorNameExist();
        } else if (resp.errors[0].message === 'No student matching condition in this title') {

          this.swalErrorStudentNotFound(payload.type_of_student_participant);
        }

      }
    }
    );
  }

  swalErrorNameExist() {
    Swal.fire({
      type: 'warning',
      title: this.translate.instant('Uniquename_S2.TITLE'),
      text: this.translate.instant('Uniquename_S2.TEXT'),
      confirmButtonText: this.translate.instant('Uniquename_S2.BUTTON'),
    });
  }

  swalErrorStudentNotFound(type) {

    const passTypes = ['all_pass_final_transcript', 'all_pass_after_retake_final_transcript'];
    const failTypes = ['all_fail_final_transcript', 'all_fail_after_retake_final_transcript'];
    const retakeTypes = ['all_retake_final_transcript'];

    let typeName = '';
    if (passTypes.includes(type)) {
      typeName = this.translate.instant('pass');
    } else if (failTypes.includes(type)) {
      typeName = this.translate.instant('fail');
    } else if (retakeTypes.includes(type)) {
      typeName = this.translate.instant('retake');
    }

    Swal.fire({
      type: 'error',
      title: this.translate.instant('Survey_Student_Not_Found.TITLE'),
      html: this.translate.instant('Survey_Student_Not_Found.TEXT', { typeName: typeName }),
      confirmButtonText: this.translate.instant('Survey_Student_Not_Found.BUTTON'),
    });
  }

  closeDialog() {
    this.dialogRef.close();
  }

  displayFn(value: any) {
    if (value) {
      const list = _.cloneDeep(this.titleList);
      const found = _.find(list, (res) => res._id === value);
      let result = '';
      if (found) {
        result = found.short_name;
      }
      return result;
    }
  }

  displayFnClass(value: any) {
    if (value) {
      const list = _.cloneDeep(this.classList);
      const found = _.find(list, (res) => res._id === value);
      let result = '';
      if (found) {
        result = found.name;
      }
      return result;
    }
  }

  displayFnType(value: any) {
    if (value) {
      const list = _.cloneDeep(this.surveyTypes);
      const found = _.find(list, (res) => res.value === value);
      let result = '';
      if (found) {
        result = this.translate.instant('CREATE_ES_DIALOG.'+found.name);
      }
      return result;
    }
  }

  // selectedSurveyType(value) {

  //   if (value === 'continuous') {
  //     this.surveyForm.get('type_of_student_participant').patchValue(null);
  //     this.surveyForm.get('type_of_student_participant').clearValidators();
  //     this.surveyForm.get('type_of_student_participant').updateValueAndValidity();
  //   } else {
  //     this.surveyForm.get('type_of_student_participant').patchValue(null);
  //     this.surveyForm.get('type_of_student_participant').setValidators([Validators.required]);
  //     this.surveyForm.get('type_of_student_participant').updateValueAndValidity();
  //   }
  // }

  setClass(dataClass) {
    this.filteredParticipant = [];
    if (dataClass !== 'All' && !dataClass.already_have_jury_decision) {
      this.student_participant_dropdown_list.forEach((res, index) => {
        if (index < 2) {
          this.filteredParticipant.push(res);
        }
      });
    } else {
      this.filteredParticipant = this.student_participant_dropdown_list;
    }
  }
}
