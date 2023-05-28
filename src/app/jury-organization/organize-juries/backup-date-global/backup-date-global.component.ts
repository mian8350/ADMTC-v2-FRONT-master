import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { JuryOrganizationService } from 'app/service/jury-organization/jury-organization.service';
import { SubSink } from 'subsink';

@Component({
  selector: 'ms-backup-date-global',
  templateUrl: './backup-date-global.component.html',
  styleUrls: ['./backup-date-global.component.scss']
})
export class BackupDateGlobalComponent implements OnInit {
  private subs = new SubSink();
  juryOrgId;
  backupData;
  isWaitingForResponse = false;


  constructor(
    private route: ActivatedRoute,
    private juryOrganizationService: JuryOrganizationService,
    private translate: TranslateService,
    private router: Router,
  ) { }

  ngOnInit() {
    this.juryOrgId = this.route.snapshot.parent.parent.paramMap.get('juryOrgId');
    this.GetGlobalBackupSchedule();
  }

  GetGlobalBackupSchedule() {
    this.isWaitingForResponse = true;
    this.subs.sink = this.juryOrganizationService.checkOneGlobalBackupSchedulePublished(this.juryOrgId).subscribe(resp => {
      this.isWaitingForResponse = false
      if (resp && resp.is_published) {
        this.backupData = resp
      } else {
        this.FirstTimePublishBackupSchedule();
      }
    }, (err) => {this.isWaitingForResponse = false})
  }

  FirstTimePublishBackupSchedule() {
    this.isWaitingForResponse = true;
    this.subs.sink = this.juryOrganizationService.publishGlobalBackupSchedule(this.juryOrgId).subscribe(resp => {
      this.isWaitingForResponse = false
      if (resp) {
        this.router
            .navigateByUrl('/', { skipLocationChange: true })
            .then(() => this.router.navigate(['jury-organization', this.juryOrgId, 'organize-juries', 'assign-backup-date']));
      }
    }, (err) => {this.isWaitingForResponse = false})
  }

}
