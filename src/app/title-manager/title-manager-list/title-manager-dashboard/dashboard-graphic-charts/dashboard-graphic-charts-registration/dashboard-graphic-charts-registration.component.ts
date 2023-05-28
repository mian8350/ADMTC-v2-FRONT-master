import { Component, Input, OnChanges, OnDestroy, OnInit } from '@angular/core';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import { SubSink } from 'subsink';
import * as _ from 'lodash';
@Component({
  selector: 'ms-dashboard-graphic-charts-registration',
  templateUrl: './dashboard-graphic-charts-registration.component.html',
  styleUrls: ['./dashboard-graphic-charts-registration.component.scss']
})
export class DashboardGraphicChartsRegistrationComponent implements OnInit, OnChanges, OnDestroy {
  @Input() classId: string;
  @Input() rncpId: string;
  private subs = new SubSink();
  titleRegistration: any;
  isWaitingResponse: boolean = false;
  dataTitleRegistration = [];
  isWaitingForResponse = false;
  
  constructor(
    private titleRncpService:RNCPTitlesService
  ) { }

  ngOnInit() {
    this.getDataRegistrationChart();
  }

  ngOnChanges() {
    this.getDataRegistrationChart();
  }

  getDataRegistrationChart() {
    this.isWaitingForResponse = true;
    this.dataTitleRegistration = [];
    this.subs.sink = this.titleRncpService.getTitleManagerRegistration(this.rncpId, this.classId).subscribe((resp) => {
      this.isWaitingForResponse = false;
      if (resp) {
        const data = _.cloneDeep(resp);
        const shortData = data.sort((a, b) => a.school_id.short_name.localeCompare(b.school_id.short_name));
        this.dataTitleRegistration = shortData.map((data) => {
          return {
            name:data.school_id.short_name,
            counter: data.completed_registration_count,
            objective: data.total_student
          }
        })

      }
    })
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

}
