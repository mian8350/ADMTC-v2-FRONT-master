import { ParseUtcToLocalPipe } from './../../../shared/pipes/parse-utc-to-local.pipe';
import { TranslateService } from '@ngx-translate/core';
import { Component, OnInit, ViewChild, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { AlertService } from 'app/service/alert-functionality/alert-functionality.service';
import * as _ from 'lodash';
import { SubSink } from 'subsink';
import * as moment from 'moment';
import { ExportCsvService } from 'app/service/export-csv/export-csv.service';
import Swal from 'sweetalert2';
@Component({
  selector: 'ms-alert-user-response-dialog',
  templateUrl: './alert-user-response-dialog.component.html',
  styleUrls: ['./alert-user-response-dialog.component.scss'],
  providers: [ParseUtcToLocalPipe]
})
export class AlertUserResponseDialogComponent implements OnInit {
  displayedColumns: string[] = ['position', 'name'];
  dataSource = new MatTableDataSource([]);
  sortValue = null;
  isWaitingForResponse = false;
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  filteredValues = {
    publication_date: null,
    required_response: null,
    published: null,
    user_type: null,
    name: null,
  };
  exportName: 'Export';
  private subs = new SubSink();
  constructor(
    public dialogRef: MatDialogRef<AlertUserResponseDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public parentData: any,
    private alertService: AlertService,
    private translate: TranslateService,
    private exportCsvService: ExportCsvService,
    private parseUTCToLocalPipe: ParseUtcToLocalPipe) { }

  ngOnInit() {
    if (this.parentData && !this.parentData.required_response) {
      const button1 = this.parentData.button1
      const button2 = this.parentData.button2
      if (this.parentData.responses && this.parentData.responses.length) {
        const respButton1 = this.parentData.responses.filter(alert => alert.response === button1)
        const respButton2 = this.parentData.responses.filter(alert => alert.response === button2)
        this.parentData.responseButton1 = respButton1 ? respButton1.length : 0
        this.parentData.responseButton2 = respButton2 ? respButton2.length : 0
      }
    }

    this.getUserResponse();
  }
  exportData() {
    const data = [];
    if (this.parentData.responses && this.parentData.responses.length) {
      let recipient
      if (this.parentData.recipients && this.parentData.recipients.length) {
        recipient = this.parentData.recipients.map(recp => recp._id)
      }

      this.parentData.responses.forEach(resp => {
        let userType
        let school
        if (resp.user_id && resp.user_id.entities && resp.user_id.entities.length) {
          resp.user_id.entities.forEach(item => {
            if (item.type && item.type._id && item.type.name && recipient.includes(item.type._id)) {
              userType = item.type.name
              school = item.school ? item.school.short_name : ''
            }
          })
        }
        let dateExport
        let timeExport
        if (resp.responsed_at && resp.responsed_at.date && resp.responsed_at.time) {
          const date = this.parseUTCToLocalPipe.transformDate(resp.responsed_at.date, resp.responsed_at.time);
          dateExport = date && date !== 'Invalid date' ? date : resp.responsed_at.date;
          timeExport = this.parseUTCToLocalPipe.transform(resp.responsed_at.time)
        }
        const obj = [];
        obj[0] = resp.user_id && resp.user_id.civility ? this.translate.instant(resp.user_id.civility) : ''
        obj[1] = resp.user_id && resp.user_id.first_name ? resp.user_id.first_name : ''
        obj[2] = resp.user_id && resp.user_id.last_name ? resp.user_id.last_name : ''
        obj[3] = school
        obj[4] = userType ? this.translate.instant('USER_TYPES.' + userType) : ''
        obj[5] = dateExport && timeExport ? dateExport + ' ' + timeExport : ''
        obj[6] = resp.response.replace(/<[^>]*>/g, '')
        data.push(obj);
      })
    }

    const valueRange = { values: data };
    const today = moment().format('DD-MM-YYYY');
    const title = this.exportName + '_' + today;
    const sheetID = this.translate.currentLang === 'en' ? 786167743 : 0;
    const sheetData = {
      spreadsheetId: '1groDZrDaNI6IJySu4ynMzSZUc4KgBZxvRZd7Iix5EM4',
      sheetId: sheetID,
      range: 'A7',
    };
    this.exportCsvService.createAndUpdateSpreadsheet(valueRange, title, sheetData);
    Swal.close();
  }

  getUserResponse() {
    const pagination = {
      limit: 1,
      page: 0,
    };
    this.isWaitingForResponse = true;

    const filter = _.cloneDeep(this.filteredValues);
    this.subs.sink = this.alertService.GetAllAlertFunctionalities(pagination, filter, this.sortValue).subscribe((resp: any) => {

      this.dataSource.data = resp;
      this.isWaitingForResponse = false;
    });
  }

  closeDialog() {
    this.dialogRef.close();
  }
}
