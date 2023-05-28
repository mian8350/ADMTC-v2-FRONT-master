import { Component, OnInit, Input, ChangeDetectorRef, AfterViewChecked, OnDestroy } from '@angular/core';
import { MatSelectChange } from '@angular/material/select';
import { MatTableDataSource } from '@angular/material/table';
import { UntypedFormControl } from '@angular/forms';
import { SubSink } from 'subsink';
import { GroupCreationService } from 'app/service/group-creation/group-creation.service';
import { GroupDropdown, StudentData } from '../group-creation.model';
import * as _ from 'lodash';

@Component({
  selector: 'ms-student-group-table',
  templateUrl: './student-group-table.component.html',
  styleUrls: ['./student-group-table.component.scss'],
})
export class StudentGroupTableComponent implements OnInit, AfterViewChecked, OnDestroy {
  private subs = new SubSink();
  @Input() testProgressData;

  studentList: StudentData[];
  groupList: GroupDropdown[];

  dataSource = new MatTableDataSource([]);
  displayedColumns: string[] = ['studentName', 'group'];
  filterColumns: string[] = ['studentNameFilter', 'groupFilter'];
  isWaitingForResponse = false;
  studentNameFilter = new UntypedFormControl('');
  groupIDFilter = new UntypedFormControl('');
  filteredValues = {
    studentName: '',
    group: '',
  };

  constructor(private groupCreationService: GroupCreationService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.subs.sink = this.groupCreationService.studentListData.subscribe((data) => {
      this.studentList = data;
      this.dataSource.data = this.studentList;

      this.dataSource.filterPredicate = this.customFilterPredicate();
    });

    this.subs.sink = this.groupCreationService.groupListData.subscribe((data) => {
      this.groupList = data;

      if (!this.checkFilterGroup()) {
        this.groupIDFilter.patchValue('');
      }
    });

    this.filter();
  }

  ngAfterViewChecked() {
    this.cdr.detectChanges();
  }

  assignStudent(event: MatSelectChange, studentIndex: number) {

    if (!event.value) {
      const payload: StudentData[] = _.cloneDeep(this.studentList);
      payload[studentIndex].group_id = null;
      payload[studentIndex].group_name = null;
      this.groupCreationService.setStudentListData(payload);
    } else {
      const groupFound: GroupDropdown = _.find(this.groupList, (group: GroupDropdown) => group.group_id === event.value);
      if (groupFound) {
        const payload: StudentData[] = _.cloneDeep(this.studentList);
        payload[studentIndex].group_id = groupFound.group_id;
        payload[studentIndex].group_name = groupFound.group_name;
        this.groupCreationService.setStudentListData(payload);
      }
    }
  }

  customFilterPredicate() {
    const self = this;
    return function (data, filter: string): boolean {
      const searchString = JSON.parse(filter);

      const nameFound = searchString.studentName
        ? self.simpleDiacriticSensitiveRegex((data.last_name + ' ' + data.first_name).toString().trim().toLowerCase()).indexOf(
            self.simpleDiacriticSensitiveRegex(searchString.studentName.toLowerCase()),
          ) !== -1
        : true;

      const groupFound =
        searchString.group !== 'None'
          ? searchString.group
            ? data.group_id === searchString.group
            : true
          : searchString.group === 'None'
          ? data.group_id === null
          : true;

      return nameFound && groupFound;
    };
  }

  filter() {
    this.subs.sink = this.studentNameFilter.valueChanges.subscribe((studentName) => {
      this.filteredValues['studentName'] = studentName;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });

    this.subs.sink = this.groupIDFilter.valueChanges.subscribe((groupId) => {
      this.filteredValues['group'] = groupId;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });
  }

  simpleDiacriticSensitiveRegex(text: string): string {
    if (text) {
      return text
        .replace(/[a,á,à,ä]/g, 'a')
        .replace(/[e,é,ë,è]/g, 'e')
        .replace(/[i,í,ï,Î,î]/g, 'i')
        .replace(/[o,ó,ö,ò,ô]/g, 'o')
        .replace(/[u,ü,ú,ù]/g, 'u')
        .replace(/[ ,-]/g, ' ');
    } else {
      return '';
    }
  }

  checkFilterGroup(): boolean {
    if (this.groupList && this.groupList.length) {
      const result = this.groupList.some((group) => group.group_id === this.groupIDFilter.value);
      return result;
    } else {
      return false;
    }

  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
