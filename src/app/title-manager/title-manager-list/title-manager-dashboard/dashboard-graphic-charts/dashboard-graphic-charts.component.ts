import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PermissionService } from 'app/service/permission/permission.service';

@Component({
  selector: 'ms-dashboard-graphic-charts',
  templateUrl: './dashboard-graphic-charts.component.html',
  styleUrls: ['./dashboard-graphic-charts.component.scss'],
})
export class DashboardGraphicChartsComponent implements OnInit {
  @Input() classId;
  @Input() rncpId: string;
  registrationStatus: boolean = false;
  schoolStatus: boolean = false;
  taskStatus: boolean = false;
  companyStatus: boolean = false;

  constructor(private route: ActivatedRoute, private router: Router, private permissionService: PermissionService) {}

  ngOnInit() {


  }

  onRegistrationClick() {
    const urlTree = this.router.createUrlTree(['../../registration', this.rncpId, this.classId], { relativeTo: this.route });
    const url = this.router.serializeUrl(urlTree);
    window.open(url, '_blank');
  }

  goToTitleManagerSchool() {
    const url = this.router.createUrlTree([`/title-manager/school/${this.rncpId}/${this.classId}`]);
    window.open(url.toString(), '_blank');
  }

  goToTitleManagerCompany() {
    const url = this.router.createUrlTree([`/title-manager/company/${this.rncpId}/${this.classId}`]);
    window.open(url.toString(), '_blank');
  }

  openVisibility(chart) {
    if (chart === 'registration') {
      this.registrationStatus = !this.registrationStatus;
    } else if (chart === 'school') {
      this.schoolStatus = !this.schoolStatus;
    } else if (chart === 'task') {
      this.taskStatus = !this.taskStatus;
    } else if (chart === 'company') {
      this.companyStatus = !this.companyStatus;
    }
  }

  showFollowupSchool() {
    return this.permissionService.showManagerTaskFollowupSchoolPerm();
  }

  showFolloupCompany() {
    return this.permissionService.showManagerTaskFollowupCompanyPerm();
  }

  showFollowupRegistration() {
    return this.permissionService.showManagerTaskFollowupRegistrationPerm();
  }

  showButtonFollowupSchool() {
    return this.permissionService.actionManagerTaskFollowupSchoolSeeTablePerm();
  }

  showButtonFollowupCompany() {
    return this.permissionService.actionManagerTaskFollowupCompanySeeTablePerm();
  }

  showButtonFollowupRegistration() {
    return this.permissionService.actionManagerTaskFollowupRegistrationSeeTablePerm();
  }
}
