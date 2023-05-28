import { Injectable } from '@angular/core';

export interface ChildrenItems {
  state: string;
  name: string;
  type?: string;
}

export interface Menu {
  state: string;
  name: string;
  type: string;
  icon: string;
  children?: ChildrenItems[];
}

const MENUITEMS = [
  {
    state: 'vertical',
    name: 'Side Menu',
    type: 'button',
    icon: '',
  },
  {
    name: 'RNCP Titles',
    type: 'sub',
    icon: '',
    class: 'group-title',
    children: [
      {
        state: 'horizontal/rncpTitles',
        type: 'link',
        name: 'RNCP Titles List',
        icon: 'web',
      },
    ],
  },
  {
    name: 'Guide',
    type: 'sub',
    icon: '',
    class: 'group-title',
    children: [
      {
        state: 'horizontal/guide/table_1',
        type: 'link',
        name: 'Table 1',
        icon: 'web',
      },
      {
        state: 'horizontal/guide/table_2',
        type: 'link',
        name: 'Table 2',
        icon: 'web',
      },
    ],
  },
  {
    name: 'Users',
    type: 'sub',
    icon: '',
    class: 'group-title',
    children: [
      {
        state: 'horizontal/users',
        type: 'link',
        name: 'Users List',
        icon: 'web',
      },
    ],
  },
  {
    name: 'Students',
    type: 'sub',
    icon: '',
    class: 'group-title',
    children: [
      {
        state: 'horizontal/students',
        type: 'link',
        name: 'Students List',
        icon: 'web',
      },
    ],
  },
  {
    name: 'Cross Correction',
    type: 'sub',
    icon: '',
    class: 'group-title',
    children: [
      {
        state: 'horizontal/crossCorrection',
        type: 'link',
        name: 'Cross Correction List',
        icon: 'web',
      },
    ],
  },
  {
    name: 'Questionnaire Tools',
    type: 'sub',
    icon: '',
    class: 'group-title',
    children: [
      {
        state: 'horizontal/questionnaireTools',
        type: 'link',
        name: 'Questionnaire Tools List',
        icon: 'web',
      },
    ],
  },
  {
    name: 'Jury Organization',
    type: 'sub',
    icon: '',
    class: 'group-title',
    children: [
      {
        state: 'horizontal/jury-organization',
        type: 'link',
        name: 'Jury Organization',
        icon: 'web',
      },
    ],
  },
  {
    name: 'History',
    type: 'sub',
    icon: '',
    class: 'group-title',
    children: [
      {
        state: 'horizontal/history',
        type: 'link',
        name: 'History List',
        icon: 'web',
      },
    ],
  },
  {
    name: 'Tutorial',
    type: 'sub',
    icon: '',
    class: 'group-title',
    children: [
      {
        state: 'horizontal/tutorial',
        type: 'link',
        name: 'Tutorial List',
        icon: 'web',
      },
    ],
  },
  {
    name: 'Platform',
    type: 'sub',
    icon: '',
    class: 'group-title',
    children: [
      {
        state: 'horizontal/platform',
        type: 'link',
        name: 'Platform',
        icon: 'web',
      },
    ],
  },
  {
    name: 'Title RNCP',
    type: 'sub',
    icon: '',
    class: 'group-title',
    children: [
      {
        state: 'horizontal/title-rncp',
        type: 'link',
        name: 'Title RNCP',
        icon: 'web',
      },
    ],
  },
  {
    name: 'School',
    type: 'sub',
    icon: '',
    class: 'group-title',
    children: [
      {
        state: 'horizontal/school',
        type: 'link',
        name: 'School List',
        icon: 'web',
      },
    ],
  },
  {
    name: 'Student Detail',
    type: 'sub',
    icon: '',
    class: 'group-title',
    children: [
      {
        state: 'horizontal/studentDetail',
        type: 'link',
        name: 'Student Detail',
        icon: 'web',
      },
    ],
  },
  {
    name: 'Task',
    type: 'sub',
    icon: '',
    class: 'group-title',
    children: [
      {
        state: 'horizontal/task',
        type: 'link',
        name: 'Task Table',
        icon: 'web',
      },
    ],
  },
  {
    name: 'MailBox.MAILBOX',
    type: 'sub',
    icon: '',
    class: 'group-title',
    children: [
      {
        state: 'horizontal/inbox',
        type: 'link',
        name: 'MailBox.INBOX',
        icon: 'web',
      },
      {
        state: 'horizontal/sentBox',
        type: 'link',
        name: 'MailBox.SENT',
        icon: 'web',
      },
      {
        state: 'horizontal/important',
        type: 'link',
        name: 'MailBox.IMPORTANT',
        icon: 'web',
      },
      {
        state: 'horizontal/draft',
        type: 'link',
        name: 'MailBox.DRAFT',
        icon: 'web',
      },
      {
        state: 'horizontal/trash',
        type: 'link',
        name: 'MailBox.TRASH',
        icon: 'web',
      }
    ],
  },
  {
    name: 'DocTest',
    type: 'sub',
    icon: '',
    class: 'group-title',
    children: [
      {
        state: 'horizontal/doctest',
        type: 'link',
        name: 'DocTestTable',
        icon: 'web',
      },
    ],
  },
  {
    name: 'Quality Control',
    type: 'sub',
    icon: '',
    class: 'group-title',
    children: [
      {
        state: 'horizontal/quality-control',
        type: 'link',
        name: 'Quality Control Table',
        icon: 'web',
      },
    ],
  },
  {
    name: 'SESSIONS',
    type: 'sub',
    class: 'group-title',
    children: [
      { state: 'session/login', type: 'link', name: 'LOGIN.LOGIN_MENU', icon: 'web' },
      { state: 'session/register', type: 'link', name: 'REGISTER', icon: 'web' },
      { state: 'session/forgot-password', type: 'link', name: 'FORGOT', icon: 'web' },
      { state: 'session/lockscreen', type: 'link', name: 'LOCKSCREEN', icon: 'web' },
      { state: 'session/setPassword', type: 'link', name: 'SET PASSWORD', icon: 'web' }
    ],
  },
];

@Injectable()
export class HorizontalMenuItems {
  getAll() {
    return MENUITEMS;
  }
}
