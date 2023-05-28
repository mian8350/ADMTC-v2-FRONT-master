export interface CrossCorrection {
  _id: string
  student_id: {
    _id: string
    first_name: string
    last_name: string
  }
  school_origin_id: {
    _id: string
    short_name: string
  }
  school_correcting_id: {
    _id: string
    short_name: string
  }
  school_correcting_corrector_id: {
    _id: string
    first_name: string
    last_name: string
  }
  count_document: number
}