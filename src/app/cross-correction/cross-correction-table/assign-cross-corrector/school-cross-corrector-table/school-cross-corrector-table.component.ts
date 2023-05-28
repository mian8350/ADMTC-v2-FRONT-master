import { Input } from '@angular/core';
import { Component, OnInit, ViewChild } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { CrossCorrectionService } from 'app/service/cross-correction/cross-correction.service';
import { debounceTime, map } from 'rxjs/operators';
import * as _ from 'lodash';
import { SubSink } from 'subsink';

@Component({
  selector: 'ms-school-cross-corrector-table',
  templateUrl: './school-cross-corrector-table.component.html',
  styleUrls: ['./school-cross-corrector-table.component.scss'],
})
export class SchoolCrossCorrectorTableComponent implements OnInit {
  private subs = new SubSink();
  dataSource = new MatTableDataSource([]);
  @Input() title;
  @Input() params;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  noData: any;
  dataCount = 0;
  dataLoaded = false;
  isWaitingForResponse = false;
  displayedColumns: string[] = ['schools', 'students', 'correction', 'diff'];
  sortValue = null;

  total: number;

  schoolCorrectingList = [];
  AllStudentsLists = [];
  allSchools = [];

  constructor(private crossCorrectionService: CrossCorrectionService) {}

  ngOnInit() {
    this.getSchoolsAndCrossCorrectors();
    this.subs.sink = this.crossCorrectionService.AllStudentsLists$.pipe(debounceTime(100)).subscribe((studentList) => {
      this.AllStudentsLists = studentList;
      if (this.AllStudentsLists && this.AllStudentsLists.length) {
        this.getSchoolAllListTab2();
      }
    });
  }

  setSort() {
    this.dataSource.sortingDataAccessor = (item, property) => {
      switch (property) {
        case 'schools':
          return item.school ? item.school.short_name : null;
        default:
          return item[property];
      }
    };
    this.dataSource.sort = this.sort;
  }

  getSchoolsAndCrossCorrectors() {
    this.isWaitingForResponse = true;
    this.subs.sink = this.crossCorrectionService.getSchoolsAndCrossCorrectors(this.params.titleId, this.params.classId).subscribe(
      (res) => {

        this.isWaitingForResponse = false;
        this.schoolCorrectingList = _.cloneDeep(res);
        this.getSchoolAllListTab2();
        this.setSort();
      },
      (err) => (this.isWaitingForResponse = false),
    );
  }

  getSchoolAllListTab2() {
    const resultArray = [];
    this.schoolCorrectingList.forEach((school) => {
      resultArray.push({
        short_name: school.school['short_name'],
        _id: school.school['_id'],
        students: 0,
        correction: 0,
        diff: 0,
      });
    });

    resultArray.forEach((school) => {

      const students = this.AllStudentsLists.filter(
        (student) => school && school._id && student && student.school_origin_id && student.school_origin_id._id === school._id,
      );
      const correction = this.AllStudentsLists.filter(
        (student) => school && school._id && student && student.school_correcting_id && student.school_correcting_id === school._id,
      );
      school['students'] = students.length;
      school['correction'] = correction.length;
      school['diff'] = correction.length - students.length;
    });
    this.allSchools = resultArray;


    this.dataSource.data = this.allSchools;
    this.total = this.allSchools.length > 0 ? this.allSchools.length : 0;
    this.noData = this.dataSource.connect().pipe(map((data) => !data || (data && data.length === 0)));
  }

  getDummyData() {
    return [
      {
        count_document: 2,
        _id: 'f8hy239hdq38hedqhd8ih',
        schoolName: 'Dummy School',
        totalStudents: 2,
        totalCorrection: 1,
        diff: 2 - 1,
      },
      {
        count_document: 2,
        _id: 'f8hy239hdq38hedqhd8ih',
        schoolName: 'Dummy School 2',
        totalStudents: 3,
        totalCorrection: 1,
        diff: 3 - 1,
      },
      {
        count_document: 2,
        _id: 'f8hy239hdq38hedqhd8ih',
        schoolName: 'Dummy School',
        totalStudents: 2,
        totalCorrection: 1,
        diff: 2 - 1,
      },
      {
        count_document: 2,
        _id: 'f8hy239hdq38hedqhd8ih',
        schoolName: 'Dummy School 2',
        totalStudents: 3,
        totalCorrection: 1,
        diff: 3 - 1,
      },
      {
        count_document: 2,
        _id: 'f8hy239hdq38hedqhd8ih',
        schoolName: 'Dummy School',
        totalStudents: 2,
        totalCorrection: 1,
        diff: 2 - 1,
      },
      {
        count_document: 2,
        _id: 'f8hy239hdq38hedqhd8ih',
        schoolName: 'Dummy School 2',
        totalStudents: 3,
        totalCorrection: 1,
        diff: 3 - 1,
      },
      {
        count_document: 2,
        _id: 'f8hy239hdq38hedqhd8ih',
        schoolName: 'Dummy School',
        totalStudents: 2,
        totalCorrection: 1,
        diff: 2 - 1,
      },
      {
        count_document: 2,
        _id: 'f8hy239hdq38hedqhd8ih',
        schoolName: 'Dummy School 2',
        totalStudents: 3,
        totalCorrection: 1,
        diff: 3 - 1,
      },
    ];
  }
}
