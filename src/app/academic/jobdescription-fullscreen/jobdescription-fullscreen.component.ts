import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'ms-jobdescription-fullscreen',
  templateUrl: './jobdescription-fullscreen.component.html',
  styleUrls: ['./jobdescription-fullscreen.component.scss'],
})
export class JobFullscreenComponent implements OnInit {
  schoolId;
  titleId;
  classId;
  studentId;
  jobDescriptionId;

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {

    this.getParamRoute();
  }

  getParamRoute() {
    if (this.route && this.route.snapshot) {
      const params = this.route.snapshot.params;

      this.schoolId = params && params.schoolId ? params.schoolId : '';
      this.titleId = params && params.titleId ? params.titleId : '';
      this.classId = params && params.classId ? params.classId : '';
      this.studentId = params && params.studentId ? params.studentId : '';
      this.jobDescriptionId = params && params.jobDescriptionId ? params.jobDescriptionId : '';
    }
  }
}
