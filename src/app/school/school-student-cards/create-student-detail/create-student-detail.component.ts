import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
import { SubSink } from 'subsink';
import { SchoolService } from 'app/service/schools/school.service';
import { CreateCourseDetailComponent } from './create-course-detail/create-course-detail.component';
import { CreateIdentityDetailComponent } from './create-identity-detail/create-identity-detail.component';
import { CreateParentDetailComponent } from './create-parent-detail/create-parent-detail.component';
import { CreateCompanyDetailComponent } from './create-company-detail/create-company-detail.component';
import { Observable } from 'apollo-link';
import { TranslateService } from '@ngx-translate/core';
import Swal from 'sweetalert2';
import * as _ from 'lodash';

@Component({
  selector: 'ms-create-student-detail',
  templateUrl: './create-student-detail.component.html',
  styleUrls: ['./create-student-detail.component.scss'],
})
export class CreateStudentDetailComponent implements OnInit {
  private subs = new SubSink();
  @Input() schoolId: string;
  @Input() selectedRncpTitleId: string;
  @Input() selectedClassId: string;

  registrationForm: UntypedFormGroup;
  selectedIndex = 0;
  isAdd = false;
  firstTab = false;
  secondTab = false;
  thirdTab = false;
  fourthTab = false;
  index1 = 0;
  index2 = 1;
  index3 = 2;
  index4 = 3;

  @ViewChild('studentCourse', { static: false }) studentCourse: CreateCourseDetailComponent;
  @ViewChild('studentIdentity', { static: false }) studentIdentity: CreateIdentityDetailComponent;
  @ViewChild('studentParent', { static: false }) studentParent: CreateParentDetailComponent;
  @ViewChild('studentCompany', { static: false }) studentCompany: CreateCompanyDetailComponent;

  constructor(
    private fb: UntypedFormBuilder,
    private schoolService: SchoolService,
    private translate: TranslateService,
    ) {}

  ngOnInit() {
    this.initForm();
    this.validationCreate();
  }

  validationCreate() {
    if (
      (this.studentCourse && this.studentCourse.courseForm.value) ||
      (this.studentIdentity && this.studentIdentity.identityForm.value) ||
      (this.studentParent && this.studentParent.parentsForm.value) ||
      (this.studentCompany && this.studentCompany.companyForm.value)
    ) {
      this.isAdd = true;

    }
  }

  initForm() {
    this.registrationForm = this.fb.group({
      school: [this.schoolId ? this.schoolId : '', Validators.required],
      rncp_title: [this.selectedRncpTitleId ? this.selectedRncpTitleId : '', Validators.required],
      current_class: [this.selectedClassId ? this.selectedClassId : '', Validators.required],
      parallel_intake: [false],
      specializations: [null],
      civility: [null, Validators.required],
      first_name: [null, Validators.required],
      last_name: [null, Validators.required],
      date_of_birth: [null, Validators.required],
      place_of_birth: [null, Validators.required],
      email: [null, Validators.required],
      tele_phone: [null, Validators.required],
      address: this.fb.group({
        line1: [null, Validators.required],
        line2: [null],
        postal_code: [null, Validators.required],
        city: [null, Validators.required],
        country: ['France', Validators.required],
      }),
      nationality: [null, Validators.required],
      parents: this.fb.array([]),
    });
  }

  initParentForm() {
    return this.fb.group({
      relation: [null, Validators.required],
      name: [null, Validators.required],
      family_name: [null, Validators.required],
      sex: [null, Validators.required],
      email: [null, Validators.required],
      tele_phone: [null, Validators.required],
      address: this.fb.group({
        line1: [null, Validators.required],
        line2: [null],
        postal_code: [null, Validators.required],
        city: [null, Validators.required],
        country: ['France', Validators.required],
      }),
    });
  }

  report() {

  }

  continue(event: any) {

    if (event) {
      this.selectedIndex++;
      if (this.selectedIndex === 1) {
        this.secondTab = true;
      } else if (this.selectedIndex === 2) {
        this.thirdTab = true;
      } else if (this.selectedIndex === 3) {
        this.fourthTab = true;
      }
    }
  }

  back(event: any) {

    if (event) {
      this.selectedIndex--;
    }
  }
}
