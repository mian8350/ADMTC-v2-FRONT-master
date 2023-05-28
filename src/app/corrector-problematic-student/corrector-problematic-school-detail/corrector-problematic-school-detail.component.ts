import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SchoolService } from 'app/service/schools/school.service';
import { SubSink } from 'subsink';

@Component({
  selector: 'ms-corrector-problematic-school-detail',
  templateUrl: './corrector-problematic-school-detail.component.html',
  styleUrls: ['./corrector-problematic-school-detail.component.scss']
})
export class CorrectorProblematicSchoolDetailComponent implements OnInit, OnDestroy {
  private subs = new SubSink();
  schoolId;
  studentId = '';
  titleId = '';
  classId = '';
  selectedRncpTitleId: string;
  selectedClassId: string;
  isAddUser = false;
  studentSelected: string;
  studentTabSelected: string;


  constructor(
    private schoolService: SchoolService,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    this.subs.sink = this.schoolService.selectedRncpTitleId$.subscribe(id => this.selectedRncpTitleId = id);
    this.subs.sink = this.schoolService.selectedClassId$.subscribe(id => this.selectedClassId = id);

    const identity = this.route.snapshot.queryParamMap.get('identity');
    this.studentId = this.route.snapshot.queryParamMap.get('student');
    this.titleId = this.route.snapshot.queryParamMap.get('title');
    this.classId = this.route.snapshot.queryParamMap.get('class');
    this.schoolId = this.route.snapshot.queryParamMap.get('school');

    this.schoolService.setSelectedRncpTitleId(this.titleId);
    this.schoolService.setSelectedClassId(this.classId);

    this.studentTabSelected = identity;

    if (this.route && this.route.snapshot) {
      const params = this.route.snapshot.params;
      this.schoolId = params && params.schoolId ? params.schoolId : '';
    }
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

}
