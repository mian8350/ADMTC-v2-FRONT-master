export interface TestGroupInput {
  _id?: string
  dummySelect?: boolean
  test: string
  name: string
  students: StudentCorrectionInput[]
  school: string
  rncp: string
}

export interface StudentCorrectionInput {
  student_id: string
}

export interface StudentData {
  _id: string,
  first_name: string,
  last_name: string,
  group_id: string,
  group_name: string,
}

export interface GroupDropdown {
  group_id: string,
  group_name: string
}

export interface GetTestGroup {
  _id: string,
  name: string,
  test: {
    _id: string
  },
  school: {
    _id: string
  },
  rncp: {
    _id: string
  },
  students: GetStudent[]
}

export interface GetStudent {
  student_id: {
    _id: string
  }
}

export interface SelectedGroup {
  all_select: boolean,
  groups: string[]
}
