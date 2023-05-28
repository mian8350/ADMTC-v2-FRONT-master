import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder, FormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { SubSink } from 'subsink';
import { JuryOrganizationService } from 'app/service/jury-organization/jury-organization.service';
import { UtilityService } from 'app/service/utility/utility.service';
import { forkJoin } from 'rxjs';
import Swal from 'sweetalert2';
import { from } from 'apollo-link';
import * as moment from 'moment';
import { ParseLocalToUtcPipe } from 'app/shared/pipes/parse-local-to-utc.pipe';
import { ParseUtcToLocalPipe } from 'app/shared/pipes/parse-utc-to-local.pipe';
import { AuthService } from 'app/service/auth-service/auth.service';
import { NgxPermissionsService } from 'ngx-permissions';

interface InputData {
  _id: string;
  juryOrgData: any;
  schoolId: string;
  juryOrgId: string;
  is_postpone: boolean;
}
@Component({
  selector: 'ms-set-session-juries-individual',
  templateUrl: './set-session-juries-individual.component.html',
  styleUrls: ['./set-session-juries-individual.component.scss'],
  providers: [ParseLocalToUtcPipe, ParseUtcToLocalPipe],
})
export class SetSessionJuriesIndividualComponent implements OnInit {
  private subs = new SubSink();
  setupSessionAndJury: UntypedFormGroup;
  presidentList: any[] = [];
  professionalList: any[] = [];
  academicList: any[] = [];
  subtituteList: any[] = [];

  professionalJuries: any;
  academicJuries: any;
  subtituteJuries: any;
  presidentJuries: any;

  presidentOfJuryId = '5a3cd5e7e6fae44c7c11561e';

  professionalUserTypeCR = [
    '5c173695ba179819bd115df1', // Academic jury member
    '606fe9c974c4d62888cc2818', // Professional Jury Member Certifier
  ];

  professionalUserTypePC = [
    '5a2e1ecd53b95d22c82f9554', // Acad Dir
    '5cdbde9b4b1f6a1b5a0b3fb5', // Professional Jury Member
    '5cdbdeaf4b1f6a1b5a0b3fb6', // Academic Final Jury Member
    '5a2e1ecd53b95d22c82f9555', // Acad Admin
    '5a2e1ecd53b95d22c82f9558', // Teacher
    // '5a2e603f53b95d22c82f9590', // Mentor
  ];
  academicUserTypePC = ['5cdbdeaf4b1f6a1b5a0b3fb6'];
  academicUserTypeCR = ['606fe9c974c4d62888cc2818', '5c173695ba179819bd115df1'];

  substituteUserType = [
    '5a2e1ecd53b95d22c82f9554', // Acad Dir
    '5cdbde9b4b1f6a1b5a0b3fb5', // Professional Jury Member
    '5cdbdeaf4b1f6a1b5a0b3fb6', // Academic Final Jury Member
    '5a2e1ecd53b95d22c82f9555', // Acad Admin
    '5a2e1ecd53b95d22c82f9558', // Teacher
  ];

  studentData: any;
  blockData: any;
  isWaitingForResponse: boolean = false;
  studentMentor: { _id: string; first_name: string; last_name: string };
  isPresidentJury: boolean;
  selectedBlock: any;

  constructor(
    public dialogRef: MatDialogRef<SetSessionJuriesIndividualComponent>,
    @Inject(MAT_DIALOG_DATA) public parentData: InputData,
    private fb: UntypedFormBuilder,
    private translate: TranslateService,
    private juryOrganizationService: JuryOrganizationService,
    public utilService: UtilityService,
    private utcToLocal: ParseUtcToLocalPipe,
    private localToUtc: ParseLocalToUtcPipe,
    private authService: AuthService,
    private permissions: NgxPermissionsService,
  ) {}

