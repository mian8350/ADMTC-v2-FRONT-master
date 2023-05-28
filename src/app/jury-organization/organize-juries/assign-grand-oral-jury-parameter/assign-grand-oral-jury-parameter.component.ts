import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { JuryOrganizationService } from 'app/service/jury-organization/jury-organization.service';
import { JuryOrganizationParameter } from 'app/title-rncp/conditions/jury-organization-parameter/jury-organization-parameter.model';
import { SubSink } from 'subsink';
import * as _ from 'lodash';
import Swal from 'sweetalert2';
import * as moment from 'moment';
import { MatTabGroup } from '@angular/material/tabs';
import { SelectionModel } from '@angular/cdk/collections';
import { TranslateService } from '@ngx-translate/core';
import { ClassGrandOralJuryParameterComponent } from './class-grand-oral-jury-parameter/class-grand-oral-jury-parameter.component';

@Component({
  selector: 'ms-assign-grand-oral-jury-parameter',
  templateUrl: './assign-grand-oral-jury-parameter.component.html',
  styleUrls: ['./assign-grand-oral-jury-parameter.component.scss'],
})
export class AssignGrandOralJuryParameterComponent implements OnInit {
  private subs = new SubSink();
  @ViewChild('sliderMatTabGroup', { static: false }) classTabGroup: MatTabGroup;
  @ViewChild(ClassGrandOralJuryParameterComponent, { static: false }) classGrandOralJuryParameters: ClassGrandOralJuryParameterComponent;
  selection;
  any;

  currentStep: string;
  juryOrgId: string;
  juryOrgData: JuryOrganizationParameter;
  juryTitleClassData;
  selectedTitle: any;
  selectedClass: any;
  selectedTitleClassData: any;
  exclamationMarkShown = [];

  grandOralParameterData;
  isValidatedSubmit = false;

  isWaitingForResponse = false;
  selectedIndex: number;
  isSaved: boolean = false;
  isParametersSaved = false;
  flowType: string;
  activity: string;

  constructor(
    private route: ActivatedRoute,
    private juryService: JuryOrganizationService,
    private router: Router,
    private translate: TranslateService,
  ) {}

  ngOnInit() {
    this.juryOrgId = this.route.snapshot.parent.parent.paramMap.get('juryOrgId');

    // if (!this.juryService.juryId || this.juryService.juryId !== this.juryOrgId) {
    //   this.juryService.juryId = this.juryOrgId;
    // }

    this.subs.sink = this.juryService.grandOralParameterData$.subscribe((resp) => {
      this.grandOralParameterData = resp;
    });
    this.getJuryData();
  }

  isSubmitEnable() {
    let isEnable = true;
    for (let i = 0; i < this.juryTitleClassData.length; i++) {
      if (!this.grandOralParameterData[i]) {
        isEnable = false;
        break;
      }
    }
    return isEnable;
  }

  submitJury() {
    this.classGrandOralJuryParameters.submit();
  }

  noBlockSelected() {
    return this.classGrandOralJuryParameters.noBlockSelected();
  }

  goToTab(titleId, classId, indexClass) {
    this.selectedTitle = titleId;
    this.selectedClass = classId;
    this.selectedIndex = indexClass;
    this.selectedTitleClassData = this.juryTitleClassData[indexClass];
  }

