import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { JuryOrganizationService } from 'app/service/jury-organization/jury-organization.service';
import { ParseLocalToUtcPipe } from 'app/shared/pipes/parse-local-to-utc.pipe';
import { ParseUtcToLocalPipe } from 'app/shared/pipes/parse-utc-to-local.pipe';
import { SubSink } from 'subsink';
import Swal from 'sweetalert2';
import * as _ from 'lodash';
import * as moment from 'moment';
import { Location } from '@angular/common';
import { MatPaginator } from '@angular/material/paginator';
import { MatSelectChange } from '@angular/material/select';
import { MatSort } from '@angular/material/sort';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import uniq from 'lodash/uniq';
import { JuryData, JuryDataEntities } from 'app/title-rncp/conditions/jury-organization-parameter/jury-organization-parameter.model';
import { AcademicKitService } from 'app/service/rncpTitles/academickit.service';
import { UsersService } from 'app/service/users/users.service';
import { forkJoin } from 'rxjs';

export interface StudentTestSection {
  date_test: Date;
  test_hours_start: string;
  test_hours_finish: string;
  president: string;
  jury_serial_number: string;
  jury_member_id: string;
}

interface StudentDataToSend {
  rncpTitleId: string;
  schoolId: string;
  isSubmitted: boolean;
  lang: string;
  students?: Student[];
  test_groups?: Group[];
}

interface Student {
  studentId: string;
  jury_member_id: string;
  test_hours_start: string;
  date_test: any;
  professional_jury_member?: string;
  academic_jury_member?: string;
  substitution_jury_member?: string;
}

interface Group {
  groupId: string;
  jury_member_id: string;
  test_hours_start: string;
  date_test: any;
  professional_jury_member?: string;
  academic_jury_member?: string;
  substitution_jury_member?: string;
}

@Component({
  selector: 'ms-assign-student-per-jury',
  templateUrl: './assign-student-per-jury.component.html',
  styleUrls: ['./assign-student-per-jury.component.scss'],
  providers: [ParseLocalToUtcPipe, ParseUtcToLocalPipe],
})
export class AssignStudentPerJuryComponent implements OnInit, OnDestroy {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild(MatTable, { static: true }) table: MatTable<any>;
  @ViewChild('f', { static: false }) form: any;

  private subs = new SubSink();
  dataSource = new MatTableDataSource([]);
  displayedColumns: string[];
  filterColumns: string[];
  JuryMemberRequire = false;

  // ************* filters
  presidentJuryFilter = new UntypedFormControl('');
  dateFilter = new UntypedFormControl('');
  filteredValues = {
    date: '',
    presidentJury: '',
  };

  // ************* From url parameter
  juryOrgId;
  schoolId;
  rncpId;
  classId;
  jury_serial_number;

  // ************** Data get after fetch
  testId;
  isGroupTest;
  schoolData;
  juryOrgData;
  studentAssignedData;
  studentToAssignList;

  // fix error "Property 'juryDataHolder' does not exist on type 'AssignStudentPerJuryComponent'."
  juryDataHolder;

  // *************** Variables From V1
  studentSectionList: StudentTestSection[] = [];
  studentDataToSend: StudentDataToSend;
  numberOfStudent = 0;
  isAllStudentAssigned = true;
  studentsToAssign = [];
  groupsToAssign = [];
  studentsToAssignFixValue = [];
  groupsToAssignFixValue = [];

  // proJuryTypeId: string;
  professionalJuryIdList = [];
  acadJuryTypeId: string;
  mentorTypeId: string;

  studentAndMentor = [];

  professionalJuries: JuryData[];
  professionalJuriesListPerIndex = [];
  academicJuries: JuryData[];
  subtituteJuries: JuryData[];

  professionalJuriesList = [];
  academicJuriesList = [];
  subtituteJuriesList = [];

  // Academic Dir, Academic Admin, Acad Jury Member, Corrector, Professional Jury Member, Teacher
  professionalJuriesUserTypes = [
    '5a2e1ecd53b95d22c82f9555',
    '5a2e1ecd53b95d22c82f9554',
    '5cdbdeaf4b1f6a1b5a0b3fb6',
    '5a2e1ecd53b95d22c82f9559',
    '5cdbde9b4b1f6a1b5a0b3fb5',
    '5a2e1ecd53b95d22c82f9558',
  ];

  professionalUserTypeCR = [
    '5c173695ba179819bd115df1', // Academic jury member
    '606fe9c974c4d62888cc2818', // Professional Jury Member Certifier
  ];

  professionalUserTypePC = [
    '5a2e1ecd53b95d22c82f9554', // Acad Dir
    '5cdbde9b4b1f6a1b5a0b3fb5', // Professional Jury Member
    '5cdbdeaf4b1f6a1b5a0b3fb6', // Academic Final Jury Member
    '5a2e1ecd53b95d22c82f9555', // Acad Admin
    '5a2e1ecd53b95d22c82f9558', // Teacher
    // '5a2e603f53b95d22c82f9590', // Mentor
  ];

  academicUserTypePC = ['5cdbdeaf4b1f6a1b5a0b3fb6'];
  academicUserTypeCR = ['606fe9c974c4d62888cc2818', '5c173695ba179819bd115df1'];

  substituteUserType = [
    '5a2e1ecd53b95d22c82f9554', // Acad Dir
    '5cdbde9b4b1f6a1b5a0b3fb5', // Professional Jury Member
    '5cdbdeaf4b1f6a1b5a0b3fb6', // Academic Final Jury Member
    '5a2e1ecd53b95d22c82f9555', // Acad Admin
    '5a2e1ecd53b95d22c82f9558', // Teacher
  ];

  profesionalJuryDefault = new UntypedFormControl(null);
  academicJuryDefault = new UntypedFormControl(null);
  subtituteJuryDefault = new UntypedFormControl(null);

  isLoading = false;

  isFirstTimeAccess = false;

  constructor(
    private fb: UntypedFormBuilder,
    private route: ActivatedRoute,
    private juryService: JuryOrganizationService,
    private parseLocalToUTC: ParseLocalToUtcPipe,
    private parseUTCToLocal: ParseUtcToLocalPipe,
    private translate: TranslateService,
    private router: Router,
    private _location: Location,
    private acadKitService: AcademicKitService,
    private usersService: UsersService,
  ) {
    document.addEventListener(
      'keydown',
      (e) => {
        if ((e.target as any).nodeName === 'MAT-SELECT') {
          e.stopImmediatePropagation();
        }
      },
      true,
    );
  }

  ngOnInit() {
    this.juryOrgId = this.route.snapshot.paramMap.get('juryOrgId');
    this.schoolId = this.route.snapshot.paramMap.get('schoolId');
    this.rncpId = this.route.snapshot.paramMap.get('rncpId');
    this.classId = this.route.snapshot.paramMap.get('classId');
    this.jury_serial_number = this.route.snapshot.paramMap.get('jurySerialNumber');

    this.getJuryData();
    // this.getSchoolData();
    // this.getAssignedStudents();
    // this.getStudentToAssign();
  }

