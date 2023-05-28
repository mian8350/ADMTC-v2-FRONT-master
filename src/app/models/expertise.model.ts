import { SubjectModel } from './subject.model';

export interface ExpertiseModel {
  block_of_experise: string
  class_id: string
  count_for_title_final_score: boolean
  description: string
  expertise_credit: number
  is_specialization: boolean
  max_point: number
  method_of_evaluation: string
  min_score: number
  order: number
  pass_case?: any
  rncp_title: string
  specialization: any
  status: StatusEnum,
  subjects: [SubjectModel]
}

export enum  StatusEnum {
  'active',
  'deleted'
}
