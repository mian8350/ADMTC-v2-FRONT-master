export interface StudentTranscript {
  school_id: {
    _id: string
    short_name: string
  }
  student_id: {
    _id: string
    civility: string
    first_name: string
    last_name: string
    final_transcript_result_id: {
      block_of_competence_conditions: BlockTranscript[]
      block_of_soft_skill_templates: BlockTranscriptExpertise[]
      block_of_competence_templates: BlockTranscriptExpertise[]
    }
  }
  block_competence_condition_details: {
    block_id: {
      _id: string
    }
    decision_school_board_id: {
      _id: string
      condition_name: string
      condition_type: string
      phrase_type: string
    }
    retake_blocks?: {
      decision_student?: boolean
    }[]
  }[]
  decision_platform: string
  decision_school_board: string
  is_published: boolean
  count_document: number
  block_columns?: any[]
}

export interface BlockTranscript {
  total_mark: number
  total_point: number
  block_id: {
    _id: string
  }
}

export interface BlockTranscriptExpertise {
  grand_oral_block_phrase_obtained_id: {
    name: string
    phrase_type: string
  }
  block_id: {
    _id: string
  }
}
