import { Component, Input, OnChanges, OnDestroy, OnInit,SimpleChanges } from '@angular/core';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import * as _ from 'lodash';
import { SubSink } from 'subsink';
@Component({
  selector: 'ms-dashboard-graphic-charts-task',
  templateUrl: './dashboard-graphic-charts-task.component.html',
  styleUrls: ['./dashboard-graphic-charts-task.component.scss']
})
export class DashboardGraphicChartsTaskComponent implements OnInit, OnChanges, OnDestroy {
  @Input() classId: string;
  @Input() rncpId: string;

  private subs = new SubSink();

  dataChart = [];
  isDonut = true;
  isWaitingResponse = false;
  
  constructor(private rncpTitleService: RNCPTitlesService) { }

  ngOnChanges(changes: SimpleChanges): void {
    this.getTitleManagerTaskGraphic();
  }

  ngOnInit() {
  }

  getTitleManagerTaskGraphic(){
    this.isWaitingResponse = true;
    this.dataChart = [];
    this.subs.sink = this.rncpTitleService.getTitleManagerTaskGraphic(this.rncpId, this.classId).subscribe((resp) => {
      this.isWaitingResponse = false;
      if(resp) {
        const data = _.cloneDeep(resp);
        this.dataChart = data.map((respData) => {
          return {
            name: respData.school_id.short_name,
            counter: respData.total_task_late
          }
        });

      }
    })
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