  onFilter() {
    this.subs.sink = this.dateFilter.valueChanges.subscribe((date) => {
      this.filteredValues['date'] = date;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });

    this.subs.sink = this.presidentJuryFilter.valueChanges.subscribe((president) => {
      this.filteredValues['presidentJury'] = president;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });
  }

  customFilterPredicate() {
    return function (data, filter: string): boolean {
      const searchString = JSON.parse(filter);
      let newDate = moment(searchString.date).format('YYYY-MM-DD');
      newDate = newDate !== 'Invalid date' ? newDate : '';

      const dateFound = data.date_test ? data.date_test.toString().trim().toLowerCase().indexOf(newDate) !== -1 : false;

      const presidentJuryFound = data.president
        ? data.president
            .toString()
            .trim()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .indexOf(searchString.presidentJury.toLowerCase()) !== -1
        : false;

      return presidentJuryFound && dateFound;
    };
  }

  getSchoolData() {
    this.subs.sink = this.juryService.findSchoolOnjuryOrganization(this.juryOrgId, this.rncpId, this.schoolId).subscribe(
      (resp) => {
        const response = _.cloneDeep(resp);
        response.schools = response.schools && response.schools[0] ? response.schools[0] : null;
        this.isGroupTest = response.test_id && response.test_id.group_test ? response.test_id.group_test : false;
        this.testId = response.test_id && response.test_id._id ? response.test_id._id : null;

        this.schoolData = response;
        if (!this.isGroupTest) {
          this.numberOfStudent =
            response.schools && response.schools.students && response.schools.students.length ? response.schools.students.length : 0;
        } else {
          this.numberOfStudent =
            response.schools && response.schools.test_groups && response.schools.test_groups.length
              ? response.schools.test_groups.length
              : 0;
        }

        this.getStudentAndGroupSection();
      },
      (err) => {

        Swal.fire({
          type: 'error',
          title: 'Error',
          text: err && err['message'] ? err['message'] : err,
          confirmButtonText: 'OK',
        });
      },
    );
  }

  getJuryData() {
    this.subs.sink = this.juryService.getOneJuryOrganizationDataById(this.juryOrgId).subscribe(
      (resp) => {
        this.juryOrgData = _.cloneDeep(resp);
        // this.getStudentAndGroupSection();

        if (this.juryOrgData.jury_member_required === true) {

          this.displayedColumns = [
            'serialDate',
            'date',
            'time',
            'presidentJury',
            'profesionalJury',
            'academicJury',
            'subtituteJury',
            'student',
          ];
          this.filterColumns = [
            'serialDateFilter',
            'dateFilter',
            'timeFilter',
            'presidentJuryFilter',
            'professionalFilter',
            'academicFilter',
            'subtituteFilter',
            'studentFilter',
          ];
          this.JuryMemberRequire = true;
          // this.getUserTypesId();
        } else {
          // this.getSchoolData();
          this.displayedColumns = ['serialDate', 'date', 'time', 'presidentJury', 'student'];
          this.filterColumns = ['serialDateFilter', 'dateFilter', 'timeFilter', 'presidentJuryFilter', 'studentFilter'];
          this.JuryMemberRequire = false;
        }
        this.getUserTypesId();
      },
      (err) => {

        Swal.fire({
          type: 'error',
          title: 'Error',
          text: err && err['message'] ? err['message'] : err,
          confirmButtonText: 'OK',
        });
      },
    );
  }

  getStudentToAssign() {
    this.subs.sink = this.juryService.getStudentToAssignPerJury(this.juryOrgId, this.rncpId, this.schoolId).subscribe(
      (resp) => {
        const response = _.cloneDeep(resp);
        this.studentToAssignList = response;

      },
      (err) => {

        Swal.fire({
          type: 'error',
          title: 'Error',
          text: err && err['message'] ? err['message'] : err,
          confirmButtonText: 'OK',
        });
      },
    );
  }

  getStudentAndGroupSection() {
    this.subs.sink = this.juryService
      .getOneJuryMembersAssignStudentPerJury(this.juryOrgId, this.rncpId, this.schoolId)
      .subscribe((resp) => {
        const response = _.cloneDeep(resp);

        if (response && response.length) {
          response.forEach((juryMemberGroup) => {
            this.isAllStudentAssigned = juryMemberGroup ? juryMemberGroup.isStudentAssigned : false;
            if (this.isGroupTest) {
              // for group test type
              juryMemberGroup.test_groups.forEach((group) => {
                group['date_test'] = this.convertUTCToLocalDate({ date: group['date_test'], time_start: group['test_hours_start'] });
                group['test_hours_start'] = this.parseUTCToLocal.transform(group['test_hours_start']);
                group['test_hours_finish'] = this.parseUTCToLocal.transform(group['test_hours_finish']);
                group['jury_member_id'] = juryMemberGroup._id;
                group['jury_serial_number'] = juryMemberGroup.jury_serial_number;
                group['president'] = juryMemberGroup.president_of_jury.first_name + ' ' + juryMemberGroup.president_of_jury.last_name;
                this.studentSectionList.push(group);
              });
            } else {
              // for student type
              juryMemberGroup.students.forEach((student) => {
                student['date_test'] = this.convertUTCToLocalDate({ date: student['date_test'], time_start: student['test_hours_start'] });
                student['test_hours_start'] = this.parseUTCToLocal.transform(student['test_hours_start']);
                student['test_hours_finish'] = this.parseUTCToLocal.transform(student['test_hours_finish']);
                student['jury_member_id'] = juryMemberGroup._id;
                student['jury_serial_number'] = juryMemberGroup.jury_serial_number;
                student['president'] = juryMemberGroup.president_of_jury.first_name + ' ' + juryMemberGroup.president_of_jury.last_name;
                this.studentSectionList.push(student);
              });
            }

            this.dataSource.data = this.studentSectionList;
            this.dataSource.paginator = this.paginator;

            this.onFilter();
            this.dataSource.filterPredicate = this.customFilterPredicate();
          });
        }
        this.initializeSendData();
      });
  }

  // shape the data that are going to send to BE
  initializeSendData() {
    this.studentDataToSend = {
      rncpTitleId: this.rncpId,
      schoolId: this.schoolId,
      isSubmitted: false,
      lang: this.translate.currentLang,
      students: [],
      test_groups: [],
    };
    for (let i = 0; i < this.studentSectionList.length; i++) {
      if (!this.isGroupTest) {
        this.studentDataToSend.students[i] = {
          studentId: '',
          jury_member_id: '',
          test_hours_start: '',
          date_test: '',
          professional_jury_member: null,
          academic_jury_member: null,
          substitution_jury_member: null,
        };
      } else {
        this.studentDataToSend.test_groups[i] = {
          groupId: '',
          jury_member_id: '',
          test_hours_start: '',
          date_test: '',
          professional_jury_member: null,
          academic_jury_member: null,
          substitution_jury_member: null,
        };
      }
    }
    this.getAssignedStudentAndGroup();
  }

