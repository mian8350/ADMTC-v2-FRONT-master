import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { JuryOrganizationService } from 'app/service/jury-organization/jury-organization.service';
import { SubSink } from 'subsink';
import * as _ from 'lodash';
import Swal from 'sweetalert2';
import { JuryOrganizationParameter } from 'app/title-rncp/conditions/jury-organization-parameter/jury-organization-parameter.model';
import { NgxPermissionsService } from 'ngx-permissions';
import { PermissionService } from 'app/service/permission/permission.service';
import { TutorialService } from 'app/service/tutorial/tutorial.service';

@Component({
  selector: 'ms-organize-juries',
  templateUrl: './organize-juries.component.html',
  styleUrls: ['./organize-juries.component.scss'],
})
export class OrganizeJuriesComponent implements OnInit, OnDestroy {
  private subs = new SubSink();

  juryOrgId: string;
  juryData: JuryOrganizationParameter;

  navLinks: { path: string; label: string, queryParams?: any }[] = [
    // { path: 'assign-jury', label: 'JURY_ORGANIZATION.ASSIGNJURY' },
    // { path: 'assign-president-jury', label: 'JURY_ORGANIZATION.ASSIGNPRESIDENTJURY' },
    // { path: 'assign-member-jury', label: 'JURY_ORGANIZATION.ASSIGNMEMBERJURY' },
    // { path: 'assign-student-table', label: 'JURY_ORGANIZATION.ASSIGNSTUDENT' }
  ];

  constructor(
    private route: ActivatedRoute,
    private juryService: JuryOrganizationService,
    private permissions: NgxPermissionsService,
    private permissionService: PermissionService,
    private tutorialService: TutorialService,
  ) {}

  ngOnInit() {
    this.juryOrgId = this.route.snapshot.parent.paramMap.get('juryOrgId');
    this.getJuryData();
  }

