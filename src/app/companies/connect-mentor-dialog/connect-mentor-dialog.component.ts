import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { UntypedFormGroup, Validators, UntypedFormBuilder, FormArray } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SubSink } from 'subsink';
import { CompanyService } from 'app/service/company/company.service';
import { UtilityService } from 'app/service/utility/utility.service';
import { AuthService } from 'app/service/auth-service/auth.service';
import Swal from 'sweetalert2';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'ms-connect-mentor-dialog',
  templateUrl: './connect-mentor-dialog.component.html',
  styleUrls: ['./connect-mentor-dialog.component.scss'],
})
export class ConnectMentorDialogComponent implements OnInit, OnDestroy {
  private subs = new SubSink();
  connectSchoolForm: UntypedFormGroup;
  SchoolName: string;
  CurUser: any;
  entityData: any;
  mentorData: any;
  isWaitingForResponse = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private matDialogRef: MatDialogRef<ConnectMentorDialogComponent>,
    private fb: UntypedFormBuilder,
    private companyService: CompanyService,
    private utilService: UtilityService,
    private CurUserService: AuthService,
    private translate: TranslateService,
  ) {}

  ngOnInit() {
    this.SchoolName = this.data.schoolName;
    this.initForm();
    this.getMentor();
    this.populateMentor();
  }

    // *************** Function to initialize form field
  initForm() {
    this.CurUser = this.CurUserService.getLocalStorageUser();
    this.entityData = this.CurUser.entities.find((entity) => entity.type.name === 'Academic Director');
    this.connectSchoolForm = this.fb.group({
      mentor_ids: [],
    });
  }

    // *************** Function to populate mentor data
  populateMentor() {
    this.isWaitingForResponse = true;
    this.subs.sink = this.companyService.populateDataMentor(this.data.companyId, this.data.schoolId).subscribe((resp) => {
      const entities: any[] = resp.map((entity) => entity._id);
      this.connectSchoolForm.get('mentor_ids').setValue(entities);

      this.isWaitingForResponse = false;
    });
  }

    // *************** Function to close dialog
  onClose() {
    this.matDialogRef.close();
  }

    // *************** Function to get data mentor based company selected
  getMentor() {
    this.subs.sink = this.companyService.getAllMentor(this.data.companyId).subscribe((resp: any) => {
      const mentorArray = resp.map((mentor) => {
        return { value: mentor._id, label: this.translate.instant(mentor.civility) + ' ' + mentor.first_name + ' ' + mentor.last_name };
      });
      this.mentorData = mentorArray;
    });
  }

    // *************** Function to submit data mentor connected to school
  submitData() {
    this.isWaitingForResponse = true;
    const mentor = this.connectSchoolForm.get('mentor_ids').value;
    this.subs.sink = this.companyService.connectMentorToSchool(mentor, this.data.companyId, this.data.schoolId).subscribe(
      (resp: any) => {
        this.isWaitingForResponse = false;
        Swal.fire({
          type: 'success',
          title: this.translate.instant('SAVE_TEMPLATE.TITLE'),
          text: this.translate.instant('COMPANY.Connecting Mentor To School Success'),
          confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
          footer: `<span style="margin-left: auto">SAVE_TEMPLATE</span>`,
        }).then((respp: any) => {
          this.matDialogRef.close();
        });
      },
      (err) => {
        this.isWaitingForResponse = false;
        if (err['message'] === 'GraphQL error: Error: the mentor is already used in student contract') {
          Swal.fire({
            type: 'error',
            title: this.translate.instant('DCMENTOR_3.TITLE'),
            html: this.translate.instant('DCMENTOR_3.TEXT'),
            confirmButtonText: this.translate.instant('DCMENTOR_3.BUTTON'),
            footer: `<span style="margin-left: auto">DCMENTOR_3</span>`,
          });
        } else {
          this.CurUserService.postErrorLog(err);
          Swal.fire({
            type: 'error',
            title: 'Error',
            text: err && err['message'] ? err['message'] : err,
            confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
          });
        }
      },
    );
  }
  // *************** Function to remove data mentor
  removeMentor(data) {

  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