  getAssignedStudentAndGroup() {
    this.subs.sink = this.juryService.getAssignedStudentsPerJury(this.juryOrgId, this.rncpId, this.schoolId).subscribe(
      (resp) => {
        const response = _.cloneDeep(resp);
        this.studentAssignedData = response;


        if (!this.isGroupTest) {
          response.forEach((student, index) => {
            // const studentId = this.checkUndefined(() => student.student_id._id, '');
            this.studentDataToSend.students[index] = {
              studentId: student && student.student_id && student.student_id._id ? student.student_id._id : '',
              jury_member_id: student.jury_member_id && student.jury_member_id._id ? student.jury_member_id._id : '',
              test_hours_start: student.test_hours_start,
              date_test: student.date_test,
              professional_jury_member:
                student.professional_jury_member && student.professional_jury_member._id ? student.professional_jury_member._id : null,
              academic_jury_member:
                student.academic_jury_member && student.academic_jury_member._id ? student.academic_jury_member._id : null,
              substitution_jury_member:
                student.substitution_jury_member && student.substitution_jury_member._id ? student.substitution_jury_member._id : null,
            };
          });


          // Check if first time access
          if (
            this.studentDataToSend &&
            this.studentDataToSend.students &&
            this.studentDataToSend.students[0] &&
            !this.studentDataToSend.students[0].studentId
          ) {
            this.isFirstTimeAccess = true;
          }

          this.getStudentsToAssign();
        } else {
          response.forEach((group, index) => {
            // const groupId = this.checkUndefined(() => group.groupId.id, '');
            const groupId = group && group.groupId && group.groupId.id ? group.groupId.id : '';
            this.studentDataToSend.test_groups[index] = {
              groupId: groupId,
              jury_member_id: group.jury_member_id,
              test_hours_start: group.test_hours_start,
              date_test: group.date_test,
              professional_jury_member:
                group.professional_jury_member && group.professional_jury_member._id ? group.professional_jury_member._id : null,
              academic_jury_member: group.academic_jury_member && group.academic_jury_member._id ? group.academic_jury_member._id : null,
              substitution_jury_member:
                group.substitution_jury_member && group.substitution_jury_member._id ? group.substitution_jury_member._id : null,
            };
          });
          // this.getGroupToAssign();
        }
      },
      (err) => {

        Swal.fire({
          type: 'error',
          title: 'Error',
          text: err && err['message'] ? err['message'] : err,
          confirmButtonText: 'OK',
        });
      },
    );

    // const assignedStudentGroupSubs = this.juryOrganizationService
    // .getStudentAssigned(
    //   this.juryOrganizationId,
    //   this.rncpTitleId,
    //   this.schoolId,
    // )
    // .subscribe(res => {

    // });
    // this.subs.add(assignedStudentGroupSubs);
  }

  getStudentsToAssign() {
    this.subs.sink = this.juryService.getStudentToAssignPerJury(this.juryOrgId, this.rncpId, this.schoolId).subscribe(
      (resp) => {
        const response = _.cloneDeep(resp);

        // Used to map the student mentor by filtering active contract and mentor exist
        this.studentAndMentor = response.map((student) => {
          let tempMentor = null;
          if (student && student.companies && student.companies.length) {
            const activeCompany = student.companies.find((company) => company.is_active === true);
            if (activeCompany && activeCompany.mentor && activeCompany.mentor._id) {
              tempMentor = {
                short_name: activeCompany.mentor.last_name.toUpperCase() + ' ' + activeCompany.mentor.first_name,
                _id: activeCompany.mentor._id,
              };
            }
          }
          return {
            _id: student._id,
            first_name: student.first_name,
            last_name: student.last_name,
            mentor: tempMentor,
          };
        });


        this.studentsToAssign.push({
          id: '0',
          text: 'Not assigned',
          disabled: false,
        });
        response.forEach((student) => {
          this.studentsToAssign.push({
            id: student._id,
            text: student.first_name + ' ' + student.last_name,
            disabled: false,
          });
        });


        if (this.studentDataToSend && this.studentDataToSend.students && this.studentDataToSend.students.length) {
          this.studentDataToSend.students.forEach((studentSend, studentSendIndex) => {
            this.professionalJuriesListPerIndex.push(this.professionalJuriesList);
            // If grand oral, then we need to include mentor into professional dropdown
            if (this.juryOrgData && this.juryOrgData.type === 'grand_oral') {
              const foundStudent = this.studentAndMentor.find((studentMentor) => studentMentor._id === studentSend.studentId);

              if (foundStudent && foundStudent.mentor && foundStudent.mentor._id) {
                this.professionalJuriesListPerIndex[studentSendIndex] = [
                  ...this.professionalJuriesListPerIndex[studentSendIndex],
                  foundStudent.mentor,
                ];
                // if the professinal jury member is empty, we need to set it as default value
                if (studentSend && studentSend.studentId && !studentSend.professional_jury_member) {
                  studentSend.professional_jury_member = foundStudent.mentor._id;
                }
              }
            }
          });
        }

        this.studentsToAssignFixValue = this.studentsToAssign;
        this.initializeRowData();
      },
      (err) => {

        Swal.fire({
          type: 'error',
          title: 'Error',
          text: err && err['message'] ? err['message'] : err,
          confirmButtonText: 'OK',
        });
      },
    );
  }

  fillTheValuePresident() {
    this.dataSource.data.forEach((element, loop) => {

      if (!this.isGroupTest) {
        if (
          !this.studentDataToSend.students[loop].professional_jury_member ||
          this.studentDataToSend.students[loop].professional_jury_member
        ) {
          if (this.profesionalJuryDefault.value) {
            const tempData = this.studentDataToSend.students[loop];
            let type = '-';
            let validation = false;
            if (this.profesionalJuryDefault.value === tempData.academic_jury_member) {
              type = 'JURY_ORGANIZATION.ACADEMIC';
              validation = true;
            } else if (this.profesionalJuryDefault.value === tempData.substitution_jury_member) {
              type = 'JURY_ORGANIZATION.SUBSTITUTE';
              validation = true;
            }
            if (validation) {
              Swal.fire({
                type: 'error',
                title: this.translate.instant('ERROR_SELECT_SAME_USER_JURY.TITLE'),
                text: this.translate.instant('ERROR_SELECT_SAME_USER_JURY.TEXT', { juryMemberType: this.translate.instant(type) }),
                footer: `<span style="margin-left: auto">ERROR_SELECT_SAME_USER_JURY</span>`,
                confirmButtonText: this.translate.instant('ERROR_SELECT_SAME_USER_JURY.BUTTON'),
              }).then(() => {
                this.studentDataToSend.students[loop].professional_jury_member = null;
                this.profesionalJuryDefault.patchValue(null);
              });
            } else if (!this.studentDataToSend.students[loop].professional_jury_member) {
              this.studentDataToSend.students[loop].professional_jury_member = this.profesionalJuryDefault.value;
            }
          }
        }
      } else {
        if (
          this.studentDataToSend.test_groups[loop].professional_jury_member ||
          this.studentDataToSend.test_groups[loop].professional_jury_member
        ) {
          if (this.profesionalJuryDefault.value) {
            const tempData = this.studentDataToSend.test_groups[loop];
            let type = '-';
            let validation = false;
            if (this.profesionalJuryDefault.value === tempData.academic_jury_member) {
              type = 'JURY_ORGANIZATION.ACADEMIC';
              validation = true;
            } else if (this.profesionalJuryDefault.value === tempData.substitution_jury_member) {
              type = 'JURY_ORGANIZATION.SUBSTITUTE';
              validation = true;
            }
            if (validation) {
              Swal.fire({
                type: 'error',
                title: this.translate.instant('ERROR_SELECT_SAME_USER_JURY.TITLE'),
                text: this.translate.instant('ERROR_SELECT_SAME_USER_JURY.TEXT', { juryMemberType: this.translate.instant(type) }),
                footer: `<span style="margin-left: auto">ERROR_SELECT_SAME_USER_JURY</span>`,
                confirmButtonText: this.translate.instant('ERROR_SELECT_SAME_USER_JURY.BUTTON'),
              }).then(() => {
                this.studentDataToSend.test_groups[loop].professional_jury_member = null;
                this.profesionalJuryDefault.patchValue(null);
              });
            } else if (!this.studentDataToSend.test_groups[loop].professional_jury_member) {
              this.studentDataToSend.test_groups[loop].professional_jury_member = this.profesionalJuryDefault.value;
            }
          }
        }
      }
    });
  }

