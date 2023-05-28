import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatTab, MatTabGroup, MatTabHeader } from '@angular/material/tabs';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { PageTitleService } from 'app/core/page-title/page-title.service';
import { EmployabilitySurveyService } from 'app/service/employability-survey/employability-survey.service';
import { SubSink } from 'subsink';
import Swal from 'sweetalert2';

@Component({
  selector: 'ms-employability-survey-details',
  templateUrl: './employability-survey-details.component.html',
  styleUrls: ['./employability-survey-details.component.scss'],
})
export class EmployabilitySurveyDetailsComponent implements OnInit, AfterViewInit, OnDestroy {
  private subs = new SubSink();
  @ViewChild(MatTabGroup, { static: false }) tabs: MatTabGroup;

  esData;
  classData;
  titleData;

  esProcessId;
  isWaitingForResponse = false;

  selectedIndex = 0;

  constructor(
    private pageTitleService: PageTitleService,
    private esService: EmployabilitySurveyService,
    private route: ActivatedRoute,
    private translate: TranslateService,
  ) {}

  ngOnInit() {
    if (this.route && this.route.snapshot) {
      const params = this.route.snapshot.params;
      this.esProcessId = params && params.esId ? params.esId : '';
    }
    this.getDataEmployabilitySurvey(this.esProcessId, false);
  }

  ngAfterViewInit(): void {
    this.tabs._handleClick = this.checkIfAnyChildrenFormInvalid.bind(this);
  }

  //below function we check if any of the children has an unsaved forms
  checkIfAnyChildrenFormInvalid(tab: MatTab, tabHeader: MatTabHeader, idx: number) {
    if (!this.esService.childrenFormValidationStatus) {
      return this.fireUnsavedDataWarningSwal(tab, tabHeader, idx);
    }
    return true && MatTabGroup.prototype._handleClick.apply(this.tabs, [tab, tabHeader, idx]);
  }

  fireUnsavedDataWarningSwal(tab: MatTab, tabHeader: MatTabHeader, idx: number) {
    Swal.fire({
      type: 'warning',
      title: this.translate.instant('TMTC_S01.TITLE'),
      text: this.translate.instant('TMTC_S01.TEXT'),
      confirmButtonText: this.translate.instant('TMTC_S01.BUTTON_1'),
      showCancelButton: true,
      cancelButtonText: this.translate.instant('TMTC_S01.BUTTON_2'),
      allowEscapeKey: false,
      allowOutsideClick: false,
    }).then((result) => {
      if (result.value) {
        return false;
      } else {
        this.esService.childrenFormValidationStatus = true;
        return true && MatTabGroup.prototype._handleClick.apply(this.tabs, [tab, tabHeader, idx]);
      }
    });
  }

  getDataEmployabilitySurvey(esProcessId, event) {
    this.isWaitingForResponse = true;
    this.subs.sink = this.esService.getOneESProcess(esProcessId).subscribe((resp) => {

      if (resp) {
        this.isWaitingForResponse = false;
        this.esData = resp;
        this.titleData = resp.rncp_title_id;
        this.classData = resp.class_id;
        this.pageTitleService.setTitle(
          `${this.esData.name} - ${this.translate.instant(this.esData.employability_survey_type)} - ${this.titleData.short_name} - ${
            this.classData.name
          }`,
        );
        this.subs.sink = this.translate.onLangChange.subscribe(() => {
          this.pageTitleService.setTitle(
            `${this.esData.name} - ${this.translate.instant(this.esData.employability_survey_type)} - ${this.titleData.short_name} - ${
              this.classData.name
            }`,
          );
        });
        if(!event){
          this.selectedIndex = this.esData.is_published? 1 : 0;
        }
      }
    }, err => this.isWaitingForResponse = false);
  }

  IndexChange(val :number){
    this.selectedIndex = val;

  }

  ngOnDestroy(): void {
      this.subs.unsubscribe();
  }
}
