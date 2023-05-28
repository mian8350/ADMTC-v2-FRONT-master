import { Component, OnInit, Input, EventEmitter, Output, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { UntypedFormGroup, Validators, UntypedFormBuilder, FormControl, UntypedFormArray } from '@angular/forms';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import { SchoolService } from 'app/service/schools/school.service';
import { SubSink } from 'subsink';
import { StudentsService } from 'app/service/students/students.service';
import { TranslateService } from '@ngx-translate/core';
import Swal from 'sweetalert2';
import { title } from 'process';
import { MatDialog } from '@angular/material/dialog';
import { MatSelectChange } from '@angular/material/select';
import { FileUploadService } from 'app/service/file-upload/file-upload.service';
import { UtilityService } from 'app/service/utility/utility.service';
import * as _ from 'lodash';
import { environment } from 'environments/environment';
import { AuthService } from 'app/service/auth-service/auth.service';
import { UserService } from 'app/service/user/user.service';
import { UsersService } from 'app/service/users/users.service';
import { GeneralDocumentDialogComponent } from 'app/shared/components/general-document-dialog/general-document-dialog.component';
import * as moment from 'moment';
import { forkJoin } from 'rxjs';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';

@Component({
  selector: 'ms-create-course-detail',
  templateUrl: './create-course-detail.component.html',
  styleUrls: ['./create-course-detail.component.scss'],
})
export class CreateCourseDetailComponent implements OnInit, OnDestroy {
  private subs = new SubSink();
  @Input() schoolId: string;
  @Input() selectedRncpTitleId: string;
  @Input() selectedClassId: string;
  @Output() continue = new EventEmitter<boolean>();
  @ViewChild('fileUploadDoc', { static: false }) fileUploaderDoc: ElementRef;

  titles = [];
  titlesBlock = [];
  classes = [];
  scholars = [];
  isWaitingForResponse = false;
  specializations = [];
  blocksData = [];
  blocksDataSpecilization = [];
  courseForm: UntypedFormGroup;
  studentId: string;

  dataStudent: any;
  blockSelected: number;
  classData: any;
  currentUser: any;
  goTab = false;
  blockIsSelected;

  private intVal: any;
  private timeOutVal: any;

  isUserAdmtc = false;

  constructor(
    private fb: UntypedFormBuilder,
    private titleService: RNCPTitlesService,
    private schoolService: SchoolService,
    private studentService: StudentsService,
    private translate: TranslateService,
    private fileUploadService: FileUploadService,
    public utilService: UtilityService,
    public authService: AuthService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.getLocalStorageUser();
    this.isUserAdmtc = this.utilService.isUserEntityADMTC();
    this.blockIsSelected = [];
    this.initCourseForm();
    if (this.selectedClassId) {
      this.getDataClassFromPatch(this.selectedClassId); 
      this.getSpecialization(this.selectedClassId);
      this.getAutoBlocks(this.selectedRncpTitleId, this.selectedClassId);
    }
    this.subs.sink = this.schoolService.selectedDataStudent$.subscribe((resp) => (this.dataStudent = resp));
    if (this.dataStudent) {
      this.getDataFromStudent(this.dataStudent);
      this.getBlockSpecialization(this.dataStudent);
    }
    this.studentId = this.schoolService.getCurrentStudentId();
    this.getTitleData();
    this.getScholarSeasons();
    this.getAllTitleData();
  }

  initCourseForm() {
    this.courseForm = this.fb.group({
      rncp_title: [this.selectedRncpTitleId, Validators.required],
      current_class: [this.selectedClassId, Validators.required],
      scholar_season: [null],
      parallel_intake: [null],
      specialization: [null],
      is_take_full_prepared_title: [true],
      is_have_exemption_block: [false],
      is_have_specialization: [false],
      partial_blocks: this.fb.array([]),
      exemption_blocks: this.fb.array([]),
      exemption_block_justifications: this.fb.array([]),
    });
  }

  initPartialBlock() {
    return this.fb.group({
      partial_blocks: [''],
    });
  }

  initExemptionBlock() {
    return this.fb.group({
      block_id: [''],
      reason: [''],
      rncp_title_outside_platform: [''],
      rncp_title_in_platform: [''],
      justification_document: [''],
    });
  }

  initExemptionDocs() {
    return this.fb.group({
      document_name: ['', [Validators.required]],
      s3_file_name: ['', [Validators.required]]
    })
  }

  getPartialBlock(): UntypedFormArray {
    return this.courseForm.get('partial_blocks') as UntypedFormArray;
  }

  getExemptionBlock(): UntypedFormArray {
    return this.courseForm.get('exemption_blocks') as UntypedFormArray;
  }

  getExemptionDocs(): UntypedFormArray {
    return this.courseForm.get('exemption_block_justifications') as UntypedFormArray;
  }

  addPartialBlock() {
    this.getPartialBlock().push(this.initPartialBlock());
  }

  addExemptionBlock() {
    this.getExemptionBlock().push(this.initExemptionBlock());
  }

  addExemptionDocs() {
    this.getExemptionDocs().push(this.initExemptionDocs());
  }

  selectSpecialization(event: MatSelectChange) {
    const selectedSpec = this.specializations.find((spec) => spec._id === event.value);
    if (selectedSpec) {
      this.courseForm.get('specialization').patchValue(selectedSpec._id);
    }
  }

  getTitleData() {
    const titleId = this.courseForm.get('rncp_title').value ? this.courseForm.get('rncp_title').value : '';
    if (titleId) {
      this.subs.sink = this.titleService.getOneTitleByIdForCourse(titleId).subscribe((response) => {
        if (response) {
          this.courseForm.get('rncp_title').patchValue(response._id);
          if (response.classes && response.classes.length) {
            this.getClassesForPC();
            // let temp = _.cloneDeep(response.classes);
            // this.classes = temp;

            // // *************** IF user is acad dir or admin, then will only get class of their assigned class
            // if (this.utilService.isUserAcadDirAdmin()) {
            //   const userType = this.currentUser.entities ? this.currentUser.entities[0].type.name : '';
            //   this.subs.sink = this.authService.getUserById(this.currentUser._id).subscribe((respp) => {
            //     const academicUser = respp.entities.filter((ent) => ent.type.name === userType);
            //     const classes = this.utilService.getAcademicAllAssignedClass(academicUser);

            //     temp = temp.filter((classData) => classes.includes(classData._id));
            //     this.classes = temp;
            //   });
            // }
          }
        }
        this.getRncpTitles();
      });
    } else {
      this.getRncpTitles();
    }
  }

  getClassesForPC() {
    const titleId = this.courseForm.get('rncp_title').value ? this.courseForm.get('rncp_title').value : '';
    if (titleId) {
      this.subs.sink = this.titleService.getClassesByTitleAndPC(titleId , this.schoolId).subscribe((resp) => {
        let temp = _.cloneDeep(resp);
  
        // *************** IF user is acad dir or admin, then will only get class of their assigned class
        if (this.utilService.isUserAcadDirAdmin()) {
          const userType = this.currentUser.entities ? this.currentUser.entities[0].type.name : '';
          this.subs.sink = this.authService.getUserById(this.currentUser._id).subscribe((respp) => {
            const academicUser = respp.entities.filter((ent) => ent.type.name === userType);
            const classes = this.utilService.getAcademicAllAssignedClass(academicUser);

            temp = temp.filter((classData) => classes.includes(classData._id));
            this.classes = temp;
          });
        } else {
          this.classes = temp;
        }
      });
    }
  }

  getAllTitleData() {
    this.titlesBlock = [];
    this.subs.sink = this.titleService.GetAllTitleDropdownList('').subscribe((response) => {
      if (response) {
        this.titlesBlock = response;
      }
    });
  }

  getDataFromStudent(studentData) {
    this.blocksData = [];
    this.blocksDataSpecilization = [];
    this.getExemptionBlock().clear();
    this.getPartialBlock().clear();

    this.getDataClassFromPatch(studentData.current_class);
    this.subs.sink = this.studentService.getAllBlockCompetence(studentData.rncp_title, studentData.current_class, true).subscribe((response) => {
      if (response && response.length) {
        this.blocksData = response;
        this.blocksData.forEach((block) => {
          this.addPartialBlock();
          this.addExemptionBlock();
        });
        if (studentData.partial_blocks && studentData.partial_blocks.length && this.blocksData && this.blocksData.length) {
          this.blocksData.forEach((block, blockIndex) => {
            studentData.partial_blocks.forEach((blockPartial) => {
              if (block._id === blockPartial) {
                this.getPartialBlock().at(blockIndex).get('partial_blocks').setValue(blockPartial);
              }
            });
          });
          delete studentData.partial_blocks;
        } else {
          studentData.partial_blocks = [];
        }
        if (studentData.exemption_blocks && studentData.exemption_blocks.length && this.blocksData && this.blocksData.length) {
          this.blocksData.forEach((block, blockIndex) => {
            studentData.exemption_blocks.forEach((blockExemption) => {
              if (block._id === blockExemption.block_id) {
                this.blockIsSelected = [true];
                this.getExemptionBlock().at(blockIndex).patchValue(blockExemption);
              }
            });
          });
          delete studentData.exemption_blocks;
        } else {
          studentData.exemption_blocks = [];
        }
        if (studentData.specialization) {
          studentData.is_have_specialization = true;
        }

        this.courseForm.patchValue(studentData);
      } else {
        this.blocksData = [];
      }
    });
  }

  getBlockSpecialization(studentData){
    this.blocksDataSpecilization = [];
    this.subs.sink = this.studentService.getAllBlockCompetence(studentData.rncp_title, studentData.current_class, false).subscribe((resp) => {
      if (resp && resp.length) {
        this.blocksDataSpecilization = _.cloneDeep(resp);
      } else {
        this.blocksDataSpecilization = [];
      }
    })
  }

  getDataClass() {
    this.classData = [];
    const classId = this.courseForm.get('current_class').value ? this.courseForm.get('current_class').value : '';
    this.subs.sink = this.titleService.getClassById(classId).subscribe((resp) => {
      this.classData = _.cloneDeep(resp);
      this.getSpecialization(resp._id);
    });
  }

  getDataClassFromPatch(classId) {
    this.classData = [];
    this.subs.sink = this.titleService.getClassById(classId).subscribe((resp) => {
      this.classData = _.cloneDeep(resp);
    });
  }

  getBlocksData() {
    this.blocksData = [];
    this.getExemptionBlock().clear();
    this.getPartialBlock().clear();
    const titleId = this.courseForm.get('rncp_title').value ? this.courseForm.get('rncp_title').value : '';
    const classId = this.courseForm.get('current_class').value ? this.courseForm.get('current_class').value : '';
    if (titleId && classId) {
      this.subs.sink = forkJoin([this.studentService.getAllBlockCompetence(titleId, classId, true), this.studentService.getAllBlockCompetence(titleId, classId, false)]).subscribe(([resp1, resp2]) => {
        if (resp1 && resp1.length) {
          this.blocksData = resp1;
          this.blocksData.forEach((block) => {
            this.addPartialBlock();
            this.addExemptionBlock();
          });
        } else {
          this.blocksData = [];
        }
        if (resp2 && resp2.length) {
          this.blocksDataSpecilization = resp2;
        } else {
          this.blocksDataSpecilization = [];
        }
      });
    }
  }

  getAutoBlocks(titleId, classId) {
    this.blocksData = [];
    this.blocksDataSpecilization = [];
    if (titleId && classId) {
      this.getExemptionBlock().clear();
      this.getPartialBlock().clear();
      this.subs.sink = forkJoin([this.studentService.getAllBlockCompetence(titleId, classId, true), this.studentService.getAllBlockCompetence(titleId, classId, false)]).subscribe(([resp1, resp2]) => {
        if (resp1 && resp1.length) {
          this.blocksData = _.cloneDeep(resp1);
          this.blocksData.forEach((block) => {
            this.addPartialBlock();
            this.addExemptionBlock();
          });
        } else {
          this.blocksData = [];
        }
        if (resp2 && resp2.length) {
        this.blocksDataSpecilization = _.cloneDeep(resp2);
        }
      });
    }
  }

  getSpecialization(classId: string) {
    this.subs.sink = this.schoolService.getSchoolSpecialization(this.schoolId).subscribe((resp) => {
      const prepData = resp.preparation_center_ats.filter((element) => {
        return element.class_id && element.class_id._id === classId;
      });
      if (prepData && prepData[0] && prepData[0].selected_specializations && prepData[0].selected_specializations.length) {
        this.specializations = prepData[0].selected_specializations;
        this.specializations = this.specializations.sort((a,b) => a.name.localeCompare(b.name));
      }

    });
  }

  getRncpTitles() {
    this.subs.sink = this.titleService.getRncpTitlesBySchoolId(this.schoolId).subscribe((resp) => {
      let temp = _.cloneDeep(resp);
      this.titles = temp;

      // *************** IF user is acad dir or admin, then will only get title of their assigned title
      if (this.utilService.isUserAcadDirAdmin()) {

        const userType = this.currentUser.entities ? this.currentUser.entities[0].type.name : '';
        this.subs.sink = this.authService.getUserById(this.currentUser._id).subscribe((res) => {
          const dataUSer = res.entities.filter((ent) => ent.type.name === userType);
          const titles = this.utilService.getAcademicAllAssignedTitle(dataUSer);
          temp = temp.filter((titl) => titles.includes(titl._id));
          this.titles = temp;
        });
      }
    });
  }

  getScholarSeasons() {
    this.subs.sink = this.titleService.getScholarSeasons().subscribe((response) => {
      if (response) {
        this.scholars = response;
      }
    });
  }
  onCancelAdd() {
    if (this.courseForm.get('rncp_title').value) {
      let timeDisabled = 5;
      Swal.fire({
        title: this.translate.instant('IMP_STUDENT.CANCEL_ACTION.TITLE'),
        html: this.translate.instant('IMP_STUDENT.CANCEL_ACTION.TEXT2'),
        footer: `<span style="margin-left: auto">IMP_STUDENT.CANCEL_ACTION</span>`,
        type: 'warning',
        showCancelButton: true,
        confirmButtonText: this.translate.instant('SWEET_ALERT.DELETE.CONFIRM', { timer: timeDisabled }),
        cancelButtonText: this.translate.instant('IMP_STUDENT.CANCEL_ACTION.DECBTN'),
        onOpen: () => {
          Swal.disableConfirmButton();
          const confirmBtnRef = Swal.getConfirmButton();
          this.intVal = setInterval(() => {
            timeDisabled -= 1;
            confirmBtnRef.innerText = this.translate.instant('SWEET_ALERT.DELETE.CONFIRM') + ' in ' + timeDisabled + ' sec';
          }, 1000);
          this.timeOutVal = setTimeout(() => {
            confirmBtnRef.innerText = this.translate.instant('SWEET_ALERT.DELETE.CONFIRM');
            Swal.enableConfirmButton();
            clearInterval(this.intVal);
          }, timeDisabled * 1000);
        },
      }).then((result) => {
        if (result.value) {
          this.schoolService.setDataStudent(null);
          this.schoolService.setCurrentStudentId(null);
          this.schoolService.setDataStudentIdentity(null);
          this.schoolService.setAddStudent(false);
        }
      });
    } else {
      this.schoolService.setDataStudent(null);
      this.schoolService.setCurrentStudentId(null);
      this.schoolService.setDataStudentIdentity(null);
      this.schoolService.setAddStudent(false);
    }
  }

  changeTitle() {
    const titleId = this.courseForm.get('rncp_title').value;
    this.courseForm.get('current_class').setValue(null);
    this.classes = [];
    this.blocksData = [];
    this.classData = [];
    this.specializations = [];
    if (titleId) {
      this.subs.sink = this.titleService.getClassesByTitleAndPC(titleId , this.schoolId).subscribe((resp) => {
        let temp = _.cloneDeep(resp);

        // *************** IF user is acad dir or admin, then will only get class of their assigned class
        if (this.utilService.isUserAcadDirAdmin()) {
          const userType = this.currentUser.entities ? this.currentUser.entities[0].type.name : '';
          this.subs.sink = this.authService.getUserById(this.currentUser._id).subscribe((respp) => {
            const academicUser = respp.entities.filter((ent) => ent.type.name === userType);
            const classes = this.utilService.getAcademicAllAssignedClass(academicUser);

            temp = temp.filter((classData) => classes.includes(classData._id));
            this.classes = temp;
          });
        } else {
          this.classes = temp;
        }
      });
    }
  }

  changeScholar() {}

  saveDataStudent() {
    // this.isWaitingForResponse = true;
    const payload = this.createPayload();

    const lang = this.translate.currentLang.toLowerCase();
    this.subs.sink = this.schoolService.updateStudent(this.studentId, payload, lang).subscribe((resp) => {
      this.isWaitingForResponse = false;
      if (resp) {
        Swal.fire({
          type: 'success',
          title: 'Bravo !',
        }).then(() => this.continue.emit(true));
      }
    },
    (err) => {
      this.isWaitingForResponse = false;
      if (
        err['message'] === 'GraphQL error: Error: Email Registered As Student' ||
        err['message'] === 'GraphQL error: Error: Email Registered As User'
      ) {
        Swal.fire({
          type: 'error',
          title: this.translate.instant('ADDSTUDENT_ST.TITLE'),
          html: this.translate.instant('ADDSTUDENT_ST.TEXT'),
          footer: `<span style="margin-left: auto">ADDSTUDENT_ST</span>`,
          confirmButtonText: this.translate.instant('ADDSTUDENT_ST.BUTTON'),
        });
      } else {
        Swal.fire({
          type: 'error',
          title: 'Error !',
          confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
        }).then((res) => {

        });
      }
    },
  );
  }

  nextTab() {
    this.schoolService.setDataStudent(this.createPayload());
    if (this.courseForm.valid) {
      if (this.isUserAdmtc) {
        if (this.studentId) {
          this.saveDataStudent();
        } else {
          this.continue.emit(true);
        }
      } else {
        this.checkRegisPeriod();
      }
    } else {

      Swal.fire({ type: 'error', title: 'Error' });
      this.courseForm.markAllAsTouched();
    }
  }

  checkRegisPeriod() {
    const classId = this.courseForm.get('current_class').value;
    const classSelected = this.classes.find((classes) => classes._id === classId);

    const today = moment().toDate();
    if (classSelected && classSelected.registration_period) {
      const startPeriod = new Date(classSelected.registration_period.start_date.date);
      const endPeriod = new Date(classSelected.registration_period.end_date.date);
  
      if ((today >= startPeriod) && (today <= endPeriod)) {
        if (this.studentId) {
          this.saveDataStudent();
        } else {
          this.continue.emit(true);
        }
      } else {
        this.swalAddStudentS02();
      }
    } else {
      this.swalAddStudentS02();
    }
  }

  swalAddStudentS02() {
    Swal.fire({
      type: 'error',
      title: this.translate.instant('ADDSTUDENT_S02.TITLE'),
      html: this.translate.instant('ADDSTUDENT_S02.TEXT'),
      footer: `<span style="margin-left: auto">ADDSTUDENT_S02</span>`,
      confirmButtonText: this.translate.instant('ADDSTUDENT_S02.BUTTON'),
      allowEnterKey: false,
      allowEscapeKey: false,
      allowOutsideClick: false,
    });
  }

  openUploadWindow(blocksIndex: number) {

    this.blockSelected = blocksIndex;
    this.fileUploaderDoc.nativeElement.click();
  }

  uploadFile(fileInput: Event, blocksIndex) {
    this.isWaitingForResponse = true;
    const file = (<HTMLInputElement>fileInput.target).files[0];


    // *************** Accept Reject File Upload outside allowed accept
    const acceptable = ['doc', 'docx', 'ppt', 'pptx', 'txt', 'pdf', 'xlsx', 'xls'];
    const fileType = this.utilService.getFileExtension(file.name).toLocaleLowerCase();

    if (acceptable.includes(fileType)) {
      // this.file = (<HTMLInputElement>fileInput.target).files[0];
      this.subs.sink = this.fileUploadService.singleUpload(file).subscribe((resp) => {
        this.isWaitingForResponse = false;
        if (resp) {
          this.getExemptionBlock().at(this.blockSelected).get('justification_document').patchValue(resp.s3_file_name);
        }
      });
    } else {
      this.isWaitingForResponse = false;
      Swal.fire({
        type: 'error',
        title: this.translate.instant('UPLOAD_ERROR.WRONG_TYPE_TITLE'),
        text: this.translate.instant('UPLOAD_ERROR.WRONG_TYPE_TEXT', { file_exts: '.doc, .docx, .ppt, .pptx, .txt, .pdf, .xlsx, .xls' }),
        footer: `<span style="margin-left: auto">UPLOAD_ERROR</span>`,
        allowEscapeKey: false,
        allowOutsideClick: false,
        allowEnterKey: false,
      });
    }
  }

  downloadFile(fileUrl: string) {
    const url = `${environment.apiUrl}/fileuploads/${fileUrl}?download=true`.replace('/graphql', '');
    window.open(url, '_blank');
  }

  resetPartialBlock() {
    this.blockIsSelected = [];
    this.courseForm.get('partial_blocks').reset();
    this.courseForm.get('is_have_exemption_block').reset();
    this.courseForm.get('exemption_blocks').reset();
    this.getExemptionBlock().clearValidators();
    this.getExemptionBlock().updateValueAndValidity();
  }
  resetExemptionBlock() {
    this.blockIsSelected = [];
    this.courseForm.get('exemption_blocks').reset();
  }

  createPayload() {
    const payload = _.cloneDeep(this.courseForm.value);
    const partialData = [];
    const exemptionData = [];

    if (payload.is_take_full_prepared_title) {
      payload.partial_blocks = [];
      if (this.blocksData && this.blocksData.length && payload.exemption_blocks && payload.exemption_blocks.length) {
        payload.exemption_blocks.forEach((block, blockIndex) => {
          if (block.block_id) {
            const data = {
              block_id: this.blocksData[blockIndex]._id,
              justification_document: block.justification_document,
              rncp_title_outside_platform: block.rncp_title_outside_platform,
              rncp_title_in_platform: block.rncp_title_in_platform,
              reason: block.reason,
            };
            exemptionData.push(data);
          }
        });
      }
      payload.exemption_blocks = exemptionData;
    }
    if (!payload.is_take_full_prepared_title) {
      payload.exemption_blocks = [];
      if (this.blocksData && this.blocksData.length && payload.partial_blocks && payload.partial_blocks.length) {
        payload.partial_blocks.forEach((block, blockIndex) => {
          if (block.partial_blocks) {
            partialData.push(this.blocksData[blockIndex]._id);
          }
        });
      }
      payload.partial_blocks = partialData;
    }

    // Delete documents exemption if saving without both take full title with exemption
    if (!payload.is_take_full_prepared_title || !payload.is_have_exemption_block) {
      payload.exemption_block_justifications = [];
    }

    delete payload.is_have_specialization;

    return payload;
  }

  rejectRegisterPartialBlock(index) {
    const allSelcted = false;
    let partial = [];
    let data = [];
    this.blockIsSelected = [];
    partial = this.courseForm.get('partial_blocks').value;
    data = partial.filter((resp) => {
      return resp.partial_blocks === '' || resp.partial_blocks === null || resp.partial_blocks === false;
    });

    this.blockIsSelected = partial.filter((resp) => {
      return resp.partial_blocks || resp.partial_blocks === true;
    });
    if (data.length < 1) {
      this.getPartialBlock().at(index).get('partial_blocks').setValue(false);
      Swal.fire({
        type: 'warning',
        text: this.translate.instant('REGISTER_ALL_EXPERTISE_STUDENT.TEXT'),
        allowEscapeKey: false,
        allowOutsideClick: false,
        allowEnterKey: false,
      });
    }
  }

  rejectRegisterExemptionBlock(index, event) {
    if (event.checked) {
      this.getExemptionBlock().at(index).get('reason').setValue('');
      this.getExemptionBlock().at(index).get('reason').clearValidators();
      this.getExemptionBlock().at(index).get('reason').updateValueAndValidity();
      this.getExemptionBlock().at(index).get('reason').setValidators([Validators.required]);
      this.getExemptionBlock().at(index).get('reason').updateValueAndValidity();
    } else {
      this.getExemptionBlock().at(index).get('rncp_title_in_platform').setValue('');
      this.getExemptionBlock().at(index).get('rncp_title_in_platform').clearValidators();
      this.getExemptionBlock().at(index).get('rncp_title_in_platform').updateValueAndValidity();
      this.getExemptionBlock().at(index).get('rncp_title_outside_platform').setValue('');
      this.getExemptionBlock().at(index).get('rncp_title_outside_platform').clearValidators();
      this.getExemptionBlock().at(index).get('rncp_title_outside_platform').updateValueAndValidity();
      this.getExemptionBlock().at(index).get('reason').setValue('');
      this.getExemptionBlock().at(index).get('reason').clearValidators();
      this.getExemptionBlock().at(index).get('reason').updateValueAndValidity();
    }
    const allSelcted = false;
    let partial = [];
    let data = [];
    this.blockIsSelected = [];
    partial = this.courseForm.get('exemption_blocks').value;
    data = partial.filter((resp) => {
      return resp.block_id === '' || resp.block_id === null || resp.block_id === false;
    });
    this.blockIsSelected = partial.filter((resp) => {
      return resp.block_id || resp.block_id === true;
    });

    if (data.length < 1) {
      this.getExemptionBlock().at(index).get('block_id').setValue(false);
      Swal.fire({
        type: 'warning',
        text: this.translate.instant('REGISTER_EXPERTISE_STUDENT.TEXT'),
        footer: `<span style="margin-left: auto">REGISTER_EXPERTISE_STUDENT</span>`,
        allowEscapeKey: false,
        allowOutsideClick: false,
        allowEnterKey: false,
      });
    }
  }

  radioChange(type, blocksIndex) {
    if (type === 'retake_in_another_title' || type === 'validated_in_another_title_within_platform') {
      this.getExemptionBlock().at(blocksIndex).get('rncp_title_outside_platform').clearValidators();
      this.getExemptionBlock().at(blocksIndex).get('rncp_title_outside_platform').updateValueAndValidity();
      this.getExemptionBlock().at(blocksIndex).get('rncp_title_in_platform').setValue('');
      this.getExemptionBlock().at(blocksIndex).get('rncp_title_in_platform').clearValidators();
      this.getExemptionBlock().at(blocksIndex).get('rncp_title_in_platform').updateValueAndValidity();
      this.getExemptionBlock().at(blocksIndex).get('rncp_title_in_platform').setValidators([Validators.required]);
      this.getExemptionBlock().at(blocksIndex).get('rncp_title_in_platform').updateValueAndValidity();
    } else {
      this.getExemptionBlock().at(blocksIndex).get('rncp_title_outside_platform').setValue('');
      this.getExemptionBlock().at(blocksIndex).get('rncp_title_outside_platform').clearValidators();
      this.getExemptionBlock().at(blocksIndex).get('rncp_title_outside_platform').updateValueAndValidity();
      this.getExemptionBlock().at(blocksIndex).get('rncp_title_outside_platform').setValidators([Validators.required]);
      this.getExemptionBlock().at(blocksIndex).get('rncp_title_outside_platform').updateValueAndValidity();
      this.getExemptionBlock().at(blocksIndex).get('rncp_title_in_platform').clearValidators();
      this.getExemptionBlock().at(blocksIndex).get('rncp_title_in_platform').updateValueAndValidity();
    }
  }

  openExemptionDocsDialog(type: string, data?, exemptionDocsindex?) {

    this.subs.sink = this.dialog.open(GeneralDocumentDialogComponent, {
      panelClass: 'certification-rule-pop-up',
      disableClose: true,
      width: '700px',
      data: {
        type: type,
        isUpdate: data ? true : false,
        documentData : data ? data : null
      }
    }).afterClosed().subscribe(resp => {

      if (resp) {
        if (type === 'add') {
          this.addExemptionDocs();
          this.getExemptionDocs().at(this.getExemptionDocs().length - 1).patchValue(resp);
        } else if (type === 'edit') {
          this.getExemptionDocs().at(exemptionDocsindex).patchValue(resp);
        }
      }
    })
  }

  deleteExemptionDocs(exemptionDocsindex) {
    Swal.fire({
      type: 'warning',
      allowOutsideClick: false,
      title: this.translate.instant('CONFIRMDELETE', { value: this.translate.instant('Document') }),
      confirmButtonText: this.translate.instant('Yes'),
      showCancelButton: true,
      cancelButtonText: this.translate.instant('No'),
    }).then((result) => {
      if (result.value) {
        this.getExemptionDocs().removeAt(exemptionDocsindex);
      }
    });
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  checkSelectedSpecialization(){
    let searchSelectedData = []
    const specializationData = this.courseForm.get('specialization').value;
    if(this.blocksData.length) {
      searchSelectedData = this.blocksDataSpecilization.filter(data => data?.specialization?._id === specializationData);
    } 
    return searchSelectedData;
  }

  isHaveSpecializationChange(evt: MatSlideToggleChange) {
    if (evt.checked) {
      this.courseForm.get('specialization').addValidators(Validators.required)
      this.courseForm.get('specialization').reset()
    } else {
      this.courseForm.get('specialization').setValue(null)
      this.courseForm.get('specialization').clearValidators()
      this.courseForm.get('specialization').updateValueAndValidity()
    }
  }
}
