import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import * as _ from 'lodash';
import { SubSink } from 'subsink';

@Component({
  selector: 'ms-dashboard-graphic-charts-school',
  templateUrl: './dashboard-graphic-charts-school.component.html',
  styleUrls: ['./dashboard-graphic-charts-school.component.scss']
})
export class DashboardGraphicChartsSchoolComponent implements OnInit, OnChanges, OnDestroy {
  @Input() rncpId: any;
  @Input() classId: any;

  private subs = new SubSink();

  dataChart = [];
  isDonut = false;
  isWaitingResponse = false;

  constructor(private rncpTitleService: RNCPTitlesService) { }

  ngOnChanges(changes: SimpleChanges): void {
    this.getTitleManagerSchoolSizeGraphic();
  }

  ngOnInit() {
  }

  getTitleManagerSchoolSizeGraphic(){
    this.isWaitingResponse = true;
    this.dataChart = [];
    this.subs.sink = this.rncpTitleService.getTitleManagerSchoolSizeGraphic(this.rncpId, this.classId).subscribe((resp) => {
      this.isWaitingResponse = false;
      if(resp) {
        const data = _.cloneDeep(resp);
        this.dataChart = data.map((respData) => {
          return {
            name: respData.school_id.short_name,
            counter: respData.total_student
          }
        });

      }
    })
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

}
