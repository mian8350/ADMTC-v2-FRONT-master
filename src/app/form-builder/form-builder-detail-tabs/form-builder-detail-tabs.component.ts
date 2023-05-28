import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatTab, MatTabGroup, MatTabHeader } from '@angular/material/tabs';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { PageTitleService } from 'app/core/page-title/page-title.service';
import { CoreService } from 'app/service/core/core.service';
import { FormBuilderService } from 'app/service/form-builder/form-builder.service';
import { SubSink } from 'subsink';
import Swal from 'sweetalert2';

@Component({
  selector: 'ms-form-builder-detail-tabs',
  templateUrl: './form-builder-detail-tabs.component.html',
  styleUrls: ['./form-builder-detail-tabs.component.scss'],
})
export class FormBuilderDetailTabsComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(MatTabGroup, { static: true }) tabs: MatTabGroup;
  private subs = new SubSink();
  // templateId exist if its edit, not create.
  templateId;

  selectedIndex;
  formBuilderDetailData;
  listOfSteps = [];
  // list of step types that needs to be unique
  uniqueStep = [
    'academic_journey'
  ];
  takenUniqueStep: string[] = [];

  finalValidation = false;
  isPublished = false;
  isAcademicJourneyChosen: boolean = false;
  templateType: any;
  

  constructor(
    private formBuilderService: FormBuilderService,
    private pageTitleService: PageTitleService,
    private translate: TranslateService,
    private route: ActivatedRoute,
    private coreService: CoreService,
  ) {}

  ngOnInit() {
    const param = this.route.snapshot.queryParams;
    if (param && param.templateId) {
      this.templateId = param.templateId;
      this.fetchContractTemplateData();
    } else {
      this.pageTitleService.setTitle(
        this.translate.instant('ERP_009_TEACHER_CONTRACT.Form Template Detail') +
          ' - ' +
          this.translate.instant('ERP_009_TEACHER_CONTRACT.New Template'),
      );
    }

    this.subs.sink = this.translate.onLangChange.pipe().subscribe((resp) => {
      if (resp) {
        if (this.formBuilderDetailData && this.formBuilderDetailData.form_builder_name) {
          this.pageTitleService.setTitle(
            this.translate.instant('ERP_009_TEACHER_CONTRACT.Form Template Detail') + ' - ' + this.formBuilderDetailData.form_builder_name,
          );
        } else {
          this.pageTitleService.setTitle(
            this.translate.instant('ERP_009_TEACHER_CONTRACT.Form Template Detail') +
              ' - ' +
              this.translate.instant('ERP_009_TEACHER_CONTRACT.New Template'),
          );
        }
      }
    });
    this.coreService.sidenavOpen = false;
  }

  ngAfterViewInit() {
    this.tabs._handleClick = this.checkIfAnyChildrenFormInvalid.bind(this);
  }

  fetchContractTemplateData() {
    this.subs.sink = this.formBuilderService.getFormBuilderTemplateFirstTab(this.templateId).subscribe((resp) => {
      const tempData = resp;

      this.isPublished = resp.is_published;
      this.templateType = resp.template_type;
      if (tempData) {
        this.formBuilderDetailData = tempData;
        if (this.formBuilderDetailData && this.formBuilderDetailData.steps) {
          this.updateStepList(this.formBuilderDetailData.steps);
        }
        this.takenUniqueStep = this.getAllTakenUniqueStep(resp);
        this.pageTitleService.setTitle(
          this.translate.instant('ERP_009_TEACHER_CONTRACT.Form Template Detail') + ' - ' + tempData.form_builder_name,
        );
      }
    });
  }

  getAllTakenUniqueStep(resp) {
    if (!resp || !resp.steps || !resp.steps.length) return;
    return resp.steps.map(resp => resp.step_type).filter(type => this.uniqueStep.includes(type));
  }

  updateStepList(stepList) {
    this.listOfSteps = stepList;
  }

  goToTabStep(stepIndex) {
    this.selectedIndex = stepIndex + 1;
  }

  // below function we check if any of the children has an unsaved forms
  checkIfAnyChildrenFormInvalid(tab: MatTab, tabHeader: MatTabHeader, idx: number) {
    if (!this.formBuilderService.childrenFormValidationStatus) {
      return this.fireUnsavedDataWarningSwal(tab, tabHeader, idx);
    }
    return true && MatTabGroup.prototype._handleClick.apply(this.tabs, [tab, tabHeader, idx]);
  }

  fireUnsavedDataWarningSwal(tab: MatTab, tabHeader: MatTabHeader, idx: number) {
    if (!this.isPublished) {
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
          this.formBuilderService.childrenFormValidationStatus = true;
          return true && MatTabGroup.prototype._handleClick.apply(this.tabs, [tab, tabHeader, idx]);
        }
      });
    } else {
      return true && MatTabGroup.prototype._handleClick.apply(this.tabs, [tab, tabHeader, idx]);
    }
  }

  getFinalValidation(value) {
    this.finalValidation = value;
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
    this.formBuilderService.resetContractTemplateData();
    this.pageTitleService.setTitle('');
  }
}
