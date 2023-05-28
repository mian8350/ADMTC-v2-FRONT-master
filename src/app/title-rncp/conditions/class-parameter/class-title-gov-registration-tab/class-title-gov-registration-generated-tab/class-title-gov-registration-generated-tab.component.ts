import { map } from 'rxjs/operators';
import { Component, Input, OnInit, ViewChild } from '@angular/core';
import * as moment from 'moment';
import { SubSink } from 'subsink';
import * as _ from 'lodash';
import Swal from 'sweetalert2';
import { UntypedFormControl } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { TranslateService, LangChangeEvent } from '@ngx-translate/core';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import { ParseUtcToLocalPipe } from 'app/shared/pipes/parse-utc-to-local.pipe';
import { environment } from 'environments/environment';

@Component({
  selector: 'ms-class-title-gov-registration-generated-tab',
  templateUrl: './class-title-gov-registration-generated-tab.component.html',
  styleUrls: ['./class-title-gov-registration-generated-tab.component.scss'],
})
export class ClassTitleGovRegistrationGeneratedTabComponent implements OnInit {
  private subs = new SubSink();
  @Input() selectedRncpTitleId: string;
  @Input() selectedClassId: string;
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  dataSource = new MatTableDataSource([]);
  isWaitingForResponse = false;
  // isWaitingForResponseGenerate = false;
  noData: any;

  displayedColumns: string[] = ['fileName', 'dateGenerated', 'timeGenerated', 'type', 'action'];
  filterColumns: string[] = ['fileNameFilter', 'dateGeneratedFilter', 'timeGeneratedFilter', 'typeFilter', 'actionFilter'];
  filteredValues = {
    fileName: '',
    dateGenerated: '',
    selectedType: '',
  };

  sortValue = null;
  isReset: any = false;
  timeOutVal: any;
  countDocument = 0;

  fileNameFilter = new UntypedFormControl('');
  dateGeneratedFilter = new UntypedFormControl('');
  typeFilter = new UntypedFormControl('');

  typeList: string[];
  typeFilterList: string[] = ['all', 'zzz', 'admitted_after_retake', 'admitted', 'selection'];

  classData: any;
  sortedData: any;

  constructor(
    private rncpTitleService: RNCPTitlesService,
    private parseUTCtoLocal: ParseUtcToLocalPipe,
    private translate: TranslateService,
  ) {}
  ngOnInit() {
    this.getTittleGovTable();
    this.initFilter();
    this.translateChange();
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
  }

  getTittleGovTable() {
    this.isWaitingForResponse = true;
    this.subs.sink = this.rncpTitleService.getClassById(this.selectedClassId).subscribe((response) => {
      this.isWaitingForResponse = false;
      if (response) {
        const resp = _.cloneDeep(response);
        this.classData = _.cloneDeep(resp);
        this.formatTableData(this.classData);
        this.noData = this.dataSource.connect().pipe(map((dataa) => dataa.length === 0));
      }
    });
  }

  formatTableData(classData) {
    if (classData && classData.title_government_registration && classData.title_government_registration.length) {
      classData.title_government_registration.reverse().forEach((titleGov, index) => {
        titleGov.original_date_generated_at = _.cloneDeep(titleGov.date_generated_at);
        titleGov.original_time_generated_at = _.cloneDeep(titleGov.time_generated_at);
        titleGov.date_generated_at =
          titleGov.date_generated_at && titleGov.time_generated_at
            ? this.parseUTCtoLocal.transformDateToJavascriptDate(titleGov.date_generated_at, titleGov.time_generated_at)
            : '';
        titleGov.time_generated_at = titleGov.time_generated_at ? this.parseUTCtoLocal.transform(titleGov.time_generated_at) : '';
        titleGov.s3_file_name = titleGov.s3_file_name ? titleGov.s3_file_name.replace('.zip', '') : '';
        titleGov.selection_type = !titleGov.selection_type ? 'zzz' : titleGov.selection_type;
      });

      this.dataSource.data = classData.title_government_registration;
      this.countDocument = classData.title_government_registration.length;
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;

      this.dataSource.filterPredicate = this.customFilterPredicate();
    }
  }

  customFilterPredicate() {
    return function (data, filter: string): boolean {
      const searchString = JSON.parse(filter);

      const nameFound = data.s3_file_name.toString().trim().toLowerCase().indexOf(searchString.fileName.toLowerCase()) !== -1;

      const formattedDate = moment(data.date_generated_at).format('DD/MM/YYYY');
      const dateFound = formattedDate.toString().trim().toLowerCase().indexOf(searchString.dateGenerated.toLowerCase()) !== -1;

      let typeFound: boolean;
      const typeSearch = searchString.selectedType.trim().toLowerCase();
      if (typeSearch && typeSearch === 'all') {
        typeFound = true;
      } else if (typeSearch && typeSearch !== 'all') {
        typeFound = data.selection_type.trim().toLowerCase() === typeSearch;
      } else {
        typeFound = true;
      }

      return nameFound && dateFound && typeFound;
    };
  }

  initFilter() {
    this.subs.sink = this.sort.sortChange.subscribe((changes) => {

    });

    this.subs.sink = this.fileNameFilter.valueChanges.subscribe((file) => {
      this.filteredValues['fileName'] = file;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
      this.noData = this.dataSource.connect().pipe(map((dataa) => dataa.length === 0));
    });

    this.subs.sink = this.dateGeneratedFilter.valueChanges.subscribe((date) => {
      const dateValue = moment(date).format('DD/MM/YYYY');
      this.filteredValues['dateGenerated'] = dateValue;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
      this.noData = this.dataSource.connect().pipe(map((dataa) => dataa.length === 0));
    });

    this.typeList = this.typeFilterList;
    this.subs.sink = this.typeFilter.valueChanges.subscribe((typeSearch) => {
      if (typeof this.typeFilter.value === 'string') {
        this.typeList = this.typeFilterList.filter((type) =>
          this.translate.instant(`ACAD_169.${type}`).toLowerCase().trim().includes(typeSearch.toLowerCase().trim()),
        );
      }
      this.noData = this.dataSource.connect().pipe(map((dataa) => dataa.length === 0));
    });
  }

