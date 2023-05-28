import { Component, OnInit, Input, OnDestroy, ElementRef, ViewChildren, QueryList } from '@angular/core';
import { MatDialog, MatDialogRef, MatDialogConfig } from '@angular/material/dialog';
import { TextDialogComponent } from 'app/text-dialog/text-dialog.component';
import { UploadDocumentComponent } from 'app/upload-document/upload-document.component';
import Swal from 'sweetalert2';
import { TranslateService } from '@ngx-translate/core';
import { CertificationRuleService } from 'app/service/certification-rule/certification-rule.service';
import { CertificationRuleInput, CertificationRuleDocuments } from './certification-rule.model';
import { CertificationRulePopUpComponent } from './certification-rule-pop-up/certification-rule-pop-up.component';

import * as DecoupledEditor from 'assets/ckeditor5-custom/ckeditor.js';
import { SubSink } from 'subsink';
import { Observable } from 'apollo-link';
import { PRINTSTYLES } from 'assets/scss/theme/doc-style';
import { TranscriptBuilderService } from 'app/service/transcript-builder/transcript-builder.service';
import { environment } from 'environments/environment.dev';
import { STYLE } from '../class-condition/score/second-step-score/condition-score-preview/pdf-styles';
import { PreviewCertificationRuleDialogComponent } from './preview-certification-rule-dialog/preview-certification-rule-dialog.component';
import { SendCertificationRuleToSchoolDialogComponent } from '../class-parameter/pc-certification-tabs/send-certification-rule-to-school-dialog/send-certification-rule-to-school-dialog.component';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CoreService } from 'app/service/core/core.service';
import * as _ from 'lodash';
import { UtilityService } from 'app/service/utility/utility.service';
import { FileUploadService } from 'app/service/file-upload/file-upload.service';
import { ApplicationUrls } from 'app/shared/settings';

@Component({
  selector: 'ms-certification-rule',
  templateUrl: './certification-rule.component.html',
  styleUrls: ['./certification-rule.component.scss'],
})
export class CertificationRuleComponent implements OnInit, OnDestroy {
  private subs = new SubSink();
  @Input() selectedRncpTitleId: string;
  @Input() selectedRncpTitleName: string;
  @Input() selectedRncpTitleLongName: string;
  @Input() selectedClassId: string;
  @Input() selectedClassName: string;
  @ViewChildren('certificationPanel') certificationPanel: QueryList<ElementRef>;

  textDialog: MatDialogRef<TextDialogComponent>;
  config: MatDialogConfig = {
    disableClose: true,
  };

  isWaitingForResponse = false;

  certRuleId: string;
  titleText: string;
  messageText: string;
  documentPagesRefForCertificationRule: ElementRef;
  uploadedDoc: any[] = [];
  isUploadingFile = false;
  initialForm = [];

  // ckeditor configuration
  public Editor = DecoupledEditor;

  public editorConfig = {
    toolbar: ['heading', 'bold', 'italic', 'underline', 'strikethrough', 'numberedList', 'bulletedList', 'undo', 'redo'],
    height: '20rem',
  };
  
  responsableExist = false;
  textColor = 'white';
  buttonColor = '#424242';
  private timeOutVal: any;

  public onReady(editor) {



    editor.ui.getEditableElement().parentElement.insertBefore(editor.ui.view.toolbar.element, editor.ui.getEditableElement());
  }

  titleTextTemp;
  messageTextTemp;

  certificationRuleForm;
  certifications: any[];
  isPreviewDisabled: boolean = true;

  constructor(
    private dialog: MatDialog,
    public translate: TranslateService,
    public certificationRuleService: CertificationRuleService,
    private transcriptBuilderService: TranscriptBuilderService,
    private fb: FormBuilder,
    public coreService: CoreService,
    private utilService: UtilityService,
    private fileUploadService: FileUploadService,
  ) {}

  ngOnInit() {
    this.initCertificationRuleForm();
    this.getCertificationRule();
  }

