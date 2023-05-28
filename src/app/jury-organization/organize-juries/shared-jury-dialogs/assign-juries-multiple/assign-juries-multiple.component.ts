import { JuryOrganizationService } from './../../../../service/jury-organization/jury-organization.service';
import { TranslateService } from '@ngx-translate/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { forkJoin } from 'rxjs';
import Swal from 'sweetalert2';
import { SubSink } from 'subsink';

interface dataInput {
  juryId: string;
  rncpId: string;
  classId: string;
  certifier: any;
  studentIds: string[];
  numberStudent: number;
  schoolId: string;
  schoolName: string;
  is_all_selected: boolean;
  count_document: number;
  filter?: any;
}

@Component({
  selector: 'ms-assign-juries-multiple',
  templateUrl: './assign-juries-multiple.component.html',
  styleUrls: ['./assign-juries-multiple.component.scss'],
})
export class AssignJuriesMultipleComponent implements OnInit, OnDestroy {
  private subs = new SubSink();
  assignJuriesForm: UntypedFormGroup;
  presidentList: any;
  professionalList: any;
  academicList: any[];
  subtituteList: any[];

  professionalJuries: any;
  academicJuries: any;
  subtituteJuries: any;
  presidentJuries: any;

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

  isWaitingForResponse: boolean = true;

  constructor(
    public dialogRef: MatDialogRef<AssignJuriesMultipleComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: dataInput,
    private fb: UntypedFormBuilder,
    private translate: TranslateService,
    private juryService: JuryOrganizationService,
  ) {}

  ngOnInit() {
    if (this.data) {
      this.isWaitingForResponse = false;
    }

    this.assignJuriesForm = this.fb.group({
      president_of_jury: [null, Validators.required],
      professional_jury_member: [null],
      academic_jury_member: [null],
      substitution_jury_member: [null],
    });
    this.getPresidentJuries();
    this.getProfessionalJuries();
    this.getAcademicJuries();
    this.getSubtituteJuries();
  }

  // getPresidentJuries() {
  //   this.isWaitingForResponse = true;
  //   this.subs.sink = this.juryService.getPresidentJuryList(this.data.rncpId, this.data.schoolId).subscribe((resp) => {
  //     this.isWaitingForResponse = false;
  //     this.presidentJuries = resp.map((list) => {
  //       return { short_name: list.president_of_jury.last_name + ' ' + list.president_of_jury.first_name, _id: list.president_of_jury._id };
  //     });
  //     this.presidentList = [...new Map(this.presidentJuries.map((item) => [item['_id'], item])).values()];

  //   });
  // }

