import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { CertidegreeService } from 'app/service/certidegree/certidegree.service';
import { SubSink } from 'subsink';
import { ApplicationUrls } from 'app/shared/settings';
import Swal from 'sweetalert2';
import { DomSanitizer } from '@angular/platform-browser';
import * as _ from 'lodash';
import { environment } from 'environments/environment';
import { AuthService } from 'app/service/auth-service/auth.service';

@Component({
  selector: 'ms-certificate-details-preview',
  templateUrl: './certificate-details-preview.component.html',
  styleUrls: ['./certificate-details-preview.component.scss'],
})
export class CertificateDetailsPreviewComponent implements OnInit {
  private subs = new SubSink();
  statusCertiDegree = 'initial';
  validateContinueButton = false;
  dataTemplate: any;
  certiIssuenceId: any;
  certificateForm: UntypedFormGroup;

  isWaitingForResponse = false;
  templateSelected: any;
  signaturUrl: any;
  stampUrl: any;
  backgroundUrl: any;
  parcheminUrl;
  parcheminDownloadUrl;
  pdfParchemint;
  serverimgPath = `${ApplicationUrls.baseApi}/fileuploads/`.replace('/graphql', '');

  constructor(
    private certiDegreeService: CertidegreeService,
    public translate: TranslateService,
    private router: Router,
    private route: ActivatedRoute,
    private fb: UntypedFormBuilder,
    private authService: AuthService,
    private sanitizer: DomSanitizer,
  ) {}

