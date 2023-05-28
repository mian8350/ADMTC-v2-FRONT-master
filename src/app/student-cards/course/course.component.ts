import { CertidegreeService } from 'app/service/certidegree/certidegree.service';
import { Component, OnInit, Input, OnChanges, Output, EventEmitter, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { SubSink } from 'subsink';
import { StudentsService } from 'app/service/students/students.service';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import { SchoolService } from 'app/service/schools/school.service';
import Swal from 'sweetalert2';
import * as _ from 'lodash';
import { MatDialog } from '@angular/material/dialog';
import { MatSelectChange } from '@angular/material/select';
import { PermissionService } from 'app/service/permission/permission.service';
import { FileUploadService } from 'app/service/file-upload/file-upload.service';
import { UtilityService } from 'app/service/utility/utility.service';
import { NgxPermissionsService } from 'ngx-permissions';
import { environment } from 'environments/environment';
import { AuthService } from 'app/service/auth-service/auth.service';
import { GeneralDocumentDialogComponent } from 'app/shared/components/general-document-dialog/general-document-dialog.component';
import { combineLatest } from 'rxjs';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { eventNames } from 'process';

@Component({
  selector: 'ms-course',
  templateUrl: './course.component.html',
  styleUrls: ['./course.component.scss'],
})
export class CourseComponent implements OnInit, OnChanges, OnDestroy {
  private subs = new SubSink();
  @Input() studentId = '';
  @Input() studentPrevCourseData: any;
  @Input() schoolId: string;
  @Output() continue = new EventEmitter<boolean>();
  courseForm: UntypedFormGroup;
  couseTemp: any;
  @ViewChild('fileUploadDoc', { static: false }) fileUploaderDoc: ElementRef;

  titles = [];
  classes = [];
  titlesBlock = [];
  scholars = [];
  specializations = [];
  blocksData = [];
  classData: any;
  blockSelected: number;
  isStudent: any;
  isMentor: any;
  isADMTC: boolean = false;
  currentUser: any;
  isWaitingForResponse = false;
  reasonsFilled = false;
  blockIsSelected;
  specializationBlock: any;
  tempSpecializationBlock: any;
  isLoading = false;
  constructor(
    private fb: UntypedFormBuilder,
    private translate: TranslateService,
    private studentService: StudentsService,
    private rncpTitleService: RNCPTitlesService,
    private schoolService: SchoolService,
    public permissionService: PermissionService,
    private fileUploadService: FileUploadService,
    public utilService: UtilityService,
    private permissions: NgxPermissionsService,
    public authService: AuthService,
    private dialog: MatDialog,
    private certieDegreeService: CertidegreeService,
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.getLocalStorageUser();
    this.blockIsSelected = [];
    this.isStudent = this.permissions.getPermission('Student') ? true : false;
    this.isMentor = this.permissions.getPermission('Mentor') ? true : false;
    this.isADMTC = this.utilService.isUserEntityADMTC()
    this.getScholarSeasons();
    this.getAllTitleData();
  }

  ngOnChanges() {
    this.initCourseForm();
    this.getCourseData();
    this.getTitleList();
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
    this.studentService.resetStudentCardTrigger(true);
  }

  initCourseForm() {
    this.courseForm = this.fb.group({
      rncp_title: [null, Validators.required],
      current_class: [null, Validators.required],
      parallel_intake: [null],
      scholar_season: [null],
      specialization: [null],
      email: [null, Validators.required],
      is_take_full_prepared_title: [true],
      is_have_exemption_block: [false],
      is_have_specialization: [false],
      partial_blocks: this.fb.array([]),
      exemption_blocks: this.fb.array([]),
      exemption_block_justifications: this.fb.array([]),
    });
  }

  initFormListener() {
    this.subs.sink = this.courseForm.valueChanges.subscribe((resp) => {
      this.isFormSame();
    });    
  }

  selectSpeciality(data){    
    this.specializationBlock = _.cloneDeep(this.tempSpecializationBlock);
    if(this.specializations && this.specializations.length && this.specializationBlock && this.specializationBlock.length) {
      // get specialityBlockId selected
      const specialitySelected = this.specializations.filter(speciality => speciality?._id === data.value).map(speciality => speciality?._id);                  
      this.specializationBlock = this.specializationBlock.filter(speciality => specialitySelected.includes(speciality?.specialization?._id));      
    }
  }

  isFormSame() {
    const secondForm = JSON.stringify(this.couseTemp);
    const formType = JSON.stringify(this.courseForm.value);
    if (secondForm === formType) {
      this.certieDegreeService.childrenFormValidationStatus = true;
      return true;
    } else {
      this.certieDegreeService.childrenFormValidationStatus = false;
      return false;
    }
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
      s3_file_name: ['', [Validators.required]],
    });
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

  getCourseData() {
    this.isWaitingForResponse = true;
    if (this.studentPrevCourseData) {
      this.subs.sink = this.studentService
        .getStudentsPreviousCourseData(
          this.schoolId,
          this.studentPrevCourseData.rncp_title._id,
          this.studentPrevCourseData.current_class._id,
          this.studentId,
        )
        .subscribe((response) => {
          // student's previous course data
          if (response && response[0]) {
            this.isWaitingForResponse = false;
            const res = _.cloneDeep(response[0]);
            this.setCourseData(res);
          }
        });
    } else {
      this.subs.sink = this.studentService.getStudentsCourseData(this.studentId).subscribe((response) => {
        this.isWaitingForResponse = false;
        const res = _.cloneDeep(response);
        this.setCourseData(res);
      });
    }
  }

  setCourseData(res) {
    if (res) {
      this.getDataClass(res.current_class._id);
      if (res.rncp_title && typeof res.rncp_title === 'object' && res.rncp_title._id) {
        res.rncp_title = res.rncp_title._id;
        this.getClassAndSpecializationList(res.rncp_title);
      }
      if (res.current_class && typeof res.current_class === 'object' && res.current_class._id) {
        res.current_class = res.current_class._id;
      }
      if (res.specialization && typeof res.specialization === 'object' && res.specialization._id) {
        res.specialization = res.specialization._id;
      }
      if (res.specialization) {
        res.is_have_specialization = true;
      }

      // *************** Format the exemptionDocs before patchvalue
      if (res.exemption_block_justifications && res.exemption_block_justifications.length) {
        res.exemption_block_justifications.forEach((exemptionDoc) => {
          this.addExemptionDocs();
        });
      } else {
        res.exemption_block_justifications = [];
      }

      this.getBlocksData(res.rncp_title, res.current_class, res);


      this.courseForm.patchValue(res);


    }
  }

  getTitleList() {
    this.subs.sink = this.rncpTitleService.getRncpTitlesBySchoolId(this.schoolId).subscribe((resp) => {
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
    this.subs.sink = this.rncpTitleService.getScholarSeasons().subscribe((response) => {
      if (response) {
        this.scholars = response;
      }
    });
  }

  getBlocksData(titleId, classId, res) {
    this.blocksData = [];
    this.getExemptionBlock().clear();
    this.getPartialBlock().clear();

    // for exclude specialization block if value true
    const is_exclude_specialization = true;
    this.isLoading = true;
    this.subs.sink = combineLatest(
      [this.studentService.getAllBlockCompetence(titleId, classId, is_exclude_specialization), this.studentService.getAllBlockCompetence(titleId, classId, false)])
      .subscribe(([resp1, resp2]) => {
        if (resp1 && resp1.length) {
          this.blocksData = resp1;
          if (resp2 && resp2.length) {
            this.specializationBlock = _.cloneDeep(resp2);
            this.tempSpecializationBlock = _.cloneDeep(resp2);
          } else {
            this.specializationBlock = [];
          }
          this.isLoading = false;
          this.blocksData.forEach((block) => {
            this.addPartialBlock();
            this.addExemptionBlock();
          });
          if (res.partial_blocks && this.blocksData && this.blocksData.length) {
            this.blocksData.forEach((block, blockIndex) => {
              res.partial_blocks.forEach((blockPartial) => {
                if (block._id === blockPartial._id) {
                  this.blockIsSelected = [true];
                  this.getPartialBlock().at(blockIndex).get('partial_blocks').setValue(blockPartial._id);
                }
              });
            });

            delete res.partial_blocks;
          } else {
            res.partial_blocks = [];
          }
          if (res.exemption_blocks) {
            this.blocksData.forEach((block, blockIndex) => {
              res.exemption_blocks.forEach((blockExemption) => {
                if (blockExemption) {
                  if (block._id === blockExemption.block_id._id) {
                    this.blockIsSelected = [true];
                    blockExemption.block_id = blockExemption.block_id._id;
                    blockExemption.rncp_title_in_platform = blockExemption.rncp_title_in_platform
                      ? blockExemption.rncp_title_in_platform._id
                      : '';
                    this.getExemptionBlock().at(blockIndex).patchValue(blockExemption);
                  }
                }
              });
            });
            delete res.exemption_blocks;
          } else {
            res.exemption_blocks = [];
          }

          this.courseForm.patchValue(res);
          this.couseTemp = this.courseForm.value;
          if (this.courseForm.get('is_have_specialization').value && this.courseForm.get('specialization').value) {
            const value = this.courseForm.get('specialization').value;
            this.specializationBlock = _.cloneDeep(this.tempSpecializationBlock);
            if (this.specializations && this.specializations.length && this.specializationBlock && this.specializationBlock.length) {
              const specialitySelected = this.specializations.filter(speciality => speciality?._id === value).map(speciality => speciality?._id);
              this.specializationBlock = this.specializationBlock.filter(speciality => specialitySelected.includes(speciality?.specialization?._id));
            }
          }
          this.isFormSame();
          this.initFormListener();
        } else {
          this.blocksData = [];
        }
      });
  }

  getAllBlocks() {
    const titleId = this.courseForm.get('rncp_title').value ? this.courseForm.get('rncp_title').value : '';
    const classId = this.courseForm.get('current_class').value ? this.courseForm.get('current_class').value : '';
    if (titleId && classId) {
      this.blocksData = [];
      this.getExemptionBlock().clear();
      this.getPartialBlock().clear();
      // for exclude specialization block if value true
      const is_exclude_specialization = true;
      this.subs.sink = combineLatest(
        [this.studentService.getAllBlockCompetence(titleId, classId, is_exclude_specialization), this.studentService.getAllBlockCompetence(titleId, classId, false)])
        .subscribe(([resp1, resp2]) => {
          if (resp1 && resp1.length) {
            this.blocksData = resp1;
            if (resp2 && resp2.length) {
              this.specializationBlock = _.cloneDeep(resp2);
              this.tempSpecializationBlock = _.cloneDeep(resp2);
            } else {
              this.specializationBlock = [];
            }
            if (this.courseForm.get('is_have_specialization').value && this.courseForm.get('specialization').value) {
              const value = this.courseForm.get('specialization').value;
              this.specializationBlock = _.cloneDeep(this.tempSpecializationBlock);
              if (this.specializations && this.specializations.length && this.specializationBlock && this.specializationBlock.length) {
                const specialitySelected = this.specializations.filter(speciality => speciality?._id === value).map(speciality => speciality?._id);
                this.specializationBlock = this.specializationBlock.filter(speciality => specialitySelected.includes(speciality?.specialization?._id));
              }
            }
            this.blocksData.forEach((block) => {
              this.addPartialBlock();
              this.addExemptionBlock();
            });
          } else {
            this.blocksData = [];
          }
        })
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

  getClassAndSpecializationList(titleId: string) {
    this.subs.sink = this.rncpTitleService.getOneTitleByIdForCourse(titleId).subscribe((response) => {
      if (response) {
        if (response.classes && response.classes.length) {
          let temp = _.cloneDeep(response.classes);
          this.classes = temp;
          // *************** IF user is acad dir or admin, then will only get class of their assigned class
          if (this.utilService.isUserAcadDirAdmin()) {
            const userType = this.currentUser.entities ? this.currentUser.entities[0].type.name : '';
            this.subs.sink = this.authService.getUserById(this.currentUser._id).subscribe((respp) => {
              const academicUser = respp.entities.filter((ent) => ent.type.name === userType);
              const classes = this.utilService.getAcademicAllAssignedClass(academicUser);

              temp = temp.filter((classData) => classes.includes(classData._id));
              this.classes = temp;
            });
          }
        }

        this.getSpecialization(titleId);
        // if (response.specializations && response.specializations.length) {
        //   this.specializations = response.specializations;
        // } else {
        //   this.specializations = [];
        // }
      }
    });
  }

  getSpecialization(titleId) {
    const classId = this.courseForm.get('current_class').value ? this.courseForm.get('current_class').value : '';
    this.subs.sink = this.schoolService.getSchoolSpecialization(this.schoolId).subscribe((resp) => {
      const prepData = resp.preparation_center_ats.filter((element) => {
        return element.rncp_title_id._id === titleId && element.class_id._id === classId;
      });
      if (prepData && prepData[0] && prepData[0].selected_specializations && prepData[0].selected_specializations.length) {
        this.specializations = prepData[0].selected_specializations;
        this.specializations = this.specializations.sort((a,b) => a.name.localeCompare(b.name))
      }
    });
  }

  changeTitle(titleId: string) {
    if (this.courseForm.get('current_class').value) {
      this.courseForm.get('current_class').patchValue(null);
    }
    this.courseForm.get('specialization').reset();
    this.getClassAndSpecializationList(titleId);
  }

  changeScholar() {}

  changeSpec(event: MatSelectChange) {
    if (event && event.value) {
      const result = _.find(this.specializations, (spec) => spec._id === event.value);
      if (result && result.name) {
        this.courseForm.get('specialization').get('name').patchValue(result.name);
      }
    }
  }

  checkIfPartialTitleButNoBlockSelected() {
    // ensure that if title is only partially prepared but no block is selected before saving
    return (
      this.classData.type_evaluation === 'expertise' &&
      (this.courseForm.get('is_have_exemption_block').value || !this.courseForm.get('is_take_full_prepared_title').value) &&
      this.blockIsSelected &&
      this.blockIsSelected.length < 1
    );
  }

  fireEmptyBlockWarningSwal() {
    return Swal.fire({
      type: 'info',
      title: this.translate.instant('TITTLE_PREP_S1.TITLE'),
      text: this.translate.instant('TITTLE_PREP_S1.TEXT'),
      confirmButtonText: this.translate.instant('TITTLE_PREP_S1.BUTTON'),
      footer: `<span style="margin-left: auto">TITTLE_PREP_S1</span>`,
    });
  }

  async updateStudentCourse() {
    if (this.checkIfPartialTitleButNoBlockSelected()) {
      this.courseForm.markAllAsTouched();
      await this.fireEmptyBlockWarningSwal();
      return;
    }
    this.isWaitingForResponse = true;
    const result = this.createPayload();
    const lang = this.translate.currentLang.toLowerCase();
    if (result.specialization && result.specialization._id === null) {
      delete result.specialization;
    }
    this.subs.sink = this.schoolService.updateStudent(this.studentId, result, lang).subscribe(
      (resp) => {
        this.isWaitingForResponse = false;
        if (resp) {
          this.schoolService.setCurrentStudentTitleId(resp.rncp_title._id);
          this.schoolService.setCurrentStudentClassId(resp.current_class._id);
          this.studentService.updateStudentCard(true);
          Swal.fire({
            type: 'success',
            title: 'Bravo !',
          });
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
            allowOutsideClick: false,
          });
        } else if (
          String(err?.message).includes('This student have active contract, need to be closed first') ||
          String(err?.message).includes('Cannot update specialization, because jury already created for current title')
        ) {
          Swal.fire({
            type: 'warning',
            width: 600,
            title: this.translate.instant('Specialization_S4.TITLE'),
            html: this.translate.instant('Specialization_S4.TEXT'),
            footer: '<span style="margin-left: auto">Specialization_S4</span>',
            confirmButtonText: this.translate.instant('Specialization_S4.BUTTON'),
            allowOutsideClick: false,
            allowEscapeKey: false,
          }).then((result) => {
            this.getCourseData();
          });
        } else {
          Swal.fire({
            type: 'error',
            title: 'Error',
            text: err && err['message'] ? err['message'] : err,
            confirmButtonText: 'OK',
          });
        }
      },
    );
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

  getAllTitleData() {
    this.titlesBlock = [];
    this.subs.sink = this.rncpTitleService.GetAllTitleDropdownList('').subscribe((response) => {
      if (response) {
        this.titlesBlock = response;
      }
    });
  }

  getDataClass(classId) {
    if (classId) {
      this.classData = [];
      this.subs.sink = this.rncpTitleService.getClassById(classId).subscribe((resp) => {
        const temp = _.cloneDeep(resp);
        this.classData = resp;
      });
    } else {
      this.classData = [];
      classId = this.courseForm.get('current_class').value ? this.courseForm.get('current_class').value : '';
      this.subs.sink = this.rncpTitleService.getClassById(classId).subscribe((resp) => {
        this.classData = _.cloneDeep(resp);
      });
    }
  }

  createPayload() {
    const payload = _.cloneDeep(this.courseForm.value);
    delete payload.is_have_specialization;
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
        footer: `<span style="margin-left: auto">REGISTER_ALL_EXPERTISE_STUDENT</span>`,
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

  openExemptionDocsDialog(type: string, data?, exemptionDocsindex?) {

    this.subs.sink = this.dialog
      .open(GeneralDocumentDialogComponent, {
        panelClass: 'certification-rule-pop-up',
        disableClose: true,
        width: '700px',
        data: {
          type: type,
          isUpdate: data ? true : false,
          documentData: data ? data : null,
        },
      })
      .afterClosed()
      .subscribe((resp) => {

        if (resp) {
          if (type === 'add') {
            this.addExemptionDocs();
            this.getExemptionDocs()
              .at(this.getExemptionDocs().length - 1)
              .patchValue(resp);
          } else if (type === 'edit') {
            this.getExemptionDocs().at(exemptionDocsindex).patchValue(resp);
          }
        }
      });
  }

  deleteExemptionDocs(exemptionDocsindex) {
    Swal.fire({
      type: 'warning',
      allowOutsideClick: false,
      title: this.translate.instant('CONFIRMDELETE', { value: this.translate.instant('Document') }),
      confirmButtonText: this.translate.instant('Yes'),
      showCancelButton: true,
      footer: `<span style="margin-left: auto">CONFIRMDELETE</span>`,
      cancelButtonText: this.translate.instant('No'),
    }).then((result) => {
      if (result.value) {
        this.getExemptionDocs().removeAt(exemptionDocsindex);
      }
    });
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
