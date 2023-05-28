import { Router, ActivatedRoute, NavigationEnd, NavigationCancel } from '@angular/router';
import { Component, OnInit, OnDestroy, ViewChild, Input } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Test } from '../../models/test.model';
import { RNCPTitlesService } from '../../service/rncpTitles/rncp-titles.service';
import { ApplicationUrls } from '../../shared/settings/application-urls';
import { TestService } from '../../service/test/test.service';
import swal from 'sweetalert2';
import { FifthStepComponent } from '../../test/steps/fifth-step/fifth-step.component';
import { TestCreationService } from 'app/service/test/test-creation.service';
import Swal from 'sweetalert2';
import { SubSink } from 'subsink';
import { isString } from 'util';
import { FirstStepComponent } from '../steps/first-step/first-step.component';
import { FormGroup } from '@angular/forms';
import * as _ from 'lodash';
import { Observable, forkJoin } from 'rxjs';
import { TestCreationPayloadData } from './test-creation.model';

@Component({
  selector: 'ms-test-creation',
  templateUrl: './test-creation.component.html',
  styleUrls: ['./test-creation.component.scss'],
})
export class TestCreationComponent implements OnInit, OnDestroy {
  progress = 0;
  currentStep: string;
  expanded = false;
  test: Test;
  duplicateTestId: string;
  isRNCPPublished = false;
  isFifthStep = false;
  isFirstStep = false;
  isTestPublished = false;
  saveFirstTab = false;
  retakeInformation = {};
  rncpTitle: any;
  titleId: string;
  testId: string;
  categoryId: string;
  firstTabData: any;
  firstTabValid = false;
  firstFormValidData: any;
  private subs = new SubSink();

  tabPermission = {
    firstTab: true,
    secondTab: false,
    thirdTab: false,
    fourthTab: false,
    fifthTab: false,
  };

  testProgress;
  private interVal: any;
  private timeOutVal: any;

  constructor(
    private testService: TestService,
    private router: Router,
    private route: ActivatedRoute,
    private translate: TranslateService,
    private testCreationService: TestCreationService,
    private rncpTitlesService: RNCPTitlesService,
  ) {}

  ngOnInit() {
    this.subs.sink = this.testCreationService.testCreationData$.subscribe((testData) => {
      this.firstTabData = testData;
      this.firstFormValidData = this.testCreationService.sharedData;
      this.checkLastestTab(testData);
    });
    this.subs.sink = this.testCreationService.firstTabValidData$.subscribe((firstTabValidation) => {
      this.firstTabValid = firstTabValidation;
    });
    this.subs.sink = this.route.paramMap.subscribe((params) => {
      this.titleId = params.get('titleId') ? params.get('titleId') : '';
      this.categoryId = params.get('categoryId') ? params.get('categoryId') : '';
      this.testId = params.get('testId') ? params.get('testId') : '';
      this.duplicateTestId = this.route.snapshot.queryParamMap.get('duplicate');

      if (this.titleId) {
        this.subs.sink = this.rncpTitlesService.getOneTitleById(this.titleId).subscribe((resp) => {
          if (resp) {
            this.rncpTitle = resp;
            if (this.rncpTitle) {
              this.isRNCPPublished = this.rncpTitle.is_published;
            }
          }
        });
      }
      if (this.duplicateTestId) {
        this.getTestDataToDuplicate();
      } else if (this.testId) {
        this.getTestDataEdit(this.testId);
      }
    });

    this.subs.sink = this.testService.getTest().subscribe((test) => {

      this.test = _.cloneDeep(test);
      const step = this.router.url.substr(this.router.url.lastIndexOf('/') + 1);
      this.changeProgress(step);
      this.retakeInformation = this.testService.getRetakeInformation();
      // this.isTestPublished = test['is_published'] ? test['is_published'] : false;
    });

    const step = this.router.url.substr(this.router.url.lastIndexOf('/') + 1);
    this.currentStep = step;

    this.changeProgress(step);

    this.subs.sink = this.router.events.subscribe((val) => {
      if (val instanceof NavigationEnd) {
        const step = this.router.url.substr(this.router.url.lastIndexOf('/') + 1);
        this.currentStep = step;
        this.changeProgress(step);
      }
      this.firstFormValidData = this.testCreationService.sharedData;
    });
  }

  getTestDataToDuplicate() {
    this.subs.sink = this.testCreationService.getTestCreationData(this.duplicateTestId).subscribe((response) => {
      const data: TestCreationPayloadData = _.cloneDeep(this.formatInitializationTestData(response));

      // format test data that we duplicate
      data._id = this.testId;
      data.parent_rncp_title = this.titleId;
      data.parent_category = this.categoryId;
      data.class_id = this.route.snapshot.queryParamMap.get('class');
      data.block_of_competence_condition_id = this.route.snapshot.queryParamMap.get('block');
      data.subject_id = this.route.snapshot.queryParamMap.get('subject');
      data.evaluation_id = this.route.snapshot.queryParamMap.get('eval');
      data.is_published = false;


      this.testCreationService.setTestCreationData(
        _.merge(_.cloneDeep(this.testCreationService.getTestCreationDataWithoutSubscribe()), data),
      );
      this.testCreationService.setSavedTestCreationData(
        _.merge(_.cloneDeep(this.testCreationService.getSavedTestCreationDataWithoutSubscribe()), data),
      );
      this.testCreationService.setTestCreationLoadedStatus(true);
    });
  }