  ngOnInit() {
    if (this.route && this.route.snapshot) {
      const params = this.route.snapshot.params;
      this.certiIssuenceId = params && params.id ? params.id : '';
    }
    this.getDataTemplate();
    // this.subs.sink = this.certiDegreeService.getStatusCertiDegreet$.subscribe((resp) => {
    //   if (resp) {
    //     this.statusCertiDegree = resp;
    //     this.checkCurrentTab(resp);
    //   }
    // });
    this.subs.sink = this.certiDegreeService.getTemplateData$.subscribe((resp) => {
      if (resp) {
        this.dataTemplate = resp;
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

  getParcheminTemplate(resp) {
    this.isWaitingForResponse = true;
    const is_preview = true;
    this.subs.sink = this.certiDegreeService
      .generateParcheminCertificatePreview(this.certiIssuenceId, resp.rncp_id._id, resp.class_id._id, is_preview)
      .subscribe((list) => {
        this.isWaitingForResponse = false;
        if (list) {
          this.pdfParchemint = list;
          this.imgURLBG(list);
        }
      });
  }

  getDataTemplate() {
    this.isWaitingForResponse = true;
    this.subs.sink = this.certiDegreeService.getAllPDFTemplates().subscribe(
      (resp) => {
        if (resp && resp.length) {
          resp.sort((a, b) => (a.pdf_name > b.pdf_name ? 1 : b.pdf_name > a.pdf_name ? -1 : 0));
          this.dataTemplate = resp;

          this.getCertificateData();
        }
      },
      (err) => {
        this.getCertificateData();
        this.authService.postErrorLog(err);
      },
    );
  }

  getCertificateData() {
    this.isWaitingForResponse = true;

    this.subs.sink = this.certiDegreeService.getOneCertificateIssuanceProcess(this.certiIssuenceId).subscribe((resp) => {
      if (resp) {

        if (resp.current_tab) {
          this.statusCertiDegree = resp.current_tab;
          this.checkCurrentTab(this.statusCertiDegree);
        }
        if (resp.class_id && resp.class_id._id && resp.rncp_id && resp.rncp_id._id) {
          this.getParcheminTemplate(resp);
        } else {
          this.isWaitingForResponse = false;
        }
        this.patchValue(resp);
      }
    });
  }

  openPDFParchemint() {
    const a = document.createElement('a');
    a.target = 'blank';
    a.href = `${this.parcheminDownloadUrl}?download=true`.replace('/graphql', '');
    a.click();
    a.remove();
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
    if (payload.certificate_template_selected_id) {
      if (this.dataTemplate && this.dataTemplate.length) {
        const dataTemp = _.cloneDeep(this.dataTemplate);
        const dataTemplate = dataTemp.find((temp) => temp._id === payload.certificate_template_selected_id);
        this.templateSelected = dataTemplate;
        if (this.templateSelected && this.templateSelected.pdf_name) {
          this.templateSelected.pdf_name = this.templateSelected.pdf_name.replace('Template', '');
        }
      }
    }
    this.certificateForm.patchValue(payload);

  }

  imgURLBG(src: string) {
    const logo = src;
    const result = this.serverimgPath + logo;
    this.parcheminDownloadUrl = result;
    this.parcheminUrl = this.sanitizer.bypassSecurityTrustResourceUrl(result);
  }

  nextStep() {
    if (this.statusCertiDegree === 'fourth') {
      this.certiDegreeService.setCurrentTabDetail('fourth');
      this.certiDegreeService.setStatusCertiDegree('fourth');
    } else {
      let timeDisabled = 5;
      Swal.fire({
        title: this.translate.instant('CERT_S11.Title'),
        html: this.translate.instant('CERT_S11.Text'),
        type: 'warning',
        allowEscapeKey: true,
        showCancelButton: true,
        confirmButtonText: this.translate.instant('CERT_S11.BUTTON1'),
        cancelButtonText: this.translate.instant('CERT_S11.BUTTON2'),
        onOpen: () => {
          Swal.disableConfirmButton();
          const confirmBtnRef = Swal.getConfirmButton();
          const time = setInterval(() => {
            timeDisabled -= 1;
            confirmBtnRef.innerText = this.translate.instant('CERT_S11.BUTTON1') + ` (${timeDisabled})`;
          }, 1000);

          setTimeout(() => {
            confirmBtnRef.innerText = this.translate.instant('CERT_S11.BUTTON1');
            Swal.enableConfirmButton();
            clearTimeout(time);
          }, timeDisabled * 1000);
        },
      }).then((result) => {
        if (result.value) {
          this.isWaitingForResponse = true;
          const payload = this.certificateForm.value;
          const is_preview = false;

          this.subs.sink = this.certiDegreeService
            .generateParcheminCertificatePreview(this.certiIssuenceId, payload.rncp_id, payload.class_id, is_preview)
            .subscribe(
              (resp) => {
                if (resp) {
                  this.isWaitingForResponse = false;
                  // this.isWaitingForResponse = true;
                    const payloads = _.cloneDeep(this.certificateForm.value);
                    if (this.statusCertiDegree === 'third') {
                      payloads.current_tab = 'fourth';
                    }
                    this.isWaitingForResponse = true;
                    this.subs.sink = this.certiDegreeService
                      .updateCertificateIssuanceProcess(this.certiIssuenceId, payloads)
                      .subscribe((ressp) => {
                        this.isWaitingForResponse = false;
                        if (ressp) {
                          Swal.fire({
                            type: 'success',
                            title: this.translate.instant('CERT_S12.Title'),
                            html: this.translate.instant('CERT_S12.Text'),
                            confirmButtonText: this.translate.instant('CERT_S12.BUTTON'),
                          }).then(res => {
                            this.router.navigate(['/certidegree']);
                          })
                        }
                      });
                } else {
                  this.isWaitingForResponse = false;
                  return;
                }
              },
              (err) => {
                this.isWaitingForResponse = false;
                this.authService.postErrorLog(err);
                console.error(err);
              },
            );
        }
      });
    }
  }

  checkCurrentTab(status) {
    if (status === 'fourth') {
      this.validateContinueButton = true;
    }
  }

  leaveDetails() {
    this.router.navigate(['certidegree']);
  }

  goBack() {
    this.certiDegreeService.setCurrentTabDetail('second');
  }
}
