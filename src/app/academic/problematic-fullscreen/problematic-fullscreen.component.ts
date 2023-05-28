import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'ms-problematic-fullscreen',
  templateUrl: './problematic-fullscreen.component.html',
  styleUrls: ['./problematic-fullscreen.component.scss']
})
export class ProblematicFullscreenComponent implements OnInit {
  schoolId;
  titleId;
  classId;
  studentId;
  problematicId;

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
      this.titleId = params && params.titleId ? params.titleId : '';
      this.classId = params && params.classId ? params.classId : '';
      this.studentId = params && params.studentId ? params.studentId : '';
      this.problematicId = params && params.problematicId ? params.problematicId : '';
    }
  }

}
