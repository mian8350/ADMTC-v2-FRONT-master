export interface StudentTableData {
  count_document: number;
  _id: string;
  civility: string;
  first_name: string;
  last_name: string;
  photo: string;
  is_photo_in_s3: string;
  photo_s3_path: string;
  is_thumb_up_green: boolean
  status: string;
  school: {
    _id: string;
    short_name: string;
  }
  rncp_title: {
    _id: string;
    short_name: string;
  }
  final_transcript_id: {
    final_transcript_status: string;
  }
  corrected_tests: any[]
  tests_result: {
    correction_progress: string
    test_correction: {
      correction_grid: {
        correction: {
          total: number
          additional_total: number
        }
      }
    }
    evaluation: {
      _id: string
    }
  }[]
}

export interface StudentIdsData {
  count_document: number;
  _id: string;
}
