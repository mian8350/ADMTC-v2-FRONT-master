import { CoreService } from './../../service/core/core.service';
import { Component, OnInit, Input, Output, EventEmitter, OnDestroy, ViewChild } from '@angular/core';
import { SubSink } from 'subsink';
import { SchoolService } from 'app/service/schools/school.service';
import { CreateStudentDetailComponent } from './create-student-detail/create-student-detail.component';
import { PermissionService } from 'app/service/permission/permission.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'ms-school-student-cards',
  templateUrl: './school-student-cards.component.html',
  styleUrls: ['./school-student-cards.component.scss']
})
export class SchoolStudentCardsComponent implements OnInit, OnDestroy {
  private subs = new SubSink();

  @Input() schoolId: string;
  @Input() studentTabSelected: string;
  @Input() studentSelected: any;

  selectedRncpTitleId: string;
  selectedClassId: string;
  selectedStatusId: string;
  searchPendingTask: any;
  isAddUser: Boolean;
  isStudentAdd = false;
  paramStudentStatus = 'active';
  dataStudent: any;
  dataStudentIdentity: any;
  @ViewChild('createStudent', { static: false }) createStudent: CreateStudentDetailComponent;
  showCards: boolean = true;
  constructor(
    private schoolService: SchoolService,
    public permissionService: PermissionService,
    private coreService: CoreService,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    this.subs.sink = this.schoolService.selectedRncpTitleId$.subscribe(id => this.selectedRncpTitleId = id);
    this.subs.sink = this.schoolService.selectedClassId$.subscribe(id => this.selectedClassId = id);
    this.subs.sink = this.schoolService.selectedStatusId$.subscribe(id => {this.selectedStatusId = id});

    this.subs.sink = this.schoolService.addNewStudent$.subscribe(resp => {
      this.isAddUser = resp
    });
    this.coreService.sidenavOpen = false
  }

  filterPendingTask(event) {}

  triggerRefresh(event){
    this.subs.sink = this.schoolService.selectedStudentIdCompany$.subscribe(id => this.studentSelected = id);
    this.ngOnInit();
    this.studentTabSelected = 'Company'
    this.showCards = false;
    setTimeout(() => {
        this.showCards = true
      }, 100);
  }

  resetFilter() {}

  onAddSchool() {}

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
