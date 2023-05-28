import { Component, OnInit, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, UntypedFormControl } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { CertidegreeService } from 'app/service/certidegree/certidegree.service';
import { FileUploadService } from 'app/service/file-upload/file-upload.service';
import { SubSink } from 'subsink';
import Swal from 'sweetalert2';
import { ApplicationUrls } from 'app/shared/settings';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';
import { AcademicKitService } from 'app/service/rncpTitles/academickit.service';
import { AuthService } from 'app/service/auth-service/auth.service';

@Component({
  selector: 'ms-certificate-details-design',
  templateUrl: './certificate-details-design.component.html',
  styleUrls: ['./certificate-details-design.component.scss'],
})
export class CertificateDetailsDesignComponent implements OnInit {
  validateContinueButton = false;
  private subs = new SubSink();
  certificateForm: UntypedFormGroup;
  statusCertiDegree;
  statusPreviewList = ['first', 'second'];
  @ViewChild('fileUpload1', { static: false }) fileUpload1: any;
  @ViewChild('fileUpload2', { static: false }) fileUpload2: any;
  @ViewChild('fileUpload3', { static: false }) fileUpload3: any;
  serverimgPath = `${ApplicationUrls.baseApi}/fileuploads/`.replace('/graphql', '');
  imageLoading = {
    signature: false,
    stamp: false,
    background: false,
  };
  templateData = [];
  templates: object[] = [];
  templatesList: object[] = [];
  templateForm = new UntypedFormControl('');
  templateSelected: any;
  certiIssuenceId: any;
  signaturUrl: any;
  stampUrl: any;
  backgroundUrl: any;
  templateName;
  parcheminUrl;
  isShowUploadField = false;
  isWaitingForResponse = false;
  alreadyUploadAllImage = true;
  detailDegree: any;
  originDataForm: any;
  isSaved = false;

  constructor(
    private certiDegreeService: CertidegreeService,
    private fb: UntypedFormBuilder,
    private fileUploadService: FileUploadService,
    private translate: TranslateService,
    private sanitizer: DomSanitizer,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private acadKitService: AcademicKitService,
  ) {}

  ngOnInit() {
    this.isSaved = false;
    if (this.route && this.route.snapshot) {
      const params = this.route.snapshot.params;
      this.certiIssuenceId = params && params.id ? params.id : '';
    }
    this.getDataTemplate();
    this.subs.sink = this.certiDegreeService.getDropdownTemplate().subscribe((resp: any) => {
      this.templates = resp;
      this.templatesList = resp;
    });
    // this.subs.sink = this.certiDegreeService.getStatusCertiDegreet$.subscribe((resp) => {
    //   if (resp) {
    //     this.statusCertiDegree = resp;
    //     this.checkCurrentTab(resp);
    //   }
    // });
    this.subs.sink = this.certiDegreeService.getTemplateData$.subscribe((resp) => {
      if (resp) {
        this.templateSelected = resp;
        this.templateForm.setValue(resp.pdf_name);
      }
    });
    this.initForm();
  }

  initForm() {
    this.certificateForm = this.fb.group({
      _id: [''],
      rncp_id: [''],
      class_id: [''],
      current_tab: ['third'],
      certifier_school_id: [''],
      transcript_process_id: [''],
      certificate_type: this.fb.group({
        parchemin: this.fb.group({
          for_pass_student: [false],
          for_fail_student: [false],
          for_retake_student: [false],
        }),
        supplement_certificate: this.fb.group({
          for_pass_student: [false],
          for_fail_student: [false],
          is_enabled: [false],
          for_retake_student: [false],
        }),
        block_certificate: this.fb.group({
          for_pass_student: [false],
          for_fail_student: [false],
          is_enabled: [false],
          for_retake_student: [false],
        }),
      }),
      date_of_certificate_issuance: [''],
      certificate_template_selected_id: [null],
      certifier_signature: [null],
      certifier_stamp: [null],
      parchemin_certificate_background: [null],
      certificate_preview: [''],
    });
  }

  // Below is just to set a spinner condition for each picture while uploading
  setUploadLoading(type: string, state: boolean) {
    switch (type) {
      case 'signature':
        this.imageLoading.signature = state;
        break;
      case 'stamp':
        this.imageLoading.stamp = state;
        break;
      case 'background':
        this.imageLoading.background = state;
        break;
    }
  }

