import { Component, ElementRef, Input, OnDestroy, OnInit, QueryList, ViewChildren } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SubSink } from 'subsink';
import * as DecoupledEditor from 'assets/ckeditor5-custom/ckeditor.js';
import { MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { UtilityService } from 'app/service/utility/utility.service';
import { FileUploadService } from 'app/service/file-upload/file-upload.service';
import { CertificationRuleService } from 'app/service/certification-rule/certification-rule.service';
import { CoreService } from 'app/service/core/core.service';
import Swal from 'sweetalert2';
import { ApplicationUrls } from 'app/shared/settings';
import { SendCertificationRuleToSchoolDialogComponent } from '../send-certification-rule-to-school-dialog/send-certification-rule-to-school-dialog.component';
import * as _ from 'lodash';

@Component({
  selector: 'ms-pc-certification-parameter',
  templateUrl: './pc-certification-parameter.component.html',
  styleUrls: ['./pc-certification-parameter.component.scss']
})
export class PcCertificationParameterComponent implements OnInit, OnDestroy {

  @Input() rncpId: string;
  @Input() classId: string;
  @ViewChildren('certificationPanel') certificationPanel: QueryList<ElementRef>;

  private subs = new SubSink();

  certification_rule: FormGroup;

  public Editor = DecoupledEditor;
  public config = {
    toolbar: ['heading', 'bold', 'italic', 'underline', 'strikethrough', 'numberedList', 'bulletedList', 'undo', 'redo'],
    height: '20rem',
  };

  onReady(editor) {
    editor.ui.getEditableElement().parentElement.insertBefore(editor.ui.view.toolbar.element, editor.ui.getEditableElement());
  }

  isUploadingFile = false;
  isWaitingForResponse = false;

  certificationRules = [];

  initialForm = [];

  constructor(
    public dialog: MatDialog,
    private fb: FormBuilder,
    private translate: TranslateService,
    private utilService: UtilityService,
    private fileUploadService: FileUploadService,
    private certificationRuleService: CertificationRuleService,
    public coreService: CoreService
  ) { }

  ngOnInit(): void {
    this.initCertificationRuleForm();
    this.getAllCertificationRules();
  }

  getAllCertificationRules() {
    this.isWaitingForResponse = true;
    const filter = {
      rncp_id: this.rncpId,
      class_id: this.classId,
      is_for_preparation_center: true
    }
    this.certificationsArray.clear();
    this.subs.sink = this.certificationRuleService.getAllCertificationRules(filter).subscribe(
      (resp) => {
        if(resp && resp.length) {
          this.isWaitingForResponse = false;
          this.certificationRules = _.cloneDeep(resp);
          let certificationData = [];
          this.certificationRules.forEach((cert) => {
            const certification =  {
              _id: cert._id,
              name: cert.name,
              header: cert.header,
              is_published: cert.is_published,
              document: {
                document_name: cert.documents[0].document_name,
                s3filename: cert.documents[0].s3_file_name,
                file_path: cert.documents[0].file_path,
              }
            }
            certificationData.push(certification);
            this.addCertification(true);
          });
          this.certificationsArray.patchValue(certificationData);
          this.initialForm = this.certification_rule.value;
        } else {
          this.isWaitingForResponse = false;
          this.addCertification(true);
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
      }
    )
  }

  initCertificationRuleForm() {
    this.certification_rule = this.fb.group({
      title_id: [this.rncpId],
      class_id: [this.classId],
      certifications: this.fb.array([]),
    });
  }

  initCertificationsForm() {
    return this.fb.group({
      _id: [null],
      name: [null, Validators.required],
      header: [null, Validators.required],
      is_published: [false],
      document: this.fb.group({
        document_name: [null, Validators.required],
        s3filename: [null, Validators.required],
        file_path: [null, Validators.required],
      })
    });
  }

  get certificationsArray() {
    return this.certification_rule.get('certifications') as FormArray;
  }

  addCertification(firstLanding?) {
    this.certificationsArray.push(this.initCertificationsForm());
    setTimeout(() => {
      if (this.certificationPanel && this.certificationPanel.length && !firstLanding) {
        this.certificationPanel.toArray()[this.certificationPanel.length - 1].nativeElement.scrollIntoView({ behavior: 'smooth' });
      }
    }, 500);
  }

  deleteCertification(certificationIndex) {
    let timeout = 2;
    let confirmInterval;
    const sectionName = this.certificationsArray.at(certificationIndex).get('name').value;
    const idCertification = this.certificationsArray.at(certificationIndex).get('_id').value;

    if(idCertification || sectionName){
      Swal.fire({
        type: 'warning',
        title: this.translate.instant('Deletesection_S1.TITLE', { SectionName: sectionName ? sectionName : '' }),
        html: this.translate.instant('Deletesection_S1.TEXT', { SectionName: sectionName ? sectionName : '' }),
        confirmButtonText: this.translate.instant('Deletesection_S1.BUTTON1') + ` (${timeout})`,
        cancelButtonText: this.translate.instant('Deletesection_S1.BUTTON2'),
        showCancelButton: true,
        onOpen: () => {
          timeout--;
          Swal.disableConfirmButton();
          const confirmButtonRef = Swal.getConfirmButton();
          confirmInterval = setInterval(() => {
            if (timeout > 0) {
              confirmButtonRef.innerText = this.translate.instant('Deletesection_S1.BUTTON1') + ` (${timeout})`;
              timeout--;
            } else {
              Swal.enableConfirmButton();
              confirmButtonRef.innerText = this.translate.instant('Deletesection_S1.BUTTON1');
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
                  this.getAllCertificationRules();
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
              this.certificationsArray.removeAt(certificationIndex);
            });
          }
        }
      });
    } else {
      this.isWaitingForResponse = false;
      this.certificationsArray.removeAt(certificationIndex);
    }    
  }

  sendToSchool () {
    this.subs.sink = this.dialog
      .open(SendCertificationRuleToSchoolDialogComponent, {
        disableClose: true,
        width: '850px',
        data: {
          rncpId: this.rncpId,
          classId: this.classId,
          certification: this.certification_rule.value,
          origin: 'pc-certification-parameter'
        }
      })
      .afterClosed()
      .subscribe()
  }

  isSaveButtonDisabled() {
    const isDisable = this.certificationsArray.controls.some((control) => {
      if(!control.get('name').value || 
         !control.get('header').value || 
         !control.get('document').get('document_name').value || 
         !control.get('document').get('s3filename').value
        ) {
        return true;
      } else {
        return false;
      }
    });

    return isDisable;
  }

  isFormChanged() {
    const initialForm = _.cloneDeep(this.initialForm);
    const currentForm = _.cloneDeep(this.certification_rule.value);
    const isEqualForm = _.isEqual(initialForm, currentForm);
    return isEqualForm;
  }

  createSavePayload() {
    const certificationRuleValue = this.certification_rule.value;
    return (this.certificationsArray.controls || []).filter(control => control.valid).map(control => {
      const certification = control.value
      return {
          rncp_id: certificationRuleValue?.title_id,
          class_id: certificationRuleValue?.class_id,
          _id: certification?._id ?? null,
          name: certification?.name,
          header: certification?.header,
          is_published: certification?.is_published,
          is_for_preparation_center: true,  
          documents: {
            document_name: certification?.document?.document_name,
            s3_file_name: certification?.document?.s3filename,
            file_path: certification?.document?.file_path,
          }
        }

    })
  }

  saveCertificationRules() {
    if(this.certification_rule.invalid) {
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
              this.getAllCertificationRules();
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

  isPublishedDocument(certificationIndex?) {
    let findPublished;
    this.certificationsArray.controls.find((control, index) => {
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

  createPublishPayload() {
    const certificationRuleValue = this.certification_rule.value;
    let payload = [];
    if(certificationRuleValue?.certifications?.length) {
      certificationRuleValue.certifications.forEach((cert) => {
        const certData = {
          _id: cert?._id,
          payloadPublish: {
            rncp_id: certificationRuleValue?.title_id,
            class_id: certificationRuleValue?.class_id,
            name: cert?.name,
            header: cert?.header,
            is_published: cert?.is_published,
            is_for_preparation_center: true,  
            documents: {
              document_name: cert?.document?.document_name,
              s3_file_name: cert?.document?.s3filename,
              file_path: cert?.document?.file_path,
            }
          }
        }
        payload.push(certData);
      });
    }
    return payload;
  }

  publishCertification(event, certificationIndex) {
    if(this.certificationsArray.at(certificationIndex).invalid) {
      const toggleValue = this.certificationsArray.at(certificationIndex).get('is_published').value;

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
          this.certification_rule.markAllAsTouched();
          this.certificationsArray.at(certificationIndex).get('is_published').setValue(!toggleValue);
        }
      });
      return;
    }

    const payload = this.createSavePayload();
    
    if(event.checked) {
      Swal.fire({
        type: 'warning',
        title: this.translate.instant('Publish_S1.TITLE'),
        html: this.translate.instant('Publish_S1.TEXT'),
        confirmButtonText: this.translate.instant('Publish_S1.BUTTON1'),
        cancelButtonText: this.translate.instant('Publish_S1.BUTTON2'),
        showCancelButton: true,
      }).then((result) => {
        if(result.value) {
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
                      this.certificationsArray.at(certificationIndex).get('is_published').setValue(false);
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
                      this.certificationsArray.at(certificationIndex).get('is_published').setValue(false);
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
          this.certificationsArray.at(certificationIndex).get('is_published').setValue(false);
        }
      });
    } else {
      Swal.fire({
        type: 'warning',
        title: this.translate.instant('Unpublish_S1.TITLE'),
        html: this.translate.instant('Unpublish_S1.TEXT'),
        confirmButtonText: this.translate.instant('Unpublish_S1.BUTTON1'),
        cancelButtonText: this.translate.instant('Unpublish_S1.BUTTON2'),
        showCancelButton: true,
      }).then((result) => {
        if(result.value) {
          this.isWaitingForResponse = true;
          this.subs.sink = this.certificationRuleService.createUpdateCertificationRule(payload).subscribe(
            (resp) => {
              if(resp) {
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
                    this.certificationsArray.at(certificationIndex).get('is_published').setValue(true);
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
                    this.certificationsArray.at(certificationIndex).get('is_published').setValue(true);
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
          this.certificationsArray.at(certificationIndex).get('is_published').setValue(true);
        }
      });
    }
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
              this.certificationsArray.at(certificationIndex).get('document').get('document_name').setValue(resp.file_name);
              this.certificationsArray.at(certificationIndex).get('document').get('s3filename').setValue(resp.s3_file_name);
              this.certificationsArray.at(certificationIndex).get('document').get('file_path').setValue(resp.file_url);
            });
          }
        },
        (err) => {
          Swal.fire({
            type: 'error',
            title: 'Error !',
            confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
          }).then((res) => {

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
    const s3file = this.certificationsArray.at(certificationIndex).get('document').get('s3filename').value;
    const url = ApplicationUrls.baseApi.replace('graphql', 'fileuploads/') + s3file;
    window.open(url, '_blank');
  }

  deleteDocument(certificationIndex) {
    const documentName = this.certificationsArray.at(certificationIndex).get('document').get('document_name').value;
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
          this.certificationsArray.at(certificationIndex).get('document').get('document_name').setValue(null);
          this.certificationsArray.at(certificationIndex).get('document').get('s3filename').setValue(null);  
          this.certificationsArray.at(certificationIndex).get('document').get('file_path').setValue(null);  
        });
      }
    });
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
    this.certification_rule.markAllAsTouched();
  }

  ngOnDestroy(): void {
      this.subs.unsubscribe();
  }
}
