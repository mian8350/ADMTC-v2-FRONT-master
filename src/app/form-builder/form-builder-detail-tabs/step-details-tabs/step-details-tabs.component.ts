import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { MatTab, MatTabGroup, MatTabHeader } from '@angular/material/tabs';
import { TranslateService } from '@ngx-translate/core';
import { FormBuilderService } from 'app/service/form-builder/form-builder.service';
import Swal from 'sweetalert2';


@Component({
  selector: 'ms-step-details-tabs',
  templateUrl: './step-details-tabs.component.html',
  styleUrls: ['./step-details-tabs.component.scss']
})
export class StepDetailsTabsComponent implements OnInit {
  @ViewChild(MatTabGroup, { static: true }) tabs: MatTabGroup;
  @Input() stepId;
  @Input() stepType;
  @Input() templateId: string;
  @Input() templateType: string;
  @Input() stepIndex: number;
  @Input() step: any;
  @Input() isPublished: boolean;
  @Input() takenUniqueStep: any;
  @Input() finalValidation: boolean;
  @Output() refetchContractTemplateData: EventEmitter<boolean> = new EventEmitter();
  selectedIndex: number;

  constructor(private formBuilderService: FormBuilderService, private translate: TranslateService) { }

  ngOnInit() {



    
  }

  ngAfterViewInit() {
    this.tabs._handleClick = this.checkIfAnyChildrenFormInvalid.bind(this);
  }

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
        } else if (result.dismiss) {
          this.formBuilderService.childrenFormValidationStatus = true;
          return true && MatTabGroup.prototype._handleClick.apply(this.tabs, [tab, tabHeader, idx]);
        }
      });
    } else {
      return true && MatTabGroup.prototype._handleClick.apply(this.tabs, [tab, tabHeader, idx]);
    }
  }

  fetchContractTemplateData() {
    this.refetchContractTemplateData.emit(true);
  }

  getStepType(stepType) {
    this.stepType = stepType;
  }


}
