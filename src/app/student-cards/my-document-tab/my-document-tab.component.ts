import { AfterViewInit, Component, Input, OnChanges, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { StudentsService } from 'app/service/students/students.service';
import { SubSink } from 'subsink';
import { MyDocumentDialogComponent } from './my-document-dialog/my-document-dialog.component';
import * as moment from 'moment';
import { UntypedFormControl } from '@angular/forms';
import { debounceTime, map, startWith, tap } from 'rxjs/operators';
import { environment } from 'environments/environment';
import { AcademicKitService } from 'app/service/rncpTitles/academickit.service';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import Swal from 'sweetalert2';
import { ParseLocalToUtcPipe } from 'app/shared/pipes/parse-local-to-utc.pipe';
import { forkJoin, Observable, of } from 'rxjs';
import { UtilityService } from 'app/service/utility/utility.service';
import { PermissionService } from 'app/service/permission/permission.service';
import * as _ from 'lodash';

@Component({
  selector: 'ms-my-document-tab',
  templateUrl: './my-document-tab.component.html',
  styleUrls: ['./my-document-tab.component.scss'],
})
export class MyDocumentTabComponent implements OnInit, OnDestroy, OnChanges, AfterViewInit {
  @Input() studentId = '';
  @Input() classId: string;
  @Input() titleId: string;
  @Input() schoolId: string;

  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;

  private subs = new SubSink();
  dataSource = new MatTableDataSource([]);

  displayedColumns: string[] = ['documentName', 'type', 'uploadDate', 'action'];
  filterColumns: string[] = ['documentNameFilter', 'typeFilter', 'uploadDateFilter', 'actionFilter'];
  filteredValues = {
    uploaded_for_student: '',
    type_of_document: '',
    updated_at: '',
    document_name: '',
  };

  isReset;
  dataLoaded;

  sortValue;
  isUserADMTC;

  documentNameFilter = new UntypedFormControl('');
  uploadDateFilterCtrl = new UntypedFormControl(null);

  dataDocumentType = [
    { value: 'admission_document_question', textPrint: 'Admission Form Doc' },
    { value: 'my_document_table', textPrint: 'Upload' }
  ];
  // for type auto compilte filter
  documentTypeFilterList = [];
  documentTypeFilter = new UntypedFormControl('');
  filteredDocumentType: Observable<any[]>;
  // filteredDocumentType = this.dataDocumentType;

  noData;

  isWaitingForResponse = false;
  isWaitingForResponseTop = false;
  documentCount = 0;

  constructor(
    private dialog: MatDialog,
    private studentsService: StudentsService,
    private acadService: AcademicKitService,
    private translate: TranslateService,
    public permissionService: PermissionService,

    public utilService: UtilityService,
  ) {}

  ngOnInit() {
    this.filteredDocumentType = of(this.dataDocumentType);
    this.initFilter();
    this.getTableData();
    this.isUserADMTC = this.utilService.isUserEntityADMTC();

    this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      // Repatch the value to retranslate the input
      this.documentTypeFilter.patchValue(this.documentTypeFilter.value);
    });
  }

  ngOnChanges() {
    this.resetSelection();
  }

  ngAfterViewInit() {
    this.subs.sink = this.paginator.page
      .pipe(
        startWith(null),
        tap(() => {
          this.getTableData();
        }),
      )
      .subscribe();
  }

  getTableData() {
    this.filteredValues.uploaded_for_student = this.studentId;
    const pagination = {
      limit: this.paginator && this.paginator.pageSize ? this.paginator.pageSize : 10,
      page: this.paginator && this.paginator.pageIndex ? this.paginator.pageIndex : 0,
    };
    this.isWaitingForResponse = true;
    this.subs.sink = this.studentsService.getAllMydocument(pagination, this.filteredValues, this.sortValue).subscribe(
      (response) => {
        this.isWaitingForResponse = false;
        if (response && response.data) {
          const data = response.data.GetAllMyDocuments;
          this.dataSource.data = response.data.GetAllMyDocuments;
          if (response.data.GetAllMyDocuments[0] && response.data.GetAllMyDocuments[0].count_document) {
            this.documentCount = response.data.GetAllMyDocuments[0].count_document;
          }
          if (data) {
            this.noData = data.length ? false : true;
          }
        } else {
          this.dataSource.data = [];
          this.noData = true;
        }
      },
      (err) => (this.isWaitingForResponse = false),
    );
  }

  initFilter() {
    this.subs.sink = this.documentNameFilter.valueChanges.pipe(debounceTime(500)).subscribe((searchText) => {
      this.paginator.pageIndex = 0;
      this.filteredValues.document_name = searchText;
      this.getTableData();
    });

    this.subs.sink = this.uploadDateFilterCtrl.valueChanges.pipe(debounceTime(500)).subscribe((dueDate) => {
      if (dueDate) {
        this.paginator.pageIndex = 0;
        const fitlerDate = moment(dueDate).format('DD/MM/YYYY');
        this.filteredValues.updated_at = fitlerDate;
        this.getTableData();
      }
    });

    this.subs.sink = this.documentTypeFilter.valueChanges.pipe().subscribe((dataType) => {

      if (dataType) {
        const documentTypes = this.dataDocumentType;
        const filteredDocumentTypes = documentTypes.filter((document) =>
          this.utilService.simplifyRegex(document.textPrint).includes(this.utilService.simplifyRegex(dataType)),
        );
        this.filteredDocumentType = of(filteredDocumentTypes);
      } else {
        this.filteredDocumentType = of(this.dataDocumentType);
      }
    });
  }

  filterDocumentType(DTvalue: string) {
    this.filteredValues.type_of_document = DTvalue;
    this.paginator.pageIndex = 0;
    this.getTableData();
  }

  addDocument(event: any) {
    this.dialog
      .open(MyDocumentDialogComponent, {
        panelClass: 'custom-dialog-container-publishable-doc',
        disableClose: true,
        width: '600px',
        data: {
          schoolId: this.schoolId,
          studentId: this.studentId,
          titleId: this.titleId,
          classId: this.classId,
        },
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.getTableData();
        }
      });
  }

  sortData(sort: Sort) { 
    this.sortValue = sort.direction ? { [sort.active]: sort.direction ? sort.direction : `asc` } : null;
    this.paginator.pageIndex = 0;
    this.getTableData();
  }

  resetSelection() {
    // this.isReset = true;
    this.paginator.pageIndex = 0;
    this.filteredValues = {
      uploaded_for_student: '',
      type_of_document: '',
      updated_at: '',
      document_name: '',
    };
    this.documentNameFilter.setValue('', { emitEvent: false });
    this.uploadDateFilterCtrl.setValue(null, { emitEvent: false });
    this.documentTypeFilter.setValue(null, { emitEvent: false });
    this.filteredDocumentType = of(this.dataDocumentType);
    this.sortValue = null;
    this.getTableData();
  }

  translateDate(date) {
    return moment(date).format('DD-MM-YYYY hh:mm A');
  }

  downloadFile(fileUrl: string) {
    const a = document.createElement('a');
    a.target = 'blank';
    a.href = `${environment.apiUrl}/fileuploads/${fileUrl}?download=true`.replace('/graphql', '');
    a.click();
    a.remove();
  }

  deleteDocument(element) {
    let timeDisabled = 6;
    Swal.fire({
      type: 'warning',
      title: this.translate.instant('Docupload_S2.TITLE'),
      html: this.translate.instant('Docupload_S2.TEXT') + ' ' + element.document_name,
      footer: `<span style="margin-left: auto">Docupload_S2</span>`,
      allowEscapeKey: true,
      showCancelButton: true,
      confirmButtonText: this.translate.instant('Docupload_S2.BUTTON_1'),
      cancelButtonText: this.translate.instant('Docupload_S2.BUTTON_2'),
      allowOutsideClick: false,
      allowEnterKey: false,
    }).then((ress) => {
      if (ress.value) {
        this.isWaitingForResponseTop = true;

        this.subs.sink = this.acadService.deleteAcadDoc(element._id).subscribe((resp) => {
          this.isWaitingForResponseTop = false;
          if (resp) {
            Swal.fire({
              type: 'success',
              title: this.translate.instant('Bravo_S1.TITLE'),
              footer: `<span style="margin-left: auto">Bravo_S1</span>`,
              confirmButtonText: this.translate.instant('Bravo_S1.BUTTON'),
              allowOutsideClick: false,
            }).then((res) => {
              this.getTableData();
            });
          }
        });
      }
    });
  }

  editMyDocument(element) {
    this.subs.sink = this.dialog
      .open(MyDocumentDialogComponent, {
        panelClass: 'custom-dialog-container-publishable-doc',
        disableClose: true,
        width: '600px',
        data: {
          document: element,
          isUpdate: true,
        },
      })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          this.getTableData();
        }
      });
  }

  displayFnType(value: any) {

    if (value) {
      const list = [...this.dataDocumentType];
      const found = _.find(list, (res) => res.value === value);
      let result = '';
      if (found) {
        result = this.translate.instant(`${found.textPrint}`);
      }
      return result;
    }
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