  initCertificationRuleForm() {
    this.certificationRuleForm = this.fb.group({
      title_id: [this.selectedRncpTitleId],
      class_id: [this.selectedClassId],
      certifications: this.fb.array([]),
    });
  }

  generateCertificationForm() {
    return this.fb.group({
      _id: [null],
      name: [null, Validators.required],
      header: [null, Validators.required],
      is_published: [false],
      document: this.fb.group({
        document_name: [null, Validators.required],
        s3_file_name: [null, Validators.required],
        file_path: [null, Validators.required],
      })
    });
  }

  isFormChanged() {
    const initialForm = _.cloneDeep(this.initialForm);
    const currentForm = _.cloneDeep(this.certificationRuleForm.value);
    const isEqualForm = _.isEqual(initialForm, currentForm);
    return isEqualForm;
  }

  pushCertificationForm(firstLanding?: boolean) {
    this.certificationsArrayForm.push(this.generateCertificationForm());

    setTimeout(() => {
      if (this.certificationPanel && this.certificationPanel.length && !firstLanding) {
        this.certificationPanel.toArray()[this.certificationPanel.length - 1].nativeElement.scrollIntoView({ behavior: 'smooth' });
      }
    }, 500);
  }

  get certificationsArrayForm() {
    return this.certificationRuleForm.get('certifications') as FormArray;
  }

  addCertification(firstLanding?) {
    this.certificationsArrayForm.push(this.generateCertificationForm());
    setTimeout(() => {
      if (this.certificationPanel && this.certificationPanel.length && !firstLanding) {
        this.certificationPanel.toArray()[this.certificationPanel.length - 1].nativeElement.scrollIntoView({ behavior: 'smooth' });
      }
    }, 500);
  }

  deleteCertification(certificationIndex) {
    let timeout = 2;
    let confirmInterval;
    const sectionName = this.certificationsArrayForm.at(certificationIndex).get('name').value;
    const idCertification = this.certificationsArrayForm.at(certificationIndex).get('_id').value;

    if(idCertification || sectionName){
      Swal.fire({
        type: 'warning',
        title: this.translate.instant('Deletesection_Student_S1.TITLE', { SectionName: sectionName ? sectionName : '' }),
        html: this.translate.instant('Deletesection_Student_S1.TEXT', { SectionName: sectionName ? sectionName : '' }),
        confirmButtonText: this.translate.instant('Deletesection_Student_S1.BUTTON1') + ` (${timeout})`,
        cancelButtonText: this.translate.instant('Deletesection_Student_S1.BUTTON2'),
        showCancelButton: true,
        onOpen: () => {
          timeout--;
          Swal.disableConfirmButton();
          const confirmButtonRef = Swal.getConfirmButton();
          confirmInterval = setInterval(() => {
            if (timeout > 0) {
              confirmButtonRef.innerText = this.translate.instant('Deletesection_Student_S1.BUTTON1') + ` (${timeout})`;
              timeout--;
            } else {
              Swal.enableConfirmButton();
              confirmButtonRef.innerText = this.translate.instant('Deletesection_Student_S1.BUTTON1');
              clearInterval(confirmInterval);
            }
          }, 1000);
        },
      }).then((result) => {
        if(result.value) {
          this.isWaitingForResponse = true;
          if(idCertification){
            this.subs.sink = this.certificationRuleService.deleteCertificationRuleForPC(idCertification).subscribe(
              (resp) => {
              if(resp) {
                this.isWaitingForResponse = false;
                Swal.fire({
                  type: 'success',
                  title: 'Bravo',
                  confirmButtonText: this.translate.instant('OK'),
                }).then(() => {
                  this.getCertificationRule();
                });
              }
            },
              (err) => {
                this.isWaitingForResponse = false;
                Swal.fire({
                  type: 'error',
                  title: 'Error !',
                  confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
                });
              },
            )
          } else {
            this.isWaitingForResponse = false;
            Swal.fire({
              type: 'success',
              title: 'Bravo',
              confirmButtonText: this.translate.instant('OK'),
            }).then(() => {
              this.certificationsArrayForm.removeAt(certificationIndex);
            });
          }
        }
      });
    } else {
      this.isWaitingForResponse = false;
      this.certificationsArrayForm.removeAt(certificationIndex);
    }    
  }