  getTestDataEdit(testId: string) {
    this.subs.sink = this.testCreationService.getTestCreationData(testId).subscribe((response) => {

      const tempResp = _.cloneDeep(response);
      const data = _.cloneDeep(this.formatInitializationTestData(tempResp));


      this.testCreationService.setTestCreationData(
        _.merge(_.cloneDeep(this.testCreationService.getTestCreationDataWithoutSubscribe()), data),
      );
      this.testCreationService.setSavedTestCreationData(
        _.merge(_.cloneDeep(this.testCreationService.getSavedTestCreationDataWithoutSubscribe()), data),
      );
      this.testCreationService.setTestCreationLoadedStatus(true);

      const temp = this.testCreationService.getTestCreationDataWithoutSubscribe();
      if (temp.is_published) {
        this.getTestDataProgress(testId);
      }
    });
  }

  getTestDataProgress(testId: string) {
    // Get Test
    this.subs.sink = this.testCreationService.getTestProgress(testId).subscribe((response) => {

      const data = _.cloneDeep(response);
      if (data) {
        // const temp = [
        //   {
        //     _id: '1'
        //   },
        //   {
        //     _id: '2'
        //   }
        // ]
        data['is_document_expected_done'] = data.document_expected_done_count && data.document_expected_done_count.length ? true : false;
        data['is_assign_corrector_done'] = data.assign_corrector_done && data.assign_corrector_done.length ? true : false;
        data['is_mark_entry_done'] = data.mark_entry_done && data.mark_entry_done.length ? true : false;
        data['is_validate_done'] = data.validate_done && data.validate_done.length ? true : false;
        data['create_group_done'] = data.create_group_done && data.create_group_done.length ? data.create_group_done : [];
        // data['assign_corrector_done'] = temp;
        this.testCreationService.setTestProgressData(data);

        this.testProgress = this.testCreationService.getTestProgressDataWithoutSubscribe();
      }
    });
  }

  formatInitializationTestData(response) {
    if (response) {
      if (response.parent_rncp_title && response.parent_rncp_title._id) {
        response.parent_rncp_title = response.parent_rncp_title._id;
      }
      if (response.parent_category && response.parent_category._id) {
        response.parent_category = response.parent_category._id;
      }
      if (response.class_id && response.class_id._id) {
        response.class_id = response.class_id._id;
      }
      if (response.block_of_competence_condition_id && response.block_of_competence_condition_id._id) {
        response.block_of_competence_condition_id = response.block_of_competence_condition_id._id;
      }
      if (response.subject_id && response.subject_id._id) {
        response.subject_id = response.subject_id._id;
      }
      if (response.evaluation_id && response.evaluation_id._id) {
        response.evaluation_id = response.evaluation_id._id;
      }
      if (response.schools && response.schools.length) {
        response.schools.forEach((test_date) => {
          if (test_date.school_id && test_date.school_id._id) {
            test_date.school_id = test_date.school_id._id;
          }
        });
      }
      if (response.documents && response.documents.length) {
        // this one to store behavioursubjects
        const tempAddedDocumentData = [];
        const tempDocumentsID = [];
        response.documents.forEach((addedDocument) => {
          tempAddedDocumentData.push(_.cloneDeep(addedDocument));


          if (addedDocument && addedDocument._id) {
            tempDocumentsID.push(addedDocument._id);
            // addedDocument = addedDocument._id;

          }
        });

        this.testCreationService.setAddedDocumentData(tempAddedDocumentData);
        response.documents = tempDocumentsID;

      }
      if (response.expected_documents && response.expected_documents.length) {
        response.expected_documents.forEach((expectedDocument) => {
          if (expectedDocument.document_user_type && expectedDocument.document_user_type._id) {
            expectedDocument.document_user_type = expectedDocument.document_user_type._id;
          }
        });
      }
      if (response.cross_corr_paperless) {
        response.cross_corr_paperless = response.cross_corr_paperless;
      }
      response.calendar.steps.forEach((task) => {
        if (task.actor && task.actor._id) {
          task.actor = task.actor._id;
        }
        if (task.sender_type && task.sender_type._id) {
          task.sender_type = task.sender_type._id;
        }
        if (task.sender && task.sender._id) {
          task.senderData = task.sender;
          task.sender = task.senderData._id;
        }
      });
      response.correction_grid.correction.sections_evalskill.forEach((sec) => {
        if (sec && sec.academic_skill_competence_template_id && sec.academic_skill_competence_template_id._id) {
          sec.academic_skill_competence_template_id = sec.academic_skill_competence_template_id._id;
        }
        if (sec && sec.soft_skill_competence_template_id && sec.soft_skill_competence_template_id._id) {
          sec.soft_skill_competence_template_id = sec.soft_skill_competence_template_id._id;
        }
        if (sec && sec.academic_skill_block_template_id && sec.academic_skill_block_template_id._id) {
          sec.academic_skill_block_template_id = sec.academic_skill_block_template_id._id;
        }
        if (sec && sec.soft_skill_block_template_id && sec.soft_skill_block_template_id._id) {
          sec.soft_skill_block_template_id = sec.soft_skill_block_template_id._id;
        }
        sec.sub_sections.forEach((subsec) => {
          if (
            subsec &&
            subsec.academic_skill_criteria_of_evaluation_competence_id &&
            subsec.academic_skill_criteria_of_evaluation_competence_id._id
          ) {
            subsec.academic_skill_criteria_of_evaluation_competence_id = subsec.academic_skill_criteria_of_evaluation_competence_id._id;
          }
          if (
            subsec &&
            subsec.soft_skill_criteria_of_evaluation_competence_id &&
            subsec.soft_skill_criteria_of_evaluation_competence_id._id
          ) {
            subsec.soft_skill_criteria_of_evaluation_competence_id = subsec.soft_skill_criteria_of_evaluation_competence_id._id;
          }
          if (subsec && subsec.academic_skill_competence_template_id && subsec.academic_skill_competence_template_id._id) {
            subsec.academic_skill_competence_template_id = subsec.academic_skill_competence_template_id._id;
          }
          if (subsec && subsec.soft_skill_competence_template_id && subsec.soft_skill_competence_template_id._id) {
            subsec.soft_skill_competence_template_id = subsec.soft_skill_competence_template_id._id;
          }
        });
      });
    }

    return response;
  }

