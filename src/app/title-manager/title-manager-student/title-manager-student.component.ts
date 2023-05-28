import { Component, OnDestroy, OnInit } from '@angular/core';
import { PermissionService } from 'app/service/permission/permission.service';
import { SchoolService } from 'app/service/schools/school.service';
import { SubSink } from 'subsink';

@Component({
  selector: 'ms-title-manager-student',
  templateUrl: './title-manager-student.component.html',
  styleUrls: ['./title-manager-student.component.scss']
})
export class TitleManagerStudentComponent implements OnInit, OnDestroy {
  private subs = new SubSink();
  
  selectedRncpTitleId: string;
  selectedClassId: string;

  constructor(private schoolService: SchoolService, private permissionService: PermissionService) { }

  ngOnInit() {
    this.subs.sink = this.schoolService.selectedRncpTitleId$.subscribe(id => this.selectedRncpTitleId = id);
    this.subs.sink = this.schoolService.selectedClassId$.subscribe(id => this.selectedClassId = id);
  }

  showTableMenu() {
    return this.permissionService.showTableStudentSubmenuPerm();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

}