  ngOnInit() {
    // check if current user was president of jury
    this.isPresidentJury = !!this.permissions.getPermission('President of Jury');
    this.initForm();

    this.getDropdowns();
    if (this.parentData && this.parentData._id) {
      this.populateData(this.parentData._id);
    }

    // If test duration got change it will recaculate end time based on value start time + duration
    this.subs.sink = this.setupSessionAndJury.get('test_duration').valueChanges.subscribe((ress) => {


      const start = this.setupSessionAndJury.get('start_time').value;
      this.setupSessionAndJury.get('end_time').patchValue(moment(start, 'HH:mm').add(parseInt(ress), 'minutes').format('HH:mm'));
    });

    // if start time was changes it will recaculate end_time with new value start_time + duration
    this.subs.sink = this.setupSessionAndJury.get('start_time').valueChanges.subscribe((ress) => {
      const duration = this.setupSessionAndJury.get('test_duration').value;
      this.setupSessionAndJury.get('end_time').patchValue(moment(ress, 'HH:mm').add(parseInt(duration), 'minutes').format('HH:mm'));
    });
  }

  initForm() {
    this.setupSessionAndJury = this.fb.group({
      test_duration: [null, [Validators.required, Validators.pattern('^[0-9]+$')]],
      president_of_jury: [null, Validators.required],
      professional_jury_member: [null],
      academic_jury_member: [null],
      substitution_jury_member: [null],
      date_test: [null, Validators.required],
      start_time: [null, Validators.required],
      end_time: [null, Validators.required],
      reason_for_postpone: [null],
    });
  }

  getDropdowns() {
    this.getPresidentJuries();
    this.getProfessionalJuries();
    this.getAcademicJuries();
    this.getSubtituteJuries();
  }

  populateData(id: string) {
    this.isWaitingForResponse = true;
    this.subs.sink = this.juryOrganizationService.getOneJuryOrganizationSchedule(this.parentData._id).subscribe(
      (ress) => {


        if (ress) {
          this.studentData = ress;
          this.blockData = ress.blocks_for_grand_oral.filter((block) => block.is_retaking === true);
          this.selectedBlock = ress.blocks_for_grand_oral.filter((block) => block.is_selected === true && block.is_exempted === false);
          const formValue: any = {};

          // set time value
          formValue.date_test = this.studentData.date_test ? this.studentData.date_test : null;
          formValue.start_time = this.studentData.start_time ? this.utcToLocal.transform(this.studentData.start_time) : null;
          formValue.test_duration = this.studentData.test_duration ? this.studentData.test_duration : null;
          formValue.end_time = this.studentData.end_time ? this.utcToLocal.transform(this.studentData.end_time) : null;

          // set jury id
          formValue.president_of_jury =
            this.studentData.president_of_jury && this.studentData.president_of_jury._id ? this.studentData.president_of_jury._id : null;
          formValue.professional_jury_member =
            this.studentData.professional_jury_member && this.studentData.professional_jury_member._id
              ? this.studentData.professional_jury_member._id
              : null;
          formValue.academic_jury_member =
            this.studentData.academic_jury_member && this.studentData.academic_jury_member._id
              ? this.studentData.academic_jury_member._id
              : null;
          formValue.substitution_jury_member =
            this.studentData.substitution_jury_member && this.studentData.substitution_jury_member._id
              ? this.studentData.substitution_jury_member._id
              : null;


          this.setupSessionAndJury.patchValue(formValue);

          // auto-populate professional jury if student has an active mentor
          if (this.setupSessionAndJury.get('professional_jury_member').value) {
            this.setMentorAsProfessionalJury(ress);
          }

          // disable Jury Assigned if login as president of jury
          if (this.isPresidentJury) {
            this.setupSessionAndJury.get('president_of_jury').disable();
            this.setupSessionAndJury.get('professional_jury_member').disable();
            this.setupSessionAndJury.get('academic_jury_member').disable();
            this.setupSessionAndJury.get('substitution_jury_member').disable();
          } else {
            this.setupSessionAndJury.get('president_of_jury').enable();
            this.setupSessionAndJury.get('professional_jury_member').enable();
            this.setupSessionAndJury.get('academic_jury_member').enable();
            this.setupSessionAndJury.get('substitution_jury_member').enable();
          }

          this.isWaitingForResponse = false;
        }
      },
      (error) => {
        this.isWaitingForResponse = false;
      },
    );
  }