  checkLastestTab(data) {
    if (data && data.current_tab) {
      switch (data.current_tab) {
        case 'first':
          this.tabPermission.firstTab = true;
          this.tabPermission.secondTab = false;
          this.tabPermission.thirdTab = false;
          this.tabPermission.fourthTab = false;
          this.tabPermission.fifthTab = false;
          break;
        case 'second':
          this.tabPermission.firstTab = true;
          this.tabPermission.secondTab = true;
          this.tabPermission.thirdTab = false;
          this.tabPermission.fourthTab = false;
          this.tabPermission.fifthTab = false;
          break;
        case 'third':
          this.tabPermission.firstTab = true;
          this.tabPermission.secondTab = true;
          this.tabPermission.thirdTab = true;
          this.tabPermission.fourthTab = false;
          this.tabPermission.fifthTab = false;
          break;
        case 'fourth':
          this.tabPermission.firstTab = true;
          this.tabPermission.secondTab = true;
          this.tabPermission.thirdTab = true;
          this.tabPermission.fourthTab = true;
          this.tabPermission.fifthTab = false;
          break;
        case 'fifth':
          this.tabPermission.firstTab = true;
          this.tabPermission.secondTab = true;
          this.tabPermission.thirdTab = true;
          this.tabPermission.fourthTab = true;
          this.tabPermission.fifthTab = true;
          break;
      }
    }
  }

  changeProgress(step) {
    switch (step) {
      case 'first':
        this.progress = this.firstTabData && this.firstTabData.controlled_test ? 33.33 : 20;
        break;
      case 'second':
        this.progress = 40;
        break;
      case 'third':
        this.progress = 60;
        break;
      case 'fourth':
        this.progress = this.firstTabData && this.firstTabData.controlled_test ? 66.66 : 80;
        break;
      case 'fifth':
        this.progress = 100;
        break;
      case 'default':
        this.progress = 0;
    }
  }

  expand(event: boolean) {
    this.expanded = event;
  }

  testPublishConditionsFailed(conditionalText) {
    swal
      .fire({
        title: this.translate.instant('TEST.TESTCREATE_S2.TITLE'),
        html: conditionalText,
        type: 'warning',
        allowEscapeKey: false,
        allowOutsideClick: false,
        confirmButtonText: this.translate.instant('TEST.TESTCREATE_S2.SAVEANDLEAVE'),
      })
      .then((isConfirm) => {
        if (isConfirm) {
          this.saveTest(true, false);
        }
      });
  }