  fillTheValueAcademic() {
    this.dataSource.data.forEach((element, loop) => {
      if (!this.isGroupTest) {
        if (!this.studentDataToSend.students[loop].academic_jury_member || this.studentDataToSend.students[loop].academic_jury_member) {
          if (this.academicJuryDefault.value) {
            const tempData = this.studentDataToSend.students[loop];
            let type = '-';
            let validation = false;
            if (this.academicJuryDefault.value === tempData.professional_jury_member) {
              type = 'JURY_ORGANIZATION.PROFESIONAL';
              validation = true;
            } else if (this.academicJuryDefault.value === tempData.substitution_jury_member) {
              type = 'JURY_ORGANIZATION.SUBSTITUTE';
              validation = true;
            }
            if (validation) {
              Swal.fire({
                type: 'error',
                title: this.translate.instant('ERROR_SELECT_SAME_USER_JURY.TITLE'),
                text: this.translate.instant('ERROR_SELECT_SAME_USER_JURY.TEXT', { juryMemberType: this.translate.instant(type) }),
                footer: `<span style="margin-left: auto">ERROR_SELECT_SAME_USER_JURY</span>`,
                confirmButtonText: this.translate.instant('ERROR_SELECT_SAME_USER_JURY.BUTTON'),
              }).then(() => {
                this.studentDataToSend.students[loop].academic_jury_member = null;
                this.academicJuryDefault.patchValue(null);
              });
            } else if (!this.studentDataToSend.students[loop].academic_jury_member) {
              this.studentDataToSend.students[loop].academic_jury_member = this.academicJuryDefault.value;
            }
          }
        }
      } else {
        if (this.studentDataToSend.test_groups[loop].academic_jury_member) {
          if (this.academicJuryDefault.value) {
            const tempData = this.studentDataToSend.test_groups[loop];
            let type = '-';
            let validation = false;
            if (this.academicJuryDefault.value === tempData.professional_jury_member) {
              type = 'JURY_ORGANIZATION.PROFESIONAL';
              validation = true;
            } else if (this.academicJuryDefault.value === tempData.substitution_jury_member) {
              type = 'JURY_ORGANIZATION.SUBSTITUTE';
              validation = true;
            }
            if (validation) {
              Swal.fire({
                type: 'error',
                title: this.translate.instant('ERROR_SELECT_SAME_USER_JURY.TITLE'),
                text: this.translate.instant('ERROR_SELECT_SAME_USER_JURY.TEXT', { juryMemberType: this.translate.instant(type) }),
                footer: `<span style="margin-left: auto">ERROR_SELECT_SAME_USER_JURY</span>`,
                confirmButtonText: this.translate.instant('ERROR_SELECT_SAME_USER_JURY.BUTTON'),
              }).then(() => {
                this.studentDataToSend.test_groups[loop].academic_jury_member = null;
                this.academicJuryDefault.patchValue(null);
              });
            } else if (!this.studentDataToSend.test_groups[loop].academic_jury_member) {
              this.studentDataToSend.test_groups[loop].academic_jury_member = this.academicJuryDefault.value;
            }
          }
        }
      }
    });
  }

  fillTheValueSubstitue() {
    this.dataSource.data.forEach((element, loop) => {
      if (!this.isGroupTest) {
        if (
          !this.studentDataToSend.students[loop].substitution_jury_member ||
          this.studentDataToSend.students[loop].substitution_jury_member
        ) {
          if (this.subtituteJuryDefault.value) {
            const tempData = this.studentDataToSend.students[loop];
            let validation = false;
            let type = '-';
            if (this.subtituteJuryDefault.value === tempData.professional_jury_member) {
              type = 'JURY_ORGANIZATION.PROFESIONAL';
              validation = true;
            } else if (this.subtituteJuryDefault.value === tempData.academic_jury_member) {
              type = 'JURY_ORGANIZATION.ACADEMIC';
              validation = true;
            }
            if (validation) {
              Swal.fire({
                type: 'error',
                title: this.translate.instant('ERROR_SELECT_SAME_USER_JURY.TITLE'),
                text: this.translate.instant('ERROR_SELECT_SAME_USER_JURY.TEXT', { juryMemberType: this.translate.instant(type) }),
                footer: `<span style="margin-left: auto">ERROR_SELECT_SAME_USER_JURY</span>`,
                confirmButtonText: this.translate.instant('ERROR_SELECT_SAME_USER_JURY.BUTTON'),
              }).then(() => {
                this.studentDataToSend.students[loop].substitution_jury_member = null;
                this.subtituteJuryDefault.patchValue(null);
              });
            } else if (!this.studentDataToSend.students[loop].substitution_jury_member) {
              this.studentDataToSend.students[loop].substitution_jury_member = this.subtituteJuryDefault.value;
            }
          }
        }
      } else {
        if (this.studentDataToSend.test_groups[loop].substitution_jury_member) {
          if (this.subtituteJuryDefault.value) {
            const tempData = this.studentDataToSend.test_groups[loop];
            let type = '-';
            let validation = false;
            if (this.subtituteJuryDefault.value === tempData.professional_jury_member) {
              type = 'JURY_ORGANIZATION.PROFESIONAL';
              validation = true;
            } else if (this.subtituteJuryDefault.value === tempData.academic_jury_member) {
              type = 'JURY_ORGANIZATION.ACADEMIC';
              validation = true;
            }
            if (validation) {
              Swal.fire({
                type: 'error',
                title: this.translate.instant('ERROR_SELECT_SAME_USER_JURY.TITLE'),
                text: this.translate.instant('ERROR_SELECT_SAME_USER_JURY.TEXT', { juryMemberType: this.translate.instant(type) }),
                footer: `<span style="margin-left: auto">ERROR_SELECT_SAME_USER_JURY</span>`,
                confirmButtonText: this.translate.instant('ERROR_SELECT_SAME_USER_JURY.BUTTON'),
              }).then(() => {
                this.studentDataToSend.test_groups[loop].substitution_jury_member = null;
                this.subtituteJuryDefault.patchValue(null);
              });
            } else if (!this.studentDataToSend.test_groups[loop].substitution_jury_member) {
              this.studentDataToSend.test_groups[loop].substitution_jury_member = this.subtituteJuryDefault.value;
            }
          }
        }
      }
    });
  }