  getCertificationRule() {
    this.isWaitingForResponse = true;
    this.certificationsArrayForm.clear();

    const filter = {
      rncp_id: this.selectedRncpTitleId,
      class_id: this.selectedClassId,
      is_for_preparation_center: false
    }

    this.subs.sink = this.certificationRuleService.getAllCertificationRules(filter).subscribe(
      (resp) => {
        if (resp && resp.length) {
          this.certifications = _.cloneDeep(resp);
          const certificationData = [];
          
          this.certifications.forEach(cert => {
            if (cert.is_published) this.isPreviewDisabled = false;
            
            certificationData.push({
              _id: cert._id,
              name: cert.name,
              header: cert.header,
              is_published: cert.is_published,
              document: {
                document_name: cert.documents[0].document_name,
                file_path: cert.documents[0].file_path,
                s3_file_name: cert.documents[0].s3_file_name
              }
            });

            this.isWaitingForResponse = false;
            this.pushCertificationForm(true);
          });

          this.certificationsArrayForm.patchValue(certificationData);
          this.initialForm = this.certificationRuleForm.value;
        } else {
          this.isWaitingForResponse = false;
          this.pushCertificationForm(true);
        }
      },
      (err) => {
        this.isWaitingForResponse = false;
        Swal.fire({
          type: 'error',
          title: 'Error',
          text: err && err['message'] ? err['message'] : err,
          confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
        });
      });
  }

  isPublishedDocument(certificationIndex?: number) {
    let findPublished;

    this.certificationsArrayForm.controls.find((control, index) => {
      if(control.get('is_published').value) {
        return findPublished = {published: true, certifIndex: index}
      }
    });

    if(findPublished?.published) {
      if(findPublished?.certifIndex === certificationIndex) {
        return true;
      } else {
        return false;
      }
    } else {
      return true;
    }
  }