  saveTest(leave, isPublish?: boolean) {
    const self = this;
    if (isPublish) {
      let timeDisabledinSec = 6;
      if (this.test.is_initial_test) {
        if (this.test.is_different_notation_grid) {
          swal
            .fire({
              title: this.translate.instant('TEST.RETAKE_S4.TITLE', {
                mainTestName: this.test.name,
              }),
              html: this.translate.instant('TEST.RETAKE_S4.TEXT', {
                subTestName: this.retakeInformation['subTest']['evaluation'],
              }),
              type: 'warning',
              allowEscapeKey: false,
              allowOutsideClick: false,
              showCancelButton: true,
              confirmButtonText: this.translate.instant('TEST.RETAKE_S4.CONFIRM_BTN', { timer: timeDisabledinSec }),
              cancelButtonText: this.translate.instant('TEST.RETAKE_S4.CANCEL'),
              onOpen: () => {
                swal.disableConfirmButton();
                const confirmButtonRef = swal.getConfirmButton();

                // TimerLoop for derementing timeDisabledinSec
                this.interVal = setInterval(() => {
                  timeDisabledinSec -= 1;
                  confirmButtonRef.innerText = this.translate.instant('TEST.TESTCREATE_S1.CONFIRM_IN', { timer: timeDisabledinSec });
                }, 1000);

                // Resetting timerLoop to stop after required time of execution
                this.timeOutVal = setTimeout(() => {
                  confirmButtonRef.innerText = this.translate.instant('TEST.TESTCREATE_S1.CONFIRM');
                  swal.enableConfirmButton();
                  // clearTimeout(timerLoop);
                  clearInterval(this.interVal);
                }, timeDisabledinSec * 1000);
                // clearTimeout(this.timeOutVal);
              },
            })
            .then(function (isConfirm) {
              self.saveOrPublishTest(leave, isPublish);
            }, function (dismiss) {}.bind(this));
        } else {
          swal
            .fire({
              title: this.translate.instant('TEST.TESTCREATE_S1.TITLE'),
              html: this.translate.instant('TEST.TESTCREATE_S1.TEXT'),
              type: 'warning',
              allowEscapeKey: false,
              allowOutsideClick: false,
              showCancelButton: true,
              confirmButtonText: this.translate.instant('TEST.TESTCREATE_S1.CONFIRM_IN', { timer: timeDisabledinSec }),
              cancelButtonText: this.translate.instant('TEST.TESTCREATE_S1.CANCEL'),
              onOpen: () => {
                swal.disableConfirmButton();
                const confirmButtonRef = swal.getConfirmButton();

                // TimerLoop for derementing timeDisabledinSec
                this.interVal = setInterval(() => {
                  timeDisabledinSec -= 1;
                  confirmButtonRef.innerText = this.translate.instant('TEST.TESTCREATE_S1.CONFIRM_IN', { timer: timeDisabledinSec });
                }, 1000);

                // Resetting timerLoop to stop after required time of execution
                setTimeout(() => {
                  confirmButtonRef.innerText = this.translate.instant('TEST.TESTCREATE_S1.CONFIRM');
                  swal.enableConfirmButton();
                  // clearTimeout(timerLoop);
                  clearInterval(this.interVal);
                }, timeDisabledinSec * 1000);
                // clearTimeout(this.timeOutVal);
              },
            })
            .then(function (isConfirm) {
              self.saveOrPublishTest(leave, isPublish);
            }, function (dismiss) {}.bind(this));
        }
      } else {
        swal
          .fire({
            type: 'warning',
            title: this.translate.instant('TEST.RETAKE_S3.TITLE', {
              mainTestName: this.retakeInformation['parentTest']['evaluation'],
            }),
            html: this.translate.instant('TEST.RETAKE_S3.TEXT'),
            allowEscapeKey: false,
            allowOutsideClick: false,
            showCancelButton: true,
            confirmButtonText: this.translate.instant('TEST.RETAKE_S3.CONFIRM_BTN', { timer: timeDisabledinSec }),
            cancelButtonText: this.translate.instant('TEST.RETAKE_S3.CANCEL'),
            onOpen: () => {
              swal.disableConfirmButton();
              const confirmButtonRef = swal.getConfirmButton();

              // TimerLoop for derementing timeDisabledinSec
              this.interVal = setInterval(() => {
                timeDisabledinSec -= 1;
                confirmButtonRef.innerText = this.translate.instant('TEST.TESTCREATE_S1.CONFIRM_IN', { timer: timeDisabledinSec });
              }, 1000);

              // Resetting timerLoop to stop after required time of execution
              this.timeOutVal = setTimeout(() => {
                confirmButtonRef.innerText = this.translate.instant('TEST.RETAKE_S3.CONFIRM_BTN');
                swal.enableConfirmButton();
                // clearTimeout(timerLoop);
                clearInterval(this.interVal);
              }, timeDisabledinSec * 1000);
              // clearTimeout(this.timeOutVal);
            },
          })
          .then(function (isConfirm) {
            self.saveOrPublishTest(leave, isPublish);
          }, function (dismiss) {}.bind(this));
      }
    } else {
      self.saveOrPublishTest(leave, false);
    }
  }

  cancelTest() {
    swal
      .fire({
        title: 'Attention',
        text: this.translate.instant('TEST.MESSAGES.CLOSECONFIRM'),
        type: 'question',
        showCancelButton: true,
        cancelButtonText: this.translate.instant('NO'),
        allowEscapeKey: true,
        confirmButtonText: this.translate.instant('YES'),
      })
      .then(
        () => {
          this.subs.sink = this.testService.cancelTest().subscribe(
            function () {

              this.router.navigateByUrl('/rncpTitles');
            }.bind(this),
          );
        },
        function (dismiss) {
          if (dismiss === 'cancel') {
          }
        },
      );
  }