  initializeRowData() {
    if (!this.isGroupTest) {
      // check if the row has ever assigned/saved. if never saved before, initialize the value
      let isRowHasAssigned = false;
      this.studentDataToSend.students.forEach((row) => {
        if (this.checkUndefined(() => row.studentId, '') !== '') {
          isRowHasAssigned = true;
        }
      });

      if (isRowHasAssigned === false) {
        // if all data has not assigned, then assign all row with student
        this.studentSectionList.forEach((section, index) => {
          this.studentDataToSend.students[index] = {
            studentId: this.studentsToAssign[index + 1].id, //index+1 because index 0 is for "Not assigned" option
            jury_member_id: section.jury_member_id,
            test_hours_start: this.parseLocalToUTC.transform(section.test_hours_start),
            date_test: section.date_test,
          };
        });
      }

      // disable the assigned selection value from dropdown
      this.studentDataToSend.students.forEach((student) => {
        for (let i = 0; i < this.studentsToAssign.length; i++) {
          if (this.studentsToAssign[i].id === student.studentId) {
            this.studentsToAssign[i].disabled = true;
          }
        }
      });

      // Save the first time if user come in
      if (this.isFirstTimeAccess) {
        this.saveTheFirstTime();
      }
    } else {
      let isRowHasAssigned = false;
      this.studentDataToSend.test_groups.forEach((row) => {

        if (this.checkUndefined(() => row.groupId, '') !== '') {
          isRowHasAssigned = true;
        }
      });


      if (isRowHasAssigned === false) {
        // if all data has not assigned, then assign all row with student
        this.studentSectionList.forEach((section, index) => {
          this.studentDataToSend.test_groups[index] = {
            groupId: this.groupsToAssign[index + 1].id, //index+1 because index 0 is for "Not assigned" option
            jury_member_id: section.jury_member_id,
            test_hours_start: this.parseLocalToUTC.transform(section.test_hours_start),
            date_test: section.date_test,
          };
        });
      }

      // disable the assigned selection value from dropdown
      this.studentDataToSend.test_groups.forEach((group) => {
        for (let i = 0; i < this.groupsToAssign.length; i++) {
          if (this.groupsToAssign[i].id === group.groupId) {
            this.groupsToAssign[i].disabled = true;
          }
        }
      });
    }


  }

  assignSelectedStudent(event, index: number, row: StudentTestSection) {


    const oldId = this.checkUndefined(() => this.studentDataToSend.students[index].studentId, '');

    // If event is empty string 0 or undefined, mean it selecting 'Not Assigned' or they use the X button. So we simply need to change

    if (event !== '0') {
      // disable selected item from the dropdown list
      // this.studentsToAssign.forEach((studentAssign, studentIndex) => {
      //   if (studentAssign && studentAssign.id === event) {
      //     this.studentsToAssign[studentIndex].disabled = true;
      //   }
      // })
      this.updateProfesionalDropdownIfStudentChanged(index);

      // this.studentsToAssign[index].disabled = true;
      // disable selected item from the dropdown list
      // for (let i = 0; i < this.studentsToAssign.length; i++) {
      //   if (this.studentsToAssign[i].id === event) {
      //     this.studentsToAssign[i].disabled = true;
      //   }
      // }
    } else if (event === '0' || typeof event === 'undefined') {
      // disable selected item from the dropdown list
      // this.studentsToAssign.forEach((studentAssign, studentIndex) => {
      //   if (studentAssign && studentAssign.id === event) {
      //     this.studentsToAssign[studentIndex].disabled = true;
      //   }
      // })
      // enable selected item from the dropdown list
      // this.studentsToAssign.forEach((studentAssign, studentIndex) => {

      //   if (studentAssign && row && row['student_id'] && row['student_id']['_id'] && studentAssign.id === event) {
      //     this.studentsToAssign[studentIndex].disabled = false;
      //   }
      // })
      // this.studentsToAssign[index + 1].disabled = false;
      // change the professional juries list if user is changed
      this.updateProfesionalDropdownIfStudentChanged(index);
    }

    // if (oldId !== '0') {
    //   // enable old id to the dropdown list
    //   this.studentsToAssign.forEach((studentAssign, studentIndex) => {

    //     if (studentAssign && row && row['student_id'] && row['student_id']['_id'] && studentAssign.id === oldId) {
    //       this.studentsToAssign[studentIndex].disabled = false;
    //     }
    //   })

    // }




    this.studentsToAssign = this.studentsToAssign.slice();
  }

  isStudentSelected(studentId) {
    if (studentId === '0') {
      return false;
    } else {
      const foundStudent = this.studentDataToSend.students.find((student) => student.studentId === studentId);
      if (foundStudent) {
        return true;
      } else {
        return false;
      }
    }


  }

  updateProfesionalDropdownIfStudentChanged(index) {
    this.professionalJuriesListPerIndex[index] = this.professionalJuriesList;
    this.studentDataToSend.students[index].professional_jury_member = null;

    if (this.studentDataToSend && this.studentDataToSend.students && this.studentDataToSend.students.length) {
      this.studentDataToSend.students.forEach((studentSend, studentSendIndex) => {
        if (studentSendIndex === index) {
          const foundStudent = this.studentAndMentor.find((studentMentor) => studentMentor._id === studentSend.studentId);
          if (foundStudent && foundStudent.mentor && foundStudent.mentor._id) {
            this.professionalJuriesListPerIndex[studentSendIndex] = [
              ...this.professionalJuriesListPerIndex[studentSendIndex],
              foundStudent.mentor,
            ];
          }
        }
      });
    }
  }

  formatPayloadBeforeSend() {
    const payload = _.cloneDeep(this.studentDataToSend);

    if (this.isGroupTest) {
      delete payload.students;
      if (payload && payload.test_groups && payload.test_groups.length) {
        payload.test_groups.forEach((group) => {
          if (group && group.date_test) {
            delete group.date_test;
          }
        });
      }
    } else {
      delete payload.test_groups;
      if (payload && payload.students && payload.students.length) {
        payload.students.forEach((student) => {
          if (student && student.date_test) {
            delete student.date_test;
          }
          if (student && student.studentId) {
            student.student_id = student.studentId;
            delete student.studentId;
          }
        });
      }
    }

    return payload;
  }

