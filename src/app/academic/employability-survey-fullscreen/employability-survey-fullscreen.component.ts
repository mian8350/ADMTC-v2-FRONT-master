import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'ms-employability-survey-fullscreen',
  templateUrl: './employability-survey-fullscreen.component.html',
  styleUrls: ['./employability-survey-fullscreen.component.scss']
})
export class EmployabilitySurveyFullscreenComponent implements OnInit {
  schoolId;
  studentId;
  esId;

  source;

  constructor(
    private route: ActivatedRoute
  ) { }

  ngOnInit() {

    this.getParamRoute();
  }

  getParamRoute() {
    if (this.route && this.route.snapshot) {
      const params = this.route.snapshot.params;

      this.schoolId = params && params.schoolId ? params.schoolId : '';
      this.studentId = params && params.studentId ? params.studentId : '';
      this.esId = params && params.esId ? params.esId : '';

      // ************* 
      const queryParams = this.route.snapshot.queryParams;
      this.source = queryParams && queryParams.source ? queryParams.source : '';
    }
  }

}