  saveOrPublishTest(leave, isPublish) {
    if (this.testService.getValidation() || this.test._id) {
      this.subs.sink = this.testService.submitTest(true, isPublish ? isPublish : false).subscribe((status) => {

        if (status) {
          swal
            .fire({
              title: this.translate.instant('CONGRATULATIONS'),
              text: this.translate.instant('TEST.MESSAGES.TESTSAVESUCCESS'), // 'Vous venez de créer l\'épreuve',
              allowEscapeKey: false,
              allowOutsideClick: false,
              type: 'success',
            })
            .then(() => {
              //  this.testService.updateTest(this.test);
              if (leave) {
                this.router.navigate(['/rncpTitles']);
              }
            });
        } else {
          swal.fire({
            title: 'Attention',
            text: this.translate.instant('TEST.ERRORS.TESTCREATIONERROR'),
            allowEscapeKey: true,
            type: 'warning',
          });
        }
      });
    } else {
      const step = this.router.url.substr(this.router.url.lastIndexOf('/') + 1);

      switch (step) {
        case 'first':
          if (this.firstTabData.type === null || this.firstTabData.type === '') {
            swal.fire({
              title: 'Attention',
              text: this.translate.instant('TEST.ERRORS.NOTESTTYPE'),
              allowEscapeKey: true,
              type: 'warning',
            });
          } else {
            this.testService.updateTest(this.firstTabData);
            this.testCreationService.setTestCreationData(this.firstTabData);
            this.saveFirstTab = true;
            this.subs.sink = this.testService.submitTest(true).subscribe((resp) => {

              swal.fire({
                title: 'Attention',
                text: this.translate.instant('TEST.MESSAGES.TESTSAVESUCCESS'),
                allowEscapeKey: true,
                type: 'warning',
              });
            });
          }
          break;
        case 'second':
          if (!this.testService.checkcorrection_gridSections(this.test)) {
            swal.fire({
              title: 'Attention',
              type: 'warning',
              allowEscapeKey: true,
              html:
                '<b>' +
                this.translate.instant('TEST.ERRORS.COMPLETECURRENTSTEP') +
                '</b>' +
                '<ul style="text-align: center">' +
                '<br>' +
                // '<li>' + this.translate.instant('TEST.ERRORS.ATLEASTHEADER') + '</li>' +
                '<li><span style="position: relative; left: -20px;">' +
                this.translate.instant('TEST.ERRORS.ATLEASTONESECTION') +
                '</span></li>' +
                '</ul>',
            });
          }
          break;
        case 'third':
          swal.fire({
            title: 'Attention',
            text: this.translate.instant('TEST.ERRORS.COMPLETECURRENTSTEP'),
            allowEscapeKey: true,
            type: 'warning',
          });
          break;
        case 'fourth':
          swal.fire({
            title: 'Attention',
            text: this.translate.instant('TEST.ERRORS.COMPLETECURRENTSTEP'),
            allowEscapeKey: true,
            type: 'warning',
          });
          break;
        case 'fifth':
          swal.fire({
            title: 'Attention',
            text: this.translate.instant('TEST.ERRORS.COMPLETECURRENTSTEP'),
            allowEscapeKey: true,
            type: 'warning',
          });
          break;
        default:
      }
    }
  }

  eventChange(event) {
    if (event instanceof FifthStepComponent) {
      this.isFifthStep = true;
    } else {
      this.isFifthStep = false;
    }
    if (event instanceof FirstStepComponent) {
      this.isFirstStep = true;
    } else {
      this.isFirstStep = false;
    }
  }

  translateDate(dateRaw) {
    let date = dateRaw;
    if (dateRaw.length === 8) {
      const year: number = +date.substring(0, 4);
      const month: number = +date.substring(4, 6);
      const day: number = +date.substring(6, 8);
      date = new Date(year, month, day);
      return date.toISOString();
    }
  }

  saveTestTry() {
    let testId: string;
    let firstStepData: any;
    let thirdStepData: any;

    this.subs.sink = this.testCreationService.selectedTestId$.subscribe((id) => {
      testId = id;
    });
    this.subs.sink = this.testCreationService.testCreationData$.subscribe((testData) => {
      firstStepData = testData;
    });

    this.subs.sink = this.testService.getTest().subscribe((test) => {
      thirdStepData = test;
      thirdStepData.expected_documents.forEach((element, index) => {
        if (!isString(thirdStepData.expected_documents[index].document_user_type)) {
          thirdStepData.expected_documents[index].document_user_type = element.document_user_type._id;
        }
        if (element.deadline_date.type === 'fixed') {
          let date = element.deadline_date.deadline;
          if (date.length === 8) {
            const year: number = +date.substring(0, 4);
            const month: number = +date.substring(4, 6);
            const day: number = +date.substring(6, 8);
            date = new Date(year, month, day);
            thirdStepData.expected_documents[index].deadline_date.deadline = date.toISOString();
          }
        }
      });
      thirdStepData.documents.forEach((element, index) => {
        if (typeof thirdStepData.documents[index] === 'object') {
          thirdStepData.documents[index] = element._id;
        }
      });
      thirdStepData.calendar.steps.forEach((element, index) => {
        delete element.date_sort;
        delete element.sender_sort;
        if (typeof thirdStepData.calendar.steps[index].actor === 'object') {
          thirdStepData.calendar.steps[index].actor = element.actor._id;
        }
        if (typeof thirdStepData.calendar.steps[index].date.value === 'number') {
          let date = element.date.value;
          date = date.toString();
          thirdStepData.calendar.steps[index].date.value = this.translateDate(date);
        }
      });
    });

    const testPayloadData = { ...thirdStepData, ...firstStepData };





    if (!testPayloadData.date_retake_exam) {
      testPayloadData.date_retake_exam = new Date().toISOString();
    }
    if (testPayloadData.schools.length <= 1) {
      testPayloadData.schools[0].test_date = new Date().toISOString();
    }

    if (testId) {
      this.subs.sink = this.testCreationService.updateTest(testId, testPayloadData).subscribe((resp) => {
        Swal.fire({
          type: 'success',
          title: 'Test Successfully Updated!',
        }).then((result) => {
          if (result.value) {
            this.router.navigate(['/rncpTitles']);
          }
        });
      });
    } else {
      this.subs.sink = this.testCreationService.createTest(testPayloadData).subscribe((resp) => {
        Swal.fire({
          type: 'success',
          title: 'Test Successfully Saved!',
        }).then((result) => {
          if (result.value) {
            this.router.navigate(['/rncpTitles']);
          }
        });
      });
    }
  }

