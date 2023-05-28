import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import * as moment from 'moment';
import { SubSink } from 'subsink';
import * as _ from 'lodash';
import Swal from 'sweetalert2';
import { UntypedFormControl } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import { ParseUtcToLocalPipe } from 'app/shared/pipes/parse-utc-to-local.pipe';
import { environment } from 'environments/environment';
import { SelectionModel } from '@angular/cdk/collections';
import { Observable } from 'rxjs';
import { debounceTime, map, startWith, tap } from 'rxjs/operators';
import { UtilityService } from 'app/service/utility/utility.service';
import { TranscriptProcessService } from 'app/service/transcript-process/transcript-process.service';
@Component({
  selector: 'ms-class-title-gov-registration-generation-tab',
  templateUrl: './class-title-gov-registration-generation-tab.component.html',
  styleUrls: ['./class-title-gov-registration-generation-tab.component.scss'],
})
export class ClassTitleGovRegistrationGenerationTabComponent implements OnInit {
  private subs = new SubSink();
  @Input() selectedRncpTitleId: string;
  @Input() selectedClassId: string;
  @Output() selectedIndexChange = new EventEmitter<number>();
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  dataSource = new MatTableDataSource([]);
  isWaitingTopForResponse = false;
  isWaitingForResponse = false;
  isWaitingForResponseGenerate = false;
  noData: any;

  displayedColumns: string[] = ['select', 'nameStudent', 'school', 'decision'];
  filterColumns: string[] = ['selectFilter', 'nameStudentFilter', 'schoolFilter', 'decisionFilter'];
  filteredValues = {
    schoolId: '',
    selection_type: 'pass',
    student_name: '',
    date_of_issuance: ''
  };
  // default pass
  typeSuperFilterValue = 'pass';

  sortValue = null;
  isReset: any = false;
  timeOutVal: any;
  studentDocument = 0;

  schoolSuperFilter = new UntypedFormControl('All');
  typeGenerationFilter = new UntypedFormControl('Selection');
  dateOfIssuanceFilter = new UntypedFormControl('');
  schoolFilter = new UntypedFormControl('');
  nameStudentFilter = new UntypedFormControl('');
  decisionFilter = new UntypedFormControl('');

  schoolList = [];
  schoolTableList = [];
  dataSelected: any = [];
  userSelected: any = [];
  userSelectedId: any = [];
  allStudentCheckbox = [];
  dataUnselect = [];
  isCheckedAll = true;
  isAllStudent = true;
  disabledGenerateXML = true;
  typeGenerationList = [
    { name: 'selection', text: 'Selection', value: 'pass' },
    { name: 'admitted', text: 'Admitted', value: 'pass_not_retake' },
    { name: 'admitted_after_retake', text: 'Admitted after Retake', value: 'pass_after_retake' },
  ];
  typeGenerationTemp = [];
  typeGenerationListOri = [];
  decisionGenerationList = [
    { name: 'admitted', text: 'Admitted', value: 'pass_not_retake' },
    { name: 'admitted_after_retake', text: 'Admitted after Retake', value: 'pass_after_retake' },
  ];
  decisionGenerationTemp = [];
  decisionGenerationOri = [];
  dateOfIssuanceList = [];

  filteredSchools: Observable<any[]>;
  filteredTypeGenertions: Observable<any[]>;
  filteredDecision: Observable<any[]>;
  filteredSchoolsTable: Observable<any[]>;
  filteredDateOfIssuance: Observable<any[]>;

  classData: any;
  sortedData: any;

  selection = new SelectionModel<any>(true, []);

  checkBoxInfo: any;

