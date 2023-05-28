import { Injectable } from '@angular/core';

export interface ChildrenItems {
  state: string;
  name: string;
  type?: string;
  icon?: string;
}

export interface Menu {
  state: string;
  name: string;
  type: string;
  icon?: string;
  children?: ChildrenItems[];
}

const MENUITEMS = [
  // {
  //   state: 'horizontal',
  //   name: 'TOP MENU',
  //   type: 'button',
  //   icon: 'horizontal_split'
  // },

  {
    state: 'rncpTitles',
    name: 'NAV.RNCP_TITLES',
    type: 'link',
    icon: 'import_contacts',
    permissions: 'rncp_title.show_perm',
  },
  {
    state: 'title-manager',
    name: 'NAV.MANAGER',
    type: 'sub',
    icon: 'finance',
    permissions: 'manager_menu.show_perm',
    children: [
      { state: 'title-manager/title', name: 'NAV.MANAGERTASK', icon: 'finance', permissions: 'manager_menu.manager_task' },
      {
        state: 'title-manager/title-manager-student',
        name: 'NAV.TABLEOFSTUDENT',
        icon: 'school',
        permissions: 'manager_menu.table_of_student',
      },
    ],
  },
  {
    state: 'school-group',
    name: 'NAV.RNCP_TITLES',
    type: 'link',
    icon: 'import_contacts',
    permissions: 'chief_group_school.show_perm',
  },
  {
    state: 'school',
    name: 'NAV.SCHOOLS',
    type: 'sub',
    icon: 'account_balance',
    permissions: 'schools.group_of_schools.show_perm',
    children: [
      { state: 'school', name: 'NAV.List of School', icon: 'account_balance', permissions: 'schools.list_of_schools_sub.show_perm' },
      {
        state: 'group-of-schools',
        name: 'NAV.Group of School',
        icon: 'account_balance',
        permissions: 'schools.group_of_schools_sub.show_perm',
      },
    ],
  },
  {
    state: 'school-detail',
    name: 'NAV.SCHOOLS',
    type: 'link',
    icon: 'account_balance',
    permissions: 'schools.list_of_schools.show_perm',
  },

  {
    state: 'students',
    name: 'NAV.STUDENTS',
    type: 'sub',
    icon: 'school',
    permissions: 'students.active_students.show_perm',
    children: [
      { state: 'students', name: 'NAV.Active Student', icon: 'school', permissions: 'students.active_students.show_perm' },
      { state: 'completed-students', name: 'NAV.Completed Student', icon: 'school', permissions: 'students.completed_students.show_perm' },
      {
        state: 'deactivated-students',
        name: 'NAV.Deactivated Student',
        icon: 'school',
        permissions: 'students.deactivated_students.show_perm',
      },
      { state: 'suspended-students', name: 'NAV.Suspended Student', icon: 'school', permissions: 'students.suspended_students.show_perm' },
    ],
  },
  {
    state: 'student-problematic',
    name: 'NAV.STUDENTS',
    type: 'link',
    icon: 'school',
    permissions: 'student_corrector.show_perm',
  },
  {
    state: 'students-card',
    name: 'NAV.STUDENTS',
    type: 'link',
    icon: 'school',
    permissions: 'company_student.show_perm',
  },
  {
    state: 'students',
    name: 'NAV.STUDENTS',
    type: 'link',
    icon: 'school',
    permissions: 'students.student_detail.show_perm',
  },
  {
    state: 'companies',
    name: 'NAV.COMPANIES',
    type: 'sub',
    icon: 'companies',
    permissions: 'companies.show_perm',
    children: [
      {
        state: 'companies/branches',
        name: 'NAV.Companies Branches',
        icon: 'companies',
        permissions: 'companies.company_branch.show_perm',
      },
      { state: 'companies/entities', name: 'NAV.Companies Entity', icon: 'companies', permissions: 'companies.company_entity.show_perm' },
    ],
  },
  {
    state: 'tasks',
    name: 'NAV.TASKS',
    type: 'sub',
    icon: 'task',
    permissions: 'tasks.show_perm',
    children: [
      {
        state: 'task',
        name: 'NAV.MY_TASK',
        icon: 'task',
        permissions: 'tasks.my_task.show_perm',
      },
      {
        state: 'student-task',
        name: 'NAV.STUDENT_TASK',
        icon: 'task',
        permissions: 'tasks.student_task.show_perm',
      },
      {
        state: 'user-task',
        name: 'NAV.USER_TASK',
        icon: 'task',
        permissions: 'tasks.user_task.show_perm',
      },
    ]
  },
  {
    state: 'mailbox',
    name: 'NAV.MAILBOX',
    type: 'link',
    icon: 'mail',
    permissions: 'mailbox.show_perm',
    // children: [
    // { state: 'mailbox/inbox', name: 'MailBox.INBOX', icon: 'inbox' },
    // { state: 'mailbox/sentBox', name: 'MailBox.SENT', icon: 'send' },
    // { state: 'mailbox/important', name: 'MailBox.IMPORTANT', icon: 'label_important' },
    // { state: 'mailbox/draft', name: 'MailBox.DRAFT', icon: 'label_draft' },
    // { state: 'mailbox/trash', name: 'MailBox.TRASH', icon: 'delete' },
    // ],
  },
  {
    state: 'users',
    name: 'NAV.USERS',
    type: 'link',
    icon: 'person',
    permissions: 'users.show_perm',
  },
  {
    state: 'parameters',
    name: 'NAV.PARAMETERS.NAME',
    type: 'sub',
    icon: 'settings',
    permissions: 'parameters.show_perm',
    children: [
      { state: 'platform', name: 'NAV.PARAMETERS.PLATFORM', icon: 'tune', permissions: 'parameters.platform.show_perm' },
      { state: 'title-rncp', name: 'NAV.TITLE_MANAGEMENT', icon: 'titles', permissions: 'parameters.rncp_title_management.show_perm' },
      { state: 'user-permission', name: 'NAV.SETTINGS.USER_PERMISSION', icon: 'account-multiple-outline', permissions: 'parameters.rncp_title_management.show_perm', },
   ],
  },
  {
    state: 'export',
    name: 'NAV.EXPORT.NAME',
    type: 'sub',
    icon: 'export',
    permissions: 'export.show_perm',
    children: [
      { state: 'groups', name: 'NAV.EXPORT.GROUPS', icon: 'groups', permissions: 'export.groups.show_perm' },
      {
        state: 'status-update',
        name: 'NAV.EXPORT.STATUS_UPDATE',
        icon: 'assignment_turned_in',
        permissions: 'export.status_update.show_perm',
      },
    ],
  },
  {
    state: 'history',
    name: 'NAV.HISTORY.NAME',
    type: 'sub',
    icon: 'format_list_bulleted',
    permissions: 'history.show_perm',
    children: [
      { state: 'notifications', name: 'NAV.HISTORY.NOTIFICATIONS', icon: 'notifications', permissions: 'history.notifications.show_perm' },
      {
        state: 'doctest',
        name: 'NAV.HISTORY.TESTS',
        icon: 'tests',
        permissions: 'history.tests.show_perm',
      },
    ],
  },
  {
    state: 'process',
    name: 'NAV.PROCESS.NAME',
    type: 'sub',
    icon: 'process',
    permissions: 'process.show_perm',
    children: [
      {
        state: 'questionnaire-tools',
        name: 'NAV.PROCESS.QUESTIONAIRE_TOOLS',
        icon: 'questionaire-tools',
        permissions: 'process.ques_tools.show_perm',
      },
      {
        state: 'employability-survey',
        name: 'NAV.PROCESS.EMPLOYABILITY_SURVEY',
        icon: 'employability-survey',
        permissions: 'process.emp_survey.show_perm',
      },
      {
        state: 'form-follow-up',
        name: 'NAV.PROCESS.Form Follow Up',
        icon: 'content_paste_search',
        // permissions: 'process.emp_survey.show_perm',
        permissions: 'form_follow_up',
      },
      {
        state: 'quality-control',
        name: 'NAV.PROCESS.QUALITY_CONTROL',
        icon: 'quality-control',
        permissions: 'process.quality_control.show_perm',
      },
      {
        state: 'crossCorrection',
        name: 'NAV.PROCESS.CROSS_CORRECTION',
        icon: 'cross-correction',
        permissions: 'process.cross_correction.show_perm',
      },
      {
        state: 'retake-during-year',
        name: 'NAV.PROCESS.RETAKE_DURING_YEAR',
        icon: 'cached',
        permissions: 'process.retake_during_year.show_perm',
      },
      {
        state: 'form-builder',
        name: 'NAV.PROCESS.FORM_BUILDER',
        icon: 'pencil-ruler',
        permissions: 'process.form_builder.show_perm',
      },
      // {
      //   state: 'process-management',
      //   name: 'NAV.PROCESS.PROCESSMANAGEMENT',
      //   icon: 'process-management',
      //   permissions: 'process.ques_tools.show_perm',
      // },
    ],
  },
  {
    state: 'messages',
    name: 'NAV.MESSAGES.NAME',
    type: 'sub',
    icon: 'send',
    permissions: 'messages.show_perm',
    children: [
      { state: 'urgent-message', name: 'NAV.MESSAGES.URGENT_MESSAGE', icon: 'flash_on', permissions: 'messages.urgent_message.show_perm' },
      { state: 'group-mailing', name: 'NAV.MESSAGES.GROUP_MAILING', icon: 'send', permissions: 'messages.group_mailing.show_perm' },
      {
        state: 'alert-functionality',
        name: 'NAV.MESSAGES.FUNCTIONALITY_ALERT',
        icon: 'functionality-alert',
        permissions: 'messages.alert_func.show_perm',
      },
    ],
  },
  {
    state: 'certification',
    name: 'NAV.CERTIFICATION.NAME',
    type: 'sub',
    icon: 'certification',
    permissions: 'certifications.show_perm',
    children: [
      {
        state: 'search-user',
        name: 'NAV.CERTIFICATION.JURY_ORGANIZATION',
        icon: 'jury-organization',
        permissions: 'certifications.jury_organization.show_perm',
      },
      {
        state: 'jury-organization',
        name: 'NAV.CERTIFICATION.JURY_ORGANIZATION',
        icon: 'jury-organization',
        permissions: 'certifications.jury_organization.show_perm',
      },
      // {
      //   state: 'grand-oral',
      //   name: 'NAV.CERTIFICATION.GRAND_ORAL',
      //   icon: 'jury-organization',
      //   permissions: 'certifications.jury_organization.show_perm',
      // },
      {
        state: 'global-jury-organization/all-jury-schedule',
        // state: 'workProgress',
        name: 'NAV.CERTIFICATION.ALL_JURY_SCHEDULE',
        icon: 'calendar-account',
        permissions: 'certifications.jury_schedule.show_perm',
      },
      {
        state: 'final-retake',
        name: 'NAV.CERTIFICATION.FINAL_RETAKE',
        icon: 'cached',
        permissions: 'certifications.final_retake.show_perm',
      },
      {
        state: 'certidegree',
        name: 'NAV.CERTIFICATION.CERTIDEGREE',
        icon: 'certidegree',
        permissions: 'certifications.certidegree.show_perm',
      },
      {
        state: 'transcript-process',
        name: 'NAV.CERTIFICATION.TRANSCRIPT_PROCESS',
        icon: 'final-transcript',
        permissions: 'certifications.final_transcript.show_perm',
      },
      {
        state: 'transcript-builder',
        name: 'NAV.TRANSCRIPT-BUILDER',
        icon: 'tutorial',
        permissions: 'transcript_builder.show_perm',
      },
      {
        state: 'test-status',
        name: 'NAV.CERTIFICATION.TEST_STATUS',
        icon: 'final-transcript',
        permissions: 'certifications.test_status.show_perm',
      },
    ],
  },

  {
    state: 'previous-course',
    name: 'NAV.Previous Course',
    type: 'link',
    icon: 'PreviousCourse',
    permissions: 'previous_course.show_perm',
  },
  {
    state: 'ideas',
    name: 'NAV.IDEAS',
    type: 'link',
    icon: 'ideas',
    permissions: 'ideas.show_perm',
  },
  {
    state: 'tutorial',
    name: 'NAV.TUTORIALS',
    type: 'link',
    icon: 'tutorial',
    permissions: 'tutorials.show_perm',
  },
  {
    state: 'tutorial-app',
    name: 'InApp Tutorials',
    type: 'link',
    icon: 'tutorial',
    permissions: 'inapp_tutorials.show_perm',
  },
  {
    state: 'promo',
    name: 'Promo',
    type: 'link',
    icon: 'horizontal_split',
    permissions: 'promos.show_perm',
  },
  // {
  //   state: 'correction-eval-pro-step',
  //   name: 'Correction Eval Pro',
  //   type: 'link',
  //   icon: 'task',
  //   permissions: 'rncp_title.show_perm',
  // },
  // {
  //   state: 'needhelp',
  //   name: 'NAV.NEEDHELP',
  //   type: 'button',
  //   icon: 'help',
  //   permissions: 'need_help.show_perm',
  // },
];

@Injectable()
export class MenuItems {
  getAll(): Menu[] {

    return MENUITEMS;
  }
  add(menu: any) {
    MENUITEMS.push(menu);
  }
}
