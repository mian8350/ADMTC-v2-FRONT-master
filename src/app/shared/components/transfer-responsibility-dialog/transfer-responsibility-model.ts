export interface TransferResponsibilityPayload {
  schoolId: string,
  rncpId: string,
  classId: string,
  userTypeId: string,
  transferFor: string,
  lang: string,
  transfer_from: string,
  transfer_to: string,
}