  saveTheFirstTime() {






    const dataPayload = this.formatPayloadBeforeSend();
    const payload = {
      jury_id: this.juryOrgId,
      rncp_title_id: this.rncpId,
      school_id: this.schoolId,
      lang: this.translate.currentLang,
      is_submit: false,
      students_input: dataPayload.students,
      test_groups_input: dataPayload.test_groups,
    };



    this.subs.sink = this.juryService
      .saveAssignStudent(
        payload.jury_id,
        payload.rncp_title_id,
        payload.school_id,
        payload.lang,
        payload.is_submit,
        payload.students_input,
        payload.test_groups_input,
      )
      .subscribe((resp) => {

        this.router
          .navigateByUrl('/', { skipLocationChange: true })
          .then(() =>
            this.router.navigate([
              'jury-organization',
              this.juryOrgId,
              'assign-student',
              this.schoolId,
              this.rncpId,
              this.classId,
              this.jury_serial_number,
            ]),
          );
      });
  }

  saveAssignStudent() {
    const dataPayload = this.formatPayloadBeforeSend();
    const payload = {
      jury_id: this.juryOrgId,
      rncp_title_id: this.rncpId,
      school_id: this.schoolId,
      lang: this.translate.currentLang,
      is_submit: false,
      students_input: dataPayload.students,
      test_groups_input: dataPayload.test_groups,
    };



    this.subs.sink = this.juryService
      .saveAssignStudent(
        payload.jury_id,
        payload.rncp_title_id,
        payload.school_id,
        payload.lang,
        payload.is_submit,
        payload.students_input,
        payload.test_groups_input,
      )
      .subscribe((resp) => {

        if (resp) {
          Swal.fire({
            title: this.translate.instant('JURY_ORGANIZATION.JURY_S19.TITLE'),
            footer: `<span style="margin-left: auto">JURY_S19</span>`,
            type: 'success',
            confirmButtonText: this.translate.instant('JURY_ORGANIZATION.JURY_S19.OK'),
          }).then((result) => {
            this.goBack();
          });
        }
      });
  }

  submitAssignStudent() {
    const dataPayload = this.formatPayloadBeforeSend();
    const payload = {
      jury_id: this.juryOrgId,
      rncp_title_id: this.rncpId,
      school_id: this.schoolId,
      lang: this.translate.currentLang,
      is_submit: true,
      students_input: dataPayload.students,
      test_groups_input: dataPayload.test_groups,
    };

    Swal.fire({
      type: 'question',
      title: this.translate.instant('JURY_ORGANIZATION.JURY_S20.TITLE'),
      html: this.translate.instant('JURY_ORGANIZATION.JURY_S20.TEXT', {
        juryName: this.juryOrgData.name,
        schoolShortName: this.schoolData.schools.school.short_name,
        titleShortName: this.schoolData.rncp_id.short_name,
      }),
      showCancelButton: true,
      allowEscapeKey: true,
      confirmButtonText: this.translate.instant('JURY_ORGANIZATION.JURY_S20.CONFIRM_BTN', { timer: 1000 }),
      cancelButtonText: this.translate.instant('JURY_ORGANIZATION.JURY_S20.CANCEL_BTN'),
      footer: `<span style="margin-left: auto">JURY_S20</span>`
    }).then((isComfirm) => {
      this.isLoading = true;
      if (isComfirm.value) {
        this.subs.sink = this.juryService
          .saveAssignStudent(
            payload.jury_id,
            payload.rncp_title_id,
            payload.school_id,
            payload.lang,
            payload.is_submit,
            payload.students_input,
            payload.test_groups_input,
          )
          .subscribe((resp) => {

            if (resp) {
              Swal.fire({
                title: this.translate.instant('JURY_ORGANIZATION.JURY_S18b.TITLE'),
                type: 'success',
              }).then((result) => {
                this.goBack();
              });
            }
          });
      }
    });
  }

  convertUTCToLocalDate(data) {
    const date = moment(data.date).format('DD/MM/YYYY');
    const time = data.time_start;

    const dateTimeInLocal = moment(date + time, 'DD/MM/YYYYHH:mm');
    return dateTimeInLocal.toISOString();
  }

  convertLocalDateToUTC(data) {
    const date = moment(data.date).format('DD/MM/YYYY');
    const time = data.time_start;

    const dateTimeInUTC = moment(date + time, 'DD/MM/YYYYHH:mm');

    return dateTimeInUTC.toISOString();
  }

  formatJurySerialNumber(jury: string): string {
    if (jury) {
      return jury.slice(0, 8) + '-' + jury.slice(8, 11) + '-' + jury.slice(11, 14);
    } else {
      return '';
    }
  }

  checkIfNotAssign() {
    let isNotAssigned = false;

    if (this.isGroupTest) {
      if (this.checkUndefined(() => this.studentDataToSend.test_groups, '') !== '') {
        this.studentDataToSend.test_groups.forEach((group) => {
          if (group.groupId === '0') {
            isNotAssigned = true;
          }
        });
      }
    } else {
      if (this.checkUndefined(() => this.studentDataToSend.students, '') !== '') {
        this.studentDataToSend.students.forEach((student) => {
          if (student.studentId === '0') {
            isNotAssigned = true;
          }
        });
      }
    }
    return isNotAssigned;
  }

  checkUndefined(fn, defaultVal) {
    try {
      return fn();
    } catch (e) {
      return defaultVal;
    }
  }

  getUserTypesId() {
    this.isLoading = true;
    this.acadKitService.getAllUserTypes().subscribe((resp) => {
      this.isLoading = false;

      // professional jury => pro jury + mentor
      // const professionalJuryType = resp.find((type) => type.name === 'Professional Jury Member');
      // this.proJuryTypeId = professionalJuryType ? professionalJuryType._id : null;
      // const mentorType = resp.find((type) => type.name === 'Mentor');
      // this.mentorTypeId = mentorType ? mentorType._id : null;

      const list = resp.map((jury) => {
        if (jury.role === 'preparation_center') {
          this.professionalJuryIdList.push(jury._id);
        }
      });


      // academic => user acad jury member
      const academicJuryType = resp.find((type) => type.name === 'Academic Final Jury Member');
      this.acadJuryTypeId = academicJuryType ? academicJuryType._id : null;
      this.getJuries();
    });
  }

  getJuries() {
    let school = [];
    let rncpTitle = [];
    if (this.juryOrgData && this.juryOrgData.rncp_titles) {
      this.juryOrgData.rncp_titles.forEach((title) => {
        if (title.rncp_id && title.rncp_id._id) {
          rncpTitle.push(title.rncp_id._id);
        }
        if (title.schools) {
          title.schools.forEach((sch) => {
            if (sch.school && sch.school._id) {
              school.push(sch.school._id);
            }
          });
        }
      });
    }
    school = uniq(school);
    rncpTitle = uniq(rncpTitle);

    if (school.length && rncpTitle.length) {
      this.getProfessionalJuries(school, rncpTitle);
      this.getAcademicJuries(school, rncpTitle);
      this.getSubtituteJuries(school, rncpTitle);
    }
  }