  setDisplayedTab() {

    const allowTabGrandOralParameter = [
      'initialize',
      'set_up_grand_oral_parameter',
      'assign_number_jury',
      'assign_president_jury',
      'assign_member_jury',
      'assign_student_jury',
      'done',
    ];
    const allowTabAssignNumberJury = [
      'initialize',
      'assign_number_jury',
      'assign_president_jury',
      'assign_member_jury',
      'assign_student_jury',
      'done',
    ];
    const allowTabAssignPresidentJury = ['assign_president_jury', 'assign_member_jury', 'assign_student_jury', 'done'];
    const allowTabAssignMemberJury = ['assign_member_jury', 'assign_student_jury', 'done'];
    const allowTabAssignStudentJury = ['assign_member_jury', 'assign_student_jury', 'done'];
    const juryActivity = ['visio_jury', 'offline_jury', 'off_platform_jury'];
    
    if (this.juryData.type !== 'retake_grand_oral') {
      if (this.juryData.type === 'grand_oral') {
        if (this.juryData.is_new_flow && juryActivity.includes(this.juryData.jury_activity)) {
          if (
            allowTabGrandOralParameter.includes(this.juryData.current_status) && 
            this.permissionService.showMenu('certifications.jury_organization.jury_organization_assign_jury.show_perm')
          ) {
            this.navLinks.push({ path: 'grand-oral-jury-parameter', label: 'JURY_ORGANIZATION.GRANDORALJURYPARAMETER' });
          }
          if (
            allowTabAssignPresidentJury.includes(this.juryData.current_status) &&
            this.permissionService.showMenu('certifications.jury_organization.jury_organization_assign_jury.show_perm')
          ) {
            this.navLinks.push({ path: '../../setup-schedule-go', queryParams: {id: this.juryOrgId}, label: 'JURY_ORGANIZATION.SETUPSCHEDULE' });
          }
        } else {
          if (
            this.juryData.type === 'grand_oral' &&
            allowTabAssignNumberJury.includes(this.juryData.current_status) &&
            this.permissionService.showMenu('certifications.jury_organization.jury_organization_assign_jury.show_perm')
          ) {
            this.navLinks.push({ path: 'grand-oral-jury-parameter', label: 'JURY_ORGANIZATION.GRANDORALJURYPARAMETER' });
          }
          if (
            this.permissionService.showMenu('certifications.jury_organization.jury_organization_assign_jury.show_perm') &&
            allowTabAssignNumberJury.includes(this.juryData.current_status)
          ) {
            this.navLinks.push({ path: 'assign-jury', label: 'JURY_ORGANIZATION.ASSIGNJURY' });
          }
          if (
            this.permissionService.showMenu('certifications.jury_organization.jury_organization_assign_president_jury.show_perm') &&
            allowTabAssignPresidentJury.includes(this.juryData.current_status)
          ) {
            this.navLinks.push({ path: 'assign-president-jury', label: 'JURY_ORGANIZATION.ASSIGNPRESIDENTJURY' });
          }
          if (
            this.permissionService.showMenu('certifications.jury_organization.jury_organization_assign_member_jury.show_perm') &&
            allowTabAssignMemberJury.includes(this.juryData.current_status)
          ) {
            this.navLinks.push({ path: 'assign-member-jury', label: 'JURY_ORGANIZATION.ASSIGNMEMBERJURY' });
          }
          if (
            this.permissionService.showMenu('certifications.jury_organization.jury_organization_assign_jury.show_perm') &&
            allowTabAssignStudentJury.includes(this.juryData.current_status)
          ) {
            this.navLinks.push({ path: 'assign-backup-date', label: 'JURY_ORGANIZATION.BACKUPDATE' });
          }
          if (
            this.permissionService.showMenu('certifications.jury_organization.jury_organization_assign_student.show_perm') &&
            allowTabAssignStudentJury.includes(this.juryData.current_status)
          ) {
            this.navLinks.push({ path: 'assign-student-table', label: 'JURY_ORGANIZATION.ASSIGNSTUDENT' });
          }
        }
      } else {
        if (
          this.permissionService.showMenu('certifications.jury_organization.jury_organization_assign_jury.show_perm') &&
          allowTabAssignNumberJury.includes(this.juryData.current_status)
        ) {
          this.navLinks.push({ path: 'assign-jury', label: 'JURY_ORGANIZATION.ASSIGNJURY' });
        }
        if (
          this.permissionService.showMenu('certifications.jury_organization.jury_organization_assign_president_jury.show_perm') &&
          allowTabAssignPresidentJury.includes(this.juryData.current_status)
        ) {
          this.navLinks.push({ path: 'assign-president-jury', label: 'JURY_ORGANIZATION.ASSIGNPRESIDENTJURY' });
        }
        if (
          this.permissionService.showMenu('certifications.jury_organization.jury_organization_assign_member_jury.show_perm') &&
          allowTabAssignMemberJury.includes(this.juryData.current_status)
        ) {
          this.navLinks.push({ path: 'assign-member-jury', label: 'JURY_ORGANIZATION.ASSIGNMEMBERJURY' });
        }
        if (
          this.permissionService.showMenu('certifications.jury_organization.jury_organization_assign_jury.show_perm') &&
          allowTabAssignStudentJury.includes(this.juryData.current_status)
        ) {
          this.navLinks.push({ path: 'assign-backup-date', label: 'JURY_ORGANIZATION.BACKUPDATE' });
        }
        if (
          this.permissionService.showMenu('certifications.jury_organization.jury_organization_assign_student.show_perm') &&
          allowTabAssignStudentJury.includes(this.juryData.current_status)
        ) {
          this.navLinks.push({ path: 'assign-student-table', label: 'JURY_ORGANIZATION.ASSIGNSTUDENT' });
        }
      }

      // remove tab 'assign-member-jury' if jury_member_required is set to false
      if (this.juryData.jury_member_required === false) {
        this.navLinks = this.navLinks.filter((link) => link.path !== 'assign-member-jury');
      }
    } else {
      if (allowTabGrandOralParameter.includes(this.juryData.current_status) && this.permissionService.showMenu('certifications.jury_organization.jury_organization_assign_jury.show_perm')) {
        this.navLinks.push({ path: 'grand-oral-jury-parameter', label: 'JURY_ORGANIZATION.GRANDORALJURYPARAMETER' });
      }
      // Hide the tab for hotfix only phase 2 push
      if (allowTabAssignStudentJury.includes(this.juryData.current_status) && this.permissionService.showMenu('certifications.jury_organization.jury_organization_assign_student.show_perm')) {
        this.navLinks.push({ path: '../../setup-schedule', queryParams: {id: this.juryOrgId}, label: 'JURY_ORGANIZATION.SETUPSCHEDULE' });
      }
    }
  }

  getJuryData() {
    this.subs.sink = this.juryService.getOneJuryOrganizationDataById(this.juryOrgId).subscribe(
      (resp) => {
        this.juryData = _.cloneDeep(resp);
        this.setDisplayedTab();

        if (this.juryData && this.juryData.name) {
          this.tutorialService.setJuryName(this.juryData.name);
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
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
    // this.juryService.removeGrandOralParameter();
  }
}
