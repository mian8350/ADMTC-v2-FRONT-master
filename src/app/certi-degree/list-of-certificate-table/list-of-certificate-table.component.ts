import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Observable } from 'rxjs';
import { CertidegreeService } from 'app/service/certidegree/certidegree.service';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import { UtilityService } from 'app/service/utility/utility.service';
import { of } from 'rxjs';
import { debounceTime, map, startWith, tap } from 'rxjs/operators';
import { SubSink } from 'subsink';
import { CertificateIssuanceProcessDialogComponent } from './certificate-issuance-process-dialog/certificate-issuance-process-dialog.component';
import * as _ from 'lodash';
import { ActivatedRoute, Router } from '@angular/router';
import { PermissionService } from 'app/service/permission/permission.service';
import Swal from 'sweetalert2';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from 'app/service/auth-service/auth.service';
import { PageTitleService } from 'app/core/page-title/page-title.service';

@Component({
  selector: 'ms-list-of-certificate-table',
  templateUrl: './list-of-certificate-table.component.html',
  styleUrls: ['./list-of-certificate-table.component.scss'],
})
export class ListOfCertificateTableComponent implements OnInit, OnDestroy, AfterViewInit {
  dataSource = new MatTableDataSource([]);
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;

  displayedColumns: string[] = ['rncp_title', 'class', 'certifier', 'corrected_final_transcript_process', 'status', 'action'];
  filterColumns: string[] = [
    'titleFilter',
    'classFilter',
    'certifierFilter',
    'corrected_final_transcript_process_filter',
    'statusFilter',
    'actionFilter',
  ];

  titleFilter = new UntypedFormControl('');
  classFilter = new UntypedFormControl('');
  certifierFilter = new UntypedFormControl('');
  transcriptFilter = new UntypedFormControl('');
  statusFilter = new UntypedFormControl('');

  private subs = new SubSink();
  noData: any;
  isWaitingForResponse = false;
  isLoading = false;
  dataCount: any;
  currentIndex = 0;
  filteredValues = {
    rncp_id: null,
    class_id: null,
    certifier_school_id: null,
    transcript_process_id: null,
  };
  rncpTitleFilterList: any[];
  filteredRncpTitle: Observable<any[]>;
  classFilterList: any[];
  filteredClasses: Observable<any[]>;
  certifierFilterList: any[];
  filteredCertifier: Observable<any[]>;
  transcriptFilterList: any[];
  filteredTranscript: Observable<any[]>;
  statusFilterList = [
    {
      value: 'AllS',
      name: 'All',
    },
    {
      value: 'in_process',
      name: 'Partial student certificate is published',
    },
    {
      value: 'not_completed',
      name: 'No Certificate published to student',
    },
    {
      value: 'completed',
      name: 'All Student certificate is published',
    },
  ];
  filteredStatus: Observable<any[]>;
  titleList = [];
  classList = [];

  sortValue: { [x: string]: 'asc' | 'desc' };

  constructor(
    public dialog: MatDialog,
    private certidegreeService: CertidegreeService,
    private utilService: UtilityService,
    private titleService: RNCPTitlesService,
    private router: Router,
    private route: ActivatedRoute,
    public permissionService: PermissionService,
    private translate: TranslateService,
    private authService: AuthService,
    private pageTitleService: PageTitleService
  ) {}

  ngOnInit() {
    this.pageTitleService.setTitle('List of CertiDegree');
    this.populateTableData();
    // this.setUpFiltersChangeListeners();
    this.getAllTitlesDropdown();
    this.getAllClassesDropdown();
    this.getAllDropdown();
  }

  ngAfterViewInit() {
    // this.dataSource.sort = this.sort;
    this.subs.sink = this.paginator.page
      .pipe(
        startWith(null),
        tap(() => {
          this.populateTableData();
        }),
      )
      .subscribe();
  }

  populateTableData() {
    this.isWaitingForResponse = true;
    const pagination = {
      limit: this.paginator.pageSize ? this.paginator.pageSize : 10,
      page: this.paginator.pageIndex ? this.paginator.pageIndex : 0,
    };
    this.subs.sink = this.certidegreeService.GetAllCertificateIssuanceProcess(pagination, this.filteredValues, this.sortValue).subscribe(
      (resp) => {
        this.isWaitingForResponse = false;

        this.dataSource.data = resp;
        this.paginator.length = resp && resp[0] && resp[0].count_document ? resp[0].count_document : 0;
        this.dataCount = resp && resp[0] && resp[0].count_document ? resp[0].count_document : 0;
        this.noData = this.dataSource.connect().pipe(map((data) => data.length === 0));
      },
      (err) => {
        this.isWaitingForResponse = false;
        this.authService.postErrorLog(err);
      },
    );
  }

  // Two function below to set the filter and repopulate table data on selection click
  setTitleFilter(title) {
    this.filteredValues.rncp_id = title !== 'AllS' ? title._id : '';
    this.filteredValues.class_id = '';
    this.paginator.pageIndex = 0;
    this.populateTableData();
  }