  getPresidentJuries() {
    const presidentOfJuryId = '5a3cd5e7e6fae44c7c11561e';
    this.juryService.getAllPresidentJuryList(this.data.rncpId, presidentOfJuryId).subscribe((resp) => {

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
    this.isWaitingForResponse = true;
    // this.isLoading = true;
    const title = [this.data.rncpId];
    const schoolId = [this.data.schoolId];
    const schoolCRId = this.data.certifier && this.data.certifier._id ? [this.data.certifier._id] : [];
    const forkParam = [];
    const pcGet = this.juryService.getJuriesPC(this.professionalUserTypePC, schoolId, title);
    forkParam.push(pcGet);

    const crGet = this.juryService.getJuriesCertifier(this.professionalUserTypeCR, schoolCRId, title);
    forkParam.push(crGet);
    this.subs.sink = forkJoin(forkParam).subscribe((resp) => {
      this.isWaitingForResponse = false;
      // this.isLoading = false;
      if (resp && resp.length) {
        const result = [].concat(resp[0], resp[1]);
        this.professionalJuries = result;
        this.professionalList = this.professionalJuries.map((list) => {
          return { short_name: list.last_name.toUpperCase() + ' ' + list.first_name, _id: list._id };
        });
      }
      this.professionalList.unshift({ short_name: this.translate.instant('NONE'), _id: null });

    });
  }

  getAcademicJuries() {
    this.isWaitingForResponse = true;
    // this.isLoading = true;
    const title = [this.data.rncpId];
    const schoolId = [this.data.schoolId];
    const schoolCRId = this.data.certifier && this.data.certifier._id ? [this.data.certifier._id] : [];

    const forkParam = [];
    const pcGet = this.juryService.getJuriesPC(this.academicUserTypePC, schoolId, title);

    forkParam.push(pcGet);
    const crGet = this.juryService.getJuriesCertifier(this.academicUserTypeCR, schoolCRId, title);

    forkParam.push(crGet);
    this.subs.sink = forkJoin(forkParam).subscribe((resp) => {
      this.isWaitingForResponse = false;

      this.isWaitingForResponse = false;
      if (resp && resp.length) {
        const result = [].concat(resp[0], resp[1]);
        this.academicJuries = result;
        this.academicList = this.academicJuries.map((list) => {
          return { name: list.last_name.toUpperCase() + ' ' + list.first_name, _id: list._id };
        });
      }
      this.academicList.unshift({ name: this.translate.instant('NONE'), _id: null });

    });
  }

  getSubtituteJuries() {
    this.isWaitingForResponse = true;
    const title = [this.data.rncpId];
    const schoolId = [this.data.schoolId];
    this.subs.sink = this.juryService.getJuriesPC(this.substituteUserType, schoolId, title).subscribe((resp) => {
      this.isWaitingForResponse = false;
      this.subtituteJuries = resp;
      this.subtituteList = this.subtituteJuries.map((list) => {
        return { name: list.last_name.toUpperCase() + ' ' + list.first_name, _id: list._id };
      });
      this.subtituteList.unshift({ name: this.translate.instant('NONE'), _id: null });

    });
  }

  assignJuries() {
    this.isWaitingForResponse = true;
    this.subs.sink = this.juryService
      .assignJuryToMultipleStudentJuryOrganizationSchedule(
        this.data.juryId,
        this.data.rncpId,
        this.data.schoolId,
        this.data.classId,
        this.data.studentIds,
        this.assignJuriesForm.value,
        this.data.is_all_selected,
        this.data.filter,
      )
      .subscribe(
        (resp) => {
          if (resp) {
            this.isWaitingForResponse = false;

            this.closeDialog(resp);
          }
        },
        (err) => {
          this.isWaitingForResponse = false;
          this.swalError(err);

        },
      );
  }

  save() {
    this.isWaitingForResponse = true;
    if (this.assignJuriesForm.invalid) {
      this.isWaitingForResponse = false;
      this.assignJuriesForm.markAllAsTouched();
      Swal.fire({
        type: 'warning',
        title: this.translate.instant('FormSave_S1.TITLE'),
        html: this.translate.instant('FormSave_S1.TEXT'),
        footer: `<span style="margin-left: auto">FormSave_S1</span>`,
        confirmButtonText: this.translate.instant('FormSave_S1.BUTTON_1'),
        allowEnterKey: false,
        allowEscapeKey: false,
        allowOutsideClick: false,
      });
      return;
    }
    this.subs.sink = this.juryService
      .checkJuryOrganizationScheduleMultipleJury(this.data.juryId, this.data.studentIds, this.data.is_all_selected, this.data.filter)
      .subscribe(
        (resp) => {

          // const juryAlreadySet = resp.some(el=>el.is_jury_already_set===true)
          const checkJury = resp.some((el) => el.president_of_jury !== null);

          this.isWaitingForResponse = false;
          if (resp && resp.length) {
            Swal.fire({
              type: 'warning',
              title: this.translate.instant('RGO_S5.TITLE'),
              html: this.translate.instant('RGO_S5.TEXT'),
              footer: `<span style="margin-left: auto">RGO_S5</span>`,
              confirmButtonText: this.translate.instant('RGO_S5.BUTTON_1'),
              cancelButtonText: this.translate.instant('RGO_S5.BUTTON_2'),
              allowEnterKey: false,
              allowEscapeKey: false,
              allowOutsideClick: false,
              showCancelButton: true,
              confirmButtonClass: 'btn-danger',
            }).then((confirm) => {
              if (confirm.value) {
                this.assignJuries();
              }
            });
          } else {
            this.assignJuries();
          }
        },
        (err) => {
          this.swalError(err);
        },
      );
  }

  swalError(err) {
    this.isWaitingForResponse = false;

    Swal.fire({
      type: 'error',
      title: 'Error',
      text: err && err['message'] ? err['message'] : err,
      confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
    });
  }

  closeDialog(resp?) {
    this.dialogRef.close(resp);
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