  constructor(
    private rncpTitleService: RNCPTitlesService,
    private transcriptProcessService: TranscriptProcessService,
    private parseUTCtoLocal: ParseUtcToLocalPipe,
    private utilService: UtilityService,
    private translate: TranslateService,
  ) {}
  ngOnInit() {
    this.getSchoolDropdown();
    this.getAllStudentsAdmitted('init');
    this.initFilter();
    this.translateChange();
    this.schoolSuperFilter.setValue(this.translate.instant('All'), { emitEvent: false });
    this.typeGenerationFilter.setValue(this.translate.instant('ACAD_169.selection'), { emitEvent: false });
    this.decisionGenerationOri = this.decisionGenerationList.slice();
    if (this.typeGenerationFilter.value) {
      this.isCheckedAll = true;
      this.disabledGenerateXML = false;
    }
    this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      const schoolFilterValue = this.schoolSuperFilter.value;
      const typeGenerationFilterValue = this.typeGenerationFilter.value;
      if (schoolFilterValue === 'All' || schoolFilterValue === 'Tous') {
        this.schoolSuperFilter.setValue(this.translate.instant('All'), { emitEvent: false });
      }

      if (typeGenerationFilterValue === 'Selection' || typeGenerationFilterValue === 'Sélection') {
        this.typeGenerationFilter.setValue(this.translate.instant('ACAD_169.selection'), { emitEvent: false });
      }

      this.typeGenerationList.forEach((item) => {
        const typeGeneration = this.getTranslateType(item.name);
        this.typeGenerationTemp.push({ name: item.name, text: typeGeneration, value: item.value });
      });

      this.filteredTypeGenertions = this.typeGenerationFilter.valueChanges.pipe(
        startWith(''),
        map((searchText) =>
          this.typeGenerationList.filter((type) =>
            type
              ? this.utilService
                  .simpleDiacriticSensitiveRegex(this.translate.instant(type?.name))
                  ?.toLowerCase()
                  ?.includes(this.utilService.simpleDiacriticSensitiveRegex(searchText)?.toLowerCase())
              : false,
          ),
        ),
      );

      this.typeGenerationFilter.patchValue(this.getTranslatedSelectedTypGeneration());
      if (this.decisionFilter.value) {
        this.decisionGenerationList.forEach((item) => {
          const typeGeneration = this.getTranslateType(item.name);
          this.decisionGenerationTemp.push({ name: item.name, text: typeGeneration, value: item.value });
        });

        this.filteredDecision = this.decisionFilter.valueChanges.pipe(
          startWith(''),
          map((searchText) =>
            this.decisionGenerationList.filter((type) =>
              type
                ? this.utilService
                    .simpleDiacriticSensitiveRegex(this.translate.instant(type?.name))
                    ?.toLowerCase()
                    ?.includes(this.utilService.simpleDiacriticSensitiveRegex(searchText)?.toLowerCase())
                : false,
            ),
          ),
        );
        this.decisionFilter.patchValue(this.getTranslatedSelectedTypGeneration());
      }
    });
  }

  ngAfterViewInit(): void {
    this.subs.sink = this.paginator.page
      .pipe(
        tap(() => {
          if (!this.isReset) {
            this.getAllStudentsAdmitted();
          }
        }),
      )
      .subscribe();
  }

  getTranslatedSelectedTypGeneration(): string {
    if (!this.filteredValues.selection_type) return;
    let selectedTypeFilter;
    if (this.decisionFilter.value) {
      selectedTypeFilter = this.decisionGenerationList.find((type) => type?.value === this.filteredValues.selection_type);
    } else {
      selectedTypeFilter = this.typeGenerationList.find((type) => type?.value === this.filteredValues.selection_type);
    }
    return this.getTranslateType(selectedTypeFilter?.text) || '';
  }

  getTranslateType(name) {
    if (name) {
      const value = this.translate.instant('ACAD_169.' + name.toLowerCase().replace(/\s/g, '_'));
      return value;
    }
  }

  setSchoolFilter(value) {
    this.filteredValues.student_name = '';
    this.filteredValues.schoolId = value;
    this.filteredValues.selection_type = this.typeSuperFilterValue;
    this.paginator.pageIndex = 0;
    this.schoolFilter.patchValue('');
    this.decisionFilter.patchValue('');
    this.nameStudentFilter.patchValue('');
    if (value) {
      this.getSchoolDropdownList(value);
    } else {
      this.getSchoolDropdown();
    }
    this.dataUnselect = [];
    if (!this.isReset) {
      this.getAllStudentsAdmitted();
    }
  }

  translateChange() {
    this.subs.sink = this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      if (this.schoolSuperFilter?.value === 'All' || this.schoolSuperFilter?.value === 'Tous') {
        this.schoolSuperFilter.patchValue(this.translate.instant('All'), { emitEvent: false });
      }
      if (this.schoolFilter?.value === 'All' || this.schoolFilter?.value === 'Tous') {
        this.schoolFilter.patchValue(this.translate.instant('All'), { emitEvent: false });
      }
      if (this.typeGenerationFilter?.value && (this.typeGenerationFilter?.value !== 'All' && this.typeGenerationFilter?.value !== 'Tous')) {
        const tempTypeGenerationFilter = 'ACAD_169.' + this.filteredValues.selection_type;
        this.typeGenerationFilter.patchValue(this.translate.instant(tempTypeGenerationFilter), { emitEvent: false });
      }
      if (this.decisionFilter?.value && (this.decisionFilter?.value !== 'All' && this.decisionFilter?.value !== 'Tous')) {
        const tempTypeDecisionFilter = 'ACAD_169.' + this.filteredValues.selection_type;
        this.decisionFilter.patchValue(this.translate.instant(tempTypeDecisionFilter), { emitEvent: false });
      } else if (this.decisionFilter?.value && (this.decisionFilter?.value === 'All' || this.decisionFilter?.value === 'Tous')) {
        this.decisionFilter.patchValue(this.translate.instant('All'), { emitEvent: false });
      }
    });
  }

  setSchoolFilterTable(value) {
    this.filteredValues.schoolId = value;
    this.paginator.pageIndex = 0;
    this.dataUnselect = [];
    if (!this.isReset) {
      this.getAllStudentsAdmitted();
    }
  }

  setTypeFilter(value) {
    this.filteredValues.selection_type = value;
    this.typeSuperFilterValue = value;
    this.decisionGenerationList = this.decisionGenerationOri;
    this.decisionFilter.patchValue('');
    if (value && value !== 'pass') {
      this.decisionGenerationList = this.decisionGenerationList.filter((type) => type.value === value);
      this.getDropdownDecision();
    } else {
      this.getDropdownDecision();
    }
    this.dataUnselect = [];
    this.paginator.pageIndex = 0;

    if (!this.isReset && value !== 'pass_after_retake') {
      this.filteredValues.date_of_issuance = ''
      this.getAllStudentsAdmitted();
    } else {
      if (this.dateOfIssuanceFilter?.value) {
        this.getAllStudentsAdmitted();
      } else {
        this.dataSource.data = [];
        this.getDateOfIssuance();
      }
    }
  }

  setDateFilter(value){
    this.filteredValues.date_of_issuance = value;
    if (value){
      this.getAllStudentsAdmitted();
    }
  }

  setDecisionFilter(value) {
    this.filteredValues.selection_type = value;
    this.paginator.pageIndex = 0;
    this.dataUnselect = [];
    if (!this.isReset) {
      this.getAllStudentsAdmitted();
    }
  }

  getStudentDecission(decision) {
    // When have student accept retake return Admitted after Retake
    if (decision?.student_accept_retake === 'school_board_decision_after_retake' && decision?.decision_school_board === 'pass') {
      return this.translate.instant('ACAD_169.admitted_after_retake');
    } else {
      return this.translate.instant('ACAD_169.admitted');
    }
  }

  getAllStudentsAdmitted(from?) {
    const pagination = {
      limit: this.paginator.pageSize ? this.paginator.pageSize : 10,
      page: this.paginator.pageIndex ? this.paginator.pageIndex : 0,
    };
    this.isWaitingForResponse = true;
    (this.subs.sink = this.transcriptProcessService
      .getAllStudentAdmitted(
        pagination,
        this.selectedRncpTitleId,
        this.selectedClassId,
        this.filteredValues.schoolId,
        this.filteredValues.student_name,
        this.filteredValues.selection_type,
        this.sortValue,
        this.filteredValues.date_of_issuance
      )
      .subscribe((resp) => {
        if (resp) {
          this.dataSource.data = resp;
          this.studentDocument = resp[0] && resp[0].count_document ? resp[0].count_document : 0;
          this.noData = this.dataSource.connect().pipe(map((dataa) => dataa.length === 0));
          if (from === 'init' || this.isReset || (this.checkBoxInfo === 'all' && this.isCheckedAll)) {
            if(this.checkBoxInfo === 'all' && this.isCheckedAll){
              this.selection.clear();
            }
            this.isCheckedAll = true;
            this.dataSource.data.forEach((row) => {
              if (!this.dataUnselect.includes(row?.student_id?._id)) {
                this.selection.select(row?.student_id?._id);
              } else {
                this.selection.deselect(row?.student_id?._id);
              }
            });
          }
          this.isReset = false;
          this.isWaitingForResponse = false;
        }
      })),
      (err) => {
        this.isWaitingForResponse = false;
        Swal.fire({
          type: 'error',
          title: 'Error',
          text: err && err['message'] ? err['message'] : err,
          confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
        });
      };
  }

  getSchoolDropdown() {
    this.isWaitingTopForResponse = true;
    this.subs.sink = this.rncpTitleService.getSchoolListByClass(this.selectedRncpTitleId, this.selectedClassId).subscribe(
      (schoolList) => {
        if (schoolList) {
          this.schoolList = _.cloneDeep(schoolList);
          this.schoolList = _.orderBy(this.schoolList, ['short_name'], ['asc']);
          this.isWaitingTopForResponse = false;
          this.filteredSchools = this.getDropdownSchoolByControl(this.schoolSuperFilter);
          this.filteredSchoolsTable = this.getDropdownSchoolByControl(this.schoolFilter);
        }
      },
      (err) => {
        this.isWaitingTopForResponse = false;
        Swal.fire({
          type: 'error',
          title: 'Error',
          text: err && err['message'] ? err['message'] : err,
          confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
        });
      },
    );
  }

  getSchoolDropdownList(school_id?: string) {
    this.subs.sink = this.rncpTitleService
      .getSchoolListBySchoolId(this.selectedRncpTitleId, this.selectedClassId, school_id)
      .subscribe((resp) => {
        if (resp) {
          this.schoolTableList = _.cloneDeep(resp);
          this.filteredSchoolsTable = this.schoolFilter.valueChanges.pipe(
            startWith(''),
            map((searchTxt) => this.schoolTableList.filter((option) => option.short_name.toLowerCase().includes(searchTxt.toLowerCase()))),
          );
        }
      });
  }

  getDropdownSchoolByControl(control) {
    return control.valueChanges.pipe(
      startWith(''),
      map((searchTxt: any) =>
        (searchTxt && searchTxt !== 'All') || searchTxt !== 'Tous'
          ? this.schoolList
              .filter((option) => option.short_name.toLowerCase().includes(searchTxt.toLowerCase()))
              .sort((firstData, secondData) => {
                if (
                  this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(firstData.short_name)).toLowerCase() <
                  this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(secondData.short_name)).toLowerCase()
                ) {
                  return -1;
                } else if (
                  this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(firstData.short_name)).toLowerCase() >
                  this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(secondData.short_name)).toLowerCase()
                ) {
                  return 1;
                } else {
                  return 0;
                }
              })
          : this.schoolList,
      ),
    );
  }

  getDropdownDecision() {
    this.filteredDecision = this.decisionFilter.valueChanges.pipe(
      startWith(''),
      map((searchTxt) =>
        this.decisionGenerationList.filter((option) =>
          this.utilService
            .simpleDiacriticSensitiveRegex(this.translate.instant('ACAD_169.' + option.name))
            .toLowerCase()
            .includes(this.utilService.simpleDiacriticSensitiveRegex(searchTxt)?.toLowerCase()),
        ),
      ),
    );
  }

  getDateOfIssuance(){
    this.isWaitingTopForResponse = true;
    const selectionType = 'admitted_after_retake';
    this.subs.sink = this.transcriptProcessService.getAllDateOfIssuanceDropdown(this.selectedRncpTitleId, this.selectedClassId, selectionType).subscribe((resp)=>{
      this.isWaitingTopForResponse = false;
      this.dateOfIssuanceList = resp;
    },
    (err) => {
      this.isWaitingTopForResponse = false;
      Swal.fire({
        type: 'error',
        title: 'Error',
        text: err && err['message'] ? err['message'] : err,
        confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
      });
    })
  }


  masterToggle() {
    if (this.isAllSelected() || (this.isCheckedAll && this.dataUnselect && this.dataUnselect.length)) {
      this.selection.clear();
      this.dataUnselect = [];
      this.userSelected = [];
      this.userSelectedId = [];
      this.isCheckedAll = false;
    } else {
      this.selection.clear();
      this.dataUnselect = [];
      this.userSelected = [];
      this.isCheckedAll = true;
      this.dataSource.data.forEach((row) => {
        if (!this.dataUnselect.includes(row?.student_id?._id)) {
          this.selection.select(row?.student_id?._id);
        }
      });
    }
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows || numSelected > numRows;
  }

  showOptions(info, row) {
    this.checkBoxInfo = info;
    if (this.isCheckedAll) {
      if (row) {
        if (!this.dataUnselect.includes(row.student_id?._id)) {
          this.dataUnselect.push(row?.student_id?._id);
          this.selection.deselect(row?.student_id?._id);
        } else {
          const indx = this.dataUnselect.findIndex((list) => list === row?.student_id?._id);
          this.dataUnselect.splice(indx, 1);
          this.selection.select(row?.student_id?._id);
        }
      }
      this.isAllStudent = this.dataUnselect.length <= 0;
    } else {
      if (row) {
        if (this.dataSelected && this.dataSelected.length) {
          const dataFilter = this.dataSelected.filter((resp) => resp._id === row._id);
          if (dataFilter && dataFilter.length < 1) {
            this.dataSelected.push(row);
          } else {
            const indexFilter = this.dataSelected.findIndex((resp) => resp._id === row._id);
            this.dataSelected.splice(indexFilter, 1);
          }
        } else {
          this.dataSelected.push(row);
        }
      }
    }
    const numSelected = this.selection.selected.length;
    this.disabledGenerateXML = numSelected <= 0;
    this.userSelected = [];
    this.userSelectedId = [];
    const data = this.dataSelected && this.dataSelected.length ? this.dataSelected : this.selection.selected;
    data.forEach((user) => {
      this.userSelected.push(user);
      this.userSelectedId.push(user?.student_id?._id);
    });
  }

  /** The label for the checkbox on the passed row */
  checkboxLabel(row?: any): string {
    if (!row) {
      return `${this.isAllSelected() ? 'select' : 'deselect'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${row.position + 1}`;
  }

  initFilter() {
    // this.subs.sink = this.nameStudentFilter.valueChanges.subscribe()
    this.subs.sink = this.nameStudentFilter.valueChanges.pipe(debounceTime(400)).subscribe((statusSearch) => {
      const symbol = /[-!$%^&*()_+|~=`{}\[\]:";'<>?,.\/]/;
      const symbol1 = /\\/;
      if (!statusSearch.match(symbol) && !statusSearch.match(symbol1)) {
        this.filteredValues.student_name = statusSearch ? statusSearch.toLowerCase() : '';
        this.paginator.pageIndex = 0;
        this.dataUnselect = [];
        if (!this.isReset) {
          this.getAllStudentsAdmitted();
        }
      } else {
        this.dataUnselect = [];
        this.nameStudentFilter.setValue('');
        this.filteredValues.student_name = '';
        this.paginator.pageIndex = 0;
        if (!this.isReset) {
          this.getAllStudentsAdmitted();
        }
      }
    });

    // Type Generation
    this.filteredTypeGenertions = this.typeGenerationFilter.valueChanges.pipe(
      startWith(''),
      map((searchTxt) =>
        this.typeGenerationList.filter((option) =>
          this.utilService
            .simpleDiacriticSensitiveRegex(this.translate.instant('ACAD_169.' + option.name))
            .toLowerCase()
            .includes(this.utilService.simpleDiacriticSensitiveRegex(searchTxt)?.toLowerCase()),
        ),
      ),
    );

    //Date Of Issuance
    this.filteredDateOfIssuance = this.dateOfIssuanceFilter.valueChanges.pipe(
      startWith(''),
      map((searchTxt) => 
      this.dateOfIssuanceList.filter((option) => option.includes(searchTxt))
      )
    )

    this.getDropdownDecision();
  }

  csvTypeSelectionUpload() {
    const inputOptions = {
      ',': this.translate.instant('Generate file of admitted student'),
      ';': this.translate.instant('Generate file of admitted student after retake'),
      tab: this.translate.instant('Generate file for selected students'),
    };

    Swal.fire({
      type: 'question',
      title: this.translate.instant('Please Select Which File you want to generate'),
      width: 600,
      allowEscapeKey: true,
      showCancelButton: true,
      cancelButtonText: this.translate.instant('IMPORT_TEMPLATE_S1.CANCEL'),
      confirmButtonText: this.translate.instant('IMPORT_TEMPLATE_S1.OK'),
      input: 'radio',
      inputOptions: inputOptions,
      inputValidator: (value) => {
        return new Promise((resolve, reject) => {
          if (value) {
            resolve('');
            Swal.getConfirmButton().removeAttribute('disabled');
          } else {
            Swal.getConfirmButton().setAttribute('disabled', '');
            reject(this.translate.instant('IMPORT_TEMPLATE_S1.INVALID'));
          }
        });
      },
      onOpen: function () {
        Swal.getConfirmButton().setAttribute('disabled', '');
        Swal.getContent().addEventListener('click', function (e) {
          Swal.getConfirmButton().removeAttribute('disabled');
        });
      },
    }).then((separator) => {
      if (separator.value) {
        const fileType = separator.value;
        // this.openImportDialog(fileType);
      }
    });
  }

  onReset() {
    this.isReset = true;
    this.paginator.pageIndex = 0;
    this.getSchoolDropdown();
    this.sort.sort({ id: '', start: 'asc', disableClear: false });
    this.filteredValues = {
      schoolId: '',
      selection_type: 'pass',
      student_name: '',
      date_of_issuance: ''
    };
    this.typeSuperFilterValue = 'pass';
    this.dataUnselect = [];
    this.userSelectedId = [];
    this.dataSelected = [];
    this.nameStudentFilter.setValue('', { emitEvent: false });
    this.schoolFilter.setValue('', { emitEvent: false });
    this.decisionFilter.setValue('', { emitEvent: false });
    this.schoolSuperFilter.setValue('All', { emitEvent: false });
    this.typeGenerationFilter.setValue('Selection', { emitEvent: false });
    this.dateOfIssuanceFilter.setValue('', { emitEvent: false });
    this.decisionGenerationList = [
      { name: 'admitted', text: 'Admitted', value: 'pass_not_retake' },
      { name: 'admitted_after_retake', text: 'Admitted after Retake', value: 'pass_after_retake' },
    ];
    this.getDropdownDecision();
    this.sort.direction = '';
    this.sort.active = '';
    this.sortValue = null;
    this.getAllStudentsAdmitted();
  }

  downloadFile(s3FileName) {
    const a = document.createElement('a');
    a.target = 'blank';
    a.href = `${environment.apiUrl}/fileuploads/${s3FileName}?download=true`.replace('/graphql', '');
    a.download = s3FileName;
    a.click();
    a.remove();
  }

  generateXMLFile() {
    this.isWaitingTopForResponse = true;
    const payload = this.createPayload();
    this.subs.sink = this.rncpTitleService
      .exportTitleGovernmentRegistration(payload.titleId, payload.classId, payload.selection_type, payload.schoolId, payload.studentIds,  payload.date_of_issuance)
      .subscribe((resp) => {
        if (resp) {
          this.isWaitingTopForResponse = false;
          // this.downloadFile(resp.s3_file_name);
          Swal.fire({
            type: 'success',
            title: 'Bravo!',
            allowOutsideClick: false,
          }).then((result) => {
            this.selectedIndexChange.emit(0);
          });
        }
      });
  }

  generateXMLData() {
    this.getDataAllForCheckbox(0);
  }

  getDataAllForCheckbox(pageNumber) {
    if (this.isCheckedAll) {
      if (this.dataUnselect.length < 1) {
        // this.generateXMLFile('1');
      } else if (pageNumber === 0) {
        this.allStudentCheckbox = [];
        this.dataSelected = [];
      }
      const pagination = {
        limit: 300,
        page: pageNumber,
      };
      this.isWaitingTopForResponse = true;
      this.subs.sink = this.transcriptProcessService
        .getAllStudentAdmitted(
          pagination,
          this.selectedRncpTitleId,
          this.selectedClassId,
          this.filteredValues.schoolId,
          this.filteredValues.student_name,
          this.filteredValues.selection_type,
          this.sortValue,
          this.filteredValues.date_of_issuance
        )
        .subscribe(
          (studentList: any) => {
            this.userSelectedId = [];
            if (studentList && studentList.length) {
              const resp = _.cloneDeep(studentList);
              this.allStudentCheckbox = _.concat(this.allStudentCheckbox, resp);
              const page = pageNumber + 1;
              this.getDataAllForCheckbox(page);
            } else {
              this.isWaitingTopForResponse = false;
              if (this.isCheckedAll) {
                if (this.allStudentCheckbox && this.allStudentCheckbox.length) {
                  // if using filter student name save userSelectedId                  
                  if (this.filteredValues.student_name && this.dataUnselect.length === 0) {                    
                    this.userSelectedId = this.allStudentCheckbox.map((val) => val?.student_id?._id);                    
                  } else{                    
                    this.userSelectedId = this.allStudentCheckbox
                      .filter((list) => !this.dataUnselect.includes(list?.student_id?._id))
                      .map((val) => val?.student_id?._id);
                  }                  
                  if (this.userSelectedId && this.userSelectedId.length) {
                    this.generateXMLFile();
                  }
                }
              }
            }
          },
          (error) => {
            // Record error log
            this.isReset = false;
            this.isWaitingTopForResponse = false;
          },
        );
    } else {
      this.generateXMLFile();
    }
  }

  createPayload() {
    let payload: any = {};
    payload.titleId = this.selectedRncpTitleId;
    payload.classId = this.selectedClassId;
    this.isAllStudent = this.dataUnselect.length === 0 && this.userSelectedId.length > 0 && this.isCheckedAll;
    payload.selection_type = this.getTypePayload(this.typeGenerationFilter.value);
    if (this.schoolSuperFilter.value === 'All' && this.isAllStudent && !this.filteredValues.student_name) {
      payload.schoolId = this.schoolFilter.value && this.schoolFilter.value !== 'All' ? this.filteredValues.schoolId : null;
      payload.studentIds = null;
    } else if (this.schoolSuperFilter.value === 'All' && (!this.isAllStudent || this.filteredValues.student_name)) {
      payload.schoolId = this.schoolFilter.value && this.schoolFilter.value !== 'All' ? this.filteredValues.schoolId : null;
      payload.studentIds = this.userSelectedId;
    } else if (this.schoolSuperFilter.value !== 'All' && this.isAllStudent && !this.filteredValues.student_name) {
      payload.schoolId = this.filteredValues.schoolId;
      payload.studentIds = null;
    } else if (this.schoolSuperFilter.value !== 'All' && (!this.isAllStudent || this.filteredValues.student_name)) {
      payload.schoolId = this.filteredValues.schoolId;
      payload.studentIds = this.userSelectedId;
    }

    if (this.filteredValues?.selection_type === 'pass_after_retake') {
      payload.date_of_issuance = this.filteredValues?.date_of_issuance;
    } else {
      payload.date_of_issuance = '';
    }
    return payload;
  }

  getTypePayload(value) {
    if (value === 'Selection' || value === 'Sélection') {
      return 'selection';
    } else if (value === 'Admitted' || value === 'Admis') {
      return 'admitted';
    } else if (value === 'Admitted after Retake' || value === 'Admis après rattrapage') {
      return 'admitted_after_retake';
    }
  }

  translateDate(date) {
    if (date) {
      return moment(date).format('DD/MM/YYYY');
    }
  }

  sortData(sort: Sort) {
    this.sortValue = sort.direction ? { [sort.active]: sort.direction ? sort.direction : `asc` } : null;
    this.paginator.pageIndex = 0;
    if (!this.isReset) {
      this.getAllStudentsAdmitted();
    }
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