  setClassFilter(classId) {
    this.filteredValues.class_id = classId !== 'AllS' ? classId : '';
    this.paginator.pageIndex = 0;
    this.populateTableData();
  }

  setCertifierFilter(certifierId) {
    this.filteredValues.certifier_school_id = certifierId !== 'AllS' ? certifierId : '';
    this.paginator.pageIndex = 0;
    this.populateTableData();
  }

  setTranscriptFilter(value) {
    this.filteredValues.transcript_process_id = value !== 'AllS' ? value : '';
    this.paginator.pageIndex = 0;
    this.populateTableData();
  }

  setStatusFilter(value) {
    if (value !== 'AllS') {
      this.filteredValues['certificate_process_status'] = value;
    } else {
      delete this.filteredValues['certificate_process_status'];
    }
    this.paginator.pageIndex = 0;
    this.populateTableData();
  }

  sortData(sort: Sort) {
    this.sortValue = sort.direction ? { [sort.active]: sort.direction ? sort.direction : `asc` } : null;
    this.paginator.pageIndex = 0;
    this.populateTableData();
  }

  addCertificateIssuance() {
    this.dialog
      .open(CertificateIssuanceProcessDialogComponent, {
        disableClose: true,
        width: '650px',
        panelClass: 'certification-rule-pop-up',
        autoFocus: false,
        data: {
          titles: this.titleList,
          classes: this.classList,
        },
      })
      .afterClosed()
      .subscribe((data?: any) => {
        if (data) {

          this.isLoading = true;
          this.subs.sink = this.certidegreeService.createCertificateIssuanceProcess(data.payload).subscribe(
            (resp) => {
              this.isLoading = false;
              // TO DO: Show SWAL on success adding payload
              Swal.fire({
                type: 'success',
                title: this.translate.instant('Bravo !'),
              }).then(() => {
                this.router.navigate(['/certidegree/', resp.data.CreateCertificateIssuanceProcess._id]);
              });
              this.populateTableData();

            },
            (error) => {
              this.isLoading = false;

              // TO DO: Show SWAL if error
              if (error['message'] === 'GraphQL error: Certificate Issuance Process already exists for this class') {
                Swal.fire({
                  allowOutsideClick: false,
                  type: 'error',
                  title: this.translate.instant('CERTIFICATE_ISSUANCE.CREATE_CERT_S2.TITLE'),
                  html: this.translate.instant('CERTIFICATE_ISSUANCE.CREATE_CERT_S2.TEXT', {
                    rncpTitle: data.selectedTitleName,
                    className: data.selectedClassName,
                  }),
                  confirmButtonText: this.translate.instant('CERTIFICATE_ISSUANCE.CREATE_CERT_S2.BTN'),
                });
              };
              if (error['message'] === 'GraphQL error: Final transcript process does not exists') {
                Swal.fire({
                  allowOutsideClick: false,
                  type: 'error',
                  title: this.translate.instant('CERTIFICATE_ISSUANCE.CREATE_CERT_S1.TITLE'),
                  html: this.translate.instant('CERTIFICATE_ISSUANCE.CREATE_CERT_S1.TEXT', {
                    rncpTitle: data.selectedTitleName,
                    className: data.selectedClassName,
                  }),
                  confirmButtonText: this.translate.instant('CERTIFICATE_ISSUANCE.CREATE_CERT_S1.BTN'),
                });
              }
              // if (error === '')
              // Swal.fire({
              //   type: 'error',
              //   title: this.translate.instant('There is no final transcript process for this title and class')
              // })
              return;
            },
          );
        }
      });
  }

  resetAllFilter() {
    this.filteredValues = {
      rncp_id: '',
      class_id: '',
      certifier_school_id: '',
      transcript_process_id: '',
    };

    this.titleFilter.setValue('', { emitEvent: false });
    this.classFilter.setValue('', { emitEvent: false });
    this.certifierFilter.setValue('', { emitEvent: false });
    this.transcriptFilter.setValue('', { emitEvent: false });
    this.statusFilter.setValue('', { emitEvent: false });
    this.paginator.pageIndex = 0;

    this.populateTableData();
    this.getAllDropdown();
    // this.dataSource.filter = JSON.stringify(this.filteredValues);
  }

  goToCertificateProcessDetail(process) {
    this.router.navigate([process._id], { relativeTo: this.route });
  }

