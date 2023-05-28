import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'ms-president-juries-schedules-table',
  templateUrl: './president-juries-schedules-table.component.html',
  styleUrls: ['./president-juries-schedules-table.component.scss']
})
export class PresidentJuriesSchedulesTableComponent implements OnInit {
  @Input() juryOrgId;
  presidentId;
  globalBackupId;
  isSaved;

  constructor() { }

  ngOnInit() {
  }

  selectPresident(event) {
    this.presidentId = event;
  }

  selectGlobalId(event) {
    this.globalBackupId = event;
  }

  isSavedClicked(event) {
    this.isSaved = event;
  }

}
