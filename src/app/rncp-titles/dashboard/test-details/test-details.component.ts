import { Component, Input, OnInit, Inject, ViewEncapsulation, OnDestroy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import swal from 'sweetalert2';
import { MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ViewDialogComponent } from './view-dialog/view-dialog.component';
import { TestCreationService } from 'app/service/test/test-creation.service';
import { TestCreationRespData, SchoolTestDateResp, TestCreationPayloadData } from 'app/test/test-creation/test-creation.model';
import { TestService } from '../../../service/test/test.service';
import { SubSink } from 'subsink';
import { isString, isNumber } from 'util';
import { AuthService } from 'app/service/auth-service/auth.service';
import { UtilityService } from 'app/service/utility/utility.service';
import { MoveFolderDialogComponent } from '../move-folder-dialog/move-folder-dialog.component';
import { AcademicKitService } from 'app/service/rncpTitles/academickit.service';
import Swal from 'sweetalert2';
import { TranslateService } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';
import { PermissionService } from 'app/service/permission/permission.service';

@Component({
  selector: 'ms-test-details',
  templateUrl: './test-details.component.html',
  styleUrls: ['./test-details.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class TestDetailsComponent implements OnInit, OnDestroy {
  rncpId: String = '';
  test: any;
  testProgress: any;
  testCanBeDeleted = false;
  contextmenu = false;
  contextmenuX = 0;
  contextmenuY = 0;
  user: any;
  isUserADMTC: boolean;

  isWaitingForResponse = false;
  tempTest: any;
  testId: string;
  categoryId: string;
  private subs = new SubSink();
  private timeOutVal: any;
  // public data: any;
  constructor(
    private translate: TranslateService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogref: MatDialogRef<ViewDialogComponent>,
    private router: Router,
    public dialog: MatDialog,
    private userService: AuthService,
    private util: UtilityService,
    private testCreationService: TestCreationService,
    private testService: TestService,
    private acadKitService: AcademicKitService,
    public permissionService: PermissionService
  ) {}

  ngOnInit() {
    this.isUserADMTC = this.util.isUserEntityADMTC();
    this.user = this.userService.getLocalStorageUser();
    this.rncpId = this.data.rncpId;
    this.getTestData();
  }

  getTestData() {
    const paramFork = [];
    this.isWaitingForResponse = true;
    paramFork.push(this.testCreationService.getTestDetail(this.data._id));
    paramFork.push(this.testCreationService.getTestProgressTestDetail(this.data._id));
    this.subs.sink = forkJoin(paramFork).subscribe(resp => {

      this.isWaitingForResponse = false;
      if (resp && resp.length) {
        // test detail fetch
        if (resp[0]) {
          this.test = resp[0];
          if (this.test.parent_rncp_title && this.test.parent_rncp_title._id) {
            this.test.parent_rncp_title = this.test.parent_rncp_title._id;
          }
          if (this.test.parent_category && this.test.parent_category._id) {
            this.test.parent_category = this.test.parent_category._id;
          }
        }

        // test progress fetch
        if (resp[1]) {
          this.testProgress = resp[1];

          this.testCanBeDeleted = this.isTestDeletable();
        }
      }
    })
    // this.subs.sink = this.testCreationService.getTestDetail(this.data._id).subscribe((response) => {
    //   this.test = response;
    //   if (this.test.parent_rncp_title && this.test.parent_rncp_title._id) {
    //     this.test.parent_rncp_title = this.test.parent_rncp_title._id;
    //   }
    //   if (this.test.parent_category && this.test.parent_category._id) {
    //     this.test.parent_category = this.test.parent_category._id;
    //   }
    // });
  }

  onDelete() {
    if (this.test?.is_published && !this.testCanBeDeleted) {
      Swal.fire({
        type: 'warning',
        title: this.translate.instant('test_creation.DELETE_TASK_S1.TITLE'),
        html: this.translate.instant('test_creation.DELETE_TASK_S1.TEXT'),
        confirmButtonText: this.translate.instant('test_creation.DELETE_TASK_S1.BUTTON'),
      })
    } else {
      let timeDisabled = 5;
      Swal.fire({
        title: this.translate.instant('DASHBOARD_DELETE.deletedTitle'),
        html: this.translate.instant('this action will delete test !'),
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
      }).then((result) => {
        clearTimeout(this.timeOutVal);
        if (result.value) {
          this.subs.sink = this.testCreationService.deleteTest(this.test._id).subscribe((response) => {
            if (response && response._id) {
              swal.fire({
                title: this.translate.instant('Deleted!'),
                html: this.translate.instant('Your test has been deleted.'),
                type: 'success',
              }).then(() => {
                this.acadKitService.refreshAcadKit(true);
                this.dialogref.close(true);
              });
            }
          });
        } else if (result.dismiss === swal.DismissReason.cancel) {
          swal.fire({
            title: this.translate.instant('Canceled'),
            html: this.translate.instant('Your decision has been canceled'),
            type: 'error',
          }).then(() => this.dialogref.close());
        }
      });
    }
  }

  onEdit() {
    if (this.test && this.test.parent_rncp_title) {
      this.testCreationService.resetTestCreationData();
      this.testCreationService.resetSavedTestCreationData();
      this.dialogref.close();
      this.router.navigate([
        '/create-test',
        this.test.parent_rncp_title,
        { categoryId: this.test.parent_category, testId: this.test._id },
        'first',
      ]);
    }
    // this.router.navigate(['/create-test', , 'first']);
  }

  editInNewTab() {
    if (this.test && this.test.parent_rncp_title) {
      window.open(`./create-test/${this.test.parent_rncp_title};categoryId=${this.test.parent_category};testId=${this.test._id}/first`,
      '_blank');
    }
    // this.router.navigate(['/create-test', , 'first']);
  }

  convertTestCreationRespData(resp: TestCreationRespData) {
    const testData: TestCreationPayloadData = JSON.parse(JSON.stringify(resp));
    // convert from object to string. example: class: { _id: 'abc123' } => class: 'abc123'
    testData['class'] = resp.class ? resp.class._id : '';
    testData['block_of_competence_condition_id'] = resp.block_of_competence_condition_id ? resp.block_of_competence_condition_id._id : '';
    testData['subject_id'] = resp.subject_id ? resp.subject_id._id : '';
    testData['evaluation_id'] = resp.evaluation_id ? resp.evaluation_id._id : '';
    if (resp.schools.length > 0) {
      resp.schools.forEach((schoolTestDate: SchoolTestDateResp, index: number) => {
        testData['schools'][index]['school_id'] = schoolTestDate.school_id._id;
      });
    }
    return testData;
  }

  onView() {
    this.dialog.open(ViewDialogComponent, {
      width: '1200px',
      disableClose: true,
      height: '600px',
      data: this.test,
    });
  }

  closeDialog(object?: any) {
    this.dialogref.close();
  }

  moveTest() {
    this.subs.sink = this.dialog
      .open(MoveFolderDialogComponent, {
        disableClose: true,
        width: '600px',
        data: {
          rncpTitle: this.test.parent_rncp_title,
          classId: this.test.class_id._id,
          itemId: this.test._id,
          itemName: this.test.name,
          type: 'TEST',
        },
      })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          this.acadKitService.refreshAcadKit(true);
          this.dialogref.close(true);
        }
      });
  }

  // activates the menu with the coordinates
  onrightClick(event) {
    this.contextmenuX = event.clientX
    this.contextmenuY = event.clientY
    this.contextmenu = true;
  }

 // disables the menu
  disableContextMenu() {
    this.contextmenu = false;
  }
  isTestDeletable(): boolean {
    let result = true;
    if (this.test) {
      if (this.test.is_published && this.testProgress) {
        if (this.testProgress.assign_corrector_done && this.testProgress.assign_corrector_done.length) {
          result = false;
          return result;
        }
        if (this.testProgress.create_group_done && this.testProgress.create_group_done.length) {
          result = false;
          return result;
        }
        if (this.testProgress.mark_entry_done && this.testProgress.mark_entry_done.length) {
          result = false;
          return result;
        }
        if (this.testProgress.validate_done && this.testProgress.validate_done.length) {
          result = false;
          return result;
        }
        if (this.testProgress.document_expected_done_count && this.testProgress.document_expected_done_count.length) {
          for (const uploadTask of this.testProgress.document_expected_done_count) {
            if (uploadTask.count && uploadTask.document_expected_id) {
              result = false;
              break;
            }
          }
        }
      } else {
        result = true;
      }
    }

    return result;
  }

  ngOnDestroy() {
    clearTimeout(this.timeOutVal);
    this.subs.unsubscribe();
  }
}
