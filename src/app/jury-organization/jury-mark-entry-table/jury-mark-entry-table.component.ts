import { Component, ViewChild, OnInit, AfterViewInit } from '@angular/core';
import { SubSink } from 'subsink';
import { SelectionModel } from '@angular/cdk/collections';
import { DateAdapter } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { JuryOrganizationService } from 'app/service/jury-organization/jury-organization.service';
import { ActivatedRoute } from '@angular/router';
import { JuryOrganizationParameter } from 'app/title-rncp/conditions/jury-organization-parameter/jury-organization-parameter.model';
import * as _ from 'lodash';
import { UtilityService } from 'app/service/utility/utility.service';
import * as moment from 'moment';
import { ParseUtcToLocalPipe } from 'app/shared/pipes/parse-utc-to-local.pipe';
import Swal from 'sweetalert2';
import { TranslateService } from '@ngx-translate/core';
import { ApplicationUrls } from 'app/shared/settings';
import { UntypedFormControl } from '@angular/forms';
import { debounceTime, map, startWith, tap } from 'rxjs/operators';
import { ParseLocalToUtcPipe } from 'app/shared/pipes/parse-local-to-utc.pipe';
import { environment } from 'environments/environment';
import { UserEmailDialogComponent } from 'app/users/user-email-dialog/user-email-dialog.component';
@Component({
  selector: 'ms-jury-mark-entry-table',
  templateUrl: './jury-mark-entry-table.component.html',
  styleUrls: ['./jury-mark-entry-table.component.scss'],
  providers: [ParseUtcToLocalPipe, ParseLocalToUtcPipe],
})
export class JuryMarkEntryTableComponent implements OnInit, AfterViewInit {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  blockMatrix: boolean[][] = [];
  sortValue = null;
  juryOrgId;
  private subs = new SubSink();
  selection = new SelectionModel(true, []);

  isReset = false;
  dataLoaded = false;
  noData : any;

  isCheckedAll = false;
  selectType: any;
  userSelected: any[];
  userSelectedId: any[];

  @ViewChild(MatSort, { static: true }) sort: MatSort;
  displayedColumns: string[] = ['check', 'student', 'school', 'corrected', 'status', 'action'];
  filterColumns: string[] = [
    'checkFilter',
    'studentFilter',
    'schoolFilter',
    'correctedFilter',
    'statusFilter',
    'actionFilter',
  ];
  filteredValues = {
    school: '',
    name_of_participant: '',
    offset: moment().utcOffset(),
    mark_entry_status: null,
    block: null,
    corrected_by: '',
  };

  dataCount;
  dataSource = new MatTableDataSource([]);
  isLoadingTable: boolean;

  juryBlocks: string[] = [];
  specializationBlock: string[] = [];
  allDataBlock: string[] = []; 
  blockForms = {};
  blockSpecializationForms = {}

  blockFilterDropdown = [
    { value: true, viewValue: 'Evaluated' },
    { value: false, viewValue: 'Not Evaluated' },
  ];

  statusFilterDropdown = [
    { value: 'green', viewValue: 'Validated' },
    { value: 'purple', viewValue: 'Submitted' },
    { value: 'orange', viewValue: 'In Progress' },
    { value: 'red', viewValue: 'Not Submitted' },
  ];

  serverimgPath = `${ApplicationUrls.baseApi}/fileuploads/`.replace('/graphql', '');
  isUserADMTC;
  isPresidentJury;
  isCertifierAdmin;
  juryOrganization: JuryOrganizationParameter;