  setMentorAsProfessionalJury(resp) {
    if (resp && resp.student_id.companies && resp.student_id.companies.length) {
      this.studentMentor = resp.student_id.companies.find(
        (company) => company && company.status && company.status === 'active' && company.mentor,
      ).mentor;

      if (this.studentMentor) {
        this.setupSessionAndJury.get('professional_jury_member').patchValue(this.studentMentor._id);
        this.professionalList.push({
          short_name: this.studentMentor.last_name.toUpperCase() + ' ' + this.studentMentor.first_name,
          _id: this.studentMentor._id,
        });
      }
    }
  }

  // GET JURY LIST DROPDOWN
  getPresidentJuries() {
    // from global juries, we get parent data from invidual element and rncp_title is returned as a single object
    // whereas in jury schedule table of each jury organization, the rncp_titles is in the form of array of objects
    // thus we have to do this check
    // also apply for getProfessional, getAcademic, and getSubtitute juries
    const rncp_id = this.parentData.juryOrgData.rncp_titles
      ? this.parentData.juryOrgData.rncp_titles[0].rncp_id._id
      : this.parentData.juryOrgData.rncp_title._id;
    this.juryOrganizationService.getAllPresidentJuryList(rncp_id, this.presidentOfJuryId).subscribe((resp) => {

      this.presidentList = resp;

      this.presidentJuries = resp.map((list) => {
        return {
          short_name: list.last_name + ' ' + list.first_name,
          _id: list._id,
        };
      });
      this.presidentList = [...new Map(this.presidentJuries.map((item) => [item['_id'], item])).values()];

    });
  }

  getProfessionalJuries() {
    // this.isLoading = true;
    const title = [
      this.parentData.juryOrgData.rncp_titles
        ? this.parentData.juryOrgData.rncp_titles[0].rncp_id._id
        : this.parentData.juryOrgData.rncp_title._id,
    ];
    const schoolId = [this.parentData.schoolId];
    const schoolCRId =
      this.parentData.juryOrgData.certifier && this.parentData.juryOrgData.certifier._id ? [this.parentData.juryOrgData.certifier._id] : [];
    const forkParam = [];
    const pcGet = this.juryOrganizationService.getJuriesPC(this.professionalUserTypePC, schoolId, title);
    forkParam.push(pcGet);

    const crGet = this.juryOrganizationService.getJuriesCertifier(this.professionalUserTypeCR, schoolCRId, title);
    forkParam.push(crGet);
    forkJoin(forkParam).subscribe((resp) => {
      // this.isLoading = false;
      if (resp && resp.length) {
        const result = [].concat(resp[0], resp[1]);
        this.professionalJuries = result;

        // handles if we already push a student mentor in the current professional List... happens if getOneRetake API returns first
        if (this.professionalList.length) {
          this.professionalList = this.professionalList.concat(
            this.professionalJuries.map((list) => {
              return { short_name: list.last_name.toUpperCase() + ' ' + list.first_name, _id: list._id };
            }),
          );
        } else {
          this.professionalList = this.professionalJuries.map((list) => {
            return { short_name: list.last_name.toUpperCase() + ' ' + list.first_name, _id: list._id };
          });
        }
      }

      this.professionalList.unshift({ short_name: 'None', _id: null });

    });
  }

