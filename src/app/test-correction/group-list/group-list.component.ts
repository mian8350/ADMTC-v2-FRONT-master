import { Component, OnInit, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { UntypedFormGroup } from '@angular/forms';
import { TestCreationRespData } from 'app/test/test-creation/test-creation.model';
import { ParseUtcToLocalPipe } from 'app/shared/pipes/parse-utc-to-local.pipe';
import { TestCorrectionService } from 'app/service/test-correction/test-correction.service';
import * as _ from 'lodash';
import swal from 'sweetalert2';
import { TranslateService } from '@ngx-translate/core';
import { JustificationReasonDialogComponent } from '../justification-reason-dialog/justification-reason-dialog.component';
import { SubSink } from 'subsink';
import { ParseLocalToUtcPipe } from 'app/shared/pipes/parse-local-to-utc.pipe';
import { environment } from 'environments/environment';

@Component({
  selector: 'ms-group-list',
  templateUrl: './group-list.component.html',
  styleUrls: ['./group-list.component.scss'],
  providers: [ParseLocalToUtcPipe, ParseUtcToLocalPipe],
})
export class GroupListComponent implements OnInit, OnChanges {
  private subs = new SubSink();
  @Input() filteredGroupList: any[];
  @Input() filteredStudentList: any[];
  @Input() groupTestCorrectionId: any;
  @Input() testCorrectionForm: UntypedFormGroup;
  @Input() testData: TestCreationRespData;
  @Input() taskData: any;
  @Input() titleData: any;
  @Input() groupList: any[];
  @Input() groupSelect: any;
  @Input() dataFilledStudentOfAllGroupList: any[];
  @Input() isTaskValidateTest: boolean;
  @Input() containerHeight: number;

  @Output() studentSelected = new EventEmitter<any>();
  @Output() missingCopyDocument = new EventEmitter<any>();
  @Output() elementOfProofDocument = new EventEmitter<any>();
  @Output() groupSelected = new EventEmitter<any>();
  @Output() formUpdated = new EventEmitter<any>();
  @Output() dataUpdated = new EventEmitter<any>();
  @Output() updateJustification = new EventEmitter<string>();

  groupDataSource = new MatTableDataSource([]);
  studentDataSource = new MatTableDataSource([]);
  groupDisplayedColumns: string[] = [];
  studentDisplayedColumns: string[] = [];
  isWaitingForResponse = false;
  isWaitingForGroup = false;
  documentData: any;
  correctLength: any;
  studentLength: any;
  groupCorrectLength: any;
  isClickable = false;

  selectedGroup;

  constructor(
    private testCorrectionService: TestCorrectionService,
    private parseUTCtoLocal: ParseUtcToLocalPipe,
    public dialog: MatDialog,
    private translate: TranslateService,
    private parseLocaltoUTC: ParseLocalToUtcPipe,
  ) {}

  ngOnInit() {

    if (this.filteredGroupList) {
      this.addTableColumn();
      this.isWaitingForGroup = true;
      this.filteredGroupList = _.orderBy(this.filteredGroupList, ['name'], ['asc']);
      this.filteredGroupList = this.filteredGroupList.sort((a, b) => {
        return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
      });
      this.groupDataSource.data = this.filteredGroupList;
      this.isWaitingForGroup = false;
    }
    if (this.filteredStudentList) {
      this.isWaitingForResponse = true;
      this.filteredStudentList = _.orderBy(this.filteredStudentList, ['last_name'], ['asc']);
      this.filteredStudentList = this.filteredStudentList.sort((a, b) => {
        return a.last_name.toLowerCase().localeCompare(b.last_name.toLowerCase());
      });
      this.studentDataSource.data = this.filteredStudentList;
      this.isWaitingForResponse = false;
    }
  }

  getSectionHeight() {
    // minus 75 because there is content other than group table and student table,
    // so to make style looks good and not overflow, we decrease the heigh by 75
    const height = this.containerHeight - 75;
    return height / 2;
  }

  addTableColumn() {
    this.groupDisplayedColumns.push('groupName');
    this.studentDisplayedColumns.push('studentName');
    this.groupDisplayedColumns.push('groupStatus');
    this.studentDisplayedColumns.push('studentStatus');
    // *************** if there is document expected for each group/student, show doc column
    if (this.checkTestDocumentExpected()) {
      this.groupDisplayedColumns.push('doc');
      this.studentDisplayedColumns.push('studentDoc');
    }
    // *************** if nomal evaluation type or mark type number, show score column
    if (
      this.testData.block_type !== 'competence' &&
      this.testData.block_type !== 'soft_skill' &&
      this.testData.correction_grid.correction.show_number_marks_column
    ) {
      this.groupDisplayedColumns.push('score');
      this.studentDisplayedColumns.push('studentScore');
    } else if (this.testData.type === 'free_continuous_control') {
      this.groupDisplayedColumns.push('score');
      this.studentDisplayedColumns.push('studentScore');
    }
  }

  checkTestDocumentExpected(): boolean {
    let result = false;
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
    return result;
  }

  ngOnChanges() {



    if (this.filteredGroupList) {
      this.isWaitingForGroup = true;
      this.filteredGroupList = _.orderBy(this.filteredGroupList, ['name'], ['asc']);
      this.filteredGroupList = this.filteredGroupList.sort((a, b) => {
        return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
      });
      this.groupDataSource.data = this.filteredGroupList;
      this.countGroupData();
      this.isWaitingForGroup = false;
    }

    if (this.filteredStudentList) {
      this.isWaitingForResponse = true;
      this.filteredStudentList = _.orderBy(this.filteredStudentList, ['last_name'], ['asc']);
      this.filteredStudentList = this.filteredStudentList.sort((a, b) => {
        return a.last_name.toLowerCase().localeCompare(b.last_name.toLowerCase());
      });
      this.studentDataSource.data = this.filteredStudentList;
      this.countStudentData();
      this.isWaitingForResponse = false;
    }
  }

  selectStudent(data) {
    const validation = this.validateSelectStudentScore(data);

    if (data && validation) {
      if (data.testCorrectionId) {
        // get real data for edit
        this.testCorrectionService.getTestCorrection(data.testCorrectionId).subscribe((resp) => {
          const patchData = this.formatDataBeforePatch(_.cloneDeep(resp));
          // this.formUpdated.emit(this.testData);
          this.dataUpdated.emit(patchData);
        });
      } else {
        this.testCorrectionForm.get('student').patchValue(data._id);
      }
      this.studentSelected.emit(data);
    }
  }

  selectGroup(data) {

    this.selectedGroup = data;
    this.groupSelected.emit(data);
  }

  countStudentData() {
    this.correctLength = 0;
    if (this.filteredStudentList && this.filteredStudentList.length) {
      this.studentLength = this.filteredStudentList.length;
    }
    this.filteredStudentList.forEach((student) => {
      if (student && !student.missing_copy && student.score !== null) {
        this.correctLength++;
      } else if (student && student.missing_copy && student.is_justified) {
        this.correctLength++;
      }
    });
  }

  countGroupData() {
    this.groupCorrectLength = 0;
    this.filteredGroupList.forEach((groupData) => {
      if (groupData && !groupData.missing_copy && groupData.score !== null) {
        this.groupCorrectLength++;
      } else if (groupData && groupData.missing_copy && groupData.is_justified) {
        this.groupCorrectLength++;
      }
    });
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
            // case 'groupname':
            //   header_field.value = header_field.value.group_name;
            //   break;
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
            // case 'groupname':
            //   footer_field.value = footer_field.value.group_name;
            //   break;
            default:
              break;
          }
        }
      });
    }

    if (data.test && data.test._id) {
      data.test = data.test._id;
    }

    if (data.test_group_id && data.test_group_id._id) {
      data.test_group_id = data.test_group_id._id;
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
      data.correction_grid.correction.sections_evalskill.forEach((sec) => {
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
        sec.sub_sections.forEach((subsec) => {
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
        });
      });
    }

    return data;
  }

  formatDataBeforeJustify(data) {
    if (data) {
      if (data.test && data.test._id) {
        data.test = data.test._id;
      }

      if (data.test_group_id && data.test_group_id._id) {
        data.test_group_id = data.test_group_id._id;
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
    }
    return data;
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

  openJustifyGroup(dataGroup) {
    if (this.isTaskValidateTest) {
      if (dataGroup && dataGroup.missing_copy && !dataGroup.is_justified) {
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
                    student: null,
                    group: dataGroup,
                  },
                })
                .afterClosed()
                .subscribe((response) => {
                  if (response) {
                    this.testCorrectionService.getOneGroupTestCorrection(dataGroup.groupTestCorrectionId).subscribe((resp) => {
                      const patchData = this.formatDataBeforePatch(_.cloneDeep(resp));
                      // const temp = _.cloneDeep(patchData);
                      patchData.is_justified = 'yes';
                      patchData.reason_for_missing_copy = response.reason_for_missing_copy;
                      patchData.document_for_missing_copy = response.document_for_missing_copy;
                      const temp = this.formatHeaderFooterPayload(patchData);
                      delete temp._id;

                      this.testCorrectionService.updateGroupTestCorrection(dataGroup.groupTestCorrectionId, temp).subscribe((responsee) => {
                        this.formUpdated.emit(patchData);
                        this.updateJustification.emit('group');
                      });
                    });
                  }
                });
            } else if (result && result.dismiss === swal.DismissReason.cancel) {
              // set justify to be false
              this.testCorrectionService.getOneGroupTestCorrection(dataGroup.groupTestCorrectionId).subscribe((resp) => {
                const patchData = this.formatDataBeforePatch(_.cloneDeep(resp));
                patchData.is_justified = 'no';
                const temp = this.formatHeaderFooterPayload(patchData);
                delete temp._id;

                this.testCorrectionService.updateGroupTestCorrection(dataGroup.groupTestCorrectionId, temp).subscribe((response) => {
                  this.formUpdated.emit(patchData);
                  this.updateJustification.emit('group');
                });
              });
            }
          });
      }
    }
  }

  openJustify(dataStudent) {
    const groupData = _.find(this.filteredGroupList, (group) => group.name === this.groupSelect);
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
                    this.testCorrectionService.getTestCorrection(dataStudent.testCorrectionId).subscribe((resp) => {
                      const patchData = this.formatDataBeforePatch(_.cloneDeep(resp));
                      patchData.is_justified = 'yes';
                      patchData.reason_for_missing_copy = response.reason_for_missing_copy;
                      patchData.document_for_missing_copy = response.document_for_missing_copy;
                      const realData = this.formatDataBeforeJustify(_.cloneDeep(patchData));
                      delete realData._id;
                      this.testCorrectionService
                        .updateJustifyTestCorrection(dataStudent.testCorrectionId, realData)
                        .subscribe((response2) => {
                          this.formUpdated.emit(patchData);
                          this.selectGroup(groupData);
                        });
                    });
                  }
                });
            } else if (result && result.dismiss === swal.DismissReason.cancel) {
              // set justify to be false
              this.testCorrectionService.getTestCorrection(dataStudent.testCorrectionId).subscribe((resp) => {
                const patchData = this.formatDataBeforePatch(_.cloneDeep(resp));
                patchData.is_justified = 'no';
                const realData = this.formatDataBeforeJustify(_.cloneDeep(patchData));
                delete realData._id;
                this.testCorrectionService.updateJustifyTestCorrection(dataStudent.testCorrectionId, realData).subscribe((response) => {
                  this.formUpdated.emit(patchData);
                  this.selectGroup(groupData);
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
    if (documents && documents.length && documents.length === 1) {
      const doc = _.cloneDeep(documents[0]);
      const url = `${environment.apiUrl}/fileuploads/${doc.document.s3_file_name}?download=true`.replace('/graphql', '');
      const element = document.createElement('a');
      element.href = url;
      element.target = '_blank';
      element.setAttribute('download', doc.document_name);
      element.click();
    } else if (documents && documents.length && documents.length > 1) {
      // implement download multiple doc as zip
      const expectedDocs = [];
      documents.forEach((doc) => {
        if (doc && doc.document && doc.document._id) {
          expectedDocs.push(doc.document._id);
        }
      });
      this.testCorrectionService.downloadMultipleDocumentsAsZip(expectedDocs, studentId).subscribe((resp) => {
        const url = `${environment.apiUrl}/fileuploads/${resp.pathName}?download=true`.replace('/graphql', '');
        const element = document.createElement('a');
        element.href = url;
        element.target = '_blank';
        element.setAttribute('download', resp.pathName);
        element.click();
      });
    }
  }

  downloadDocExpectedGroup(documents: any[], groupId: string) {
    if (documents && documents.length && documents.length === 1) {
      const doc = _.cloneDeep(documents[0]);
      const url = `${environment.apiUrl}/fileuploads/${doc.document.s3_file_name}?download=true`.replace('/graphql', '');
      const element = document.createElement('a');
      element.href = url;
      element.target = '_blank';
      element.setAttribute('download', doc.document_name);
      element.click();
    } else if (documents && documents.length && documents.length > 1) {
      // implement download multiple doc as zip
      const expectedDocs = [];
      documents.forEach((doc) => {
        if (doc && doc.document && doc.document._id) {
          expectedDocs.push(doc.document._id);
        }
      });
      this.testCorrectionService.downloadMultipleDocumentsAsZipGroup(expectedDocs, groupId).subscribe((resp) => {
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

  checkIDV(groupData) {
    let result = false;
    const foundGroup = _.find(this.filteredGroupList, (group) => group.name === groupData.name);

    if (foundGroup && this.dataFilledStudentOfAllGroupList && this.dataFilledStudentOfAllGroupList.length) {
      for (const student of this.dataFilledStudentOfAllGroupList) {
        if (student.groupId === groupData._id) {
          if (foundGroup.score !== student.score) {
            result = true;
            break;
          }

          if (foundGroup.missing_copy !== student.missing_copy || foundGroup.is_justified !== student.is_justified) {
            result = true;
            break;
          }
        }
      }
    }

    return result;
  }

  checkStudentMissingCopy(groupData) {
    let result = false;
    const foundGroup = _.find(this.filteredGroupList, (group) => group.name === groupData.name);

    if (foundGroup && this.dataFilledStudentOfAllGroupList && this.dataFilledStudentOfAllGroupList.length) {
      for (const student of this.dataFilledStudentOfAllGroupList) {
        if (student.groupId === groupData._id && student.missing_copy && !student.is_justified) {
          result = true;
          break;
        }
      }
    }

    return result;
  }

  isAllDocRejected(docs) {
    const temp = _.cloneDeep(docs);
    return temp.find((doc) => doc.validation_status !== 'rejected');
  }

  validateSelectStudentScore(student) {

    if (this.testData.block_type !== 'competence' && this.testData.block_type !== 'soft_skill') {
      if (this.selectedGroup && (this.selectedGroup.score === 0 || this.selectedGroup.score)) {
        return true;
      } else {
        return false;
      }
    } else {
      return true;
    }
  }
}