  onDeleteCertificateProcess(process) {
    if (!process && !process._id) {
      return;
    }
    const title = process.rncp_id.short_name + ' - ' + process.class_id.name;
    let timeDisabled = 5;
    Swal.fire({
      title: this.translate.instant('CERT_S10.Title'),
      text: this.translate.instant('CERT_S10.Text', { title }),
      type: 'warning',
      allowEscapeKey: true,
      showCancelButton: true,
      confirmButtonText: this.translate.instant('CERT_S10.BUTTON1'),
      cancelButtonText: this.translate.instant('CERT_S10.BUTTON2'),
      onOpen: () => {
        Swal.disableConfirmButton();
        const confirmBtnRef = Swal.getConfirmButton();
        const time = setInterval(() => {
          timeDisabled -= 1;
          confirmBtnRef.innerText = this.translate.instant('CERT_S10.BUTTON1') + ` (${timeDisabled})`;
        }, 1000);

        setTimeout(() => {
          confirmBtnRef.innerText = this.translate.instant('CERT_S10.BUTTON1');
          Swal.enableConfirmButton();
          clearTimeout(time);
        }, timeDisabled * 1000);
      },
    }).then((result) => {
      if (result.value) {
        this.isWaitingForResponse = true;
        this.subs.sink = this.certidegreeService.deleteCertificateIssuanceProcess(process._id).subscribe(
          (resp) => {
            this.isWaitingForResponse = false;
            Swal.fire({
              type: 'success',
              title: this.translate.instant('Bravo !'),
            });
            this.populateTableData();
          },
          (err) => {
            this.isWaitingForResponse = false;
            this.authService.postErrorLog(err);

          },
        );
      }
    });
  }

  getAllDropdown() {
    this.subs.sink = this.certidegreeService.getCertificateIssuanceProcessDropdown().subscribe((res) => {
      if (res) {
        if (res.rncp_titles) {
          this.rncpTitleFilterList = _.cloneDeep(res.rncp_titles);
          this.filteredRncpTitle = this.titleFilter.valueChanges.pipe(
            startWith(''),
            map((searchText) =>
              this.rncpTitleFilterList
                .filter((title) => {
                  if (searchText) {
                    return title.short_name.toLowerCase().includes(searchText.toLowerCase());
                  }
                  return true;
                })
                .sort((a: any, b: any) => a.short_name.localeCompare(b.short_name)),
            ),
          );
        }
        if (res.classes) {
          this.classFilterList = _.cloneDeep(res.classes);
          this.filteredClasses = this.classFilter.valueChanges.pipe(
            startWith(''),
            map((searchText) =>
              this.classFilterList
                .filter((classes) => {
                  if (searchText) {
                    return classes.name.toLowerCase().includes(searchText.toLowerCase());
                  }
                  return true;
                })
                .sort((a: any, b: any) => a.name.localeCompare(b.name)),
            ),
          );
        }
        if (res.certifier_schools) {
          this.certifierFilterList = _.cloneDeep(res.certifier_schools);
          this.filteredCertifier = this.certifierFilter.valueChanges.pipe(
            startWith(''),
            map((searchText) =>
              this.certifierFilterList
                .filter((certifier) => {
                  if (searchText) {
                    return certifier.short_name.toLowerCase().includes(searchText.toLowerCase());
                  }
                  return true;
                })
                .sort((a: any, b: any) => a.short_name.localeCompare(b.short_name)),
            ),
          );
        }
        if (res.transcript_processes) {
          this.transcriptFilterList = _.cloneDeep(res.transcript_processes);
          this.filteredTranscript = this.transcriptFilter.valueChanges.pipe(
            startWith(''),
            map((searchText) =>
              this.transcriptFilterList
                .filter((transcript) => {
                  if (searchText) {
                    return transcript.name.toLowerCase().includes(searchText.toLowerCase());
                  }
                  return true;
                })
                .sort((a: any, b: any) => a.name.localeCompare(b.name)),
            ),
          );
        }
        this.filteredStatus = this.statusFilter.valueChanges.pipe(
          startWith(''),
          map((searchText) =>
            this.statusFilterList
              .filter((status) => {
                if (searchText) {
                  return this.translate
                    .instant('status_047.' + status.name)
                    .toLowerCase()
                    .includes(searchText.toLowerCase());
                }
                return true;
              })
              .sort((a: any, b: any) => a.name.localeCompare(b.name)),
          ),
        );
      }
    });
  }

  getAllTitlesDropdown() {
    this.isWaitingForResponse = true;
    this.subs.sink = this.titleService.getAllTitleWithClasses().subscribe(
      (resp) => {
        this.titleList = _.cloneDeep(resp);
      },
      (err) => {
        this.isWaitingForResponse = false;
        this.authService.postErrorLog(err);
      },
    );
  }

  displayFnType(value: any) {

    if (value) {
      const list = [...this.statusFilterList];
      const found = _.find(list, (res) => res.value === value);
      let result = '';
      if (found) {
        result = this.translate.instant(`status_047.${found.name}`);
      }
      return result;
    }
  }

  getAllClassesDropdown() {
    this.isWaitingForResponse = true;
    this.subs.sink = this.titleService.getClasses().subscribe(
      (resp) => {
        this.classList = _.cloneDeep(resp);
      },
      (err) => {
        this.isWaitingForResponse = false;
        this.authService.postErrorLog(err);
      },
    );
  }

  ngOnDestroy() {
    this.pageTitleService.setTitle('');
    this.subs.unsubscribe();
  }
}