  ngOnDestroy() {
    this.testCreationService.setTestCreationLoadedStatus(false);
    this.testCreationService.resetTestCreationData();
    this.testCreationService.resetAddedDocumentData();
    this.testCreationService.removeTestProgressData();
    clearTimeout(this.timeOutVal);
    clearInterval(this.interVal);
    this.subs.unsubscribe();
  }

  goToSecondStep() {
    this.saveTest(false);
    if (this.saveFirstTab) {
      this.router.navigate(['/create-test', this.rncpTitle._id, 'second']);
    }
  }

  goToPreviousStep() {
    // Check current data is the same with saved data or changed
    if (this.testCreationService.isTestDataNotchanged()) {
      this.testCreationService.setPreviousButton(this.currentStep);
    } else {
      Swal.fire({
        type: 'warning',
        title: this.translate.instant('TMTC_S01.TITLE'),
        text: this.translate.instant('TMTC_S01.TEXT'),
        confirmButtonText: this.translate.instant('TMTC_S01.BUTTON_1'),
        showCancelButton: true,
        cancelButtonText: this.translate.instant('TMTC_S01.BUTTON_2'),
        allowOutsideClick: false,
      }).then((result) => {
        if (result && result.value) {
          // cancel user to go previous tab
        } else {
          this.testCreationService.setTestCreationData(this.testCreationService.getSavedTestCreationDataWithoutSubscribe());
          this.testCreationService.setPreviousButton(this.currentStep);
        }
      });
    }
  }

  goToNextStep() {
    // Check current data is the same with saved data or changed
    if (this.testCreationService.isTestDataNotchanged()) {
      this.testCreationService.setContinueButton(this.currentStep);
    } else {
      Swal.fire({
        type: 'warning',
        title: this.translate.instant('TMTC_S01.TITLE'),
        text: this.translate.instant('TMTC_S01.TEXT'),
        confirmButtonText: this.translate.instant('TMTC_S01.BUTTON_1'),
        showCancelButton: true,
        cancelButtonText: this.translate.instant('TMTC_S01.BUTTON_2'),
        allowOutsideClick: false,
      }).then((result) => {
        if (result && result.value) {
          // cancel user to go next tab
        } else {
          this.testCreationService.setTestCreationData(this.testCreationService.getSavedTestCreationDataWithoutSubscribe());
          this.testCreationService.setContinueButton(this.currentStep);
        }
      });
    }
  }

  goToTab(destination: string) {
    if (destination !== this.currentStep) {
      if (this.testCreationService.isTestDataNotchanged()) {
        this.router.navigate([destination], { relativeTo: this.route });
      } else {
        Swal.fire({
          type: 'warning',
          title: this.translate.instant('TMTC_S01.TITLE'),
          text: this.translate.instant('TMTC_S01.TEXT'),
          confirmButtonText: this.translate.instant('TMTC_S01.BUTTON_1'),
          showCancelButton: true,
          cancelButtonText: this.translate.instant('TMTC_S01.BUTTON_2'),
          allowOutsideClick: false,
        }).then((result) => {
          if (result && result.value) {
            // cancel user to go next tab
          } else {
            this.testCreationService.setTestCreationData(this.testCreationService.getSavedTestCreationDataWithoutSubscribe());
            this.router.navigate([destination], { relativeTo: this.route });
          }
        });
      }
    }
  }