  imgURL(src: string) {
    const logo = src;
    const result = this.serverimgPath + logo;
    return this.sanitizer.bypassSecurityTrustStyle(`url(${result})`);
  }

  imgURLBG(src: string) {
    const logo = src;
    const result = this.serverimgPath + logo;
    this.parcheminUrl = this.sanitizer.bypassSecurityTrustResourceUrl(result);
  }

  imgSrc(src: string) {
    const logo = src;
    const result = this.serverimgPath + logo;
    return result;
  }

  previewURL(src) {
    const ur = 'https://drive.google.com/viewerng/viewer?embedded=true&url=' + this.serverimgPath + src + '#toolbar=0&scrollbar=0';

    return this.sanitizer.bypassSecurityTrustStyle(`url(${ur})`);
  }

  onPictureSelect(fileInput: Event, type: string) {

    const file = (<HTMLInputElement>fileInput.target).files[0];
    this.setUploadLoading(type, true);
    if ((file && file.type === 'image/png') || (file && file.type === 'image/jpeg')) {
      this.subs.sink = this.fileUploadService.singleUpload(file).subscribe(
        (resp) => {
          this.setUploadLoading(type, false);
          if (resp) {
            switch (type) {
              case 'signature':
                this.signaturUrl = resp.s3_file_name;
                this.createAcadDoc(resp, 'CertiDegreeSignature');
                break;
              case 'stamp':
                this.stampUrl = resp.s3_file_name;
                this.createAcadDoc(resp, 'CertiDegreeStamp');
                break;
              case 'background':
                this.backgroundUrl = resp.s3_file_name;
                this.createAcadDoc(resp, 'CertiDegreeBackground');
                break;
            }
          }
        },
        (err) => {
          this.setUploadLoading(type, false);
          Swal.fire({
            type: 'error',
            title: 'Error !',
            confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
          }).then((res) => {

            this.authService.postErrorLog(err);
          });
        },
      );
    } else {
      this.setUploadLoading(type, false);
    }
    this.resetImageUpload(type);
  }

  resetImageUpload(type) {
    switch (type) {
      case 'signature':
        this.fileUpload1.nativeElement.value = '';
        break;
      case 'stamp':
        this.fileUpload2.nativeElement.value = '';
        break;
      case 'background':
        this.fileUpload3.nativeElement.value = '';
        break;
    }
  }

  nextStep() {
    if (!this.isShowUploadField && this.detailDegree.current_tab === 'second') {
      this.saveFirstTimeNotTemplateA();
    } else {
      this.certiDegreeService.setCurrentTabDetail('third');
    }
  }

  saveStep() {
    this.isWaitingForResponse = true;
    this.isSaved = true;
    const payload = _.cloneDeep(this.certificateForm.value);
    if (this.statusCertiDegree === 'second') {
      payload.current_tab = 'third';
    }

    this.subs.sink = this.certiDegreeService.updateCertificateIssuanceProcess(this.certiIssuenceId, payload).subscribe((resp) => {
      if (resp) {
        this.isWaitingForResponse = false;
        Swal.fire({
          type: 'success',
          title: 'Bravo',
        });
        this.getCertificateData();
        if (this.statusCertiDegree === 'second') {
          this.certiDegreeService.setStatusCertiDegree('third');
        }
      }
    });
  }

  checkCurrentTab(status) {
    if (!this.statusPreviewList.includes(status)) {
      this.validateContinueButton = true;
    }
  }

  selectTemplate(template) {

    if (template) {
      if (this.isShowUploadField) {
        this.checkAllImageUploaded();
      } else {
        this.alreadyUploadAllImage = true;
      }
      this.templateSelected = template;
      if (template.s3_template) {
        this.imgURLBG(template.s3_template);
        this.certificateForm.get('certificate_preview').setValue(template.s3_template);
      }
      this.certiDegreeService.setTemplateData(template);
    }
  }

  getDataTemplate() {
    this.isWaitingForResponse = true;
    this.subs.sink = this.certiDegreeService.getAllPDFTemplates().subscribe(
      (resp) => {
        if (resp && resp.length) {
          resp.sort((a, b) => (a.pdf_name > b.pdf_name ? 1 : b.pdf_name > a.pdf_name ? -1 : 0));
          this.templateData = resp;

          if (this.certiIssuenceId) {
            this.getCertificateData();
          }
        } else {
          if (this.certiIssuenceId) {
            this.getCertificateData();
          }
        }
      },
      (err) => {
        this.authService.postErrorLog(err);
        if (this.certiIssuenceId) {
          this.getCertificateData();
        }
      },
    );
  }

