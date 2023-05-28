import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SubSink } from 'subsink';
import * as _ from 'lodash';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';

@Component({
  selector: 'ms-usertype-class-duplication',
  templateUrl: './usertype-class-duplication.component.html',
  styleUrls: ['./usertype-class-duplication.component.scss'],
})
export class UsertypeClassDuplicationComponent implements OnInit, OnDestroy {
  @Input() selectedClassId;
  private subs = new SubSink();

  rncpId: any;
  isWaitingForResponse = false;
  classData: any;

  constructor(private router: ActivatedRoute, private rncpService: RNCPTitlesService) {}

  ngOnInit() {
    this.rncpId = this.router.snapshot.paramMap.get('rncpId');
    this.getOneClass();
  }

  getOneClass() {
    this.isWaitingForResponse = true;
    this.subs.sink = this.rncpService.getClassById(this.selectedClassId).subscribe(
      (resp) => {
        if (resp) {
          this.classData = _.cloneDeep(resp);

          this.isWaitingForResponse = false;
        }
      },
      (err) => (this.isWaitingForResponse = false),
    );
  }

  triggerRefresh(event) {
    this.getOneClass();
  }

  triggerSpinner(event) {
    this.isWaitingForResponse = event;
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
