import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import { BehaviorSubject, Observable } from 'rxjs';
import { Apollo } from 'apollo-angular';
import gql from 'graphql-tag';
import { map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';
import { Cacheable } from 'ngx-cacheable';

@Injectable({
  providedIn: 'root',
})
export class PermissionService {
  userData;
  entityData;
  permissionData;
  isLoggedIn;

  constructor(public httpClient: HttpClient, private apollo: Apollo, private translate: TranslateService) {}

  // Get data from local storage
  getLocalStorageUser() {
    if (!this.userData) {
      this.userData = JSON.parse(localStorage.getItem('userProfile'));
      this.isLoggedIn = this.userData ? true : false;
    }
    return this.userData;
  }

  getEntityUser() {
    if (!this.entityData) {
      this.entityData =
        this.getLocalStorageUser() && this.getLocalStorageUser().entities[0] ? this.getLocalStorageUser().entities[0] : null;
    }
    return this.entityData;
  }

  getEntityPermission() {
    if (!this.permissionData) {
      this.permissionData = this.getEntityUser() ? this.getEntityUser().type.usertype_permission_id : null;
    }
    return this.permissionData;
  }

  resetServiceData() {
    this.userData = null;
    this.entityData = null;
    this.permissionData = null;
  }

  // Permission to show menu
  showMenu(path) {
    const data = this.getEntityPermission();
    return _.get(data, path);
  }

  // Start of Pending Task and Calendar Permission in Title Dashboard
  showPendingTaskPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'rncp_title.pending_task.show_perm');
  }

  editPendingTaskPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'rncp_title.pending_task.edit_perm');
  }

  showCalendarPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'rncp_title.calendar.show_perm');
  }

  addCalendarPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'rncp_title.calendar.add_perm');
  }

  editCalendarPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'rncp_title.calendar.edit_perm');
  }

  deleteCalendarPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'rncp_title.calendar.delete_perm');
  }

  // Start of Acad Kit Permission
  showAcadKitPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'rncp_title.acad_kit.show_perm');
  }

  editAcadKitNot06Perm() {
    const data = this.getEntityPermission();
    return _.get(data, 'rncp_title.acad_kit.edit_perm');
  }

  editAcadKit06Perm() {
    const data = this.getEntityPermission();
    return false;
    // return _.get(data, 'rncp_title.acad_kit.edit_06_perm');
  }

  showAcadKitFolderOnePerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'rncp_title.acad_kit.folder_permissions.folder_one.show_perm');
  }

  showAcadKitFolderTwoPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'rncp_title.acad_kit.folder_permissions.folder_two.show_perm');
  }

  showAcadKitFolderThreePerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'rncp_title.acad_kit.folder_permissions.folder_three.show_perm');
  }

  showAcadKitFolderFourPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'rncp_title.acad_kit.folder_permissions.folder_four.show_perm');
  }

  showAcadKitFolderFivePerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'rncp_title.acad_kit.folder_permissions.folder_five.show_perm');
  }

  showAcadKitFolderSixPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'rncp_title.acad_kit.folder_permissions.folder_six.show_perm');
  }

  showAcadKitFolderSevenPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'rncp_title.acad_kit.folder_permissions.folder_seven.show_perm');
  }

  showAcadKitFolderOthersPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'rncp_title.acad_kit.folder_permissions.folder_others.show_perm');
  }

  // Start of School Table Permission
  showSchoolTablePerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.list_of_schools.school_table.show_perm');
  }

  addSchoolTablePerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.list_of_schools.school_table.add_perm');
  }

  editchoolTablePerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.list_of_schools.school_table.actions.edit_perm');
  }

  sendMailSchoolTablePerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.list_of_schools.school_table.actions.send_email');
  }

  // Start of school identity permission inside school detail
  showSchoolIdentityPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.list_of_schools.school_details.show_perm');
  }

  editSchoolIdentityPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.list_of_schools.school_details.edit_perm');
  }

  showConnectedRncpTablePerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.list_of_schools.school_details.connected_rncp.show_perm');
  }

  addConnectedRncpTablePerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.list_of_schools.school_details.connected_rncp.add_perm');
  }

  editConnectedRncpTablePerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.list_of_schools.school_details.connected_rncp.actions.edit_perm');
  }

  deleteConnectedRncpTablePerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.list_of_schools.school_details.connected_rncp.actions.delete_perm');
  }

  // Start of school staff permission inside school detail
  showSchoolStaffPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.list_of_schools.school_staff.show_perm');
  }

  addStaffSchoolStaffPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.list_of_schools.school_staff.add_user');
  }

  exportStaffSchoolStaffPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.list_of_schools.school_staff.export_button');
  }

  incignitoActionSchoolStaffPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.list_of_schools.school_staff.school_staff_table.actions.incognito');
  }

  errorMailActionSchoolStaffPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.list_of_schools.school_staff.school_staff_table.actions.error_email');
  }

  editActionSchoolStaffPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.list_of_schools.school_staff.school_staff_table.actions.edit_perm');
  }

  deleteActionSchoolStaffPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.list_of_schools.school_staff.school_staff_table.actions.delete_perm');
  }

  sendMailActionSchoolStaffPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.list_of_schools.school_staff.school_staff_table.actions.send_email');
  }

  // Start of student table permission inside school detail
  showStudentTableInSchoolPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.list_of_schools.student_table.show_perm');
  }

  addStudentInStudentTableInSchoolPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.list_of_schools.student_table.add_perm');
  }

  importStudentInStudentTableInSchoolPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.list_of_schools.student_table.import_student');
  }

  exportListOfStudentInStudentTableInSchoolPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.list_of_schools.student_table.export_list_of_student');
  }

  exportESStudentInStudentTableInSchoolPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.list_of_schools.student_table.export_ES');
  }

  thumbsupActionStudentTableInSchoolPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.list_of_schools.student_table.actions.thumbsup');
  }

  resignActionStudentTableInSchoolPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.list_of_schools.student_table.actions.resignation');
  }

  editActionStudentTableInSchoolPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.list_of_schools.student_table.actions.edit_perm');
  }

  sendMailActionStudentTableInSchoolPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.list_of_schools.student_table.actions.send_email');
  }

  // Start of deactivated student table permission inside school detail
  showDeactivatedStudentTableInSchoolPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.list_of_schools.deactivate_student_table.show_perm');
  }

  exportDeactivatedStudentTableInSchoolPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.list_of_schools.deactivate_student_table.export_perm');
  }

  reactiveDeactivatedStudentTableInSchoolPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.list_of_schools.deactivate_student_table.reactive_perm');
  }

  // Start of student card permission inside school detail
  showStudentCardPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.list_of_schools.student_card.show_perm');
  }

  addStudentInStudentCardPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.list_of_schools.student_card.add_perm');
  }

  importStudentInStudentCardPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.list_of_schools.student_card.import_student');
  }

  importCompanyInStudentCardPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.list_of_schools.student_card.import_student_company');
  }

  showParentIdentityTabStudentCardPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.list_of_schools.student_card.identity.show_perm');
  }

  showCourseTabStudentCardPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.list_of_schools.student_card.identity.course.show_perm');
  }

  editCourseTabStudentCardPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.list_of_schools.student_card.identity.course.edit_perm');
  }

  showIdentityTabStudentCardPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.list_of_schools.student_card.identity.identity.show_perm');
  }

  editIdentityTabStudentCardPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.list_of_schools.student_card.identity.identity.edit_perm');
  }

  showParentTabStudentCardPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.list_of_schools.student_card.identity.parent.show_perm');
  }

  editParentTabStudentCardPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.list_of_schools.student_card.identity.parent.edit_perm');
  }

  showDiplomaTabStudentCardPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.list_of_schools.student_card.identity.diploma.show_perm');
  }

  showParentAdmissionTabStudentCardPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.list_of_schools.student_card.admission.show_perm');
  }

  showAcadJourneyTabStudentCardPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.list_of_schools.student_card.admission.academic_journey.show_perm');
  }

  showCertificationRuleTabStudentCardPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.list_of_schools.student_card.admission.certification_rule.show_perm');
  }

  showParentCompanyTabStudentCardPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.list_of_schools.student_card.company.show_perm');
  }

  showCompanyTabStudentCardPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.list_of_schools.student_card.company.company.show_perm');
  }

  editCompanyTabStudentCardPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.list_of_schools.student_card.company.company.edit_perm');
  }

  showJobDescTabStudentCardPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.list_of_schools.student_card.company.job_desc.show_perm');
  }

  showProblematicTabStudentCardPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.list_of_schools.student_card.company.problematic.show_perm');
  }

  showMentorEvalTabStudentCardPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.list_of_schools.student_card.company.mentor_evaluation.show_perm');
  }

  showParentDocumentTabStudentCardPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.list_of_schools.student_card.document.show_perm');
  }

  editParentDocumentTabStudentCardPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.list_of_schools.student_card.document.edit_perm');
  }

  showMyDocumentTabStudentCardPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.list_of_schools.student_card.document.my_document.show_perm');
  }

  editMyDocumentTabStudentCardPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.list_of_schools.student_card.document.my_document.edit_perm');
  }

  showDocumentTabStudentCardPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.list_of_schools.student_card.document.published_document.show_perm');
  }

  showParentCertificationTabStudentCardPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.list_of_schools.student_card.certification.show_perm');
  }

  showCertificationTabStudentCardPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.list_of_schools.student_card.certification.certification.show_perm');
  }

  showSubjectCertTabStudentCardPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.list_of_schools.student_card.certification.subject_of_cert.show_perm');
  }

  showDetailCertificationTabStudentCardPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.list_of_schools.student_card.certification.details_of_certification.show_perm');
  }

  showEmpSurveyTabStudentCardPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.list_of_schools.student_card.emp_survey.show_perm');
  }

  showRetakeDuringYearTabStudentCardPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.list_of_schools.student_card.student_details.retake_during_year.show_perm');
  }

  showTaskTabStudentCardPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.list_of_schools.student_card.task.show_perm');
  }

  addTaskTabStudentCardPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.list_of_schools.student_card.task.add_task');
  }

  deleteTaskTabStudentCardPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.list_of_schools.student_card.task.actions.delete_task');
  }

  editTaskTabStudentCardPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.list_of_schools.student_card.task.actions.edit_perm');
  }

  showCommentTabStudentCardPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.list_of_schools.student_card.comment.show_perm');
  }

  showMailboxTabStudentCardPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.list_of_schools.student_card.mailbox.show_perm');
  }

  showInboxInMailboxTabStudentCardPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.list_of_schools.student_card.mailbox.inbox');
  }

  showSentInMailboxTabStudentCardPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.list_of_schools.student_card.mailbox.sent');
  }

  showImportantInMailboxTabStudentCardPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.list_of_schools.student_card.mailbox.important');
  }

  showDraftInMailboxTabStudentCardPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.list_of_schools.student_card.mailbox.draft');
  }

  showTrashInMailboxTabStudentCardPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.list_of_schools.student_card.mailbox.trash');
  }

  downloadEmailInMailboxTabStudentCardPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.list_of_schools.student_card.mailbox.actions.download_email');
  }

  urgentMessageInMailboxTabStudentCardPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.list_of_schools.student_card.mailbox.actions.urgent_message');
  }

  setImportantMailboxTabStudentCardPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.list_of_schools.student_card.mailbox.actions.important');
  }

  deleteEmailMailBoxTabStudentCardPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.list_of_schools.student_card.mailbox.actions.delete');
  }

  // Start of Group of School Permission
  showGroupOfSchoolPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.group_of_schools.show_perm');
  }

  addGroupOfSchoolPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.group_of_schools.add_perm');
  }

  editGroupOfSchoolPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.group_of_schools.actions.edit_perm');
  }

  deleteGroupOfSchoolPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.group_of_schools.actions.delete_perm');
  }

  // Start of Activated Student table permission
  showStudentTablePerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'students.active_students.show_perm');
  }

  transfertActionInStudentTablePerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'students.active_students.student_table.transfer_student');
  }

  exportListOfStudentInTablePerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'students.active_students.student_table.export_list_of_student');
  }

  exportESInStudentTablePerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'students.active_students.student_table.export_ES');
  }

  editActiontInStudentTablePerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'students.active_students.student_table.actions.edit_perm');
  }

  thumbsupActionInStudentTablePerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'students.active_students.student_table.actions.thumbsup');
  }

  incignitoActionInStudentTablePerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'students.active_students.student_table.actions.incognito');
  }

  errorMailActionInStudentTablePerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'students.active_students.student_table.actions.error_email');
  }

  sendMailActionInStudentTablePerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'students.active_students.student_table.actions.send_email');
  }

  resignationActionInStudentTablePerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'students.active_students.student_table.actions.resignation_perm');
  }

  deactiveActionInStudentTablePerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'students.active_students.student_table.actions.deactive_perm');
  }

  viewActionInStudentTablePerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'students.active_students.student_table.actions.view_perm');
  }

  // Start of Deactivated Student table permission
  showStudentTablePermDeactivated() {
    const data = this.getEntityPermission();
    return _.get(data, 'students.deactivated_students.show_perm');
  }

  exportListOfStudentInTablePermDeactivated() {
    const data = this.getEntityPermission();
    return _.get(data, 'students.deactivated_students.student_table.export_list_of_student');
  }

  exportESInStudentTablePermDeactivated() {
    const data = this.getEntityPermission();
    return _.get(data, 'students.deactivated_students.student_table.export_ES');
  }

  editActiontInStudentTablePermDeactivated() {
    const data = this.getEntityPermission();
    return _.get(data, 'students.deactivated_students.student_table.actions.edit_perm');
  }

  thumbsupActionInStudentTablePermDeactivated() {
    const data = this.getEntityPermission();
    return _.get(data, 'students.deactivated_students.student_table.actions.thumbsup');
  }

  incignitoActionInStudentTablePermDeactivated() {
    const data = this.getEntityPermission();
    return _.get(data, 'students.deactivated_students.student_table.actions.incognito');
  }

  errorMailActionInStudentTablePermDeactivated() {
    const data = this.getEntityPermission();
    return _.get(data, 'students.deactivated_students.student_table.actions.error_email');
  }

  reactivateActionInStudentTablePermDeactivated() {
    const data = this.getEntityPermission();
    return _.get(data, 'students.deactivated_students.student_table.actions.reactivation_perm');
  }

  sendMailActionInStudentTablePermDeactivated() {
    const data = this.getEntityPermission();
    return _.get(data, 'students.deactivated_students.student_table.actions.send_email');
  }

  resignationActionInStudentTablePermDeactivated() {
    const data = this.getEntityPermission();
    return _.get(data, 'students.deactivated_students.student_table.actions.resignation_perm');
  }

  deactiveActionInStudentTablePermDeactivated() {
    const data = this.getEntityPermission();
    return _.get(data, 'students.deactivated_students.student_table.actions.deactive_perm');
  }

  viewActionInStudentTablePermDeactivated() {
    const data = this.getEntityPermission();
    return _.get(data, 'students.deactivated_students.student_table.actions.view_perm');
  }

  // Start of Completed table permission
  showStudentTablePermCompleted() {
    const data = this.getEntityPermission();
    return _.get(data, 'students.completed_students.show_perm');
  }

  exportListOfStudentInTablePermCompleted() {
    const data = this.getEntityPermission();
    return _.get(data, 'students.completed_students.student_table.export_list_of_student');
  }

  exportESInStudentTablePermCompleted() {
    const data = this.getEntityPermission();
    return _.get(data, 'students.completed_students.student_table.export_ES');
  }

  editActiontInStudentTablePermCompleted() {
    const data = this.getEntityPermission();
    return _.get(data, 'students.completed_students.student_table.actions.edit_perm');
  }

  thumbsupActionInStudentTablePermCompleted() {
    const data = this.getEntityPermission();
    return _.get(data, 'students.completed_students.student_table.actions.thumbsup');
  }

  incignitoActionInStudentTablePermCompleted() {
    const data = this.getEntityPermission();
    return _.get(data, 'students.completed_students.student_table.actions.incognito');
  }

  errorMailActionInStudentTablePermCompleted() {
    const data = this.getEntityPermission();
    return _.get(data, 'students.completed_students.student_table.actions.error_email');
  }

  sendMailActionInStudentTablePermCompleted() {
    const data = this.getEntityPermission();
    return _.get(data, 'students.completed_students.student_table.actions.send_email');
  }

  resignationActionInStudentTablePermCompleted() {
    const data = this.getEntityPermission();
    return _.get(data, 'students.completed_students.student_table.actions.resignation_perm');
  }

  deactiveActionInStudentTablePermCompleted() {
    const data = this.getEntityPermission();
    return _.get(data, 'students.completed_students.student_table.actions.deactive_perm');
  }

  viewActionInStudentTablePermCompleted() {
    const data = this.getEntityPermission();
    return _.get(data, 'students.completed_students.student_table.actions.view_perm');
  }

  // Start of Suspended Student table permission
  showStudentTablePermSuspended() {
    const data = this.getEntityPermission();
    return _.get(data, 'students.suspended_students.show_perm');
  }

  exportListOfStudentInTablePermSuspended() {
    const data = this.getEntityPermission();
    return _.get(data, 'students.suspended_students.student_table.export_list_of_student');
  }

  exportESInStudentTablePermSuspended() {
    const data = this.getEntityPermission();
    return _.get(data, 'students.suspended_students.student_table.export_ES');
  }

  editActiontInStudentTablePermSuspended() {
    const data = this.getEntityPermission();
    return _.get(data, 'students.suspended_students.student_table.actions.edit_perm');
  }

  thumbsupActionInStudentTablePermSuspended() {
    const data = this.getEntityPermission();
    return _.get(data, 'students.suspended_students.student_table.actions.thumbsup');
  }

  incignitoActionInStudentTablePermSuspended() {
    const data = this.getEntityPermission();
    return _.get(data, 'students.suspended_students.student_table.actions.incognito');
  }

  errorMailActionInStudentTablePermSuspended() {
    const data = this.getEntityPermission();
    return _.get(data, 'students.suspended_students.student_table.actions.error_email');
  }

  reactivateActionInStudentTablePermSuspended() {
    const data = this.getEntityPermission();
    return _.get(data, 'students.suspended_students.student_table.actions.reactivation_perm');
  }

  sendMailActionInStudentTablePermSuspended() {
    const data = this.getEntityPermission();
    return _.get(data, 'students.suspended_students.student_table.actions.send_email');
  }

  resignationActionInStudentTablePermSuspended() {
    const data = this.getEntityPermission();
    return _.get(data, 'students.suspended_students.student_table.actions.resignation_perm');
  }

  deactiveActionInStudentTablePermSuspended() {
    const data = this.getEntityPermission();
    return _.get(data, 'students.suspended_students.student_table.actions.deactive_perm');
  }

  // Start of Student Card permission
  showStudentCardHeaderPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'students.student_card.show_perm');
  }

  editActiontInStudentCardHeaderPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'students.student_card.actions.edit_perm');
  }

  thumbsupActionInStudentCardHeaderPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'students.student_card.actions.thumbsup');
  }

  incignitoActionInStudentCardHeaderPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'students.student_card.actions.incognito');
  }

  errorMailActionInStudentCardHeaderPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'students.student_card.actions.error_email');
  }

  sendMailToMentorActionInStudentCardHeaderPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'students.student_card.actions.send_email_mentor');
  }

  sendMailToStudentActionInStudentCardHeaderPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'students.student_card.actions.send_email_student');
  }

  sendMailToAcadirActionInStudentCardHeaderPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'students.student_card.actions.send_email_acadir');
  }

  resignationActionInStudentCardHeaderPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'students.student_card.actions.resignation_perm');
  }

  resignationDetailActionInStudentCardHeaderPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'students.student_card.actions.resignation_detail');
  }

  deactiveActionInStudentCardHeaderPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'students.student_card.actions.deactive_perm');
  }

  viewActionInStudentCardHeaderPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'students.student_card.actions.view_perm');
  }

  reactivationActionInStudentCardHeaderPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'students.student_card.actions.reactivation_perm');
  }

  renewPassActionInStudentCardHeaderPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'students.student_card.actions.renew_pass');
  }

  // Start of Companies Permission
  showCompaniesTablePerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'companies.show_perm');
  }

  addcompanyPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'companies.add_company');
  }

  deleteCompanyPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'companies.delete_perm');
  }

  showsCompanyDetailsTabPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'companies.company_details.company_detail.show_perm');
  }

  editCompanyDetailsTabPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'companies.company_details.company_detail.edit_perm');
  }
  revisionCompanyDetailsTabPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'companies.company_details.company_detail.revision_perm');
  }

  showsCompanyStaffTabPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'companies.company_branch.company_staff.show_perm');
  }

  addStaffInCompanyStaffTabPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'companies.company_branch.company_staff.add_perm');
  }

  editActionInCompanyStaffTabPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'companies.company_branch.company_staff.actions.edit_perm');
  }

  sendMailActionInCompanyStaffTabPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'companies.company_branch.company_staff.actions.send_email');
  }

  deleteActionInCompanyStaffTabPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'companies.company_branch.company_staff.actions.delete_perm');
  }

  showsConnectedSchoolTabPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'companies.company_branch.school_connected.show_perm');
  }

  connectSchoolInConnectedSchoolTabPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'companies.company_branch.school_connected.connect_school');
  }

  connectMentorActionInConnectedSchoolTabPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'companies.company_branch.school_connected.actions.connect_mentor_to_School');
  }

  deleteActionInConnectedSchoolTabPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'companies.company_branch.school_connected.actions.delete_perm');
  }

  // Start of Task Table Permission
  showTaskTablePerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'tasks.show_perm');
  }

  addTaskInTaskTablePerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'tasks.add_task');
  }

  internalTaskInTaskTablePerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'tasks.internal_task');
  }

  addTestTaskInTaskTablePerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'tasks.add_test_task');
  }

  deleteTaskActionInTaskTablePerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'tasks.actions.delete_task');
  }

  editTaskActionInTaskTablePerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'tasks.actions.edit_perm');
  }

  // Start of mailbox permission
  showMailboxTablePerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'mailbox.show_perm');
  }

  composeActionInTaskTablePerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'mailbox.actions.compose');
  }

  sendGroupMailActionInTaskTablePerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'mailbox.actions.mail_to_group');
  }

  urgentMessageActionInTaskTablePerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'mailbox.actions.urgent_message');
  }

  downloadMailActionInTaskTablePerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'mailbox.actions.download_email');
  }

  deleteMailActionInTaskTablePerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'mailbox.actions.delete');
  }

  importantMailActionInTaskTablePerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'mailbox.actions.important');
  }

  // Start of Users Table permission
  showUsersTablePerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'users.show_perm');
  }

  addUserInUsersTablePerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'users.add_perm');
  }

  exportUsersTablePerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'users.export');
  }

  exportGroupsShowPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'export.groups.show_perm');
  }

  exportGroupsEditPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'export.groups.edit_perm');
  }

  exportGroupsHomePage() {
    const data = this.getEntityPermission();
    return _.get(data, 'export.groups.home_page');
  }

  exportStatusUpdateShowPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'export.status_update.show_perm');
  }

  exportStatusUpdateEditPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'export.status_update.edit_perm');
  }

  exportStatusUpdateHomePage() {
    const data = this.getEntityPermission();
    return _.get(data, 'export.status_update.home_page');
  }

  exportShowPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'export.show_perm');
  }

  exportEditPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'export.edit_perm');
  }

  exportHomePage() {
    const data = this.getEntityPermission();
    return _.get(data, 'export.home_page');
  }

  incignitoActionInUsersTablePerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'users.actions.incognito');
  }

  errorMailActionInUsersTablePerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'users.actions.error_email');
  }

  deleteUserActionInUsersTablePerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'users.actions.delete_perm');
  }

  editUserActionInUsersTablePerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'users.actions.edit_perm');
  }

  sendMailActionInUsersTablePerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'users.actions.send_email');
  }

  reminderRegistrationActionInUsersTablePerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'users.actions.reminder_reg_user');
  }
  showUsersActionsExportShowPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'users.actions.export.show_perm');
  }

  showUsersActionsExportEditPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'users.actions.export.edit_perm');
  }

  showUsersActionsExportHomepage() {
    const data = this.getEntityPermission();
    return _.get(data, 'users.actions.export.home_page');
  }

  showUsersActionsTransferRespShowPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'users.actions.transfer_responsibility.show_perm');
  }

  showUsersActionsTransferRespEditPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'users.actions.transfer_responsibility.edit_perm');
  }

  showUsersActionsTransferRespHomepage() {
    const data = this.getEntityPermission();
    return _.get(data, 'users.actions.transfer_responsibility.home_page');
  }

  showUsersActionsTransferAddUserShowPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'users.actions.add_user.show_perm');
  }

  showUsersActionsTransferAddUserEditPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'users.actions.add_user.edit_perm');
  }

  showUsersActionsTransferAddUserHomepage() {
    const data = this.getEntityPermission();
    return _.get(data, 'users.actions.add_user.home_page');
  }
  showUsersDeactivedTablePerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'users.deactivated_users.show_perm');
  }

  editUsersDeactivedTablePerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'users.deactivated_users.edit_perm');
  }

  // RNCP Title Management Permission
  showTitleManagementPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'parameters.rncp_title_management.show_perm');
  }

  addTitleManagementPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'parameters.rncp_title_management.add_perm');
  }

  editTitleManagementPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'parameters.rncp_title_management.edit_perm');
  }

  homepageTitleManagementPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'parameters.rncp_title_management.home_page');
  }

  // Ideas Permission
  showIdeasPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'ideas.show_perm');
  }

  shareIdeasPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'ideas.actions.share');
  }

  replyIdeasPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'ideas.actions.reply');
  }

  deleteIdeasPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'ideas.actions.delete_perm');
  }

  detailIdeasPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'ideas.actions.details');
  }

  // Tutorial Permission
  showTutorialPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'tutorials.show_perm');
  }

  addTutorialPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'tutorials.add_perm');
  }

  deleteTutorialPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'tutorials.actions.delete_perm');
  }

  editTutorialPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'tutorials.actions.edit_perm');
  }

  viewTutorialPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'tutorials.actions.view_perm');
  }

  sendTutorialPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'tutorials.actions.send');
  }

  // *************** Start of Buttons Permission for Process
  showProcess() {
    const data = this.getEntityPermission();
    return _.get(data, 'process.show_perm');
  }

  editProcess() {
    const data = this.getEntityPermission();
    return _.get(data, 'process.edit_perm');
  }

  homeProcess() {
    const data = this.getEntityPermission();
    return _.get(data, 'process.home_page');
  }

  // *************** Start of Buttons Permission for Questionnaire Tools
  addQuestionnaireToolsTemplatePerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'process.ques_tools.add_perm');
  }

  showQuestionnaireToolsTemplatePerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'process.ques_tools.show_perm');
  }

  editQuestionnaireToolsTemplatePerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'process.ques_tools.edit_perm');
  }

  homeQuestionnaireToolsTemplatePerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'process.ques_tools.home_page');
  }

  editActionQuestionnaireToolsTemplatePerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'process.ques_tools.actions.edit_perm');
  }

  duplicateActionQuestionnaireToolsTemplatePerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'process.ques_tools.actions.duplicate_perm');
  }

  deleteActionQuestionnaireToolsTemplatePerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'process.ques_tools.actions.delete_perm');
  }

  // *************** Start of Buttons Permission for Employability Survey
  addEmployabilitySurvey() {
    const data = this.getEntityPermission();
    return _.get(data, 'process.emp_survey.show_perm');
  }

  editEmployabilitySurvey() {
    const data = this.getEntityPermission();
    return _.get(data, 'process.emp_survey.edit_perm');
  }

  homeEmployabilitySurvey() {
    const data = this.getEntityPermission();
    return _.get(data, 'process.emp_survey.home_page');
  }

  resetActionEmployabilitySurvey() {
    const data = this.getEntityPermission();
    return _.get(data, 'process.emp_survey.actions.btn_reset');
  }

  actionEmployabilitySurvey() {
    const data = this.getEntityPermission();
    return _.get(data, 'process.emp_survey.actions.btn_employability_survey');
  }

  // *************** Start of Buttons Permission for Quality Control
  showQualityControl() {
    const data = this.getEntityPermission();
    return _.get(data, 'process.quality_control.show_perm');
  }

  // *************** Start of Buttons Permission for Cross Correction
  showCrossCorrection() {
    const data = this.getEntityPermission();
    return _.get(data, 'process.cross_correction.show_perm');
  }

  editCrossCorrection() {
    const data = this.getEntityPermission();
    return _.get(data, 'process.cross_correction.edit_perm');
  }

  homeCrossCorrection() {
    const data = this.getEntityPermission();
    return _.get(data, 'process.cross_correction.home_page');
  }

  // *************** Start of Buttons Permission for Retake During Year
  showRetakeDuringYear() {
    const data = this.getEntityPermission();
    return _.get(data, 'process.retake_during_year.show_perm');
  }

  // *************** Start of Buttons Permission for Form Builder
  showFormBuilder() {
    const data = this.getEntityPermission();
    return _.get(data, 'process.form_builder.show_perm');
  }

  addFormBuilder() {
    const data = this.getEntityPermission();
    return _.get(data, 'process.form_builder.add_perm');
  }

  editFormBuilder() {
    const data = this.getEntityPermission();
    return _.get(data, 'process.form_builder.edit_perm');
  }

  homeFormBuilder() {
    const data = this.getEntityPermission();
    return _.get(data, 'process.form_builder.home_page');
  }

  duplicateActionFormBuilder() {
    const data = this.getEntityPermission();
    return _.get(data, 'process.form_builder.actions.duplicate_perm');
  }

  editActionFormBuilder() {
    const data = this.getEntityPermission();
    return _.get(data, 'process.form_builder.actions.edit_perm');
  }

  deleteActionFormBuilder() {
    const data = this.getEntityPermission();
    return _.get(data, 'process.form_builder.actions.delete_perm');
  }

  formTemplateActionFormBuilder() {
    const data = this.getEntityPermission();
    return _.get(data, 'process.form_builder.actions.btn_form_template');
  }

  resetActionFormBuilder() {
    const data = this.getEntityPermission();
    return _.get(data, 'process.form_builder.actions.btn_reset');
  }

  // *************** Start of Buttons Permission for Form Follow Up
  showFormFollowUp() {
    const data = this.getEntityPermission();
    return _.get(data, 'process.form_follow_up.show_perm');
  }

  editFormFollowUp() {
    const data = this.getEntityPermission();
    return _.get(data, 'process.form_follow_up.edit_perm');
  }

  homeFormFollowUp() {
    const data = this.getEntityPermission();
    return _.get(data, 'process.form_follow_up.home_page');
  }

  // *************** Start of Buttons Permission for Promo
  addPromoPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'promos.add_perm');
  }

  editPromoPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'promos.actions.edit_perm');
  }

  deletePromoPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'promos.actions.delete_perm');
  }

  viewPromoPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'promos.actions.view_perm');
  }
  // ************ History button permission
  historyNotifActionsViewPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'history.notifications.actions.view_perm');
  }
  historyNotifActionsBtnExport() {
    const data = this.getEntityPermission();
    return _.get(data, 'history.notifications.actions.btn_export');
  }
  historyNotifActionsBtnToday() {
    const data = this.getEntityPermission();
    return _.get(data, 'history.notifications.actions.btn_today');
  }
  historyNotifActionsBtnYesterday() {
    const data = this.getEntityPermission();
    return _.get(data, 'history.notifications.actions.btn_yesterday');
  }
  historyNotifActionsBtnLast7Days() {
    const data = this.getEntityPermission();
    return _.get(data, 'history.notifications.actions.btn_last_7_days');
  }
  historyNotifActionsBtnLast30Days() {
    const data = this.getEntityPermission();
    return _.get(data, 'history.notifications.actions.btn_last_30_days');
  }
  historyNotifActionsBtnReset() {
    const data = this.getEntityPermission();
    return _.get(data, 'history.notifications.actions.btn_reset');
  }
  historyNotifShowPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'history.notifications.show_perm');
  }
  historyNotifEditPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'history.notifications.edit_perm');
  }
  historyNotifHomePage() {
    const data = this.getEntityPermission();
    return _.get(data, 'history.notifications.home_page');
  }
  historyTestsActionsViewPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'history.tests.actions.view_perm');
  }
  historyTestsActionsForward() {
    const data = this.getEntityPermission();
    return _.get(data, 'history.tests.actions.forward');
  }
  historyTestsShowPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'history.tests.show_perm');
  }
  historyTestsListOfTestTable() {
    const data = this.getEntityPermission();
    return _.get(data, 'history.tests.list_of_test_table');
  }
  historyTestsEditPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'history.tests.edit_perm');
  }
  historyTestsHomepage() {
    const data = this.getEntityPermission();
    return _.get(data, 'history.tests.home_page');
  }
  historyShowPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'history.show_perm');
  }

  homePagePromos() {
    const data = this.getEntityPermission();
    return _.get(data, 'promos.home_page');
  }

  showPromosTable() {
    const data = this.getEntityPermission();
    return _.get(data, 'promos.promo_table');
  }

  editPermPromos() {
    const data = this.getEntityPermission();
    return _.get(data, 'promos.edit_perm');
  }

  // ************ Jury Organization button permission
  addJuryOrganizationPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'certifications.jury_organization.add_perm');
  }

  viewActionJuryOrganizationPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'certifications.jury_organization.actions.view_perm');
  }

  deleteActionJuryOrganizationPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'certifications.jury_organization.actions.delete_perm');
  }

  editActionJuryOrganizationPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'certifications.jury_organization.actions.edit_perm');
  }

  viewAssignJuryTabJuryOrganizationPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'certifications.jury_organization.jury_organization_assign_jury.show_perm');
  }

  viewAssignPresidentTabJuryOrganizationPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'certifications.jury_organization.jury_organization_assign_president_jury.show_perm');
  }

  viewAssignMemberTabJuryOrganizationPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'certifications.jury_organization.jury_organization_assign_member_jury.show_perm');
  }

  viewAssignStudentTabJuryOrganizationPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'certifications.jury_organization.jury_organization_assign_student.show_perm');
  }

  viewScheduleTabJuryOrganizationPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'certifications.jury_organization.jury_organization_schedule_jury.show_perm');
  }

  // ************ Start of Permission for ACAD_045 Transfer Responsibility
  transferResponsibilityPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'users.transfer_responsibility');
  }

  // ************ Start of Permission for ACAD_047 Certidegree
  showCertidegreePerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'certifications.certidegree.show_perm');
  }
  addCertidegreePerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'certifications.certidegree.add_perm');
  }
  editCertidegreePerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'certifications.certidegree.edit_perm');
  }
  actionsEditCertidegreePerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'certifications.certidegree.actions.edit_perm');
  }
  actionsDeleteCertidegreePerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'certifications.certidegree.actions.delete_perm');
  }
  // Start of student problematic table permission
  showStudentProblematicTablePerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'student_corrector.show_perm');
  }
  editStudentProblematicTablePerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'student_corrector.actions.show_perm');
  }

  // Permission Final Transcript
  addFinalTranscript() {
    const data = this.getEntityPermission();
    return _.get(data, 'certifications.final_transcript.show_perm');
  }

  editFinalTranscript() {
    const data = this.getEntityPermission();
    return _.get(data, 'certifications.final_transcript.edit_perm');
  }

  // New Permission from ACAD_023

  // Start Permission menu of manager

  showManagermenuPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'manager_menu.show_perm');
  }

  showManagerTaskmenuPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'manager_menu.manager_task');
  }

  showTableofStudentmenuPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'manager_menu.table_of_student');
  }

  // manager_task_sub section

  // follow_up_company
  showManagerTaskFollowupCompanyPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'manager_menu.manager_task_sub.follow_up_company.show_perm');
  }

  editManagerTaskFollowupCompanyPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'manager_menu.manager_task_sub.follow_up_company.edit_perm');
  }

  actionManagerTaskFollowupCompanySeeTablePerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'manager_menu.manager_task_sub.follow_up_company.actions.btn_see_follow_up_company_table');
  }
  // follow_up_company

  // follow_up_registration
  showManagerTaskFollowupRegistrationPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'manager_menu.manager_task_sub.follow_up_registration.show_perm');
  }

  editManagerTaskFollowupRegistrationPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'manager_menu.manager_task_sub.follow_up_registration.edit_perm');
  }

  actionManagerTaskFollowupRegistrationSeeTablePerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'manager_menu.manager_task_sub.follow_up_registration.actions.btn_see_follow_up_registration_table');
  }
  // follow_up_registration

  // follow_up_school_table
  showManagerTaskFollowupSchoolPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'manager_menu.manager_task_sub.follow_up_school_table.show_perm');
  }

  editManagerTaskFollowupSchoolPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'manager_menu.manager_task_sub.follow_up_school_table.edit_perm');
  }

  actionManagerTaskFollowupSchoolSeeTablePerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'manager_menu.manager_task_sub.follow_up_school_table.actions.btn_see_follow_up_school_table');
  }
  // follow_up_school_table

  // pending_task
  showManagerTaskPendingTaskPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'manager_menu.manager_task_sub.pending_task.show_perm');
  }

  editManagerTaskPendingTaskPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'manager_menu.manager_task_sub.pending_task.edit_perm');
  }

  actionManagerTaskPendingTaskResetButtonPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'manager_menu.manager_task_sub.pending_task.actions.btn_reset');
  }

  actionManagerTaskPendingTaskManagerTaskButtonPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'manager_menu.manager_task_sub.pending_task.actions.btn_manager_task');
  }
  // pending_task

  // table_of_student_sub section
  showTableStudentSubmenuPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'manager_menu.table_of_student_sub.show_perm');
  }

  editTableStudentSubmenuPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'manager_menu.table_of_student_sub.edit_perm');
  }

  showActionsConnectAsStudentSubmenuPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'manager_menu.table_of_student_sub.connect_as_student.show_perm');
  }

  editActionsConnectAsStudentSubmenuPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'manager_menu.table_of_student_sub.connect_as_student.edit_perm');
  }

  showActionsAdministrationStudentSubmenuPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'manager_menu.table_of_student_sub.status_toward_administaration.show_perm');
  }

  editActionsAdministrationStudentSubmenuPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'manager_menu.table_of_student_sub.status_toward_administaration.edit_perm');
  }

  showActionsResignationStudentSubmenuPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'manager_menu.table_of_student_sub.resignation_of_student.show_perm');
  }

  editActionsResignationStudentSubmenuPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'manager_menu.table_of_student_sub.resignation_of_student.edit_perm');
  }

  showActionsStudentFileStudentSubmenuPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'manager_menu.table_of_student_sub.student_file.show_perm');
  }

  editActionsStudentFileStudentSubmenuPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'manager_menu.table_of_student_sub.student_file.edit_perm');
  }

  showActionsSendEmailStudentSubmenuPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'manager_menu.table_of_student_sub.send_a_email_to_student.show_perm');
  }

  editActionsSendEmailStudentSubmenuPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'manager_menu.table_of_student_sub.send_a_email_to_student.edit_perm');
  }

  showActionsCommentariesStudentSubmenuPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'manager_menu.table_of_student_sub.commentaries.show_perm');
  }

  editActionsCommentariesStudentSubmenuPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'manager_menu.table_of_student_sub.commentaries.edit_perm');
  }

  showActionsEmailAcadirStudentSubmenuPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'manager_menu.table_of_student_sub.email_academic_director.show_perm');
  }

  editActionsEmailAcadirStudentSubmenuPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'manager_menu.table_of_student_sub.email_academic_director.edit_perm');
  }
  // End Permission menu of manager

  // Start Section menu Schools

  // List of school sub menu

  showListOfSchoolSubmenuPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.list_of_schools_sub.show_perm');
  }

  editListOfSchoolSubmenuPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.list_of_schools_sub.edit_perm');
  }

  showAddSchoolPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.list_of_schools_sub.add_school.show_perm');
  }

  editAddSchoolPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.list_of_schools_sub.add_school.edit_perm');
  }

  showBtnSaveAddSchoolPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.list_of_schools_sub.add_school.actions.btn_save');
  }

  showBtnAddAddressAddSchoolPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.list_of_schools_sub.add_school.actions.btn_add_address');
  }

  showBtnAddLogoAddSchoolPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.list_of_schools_sub.add_school.actions.btn_add_logo');
  }

  showBtnExportListOfSchoolPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.list_of_schools_sub.export.show_perm');
  }

  showBtnEditListOfSchoolPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.list_of_schools_sub.edit_school.show_perm');
  }

  showBtnStudentDetailListOfSchoolPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.list_of_schools_sub.student_detail.show_perm');
  }

  showBtnSendEmailListOfSchoolPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.list_of_schools_sub.send_email.show_perm');
  }

  // Group of school sub menu permission

  showGroupofSchoolSubmenuPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.group_of_schools_sub.student_detail');
  }

  editGroupofSchoolSubmenuPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.group_of_schools_sub.edit_perm');
  }

  showAddGroupofSchoolPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.group_of_schools_sub.add_school_group.show_perm');
  }

  editAddGroupofSchoolPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.group_of_schools_sub.add_school_group.edit_perm');
  }

  showBtnCancelAddGroupofSchoolPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.group_of_schools_sub.add_school_group.actions.btn_cancel');
  }

  showBtnSubmitAddGroupofSchoolPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.group_of_schools_sub.add_school_group.actions.btn_submit');
  }

  showEditGroupofSchoolPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.group_of_schools_sub.edit_school_group.show_perm');
  }

  editButtonGroupofSchoolPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.group_of_schools_sub.edit_school_group.edit_perm');
  }

  btnCancelEditGroupofSchoolPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.group_of_schools_sub.edit_school_group.actions.btn_cancel');
  }

  btnSubmitEditGroupofSchoolPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.group_of_schools_sub.edit_school_group.actions.btn_submit');
  }

  showDeleteGroupofSchoolPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'schools.group_of_schools_sub.delete_school_group.show_perm');
  }

  // End Section Menu Schools

  // Start Companies Section

  showButtonAddCompanyEntityPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'companies.company_entity.add_company.show_perm');
  }

  showButtonAddCompanyBranchPerm() {
    const data = this.getEntityPermission();
    return _.get(data, 'companies.company_branch.add_company.show_perm');
  }

  // End Companies Section

  // Start Tasks Section
  showActionButtonTaskPerm(type, action) {
    const data = this.getEntityPermission();
    if (type === 'my_task') {
      if (action === 'btn_add_task') {
        return _.get(data, 'tasks.my_task.actions.btn_add_task');
      } else if (action === 'btn_today') {
        return _.get(data, 'tasks.my_task.actions.btn_today');
      } else if (action === 'btn_yesterday') {
        return _.get(data, 'tasks.my_task.actions.btn_yesterday');
      } else if (action === 'btn_last_7_days') {
        return _.get(data, 'tasks.my_task.actions.btn_last_7_days');
      } else if (action === 'btn_last_30_days') {
        return _.get(data, 'tasks.my_task.actions.btn_last_30_days');
      } else if (action === 'btn_reset') {
        return _.get(data, 'tasks.my_task.actions.btn_reset');
      } else if (action === 'btn_internal_task') {
        return _.get(data, 'tasks.my_task.actions.btn_internal_task');
      } else {
        return false;
      }
    } else if (type === 'student_task') {
      if (action === 'btn_add_task') {
        return _.get(data, 'tasks.student_task.actions.btn_add_task');
      } else if (action === 'btn_today') {
        return _.get(data, 'tasks.student_task.actions.btn_today');
      } else if (action === 'btn_yesterday') {
        return _.get(data, 'tasks.student_task.actions.btn_yesterday');
      } else if (action === 'btn_last_7_days') {
        return _.get(data, 'tasks.student_task.actions.btn_last_7_days');
      } else if (action === 'btn_last_30_days') {
        return _.get(data, 'tasks.student_task.actions.btn_last_30_days');
      } else if (action === 'btn_reset') {
        return _.get(data, 'tasks.student_task.actions.btn_reset');
      } else if (action === 'btn_internal_task') {
        return _.get(data, 'tasks.student_task.actions.btn_internal_task');
      } else {
        return false;
      }
    } else if (type === 'user_task') {
      if (action === 'btn_add_task') {
        return _.get(data, 'tasks.user_task.actions.btn_add_task');
      } else if (action === 'btn_today') {
        return _.get(data, 'tasks.user_task.actions.btn_today');
      } else if (action === 'btn_yesterday') {
        return _.get(data, 'tasks.user_task.actions.btn_yesterday');
      } else if (action === 'btn_last_7_days') {
        return _.get(data, 'tasks.user_task.actions.btn_last_7_days');
      } else if (action === 'btn_last_30_days') {
        return _.get(data, 'tasks.user_task.actions.btn_last_30_days');
      } else if (action === 'btn_reset') {
        return _.get(data, 'tasks.user_task.actions.btn_reset');
      } else if (action === 'btn_internal_task') {
        return _.get(data, 'tasks.user_task.actions.btn_internal_task');
      } else {
        return false;
      }
    } else {
      return false;
    }
  }

  // End Tasks Section

  // Start Mailbox Section

  showActionSubMenuMailboxPerm(subMenu, actionButton) {
    const data = this.getEntityPermission();
    if (subMenu === 'inbox') {
      if (actionButton === 'btn_reset') {
        return _.get(data, 'mailbox.inbox_sub.actions.btn_reset');
      } else if (actionButton === 'btn_compose') {
        return _.get(data, 'mailbox.inbox_sub.actions.btn_compose');
      } else if (actionButton === 'btn_download_email') {
        return _.get(data, 'mailbox.inbox_sub.actions.btn_download_email');
      } else if (actionButton === 'btn_urgent_message') {
        return _.get(data, 'mailbox.inbox_sub.actions.btn_urgent_message');
      } else if (actionButton === 'btn_mail_to_group') {
        return _.get(data, 'mailbox.inbox_sub.actions.btn_mail_to_group');
      } else {
        return false;
      }
    } else if (subMenu === 'cc') {
      if (actionButton === 'btn_reset') {
        return _.get(data, 'mailbox.cc_sub.actions.btn_reset');
      } else if (actionButton === 'btn_compose') {
        return _.get(data, 'mailbox.cc_sub.actions.btn_compose');
      } else if (actionButton === 'btn_download_email') {
        return _.get(data, 'mailbox.cc_sub.actions.btn_download_email');
      } else if (actionButton === 'btn_urgent_message') {
        return _.get(data, 'mailbox.cc_sub.actions.btn_urgent_message');
      } else if (actionButton === 'btn_mail_to_group') {
        return _.get(data, 'mailbox.cc_sub.actions.btn_mail_to_group');
      } else {
        return false;
      }
    } else if (subMenu === 'sent') {
      if (actionButton === 'btn_reset') {
        return _.get(data, 'mailbox.sent_sub.actions.btn_reset');
      } else if (actionButton === 'btn_compose') {
        return _.get(data, 'mailbox.sent_sub.actions.btn_compose');
      } else if (actionButton === 'btn_download_email') {
        return _.get(data, 'mailbox.sent_sub.actions.btn_download_email');
      } else if (actionButton === 'btn_urgent_message') {
        return _.get(data, 'mailbox.sent_sub.actions.btn_urgent_message');
      } else if (actionButton === 'btn_mail_to_group') {
        return _.get(data, 'mailbox.sent_sub.actions.btn_mail_to_group');
      } else {
        return false;
      }
    } else if (subMenu === 'important') {
      if (actionButton === 'btn_reset') {
        return _.get(data, 'mailbox.important_sub.actions.btn_reset');
      } else if (actionButton === 'btn_compose') {
        return _.get(data, 'mailbox.important_sub.actions.btn_compose');
      } else if (actionButton === 'btn_download_email') {
        return _.get(data, 'mailbox.important_sub.actions.btn_download_email');
      } else if (actionButton === 'btn_urgent_message') {
        return _.get(data, 'mailbox.important_sub.actions.btn_urgent_message');
      } else if (actionButton === 'btn_mail_to_group') {
        return _.get(data, 'mailbox.important_sub.actions.btn_mail_to_group');
      } else {
        return false;
      }
    } else if (subMenu === 'draft') {
      if (actionButton === 'btn_reset') {
        return _.get(data, 'mailbox.draft_sub.actions.btn_reset');
      } else if (actionButton === 'btn_compose') {
        return _.get(data, 'mailbox.draft_sub.actions.btn_compose');
      } else if (actionButton === 'btn_download_email') {
        return _.get(data, 'mailbox.draft_sub.actions.btn_download_email');
      } else if (actionButton === 'btn_urgent_message') {
        return _.get(data, 'mailbox.draft_sub.actions.btn_urgent_message');
      } else if (actionButton === 'btn_mail_to_group') {
        return _.get(data, 'mailbox.draft_sub.actions.btn_mail_to_group');
      } else {
        return false;
      }
    } else if (subMenu === 'trash') {
      if (actionButton === 'btn_reset') {
        return _.get(data, 'mailbox.trash_sub.actions.btn_reset');
      } else if (actionButton === 'btn_compose') {
        return _.get(data, 'mailbox.trash_sub.actions.btn_compose');
      } else if (actionButton === 'btn_download_email') {
        return _.get(data, 'mailbox.trash_sub.actions.btn_download_email');
      } else if (actionButton === 'btn_urgent_message') {
        return _.get(data, 'mailbox.trash_sub.actions.btn_urgent_message');
      } else if (actionButton === 'btn_mail_to_group') {
        return _.get(data, 'mailbox.trash_sub.actions.btn_mail_to_group');
      } else {
        return false;
      }
    } else {
      return false;
    }
  }

  // End Mailbox Section

  editInAppTutorial() {
    const data = this.getEntityPermission();
    return _.get(data, 'inapp_tutorials.edit_perm');
  }

  homePageInAppTutorial() {
    const data = this.getEntityPermission();
    return _.get(data, 'inapp_tutorials.home_page');
  }

  // End New Permission ACAD_023

  getAllUserTypes(): Observable<any> {
    return this.apollo
      .query({
        query: gql`
          query {
            GetAllUserTypes(show_student_type: include_student) {
              _id
              name
              entity
            }
          }
        `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllUserTypes']));
  }

  showMessages() {
    const data = this.getEntityPermission();
    return _.get(data, 'messages.show_perm');
  }

  editMessages() {
    const data = this.getEntityPermission();
    return _.get(data, 'messages.edit_perm');
  }

  homeMessages() {
    const data = this.getEntityPermission();
    return _.get(data, 'messages.home_page');
  }

  // Action Permission Urgent Message
  showUrgentMessage() {
    const data = this.getEntityPermission();
    return _.get(data, 'messages.urgent_message.show_perm');
  }

  editUrgentMessage() {
    const data = this.getEntityPermission();
    return _.get(data, 'messages.urgent_message.edit_perm');
  }

  homeUrgentMessage() {
    const data = this.getEntityPermission();
    return _.get(data, 'messages.urgent_message.home_page');
  }

  submitActionUrgentMessage() {
    const data = this.getEntityPermission();
    return _.get(data, 'messages.urgent_message.actions.btn_submit');
  }

  // Action Permission Group Mailing
  showGroupMailing() {
    const data = this.getEntityPermission();
    return _.get(data, 'messages.group_mailing.show_perm');
  }

  editGroupMailing() {
    const data = this.getEntityPermission();
    return _.get(data, 'messages.group_mailing.edit_perm');
  }

  homeGroupMailing() {
    const data = this.getEntityPermission();
    return _.get(data, 'messages.group_mailing.home_page');
  }

  // Action Permission Alert Func
  showAlertFunc() {
    const data = this.getEntityPermission();
    return _.get(data, 'messages.alert_func.show_perm');
  }

  tableAlertFunc() {
    const data = this.getEntityPermission();
    return _.get(data, 'messages.alert_func.alert_func_table');
  }

  editAlertFunc() {
    const data = this.getEntityPermission();
    return _.get(data, 'messages.alert_func.edit_perm');
  }

  homeAlertFunc() {
    const data = this.getEntityPermission();
    return _.get(data, 'messages.alert_func.home_page');
  }

  deleteActionAlertFunc() {
    const data = this.getEntityPermission();
    return _.get(data, 'messages.alert_func.actions.delete_perm');
  }

  editActionAlertFunc() {
    const data = this.getEntityPermission();
    return _.get(data, 'messages.alert_func.actions.edit_perm');
  }

  responseActionAlertFunc() {
    const data = this.getEntityPermission();
    return _.get(data, 'messages.alert_func.actions.user_response');
  }

  duplicateActionAlertFunc() {
    const data = this.getEntityPermission();
    return _.get(data, 'messages.alert_func.actions.duplicate');
  }

  addActionAlertFunc() {
    const data = this.getEntityPermission();
    return _.get(data, 'messages.alert_func.actions.btn_add_new_alert');
  }
}