  getCertificateData() {

    this.subs.sink = this.certiDegreeService.getOneCertificateIssuanceProcess(this.certiIssuenceId).subscribe((resp) => {
      if (resp) {
        this.isWaitingForResponse = false;
        this.detailDegree = resp;

        if (resp.current_tab) {
          this.statusCertiDegree = resp.current_tab;
          this.checkCurrentTab(this.statusCertiDegree);
        }
        this.patchValue(resp);
      }
    });
  }

  checkCertificateIssueance(title) {
    this.subs.sink = this.certiDegreeService.checkCertificateIssuanceTemplateForCertifier(title).subscribe((list) => {

      if (list) {
        if (list.toShowUploadField) {
          // ************** Check this template from template A or not
          if (list.pdf_template_id === '60e537a477c41d22e82cb979') {
            this.isShowUploadField = false;
          } else {
            this.isShowUploadField = list.toShowUploadField;
          }
        } else {
          this.isShowUploadField = list.toShowUploadField;
        }
        if (this.templateData && this.templateData.length) {
          if (list.pdf_template_id) {
            const dataTemplate = this.templateData.find((temp) => temp._id === list.pdf_template_id);
            if (dataTemplate) {
              this.certificateForm.get('certificate_template_selected_id').setValue(dataTemplate._id);
              this.templateSelected = dataTemplate;
              this.selectTemplate(dataTemplate);
            } else {
              const templateG = this.templateData.find((temp) => temp._id === '60f541d5a577cc2cfc48bf5c');
              this.certificateForm.get('certificate_template_selected_id').setValue(templateG._id);
              this.templateSelected = templateG;
              this.selectTemplate(templateG);
            }
          }
        }
      }
    });
  }

  patchValue(resp) {
    const payload = _.cloneDeep(resp);
    if (payload.class_id && payload.class_id._id) {
      payload.class_id = payload.class_id._id;
    }
    if (payload.rncp_id && payload.rncp_id._id) {
      payload.rncp_id = payload.rncp_id._id;
    }
    if (payload.certifier_school_id && payload.certifier_school_id._id) {
      payload.certifier_school_id = payload.certifier_school_id._id;
    }
    if (payload.transcript_process_id && payload.transcript_process_id._id) {
      payload.transcript_process_id = payload.transcript_process_id._id;
    }
    if (payload.certifier_signature && payload.certifier_signature._id) {
      this.signaturUrl = payload.certifier_signature.s3_file_name;
      payload.certifier_signature = payload.certifier_signature._id;
    } else {
      delete payload.certifier_signature;
    }
    if (payload.certifier_stamp && payload.certifier_stamp._id) {
      this.stampUrl = payload.certifier_stamp.s3_file_name;
      payload.certifier_stamp = payload.certifier_stamp._id;
    } else {
      delete payload.certifier_stamp;
    }
    if (payload.parchemin_certificate_background && payload.parchemin_certificate_background._id) {
      this.backgroundUrl = payload.parchemin_certificate_background.s3_file_name;
      payload.parchemin_certificate_background = payload.parchemin_certificate_background._id;
    } else {
      delete payload.parchemin_certificate_background;
    }
    this.certificateForm.patchValue(payload);
    this.originDataForm = this.certificateForm.value;
    if (payload.certificate_preview) {
      this.imgURLBG(payload.certificate_preview);
    }

    if (this.templateData && this.templateData.length) {
      if (payload.certificate_template_selected_id) {
        const dataTemp = _.cloneDeep(this.templateData);
        const dataTemplate = dataTemp.find((temp) => temp._id === payload.certificate_template_selected_id);
        this.templateSelected = dataTemplate;
      }
    }
    if (resp.rncp_id && resp.rncp_id._id) {
      this.checkCertificateIssueance(resp.rncp_id._id);
    }
  }

