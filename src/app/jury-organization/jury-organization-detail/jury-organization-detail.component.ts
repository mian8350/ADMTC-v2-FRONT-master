import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { JuryOrganizationService } from 'app/service/jury-organization/jury-organization.service';
import { SubSink } from 'subsink';
import * as _ from 'lodash';
import Swal from 'sweetalert2';
import { JuryOrganizationParameter } from 'app/title-rncp/conditions/jury-organization-parameter/jury-organization-parameter.model';
import { NgxPermissionsService } from 'ngx-permissions';
import { PermissionService } from 'app/service/permission/permission.service';

@Component({
  selector: 'ms-jury-organization-detail',
  templateUrl: './jury-organization-detail.component.html',
  styleUrls: ['./jury-organization-detail.component.scss'],
})
export class JuryOrganizationDetailComponent implements OnInit {
  private subs = new SubSink();

  juryOrgId: string;
  juryData: JuryOrganizationParameter;

  navLinks: { path: string; label: string }[] = [];
  // [
  //   { path: 'organize-juries/assign-jury', label: 'JURY_ORGANIZATION.ORGANIZEJURIES' },
  //   { path: 'schedule-juries', label: 'JURY_ORGANIZATION.SCHEDULEJURIES' }
  // ];

  constructor(
    private route: ActivatedRoute,
    private juryService: JuryOrganizationService,
    private permissions: NgxPermissionsService,
    private permissionService: PermissionService,
  ) {}

  ngOnInit() {
    this.juryOrgId = this.route.snapshot.paramMap.get('juryOrgId');
    this.getJuryData();
  }

  setDisplayedTab() {
    const grandOralTypes = ['grand_oral', 'retake_grand_oral'];
    // For JURY ORGANIZATION tabs
    if (this.permissionService.showMenu('certifications.jury_organization.organize_juries.show_perm')) {
      if (
        grandOralTypes.includes(this.juryData.type) &&
        this.permissionService.showMenu('certifications.jury_organization.jury_organization_assign_jury.show_perm')
      ) {
        this.navLinks.push({ path: 'organize-juries/grand-oral-jury-parameter', label: 'JURY_ORGANIZATION.ORGANIZEJURIES' });
      } else if (this.permissionService.showMenu('certifications.jury_organization.jury_organization_assign_jury.show_perm')) {
        this.navLinks.push({ path: 'organize-juries/assign-jury', label: 'JURY_ORGANIZATION.ORGANIZEJURIES' });
      } else if (this.permissionService.showMenu('certifications.jury_organization.jury_organization_assign_president_jury.show_perm')) {
        this.navLinks.push({ path: 'organize-juries/assign-president-jury', label: 'JURY_ORGANIZATION.ORGANIZEJURIES' });
      } else if (this.permissionService.showMenu('certifications.jury_organization.jury_organization_assign_member_jury.show_perm')) {
        this.navLinks.push({ path: 'organize-juries/assign-member-jury', label: 'JURY_ORGANIZATION.ORGANIZEJURIES' });
      } else if (this.permissionService.showMenu('certifications.jury_organization.jury_organization_assign_student.show_perm')) {
        this.navLinks.push({ path: 'organize-juries/assign-student-table', label: 'JURY_ORGANIZATION.ORGANIZEJURIES' });
      }
    }

    // FOR SCHEDULE JURIES tab
    // if (
    //   this.permissionService.showMenu('certifications.jury_organization.schedule_juries.show_perm') &&
    //   this.permissionService.showMenu('certifications.jury_organization.jury_organization_schedule_jury.show_perm')
    // ) {
    //   if (this.juryData.is_new_flow) {
    //     if (
    //       this.juryData.jury_activity === 'off_platform_jury' &&
    //       grandOralTypes.includes(this.juryData.type) &&
    //       this.permissionService.showMenu('certifications.jury_organization.jury_mark_entry_table.show_perm')
    //     ) {
    //       this.navLinks.push({ path: 'jury-mark-entry', label: 'JURY_ORGANIZATION.JURYMARKENTRY' });
    //     } else {
    //       this.navLinks.push({ path: 'schedule-juries', label: 'JURY_ORGANIZATION.SCHEDULEJURIES' });
    //     }
    //   } else {
    //     this.navLinks.push({ path: 'schedule-juries', label: 'JURY_ORGANIZATION.SCHEDULEJURIES' });
    //   }
    // }

    if (this.juryData.is_new_flow) {
      if (
        this.juryData.jury_activity === 'off_platform_jury' &&
        grandOralTypes.includes(this.juryData.type) &&
        this.permissionService.showMenu('certifications.jury_organization.jury_mark_entry_table.show_perm')
      ) {
        this.navLinks.push({ path: 'jury-mark-entry', label: 'JURY_ORGANIZATION.JURYMARKENTRY' });
      } else if (
        this.juryData.jury_activity !== 'off_platform_jury' &&
        this.permissionService.showMenu('certifications.jury_organization.schedule_juries.show_perm') &&
        this.permissionService.showMenu('certifications.jury_organization.jury_organization_schedule_jury.show_perm')
      ) {
        this.navLinks.push({ path: 'schedule-juries', label: 'JURY_ORGANIZATION.SCHEDULEJURIES' });
      }
    } else {
      if (
        this.permissionService.showMenu('certifications.jury_organization.schedule_juries.show_perm') &&
        this.permissionService.showMenu('certifications.jury_organization.jury_organization_schedule_jury.show_perm')
      ) {
        this.navLinks.push({ path: 'schedule-juries', label: 'JURY_ORGANIZATION.SCHEDULEJURIES' });
      }
    }
  }

  getJuryData() {
    this.subs.sink = this.juryService.getOneJuryOrganizationDataById(this.juryOrgId).subscribe(
      (resp) => {
        this.juryData = _.cloneDeep(resp);
        this.setDisplayedTab();

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
}
