import { Component, OnInit, Input, OnChanges, Output, EventEmitter } from '@angular/core';
import { UntypedFormGroup, UntypedFormArray } from '@angular/forms';
import { DateAdapter } from '@angular/material/core';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { ParseUtcToLocalPipe } from 'app/shared/pipes/parse-utc-to-local.pipe';
import * as _ from 'lodash';

@Component({
  selector: 'ms-header-section',
  templateUrl: './header-section.component.html',
  styleUrls: ['./header-section.component.scss'],
  providers: [ParseUtcToLocalPipe],
})
export class HeaderSectionComponent implements OnInit, OnChanges {
  @Input() testCorrectionForm: UntypedFormGroup;
  @Input() testData: any;
  @Input() selectedGroupData: any;
  @Input() studentSelectDetail: any;

  @Output() updateFirstForm = new EventEmitter<any>();

  dummyHeader = [
    {
      type: 'other',
      value: 'Hallloooo',
      dataType: 'text',
    },
    {
      type: 'other',
      value: 10,
      dataType: 'number',
    },
  ];

  constructor(private parseUTCtoLocal: ParseUtcToLocalPipe, private translate: TranslateService, private dateAdapter: DateAdapter<Date>) {}

  ngOnInit() {
    this.dateAdapter.setLocale(this.translate.currentLang);
    this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      this.dateAdapter.setLocale(this.translate.currentLang);
    });

  }

  ngOnChanges() {
    if (this.testData) {

      if (!this.testData.group_test) {
        this.getCorrectorName();
      } else {
        if (this.selectedGroupData && (!this.studentSelectDetail || Array.isArray(this.studentSelectDetail))) {

          this.getCorrectorForGroup();
        } else {
          if (this.studentSelectDetail) {

            this.getCorrectorForGroupStudent();
          }
        }
      }

      // *************** Update populate corrector name in footer, we need to update the firstForm to prevent validation bug caused by footer value
      this.updateFirstForm.emit(true);
    }
  }

  getTranslatedDate(date) {
    if (date && date.date_utc && date.time_utc) {
      return this.parseUTCtoLocal.transformDate(date.date_utc, date.time_utc);
    } else {
      return '';
    }
  }

  getCorrectorName() {
    const payload = _.cloneDeep(this.testCorrectionForm.value);
    const header = _.cloneDeep(this.testCorrectionForm.get('correction_grid').get('header').get('fields').value);
    if (payload && payload.corrector) {
      if (header && header.length) {
        header.forEach((foot, inFoot) => {
          if (foot.type === 'correctername' || foot.label.includes('correcteur') || foot.label.includes('corrector')) {
            if (this.testData.corrector_assigned_for_final_retake && this.testData.corrector_assigned_for_final_retake.length) {
              const corrector = this.testData.corrector_assigned_for_final_retake.find(
                (test) => test.corrector_id && test.corrector_id._id === payload.corrector,
              );
              if (corrector) {

                const name = corrector.corrector_id.last_name + ' ' + corrector.corrector_id.first_name;
                if (!this.testCorrectionForm.get('correction_grid').get('header').get('fields').get(inFoot.toString()).get('value').value) {
                  this.testCorrectionForm
                    .get('correction_grid')
                    .get('header')
                    .get('fields')
                    .get(inFoot.toString())
                    .get('value')
                    .patchValue(name);
                }
              } else {
                const correctors = this.testData.corrector_assigned.find(
                  (test) => test.corrector_id && test.corrector_id._id === payload.corrector,
                );
                if (correctors) {

                  const name = correctors.corrector_id.last_name + ' ' + correctors.corrector_id.first_name;
                  if (
                    !this.testCorrectionForm.get('correction_grid').get('header').get('fields').get(inFoot.toString()).get('value').value
                  ) {
                    if (foot.data_type !== 'checkbox') {
                      this.testCorrectionForm
                        .get('correction_grid')
                        .get('header')
                        .get('fields')
                        .get(inFoot.toString())
                        .get('value')
                        .patchValue(name);
                    }
                  }
                }
              }
            } else {
              const corrector = this.testData.corrector_assigned.find(
                (test) => test.corrector_id && test.corrector_id._id === payload.corrector,
              );
              if (corrector) {

                const name = corrector.corrector_id.last_name + ' ' + corrector.corrector_id.first_name;
                if (!this.testCorrectionForm.get('correction_grid').get('header').get('fields').get(inFoot.toString()).get('value').value) {
                  if (foot.data_type !== 'checkbox') {
                    this.testCorrectionForm
                      .get('correction_grid')
                      .get('header')
                      .get('fields')
                      .get(inFoot.toString())
                      .get('value')
                      .patchValue(name);
                  }
                }
              } else {
                this.testData.corrector_assigned.forEach((corrs, inCors) => {
                  const students = corrs.students.find((test) => test._id === payload.student);
                  if (students) {
                    const correctors = this.testData.corrector_assigned[inCors];
                    if (correctors) {

                      const name = correctors.corrector_id.last_name + ' ' + correctors.corrector_id.first_name;
                      if (
                        !this.testCorrectionForm.get('correction_grid').get('header').get('fields').get(inFoot.toString()).get('value')
                          .value
                      ) {
                        if (foot.data_type !== 'checkbox') {
                          this.testCorrectionForm
                            .get('correction_grid')
                            .get('header')
                            .get('fields')
                            .get(inFoot.toString())
                            .get('value')
                            .patchValue(name);
                        }
                      }
                    }
                  }
                });
              }
            }
          }
        });
      }
    } else {
      if (payload && payload.student) {
        if (header && header.length) {
          header.forEach((foot, inFoot) => {
            if (foot.type === 'correctername' || foot.label.includes('correcteur') || foot.label.includes('corrector')) {
              if (this.testData.corrector_assigned_for_final_retake && this.testData.corrector_assigned_for_final_retake.length) {
                this.testData.corrector_assigned_for_final_retake.forEach((corr, inCor) => {
                  const student = corr.students.find((test) => test._id === payload.student);
                  if (student) {
                    const corrector = this.testData.corrector_assigned_for_final_retake[inCor];
                    if (corrector) {

                      const name = corrector.corrector_id.last_name + ' ' + corrector.corrector_id.first_name;
                      if (
                        !this.testCorrectionForm.get('correction_grid').get('header').get('fields').get(inFoot.toString()).get('value')
                          .value
                      ) {
                        if (foot.data_type !== 'checkbox') {
                          this.testCorrectionForm
                            .get('correction_grid')
                            .get('header')
                            .get('fields')
                            .get(inFoot.toString())
                            .get('value')
                            .patchValue(name);
                        }
                      }
                    } else {
                      this.testData.corrector_assigned.forEach((corrs, inCors) => {
                        const students = corrs.students.find((test) => test._id === payload.student);
                        if (students) {
                          const correctors = this.testData.corrector_assigned[inCors];
                          if (correctors) {

                            const name = correctors.corrector_id.last_name + ' ' + correctors.corrector_id.first_name;
                            if (
                              !this.testCorrectionForm
                                .get('correction_grid')
                                .get('header')
                                .get('fields')
                                .get(inFoot.toString())
                                .get('value').value
                            ) {
                              if (foot.data_type !== 'checkbox') {
                                this.testCorrectionForm
                                  .get('correction_grid')
                                  .get('header')
                                  .get('fields')
                                  .get(inFoot.toString())
                                  .get('value')
                                  .patchValue(name);
                              }
                            }
                          }
                        }
                      });
                    }
                  }
                });
              } else {
                this.testData.corrector_assigned.forEach((corr, inCor) => {
                  const student = corr.students.find((test) => test._id === payload.student);
                  if (student) {
                    const corrector = this.testData.corrector_assigned[inCor];
                    if (corrector) {

                      const name = corrector.corrector_id.last_name + ' ' + corrector.corrector_id.first_name;
                      if (
                        !this.testCorrectionForm.get('correction_grid').get('header').get('fields').get(inFoot.toString()).get('value')
                          .value
                      ) {
                        if (foot.data_type !== 'checkbox') {
                          this.testCorrectionForm
                            .get('correction_grid')
                            .get('header')
                            .get('fields')
                            .get(inFoot.toString())
                            .get('value')
                            .patchValue(name);
                        }
                      }
                    }
                  }
                });
              }
            }
          });
        }
      }
    }
  }

  getCorrectorForGroup() {
    const payload = _.cloneDeep(this.testCorrectionForm.value);
    const header = _.cloneDeep(this.testCorrectionForm.get('correction_grid').get('header').get('fields').value);
    if (header && header.length) {
      header.forEach((foot, inFoot) => {
        if (foot.type === 'correctername') {
          if (this.testData.corrector_assigned_for_final_retake && this.testData.corrector_assigned_for_final_retake.length) {
            this.testData.corrector_assigned_for_final_retake.forEach((corr, inCor) => {
              if (corr.test_groups && corr.test_groups.length) {
                const group = corr.test_groups.find((test) => test._id === this.selectedGroupData._id);
                if (group) {
                  const corrector = this.testData.corrector_assigned_for_final_retake[inCor];
                  if (corrector) {

                    const name = corrector.corrector_id.last_name + ' ' + corrector.corrector_id.first_name;
                    if (
                      !this.testCorrectionForm.get('correction_grid').get('header').get('fields').get(inFoot.toString()).get('value').value
                    ) {
                      if (foot.data_type !== 'checkbox') {
                        this.testCorrectionForm
                          .get('correction_grid')
                          .get('header')
                          .get('fields')
                          .get(inFoot.toString())
                          .get('value')
                          .patchValue(name);
                      }
                    }
                  } else {
                    this.testData.corrector_assigned.forEach((corrs, inCors) => {
                      if (corrs.test_groups && corrs.test_groups.length) {
                        const groups = corrs.test_groups.find((test) => test._id === this.selectedGroupData._id);
                        if (groups) {
                          const correctors = this.testData.corrector_assigned[inCors];
                          if (correctors) {

                            const name = correctors.corrector_id.last_name + ' ' + correctors.corrector_id.first_name;
                            if (
                              !this.testCorrectionForm
                                .get('correction_grid')
                                .get('header')
                                .get('fields')
                                .get(inFoot.toString())
                                .get('value').value
                            ) {
                              if (foot.data_type !== 'checkbox') {
                                this.testCorrectionForm
                                  .get('correction_grid')
                                  .get('header')
                                  .get('fields')
                                  .get(inFoot.toString())
                                  .get('value')
                                  .patchValue(name);
                              }
                            }
                          }
                        }
                      }
                    });
                  }
                }
              }
            });
          } else {
            this.testData.corrector_assigned.forEach((corr, inCor) => {
              if (corr.test_groups && corr.test_groups.length) {
                const groups = corr.test_groups.find((test) => test._id === this.selectedGroupData._id);
                if (groups) {
                  const corrector = this.testData.corrector_assigned[inCor];
                  if (corrector) {

                    const name = corrector.corrector_id.last_name + ' ' + corrector.corrector_id.first_name;
                    if (
                      !this.testCorrectionForm.get('correction_grid').get('header').get('fields').get(inFoot.toString()).get('value').value
                    ) {
                      if (foot.data_type !== 'checkbox') {
                        this.testCorrectionForm
                          .get('correction_grid')
                          .get('header')
                          .get('fields')
                          .get(inFoot.toString())
                          .get('value')
                          .patchValue(name);
                      }
                    }
                  }
                }
              }
            });
          }
        }
      });
    }
  }

  getCorrectorForGroupStudent() {
    const payload = _.cloneDeep(this.testCorrectionForm.value);
    const header = _.cloneDeep(this.testCorrectionForm.get('correction_grid').get('header').get('fields').value);
    if (header && header.length) {
      header.forEach((foot, inFoot) => {
        if (foot.type === 'correctername') {
          if (this.testData.corrector_assigned_for_final_retake && this.testData.corrector_assigned_for_final_retake.length) {
            this.testData.corrector_assigned_for_final_retake.forEach((corr, inCor) => {
              if (corr.test_groups && corr.test_groups.length) {
                const group = corr.test_groups.find((test) => test._id === this.selectedGroupData._id);

                if (group && group.students && group.students.length) {
                  const student = group.students.find((test) => test.student_id._id === this.studentSelectDetail._id);

                  if (student) {
                    const corrector = this.testData.corrector_assigned_for_final_retake[inCor];

                    if (corrector) {
                      const name = corrector.corrector_id.last_name + ' ' + corrector.corrector_id.first_name;
                      if (
                        !this.testCorrectionForm.get('correction_grid').get('header').get('fields').get(inFoot.toString()).get('value')
                          .value
                      ) {
                        if (foot.data_type !== 'checkbox') {
                          this.testCorrectionForm
                            .get('correction_grid')
                            .get('header')
                            .get('fields')
                            .get(inFoot.toString())
                            .get('value')
                            .patchValue(name);
                        }
                      }
                    }
                  } else {
                    this.testData.corrector_assigned.forEach((corrs, inCors) => {
                      if (corrs.test_groups && corrs.test_groups.length) {
                        const groups = corrs.test_groups.find((test) => test._id === this.selectedGroupData._id);

                        if (groups && group.students && group.students.length) {
                          const students = group.students.find((test) => test.student_id._id === this.studentSelectDetail._id);

                          if (students) {
                            const correctors = this.testData.corrector_assigned[inCors];

                            if (correctors) {
                              const name = correctors.corrector_id.last_name + ' ' + correctors.corrector_id.first_name;
                              if (
                                !this.testCorrectionForm
                                  .get('correction_grid')
                                  .get('header')
                                  .get('fields')
                                  .get(inFoot.toString())
                                  .get('value').value
                              ) {
                                if (foot.data_type !== 'checkbox') {
                                  this.testCorrectionForm
                                    .get('correction_grid')
                                    .get('header')
                                    .get('fields')
                                    .get(inFoot.toString())
                                    .get('value')
                                    .patchValue(name);
                                }
                              }
                            }
                          }
                        }
                      }
                    });
                  }
                }
              }
            });
          } else {
            this.testData.corrector_assigned.forEach((corr, inCor) => {
              if (corr.test_groups && corr.test_groups.length) {
                const group = corr.test_groups.find((test) => test._id === this.selectedGroupData._id);

                if (group && group.students && group.students.length) {
                  const student = group.students.find((test) => test.student_id._id === this.studentSelectDetail._id);

                  if (student) {
                    const corrector = this.testData.corrector_assigned[inCor];

                    if (corrector) {
                      const name = corrector.corrector_id.last_name + ' ' + corrector.corrector_id.first_name;
                      if (
                        !this.testCorrectionForm.get('correction_grid').get('header').get('fields').get(inFoot.toString()).get('value')
                          .value
                      ) {
                        if (foot.data_type !== 'checkbox') {
                          this.testCorrectionForm
                            .get('correction_grid')
                            .get('header')
                            .get('fields')
                            .get(inFoot.toString())
                            .get('value')
                            .patchValue(name);
                        }
                      }
                    }
                  }
                }
              }
            });
          }
        }
      });
    }
  }

  getHeaderFieldsFormArray(): UntypedFormArray {
    return this.testCorrectionForm.get('correction_grid').get('header').get('fields') as UntypedFormArray;
  }
  getHeaderFieldsFromTest() {
    return this.testData.correction_grid.header.fields;
  }
}