  getProfessionalJuries(school: string[], rncpTitle: string[]) {
    // Grand oral and non grand oral is the same, difference is only mentor in profesional jury, will be handle on 
    // getSchoolData() => getStudentAndGroupSection() => initializeSendData() => getAssignedStudentAndGroup() => getStudentsToAssign()


    this.isLoading = true;
    const title = [this.rncpId];
    const schoolId = [this.schoolId];
    const schoolCRId = this.juryOrgData.certifier && this.juryOrgData.certifier._id ? [this.juryOrgData.certifier._id] : [];
    const forkParam = [];

    const pcGet = this.juryService.getJuriesPC(this.professionalUserTypePC, schoolId, title);
    forkParam.push(pcGet);


    const crGet = this.juryService.getJuriesCertifier(this.professionalUserTypeCR, schoolCRId, title);
    forkParam.push(crGet);

    this.subs.sink = forkJoin(forkParam).subscribe((resp) => {
      this.isLoading = false;
      if (resp && resp.length) {
        const result = [].concat(resp[0], resp[1]);

        this.professionalJuries = result;
        this.professionalJuriesList = this.professionalJuries.map((list) => {
          return { short_name: list.last_name.toUpperCase() + ' ' + list.first_name, _id: list._id };
        });
      }

    });

    // Need to get school after getting the juries data because we need to wait for jury to populated before patching mentor
    this.getSchoolData();
    // if (this.juryOrgData && this.juryOrgData.type === 'grand_oral') {
    //   this.isLoading = true;
    //   const title = [this.rncpId];
    //   const schoolId = [this.schoolId];
    //   const schoolCRId = this.juryOrgData.certifier && this.juryOrgData.certifier._id ? [this.juryOrgData.certifier._id] : [];
    //   const forkParam = [];
    //   const pcGet = this.juryService.getJuriesPC(this.professionalUserTypePC, schoolId, title);
    //   forkParam.push(pcGet);
    //   const crGet = this.juryService.getJuriesCertifier(this.professionalUserTypeCR, schoolCRId, title);
    //   forkParam.push(crGet);
    //   this.subs.sink = forkJoin(forkParam).subscribe((resp) => {
    //     this.isLoading = false;
    //     if (resp && resp.length) {
    //       const result = [].concat(resp[0], resp[1]);

    //       this.professionalJuries = result;
    //       this.professionalJuriesList = this.professionalJuries.map((list) => {
    //         return { short_name: list.last_name.toUpperCase() + ' ' + list.first_name, _id: list._id };
    //       });
    //     }

    //   });

    //   // Need to get school after getting the juries data because we need to wait for jury to populated before patching mentor
    //   this.getSchoolData();
    // } else {
    //   this.isLoading = true;
    //   this.juryService.getJuries(this.professionalJuriesUserTypes, school, rncpTitle).subscribe((resp) => {
    //     this.isLoading = false;
    //     this.professionalJuries = resp;
    //     this.professionalJuriesList = this.professionalJuries.map((list) => {
    //       return { short_name: list.last_name.toUpperCase() + ' ' + list.first_name, _id: list._id };
    //     });

    //     // Need to get school after getting the juries data because we need to wait for jury to populated before patching mentor
    //     this.getSchoolData();
    //   });
    // }
  }

  getAcademicJuries(school: string[], rncpTitle: string[]) {
    // Grand oral and non grand oral is the same, difference is only mentor in profesional jury, will be handle on 
    // getSchoolData() => getStudentAndGroupSection() => initializeSendData() => getAssignedStudentAndGroup() => getStudentsToAssign()
    this.isLoading = true;
    const title = [this.rncpId];
    const schoolId = [this.schoolId];
    const schoolCRId = this.juryOrgData.certifier && this.juryOrgData.certifier._id ? [this.juryOrgData.certifier._id] : [];
    const forkParam = [];
    const pcGet = this.juryService.getJuriesPC(this.academicUserTypePC, schoolId, title);
    forkParam.push(pcGet);
    const crGet = this.juryService.getJuriesCertifier(this.academicUserTypeCR, schoolCRId, title);
    forkParam.push(crGet);
    this.subs.sink = forkJoin(forkParam).subscribe((resp) => {
      this.isLoading = false;
      if (resp && resp.length) {
        const result = [].concat(resp[0], resp[1]);

        this.academicJuries = result;
        this.academicJuriesList = this.academicJuries.map((list) => {
          return { name: list.last_name.toUpperCase() + ' ' + list.first_name, _id: list._id };
        });
      }

    });


    // if (this.juryOrgData && this.juryOrgData.type === 'grand_oral') {
    //   this.isLoading = true;
    //   const title = [this.rncpId];
    //   const schoolId = [this.schoolId];
    //   const schoolCRId = this.juryOrgData.certifier && this.juryOrgData.certifier._id ? [this.juryOrgData.certifier._id] : [];
    //   const forkParam = [];
    //   const pcGet = this.juryService.getJuriesPC(this.academicUserTypePC, schoolId, title);
    //   forkParam.push(pcGet);
    //   const crGet = this.juryService.getJuriesCertifier(this.academicUserTypeCR, schoolCRId, title);
    //   forkParam.push(crGet);
    //   this.subs.sink = forkJoin(forkParam).subscribe((resp) => {
    //     this.isLoading = false;
    //     if (resp && resp.length) {
    //       const result = [].concat(resp[0], resp[1]);

    //       this.academicJuries = result;
    //       this.academicJuriesList = this.academicJuries.map((list) => {
    //         return { name: list.last_name.toUpperCase() + ' ' + list.first_name, _id: list._id };
    //       });
    //     }

    //   });
    // } else {
    //   this.isLoading = true;
    //   this.juryService.getJuries([this.acadJuryTypeId], school, rncpTitle).subscribe((resp) => {
    //     this.isLoading = false;
    //     this.academicJuries = resp;
    //     this.academicJuriesList = this.academicJuries.map((list) => {
    //       return { name: list.last_name.toUpperCase() + ' ' + list.first_name, _id: list._id };
    //     });

    //   });
    // }
  }

  getSubtituteJuries(school: string[], rncpTitle: string[]) {
    // Grand oral and non grand oral is the same, difference is only mentor in profesional jury, will be handle on 
    // getSchoolData() => getStudentAndGroupSection() => initializeSendData() => getAssignedStudentAndGroup() => getStudentsToAssign()
    this.isLoading = true;
    const title = [this.rncpId];
    const schoolId = [this.schoolId];
    this.juryService.getJuriesPC(this.substituteUserType, schoolId, title).subscribe((resp) => {
      this.isLoading = false;
      this.subtituteJuries = resp;
      this.subtituteJuriesList = this.subtituteJuries.map((list) => {
        return { name: list.last_name.toUpperCase() + ' ' + list.first_name, _id: list._id };
      });

    });

    // if (this.juryOrgData && this.juryOrgData.type === 'grand_oral') {
    //   this.isLoading = true;
    //   const title = [this.rncpId];
    //   const schoolId = [this.schoolId];
    //   this.juryService.getJuriesPC(this.substituteUserType, schoolId, title).subscribe((resp) => {
    //     this.isLoading = false;
    //     this.subtituteJuries = resp;
    //     this.subtituteJuriesList = this.subtituteJuries.map((list) => {
    //       return { name: list.last_name.toUpperCase() + ' ' + list.first_name, _id: list._id };
    //     });

    //   });
    // } else {
    //   const juryTypesUnderAcadir = this.usersService.PCUsertypeList;
    //   this.isLoading = true;
    //   this.juryService.getJuries(this.professionalJuriesUserTypes, school, rncpTitle).subscribe((resp) => {
    //     this.isLoading = false;
    //     this.subtituteJuries = resp;
    //     this.subtituteJuriesList = this.subtituteJuries.map((list) => {
    //       return { name: list.last_name.toUpperCase() + ' ' + list.first_name, _id: list._id };
    //     });

    //   });
    // }
  }