  setFilterType(type) {
    this.filteredValues['selectedType'] = type;
    this.dataSource.filter = JSON.stringify(this.filteredValues);
    this.typeFilter.patchValue(this.translate.instant('ACAD_169.' + type), { emitEvent: false });
  }

  translateChange() {
    this.subs.sink = this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      if (this.typeFilter?.value) {
        const tempTypeFilterValue = 'ACAD_169.' + this.filteredValues['selectedType'];
        this.typeFilter.patchValue(this.translate.instant(tempTypeFilterValue), { emitEvent: false });
      }
    });
  }

  // sortData(sort: Sort) {

  //   this.sortValue = sort.active ? { [sort.active]: sort.direction ? sort.direction : `asc` } : null;


  //   if (!this.isWaitingForResponse) {
  //     if (!sort.active || sort.direction === '') {
  //       this.sortedData = this.dataSource.data.slice();
  //     } else {
  //       this.sortedData = data.sort((a, b) => {
  //         const aValue = (a as any)[sort.active];
  //         const bValue = (b as any)[sort.active];
  //         return (aValue < bValue ? -1 : 1) * (sort.direction === 'asc' ? 1 : -1);
  //       });
  //     }
  //     this.paginator.pageIndex = 0;

  //   }
  // }

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
    // this.isReset = true;
    this.paginator.pageIndex = 0;
    this.filteredValues = {
      fileName: '',
      dateGenerated: '',
      selectedType: '',
    };
    this.sortValue = null;
    this.fileNameFilter.patchValue('', { emitEvent: false });
    this.dateGeneratedFilter.patchValue('', { emitEvent: false });
    this.typeFilter.patchValue('', { emitEvent: false });
    this.typeList = this.typeFilterList;
    this.dataSource.filter = JSON.stringify(this.filteredValues);
    this.sort.direction = '';
    this.sort.active = '';
    this.sort.sort({ id: '', start: 'asc', disableClear: false });
    this.getTittleGovTable();
  }

  downloadFile(s3FileName) {
    const a = document.createElement('a');
    a.target = 'blank';
    a.href = `${environment.apiUrl}/fileuploads/${s3FileName}.zip?download=true`.replace('/graphql', '');
    a.download = s3FileName;
    a.click();
    a.remove();
  }
  
  // for remove time in s3 file name
  displayName(value) {
    if(!value){
      return;      
    } 
    const result = value.split('--');    
    return result[0];
  }
  
  // generateXMLFile() {
  //   this.isWaitingForResponseGenerate = true;
  //   const titleId = this.classData.parent_rncp_title._id;
  //   const classId = this.classData._id;
  //   this.subs.sink = this.rncpTitleService.exportTitleGovernmentRegistration(titleId, classId).subscribe((resp) => {
  //     if (resp) {
  //       this.isWaitingForResponseGenerate = false;
  //       // this.downloadFile(resp.s3_file_name);
  //       Swal.fire({
  //         type: 'success',
  //         title: 'Bravo!',
  //         allowOutsideClick: false,
  //       }).then((result) => {
  //         this.getTittleGovTable();
  //       });
  //     }
  //   });
  // }

  deleteFile(fileObj) {

    const payload = {
      classId: this.selectedClassId,
      s3_file_name: fileObj?.s3_file_name,
      original_date_generated_at: fileObj?.original_date_generated_at,
      original_time_generated_at: fileObj?.original_time_generated_at
    };

    let timeDisabled = 5;
    Swal.fire({
      type: 'warning',
      title: this.translate.instant('DELETE_QUESTION_FILE.TITLE'),
      footer: `<span style="margin-left: auto">DELETE_QUESTION_FILE</span>`,
      confirmButtonText: this.translate.instant('DELETE_QUESTION_FILE.BUTTON_1'),
      showCancelButton: true,
      cancelButtonText: this.translate.instant('DELETE_QUESTION_FILE.BUTTON_2'),
      allowEscapeKey: false,
      allowOutsideClick: false,
      allowEnterKey: false,
      onOpen: () => {
        Swal.disableConfirmButton();
        const confirmBtnRef = Swal.getConfirmButton();
        const intVal = setInterval(() => {
          timeDisabled -= 1;
          confirmBtnRef.innerText = this.translate.instant('DELETE_QUESTION_FILE.BUTTON_1') + ` (${timeDisabled})`;
        }, 1000);

        this.timeOutVal = setTimeout(() => {
          confirmBtnRef.innerText = this.translate.instant('DELETE_QUESTION_FILE.BUTTON_1');
          Swal.enableConfirmButton();
          clearInterval(intVal);
          clearTimeout(this.timeOutVal);
        }, timeDisabled * 1000);
      },
    }).then((result) => {
      if(result.value){
        this.subs.sink = this.rncpTitleService.deleteTitleGovFile(payload).subscribe(resp => {
          Swal.fire({
            type: 'success',
            allowOutsideClick: false,
            title: this.translate.instant('EVENT_S1.TITLE'),
            confirmButtonText: this.translate.instant('EVENT_S1.BUTTON'),
          }).then((result2) => {
            this.getTittleGovTable();
          });
        });
      }
    });

    
  }

  translateDate(date) {
    if (date) {
      return moment(date).format('DD/MM/YYYY');
    }
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
