import { Component, OnInit, OnDestroy } from '@angular/core';
import { UtilityService } from 'app/service/utility/utility.service';
import { UsersService } from 'app/service/users/users.service';
import { SubSink } from 'subsink';
import { UntypedFormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import * as _ from 'lodash';
@Component({
  selector: 'ms-school-group',
  templateUrl: './school-group.component.html',
  styleUrls: ['./school-group.component.scss']
})
export class SchoolGroupComponent implements OnInit, OnDestroy {
  private subs = new SubSink();
  currentUser;
  entitiesList;
  schoolList;
  filteredSchoolList: Observable<any[]>;

  searchForm = new UntypedFormControl('');

  defaultSchoolIcon = '../../../assets/img/bank.png';

  constructor(
    private utilService: UtilityService,
    private usersService: UsersService,
    private router: Router
  ) { }

  ngOnInit() {
    this.currentUser = this.utilService.getCurrentUser();
    this.getSchoolData();
  }

  getSchoolData() {
    this.subs.sink = this.usersService.getGroupChiefAcademicData(this.currentUser._id).subscribe(resp => {

      if (resp && resp.entities && resp.entities.length) {
        this.entitiesList = resp.entities;

        this.schoolList = [];
        this.entitiesList.forEach(entity => {
          if (entity.group_of_schools && entity.group_of_schools.length) {
            entity.group_of_schools.forEach(school => {
              if (school) {
                this.schoolList.push(school);
              }
            });
          }
          if (entity.group_of_school) {
            if (entity.group_of_school.headquarter) {
              this.schoolList.push(entity.group_of_school.headquarter)
            }
            if (entity.group_of_school.school_members && entity.group_of_school.school_members.length) {
              this.schoolList = this.schoolList.concat(entity.group_of_school.school_members);
            }
          }
        });
        this.schoolList = _.uniqBy(this.schoolList, 'short_name')
        this.filteredSchoolList = this.schoolList;
        this.filterSchool();



      }
    })
  }

  filterSchool() {
    this.subs.sink = this.searchForm.valueChanges.subscribe((searchString: string) => {

      setTimeout(() => {
        this.filteredSchoolList = this.schoolList.filter((school) => {
          if (school.short_name) {
            return (
              school.short_name.toLowerCase().indexOf(searchString.toLowerCase().trim()) !== -1
            );
          } else {
            return false;
          }
        });
      }, 500);
    });
  }

  resetSearch() {
    this.searchForm.setValue('');
    this.filteredSchoolList = this.schoolList;
  }

  goToTitleDashBoard(data) {

    this.router.navigate(['/rncpTitles'], {queryParams: {schoolId : data._id}} );
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

}