  isUserHasSameSchool(schoolId: string, userEntities: JuryDataEntities[]): boolean {
    if (schoolId && userEntities.length) {
      return !!userEntities.find((entity) => (entity.school && entity.school._id ? entity.school._id === schoolId : false));
    }
    return false;
  }

  selectProfessional(event, index) {

    // If not valid, then we need to update
    if (event && !this.checkIfUserHasSelected(event, index)) {
      let tempData;
      if (!this.isGroupTest) {
        if (this.studentDataToSend && this.studentDataToSend.students && this.studentDataToSend.students[index]) {
          tempData = this.studentDataToSend.students[index];
        }
      } else {
        if (this.studentDataToSend && this.studentDataToSend.test_groups && this.studentDataToSend.test_groups[index]) {
          tempData = this.studentDataToSend.test_groups[index];
        }
      }

      if (tempData) {
        let type = '-';
        if (tempData.professional_jury_member === tempData.academic_jury_member) {
          type = 'JURY_ORGANIZATION.ACADEMIC';
        } else if (tempData.professional_jury_member === tempData.substitution_jury_member) {
          type = 'JURY_ORGANIZATION.SUBSTITUTE';
        }
        Swal.fire({
          type: 'error',
          title: this.translate.instant('ERROR_SELECT_SAME_USER_JURY.TITLE'),
          text: this.translate.instant('ERROR_SELECT_SAME_USER_JURY.TEXT', { juryMemberType: this.translate.instant(type) }),
          footer: `<span style="margin-left: auto">ERROR_SELECT_SAME_USER_JURY</span>`,
          confirmButtonText: this.translate.instant('ERROR_SELECT_SAME_USER_JURY.BUTTON'),
        }).then(() => {
          if (!this.isGroupTest) {

            this.studentDataToSend.students[index].professional_jury_member = null;
          } else {
            this.studentDataToSend.test_groups[index].professional_jury_member = null;
          }
        });
      }
    }
  }

  selectAcademic(event, index) {

    if (event && !this.checkIfUserHasSelected(event, index)) {
      let tempData;
      if (!this.isGroupTest) {
        if (this.studentDataToSend && this.studentDataToSend.students && this.studentDataToSend.students[index]) {
          tempData = this.studentDataToSend.students[index];
        }
      } else {
        if (this.studentDataToSend && this.studentDataToSend.test_groups && this.studentDataToSend.test_groups[index]) {
          tempData = this.studentDataToSend.test_groups[index];
        }
      }

      if (tempData) {
        let type = '-';
        if (tempData.academic_jury_member === tempData.professional_jury_member) {
          type = 'JURY_ORGANIZATION.PROFESIONAL';
        } else if (tempData.academic_jury_member === tempData.substitution_jury_member) {
          type = 'JURY_ORGANIZATION.SUBSTITUTE';
        }
        Swal.fire({
          type: 'error',
          title: this.translate.instant('ERROR_SELECT_SAME_USER_JURY.TITLE'),
          text: this.translate.instant('ERROR_SELECT_SAME_USER_JURY.TEXT', { juryMemberType: this.translate.instant(type) }),
          footer: `<span style="margin-left: auto">ERROR_SELECT_SAME_USER_JURY</span>`,
          confirmButtonText: this.translate.instant('ERROR_SELECT_SAME_USER_JURY.BUTTON'),
        }).then(() => {
          if (!this.isGroupTest) {

            this.studentDataToSend.students[index].academic_jury_member = null;
          } else {
            this.studentDataToSend.test_groups[index].academic_jury_member = null;
          }
        });
      }
    }
  }

  selectSubtitute(event, index) {
    if (event && !this.checkIfUserHasSelected(event, index)) {
      let tempData;
      if (!this.isGroupTest) {
        if (this.studentDataToSend && this.studentDataToSend.students && this.studentDataToSend.students[index]) {
          tempData = this.studentDataToSend.students[index];
        }
      } else {
        if (this.studentDataToSend && this.studentDataToSend.test_groups && this.studentDataToSend.test_groups[index]) {
          tempData = this.studentDataToSend.test_groups[index];
        }
      }

      if (tempData) {
        let type = '-';
        if (tempData.substitution_jury_member === tempData.professional_jury_member) {
          type = 'JURY_ORGANIZATION.PROFESIONAL';
        } else if (tempData.substitution_jury_member === tempData.academic_jury_member) {
          type = 'JURY_ORGANIZATION.ACADEMIC';
        }
        Swal.fire({
          type: 'error',
          title: this.translate.instant('ERROR_SELECT_SAME_USER_JURY.TITLE'),
          text: this.translate.instant('ERROR_SELECT_SAME_USER_JURY.TEXT', { juryMemberType: this.translate.instant(type) }),
          footer: `<span style="margin-left: auto">ERROR_SELECT_SAME_USER_JURY</span>`,
          confirmButtonText: this.translate.instant('ERROR_SELECT_SAME_USER_JURY.BUTTON'),
        }).then(() => {
          if (!this.isGroupTest) {

            this.studentDataToSend.students[index].substitution_jury_member = null;
          } else {
            this.studentDataToSend.test_groups[index].substitution_jury_member = null;
          }
        });
      }
    }
  }

  checkIfUserHasSelected(user, index) {
    let validation = true;
    let tempData;
    if (!this.isGroupTest) {
      if (this.studentDataToSend && this.studentDataToSend.students && this.studentDataToSend.students[index]) {
        tempData = this.studentDataToSend.students[index];
      }
    } else {
      if (this.studentDataToSend && this.studentDataToSend.test_groups && this.studentDataToSend.test_groups[index]) {
        tempData = this.studentDataToSend.test_groups[index];
      }
    }

    if (
      (tempData &&
        tempData.academic_jury_member &&
        tempData.professional_jury_member &&
        tempData.academic_jury_member === tempData.professional_jury_member) ||
      (tempData.academic_jury_member &&
        tempData.substitution_jury_member &&
        tempData.academic_jury_member === tempData.substitution_jury_member) ||
      (tempData.professional_jury_member &&
        tempData.substitution_jury_member &&
        tempData.professional_jury_member === tempData.substitution_jury_member)
    ) {
      validation = false;
    }
    return validation;
  }

  goBack() {
    this._location.back();
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