  addTitleText() {
    this.subs.sink = this.dialog
      .open(TextDialogComponent, {
        ...this.config,
        data: { textInput: this.titleText, type: 'title' },
      })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          this.titleText = result;
          this.certificationRuleService.setDataCertificationChanged(true);
        }
      });
  }

  addMessageText() {
    this.subs.sink = this.dialog
      .open(TextDialogComponent, {
        ...this.config,
        data: { textInput: this.messageText, type: 'message' },
      })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          this.messageText = result;
          this.certificationRuleService.setDataCertificationChanged(true);
        }
      });
  }

  addDocument() {
    this.subs.sink = this.dialog
      .open(UploadDocumentComponent, {
        width: '500px',
      })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          this.certificationRuleService.setDataCertificationChanged(true);
          this.uploadedDoc.push({
            s3_file_name: result.s3_file_name,
            file_path: result.fileUrl,
            document_name: result.fileName,
          });
        }
      });
  }

  isKeyup() {
    this.certificationRuleService.setDataCertificationChanged(true);
  }

  removeDocument(doc: any, index: number) {
    let timeDisabled = 5;
    Swal.fire({
      title: this.translate.instant('CERTIFICATION_RULE.DELETE_DOCUMENT.TITLE'),
      html: this.translate.instant('CERTIFICATION_RULE.DELETE_DOCUMENT.TEXT', { DocumentName: doc.s3_file_name }),
      footer: `<span style="margin-left: auto">CERTIFICATION_RULE.DELETE_DOCUMENT</span>`,
      type: 'warning',
      allowEscapeKey: true,
      showCancelButton: true,
      confirmButtonText: this.translate.instant('THUMBSUP.SWEET_ALERT.CONFIRM', { timer: timeDisabled }),
      cancelButtonText: this.translate.instant('DASHBOARD_DELETE.NO'),
      allowOutsideClick: false,
      allowEnterKey: false,
      onOpen: () => {
        Swal.disableConfirmButton();
        const confirmBtnRef = Swal.getConfirmButton();
        const intVal = setInterval(() => {
          timeDisabled -= 1;
          confirmBtnRef.innerText = this.translate.instant('DELETE_ITEM_TEMPLATE.BUTTON_1') + ` (${timeDisabled})`;
        }, 1000);

        this.timeOutVal = setTimeout(() => {
          confirmBtnRef.innerText = this.translate.instant('DELETE_ITEM_TEMPLATE.BUTTON_1');
          Swal.enableConfirmButton();
          clearInterval(intVal);
          clearTimeout(this.timeOutVal);
        }, timeDisabled * 1000);
      },
    }).then((res) => {
      clearTimeout(this.timeOutVal);
      if (res.value) {
        Swal.fire({
          type: 'success',
          title: this.translate.instant('CERTIFICATION_RULE.RULES_S7.TITLE'),
          html: this.translate.instant('CERTIFICATION_RULE.RULES_S7.TEXT', {documentName: this.uploadedDoc[index].document_name}),
          footer: `<span style="margin-left: auto">CERTIFICATION_RULE.RULES_S7</span>`,
          confirmButtonText: this.translate.instant('CERTIFICATION_RULE.RULES_S7.BUTTON_1'),
        });
      }
      this.uploadedDoc.splice(index, 1);
    });
  }

  downloadPDF() {
    this.uploadedDoc.forEach((doc) => {
      const element = document.createElement('a');
      element.href = doc.file_path;
      element.target = '_blank';
      element.setAttribute('download', doc.s3_file_name);
      element.click();
    });
  }

  onAddDocument(event, certificationIndex) {
    const acceptable = ['pdf'];
    const file = event.target.files[0];
    const fileType = this.utilService.getFileExtension(file.name).toLocaleLowerCase();
    this.isUploadingFile = true;
    if (acceptable.includes(fileType)) {
      this.subs.sink = this.fileUploadService.singleUpload(file).subscribe(
        (resp) => {
          if (resp) {
            this.isUploadingFile = false;
            Swal.fire({
              type: 'success',
              title: this.translate.instant('Docupload_S1.TITLE'),
              html: this.translate.instant('Docupload_S1.TEXT'),
              confirmButtonText: this.translate.instant('Docupload_S1.BUTTON1'),
            }).then(() => {
              this.certificationsArrayForm.at(certificationIndex).get('document').get('document_name').setValue(resp.file_name);
              this.certificationsArrayForm.at(certificationIndex).get('document').get('s3_file_name').setValue(resp.s3_file_name);
              this.certificationsArrayForm.at(certificationIndex).get('document').get('file_path').setValue(resp.file_url);
            });
          }
        },
        (err) => {
          Swal.fire({
            type: 'error',
            title: 'Error !',
            confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
          }).then((res) => {
            console.log('[BE Message] Error is : ', err);
          });
        },
      );
    } else {
      this.isUploadingFile = false;
      Swal.fire({
        type: 'info',
        title: this.translate.instant('Adddocument_S1.TITLE'),
        confirmButtonText: this.translate.instant('Adddocument_S1.BUTTON'),
      })
    }
  }

  viewDocument(certificationIndex) {
    const s3file = this.certificationsArrayForm.at(certificationIndex).get('document').get('s3_file_name').value;
    const url = ApplicationUrls.baseApi.replace('graphql', 'fileuploads/') + s3file;
    window.open(url, '_blank');
  }

    deleteDocument(certificationIndex) {
    const documentName = this.certificationsArrayForm.at(certificationIndex).get('document').get('document_name').value;
    let timeout = 2;
    let confirmInterval;

    Swal.fire({
      type: 'warning',
      title: this.translate.instant('CERTIFICATIONRULE.Docupload_S2.TITLE'),
      html: this.translate.instant('CERTIFICATIONRULE.Docupload_S2.TEXT', { DocumentName: documentName }),
      confirmButtonText: this.translate.instant('CERTIFICATIONRULE.Docupload_S2.BUTTON1') + ` (${timeout})`,
      cancelButtonText: this.translate.instant('CERTIFICATIONRULE.Docupload_S2.BUTTON2'),
      showCancelButton: true,
      onOpen: () => {
        timeout--;
        Swal.disableConfirmButton();
        const confirmButtonRef = Swal.getConfirmButton();
        confirmInterval = setInterval(() => {
          if (timeout > 0) {
            confirmButtonRef.innerText = this.translate.instant('CERTIFICATIONRULE.Docupload_S2.BUTTON1') + ` (${timeout})`;
            timeout--;
          } else {
            Swal.enableConfirmButton();
            confirmButtonRef.innerText = this.translate.instant('CERTIFICATIONRULE.Docupload_S2.BUTTON1');
            clearInterval(confirmInterval);
          }
        }, 1000);
      },
    }).then((result) => {
      clearInterval(confirmInterval);
      if (result.value) {
        Swal.fire({
          type: 'success',
          title: 'Bravo',
          confirmButtonText: this.translate.instant('OK'),
        }).then(() => {
          this.certificationsArrayForm.at(certificationIndex).get('document').get('document_name').setValue(null);
          this.certificationsArrayForm.at(certificationIndex).get('document').get('s3_file_name').setValue(null);  
          this.certificationsArrayForm.at(certificationIndex).get('document').get('file_path').setValue(null);  
        });
      }
    });
  }

  save() {
    const payload: CertificationRuleInput = {
      title: this.titleText,
      message: this.messageText,
      documents: this.uploadedDoc,
      rncp_id: this.selectedRncpTitleId,
      class_id: this.selectedClassId,
    };

    if (this.certRuleId) {
      this.certificationRuleService.setDataCertificationStatus(true);
      this.subs.sink = this.certificationRuleService.updateCertificationRule(this.certRuleId, payload).subscribe((resp) => {
        this.certificationRuleService.setDataCertificationChanged(false);
        this.showSaveSuccessSwal();
      });
    } else {
      this.certificationRuleService.setDataCertificationStatus(true);
      this.subs.sink = this.certificationRuleService.createCertificationRule(payload).subscribe((resp) => {
        this.certificationRuleService.setDataCertificationChanged(false);
        this.showSaveSuccessSwal();
      });
    }
  }

  showSaveSuccessSwal() {
    Swal.fire({
      type: 'success',
      title: this.translate.instant('CERTIFICATION_RULE.AFTERSAVE.TITLE'),
      footer: `<span style="margin-left: auto">CERTIFICATION_RULE.AFTERSAVE</span>`,
      html: this.translate.instant('CERTIFICATION_RULE.AFTERSAVE.TEXT', { RNCPTitle: this.selectedRncpTitleName }),
    });
  }

  send() {
    let payload: any;
    if (this.certRuleId) {
      payload = {
        certification_rule_id: this.certRuleId,
        title: this.titleText,
        message: this.messageText,
        status: 'active',
        documents: this.uploadedDoc,
        rncp_id: this.selectedRncpTitleId,
        class_id: this.selectedClassId,
      };
    } else {
      payload = {
        certification_rule_id: this.certRuleId,
        title: this.titleText,
        message: this.messageText,
        status: 'active',
        documents: this.uploadedDoc,
        rncp_id: this.selectedRncpTitleId,
        class_id: this.selectedClassId,
      };
    }
    Swal.fire({
      type: 'warning',
      title: this.translate.instant('CERTIFICATION_RULE.SEND_CONFIRMATION.TITLE'),
      html: this.translate.instant('CERTIFICATION_RULE.SEND_CONFIRMATION.TEXT', {
        RNCPTitle: this.selectedRncpTitleName,
        class: this.selectedClassName,
      }),
      footer: `<span style="margin-left: auto">CERTIFICATION_RULE.SEND_CONFIRMATION</span>`,
      confirmButtonText: this.translate.instant('CERTIFICATION_RULE.SEND_CONFIRMATION.CONFIRMBTN'),
      showCancelButton: true,
      cancelButtonText: this.translate.instant('CERTIFICATION_RULE.SEND_CONFIRMATION.CANCELBTN'),
    }).then((result) => {
      if (result.value) {
        this.certificationRuleService.setDataCertificationStatus(false);
        this.subs.sink = this.certificationRuleService.createCertificationRuleSent(payload).subscribe((resp) => {
          Swal.fire({
            type: 'success',
            title: this.translate.instant('CERTIFICATION_RULE.SEND.TITLE'),
            text: this.translate.instant('CERTIFICATION_RULE.SEND.TEXT'),
            footer: `<span style="margin-left: auto">CERTIFICATION_RULE.SEND</span>`,
            confirmButtonText: this.translate.instant('CERTIFICATION_RULE.SEND.CONFIRMBTN'),
          });
        });
      }
    });
  }

  publishCertification(event, certificationIndex) {
    const certificationForm = this.certificationsArrayForm.at(certificationIndex);

    if(certificationForm.invalid) {
      const toggleValue = this.certificationsArrayForm.at(certificationIndex).get('is_published').value;

      Swal.fire({
        type: 'warning',
        title: this.translate.instant('FormSave_S1.TITLE'),
        html: this.translate.instant('FormSave_S1.TEXT'),
        confirmButtonText: this.translate.instant('FormSave_S1.BUTTON_1'),
        allowEnterKey: false,
        allowEscapeKey: false,
        allowOutsideClick: false,
      }).then((result) => {
        if(result.value) {
          this.certificationRuleForm.markAllAsTouched();
          this.certificationsArrayForm.at(certificationIndex).get('is_published').setValue(!toggleValue);
        }
      });

      return;
    }

    if (!certificationForm.value._id) {
      Swal.fire({
        type: 'warning',
        title: this.translate.instant('CERTIFICATION_RULE.PUBLISH_WITHOUT_SAVE.TITLE'),
        html: this.translate.instant('CERTIFICATION_RULE.PUBLISH_WITHOUT_SAVE.TEXT'),
        confirmButtonText: this.translate.instant('CERTIFICATION_RULE.PUBLISH_WITHOUT_SAVE.CONFIRMBTN'),
        allowEnterKey: false,
        allowEscapeKey: false,
        allowOutsideClick: false,
      }).then(() => {
        this.certificationRuleForm.markAllAsTouched();
        this.certificationsArrayForm.at(certificationIndex).get('is_published').setValue(false);
      });

      return;
    }

    const payload = this.createSavePayload(true);
    
    if(event.checked) {
      Swal.fire({
        type: 'warning',
        title: this.translate.instant('Publish_Student_S1.TITLE'),
        html: this.translate.instant('Publish_Student_S1.TEXT'),
        confirmButtonText: this.translate.instant('Publish_Student_S1.BUTTON1'),
        cancelButtonText: this.translate.instant('Publish_Student_S1.BUTTON2'),
        showCancelButton: true,
      }).then((result) => {
        if(result.value) {
          this.isPreviewDisabled = false;
          this.isWaitingForResponse = true;
          if(payload && payload.length) {
            this.subs.sink = this.certificationRuleService.createUpdateCertificationRule(payload).subscribe(
              (resp) => {
                if(resp) {
                  this.isWaitingForResponse = false;
                  Swal.fire({
                    type: 'success',
                    title: 'Bravo',
                    confirmButtonText: this.translate.instant('OK'),
                  });
                }
              },
              (err) => {
                this.isWaitingForResponse = false;
                if (err['message'].includes('GraphQL error: There is already published certification rule for this class')) {
                  Swal.fire({
                    type: 'info',
                    title: this.translate.instant('Publish_S2.TITLE'),
                    html: this.translate.instant('Publish_S2.TEXT'), 
                    confirmButtonText: this.translate.instant('Publish_S2.BUTTON1'),
                  }).then((result) => {
                    if(result.value) {
                      this.certificationsArrayForm.at(certificationIndex).get('is_published').setValue(false);
                      return;
                    }
                  });
                } else if (err['message'].includes('GraphQL error: The name must be unique for current class')) {
                  Swal.fire({
                    type: 'warning',
                    title: this.translate.instant('Uniquename_S1.TITLE'),
                    text: this.translate.instant('Uniquename_S1.TEXT'),
                    confirmButtonText: this.translate.instant('Uniquename_S1.BUTTON'),
                  }).then(() => {
                    if(result.value) {
                      this.certificationsArrayForm.at(certificationIndex).get('is_published').setValue(false);
                      return;
                    }
                  });
                } else {
                  Swal.fire({
                    type: 'error',
                    title: 'Error',
                    text: err && err['message'] ? err['message'] : err,
                    confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
                  });
                }
            });
          }
        } else {
          this.isWaitingForResponse = false;
          this.certificationsArrayForm.at(certificationIndex).get('is_published').setValue(false);
        }
      });
    } else {
      Swal.fire({
        type: 'warning',
        title: this.translate.instant('Unpublish_Student_S1.TITLE'),
        html: this.translate.instant('Unpublish_Student_S1.TEXT'),
        confirmButtonText: this.translate.instant('Unpublish_Student_S1.BUTTON1'),
        cancelButtonText: this.translate.instant('Unpublish_Student_S1.BUTTON2'),
        showCancelButton: true,
      }).then((result) => {
        if(result.value) {
          this.isWaitingForResponse = true;
          this.subs.sink = this.certificationRuleService.createUpdateCertificationRule(payload).subscribe(
            (resp) => {
              if(resp) {
                this.isPreviewDisabled = true;
                this.isWaitingForResponse = false;
                Swal.fire({
                  type: 'success',
                  title: 'Bravo',
                  confirmButtonText: this.translate.instant('OK'),
                });
              } else {
                this.isWaitingForResponse = false;
              }
            },
            (err) => {
              this.isWaitingForResponse = false;
              if (err['message'].includes('GraphQL error: There is already published certification rule for this class')) {
                Swal.fire({
                  type: 'info',
                  title: this.translate.instant('Publish_S2.TITLE'),
                  html: this.translate.instant('Publish_S2.TEXT'), 
                  confirmButtonText: this.translate.instant('Publish_S2.BUTTON1'),
                }).then((result) => {
                  if(result.value) {
                    this.certificationsArrayForm.at(certificationIndex).get('is_published').setValue(true);
                    return;
                  }
                });
              } else if (err['message'].includes('GraphQL error: The name must be unique for current class')) {
                Swal.fire({
                  type: 'warning',
                  title: this.translate.instant('Uniquename_S1.TITLE'),
                  text: this.translate.instant('Uniquename_S1.TEXT'),
                  confirmButtonText: this.translate.instant('Uniquename_S1.BUTTON'),
                }).then((result) => {
                  if(result.value) {
                    this.certificationsArrayForm.at(certificationIndex).get('is_published').setValue(true);
                    return;
                  }
                });
              } else {
                Swal.fire({
                  type: 'error',
                  title: 'Error',
                  text: err && err['message'] ? err['message'] : err,
                  confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
                });
              }
            }
          )
        } else {
          this.isWaitingForResponse = false;
          this.certificationsArrayForm.at(certificationIndex).get('is_published').setValue(true);
        }
      });
    }
  }

  createSavePayload(isForPublish?: Boolean) {
    const certificationRuleValue = this.certificationRuleForm.value;

    const filteredRules = (this.certificationsArrayForm.controls || []).filter(control => {
      return isForPublish ? (control.valid && control.value._id) : control.valid; 
    });

    return filteredRules.map(control => {
      const certification = control.value;
      
      return {
        rncp_id: certificationRuleValue?.title_id,
        class_id: certificationRuleValue?.class_id,
        _id: certification?._id ?? null,
        name: certification?.name,
        header: certification?.header,
        is_published: certification?.is_published,
        is_for_preparation_center: false,  
        documents: {
          document_name: certification?.document?.document_name,
          s3_file_name: certification?.document?.s3_file_name,
          file_path: certification?.document?.file_path,
        }
      }
    });
  }

  saveCertificationRules() {
    if(this.certificationRuleForm.invalid) {
      this.swalInvalidForm();
      return;
    }

    const payload = this.createSavePayload();
    this.isWaitingForResponse = true;
    if(payload && payload.length) {
      this.subs.sink = this.certificationRuleService.createUpdateCertificationRule(payload).subscribe(
        (resp: {_id: string, class_id: {name: string}}[]) => {
          if(resp) {
            this.isWaitingForResponse = false;
            Swal.fire({
              type: 'success',
              title: 'Bravo!',
              text: this.translate.instant('CLASS_UPDATED_SWAL', { className: resp[0]?.class_id?.name }),
            }).then(() => {
              this.getCertificationRule();
            });
          }
        },
        (err) => {
          this.isWaitingForResponse = false;
          if (err['message'].includes('GraphQL error: The name must be unique for current class')) {
            Swal.fire({
              type: 'warning',
              title: this.translate.instant('Uniquename_S1.TITLE'),
              text: this.translate.instant('Uniquename_S1.TEXT'),
              confirmButtonText: this.translate.instant('Uniquename_S1.BUTTON'),
            }).then(() => {
              return;
            });
          } else {
            Swal.fire({
              type: 'error',
              title: 'Error',
              text: err && err['message'] ? err['message'] : err,
              confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
            });
          }
      });
    }
  }

  swalInvalidForm() {
    Swal.fire({
      type: 'warning',
      title: this.translate.instant('FormSave_S1.TITLE'),
      html: this.translate.instant('FormSave_S1.TEXT'),
      confirmButtonText: this.translate.instant('FormSave_S1.BUTTON_1'),
      allowEnterKey: false,
      allowEscapeKey: false,
      allowOutsideClick: false,
    });
    this.certificationRuleForm.markAllAsTouched();
  }

  showPopUp() {
    this.dialog.open(PreviewCertificationRuleDialogComponent, {
      panelClass: 'reply-message-pop-up',
      ...this.config,
      data: {
        callFrom: 'certification-rule',
        titleId: this.selectedRncpTitleId,
        classId: this.selectedClassId,
        titleName: this.selectedRncpTitleName,
        titleLongName: this.selectedRncpTitleLongName,
      },
    });
  }

  sendToSchool () {
    const { title_id, class_id } = this.certificationRuleForm.value;

    const certifications = this.certificationsArrayForm.value.map(cert => {
      const newCert = _.cloneDeep(cert);
      
      newCert.documents = [newCert.document];
      newCert.is_for_preparation_center = false;
      newCert.rncp_id = { _id: title_id };
      newCert.class_id = { _id: class_id };

      return newCert;
    });
    
    this.dialog
      .open(SendCertificationRuleToSchoolDialogComponent, {
        disableClose: true,
        width: '850px',
        data: {
          certificationStudent: certifications,
          origin: 'certification-rule',
          rncpId: title_id,
          classId: class_id
        }
      })
      .afterClosed()
      .subscribe()
  }
  
  changeMyStyle() {
    this.buttonColor = '#ffd642';
    this.textColor = 'black';
    let styles = {
      'background-color': this.buttonColor,
      color: this.textColor,
    };
    return styles;
  }

  ngOnDestroy(): void {
    clearTimeout(this.timeOutVal);
    this.subs.unsubscribe();
  }
}
