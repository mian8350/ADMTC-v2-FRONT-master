import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import { SubSink } from 'subsink';
import * as _ from 'lodash';
@Component({
  selector: 'ms-dashboard-graphic-charts-company',
  templateUrl: './dashboard-graphic-charts-company.component.html',
  styleUrls: ['./dashboard-graphic-charts-company.component.scss']
})
export class DashboardGraphicChartsCompanyComponent implements OnInit, OnChanges, OnDestroy{
  @Input() classId: string;
  @Input() rncpId: string;

  private subs = new SubSink();

  isWaitingResponse: boolean = false;
  isDonut: boolean = false;
  dataChart = [];
  totalStudent;

  constructor(private rncpTitleService: RNCPTitlesService) { }

  ngOnChanges(changes: SimpleChanges) {
    this.getTitleManagerCompanyGraphic();

  }

  ngOnInit() {
  }

  getTitleManagerCompanyGraphic(){
    this.isWaitingResponse = true;
    this.dataChart = [];
    this.subs.sink = this.rncpTitleService.getTitleManagerCompanyGraphic(this.rncpId, this.classId).subscribe((resp) => {
      this.isWaitingResponse = false;
      if(resp) {
        const data = _.cloneDeep(resp);
        this.totalStudent = data.total_student;

        this.dataChart = [{
          name: 'Total Student with Inactive Contract',
          name_fr: 'Total apprenants avec un contrat inactif',
          counter: data.total_student - data.total_student_with_active_contract
        },
        {
          name: 'Total Student with Active Contract',
          name_fr: 'Total apprenants avec un contrat actif',
          counter: data.total_student_with_active_contract,
        }
      ];
        

      }
    })
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

}
