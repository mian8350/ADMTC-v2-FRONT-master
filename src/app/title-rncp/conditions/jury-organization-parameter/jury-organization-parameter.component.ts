import { Component, OnInit, Input } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { JuryOrganizationService } from 'app/service/jury-organization/jury-organization.service';
import Swal from 'sweetalert2';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import * as DecoupledEditor from 'assets/ckeditor5-custom/ckeditor.js'

@Component({
  selector: 'ms-jury-organization-parameter',
  templateUrl: './jury-organization-parameter.component.html',
  styleUrls: ['./jury-organization-parameter.component.scss'],
})
export class JuryOrganizationParameterComponent implements OnInit {
  // ckeditor configuration

  @Input() selectedRncpTitleId: string;
  @Input() selectedClassId: string;

  firstForm: any;
  juryOrgParamForm: UntypedFormGroup;
  juryOrgParamId: string;
  sliderSelected: boolean;
  isWaitingForResponse = false;
  // sliderSelected=false;

  public Editor = DecoupledEditor;
  responsableExist = false;
  public onReady(editor) {

    editor.ui.getEditableElement().parentElement.insertBefore(editor.ui.view.toolbar.element, editor.ui.getEditableElement());
  }

  constructor(private fb: UntypedFormBuilder, private juryOrgService: JuryOrganizationService, public translate: TranslateService) {}

  ngOnInit() {
    this.initJuryOrgParamForm();
    this.getFormData();
  }

  initJuryOrgParamForm() {
    this.juryOrgParamForm = this.fb.group({
      rncp_id: [this.selectedRncpTitleId],
      class_id: [this.selectedClassId],
      standard_duration: [null],
      jury_process_name: [''],
      allow_use_text_jury_n7_phrase: [null],
      jury_n7_phrase_1: [''],
      jury_n7_phrase_2: [''],
      replay_visible_for_student: [false],
      replay_visible_for_academic_director: [false],
      replay_visible_for_certifier: [false],
      replay_visible_for_jury_member: [false]
    });
    this.firstForm = _.cloneDeep(this.juryOrgParamForm.value)
  }

  getFormData() {
    this.isWaitingForResponse = true;
    this.juryOrgService.getJuryOrganizationParameter(this.selectedRncpTitleId, this.selectedClassId).subscribe((resp) => {
      this.isWaitingForResponse = false;
      if (resp) {
        this.juryOrgParamId = resp._id;
        let dataJury = resp;
        
        dataJury = { ...dataJury, 
          class_id: this.selectedClassId,
          jury_process_name: resp?.class_id?.jury_process_name
        } 
        
        this.juryOrgParamForm.patchValue(dataJury);
        this.firstForm = _.cloneDeep(this.juryOrgParamForm.value)
      }
      
    }, (err) => {
      this.isWaitingForResponse = false;

      Swal.fire({
        type: 'error',
        title: 'Error',
        text: err && err['message'] ? err['message'] : err,
        confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
      });
    });
  }

  save() {
    this.firstForm = _.cloneDeep(this.juryOrgParamForm.value)
    const formValue = this.juryOrgParamForm.getRawValue();
    if (this.juryOrgParamId) {
      this.isWaitingForResponse = true;
      this.juryOrgService.updateJuryOrganizationParameter(this.juryOrgParamId, formValue).subscribe((resp) => {
        this.isWaitingForResponse = false;
        Swal.fire({
          type: 'success',
          title: 'Bravo!',
          text: this.translate.instant('JURY_PARAMETER_UPDATE_SWAL'),
        });
      }, (err) => {
        this.isWaitingForResponse = false;

        Swal.fire({
          type: 'error',
          title: 'Error',
          text: err && err['message'] ? err['message'] : err,
          confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
        });
      });
    } else {
      this.isWaitingForResponse = true;
      this.juryOrgService.CreateJuryOrganizationParameter(formValue).subscribe((resp) => {
        this.isWaitingForResponse = false;
        Swal.fire({
          type: 'success',
          title: 'Bravo!',
          text: this.translate.instant('JURY_PARAMETER_CREATE_SWAL'),
        });
      }, (err) => {
        this.isWaitingForResponse = false;

        Swal.fire({
          type: 'error',
          title: 'Error',
          text: err && err['message'] ? err['message'] : err,
          confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
        });
      });
    }
  }

  changePublished($event: any) {
    this.sliderSelected = !this.sliderSelected;
  }

  checkPhrases() {
    const phra1 = this.juryOrgParamForm.get('jury_n7_phrase_1').value;
    const phra2 = this.juryOrgParamForm.get('jury_n7_phrase_2').value;
    if (this.sliderSelected) {
      if (phra1 === '' && phra2 === '') {
        return true;
      } else  {
        return false;
      }
    }
  }

  comparison() {
    const firstForm = JSON.stringify(this.firstForm);
    const form = JSON.stringify(this.juryOrgParamForm.value);
    if (firstForm === form) {
      return true;
    } else {
      return false;
    }
  }
}
