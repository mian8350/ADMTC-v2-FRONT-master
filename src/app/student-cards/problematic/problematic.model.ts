export interface RespProblematicImported {
  _id: string;
  problematic_status: string
  student_id: {
    _id: string
  }
  school_id: {
    _id: string
  }
  rncp_id: {
    _id: string
  }
  class_id: {
    _id: string
  }
  question_1: {
    question: string
    answer: string
    comments: {
      comment: string
    }[]
  }
  question_2: {
    question: string
    answer: string
    comments: {
      comment: string
    }[]
  }
  question_3: {
    question: string
    answer: string
    comments: {
      comment: string
    }[]
  }
  date: {
    date_utc: string,
    time_utc: string
  }
  signature_of_the_student: boolean
  signature_of_the_acad_dir: boolean
  signature_of_the_certifier: boolean
  general_comments: {
    comment: string
  }[]
}