  schoolList = [];
  studentFilter = new UntypedFormControl(null);
  schoolFilter = new UntypedFormControl(null);
  dateFilter = new UntypedFormControl('');
  timeFilter = new UntypedFormControl('');
  statusFilter = new UntypedFormControl(null);
  correctedFilter = new UntypedFormControl(null);
  isJuryCorector: any;
  isWaitingResponse = false;
  isAllowDisplayJuryKitCurrentUser: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private juryOrganizationService: JuryOrganizationService,
    private utilService: UtilityService,
    private parseUtcToLocal: ParseUtcToLocalPipe,
    private translate: TranslateService,
    private parseLocalToUTC: ParseLocalToUtcPipe,
    public dialog: MatDialog,
  ) {}

  ngOnInit() {
    this.isPresidentJury = this.utilService.isUserPresidentOfJury();
    this.isUserADMTC = this.utilService.isUserEntityADMTC();
    this.isCertifierAdmin = this.utilService.isUserCRDirAdmin();
    this.isJuryCorector = this.utilService.isUserJuryCorrector();
    
    this.juryOrgId = this.route.snapshot.parent.paramMap.get('juryOrgId');

    this.allowDisplayJuryKitCurrentUser();

    this.getMarkEntryData();
    this.getSchoolTableDropdown();
    this.initFilter();
  }

  ngAfterViewInit() {
    this.subs.sink = this.paginator.page
      .pipe(
        startWith(null),
        tap(() => {
          if (this.juryOrgId) {
            this.fetchData();
          }
        }),
      )
      .subscribe();
  }

  masterToggle() {
    this.isAllSelected() ? this.selection.clear() : this.dataSource.data.forEach((row) => this.selection.select(row));
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  checkboxLabel(element?): string {
    if (!element) {
      return `${this.isAllSelected() ? 'select' : 'deselect'} all`;
    }
    return `${this.selection.isSelected(element) ? 'deselect' : 'select'} row ${element.position + 1}`;
  }

  showOptions(info) {
    const numSelected = this.selection.selected.length;
    if (numSelected > 0) {
    } else {
    }
    this.selectType = info;
    const data = this.selection.selected;
    this.userSelected = [];
    this.userSelectedId = [];
    data.forEach((user) => {
      this.userSelected.push(user);
      this.userSelectedId.push(user._id);
    });
  }

  getSchoolTableDropdown() {
    this.subs.sink = this.juryOrganizationService
      .getJuriesSchedulesDropdown(this.utilService.getCurrentUserType(), this.filteredValues, this.juryOrgId)
      .subscribe((resp) => {
        if (resp) {
          this.schoolList = resp['schools'].filter((school) => school && school._id);
          this.schoolList = _.uniqBy(this.schoolList, '_id');
          this.schoolList = _.sortBy(this.schoolList, 'short_name')
        }
      });
  }

  getMarkEntryData() {
    this.subs.sink = this.juryOrganizationService.getOneJuryOrganizationDataById(this.juryOrgId).subscribe((resp) => {
      this.juryOrganization = _.cloneDeep(resp);

      resp.rncp_titles[0].blocks_for_grand_oral.map((block) => {
        if (block?.block_id?.is_specialization) {
          this.specializationBlock = [...this.specializationBlock, block.block_id._id];
        } else {
          this.juryBlocks = [...this.juryBlocks, block.block_id._id];
        }
        this.allDataBlock.push(block.block_id._id);
      });
      if (this.juryBlocks.length) {
        this.juryBlocks.forEach((block, index) => {
          this.blockForms[`B${index}`] = '';
        });
      }
      if (this.specializationBlock.length) {
        this.specializationBlock.forEach((block, index) => {
          this.blockSpecializationForms[`S${index}`] = '';
        });
      }
      this.setUpBlockColumns(this.juryBlocks, this.specializationBlock);
      this.fetchData();
    });
  }

  fetchData() {
    const data = {
      user_type_login_id: this.utilService.getCurrentUserType(),
      jury_id: this.juryOrgId,
      student_id: null,
    };
    const pagination = {
      limit: this.paginator.pageSize ? this.paginator.pageSize : 10,
      page: this.paginator.pageIndex ? this.paginator.pageIndex : 0,
    };
    this.isLoadingTable = true;
    this.subs.sink = this.juryOrganizationService
      .getJuryMarkEntry(data.user_type_login_id, data.jury_id, pagination, data.student_id, this.sortValue, this.filteredValues)
      .subscribe((resp) => {
        if (resp && resp.length) {
          const markEntryData = _.cloneDeep(resp);

          markEntryData.forEach((entry) => {
            if (entry && entry.grand_oral_correction_id) {
              const time = entry.grand_oral_correction_id.last_submit_by;
              if (time && time.date && time.time) {
                entry.grand_oral_correction_id.last_submit_by.utcDate = time.date;
                entry.grand_oral_correction_id.last_submit_by.utcTime = time.time;
                entry.grand_oral_correction_id.last_submit_by.date = this.parseUtcToLocal.transformDate(time.date, time.time);
                entry.grand_oral_correction_id.last_submit_by.time = this.parseUtcToLocal.transformDateInDateFormat(time.date, time.time);
                entry.grand_oral_correction_id.last_submit_by.time = moment(entry.grand_oral_correction_id.last_submit_by.time).format(
                  'HH:mm',
                );
              }
            }
          });

          if (markEntryData && markEntryData.length) {
            this.constructBlockMatrix(markEntryData);

            this.dataSource.data = markEntryData;
            this.dataCount = markEntryData[0] && markEntryData[0].count_document ? markEntryData[0].count_document : 0;
            this.isLoadingTable = false;
          }
        } else {
          this.dataSource.data = [];
          this.dataCount = 0;
          this.isLoadingTable = false;
          this.noData = this.dataSource.connect().pipe(map((data) => data.length === 0));
        }
      });
  }

  convertUTCToLocalDate(data) {
    const date = moment(data.date).format('DD/MM/YYYY');
    const time = data.time_start;

    const dateTimeInLocal = moment(date + time, 'DD/MM/YYYYHH:mm');
    return dateTimeInLocal.toISOString();
  }

  setUpBlockColumns(blocks: any[], specialBlocks: string[]) {
    this.displayedColumns = ['check', 'student', 'school', 'corrected', 'status', 'action'];
    this.filterColumns = [
      'checkFilter',
      'studentFilter',
      'schoolFilter',
      'correctedFilter',
      'statusFilter',
      'actionFilter',
    ];
    blocks.forEach((element, index) => {
      this.displayedColumns.splice(3 + index, 0, `B${index + 1}`);
      this.filterColumns.splice(3 + index, 0, `B${index + 1}_filter`);
    });
    specialBlocks.forEach((element, index) => {
      this.displayedColumns.splice(3 + blocks.length + index, 0, `S${index + 1}`);
      this.filterColumns.splice(3 + blocks.length + index, 0, `S${index + 1}_filter`);
    });
  }

  constructBlockMatrix(resp) {
    resp.forEach((element, index) => {
      const boolArray: any[] = this.allDataBlock.map((block, blockIndex) => this.isBlockChecked(element.blocks_for_grand_oral, blockIndex));
      this.blockMatrix[index] = boolArray;
    });
    
  }

  isBlockChecked(elementBlocks: any[], index: number) {
    if (!elementBlocks || !elementBlocks.length) {
      return false;
    }
    const blockIds = elementBlocks.map((block) => block.block_id._id); // get per schedule block ids
    const isFoundIndex = blockIds.indexOf(this.allDataBlock[index]); // check if the current juryBlock id is in the schedule blocks by getting index


    // If type is grand oral, meaning we read from is_selected, if retake_grand_oral mean we read from retaking
    if (this.juryOrganization?.type === "grand_oral") {
      if (
        isFoundIndex >= 0 &&
        elementBlocks[isFoundIndex] &&
        elementBlocks[isFoundIndex].is_selected &&
        !elementBlocks[isFoundIndex].is_exempted
      ) {
        return 'selected';
      } else if (
        isFoundIndex >= 0 &&
        elementBlocks[isFoundIndex] &&
        !elementBlocks[isFoundIndex].is_selected &&
        !elementBlocks[isFoundIndex].is_exempted
      ) {
        return 'not_selected';
      } else if (
        isFoundIndex >= 0 &&
        elementBlocks[isFoundIndex] &&
        elementBlocks[isFoundIndex].is_selected &&
        elementBlocks[isFoundIndex].is_exempted
      ) {
        return 'exempted';
      } else {
        return 'not_selected';
      }
    } else if (this.juryOrganization?.type === "retake_grand_oral") {
      if (
        isFoundIndex >= 0 &&
        elementBlocks[isFoundIndex] &&
        elementBlocks[isFoundIndex].is_retaking &&
        !elementBlocks[isFoundIndex].is_exempted
      ) {
        return 'selected';
      } else {
        return 'not_selected';
      }
    }
  }

  checkPDFGrandOral(data) {
    let checked = false;
    if (data.jury_organization_id && data.jury_organization_id._id) {
      if (
        data &&
        data.students &&
        data.students.student_id &&
        data.students.student_id.grand_oral_pdfs &&
        data.students.student_id.grand_oral_pdfs.length
      ) {
        const grandOralPDF = data.students.student_id.grand_oral_pdfs.filter(
          (list) => list.grand_oral_id._id === data.jury_organization_id._id,
        );

        if (grandOralPDF && grandOralPDF.length && grandOralPDF[0].grand_oral_pdf_jury) {
          checked = true;
        } else {
          checked = false;
        }
      }
    }

    return checked;
  }

  generatePDFGrandOral(data) {

    if (data.jury_organization_id && data.jury_organization_id._id) {
      if (
        data &&
        data.students &&
        data.students.student_id &&
        data.students.student_id.grand_oral_pdfs &&
        data.students.student_id.grand_oral_pdfs.length
      ) {
        const grandOralPDF = data.students.student_id.grand_oral_pdfs.filter(
          (list) => list.grand_oral_id._id === data.jury_organization_id._id,
        );
        if (grandOralPDF && grandOralPDF.length && grandOralPDF[0].grand_oral_pdf_jury) {
          const element = document.createElement('a');
          element.href = this.serverimgPath + grandOralPDF[0].grand_oral_pdf_jury;
          element.target = '_blank';
          element.setAttribute('download', data);
          element.click();
        } else {
          Swal.fire({
            type: 'error',
            title: this.translate.instant('NOT RECORD FOUND'),
            confirmButtonText: this.translate.instant('JURY_ORGANIZATION.JURY_MARK_ERROR.BUTTON'),
          });
        }
      }
    }
  }

  openDocAcadRecomendation(data){
    if (data.academic_recommendation_document_id) {
      const url = `${environment.apiUrl}/fileuploads/${data.academic_recommendation_document_id.s3_file_name}?download=true`.replace('/graphql', '');
      window.open(url, '_blank');
    }
  }

  checkGrandOralStatus(element) {
    if (element.mark_entry_task_status === 'validated') {
      return '#adff2f';
    } else if (element.mark_entry_task_status === 'done') {
      return '#AA00FF';
    } else if (element.mark_entry_task_status === 'in_progress') {
      return '#ff7600';
    } else if (element.mark_entry_task_status === 'todo') {
      return '#ff4a4a';
    }
  }

  goToMarkEntryGrandOral(row) {

    const taskId = row.mark_entry_assigned.task_id;
    const markEntryTaskStatus = row.mark_entry_task_status.toLowerCase();

    const correctorGO =
      taskId &&
      taskId._id &&
      markEntryTaskStatus &&
      (markEntryTaskStatus === 'todo' || markEntryTaskStatus === 'in_progress') &&
      (this.isPresidentJury || this.isJuryCorector);

    const certifier =
      taskId &&
      taskId._id &&
      markEntryTaskStatus &&
      this.isCertifierAdmin;
  
    if (this.isUserADMTC || correctorGO || certifier) {
      window.open(`./grand-oral?juryId=${row.jury_organization_id._id}&studentId=${row.students.student_id._id}`, '_blank');
    } else {
      Swal.fire({
        type: 'error',
        title: this.translate.instant('JURY_ORGANIZATION.JURY_MARK_ERROR.TITLE'),
        html: this.translate.instant('JURY_ORGANIZATION.JURY_MARK_ERROR.TEXT'),
        footer: `<span style="margin-left: auto">JURY_MARK_ERROR</span>`,
        confirmButtonText: this.translate.instant('JURY_ORGANIZATION.JURY_MARK_ERROR.BUTTON'),
      });
    }
  }

  initFilter() {
    this.subs.sink = this.studentFilter.valueChanges.pipe(debounceTime(300)).subscribe((searchText) => {

      this.paginator.pageIndex = 0;
      this.filteredValues.name_of_participant = searchText;
      this.fetchData();
    });

    this.subs.sink = this.statusFilter.valueChanges.subscribe((status) => {
      this.filteredValues.mark_entry_status = status ? status : null;
      this.paginator.pageIndex = 0;
      this.fetchData();
    });

    this.subs.sink = this.correctedFilter.valueChanges.pipe(debounceTime(300)).subscribe((cor) => {
      this.paginator.pageIndex = 0;
      this.filteredValues.corrected_by = cor;
      this.fetchData();
    });
  }

  selectSchool() {
    this.filteredValues.school = this.schoolFilter.value ? this.schoolFilter.value : null;
    this.paginator.pageIndex = 0;
    this.fetchData();
  }

  updateFilterBlockValue(id: string, status: any) {
    let blocks = this.filteredValues.block ? [...this.filteredValues.block] : [];
    const indexOfBlock = blocks.findIndex((block) => block && block.block_id && block.block_id === id);
    if (indexOfBlock >= 0) {
      blocks.splice(indexOfBlock, 1);
    }
    if (status && status.value !== '') {
      blocks.push({
        block_id: id,
        block_status: status.value,
      });
    }
    this.filteredValues.block = blocks;
    this.fetchData();
  }

  sortData(sort: Sort) {
    if (sort.active.split('-')[0] === 'block') {
      this.sortValue = sort.direction ? { block_id: sort.active.split('-')[2], block_status: sort.direction ? sort.direction : `asc` } : null;
    } else {
      this.sortValue = sort.direction ? { [sort.active]: sort.direction ? sort.direction : `asc` } : null;
    }
    this.paginator.pageIndex = 0;
    this.fetchData();
  }

  resetAllFilter() {
    this.paginator.pageIndex = 0;
    this.sortValue = null;

    this.filteredValues = {
      school: '',
      name_of_participant: '',
      offset: moment().utcOffset(),
      mark_entry_status: null,
      block: null,
      corrected_by: '',
    };
    for (const key of Object.keys(this.blockForms)) {
      this.blockForms[key] = '';
    }
    for (const key of Object.keys(this.blockSpecializationForms)) {
      this.blockSpecializationForms[key] = '';
    }
    this.sort.direction = '';
    this.sort.active = '';
    this.sort.sortChange.emit({active: '', direction: ''});
    this.sortValue = null;
    this.studentFilter.setValue(null, { emitEvent: false });
    this.schoolFilter.setValue(null, { emitEvent: false });
    this.dateFilter.setValue('', { emitEvent: false });
    this.timeFilter.setValue('', { emitEvent: false });
    this.statusFilter.setValue(null, { emitEvent: false });
    this.correctedFilter.setValue(null, { emitEvent: false });
    this.fetchData();
  }

  downloadJuryKit() {
    // download here
    this.isWaitingResponse = true;
    this.subs.sink = this.juryOrganizationService.getSurvivalKitZipUrl(this.juryOrgId).subscribe(
      (resp) => {

        if (resp) {
          this.downloadFile(resp);
        }
        this.isWaitingResponse = false;
      },
      (err) => {
        this.isWaitingResponse = false;

        Swal.fire({
          type: 'error',
          title: 'Error',
          text: err && err['message'] ? err['message'] : err,
          confirmButtonText: 'OK',
        });
      },
    );
  }

  sendMail(data) {
    this.subs.sink = this.dialog.open(UserEmailDialogComponent, {
      disableClose: true,
      width: '750px',
      data: { ...data, sendToCorrector: true },
    }).afterClosed().subscribe(() => {});
  }

  downloadFile(fileUrl: string) {
    const a = document.createElement('a');
    a.target = 'blank';
    a.href = `${environment.apiUrl}/fileuploads/${fileUrl}?download=true`.replace('/graphql', '');
    a.download = fileUrl;
    a.click();
    a.remove();
  }

  downloadPreviousGrandOral(fileUrl: any) {

    const a = document.createElement('a');
    a.target = 'blank';
    a.href = `${environment.apiUrl}/fileuploads/${fileUrl}?download=true`.replace('/graphql', '');
    a.click();
    a.remove();
  }


  panic() {
    const currentUser = this.utilService.getCurrentUser();
    const whatsAppUrl = 'https://api.whatsapp.com/send?phone=6593722206&text=';
    let whatsAppText = '';
    if (this.isUserADMTC) {
      whatsAppText = this.translate.instant('PANIC.MESSAGE_ADMTC', {
        userName: `${this.translate.instant(currentUser.civility)} ${currentUser.first_name} ${currentUser.last_name}`,
        userType:
          currentUser.entities && currentUser.entities[0] && currentUser.entities[0].type && currentUser.entities[0].type.name
            ? this.translate.instant(currentUser.entities[0].type.name)
            : '',
        juryName: this.juryOrganization.name,
      });
    } else {
      whatsAppText = this.translate.instant('PANIC.MESSAGE', {
        userName: `${this.translate.instant(currentUser.civility)} ${currentUser.first_name} ${currentUser.last_name}`,
        userType:
          currentUser.entities && currentUser.entities[0] && currentUser.entities[0].type && currentUser.entities[0].type.name
            ? this.translate.instant(currentUser.entities[0].type.name)
            : '',
        school:
          currentUser.entities && currentUser.entities[0] && currentUser.entities[0].school && currentUser.entities[0].school.short_name
            ? currentUser.entities[0].school.short_name
            : '',
        juryName: this.juryOrganization.name,
      });
    }


    window.open(whatsAppUrl + whatsAppText, '_blank');
  }

  allowDisplayJuryKitCurrentUser() {
    this.subs.sink = this.juryOrganizationService.allowDisplayJuryKitCurrentUser(this.juryOrgId).subscribe((resp) => {
      if(resp) { 
        this.isAllowDisplayJuryKitCurrentUser = resp;
      }
    });
  }
}
