export interface NavigationPath {
  id: string;
  name: string;
}

export interface AcadKitDocument {
  _id: string;
  status: string;
  document_name: string;
  type_of_document: string;
  s3_file_name;
  publication_date_for_schools: {
    school: {
      _id: string;
    };
    date: {
      date: string;
      time: string;
    };
  };
  parent_rncp_title?: {
    _id: string;
    short_name: string;
  };
  published_for_student: boolean;
  parent_class_id: ParentClass[];
  parent_test: {
    _id: string;
    expected_documents: {
      _id: string;
      document_name: string;
      is_for_all_student: boolean;
      is_for_all_group: boolean;
    }[];
    date_type: string;
    date: {
      date_utc: string;
      time_utc: string;
    };
    schools: any;
  };
  uploaded_for_student: {
    _id: string;
    first_name: string;
    last_name: string;
  };
  uploaded_for_group: {
    _id: string;
    name: string;
  };
  uploaded_for_other_user: {
    first_name: string;
    last_name: string;
  };
  document_expected_id: {
    _id: string;
    document_name: string;
  };
  publication_date: {
    type: string;
    before: boolean;
    day: number;
    relative_time: string;
    publication_date: {
      date: string;
      time: string;
    };
  };
  published_for_user_types_id: {
    _id: string;
    name: string;
  }[];
  document_generation_type: string;
}

export interface AcadKitTest {
  _id: string;
  name: string;
  correction_type: string;
  documents: AcadKitDocument[];
  group_test: boolean;
  task_id?: string;
  is_published?: boolean;
}

export interface AcadKitTSchoolPublished {
  school: {
    _id: string;
  };
  date: {
    date: string;
    time: string;
  };
}

export interface AcadKitFolder {
  _id: string;
  folder_name: string;
  folder_description?: string;
  is_default_folder: boolean;
  is_grand_oral_folder: boolean;
  sub_folders_id: AcadKitSubCategories[];
  documents: AcadKitDocument[];
  jury_id?: {
    _id: string;
    type: string;
  }
  publication_date_for_schools: {
    school: {
      _id: string;
    };
    date: {
      date: string;
      time: string;
    };
  };
  expectedDocuments?: ExpectedDocument[];
  addedDocuments?: AcadKitDocument[];
  manualDocuments?: AcadKitDocument[];
  elementOfProofDocument?: AcadKitDocument[];
  grandOralPDFDocuments?: AcadKitDocument[];
  grandOralResultDocuments?: AcadKitDocument[];
  cv_docs?: AcadKitDocument[];
  presentation_docs?: AcadKitDocument[];
  tests: AcadKitTest[];
  school: {
    _id: string;
  };
  class: {
    _id: string;
  };
  parent_rncp_title: {
    _id: string;
  };
  document_generation_type: string;
  form_process_id : {
    _id
    steps: {
      _id
      step_title
      step_status
    }
    user_id: {
      _id
    }
  }
}

export interface ExpectedDocument {
  _id: string;
  name: string;
  documents: AcadKitDocument[];
  is_manual_expected?: boolean;
  is_for_all_student?: boolean;
  is_for_all_group?: boolean;
  is_for_student?: boolean;
  is_for_group?: boolean;
}

export interface AcadKitSubCategories {
  _id: string;
  title: string;
}

export interface ParentClass {
  _id: string;
  name: string;
}

export interface SelectedTask {
  _id: string;
  due_date: {
    date: string;
    time: string;
  };
  school: {
    short_name: string;
    _id: string;
  };
  rncp: {
    _id: string;
    short_name: string;
  };
  class_id: {
    name: string;
    _id: string;
  };
  created_by: {
    civility: string;
    first_name: string;
    last_name: string;
    _id: string;
  };
  user_selection: {
    user_id: {
      civility: string;
      first_name: string;
      last_name: string;
      _id: string;
      student_id: {
        _id: string;
      };
    };
    user_type_id: {
      name: string;
      _id: string;
    };
  };
  description: string;
  type: string;
  test: {
    date_type: string;
    evaluation_id: { evaluation: string };
    name: string;
    group_test: boolean;
    subject_id: { subject_name: string };
    parent_category: { _id: string; folder_name: string };
    _id: string;
  };
  priority: number;
  count_document: number;
  expected_document_id: string;
  for_each_student: boolean;
  for_each_group: boolean;
  expected_document: {
    file_type: string;
  };
  student_id: {
    _id: string;
    first_name: string;
    last_name: string;
    civility: string;
  };
  test_group_id: {
    _id: string;
    name: string;
  };
  jury_id: {
    name: string;
    _id: string;
    type: string;
    jury_activity: string;
  };
}