  formatTemplateName() {
    let name = '';
    if (this.templateData && this.templateData.length) {
      if (this.certificateForm.get('certificate_template_selected_id').value) {
        const dataTemp = _.cloneDeep(this.templateData);
        const dataTemplate = dataTemp.find((temp) => temp._id === this.certificateForm.get('certificate_template_selected_id').value);
        if (dataTemplate && dataTemplate.pdf_name) {
          name = dataTemplate.pdf_name.replace('Template', '');
        }
      }
    }
    return name;
  }

  createAcadDoc(resp, type) {
    // call mutation create acad doc
    const payload = {
      document_name: resp.s3_file_name,
      type_of_document: type,
      document_generation_type: type,
      s3_file_name: resp.s3_file_name,
      parent_rncp_title: this.certificateForm.get('rncp_id').value,
    };
    this.subs.sink = this.acadKitService.createAcadDoc(payload).subscribe((response) => {
      if (response) {
        switch (type) {
          case 'CertiDegreeSignature':
            this.certificateForm.get('certifier_signature').setValue(response._id);
            this.certificateForm.get('certifier_signature').markAsTouched();
            break;
          case 'CertiDegreeStamp':
            this.certificateForm.get('certifier_stamp').setValue(response._id);
            this.certificateForm.get('certifier_stamp').markAsTouched();
            break;
          case 'CertiDegreeBackground':
            this.certificateForm.get('parchemin_certificate_background').setValue(response._id);
            this.certificateForm.get('parchemin_certificate_background').markAsTouched();
            break;
        }
        this.checkAllImageUploaded();
      }
    });
  }

  checkAllImageUploaded() {
    this.alreadyUploadAllImage = false;
    const signature = this.certificateForm.get('certifier_signature').value;
    const signatureStamp = this.certificateForm.get('certifier_stamp').value;
    const signatureBackground = this.certificateForm.get('parchemin_certificate_background').value;
    if (signature && signatureStamp && signatureBackground) {
      this.alreadyUploadAllImage = true;
    } else {
      this.alreadyUploadAllImage = false;
    }

  }

  leaveDetails() {
    this.router.navigate(['certidegree']);
  }

  saveFirstTimeNotTemplateA() {
    const payload = _.cloneDeep(this.certificateForm.value);
    if (this.statusCertiDegree === 'second') {
      payload.current_tab = 'third';
    }
    this.subs.sink = this.certiDegreeService.updateCertificateIssuanceProcess(this.certiIssuenceId, payload).subscribe((resp) => {
      if (resp) {
        this.isWaitingForResponse = false;
        Swal.fire({
          type: 'success',
          title: 'Bravo',
        }).then((res) => {
          this.certiDegreeService.setStatusCertiDegree('third');
          this.certiDegreeService.setCurrentTabDetail('third');
        });
      }
    });
  }

  checkComparison(): boolean {
    // ************* Check the comparison of the files. return true if there is a changes, return false if there is no changes.
    if (this.originDataForm) {
      if (this.isShowUploadField) {
        const originData = {
          signature: this.originDataForm.certifier_signature,
          signatureStamp: this.originDataForm.certifier_stamp,
          signatureBackground: this.originDataForm.parchemin_certificate_background,
        };
        const formData = {
          signature: this.certificateForm.get('certifier_signature').value,
          signatureStamp: this.certificateForm.get('certifier_stamp').value,
          signatureBackground: this.certificateForm.get('parchemin_certificate_background').value,
        };
        if (JSON.stringify(originData) === JSON.stringify(formData)) {
          this.certiDegreeService.childrenFormValidationStatus = true;
          return false;
        } else {

          this.certiDegreeService.childrenFormValidationStatus = false;
          return true;
        }
      } else {
        this.isSaved = true;
        this.validateContinueButton = true;
        this.certiDegreeService.childrenFormValidationStatus = true;
        return true;
      }
    }
  }

  isAllowContinue() {
    if (this.isShowUploadField) {
      if ((this.isSaved || this.validateContinueButton) && this.alreadyUploadAllImage && !this.checkComparison()) {
        return true;
      } else {
        return false;
      }
    } else {
      return true;
    }
  }

  goBack() {
    if (!this.certiDegreeService.childrenFormValidationStatus) {
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
          return;
        } else {
          this.certiDegreeService.childrenFormValidationStatus = true;
          this.certiDegreeService.setCurrentTabDetail('first');
        }
      });
    } else {
      this.certiDegreeService.setCurrentTabDetail('first');
    }
  }
}
