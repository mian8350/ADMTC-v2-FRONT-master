import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PageTitleService } from 'app/core/page-title/page-title.service';
import { JuryOrganizationService } from 'app/service/jury-organization/jury-organization.service';
import { SubSink } from 'subsink';

@Component({
  selector: 'ms-setup-schedule-retake-grand-oral',
  templateUrl: './setup-schedule-retake-grand-oral.component.html',
  styleUrls: ['./setup-schedule-retake-grand-oral.component.scss'],
})
export class SetupScheduleRetakeGrandOralComponent implements OnInit, OnDestroy {
  juryOrganizationId: any;
  private subs = new SubSink();
  juryData: any;

  constructor(
    private route: ActivatedRoute,
    private juryOrganizationService: JuryOrganizationService,
    private pageTitleService: PageTitleService,
  ) {}

  ngOnInit() {
    this.subs.sink = this.route.queryParams.subscribe((params) => {
      if (params['id']) {
        this.juryOrganizationId = params['id'];
        this.getJuryData();
      }
    });
  }

  getJuryData() {
    this.subs.sink = this.juryOrganizationService.getOneJuryOrganizationDataById(this.juryOrganizationId).subscribe((resp) => {
      this.juryData = resp;
      this.setPageTitle(this.juryData);

    });
  }
  setPageTitle(data) {
    if (data) {
      this.pageTitleService.setGrandOral(data);
    }
  }
  ngOnDestroy() {
    this.subs.unsubscribe();
  }
  
  
}