  leaveTest() {
    if (this.testCreationService.isTestDataNotchanged()) {
      Swal.fire({
        title: 'Attention',
        text: this.translate.instant('TEST.MESSAGES.CLOSECONFIRM'),
        type: 'question',
        showCancelButton: true,
        cancelButtonText: this.translate.instant('NO'),
        allowEscapeKey: false,
        allowEnterKey: false,
        allowOutsideClick: false,
        confirmButtonText: this.translate.instant('YES'),
      }).then((result) => {

        if (result && result.value) {
          this.router.navigate(['/rncpTitles', this.titleId, 'dashboard']);
          this.testCreationService.resetTestCreationData();
          this.testCreationService.resetSavedTestCreationData();
        }
      });
    } else {
      Swal.fire({
        type: 'warning',
        title: this.translate.instant('TMTC_S01.TITLE'),
        text: this.translate.instant('TMTC_S01.TEXT'),
        confirmButtonText: this.translate.instant('TMTC_S01.BUTTON_1'),
        showCancelButton: true,
        cancelButtonText: this.translate.instant('TMTC_S01.BUTTON_2'),
        allowOutsideClick: false,
      }).then((result) => {
        if (result && result.value) {
          // cancel user to go next tab
        } else {
          this.testCreationService.setTestCreationData(this.testCreationService.getSavedTestCreationDataWithoutSubscribe());
          this.router.navigate(['/rncpTitles', this.titleId, 'dashboard']);
          this.testCreationService.resetTestCreationData();
          this.testCreationService.resetSavedTestCreationData();
        }
      });
    }
  }

  isLocationTrue(location: string) {
    if (location === this.currentStep) {
      return true;
    } else {
      return false;
    }
  }

