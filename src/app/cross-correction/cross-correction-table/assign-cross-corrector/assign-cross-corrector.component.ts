import { DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { PageTitleService } from 'app/core/page-title/page-title.service';
import { CrossCorrectionService } from 'app/service/cross-correction/cross-correction.service';
import { SubSink } from 'subsink';
import Swal from 'sweetalert2';
import { AssignCrossCorrectorTableComponent } from './assign-cross-corrector-table/assign-cross-corrector-table.component';

@Component({
  selector: 'ms-assign-cross-corrector',
  templateUrl: './assign-cross-corrector.component.html',
  styleUrls: ['./assign-cross-corrector.component.scss'],
})
export class AssignCrossCorrectorComponent implements OnInit, OnDestroy {
  @ViewChild(AssignCrossCorrectorTableComponent, { static: false }) assignCrossCorrectorTable: AssignCrossCorrectorTableComponent;
  private subs = new SubSink();
  isWaitingForResponse = false;
  params: any;
  className: string;
  titleName: string;
  testName: string;
  isDisable: boolean = false;
  datePipe: DatePipe;

  constructor(
    private pageTitleService: PageTitleService,
    private translate: TranslateService,
    private route: ActivatedRoute,
    private router: Router,
    private crossCorrectorService: CrossCorrectionService,
  ) {}

  ngOnInit() {
    this.pageTitleService.setIcon('recycle');

    this.params = this.route.snapshot.params;
    this.getTest();
    this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      this.datePipe = new DatePipe(this.translate.currentLang);
      this.pageTitleService.setTitle(this.translate.instant('TEST.AUTOTASK.ASSIGN CROSS CORRECTOR'));
    });
  }

  getTest() {
    this.subs.sink = this.crossCorrectorService.getOneTest(this.params.testId).subscribe((res) => {

      if (res) {
        this.className = res.class_id.name;
        this.titleName = res.parent_rncp_title.short_name;
        this.testName = res.name;
      }
    });
  }

  ngAfterViewChecked() {
    this.isDisable = this.assignCrossCorrectorTable.assigned > 0 ? true : false;
  }
  saveAndLeave() {
    const assignCrossCorrectorPayload = this.assignCrossCorrectorTable.getPayload();

    this.isWaitingForResponse = true;
    this.subs.sink = this.crossCorrectorService.CreateAndUpdateCrossCorrector(assignCrossCorrectorPayload).subscribe(
      (resp) => {
        this.isWaitingForResponse = false;

        Swal.fire({
          type: 'success',
          title: 'Bravo',
        }).then((result) => {
          if (result.value) {
            this.router.navigate(['/crossCorrection']);
          }
        });
      },
      (err) => Swal.fire({ type: 'error', title: 'Error' }),
    );
  }

  saveCorrection() {
    const assignCrossCorrectorPayload = this.assignCrossCorrectorTable.getPayload();

    this.isWaitingForResponse = true;
    this.subs.sink = this.crossCorrectorService.CreateAndUpdateCrossCorrector(assignCrossCorrectorPayload).subscribe(
      (resp) => {
        this.isWaitingForResponse = false;

        Swal.fire({
          type: 'success',
          title: 'Bravo',
        });
        // .then((result) => {
        //   if (result.value) {
        //     this.router.navigate(['/crossCorrection']);
        //   }
        // });
      },
      (err) => Swal.fire({ type: 'error', title: 'Error' }),
    );
  }

  sendNotif() {
    this.isWaitingForResponse = true;
    Swal.fire({
      title: this.translate.instant('CrossCorrection.CROSS_S1.Title'),
      text: this.translate.instant('CrossCorrection.CROSS_S1.Text'),
      type: 'question',
      allowEscapeKey: true,
      showCancelButton: true,
      footer: `<span style="margin-left: auto">CROSS_S1</span>`,
      cancelButtonText: this.translate.instant('CrossCorrection.CROSS_S1.Cancle'),
      confirmButtonText: this.translate.instant('CrossCorrection.CROSS_S1.OK'),
    }).then((result) => {
      if (result.value) {
        const assignCrossCorrectorPayload = this.assignCrossCorrectorTable.getPayload();
        this.subs.sink = this.crossCorrectorService.CreateAndUpdateCrossCorrector(assignCrossCorrectorPayload).subscribe(
          (resp) => {
            this.isWaitingForResponse = false;

            this.subs.sink = this.crossCorrectorService
              .sendNotificationButton(this.params.titleId, this.params.classId, this.params.testId)
              .subscribe(
                (res) => {

                  this.isWaitingForResponse = false;
                  Swal.fire({
                    title: this.translate.instant('CrossCorrection.CROSS_S4.Title'),
                    text: this.translate.instant('CrossCorrection.CROSS_S4.Text'),
                    type: 'success',
                    allowEscapeKey: true,
                    footer: `<span style="margin-left: auto">CROSS_S4</span>`,
                    confirmButtonText: this.translate.instant('CrossCorrection.CROSS_S4.Button'),
                  });
                },
                (err) => this.swalError(err),
              );
          },
          (err) => Swal.fire({ type: 'error', title: 'Error' }),
        );
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        this.isWaitingForResponse = false;
      }
    });
  }

  swalError(err) {
    this.isWaitingForResponse = false;

    Swal.fire({
      type: 'error',
      title: 'Error',
      text: err && err['message'] ? err['message'] : err,
      confirmButtonText: 'OK',
    });
  }

  ngOnDestroy() {
    this.pageTitleService.setIcon('');
    this.pageTitleService.setTitle('');
    this.subs.unsubscribe();
  }
}
