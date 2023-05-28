import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { SubSink } from 'subsink';
import { UntypedFormArray, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { TestCorrectionService } from 'app/service/test-correction/test-correction.service';
import * as _ from 'lodash';
import swal from 'sweetalert2';
import Swal from 'sweetalert2';
import { ParseUtcToLocalPipe } from 'app/shared/pipes/parse-utc-to-local.pipe';
import { TestCreationRespData } from 'app/test/test-creation/test-creation.model';
import { TranslateService } from '@ngx-translate/core';
import { JustificationReasonDialogComponent } from '../justification-reason-dialog/justification-reason-dialog.component';
import { ParseLocalToUtcPipe } from 'app/shared/pipes/parse-local-to-utc.pipe';
import { environment } from 'environments/environment';

@Component({
  selector: 'ms-student-list',
  templateUrl: './student-list.component.html',
  styleUrls: ['./student-list.component.scss'],
  providers: [ParseLocalToUtcPipe, ParseUtcToLocalPipe],
})
export class StudentListComponent implements OnInit, OnChanges, OnDestroy {
  @Input() filteredStudentList: any[];
  @Input() testCorrectionForm: UntypedFormGroup;
  @Input() testData: TestCreationRespData;
  @Input() taskData: any;
  @Input() titleData: any;
  @Input() isTaskValidateTest: boolean;
  @Input() containerHeight: number;
  @Input() firstForm: any;
  @Input() selectedStudenId: any;

  @Output() studentSelected = new EventEmitter<any>();
  @Output() missingCopyDocument = new EventEmitter<any>();
  @Output() elementOfProofDocument = new EventEmitter<any>();
  @Output() formUpdated = new EventEmitter<any>();
  @Output() dataUpdated = new EventEmitter<any>();
  @Output() updateJustification = new EventEmitter<string>();
  @Output() updateMultipleDateFormArray = new EventEmitter<any[]>();
  @Output() refreshMultipleDateNotationGrid = new EventEmitter<boolean>();
  @Output() refreshJuryNotationGrid = new EventEmitter<boolean>();
  dataSource = new MatTableDataSource([]);
  // displayedColumns: string[] = ['studentName', 'doc', 'score'];
  // filterColumns: string[] = ['studentNameFilter', 'docFilter', 'scoreFilter'];
  displayedColumns: string[] = [];
  filterColumns: string[] = [];
  isWaitingForResponse = false;
  documentData: any;
  correctLength: any;
  studentLength: any;
  studentNameFilter = new UntypedFormControl('');
  filteredValues = {
    studentName: '',
  };
  private subs = new SubSink();

  constructor(
    private testCorrectionService: TestCorrectionService,
    private parseUTCtoLocal: ParseUtcToLocalPipe,
    public dialog: MatDialog,
    private translate: TranslateService,
    private parseLocaltoUTC: ParseLocalToUtcPipe,
  ) {}

  ngOnInit() {

    if (this.filteredStudentList) {
      this.addTableColumn();
      this.isWaitingForResponse = true;
      this.filteredStudentList = _.orderBy(this.filteredStudentList, ['last_name'], ['asc']);
      this.filteredStudentList = this.filteredStudentList.sort((a, b) => {
        return a.last_name.toLowerCase().localeCompare(b.last_name.toLowerCase());
      });
      this.dataSource.data = this.filteredStudentList;
    }
    this.isWaitingForResponse = false;
    this.filter();
    this.dataSource.filterPredicate = this.customFilterPredicate();
    this.countStudentData();
  }

  addTableColumn() {
    this.filterColumns.push('studentNameFilter');
    this.displayedColumns.push('studentName');
    this.filterColumns.push('statusFilter');
    this.displayedColumns.push('status');
    // *************** if there is document expected for each student, show doc column
    if (this.checkTestDocumentExpected()) {
      this.displayedColumns.push('doc');
      this.filterColumns.push('docFilter');
    }
    // *************** if nomal evaluation type or mark type number, show score column
    if (
      this.testData.block_type !== 'competence' &&
      this.testData.block_type !== 'soft_skill' &&
      this.testData.correction_grid.correction.show_number_marks_column
    ) {
      this.filterColumns.push('scoreFilter');
      this.displayedColumns.push('score');
    } else if (this.testData.type === 'free_continuous_control') {
      this.filterColumns.push('scoreFilter');
      this.displayedColumns.push('score');
    }
    // *************** if nomal evaluation type or mark type number, show score column
  }

  checkTestDocumentExpected(): boolean {
    let result = false;

    // display the column when the test has expected_documents
    if (this.testData && this.testData.expected_documents && this.testData.expected_documents.length) {
      for (const expected_document of this.testData.expected_documents) {
        if (
          (expected_document && expected_document.is_for_all_student) ||
          (expected_document && expected_document.is_for_all_group) ||
          (expected_document.document_user_type && expected_document.document_user_type.name === 'Student')
        ) {
          result = true;
          break;
        }
      }
    }
    // if there is any student has missing copy, display the column
    // const isMissingCopyExist = this.filteredStudentList.find((student) => student.missing_copy);
    // if (isMissingCopyExist && this.isTaskValidateTest && this.testData.type !== 'free_continuous_control') {
    //   result = true;
    // }
    return result;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes && changes.filteredStudentList) {
      this.filteredStudentList = changes.filteredStudentList.currentValue;
      this.filteredStudentList = _.orderBy(this.filteredStudentList, ['last_name'], ['asc']);
      this.filteredStudentList = this.filteredStudentList.sort((a, b) => {
        return a.last_name.toLowerCase().localeCompare(b.last_name.toLowerCase());
      });

      this.dataSource.data = this.filteredStudentList;
      this.filter();
      this.dataSource.filterPredicate = this.customFilterPredicate();
      this.countStudentData();
    }
  }

  countStudentData() {
    this.correctLength = 0;
    this.studentLength = this.filteredStudentList.length;
    this.filteredStudentList.forEach((student) => {
      if (student && !student.missing_copy && student.score !== null) {
        this.correctLength++;
      } else if (student && student.missing_copy && student.is_justified) {
        this.correctLength++;
      }
    });
  }

  customFilterPredicate() {
    return function (data, filter: string): boolean {
      const searchString = JSON.parse(filter);
      const nameFound = searchString.studentName
        ? data.last_name.toString().trim().toLowerCase().indexOf(searchString.studentName.toLowerCase()) !== -1
        : true;

      return nameFound;
    };
  }

  getSectionHeight() {
    // to make style looks good and not overflow, we decrease the heigh by 10
    const height = this.containerHeight - 10;
    return height;
  }

  filter() {
    this.subs.sink = this.studentNameFilter.valueChanges.subscribe((studentName) => {
      this.filteredValues['studentName'] = studentName;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });
  }

  selectStudent(data) {

    const lastForm = _.cloneDeep(this.testCorrectionForm.value);
    const isNotChanged = _.isEqual(this.firstForm, lastForm);




    if (data && !isNotChanged) {
      Swal.fire({
        type: 'warning',
        title: this.translate.instant('TMTC_S01.TITLE'),
        text: this.translate.instant('TMTC_S01.TEXT'),
        confirmButtonText: this.translate.instant('TMTC_S01.BUTTON_1'),
        showCancelButton: true,
        cancelButtonText: this.translate.instant('TMTC_S01.BUTTON_2'),
        allowEscapeKey: false,
        allowOutsideClick: false,
      }).then((result) => {
        if (result.dismiss) {
          this.selectStudentEmitter(data);
        }
      });
    } else {
      this.selectStudentEmitter(data);
    }
  }

  selectStudentEmitter(data) {
    this.refreshJuryNotationGrid.emit(true);
    if (data.testCorrectionId) {
      // get real data for edit
      this.refreshMultipleDateNotationGrid.emit(true);
      this.subs.sink = this.testCorrectionService.getTestCorrection(data.testCorrectionId).subscribe((resp) => {
        const patchData = this.formatDataBeforePatch(_.cloneDeep(resp));
        this.dataUpdated.emit(patchData);
        this.refreshMultipleDateNotationGrid.emit(false);
        this.refreshJuryNotationGrid.emit(false);

      });
    } else {
      setTimeout(() => this.refreshJuryNotationGrid.emit(false), 50);
    }
    this.studentSelected.emit(data);
  }

  formatDataBeforePatch(data) {
    // Change header value
    if (
      data &&
      data.correction_grid &&
      data.correction_grid.header &&
      data.correction_grid.header.fields &&
      data.correction_grid.header.fields.length
    ) {
      data.correction_grid.header.fields.forEach((header_field) => {
        if (header_field && header_field.type) {
          // const tempValue = header_field.value;
          switch (header_field.type) {
            case 'date':

              header_field.value = this.parseUTCtoLocal.transformDateToJavascriptDate(
                header_field.value.date.date,
                header_field.value.date.time,
              );
              break;
            case 'text':
              header_field.value = header_field.value.text;
              break;
            case 'number':
              header_field.value = header_field.value.number;
              break;
            case 'pfereferal':
              header_field.value = header_field.value.pfereferal;
              break;
            case 'jurymember':
              header_field.value = header_field.value.jury_member;
              break;
            case 'longtext':
              header_field.value = header_field.value.long_text;
              break;
            case 'signature':
              header_field.value = header_field.value.signature;
              break;
            case 'correctername':
              header_field.value = header_field.value.correcter_name;
              break;
            case 'mentorname':
              header_field.value = header_field.value.mentor_name;
              break;
            default:
              break;
          }
        }
      });
    }

    // Change footer value
    if (
      data &&
      data.correction_grid &&
      data.correction_grid.footer &&
      data.correction_grid.footer.fields &&
      data.correction_grid.footer.fields.length
    ) {
      data.correction_grid.footer.fields.forEach((footer_field) => {
        if (footer_field && !footer_field.data_type) {
          footer_field.data_type = 'text';
        }
        if (footer_field && footer_field.type) {
          // const tempValue = footer_field.value;
          switch (footer_field.type) {
            case 'date':

              footer_field.value = this.parseUTCtoLocal.transformDateToJavascriptDate(
                footer_field.value.date.date,
                footer_field.value.date.time,
              );
              break;
            case 'text':
              footer_field.value = footer_field.value.text;
              break;
            case 'number':
              footer_field.value = footer_field.value.number;
              break;
            case 'pfereferal':
              footer_field.value = footer_field.value.pfereferal;
              break;
            case 'jurymember':
              footer_field.value = footer_field.value.jury_member;
              break;
            case 'longtext':
              footer_field.value = footer_field.value.long_text;
              break;
            case 'signature':
              footer_field.value = footer_field.value.signature;
              break;
            case 'correctername':
              footer_field.value = footer_field.value.correcter_name;
              break;
            case 'mentorname':
              footer_field.value = footer_field.value.mentor_name;
              break;
            default:
              break;
          }
        }
      });
    }

    if (data.test && data.test._id) {
      data.test = data.test._id;
    }

    if (data.corrector && data.corrector._id) {
      data.corrector = data.corrector._id;
    } else {
      delete data.corrector;
    }

    if (data.student && data.student._id) {
      data.student = data.student._id;
    }

    if (data.school_id && data.school_id._id) {
      data.school_id = data.school_id._id;
    }

    if (data && data.expected_documents && data.expected_documents.length) {
      data.expected_documents.forEach((doc) => {
        if (doc && doc.document && doc.document._id) {
          doc.document = doc.document._id;
        }
      });
    }

    if (data && data.document_for_missing_copy && data.document_for_missing_copy.length) {
      this.missingCopyDocument.emit(data.document_for_missing_copy[0]);
      data.document_for_missing_copy = data.document_for_missing_copy.map((mc) => mc._id);
    }

    if (data && data.element_of_proof_doc && data.element_of_proof_doc._id) {
      this.elementOfProofDocument.emit(data.element_of_proof_doc);
      data.element_of_proof_doc = data.element_of_proof_doc._id;
    }

    if (
      data &&
      data.correction_grid &&
      data.correction_grid.correction &&
      data.correction_grid.correction.sections &&
      data.correction_grid.correction.sections.length
    ) {
      data.correction_grid.correction.sections.forEach((section) => {
        section.sub_sections.forEach((subsec) => {
          // remove directions from test correction data if it's empty
          if (!subsec.directions) {
            delete subsec.directions;
          }
        });
      });
    }

    if (
      data &&
      data.correction_grid &&
      data.correction_grid.correction.sections_evalskill &&
      data.correction_grid.correction.sections_evalskill.length
    ) {
      data.correction_grid.correction.sections_evalskill.forEach((sec, secIndex) => {
        if (sec && sec.academic_skill_competence_template_id && sec.academic_skill_competence_template_id._id) {
          sec.academic_skill_competence_template_id = sec.academic_skill_competence_template_id._id;
        }
        if (sec && sec.soft_skill_competence_template_id && sec.soft_skill_competence_template_id._id) {
          sec.soft_skill_competence_template_id = sec.soft_skill_competence_template_id._id;
        }
        if (sec && sec.academic_skill_block_template_id && sec.academic_skill_block_template_id._id) {
          sec.academic_skill_block_template_id = sec.academic_skill_block_template_id._id;
        }
        if (sec && sec.soft_skill_block_template_id && sec.soft_skill_block_template_id._id) {
          sec.soft_skill_block_template_id = sec.soft_skill_block_template_id._id;
        }
        sec.sub_sections.forEach((subsec, subsecIndex) => {
          if (
            subsec &&
            subsec.academic_skill_criteria_of_evaluation_competence_id &&
            subsec.academic_skill_criteria_of_evaluation_competence_id._id
          ) {
            subsec.academic_skill_criteria_of_evaluation_competence_id = subsec.academic_skill_criteria_of_evaluation_competence_id._id;
          }
          if (
            subsec &&
            subsec.soft_skill_criteria_of_evaluation_competence_id &&
            subsec.soft_skill_criteria_of_evaluation_competence_id._id
          ) {
            subsec.soft_skill_criteria_of_evaluation_competence_id = subsec.soft_skill_criteria_of_evaluation_competence_id._id;
          }
          if (subsec && subsec.academic_skill_competence_template_id && subsec.academic_skill_competence_template_id._id) {
            subsec.academic_skill_competence_template_id = subsec.academic_skill_competence_template_id._id;
          }
          if (subsec && subsec.soft_skill_competence_template_id && subsec.soft_skill_competence_template_id._id) {
            subsec.soft_skill_competence_template_id = subsec.soft_skill_competence_template_id._id;
          }
          if (subsec.is_criteria_evaluated === null) {
            delete subsec.is_criteria_evaluated;
          }
          if (subsec && subsec.multiple_dates && subsec.multiple_dates.length) {
            const lastDateIndex = subsec.multiple_dates.length - 1;
            if (
              this.taskData &&
              this.taskData.due_date &&
              this.taskData.due_date.date &&
              this.taskData.due_date.date !== subsec.multiple_dates[lastDateIndex].date &&
              !this.isTaskValidateTest
            ) {
              subsec.multiple_dates.push({
                date: this.taskData.due_date.date,
                marks: null,
                observation: '',
                score_conversion_id: '',
              });
              this.getSubSectionEvalskillForm(secIndex).at(subsecIndex).get('rating').clearValidators();
              this.getSubSectionEvalskillForm(secIndex).at(subsecIndex).get('rating').updateValueAndValidity();
            }
            // sort from latest date to earliest date so user can easier to access the field and inputting mark
            subsec.multiple_dates = subsec.multiple_dates.reverse();
            this.updateMultipleDateFormArray.emit(subsec.multiple_dates);
          }
        });
      });
    }

    return data;
  }

  getSubSectionEvalskillForm(sectionIndex: number) {
    return this.getSectionEvalskillForm().at(sectionIndex).get('sub_sections') as UntypedFormArray;
  }

  getSectionEvalskillForm() {
    return this.getCorrectionForm().get('sections_evalskill') as UntypedFormArray;
  }

  getCorrectionForm() {
    return this.testCorrectionForm.get('correction_grid').get('correction') as UntypedFormGroup;
  }

  isMissingCopy(dataStudent) {
    let result = false;
    if (dataStudent && dataStudent.missing_copy && !dataStudent.is_justified) {
      result = true;
    } else {
      result = false;
    }
    return result;
  }

  openJustify(dataStudent) {
    if (this.isTaskValidateTest) {
      if (dataStudent && dataStudent.missing_copy && !dataStudent.is_justified) {
        swal
          .fire({
            type: 'warning',
            title: this.translate.instant('TESTCORRECTIONS.MESSAGE.MISSINGCOPY-VALIDATE-TITLE'),
            html: this.translate.instant('TESTCORRECTIONS.MESSAGE.MISSINGCOPY-VALIDATE-TEXT'),
            confirmButtonText: this.translate.instant('TESTCORRECTIONS.MESSAGE.MISSINGCOPY-VALIDATE-YES'),
            cancelButtonText: this.translate.instant('TESTCORRECTIONS.MESSAGE.MISSINGCOPY-VALIDATE-NO'),
            showCancelButton: true,
          })
          .then((result) => {

            if (result && result.value) {
              this.dialog
                .open(JustificationReasonDialogComponent, {
                  width: '600px',
                  minHeight: '100px',
                  panelClass: 'certification-rule-pop-up',
                  disableClose: true,
                  data: {
                    rncp: this.titleData,
                    test: this.testData,
                    student: dataStudent,
                  },
                })
                .afterClosed()
                .subscribe((response) => {

                  if (response) {
                    this.subs.sink = this.testCorrectionService.getTestCorrection(dataStudent.testCorrectionId).subscribe((resp) => {
                      const patchData = this.formatDataBeforePatch(_.cloneDeep(resp));
                      patchData.is_justified = 'yes';
                      patchData.reason_for_missing_copy = response.reason_for_missing_copy;
                      patchData.document_for_missing_copy = response.document_for_missing_copy;
                      const temp = this.formatHeaderFooterPayload(patchData);
                      delete temp._id;

                      this.subs.sink = this.testCorrectionService
                        .updateJustifyTestCorrection(dataStudent.testCorrectionId, temp)
                        .subscribe((response2) => {
                          this.formUpdated.emit(patchData);
                          this.updateJustification.emit('student');
                        });
                    });
                  }
                });
            } else if (result && result.dismiss === swal.DismissReason.cancel) {
              // set justify to be false
              this.subs.sink = this.testCorrectionService.getTestCorrection(dataStudent.testCorrectionId).subscribe((resp) => {
                const patchData = this.formatDataBeforePatch(_.cloneDeep(resp));
                patchData.is_justified = 'no';
                const temp = this.formatHeaderFooterPayload(patchData);
                delete temp._id;

                this.subs.sink = this.testCorrectionService
                  .updateJustifyTestCorrection(dataStudent.testCorrectionId, temp)
                  .subscribe((response) => {
                    this.formUpdated.emit(patchData);
                    this.updateJustification.emit('student');
                  });
              });
            }
          });
      }
    }
  }

  formatHeaderFooterPayload(patchData): any {
    const data = _.cloneDeep(patchData);
    // Change header value
    if (
      data &&
      data.correction_grid &&
      data.correction_grid.header &&
      data.correction_grid.header.fields &&
      data.correction_grid.header.fields.length
    ) {
      data.correction_grid.header.fields.forEach((header_field) => {
        if (header_field && header_field.type) {
          const tempValue = header_field.value;

          switch (header_field.type) {
            case 'date':
              header_field.value = {
                date: this.parseLocaltoUTC.transformJavascriptDate(header_field.value),
              };
              break;
            case 'text':
              header_field.value = {
                text: tempValue,
              };
              break;
            case 'number':
              header_field.value = {
                number: +tempValue,
              };
              break;
            case 'pfereferal':
              header_field.value = {
                pfereferal: tempValue,
              };
              break;
            case 'jurymember':
              header_field.value = {
                jury_member: tempValue,
              };
              break;
            case 'longtext':
              header_field.value = {
                long_text: tempValue,
              };
              break;
            case 'signature':
              header_field.value = {
                signature: tempValue,
              };
              break;
            case 'correctername':
              header_field.value = {
                correcter_name: tempValue,
              };
              break;
            case 'mentorname':
              header_field.value = {
                mentor_name: tempValue,
              };
              break;
            default:
              break;
          }
        }
      });
    }
    // Change footer value
    if (
      data &&
      data.correction_grid &&
      data.correction_grid.footer &&
      data.correction_grid.footer.fields &&
      data.correction_grid.footer.fields.length
    ) {
      data.correction_grid.footer.fields.forEach((footer_field) => {
        if (footer_field && footer_field.type) {
          const tempValue = footer_field.value;

          switch (footer_field.type) {
            case 'date':
              footer_field.value = {
                date: this.parseLocaltoUTC.transformJavascriptDate(footer_field.value),
              };
              break;
            case 'text':
              footer_field.value = {
                text: tempValue,
              };
              break;
            case 'number':
              footer_field.value = {
                number: +tempValue,
              };
              break;
            case 'pfereferal':
              footer_field.value = {
                pfereferal: tempValue,
              };
              break;
            case 'jurymember':
              footer_field.value = {
                jury_member: tempValue,
              };
              break;
            case 'longtext':
              footer_field.value = {
                long_text: tempValue,
              };
              break;
            case 'signature':
              footer_field.value = {
                signature: tempValue,
              };
              break;
            case 'correctername':
              footer_field.value = {
                correcter_name: tempValue,
              };
              break;
            case 'mentorname':
              footer_field.value = {
                mentor_name: tempValue,
              };
              break;
            default:
              break;
          }
        }
      });
    }
    return data;
  }

  downloadDocExpected(documents: any[], studentId: string) {
    const multiDoc = documents.filter((resp) => {
      return resp.validation_status === 'validated' || resp.validation_status === 'uploaded';
    });

    if (multiDoc && multiDoc.length && multiDoc.length === 1) {
      const doc = _.cloneDeep(multiDoc[0]);
      const url = `${environment.apiUrl}/fileuploads/${doc.document.s3_file_name}?download=true`.replace('/graphql', '');
      const element = document.createElement('a');
      element.href = url;
      element.target = '_blank';
      element.setAttribute('download', doc.document_name);
      element.click();
    } else if (multiDoc && multiDoc.length && multiDoc.length > 1) {
      // implement download multiple doc as zip
      const expectedDocs = [];
      if (multiDoc && multiDoc.length) {
        multiDoc.forEach((doc) => {
          if (doc && doc.document && doc.document._id) {
            expectedDocs.push(doc.document._id);
          }
        });
      }
      this.subs.sink = this.testCorrectionService.downloadMultipleDocumentsAsZip(expectedDocs, studentId).subscribe((resp) => {
        const url = `${environment.apiUrl}/fileuploads/${resp.pathName}?download=true`.replace('/graphql', '');
        const element = document.createElement('a');
        element.href = url;
        element.target = '_blank';
        element.setAttribute('download', resp.pathName);
        element.click();
      });
    }
  }

  getDocExpected(id) {
    if (id) {
      this.subs.sink = this.testCorrectionService.getDocExpectedByTestCorrection(id).subscribe((resp) => {

      });
    }
  }

  isAllDocRejected(docs) {
    const temp = _.cloneDeep(docs);
    return temp.find((doc) => doc.validation_status !== 'rejected');
  }

  isAllHaveMark(element) {
    let isAllHaveMark = true;
    if (
      element &&
      element.correctionGrid &&
      element.correctionGrid.correction &&
      element.correctionGrid.correction.sections_evalskill &&
      element.correctionGrid.correction.sections_evalskill.length
    ) {
      let arraySub = [];
      element.correctionGrid.correction.sections_evalskill.forEach((secEval) => {
        arraySub = arraySub.concat(secEval.sub_sections);
      });
      const dataMarkNull = arraySub.filter((sub) => (sub.rating === null || sub.rating === undefined) && sub.is_criteria_evaluated);
      if (dataMarkNull && dataMarkNull.length) {
        isAllHaveMark = false;
      } else {
        isAllHaveMark = true;
      }
    }
    return isAllHaveMark;
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