  canDeactivate(): Observable<boolean> | Promise<boolean> | boolean {
    let validation = true;

    // The actual validation, by comparing data saved and current data in the form
    if (this.testCreationService.isTestDataNotchanged()) {
      validation = true;
    } else {
      validation = false;
    }

    // Passing the validation into the canExitService, if we return true, meaning user are allowed to go, otherwise user will stay
    if (!validation) {
      return new Promise((resolve, reject) => {
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
            resolve(false);
          } else {
            resolve(true);
          }
        });
      });
    } else {
      return true;
    }
  }

  canUserGoToNextStep() {
    let result = false;
    if (this.currentStep && this.currentStep === 'first') {
      if (this.firstTabValid && (this.tabPermission.secondTab || this.tabPermission.fourthTab)) {
        result = true;
      }
      return result;
    } else if (this.currentStep && this.currentStep === 'second') {
      if (this.tabPermission.thirdTab) {
        result = true;
      }
      return result;
    } else if (this.currentStep && this.currentStep === 'third') {
      if (this.tabPermission.fourthTab) {
        result = true;
      }
      return result;
    } else if (this.currentStep && this.currentStep === 'fourth') {
      if (this.tabPermission.fifthTab) {
        result = true;
      }
      return result;
    } else {
      return result;
    }
  }

  publishExpertiseTest() {
    this.testCreationService.CheckPhraseNameCompleted(this.testId).subscribe((resp) => {
      if (resp) {
        this.publishTest();
      } else {
        Swal.fire({
          type: 'error',
          title: this.translate.instant('TEST.TESTCREATE_S5.title'),
          html: this.translate.instant('TEST.TESTCREATE_S5.text'),
          confirmButtonText: this.translate.instant('TEST.TESTCREATE_S5.confirm_btn'),
        });
      }
    });
  }

  publishTest() {
    // check if title has acad dir and certifier admin user first
    const acadDirId = ['5a2e1ecd53b95d22c82f9554'];
    const certAdminId = ['5a2e1ecd53b95d22c82f9550'];
    const classId = this.firstTabData.class_id;

    const formParam = [];

    formParam.push(this.testCreationService.getAcadirOftitle(acadDirId, [this.titleId], classId));
    formParam.push(this.testCreationService.getCertAdminOftitle(certAdminId, [this.titleId]));

    this.subs.sink = forkJoin(formParam).subscribe((resp) => {

      if (resp && resp.length) {
        let acadDirData;
        let certAdminData;
        let acadDirCount = 0;
        const schoolList = [];
        const tempSchoolDataGenerateTask = _.cloneDeep(this.testCreationService.getSchoolDataWithoutSubscribe());
        const schoolDataGenerateTask = tempSchoolDataGenerateTask.map((school) => school._id);


        let schoolWithNoAcadDir = [];

        let isAcadDirExist = false;
        let isCertAdminExist = false;

        // Validate academic director
        if (resp[0]) {
          acadDirData = resp[0];
          if (acadDirData && acadDirData.length) {
            acadDirData.forEach((user) => {
              const entities = user.entities;
              if (user.entities && user.entities.length) {
                user.entities.forEach((entity) => {
                  if (
                    entity &&
                    entity.school &&
                    entity.school._id &&
                    !schoolList.includes(entity.school._id) &&
                    schoolDataGenerateTask.includes(entity.school._id) &&
                    entity.type &&
                    entity.type._id === '5a2e1ecd53b95d22c82f9554' &&
                    entity.assigned_rncp_title &&
                    entity.assigned_rncp_title._id === this.titleId &&
                    entity.class &&
                    entity.class._id === classId
                  ) {


                    schoolList.push(entity.school._id);
                    acadDirCount++;
                  }
                });
              }
            });
          }

          const schoolData = this.testCreationService.getSchoolDataWithoutSubscribe();


          if (schoolList && schoolData && schoolList.length === schoolData.length) {
            isAcadDirExist = true;
          } else if (schoolList && schoolData && schoolList.length !== schoolData.length) {
            schoolWithNoAcadDir = this.testCreationService
              .getSchoolDataWithoutSubscribe()
              .filter((school) => !schoolList.includes(school._id));

          }
        }

        // Validate certifier admin
        if (resp[1]) {
          certAdminData = resp[1];
          if (certAdminData.length) {
            isCertAdminExist = true;
          }
        }

        // after all validation done, check the result then decide to allow publish or not
        if (isAcadDirExist && isCertAdminExist) {
          if (this.testCreationService.isTestDataNotchanged()) {
            // check if data is changed but not saved
            this.testCreationService.setPublishButton(this.currentStep);
          } else {
            Swal.fire({
              type: 'warning',
              title: this.translate.instant('TMTC_S01.TITLE'),
              text: this.translate.instant('TMTC_S01.TEXT'),
              confirmButtonText: this.translate.instant('TMTC_S01.BUTTON_1'),
              showCancelButton: true,
              cancelButtonText: this.translate.instant('TMTC_S01.BUTTON_2'),
              allowOutsideClick: false,
            }).then((result) => {
              if (result && result.value) {
                // cancel user from leaving
              } else {
                this.testCreationService.setTestCreationData(this.testCreationService.getSavedTestCreationDataWithoutSubscribe());
                this.testCreationService.setPublishButton(this.currentStep);
              }
            });
          }
        } else {
          const classid = this.firstTabData.class_id;
          this.subs.sink = this.rncpTitlesService.getClassNameFromId(classid).subscribe((response) => {


            let htmlText = this.translate.instant('TEST_PUBLISH_ERROR.TEXT_NO_CERT_HEAD');

            if (!isCertAdminExist) {
              htmlText += '<li style="text-align: start">' + this.translate.instant('TEST_PUBLISH_ERROR.TEXT_NO_ACAD_CERT') + '</li>';
            }

            if (!isAcadDirExist && schoolWithNoAcadDir && schoolWithNoAcadDir.length) {
              schoolWithNoAcadDir.forEach((school) => {
                htmlText +=
                  '<li style="text-align: start">' +
                  this.translate.instant('TEST_PUBLISH_ERROR.TEXT_NO_ACAD_DIR', {
                    schoolName: school.short_name,
                    className: response.name,
                  }) +
                  '</li>';
              });
            }

            htmlText += this.translate.instant('TEST_PUBLISH_ERROR.TEXT_NO_ACAD_CLOSE');

            swal
              .fire({
                type: 'error',
                title: this.translate.instant('TEST_PUBLISH_ERROR.Sorry'),
                html: htmlText,
                confirmButtonText: this.translate.instant('TEST_PUBLISH_ERROR.CONFIRM_TEXT'),
                allowOutsideClick: false,
                allowEscapeKey: false,
                allowEnterKey: false,
              })
              .then((result) => {
                this.router.navigate(['/rncpTitles', this.rncpTitle._id, 'dashboard']);
              });
          });
        }
      }
    });
  }

  getTaskProgressText() {
    if (this.firstTabData.is_published) {
      const testProgress = this.testCreationService.getTestProgressDataWithoutSubscribe();

      if (testProgress) {
        if (testProgress.validate && testProgress.validate.length) {
          return `${this.translate.instant('TEST.Current Progress')} : ${testProgress.validate_done.length} ${this.translate.instant(
            'TEST.of',
          )} ${testProgress.validate.length} ${this.translate.instant('TEST.TASKDONE.Validate Task Done')}`;
        } else if (testProgress.mark_entry && testProgress.mark_entry.length) {
          return `${this.translate.instant('TEST.Current Progress')} : ${testProgress.mark_entry_done.length} ${this.translate.instant(
            'TEST.of',
          )} ${testProgress.mark_entry.length} ${this.translate.instant('TEST.TASKDONE.Mark Entry Task Done')}`;
        } else if (testProgress.assign_corrector && testProgress.assign_corrector.length) {

          return `${this.translate.instant('TEST.Current Progress')} : ${
            testProgress.assign_corrector_done.length
          } ${this.translate.instant('TEST.of')} ${testProgress.assign_corrector.length} ${this.translate.instant(
            'TEST.TASKDONE.Assign Corrector Task Done',
          )}`;
        } else if (testProgress.create_group_done && this.firstTabData.group_test && testProgress.create_group.length) {
          let schools = '';
          testProgress.create_group_done.forEach((sch, schIdx) => {
            schools = schools + sch.short_name;
            if (schIdx < testProgress.create_group_done.length - 1) {
              schools = schools + ', ';
            }
          });
          return `${this.translate.instant('TEST.Current Progress')} : ${testProgress.create_group_done.length}
          ${this.translate.instant('TEST.of')} ${testProgress.create_group.length}
          ${this.translate.instant('TEST.TASKDONE.Create Group Task Done')}
          ${testProgress.create_group_done.length ? ':' : ''} ${schools}`;
        } else {
          if (testProgress.assign_corrector.length) {
            return `${this.translate.instant('TEST.Current Progress')} : 0 ${this.translate.instant('TEST.of')} ${
              testProgress.assign_corrector.length
            } ${this.translate.instant('TEST.TASKDONE.Assign Corrector Task Done')}`;
          } else {
            return '';
          }
        }
      }
      return '';
    }
  }
}