  getAcademicJuries() {
    // this.isLoading = true;
    const title = [
      this.parentData.juryOrgData.rncp_titles
        ? this.parentData.juryOrgData.rncp_titles[0].rncp_id._id
        : this.parentData.juryOrgData.rncp_title._id,
    ];
    const schoolId = [this.parentData.schoolId];
    const schoolCRId =
      this.parentData.juryOrgData.certifier && this.parentData.juryOrgData.certifier._id ? [this.parentData.juryOrgData.certifier._id] : [];
    const forkParam = [];
    const pcGet = this.juryOrganizationService.getJuriesPC(this.academicUserTypePC, schoolId, title);
    forkParam.push(pcGet);
    const crGet = this.juryOrganizationService.getJuriesCertifier(this.academicUserTypeCR, schoolCRId, title);
    forkParam.push(crGet);
    forkJoin(forkParam).subscribe((resp) => {
      // this.isLoading = false;
      if (resp && resp.length) {
        const result = [].concat(resp[0], resp[1]);
        this.academicJuries = result;
        this.academicList = this.academicJuries.map((list) => {
          return { name: list.last_name.toUpperCase() + ' ' + list.first_name, _id: list._id };
        });
      }
      this.academicList.unshift({ name: 'None', _id: null });

    });
  }

  getSubtituteJuries() {
    // this.isLoading = true;
    const title = [
      this.parentData.juryOrgData.rncp_titles
        ? this.parentData.juryOrgData.rncp_titles[0].rncp_id._id
        : this.parentData.juryOrgData.rncp_title._id,
    ];
    const schoolId = [this.parentData.schoolId];
    this.juryOrganizationService.getJuriesPC(this.substituteUserType, schoolId, title).subscribe((resp) => {
      // this.isLoading = false;
      this.subtituteJuries = resp;
      this.subtituteList = this.subtituteJuries.map((list) => {
        return { name: list.last_name.toUpperCase() + ' ' + list.first_name, _id: list._id };
      });
      this.subtituteList.unshift({ name: 'None', _id: null });

    });
  }

  noneProfesionalList(arr: any) {

  }

  formatPayload(payload) {
    payload.test_duration = parseInt(this.setupSessionAndJury.get('test_duration').value);
    payload.date_test = this.convertLocalDateToUTC({ date: payload.date_test, time_start: payload.start_time });
    payload.end_time = this.localToUtc.transform(payload.end_time);
    payload.start_time = this.localToUtc.transform(payload.start_time);
  }

  async save() {


    if (this.setupSessionAndJury.invalid) {
      this.setupSessionAndJury.markAllAsTouched();

      Swal.fire({
        type: 'error',
        title: this.translate.instant('FormSave_S1.TITLE'),
        html: this.translate.instant('FormSave_S1.TEXT'),
        footer: `<span style="margin-left: auto">FormSave_S1</span>`,
        confirmButtonText: this.translate.instant('FormSave_S1.BUTTON_1'),
        allowEnterKey: false,
        allowEscapeKey: false,
        allowOutsideClick: false,
      });
      return;
    } else {
      this.isWaitingForResponse = true;
      let payload = this.setupSessionAndJury.getRawValue();
      this.formatPayload(payload);
      payload.is_postpone = this.parentData.is_postpone ? true : false;

      if (this.parentData.is_postpone) {
        let timeDisabled = 3;
        const userResp = await Swal.fire({
          title: this.translate.instant('Jury_S24.TITLE'),
          text: this.translate.instant('Jury_S24.TEXT', {
            date: moment(payload.date_test).format('DD/MM/YYYY'),
            time: `${this.setupSessionAndJury.get('start_time').value} - ${this.setupSessionAndJury.get('end_time').value}`,
          }),
          footer: `<span style="margin-left: auto">Jury_S24</span>`,
          type: 'warning',
          allowEscapeKey: true,
          showCancelButton: true,
          confirmButtonText: this.translate.instant('Jury_S24.BUTTON_YES'),
          cancelButtonText: this.translate.instant('Jury_S24.BUTTON_NO'),
          onOpen: () => {
            Swal.disableConfirmButton();
            const confirmBtnRef = Swal.getConfirmButton();
            const time = setInterval(() => {
              timeDisabled -= 1;
              confirmBtnRef.innerText = this.translate.instant('Jury_S24.BUTTON_YES') + ` (${timeDisabled})`;
            }, 1000);

            setTimeout(() => {
              confirmBtnRef.innerText = this.translate.instant('Jury_S24.BUTTON_YES');
              Swal.enableConfirmButton();
              clearTimeout(time);
            }, timeDisabled * 1000);
          },
        });

        if (userResp.value) {
          this.updateSchedule(payload);
        } else {
          this.isWaitingForResponse = false;
          return;
        }
      } else {
        this.updateSchedule(payload);
      }
    }
  }

