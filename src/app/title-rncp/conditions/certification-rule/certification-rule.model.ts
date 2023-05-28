import { CertificationRuleComponent } from "./certification-rule.component";

export interface CertificationRule {
  _id?: string;
  title?: string;
  message?: string;
  header?: string;
  // documents?: CertificationRuleDocuments[];
  // students_accepted?: CertificationRuleStudentAccepted[];
  documents?: any[];
  students_accepted?: any[];
}

export interface CertificationRuleInput {
  title?: string;
  message?: string;
  // documents?: CertificationRuleDocuments[];
  documents?: any[];
  rncp_id?: string;
  class_id?: string;
}

export interface CertificationRuleDocuments {
  file_name?: string;
  file_path?: string;
}

export interface CertificationRuleStudentAccepted {
  student_id?: any;
  acceptance_date?: any;
}