  getJuryData() {
    this.isWaitingForResponse = true;
    this.subs.sink = this.juryService.getOneJuryOrganizationClassesById(this.juryOrgId).subscribe(
      (resp) => {
        this.isWaitingForResponse = false;
        this.juryOrgData = _.cloneDeep(resp);

        this.activity = this.juryOrgData.jury_activity;
        this.flowType = this.juryOrgData.type;
        if (resp && resp.rncp_titles && resp.rncp_titles.length) {
          this.juryTitleClassData = resp.rncp_titles;
          this.checkSubmitValidation(this.juryTitleClassData);


          // if (this.juryService.juryId !== this.juryOrgId) {
          // this.juryService.juryId = this.juryOrgId;

          const tempArray = [];

          this.juryTitleClassData.forEach((titleClass) => {
            tempArray.push(null);
            // *************** for check exclamation mark either is false or true. if all true, exclamation mark shown
            const block = titleClass.blocks_for_grand_oral.find((block) => block.is_selected);

            const school = titleClass.schools.find((school) => school.is_school_selected_for_grand_oral);
            if (block && school) {
              this.exclamationMarkShown.push(false);
            } else {
              this.exclamationMarkShown.push(true);
            }
          });


          const checkExclamationMark = this.checkExclamationMark();

          if (!checkExclamationMark) {
            this.isSaved = true;
          } else {
            this.isSaved = false;
          }

          this.juryService.setGrandOralParameter(tempArray);
          // }
        }

        if (this.juryTitleClassData && this.juryTitleClassData.length) {
          this.goToTab(this.juryTitleClassData[0].rncp_id._id, this.juryTitleClassData[0].class_id._id, 0);
        }




      },
      (err) => {
        this.isWaitingForResponse = false;

        Swal.fire({
          type: 'error',
          title: 'Error',
          text: err && err['message'] ? err['message'] : err,
          confirmButtonText: 'OK',
        });
      },
    );
  }

  createPayloadAllTitles(savedTitleData) {
    const payload = _.cloneDeep(this.juryOrgData);
    let payloadTitleClass;
    if (payload.rncp_titles && payload.rncp_titles.length) {
      payloadTitleClass = payload.rncp_titles.map((titleClass) => {
        if (titleClass.rncp_id && titleClass.rncp_id._id) {
          titleClass.rncp_id = titleClass.rncp_id._id;
        }
        if (titleClass.class_id && titleClass.class_id._id) {
          titleClass.class_id = titleClass.class_id._id;
        }
        if (titleClass.test_id && titleClass.test_id._id) {
          titleClass.test_id = titleClass.test_id._id;
        }
        if (titleClass.blocks_for_grand_oral && titleClass.blocks_for_grand_oral.length) {
          titleClass.blocks_for_grand_oral.forEach((block) => {
            if (block && block.block_id && block.block_id._id) {
              block.block_id = block.block_id._id;
            }
          });
        }
        if (titleClass.schools && titleClass.schools.length) {
          titleClass.schools.forEach((school) => {
            if (school && school.school && school.school._id) {
              school.school = school.school._id;
            }
            if (school && school.students.length > 0) {
              school.students = school.students.map((res) => res._id);
            }
            delete school._id;
          });
        }

        // ************** Replace the data of title class if the title class data saved was the same.
        if (savedTitleData.rncp_id === titleClass.rncp_id && savedTitleData.class_id === titleClass.class_id) {
          titleClass = savedTitleData;
        }
        return titleClass;
      });
    }
    return {
      _id: this.juryOrgData._id,
      jury_input: {
        rncp_titles: payloadTitleClass,
      },
    };
  }

  saveAllTitleClass(event) {
    const payload = this.createPayloadAllTitles(event);
    this.juryService.setGrandOralParameter(payload);
    this.checkSubmitValidation(payload);
    this.subs.sink = this.juryService.updateJuryOrganizationGrandOralParameter(payload._id, payload.jury_input).subscribe((resp) => {
      this.exclamationMarkShown[this.selectedIndex] = false;
      this.isSaved = true;
      this.isParametersSaved = true;
      Swal.fire({
        type: 'success',
        title: this.translate.instant('Bravo !'),
      });
    });
  }

  checkSubmitValidation(data) {
    if (data && data.length) {
      data.forEach((dataTitle) => {
        let filteredBlock = [];
        let filteredSchool = [];
        if (dataTitle.blocks_for_grand_oral && dataTitle.blocks_for_grand_oral.length) {
          filteredBlock = dataTitle.blocks_for_grand_oral.filter((block) => block.is_selected);
        }
        if (dataTitle.schools && dataTitle.schools.length) {
          filteredSchool = dataTitle.schools.filter((schools) => schools.is_school_selected_for_grand_oral);
        }
        if (filteredBlock && filteredBlock.length && filteredSchool && filteredSchool.length) {
          this.isValidatedSubmit = true;
        } else {
          this.isValidatedSubmit = false;
        }
      });
    }
  }

  getSelectedValue(data) {
    this.selection = data;
  }

  checkExclamationMark() {
    const found = this.exclamationMarkShown.find((res) => res === true);
    if (found) {
      return true;
    } else {
      return false;
    }
  }
}