  convertLocalDateToUTC(data) {

    const date = moment(data.date).format('DD/MM/YYYY');
    const time = data.time_start;

    const dateTimeInUTC = moment(date + time, 'DD/MM/YYYYHH:mm');

    return dateTimeInUTC.toISOString();
  }

  updateSchedule(payload) {
    this.subs.sink = this.juryOrganizationService.updateJuryOrganizationSchedule(this.parentData._id, payload).subscribe(async (resp) => {
      this.isWaitingForResponse = false;
      let swalResp;
      if (this.parentData.is_postpone) {
        swalResp = await Swal.fire({
          type: 'success',
          title: this.translate.instant('Jury_S24b.TITLE'),
          text: this.translate.instant('Jury_S24b.TEXT', {
            date: moment(payload.date_test).format('DD/MM/YYYY'),
            time: `${this.setupSessionAndJury.get('start_time').value} - ${this.setupSessionAndJury.get('end_time').value}`,
          }),
          footer: `<span style="margin-left: auto">Jury_S24b</span>`,
          confirmButtonText: this.translate.instant('Jury_S24b.BUTTON'),
        });
      } else {
        swalResp = await Swal.fire({
          type: 'success',
          title: this.translate.instant('Bravo !'),
        });
      }

      this.closeDialog(resp);
    });
  }

  closeDialog(resp?) {
    this.dialogRef.close(resp);
  }

  getPresidentJury() {
    let presidentData;
    if (this.presidentList && this.presidentList.length) {
      const resultPresidentData = this.presidentList.find((president) => president._id === this.setupSessionAndJury.get('president_of_jury').value);
      presidentData = resultPresidentData && resultPresidentData.short_name ? resultPresidentData.short_name : '';
    }
    if(presidentData === 'None') {
      presidentData = this.translate.instant('NONE');
    }
    return presidentData;
  }

  getProfessionalJuryMember() {
    let professionalJuryMemberData;
    if (this.professionalList && this.professionalList.length) {
      const resultProfessionalData = this.professionalList.find((professional) => professional._id === this.setupSessionAndJury.get('professional_jury_member').value);
      professionalJuryMemberData = resultProfessionalData && resultProfessionalData.short_name ? resultProfessionalData.short_name : '';
    }
    if(professionalJuryMemberData === 'None') {
      professionalJuryMemberData = this.translate.instant('NONE');
    }
    return professionalJuryMemberData;
  }

  getAcademicJuryMember() {
    let academicJuryMemberData;
    if (this.academicList && this.academicList.length) {
      const resultAcademicData = this.academicList.find((academic) => academic._id === this.setupSessionAndJury.get('academic_jury_member').value);
      academicJuryMemberData = resultAcademicData && resultAcademicData.name ? resultAcademicData.name : '';
    }
    if(academicJuryMemberData === 'None') {
      academicJuryMemberData = this.translate.instant('NONE');
    }
    return academicJuryMemberData;
  }

  getSubstitutionJuryMember() {
    let substitutionJuryMemberData;
    if (this.subtituteList && this.subtituteList.length) {
      const resultSubstitutionData = this.subtituteList.find((subtitute) => subtitute._id === this.setupSessionAndJury.get('substitution_jury_member').value);
      substitutionJuryMemberData = resultSubstitutionData && resultSubstitutionData.name ? resultSubstitutionData.name : '';
    }
    if(substitutionJuryMemberData === 'None') {
      substitutionJuryMemberData = this.translate.instant('NONE');
    }
    return substitutionJuryMemberData;
  }
}
