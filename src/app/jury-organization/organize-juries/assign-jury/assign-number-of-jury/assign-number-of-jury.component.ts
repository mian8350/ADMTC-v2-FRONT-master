import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { JuryOrganizationService } from 'app/service/jury-organization/jury-organization.service';
import { SubSink } from 'subsink';
import Swal from 'sweetalert2';
import cloneDeep from 'lodash/cloneDeep';
import { JuryOrganizationParameter } from 'app/title-rncp/conditions/jury-organization-parameter/jury-organization-parameter.model';
import { Location } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';
import { AssignNumberJuryMainScheduleComponent } from './assign-number-jury-main-schedule/assign-number-jury-main-schedule.component';
import { AssignNumberJuryBackupScheduleComponent } from './assign-number-jury-backup-schedule/assign-number-jury-backup-schedule.component';
import * as _ from 'lodash';

@Component({
  selector: 'ms-assign-number-of-jury',
  templateUrl: './assign-number-of-jury.component.html',
  styleUrls: ['./assign-number-of-jury.component.scss']
})
export class AssignNumberOfJuryComponent implements OnInit {
  private subs = new SubSink();

  @ViewChild('mainSchedule', { static: false }) mainSchedule: AssignNumberJuryMainScheduleComponent;
  @ViewChild('backupSchedule', { static: false }) backupSchedule: AssignNumberJuryBackupScheduleComponent;

  juryOrgId: string;
  juryOrgData: JuryOrganizationParameter;

  clickedTabIndex;
  selected = 0;

  constructor(
    private route: ActivatedRoute,
    private juryService: JuryOrganizationService,
    private _location: Location,
    private translate: TranslateService
  ) { }

  ngOnInit() {
    this.juryOrgId = this.route.snapshot.paramMap.get('juryOrgId');
    this.getJuryData();
  }

  getJuryData() {
    this.subs.sink = this.juryService.getOneJuryOrganizationDataById(this.juryOrgId).subscribe(resp => {
      this.juryOrgData = _.cloneDeep(resp);

    }, (err) => {

        Swal.fire({
          type: 'error',
          title: 'Error',
          text: err && err['message'] ? err['message'] : err,
          confirmButtonText: 'OK',
        });
    })
  }

  getTabIndex(tabName: string): number {
    if (tabName === this.translate.instant('JURY_ORGANIZATION.MAIN_SCHEDULE')) {
      return 0;
    } else if (tabName === this.translate.instant('JURY_ORGANIZATION.BACKUP_SCHEDULE')) {
      return 1;
    } else {
      return -1;
    }
  }

  isChildDataChanged(): boolean {
    if (this.selected === 0) {
      return this.mainSchedule.isDataChanged();
    } else if (this.selected === 1) {
      return this.backupSchedule.isDataChanged();
    }
    return false;
  }

  checkValidation(clickEvent: any) {
    const isDataChanged: Boolean = this.isChildDataChanged();
    this.clickedTabIndex = this.getTabIndex(clickEvent.target.innerText);
    if (this.clickedTabIndex === -1) {
      return;
    }
    if (this.selected !== this.clickedTabIndex) {
      // check data in child component. if data edited, show swal
      if (isDataChanged) {
        Swal.fire({
          type: 'warning',
          title: this.translate.instant('TMTC_S01.TITLE'),
          text: this.translate.instant('TMTC_S01.TEXT'),
          footer: `<span style="margin-left: auto">TMTC_S01</span>`,
          confirmButtonText: this.translate.instant('TMTC_S01.BUTTON_1'),
          showCancelButton: true,
          cancelButtonText: this.translate.instant('TMTC_S01.BUTTON_2'),
          allowOutsideClick: false,
        }).then((result) => {
          if (!result.value) {
            this.selected = this.clickedTabIndex;
          }
        });
      } else {
        this.selected = this.clickedTabIndex;
      }
    }
  }

  goBack() {
    this._location.back();
  }
}
