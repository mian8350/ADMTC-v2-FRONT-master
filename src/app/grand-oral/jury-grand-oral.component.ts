import { Component, OnInit, AfterViewChecked, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { CoreService } from 'app/service/core/core.service';
import { JuryOrganizationService } from 'app/service/jury-organization/jury-organization.service';
import { TranscriptBuilderService } from 'app/service/transcript-builder/transcript-builder.service';
import { UtilityService } from 'app/service/utility/utility.service';
import { SpeechToTextDialogComponent } from 'app/shared/components/speech-to-text-dialog/speech-to-text-dialog.component';
import { ApplicationUrls } from 'app/shared/settings';
import { STYLE } from 'app/title-rncp/conditions/class-condition/score/second-step-score/condition-score-preview/pdf-styles';
import { ImageBase64 } from 'app/transcript-builder/transcript-builder/image-base64';
import { environment } from 'environments/environment';
import { SubSink } from 'subsink';
// import { PRINTSTYLES } from '../../../dist/assets/scss/theme/doc-style';
import { ORALSTYLES } from './oral-pdf-style';
import { PdfJuryGrandOralComponent } from './pdf-jury-grand-oral/pdf-jury-grand-oral.component';
import { PdfStudentGrandOralComponent } from './pdf-student-grand-oral/pdf-student-grand-oral.component';
import Swal from 'sweetalert2';
import { DatePipe, Location } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import { ParseStringDatePipe } from 'app/shared/pipes/parse-string-date.pipe';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';

@Component({
  selector: 'ms-jury-grand-oral',
  templateUrl: './jury-grand-oral.component.html',
  styleUrls: ['./jury-grand-oral.component.scss'],
  providers: [ParseStringDatePipe],
})
export class JuryGrandOralComponent implements OnInit, AfterViewInit {
  private subs = new SubSink();
  imcpTransparent = '../../../../../assets/img/imcp-transparent.png';
  imcpLogo = '../../../../../assets/img/imcp-logo.png';
  @ViewChild(PdfStudentGrandOralComponent, { static: false }) pdfDetailRef: PdfStudentGrandOralComponent;
  @ViewChild(PdfJuryGrandOralComponent, { static: false }) pdfJuryDetailRef: PdfJuryGrandOralComponent;
  @ViewChild('pagesElement', { static: false }) documentPagesRef: ElementRef;
  @ViewChild('pagesElementStudents', { static: false }) pagesElementStudents: ElementRef;
  imcp46 = ImageBase64.imcpLogoTransparent;
  justification = new UntypedFormControl();
  competence = new UntypedFormControl();
  block = new UntypedFormControl();
  templateForm: UntypedFormGroup;
  // dataGrandOral: any;
  dataGrandOralFull: any;
  taskId: any;
  juryId: string;
  grandOralList = [];
  totalCriteria = 0;
  isGrandOralCreated = false;
  isGrandOralSubmitted = false;
  stepBlock = true;
  stepSubmit = false;
  grandOralEditData: any;
  grandOralData: any;
  serverimgPath = `${ApplicationUrls.baseApi}/fileuploads/`.replace('/graphql', '');
  logo: any;
  grandOralTestCorrectionForControlContinue: any;
  selectedBlock = 0;
  selectedBlockStepper = 0;
  totalBlock: number = 0;
  disableNextButton: boolean = false;
  isWaitingForResponse: boolean = false;
  grandOralExisting: any = [];
  isCompetence: boolean = false;
  isSoftSkill: boolean = false;
  selectedIndex = [];
  specializationBlock = [];
  allSpecializationBlockId = [];
  nextIndex: number = 0;
  datePipe: DatePipe;
  blockIndex: number = 0;
  blocNotCompleted = false;
  flowType: string;

  savedFormValue;
  markEntryTaskStatus: string;

  isUserADMTC;
  isCertifierAdmin;
  isPresidentJury;
  disabledFormCertifierAdmin = false;
  isJuryCorector: any;

  constructor(
    public coreService: CoreService,
    private fb: UntypedFormBuilder,
    public dialog: MatDialog,
    private juryService: JuryOrganizationService,
    private transcriptBuilderService: TranscriptBuilderService,
    public utilService: UtilityService,
    private route: ActivatedRoute,
    private sanitizer: DomSanitizer,
    private utilityService: UtilityService,
    private translate: TranslateService,
    private _location: Location,
    private parseStringDatePipe: ParseStringDatePipe,
    private router: Router,
    private rncpTitleService: RNCPTitlesService,
  ) {}

  ngOnInit() {
    this.isPresidentJury = this.utilService.isUserPresidentOfJury();
    this.isUserADMTC = this.utilService.isUserEntityADMTC();
    this.isCertifierAdmin = this.utilService.isUserCRDirAdmin();
    this.isJuryCorector = this.utilService.isUserJuryCorrector();

    this.coreService.sidenavOpen = false;
    this.initForm();
    const studentId = this.route.snapshot.queryParamMap.get('studentId');
    this.juryId = this.route.snapshot.queryParamMap.get('juryId');
    this.taskId = this.route.snapshot.queryParamMap.get('taskId');

    this.getGrandOral();
  }
  ngAfterViewInit() {
    this.coreService.sidenavOpen = false;
  }

  getGrandOral() {
    // reset value
    this.totalCriteria = 0;
    this.isCompetence = false;
    this.isSoftSkill = false;
    this.selectedIndex = [];
    this.isWaitingForResponse = true;
    const studentId = this.route.snapshot.queryParamMap.get('studentId');
    const juryId = this.route.snapshot.queryParamMap.get('juryId');
    this.subs.sink = this.juryService.getOneScheduleJury(juryId, studentId).subscribe(
      async (res) => {
        if (res) {

          this.isWaitingForResponse = false;
          this.disabledFormCertifierAdmin = this.isCertifierAdmin && res?.mark_entry_task_status === 'validated' ? true : false;
          this.grandOralData = _.cloneDeep(res);
          this.flowType = this.grandOralData.jury_organization_id.type;
          this.allSpecializationBlockId = this.grandOralData?.jury_organization_id?.rncp_titles[0]?.blocks_for_grand_oral.filter(block => {
            return block?.is_selected && block?.block_id?.is_specialization
          }).map(block => block?.block_id?._id) // get all specialization block id before it gets mutated below
          if (this.flowType === 'retake_grand_oral') {
            let studentRetakeData = await this.juryService.getOneRetakeGrandOralBlocks(studentId, juryId).toPromise();
            if (studentRetakeData) {
              this.markEntryTaskStatus = studentRetakeData.mark_entry_task_status;
              let studentRetakeBlockIds = studentRetakeData.blocks_for_grand_oral
                .filter((block) => block.is_retaking)
                .map((block) => block.block_id._id);

              this.grandOralData.jury_organization_id.rncp_titles[0].blocks_for_grand_oral =
                this.grandOralData.jury_organization_id.rncp_titles[0].blocks_for_grand_oral.filter((block) =>
                  studentRetakeBlockIds.includes(block.block_id._id),
                );
            }
          } else if (this.flowType === 'grand_oral') {
            let studentGrandOralData = await this.juryService.getOneRetakeGrandOralBlocks(studentId, juryId).toPromise();
            if (studentGrandOralData) {
              this.markEntryTaskStatus = studentGrandOralData.mark_entry_task_status;
              let studentGrandBlockIds = studentGrandOralData.blocks_for_grand_oral
                .filter((block) => block.block_id && block.is_selected && !block.is_exempted)
                .map((block) => block.block_id._id);

              const blockAvailable = this.grandOralData.jury_organization_id.rncp_titles[0].blocks_for_grand_oral.filter((block) => {
                if (studentGrandBlockIds.includes(block.block_id._id)) {
                  return block;
                }

              });

              this.grandOralData.jury_organization_id.rncp_titles[0].blocks_for_grand_oral = _.cloneDeep(blockAvailable);
            }
          }

          this.totalBlock = this.grandOralData.jury_organization_id.rncp_titles[0].blocks_for_grand_oral.filter((res, index) => {
            if (res.is_selected) {
              this.selectedIndex.push(index);
              return res;
            }
          }).length;
          this.grandOralList = this.grandOralData.jury_organization_id.rncp_titles[0].blocks_for_grand_oral.filter(
            (resp) => resp.is_selected,
          );
          this.specializationBlock = this.grandOralList.filter(resp => resp.block_id?.is_specialization);
          this.selectedBlock = this.selectedIndex[this.nextIndex];


          this.getGrandOralType();
          if (this.isCompetence) {
            const checkGrandOral =
              this.grandOralData &&
              this.grandOralData.jury_organization_id &&
              this.grandOralData.jury_organization_id.rncp_titles &&
              this.grandOralData.jury_organization_id.rncp_titles.length &&
              this.grandOralData.jury_organization_id.rncp_titles[0].blocks_for_grand_oral &&
              this.grandOralData.jury_organization_id.rncp_titles[0].blocks_for_grand_oral.length &&
              this.grandOralData.jury_organization_id.rncp_titles[0].blocks_for_grand_oral[this.selectedBlock].block_id &&
              this.grandOralData.jury_organization_id.rncp_titles[0].blocks_for_grand_oral[this.selectedBlock].block_id
                .block_of_tempelate_competence;
            if (!checkGrandOral) {
              Swal.fire({
                type: 'error',
                title: 'Error',
                allowOutsideClick: false,
                confirmButtonText: this.translate.instant('Ok'),
              }).then((result) => {
                this.goBack();
              });
            }
          }
          if (this.isSoftSkill) {
            const checkSoftSkill =
              this.grandOralData &&
              this.grandOralData.jury_organization_id &&
              this.grandOralData.jury_organization_id.rncp_titles &&
              this.grandOralData.jury_organization_id.rncp_titles.length &&
              this.grandOralData.jury_organization_id.rncp_titles[0].blocks_for_grand_oral &&
              this.grandOralData.jury_organization_id.rncp_titles[0].blocks_for_grand_oral.length &&
              this.grandOralData.jury_organization_id.rncp_titles[0].blocks_for_grand_oral[this.selectedBlock].block_id &&
              this.grandOralData.jury_organization_id.rncp_titles[0].blocks_for_grand_oral[this.selectedBlock].block_id
                .block_of_tempelate_soft_skill;
            if (!checkSoftSkill) {
              Swal.fire({
                type: 'error',
                title: 'Error',
                allowOutsideClick: false,
                confirmButtonText: this.translate.instant('Ok'),
              }).then((result) => {
                this.goBack();
              });
            }
          }
          if (
            this.grandOralData?.jury_organization_id?.rncp_titles[0]?.blocks_for_grand_oral[this.selectedBlock]?.block_id?.block_of_tempelate_competence?.competence_templates_id &&
            this.grandOralData?.jury_organization_id?.rncp_titles[0]?.blocks_for_grand_oral[this.selectedBlock]?.block_id?.block_of_tempelate_competence?.competence_templates_id?.length
          ) {
            this.grandOralData.jury_organization_id.rncp_titles[0].blocks_for_grand_oral[
              this.selectedBlock
            ].block_id.block_of_tempelate_competence.competence_templates_id.forEach((element) => {
              this.totalCriteria += element.criteria_of_evaluation_templates_id.length;
              this.addBlockFormArray();
            });
            this.grandOralData.jury_organization_id.rncp_titles[0].blocks_for_grand_oral[this.selectedBlock].block_id.block_of_tempelate_competence.competence_templates_id = 
            this.grandOralData.jury_organization_id.rncp_titles[0].blocks_for_grand_oral[this.selectedBlock].block_id.block_of_tempelate_competence.competence_templates_id.map(data => {
              data.phrase_names.sort((a,b) => a.name.localeCompare(b.name));
              return data
            });
          } else if (
            this.grandOralData?.jury_organization_id?.rncp_titles[0]?.blocks_for_grand_oral[this.selectedBlock]?.block_id?.block_of_tempelate_soft_skill?.competence_softskill_templates_id &&
            this.grandOralData?.jury_organization_id?.rncp_titles[0]?.blocks_for_grand_oral[this.selectedBlock]?.block_id?.block_of_tempelate_soft_skill?.competence_softskill_templates_id?.length
          ) {
            this.grandOralData.jury_organization_id.rncp_titles[0].blocks_for_grand_oral[
              this.selectedBlock
            ].block_id.block_of_tempelate_soft_skill.competence_softskill_templates_id.forEach((element) => {
              this.totalCriteria += element.criteria_of_evaluation_softskill_templates_id.length;
              this.addBlockFormArray();
            });
            this.grandOralData.jury_organization_id.rncp_titles[0].blocks_for_grand_oral[this.selectedBlock].block_id.block_of_tempelate_soft_skill.competence_softskill_templates_id = 
            this.grandOralData?.jury_organization_id?.rncp_titles[0]?.blocks_for_grand_oral[this.selectedBlock]?.block_id?.block_of_tempelate_soft_skill?.competence_softskill_templates_id.map(data => {
              data.phrase_names.sort((a,b) => a.name.localeCompare(b.name));
              return data
            });
          }
          this.getAllGrandOral();
          this.getTestCorrectionForControlContinue(res);
        }
      },
      (err) => (this.isWaitingForResponse = false),
    );
  }

  getGrandOralType() {
    const checkGrandOral =
      this.grandOralData &&
      this.grandOralData.jury_organization_id &&
      this.grandOralData.jury_organization_id.rncp_titles &&
      this.grandOralData.jury_organization_id.rncp_titles.length &&
      this.grandOralData.jury_organization_id.rncp_titles[0].blocks_for_grand_oral &&
      this.grandOralData.jury_organization_id.rncp_titles[0].blocks_for_grand_oral.length &&
      this.grandOralData.jury_organization_id.rncp_titles[0].blocks_for_grand_oral[this.selectedBlock].block_id &&
      this.grandOralData.jury_organization_id.rncp_titles[0].blocks_for_grand_oral[this.selectedBlock].block_id.block_type;
    if (checkGrandOral === 'competence') {
      this.isCompetence = true;
    }
    if (checkGrandOral === 'soft_skill') {
      this.isSoftSkill = true;
    }
  }

  getAllGrandOral() {
    this.isWaitingForResponse = true;
    const student_id = this.route.snapshot.queryParamMap.get('studentId');
    const rncp_title_id =
      this.grandOralData && this.grandOralData.rncp_title && this.grandOralData.rncp_title._id ? this.grandOralData.rncp_title._id : '';
    const class_id = this.grandOralData && this.grandOralData.class && this.grandOralData.class._id ? this.grandOralData.class._id : '';
    const school_id = this.grandOralData && this.grandOralData.school && this.grandOralData.school._id ? this.grandOralData.school._id : '';
    this.subs.sink = this.juryService.getAllGrandOralCorrections(student_id, rncp_title_id, class_id, school_id, this.juryId).subscribe(
      (res) => {
        if (res && res.length) {
          this.grandOralExisting = [];
          this.isGrandOralCreated = true;
          const response = _.cloneDeep(res[0]);
          const blockAvailable = this.grandOralData.jury_organization_id.rncp_titles[0].blocks_for_grand_oral.map((block) => block.block_id.block_of_tempelate_competence._id);
          response.block_of_competence_templates = response.block_of_competence_templates.filter((block) => blockAvailable.includes(block.block_id._id));
          this.grandOralEditData = _.cloneDeep(response);
          this.isWaitingForResponse = false;

          const competency = [];
          if (this.grandOralEditData) {
            if (this.grandOralEditData.is_submitted && this.grandOralEditData.is_submitted.length) {
              const dataStatus = this.grandOralEditData.is_submitted.find(
                (list) => list.grand_oral_id._id === this.route.snapshot.queryParamMap.get('juryId'),
              );
              if (dataStatus) {
                this.isGrandOralSubmitted = dataStatus.is_submitted;
              }
            }
            if (this.grandOralEditData.block_of_competence_templates.length) {
              const blockIdSelected =
                this.grandOralData &&
                this.grandOralData.jury_organization_id &&
                this.grandOralData.jury_organization_id.rncp_titles &&
                this.grandOralData.jury_organization_id.rncp_titles[0].blocks_for_grand_oral &&
                this.grandOralData.jury_organization_id.rncp_titles[0].blocks_for_grand_oral[this.selectedBlock].block_id &&
                this.grandOralData.jury_organization_id.rncp_titles[0].blocks_for_grand_oral[this.selectedBlock].block_id
                  .block_of_tempelate_competence &&
                this.grandOralData.jury_organization_id.rncp_titles[0].blocks_for_grand_oral[this.selectedBlock].block_id
                  .block_of_tempelate_competence._id
                  ? this.grandOralData.jury_organization_id.rncp_titles[0].blocks_for_grand_oral[this.selectedBlock].block_id
                      .block_of_tempelate_competence._id
                  : '';
              const comptence_templete = this.grandOralEditData.block_of_competence_templates.filter(
                (res) => res.block_id._id === blockIdSelected,
              );
              if (this.grandOralData?.jury_organization_id?.rncp_titles[0]?.blocks_for_grand_oral[this.selectedBlock]?.block_id?.block_of_tempelate_competence?.competence_templates_id?.length) {

              }
              if (comptence_templete && comptence_templete.length) {

                comptence_templete[0].competence_templates.forEach((comps) => {
                  const comp = {
                    block: comps.competence_template_id._id,
                    competence: comps.score_conversion_id && comps.score_conversion_id._id ? comps.score_conversion_id._id : null,
                    justification: comps.justification,
                    // criteria_of_evaluation_templates_id: comps.criteria_of_evaluation_templates_id && comps.criteria_of_evaluation_templates_id.length ? comps.criteria_of_evaluation_templates_id.map((cri) => cri && cri._id ? cri._id : null) : [],
                  };
                  competency.push(comp);
                });
              } else {

                if (this.isCompetence) {
                  this.grandOralData.jury_organization_id.rncp_titles[0].blocks_for_grand_oral[
                    this.selectedBlock
                  ].block_id.block_of_tempelate_competence.competence_templates_id.forEach((element) => {
                    const comp = {
                      block: '',
                      competence: '',
                      justification: '',
                    };
                    competency.push(comp);
                  });
                }
              }

              this.grandOralEditData.block_of_competence_templates.forEach((element) => {
                element['type'] = 'competence';
                this.grandOralExisting.push(element);
              });
            }
            if (this.grandOralEditData.block_of_soft_skill_templates.length) {
              //
              const blockIdSelected =
                this.grandOralData &&
                this.grandOralData.jury_organization_id &&
                this.grandOralData.jury_organization_id.rncp_titles &&
                this.grandOralData.jury_organization_id.rncp_titles[0].blocks_for_grand_oral &&
                this.grandOralData.jury_organization_id.rncp_titles[0].blocks_for_grand_oral[this.selectedBlock].block_id &&
                this.grandOralData.jury_organization_id.rncp_titles[0].blocks_for_grand_oral[this.selectedBlock].block_id
                  .block_of_tempelate_soft_skill &&
                this.grandOralData.jury_organization_id.rncp_titles[0].blocks_for_grand_oral[this.selectedBlock].block_id
                  .block_of_tempelate_soft_skill._id
                  ? this.grandOralData.jury_organization_id.rncp_titles[0].blocks_for_grand_oral[this.selectedBlock].block_id
                      .block_of_tempelate_soft_skill._id
                  : '';

              const softSkill_templete = this.grandOralEditData.block_of_soft_skill_templates.filter(
                (res) => res.block_id._id === blockIdSelected,
              );
              if (softSkill_templete && softSkill_templete.length) {

                softSkill_templete[0].competence_templates.forEach((comps) => {
                  const comp = {
                    block: comps.competence_template_id._id,
                    competence: comps.score_conversion_id && comps.score_conversion_id._id ? comps.score_conversion_id._id : null,
                    justification: comps.justification,
                    // criteria_of_evaluation_templates_id: comps.criteria_of_evaluation_templates_id && comps.criteria_of_evaluation_templates_id.length ? comps.criteria_of_evaluation_templates_id.map((cri) => cri && cri._id ? cri._id : null) : [],
                  };
                  competency.push(comp);
                });
              } else {

                if (this.isSoftSkill) {
                  this.grandOralData.jury_organization_id.rncp_titles[0].blocks_for_grand_oral[
                    this.selectedBlock
                  ].block_id.block_of_tempelate_soft_skill.competence_softskill_templates_id.forEach((element) => {
                    const comp = {
                      block: '',
                      competence: '',
                      justification: '',
                    };
                    competency.push(comp);
                  });
                }
              }

              this.grandOralEditData.block_of_soft_skill_templates.forEach((element) => {
                element['type'] = 'softskill';
                this.grandOralExisting.push(element);
              });
            }
            this.mappingGrandOralDataExisting();

            this.templateForm.get('block').patchValue(competency);
            this.savedFormValue = _.cloneDeep(this.templateForm.value);


            // **************** Update Grand Oral Form Validation. For President Jury / Grand Oral Corrector.
            // *************** If Already Submitted, cannot edit anymore but ADMTC and Certificer can edit even after submitted
            if ((this.isPresidentJury || this.isJuryCorector) && this.isGrandOralSubmitted) {
              this.templateForm.disable();
            }
            // if ((this.isUserADMTC || this.isCertifierAdmin) && this.markEntryTaskStatus === 'validated') {
            //   this.templateForm.disable();
            // }
            // End of Validation Edit


          } else {
            this.savedFormValue = _.cloneDeep(this.templateForm.value);
          }
        } else {
          this.savedFormValue = _.cloneDeep(this.templateForm.value);
          this.isWaitingForResponse = false;
        }
        // *************** improvement 16/02/2023 to hide option en cours d acquisition. if want to delete this validation, can safely remove the line below

        this.hidePhraseFromOptions('en cours d’acquisition')
        // *************** end improvement 16/02/2023 to hide option en cours d acquisition
      },
      (err) => (this.isWaitingForResponse = false),
    );
  }

  setDataStudent(data) {
    let dateBirth = '-';
    if (data) {
      dateBirth = this.parseStringDatePipe.transform(data);
    }
    return dateBirth;
  }

  hidePhraseFromOptions(phraseNameInLowercase: string) {
    if (
      this.grandOralData?.jury_organization_id?.rncp_titles[0]?.blocks_for_grand_oral[this.selectedBlock]?.block_id?.block_of_tempelate_competence?.competence_templates_id &&
      this.grandOralData?.jury_organization_id?.rncp_titles[0]?.blocks_for_grand_oral[this.selectedBlock]?.block_id?.block_of_tempelate_competence?.competence_templates_id?.length
    ) {
        this.grandOralData.jury_organization_id.rncp_titles[0].blocks_for_grand_oral[this.selectedBlock].block_id.block_of_tempelate_competence.competence_templates_id = 
        this.grandOralData.jury_organization_id.rncp_titles[0].blocks_for_grand_oral[this.selectedBlock].block_id.block_of_tempelate_competence.competence_templates_id.map((block, idx) => {
          block.phrase_names = block.phrase_names.filter(phrase => {
            const show = Boolean(this.utilService.simpleDiacriticSensitiveRegex(String(phrase?.name)).toLowerCase() !== this.utilService.simpleDiacriticSensitiveRegex(String(phraseNameInLowercase)).toLowerCase())
            const condition = show || phrase._id === this.getBlockFormArray.at(idx).get('competence').value

            return condition
          })
          return block
        })
    } else if (
      this.grandOralData?.jury_organization_id?.rncp_titles[0]?.blocks_for_grand_oral[this.selectedBlock]?.block_id?.block_of_tempelate_soft_skill?.competence_softskill_templates_id &&
      this.grandOralData?.jury_organization_id?.rncp_titles[0]?.blocks_for_grand_oral[this.selectedBlock]?.block_id?.block_of_tempelate_soft_skill?.competence_softskill_templates_id?.length
    ) {
        this.grandOralData.jury_organization_id.rncp_titles[0].blocks_for_grand_oral[this.selectedBlock].block_id.block_of_tempelate_soft_skill.competence_softskill_templates_id = 
        this.grandOralData?.jury_organization_id?.rncp_titles[0]?.blocks_for_grand_oral[this.selectedBlock]?.block_id?.block_of_tempelate_soft_skill?.competence_softskill_templates_id.map((block, idx) => {
          block.phrase_names = block.phrase_names.filter(phrase => {
            const show = Boolean(this.utilService.simpleDiacriticSensitiveRegex(String(phrase?.name)).toLowerCase() !== this.utilService.simpleDiacriticSensitiveRegex(String(phraseNameInLowercase)).toLowerCase())
            const condition = show || phrase._id === this.getBlockFormArray.at(idx).get('competence').value

            return condition
          })
          return block
        })
    }
  }

  mappingGrandOralDataExisting() {
    this.grandOralExisting = this.grandOralExisting.map((res) => {
      let competenceTemplate = [];
      res.competence_templates.forEach((comps) => {
        const comp = {
          competence_template_id: comps.competence_template_id._id,
          score_conversion_id: comps.score_conversion_id && comps.score_conversion_id._id ? comps.score_conversion_id._id : null,
          justification: comps.justification,
          criteria_of_evaluation_templates_id:
            comps.criteria_of_evaluation_templates_id && comps.criteria_of_evaluation_templates_id.length
              ? comps.criteria_of_evaluation_templates_id.map((cri) => (cri && cri._id ? cri._id : null))
              : [],
        };
        competenceTemplate.push(comp);
      });
      return {
        block_id: res.block_id._id,
        competence_templates: competenceTemplate,
        type: res.type,
      };
    });
  }

  goToBlock(value, alreadyValidate?) {

    let validation = true;
    if (this.isDataChanged() && !alreadyValidate) {
      validation = false;
    }

    if (validation) {
      if (value === 0) {
        this.selectedBlockStepper -= 1;
        this.blockIndex -= 1;
        this.nextIndex -= 1;
        this.removeValueArray();
        this.getGrandOral();
      } else {
        if (this.totalBlock - (this.nextIndex + 1) === 0) {
          let allow = true;
          if (this.grandOralEditData) {
            if (this.grandOralEditData.block_of_competence_templates && this.grandOralEditData.block_of_competence_templates.length) {
              this.grandOralEditData.block_of_competence_templates.forEach((blocks, blockInd) => {
                if (blocks && blocks.competence_templates && blocks.competence_templates.length) {
                  const data = blocks.competence_templates.filter(
                    (resp) => (resp && !resp.score_conversion_id) || !resp.score_conversion_id._id,
                  );
                  if (data && data.length) {
                    allow = true;
                  } else {
                    allow = false;
                  }
                }
              });
            }
          }
          if (!allow) {
            this.stepBlock = false;
            this.stepSubmit = true;
            this.selectedBlockStepper = -1;
          } else {
            Swal.fire({
              type: 'warning',
              allowEscapeKey: true,
              title: this.translate.instant('Please complete the mark entry before submitting the result'),
              confirmButtonText: this.translate.instant('OK'),
            }).then(() => {});
          }
        } else {
          this.selectedBlockStepper += 1;
          this.blockIndex += 1;
          this.nextIndex += 1;
          this.removeValueArray();
          this.getGrandOral();
        }
      }
    } else {
      Swal.fire({
        type: 'warning',
        title: this.translate.instant('TMTC_S01.TITLE'),
        text: this.translate.instant('TMTC_S01.TEXT'),
        confirmButtonText: this.translate.instant('TMTC_S01.BUTTON_1'),
        showCancelButton: true,
        cancelButtonText: this.translate.instant('TMTC_S01.BUTTON_2'),
        allowEscapeKey: false,
        allowOutsideClick: false,
      }).then((result) => {
        if (result.value) {
          // stop it

        } else {
          this.goToBlock(value, true);
          this.savedFormValue = _.cloneDeep(this.templateForm.value);
        }
      });
    }
  }

  removeValueArray() {
    while (this.getBlockFormArray.length !== 0) {
      this.getBlockFormArray.removeAt(0);
    }
  }

  getImgUrl() {
    const logo =
      this.grandOralData &&
      this.grandOralData.jury_organization_id &&
      this.grandOralData.jury_organization_id.certifier &&
      this.grandOralData.jury_organization_id.certifier.logo
        ? this.grandOralData.jury_organization_id.certifier.logo
        : null;
    const result = this.serverimgPath + logo;
    return logo ? this.sanitizer.bypassSecurityTrustUrl(result) : null;
  }

  generateGrandOralPDF() {
    this.isWaitingForResponse = true;
    const studentId = this.route.snapshot.queryParamMap.get('studentId');
    const juryId = this.route.snapshot.queryParamMap.get('juryId');
    this.subs.sink = this.juryService.generateGrandOralPDF(juryId, studentId).subscribe(
      (list) => {
        this.isWaitingForResponse = false;

        const element = document.createElement('a');
        element.href = this.serverimgPath + list;
        element.target = '_blank';
        element.setAttribute('download', list);
        element.click();
      },
      (err) => (this.isWaitingForResponse = false),
    );
  }

  getTestCorrectionForControlContinue(grandOralData) {


    const studentId = this.route.snapshot.queryParamMap.get('studentId');
    if (this.isCompetence) {

      const blockId =
        grandOralData &&
        grandOralData.jury_organization_id &&
        grandOralData.jury_organization_id.rncp_titles &&
        grandOralData.jury_organization_id.rncp_titles.length &&
        grandOralData.jury_organization_id.rncp_titles[0].blocks_for_grand_oral &&
        grandOralData.jury_organization_id.rncp_titles[0].blocks_for_grand_oral.length &&
        grandOralData.jury_organization_id.rncp_titles[0].blocks_for_grand_oral[this.selectedBlock].block_id &&
        grandOralData.jury_organization_id.rncp_titles[0].blocks_for_grand_oral[this.selectedBlock].block_id
          .block_of_tempelate_competence &&
        grandOralData.jury_organization_id.rncp_titles[0].blocks_for_grand_oral[this.selectedBlock].block_id.block_of_tempelate_competence
          ._id
          ? grandOralData.jury_organization_id.rncp_titles[0].blocks_for_grand_oral[this.selectedBlock].block_id
              .block_of_tempelate_competence._id
          : '';


      this.subs.sink = this.juryService.getTestCorrectionForControlContinue(blockId, studentId).subscribe((res) => {

        this.grandOralTestCorrectionForControlContinue = _.cloneDeep(res);
      });
    } else if (this.isSoftSkill) {

      const blockId =
        grandOralData &&
        grandOralData.jury_organization_id &&
        grandOralData.jury_organization_id.rncp_titles &&
        grandOralData.jury_organization_id.rncp_titles.length &&
        grandOralData.jury_organization_id.rncp_titles[0].blocks_for_grand_oral &&
        grandOralData.jury_organization_id.rncp_titles[0].blocks_for_grand_oral.length &&
        grandOralData.jury_organization_id.rncp_titles[0].blocks_for_grand_oral[this.selectedBlock].block_id &&
        grandOralData.jury_organization_id.rncp_titles[0].blocks_for_grand_oral[this.selectedBlock].block_id
          .block_of_tempelate_soft_skill &&
        grandOralData.jury_organization_id.rncp_titles[0].blocks_for_grand_oral[this.selectedBlock].block_id.block_of_tempelate_soft_skill
          ._id
          ? grandOralData.jury_organization_id.rncp_titles[0].blocks_for_grand_oral[this.selectedBlock].block_id
              .block_of_tempelate_soft_skill._id
          : '';


      this.subs.sink = this.juryService.getTestCorrectionForControlContinue(blockId, studentId).subscribe((res) => {

        this.grandOralTestCorrectionForControlContinue = _.cloneDeep(res);
      });
    }
  }

  initForm() {
    this.templateForm = this.fb.group({
      block: this.fb.array([]),
    });
  }

  initBlockForm() {
    return this.fb.group({
      justification: [''],
      competence: [''],
      block: [''],
    });
  }
  // Function to get each formarray
  get getBlockFormArray(): UntypedFormArray {
    return this.templateForm.get('block') as UntypedFormArray;
  }
  // Add into array
  addBlockFormArray() {
    this.getBlockFormArray.push(this.initBlockForm());
  }
  // Remove from array
  removeBlockFormArray(blockIndex) {
    this.getBlockFormArray.removeAt(blockIndex);
  }
  openVoiceRecog(blockIndex) {
    this.dialog
      .open(SpeechToTextDialogComponent, {
        width: '800px',
        minHeight: '300px',
        panelClass: 'certification-rule-pop-up',
        disableClose: true,
        data: this.getBlockFormArray.at(blockIndex).get('justification').value,
      })
      .afterClosed()
      .subscribe((resp) => {

        this.getBlockFormArray.at(blockIndex).get('justification').patchValue(resp);
      });
  }

  generatePDF() {
    const html = this.pdfJuryDetailRef.generatePDF();
    const filename = `Compléter la grille pour grand oral `;
    this.transcriptBuilderService.generatePdfDynamic(html, filename, true, false).subscribe((res: any) => {
      const link = document.createElement('a');
      link.setAttribute('type', 'hidden');
      link.download = res.filename;
      link.href = environment.PDF_SERVER_URL + res.filePath;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      link.remove();
    });
  }

  generatePDFStudents() {
    const html = this.pdfDetailRef.generatePDFStudents();
    const filename = `Compléter la grille pour grand oral `;
    this.transcriptBuilderService.generatePdfDynamic(html, filename, true, false).subscribe((res: any) => {
      const link = document.createElement('a');
      link.setAttribute('type', 'hidden');
      link.download = res.filename;
      link.href = environment.PDF_SERVER_URL + res.filePath;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      link.remove();
    });
  }

  generatePDFFull() {
    const fileDoc = document.getElementById('grand-oral-full').innerHTML;
    let html = ORALSTYLES;
    html = html + fileDoc;
    html = STYLE + html;
    const filename = `Compléter la grille pour grand oral `;
    this.transcriptBuilderService.generatePdfDynamic(html, filename, true, false).subscribe((res: any) => {
      const link = document.createElement('a');
      link.setAttribute('type', 'hidden');
      link.download = res.filename;
      link.href = environment.PDF_SERVER_URL + res.filePath;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      link.remove();
    });
  }

  saveMarkEntry(value) {



    if(this.templateForm.invalid) {
      Swal.fire({
        type: 'warning',
        title: this.translate.instant('Please complete the mark entry before submitting the result'),
      });
    } else {
      this.isWaitingForResponse = true;
      const payload = this.createPayloadBlockCompetence(value, this.templateForm.value, this.grandOralData);

      if (this.isGrandOralCreated) {
        this.subs.sink = this.juryService.updateGrandOralCorrection(payload, this.grandOralEditData._id).subscribe((res) => {
          this.isWaitingForResponse = false;

          this.getAllGrandOral();
          Swal.fire({
            type: 'success',
            title: this.translate.instant('Bravo !'),
          });
        });
      } else {
        this.subs.sink = this.juryService.createGrandOralCorrection(payload).subscribe((res) => {
          this.isWaitingForResponse = false;

          this.getAllGrandOral();
          Swal.fire({
            type: 'success',
            title: this.translate.instant('Bravo !'),
          });
        });
      }
    }
  }

  createPayloadBlockCompetence(selectedBlock, formValue, grandOralData) {
    let payload = {
      student_id: this.route.snapshot.queryParamMap.get('studentId'),
      grand_oral_id: this.route.snapshot.queryParamMap.get('juryId'),
      rncp_title_id: grandOralData && grandOralData.rncp_title && grandOralData.rncp_title._id ? grandOralData.rncp_title._id : '',
      class_id: grandOralData && grandOralData.class && grandOralData.class._id ? grandOralData.class._id : '',
      school_id: grandOralData && grandOralData.school && grandOralData.school._id ? grandOralData.school._id : '',
    };

    let blockTemplate: any;
    if (selectedBlock.block_type === 'competence') {
      for (let i = 0; i < selectedBlock.block_of_tempelate_competence.competence_templates_id.length; i++) {
        for (let j = 0; j < formValue.block.length; j++) {
          if (i === j) {
            formValue.block[j].block = selectedBlock.block_of_tempelate_competence.competence_templates_id[i]._id;
            formValue.block[j].criteria_of_evaluation_templates_id = selectedBlock.block_of_tempelate_competence.competence_templates_id[
              i
            ].criteria_of_evaluation_templates_id.map((res) => res._id);
          }
        }
      }
      const competenceTemplate = formValue.block.map((res) => {
        return {
          competence_template_id: res.block,
          score_conversion_id: res.competence,
          justification: res.justification,
          criteria_of_evaluation_templates_id: res.criteria_of_evaluation_templates_id,
        };
      });
      blockTemplate = {
        block_id: selectedBlock.block_of_tempelate_competence._id,
        competence_templates: competenceTemplate,
      };
    } else if (selectedBlock.block_type === 'soft_skill') {
      //
      for (let i = 0; i < selectedBlock.block_of_tempelate_soft_skill.competence_softskill_templates_id.length; i++) {
        for (let j = 0; j < formValue.block.length; j++) {
          if (i === j) {
            formValue.block[j].block = selectedBlock.block_of_tempelate_soft_skill.competence_softskill_templates_id[i]._id;
            formValue.block[j].criteria_of_evaluation_softskill_templates_id =
              selectedBlock.block_of_tempelate_soft_skill.competence_softskill_templates_id[
                i
              ].criteria_of_evaluation_softskill_templates_id.map((res) => res._id);
          }
        }
      }
      const softSkillTemplate = formValue.block.map((res) => {
        return {
          competence_template_id: res.block,
          score_conversion_id: res.competence,
          justification: res.justification,
          criteria_of_evaluation_templates_id: res.criteria_of_evaluation_softskill_templates_id,
        };
      });
      blockTemplate = {
        block_id: selectedBlock.block_of_tempelate_soft_skill._id,
        competence_templates: softSkillTemplate,
      };
    }


    if (this.grandOralExisting.length > 0) {
      let softSkill = [];
      let comptences = [];
      this.grandOralExisting = this.grandOralExisting.filter((res) => {
        if (res.block_id && res.block_id !== blockTemplate.block_id) {
          return res;
        }
      });

      this.grandOralExisting.map((res) => {
        if (res.type === 'competence') {
          const competenceExisting = {
            block_id: res.block_id,
            competence_templates: res.competence_templates,
          };
          comptences.push(competenceExisting);
        } else if (res.type === 'softskill') {
          const softSkillExisting = {
            block_id: res.block_id,
            competence_templates: res.competence_templates,
          };
          softSkill.push(softSkillExisting);
        }
      });
      if (this.isCompetence) {
        comptences.push(blockTemplate);
      } else if (this.isSoftSkill) {
        softSkill.push(blockTemplate);
      }


      if (softSkill.length) {
        payload['block_of_soft_skill_templates'] = softSkill;
      }
      if (comptences.length) {
        payload['block_of_competence_templates'] = comptences;
      }
      return payload;
    } else {
      if (this.isSoftSkill) {
        payload['block_of_soft_skill_templates'] = blockTemplate;
      } else if (this.isCompetence) {
        payload['block_of_competence_templates'] = blockTemplate;
      }
      return payload;
    }
  }

  saveOnlyMarkEntry() {
    Swal.fire({
      type: 'warning',
      title: this.translate.instant('GO_S2.TITLE'),
      html: this.translate.instant('GO_S2.TEXT'),
      confirmButtonText: this.translate.instant('GO_S2.BUTTON_1'),
      showCancelButton: true,
      cancelButtonText: this.translate.instant('GO_S2.BUTTON_2'),
      width: '620px',
    }).then((isConfirm) => {
      if (isConfirm.value) {
        this.goToScheduleJuries(this.grandOralData);
      } else {
        return 0;
      }
    });
  }

  submitMarkEntry() {
    const student_id =
      this.grandOralData.students && this.grandOralData.students.student_id ? this.grandOralData.students.student_id._id : null;
    const jury_member_id = this.grandOralData.jury_member_id;
    const school_id = this.grandOralData && this.grandOralData.school && this.grandOralData.school._id ? this.grandOralData.school._id : '';
    this.isWaitingForResponse = true;
    this.subs.sink = this.juryService
      .SubmitMarksEntryForJuryGrandOral(school_id, this.route.snapshot.queryParamMap.get('juryId'), jury_member_id, student_id)
      .subscribe(
        (resp) => {
          this.isWaitingForResponse = false;

          Swal.fire({
            type: 'success',
            title: this.translate.instant('Bravo !'),
          }).then((result) => {
            if (result) {
              this.goToScheduleJuries(this.grandOralData);
            }
          });
        },
        (err) => {
          this.swalError(err);
        },
      );
  }

  validateMarkEntryForJury() {
    const student_id =
      this.grandOralData.students && this.grandOralData.students.student_id ? this.grandOralData.students.student_id._id : null;
    const jury_member_id = this.grandOralData.jury_member_id;
    const school_id = this.grandOralData && this.grandOralData.school && this.grandOralData.school._id ? this.grandOralData.school._id : '';
    this.isWaitingForResponse = true;
    this.subs.sink = this.juryService
      .ValidateMarksEntryForJuryGrandOral(school_id, this.route.snapshot.queryParamMap.get('juryId'), jury_member_id, student_id)
      .subscribe(
        (resp) => {
          this.isWaitingForResponse = false;

          Swal.fire({
            type: 'success',
            title: this.translate.instant('Bravo !'),
          }).then((result) => {
            if (result) {
              this.goToScheduleJuries(this.grandOralData);
            }
          });
        },
        (err) => {
          this.swalError(err);
        },
      );
  }

  enableSubmitButton() {
    let allow = true;
    if (this.grandOralEditData) {
      if (this.grandOralEditData.block_of_competence_templates && this.grandOralEditData.block_of_competence_templates.length) {
        this.grandOralEditData.block_of_competence_templates.forEach((blocks, blockInd) => {
          if (blocks && blocks.competence_templates && blocks.competence_templates.length) {
            const data = blocks.competence_templates.filter((resp) => (resp && !resp.score_conversion_id) || !resp.score_conversion_id._id);
            if (data && data.length) {
              allow = true;
            } else {
              allow = false;
            }
          }
        });
      }
    }
    return allow;
  }

  isStatusCompleted(ins, block) {
    let allow = false;
    let typeBlock = [];
    if (ins !== 'submit') {
      if (this.grandOralEditData) {
        if (block && block.block_id && block.block_id.block_of_tempelate_competence) {
          if (this.grandOralEditData.block_of_competence_templates) {
            typeBlock = this.grandOralEditData.block_of_competence_templates.filter(
              (list) =>
                list.block_id &&
                block.block_id.block_of_tempelate_competence &&
                list.block_id._id === block.block_id.block_of_tempelate_competence._id,
            );
          }
          if (typeBlock && typeBlock.length) {

            if (typeBlock[0] && typeBlock[0].competence_templates && typeBlock[0].competence_templates.length) {
              const data = typeBlock[0].competence_templates.filter(
                (resp) => (resp && !resp.score_conversion_id) || !resp.score_conversion_id._id,
              );
              if (data && data.length) {
                allow = false;
              } else {
                allow = true;
              }
            }
          }
        } else if (block && block.block_id && block.block_id.block_of_tempelate_soft_skill) {
          if (this.grandOralEditData.block_of_soft_skill_templates) {
            typeBlock = this.grandOralEditData.block_of_soft_skill_templates.filter(
              (list) =>
                list.block_id &&
                block.block_id.block_of_tempelate_soft_skill &&
                list.block_id._id === block.block_id.block_of_tempelate_soft_skill._id,
            );
          }
          if (typeBlock && typeBlock.length) {

            if (typeBlock[0] && typeBlock[0].competence_templates && typeBlock[0].competence_templates.length) {
              const data = typeBlock[0].competence_templates.filter(
                (resp) => (resp && !resp.score_conversion_id) || !resp.score_conversion_id._id,
              );
              if (data && data.length) {
                allow = false;
              } else {
                allow = true;
              }
            }
          }
        }
      }
    } else {
      if (this.isGrandOralSubmitted) {
        allow = true;
      }
    }
    return allow;
  }

  validateMarkEntry() {
    const school_id = this.grandOralData && this.grandOralData.school && this.grandOralData.school._id ? this.grandOralData.school._id : '';
    this.subs.sink = this.juryService.validateTestCorrection(school_id).subscribe((resp) => {
      this.triggerSwalValidate();
    });
  }

  triggerSwalValidate() {
    Swal.fire({
      type: 'success',
      title: this.translate.instant('TESTCORRECTIONS.MESSAGE.VALIDATE-SUBMIT-TITLE'),
      allowEscapeKey: true,
      text: this.translate.instant('TESTCORRECTIONS.MESSAGE.VALIDATE-SUBMIT-TEXT'),
      confirmButtonText: this.translate.instant('TESTCORRECTIONS.MESSAGE.VALIDATE-SUBMIT-OK'),
    }).then(() => {});
  }
  goBack() {
    this._location.back();
  }

  checkValidationStep(ins, block) {
    let allow = true;
    let typeBlock = [];
    if (this.grandOralEditData) {
      if (block && block.block_id && block.block_id.block_of_tempelate_competence) {
        if (this.grandOralEditData.block_of_competence_templates) {
          typeBlock = this.grandOralEditData.block_of_competence_templates.filter(
            (list) =>
              list.block_id &&
              block.block_id.block_of_tempelate_competence &&
              list.block_id._id === block.block_id.block_of_tempelate_competence._id,
          );
        }
        if (typeBlock && typeBlock.length) {

          if (typeBlock[0] && typeBlock[0].competence_templates && typeBlock[0].competence_templates.length) {
            const data = typeBlock[0].competence_templates.filter(
              (resp) => (resp && !resp.score_conversion_id) || !resp.score_conversion_id._id,
            );
            if (data && data.length) {
              allow = true;
            } else {
              allow = false;
            }
          }
        }
      } else if (block && block.block_id && block.block_id.block_of_tempelate_soft_skill) {
        if (this.grandOralEditData.block_of_soft_skill_templates) {
          typeBlock = this.grandOralEditData.block_of_soft_skill_templates.filter(
            (list) =>
              list.block_id &&
              block.block_id.block_of_tempelate_soft_skill &&
              list.block_id._id === block.block_id.block_of_tempelate_soft_skill._id,
          );
        }
        if (typeBlock && typeBlock.length) {

          if (typeBlock[0] && typeBlock[0].competence_templates && typeBlock[0].competence_templates.length) {
            const data = typeBlock[0].competence_templates.filter(
              (resp) => (resp && !resp.score_conversion_id) || !resp.score_conversion_id._id,
            );
            if (data && data.length) {
              allow = true;
            } else {
              allow = false;
            }
          }
        }
      }
    }
    return allow;
  }

  selectBlock(block, ins, alreadyValidate?) {

    let validation = true;
    if (this.isDataChanged() && !alreadyValidate) {
      validation = false;
    }

    if (validation) {
      if (ins === 'submit') {
        let allow = true;

        if (this.grandOralEditData) {
          let lengthArr = this.grandOralEditData && this.grandOralEditData.block_of_competence_templates.length;
          if (this.grandOralList.length === lengthArr) {
            if (this.grandOralEditData.block_of_competence_templates && this.grandOralEditData.block_of_competence_templates.length) {
              this.grandOralEditData.block_of_competence_templates.forEach((blocks, blockInd) => {
                if (blocks && blocks.competence_templates && blocks.competence_templates.length) {
                  const data = blocks.competence_templates.filter(
                    (resp) => (resp && !resp.score_conversion_id) || !resp.score_conversion_id._id,
                  );
                  if (data && data.length) {
                    allow = true;
                  } else {
                    allow = false;
                  }
                }
              });
            }
          } else {
            allow = true;
          }
          if (!allow) {
            this.stepBlock = false;
            this.stepSubmit = true;
            this.selectedBlockStepper = -1;
          } else {
            Swal.fire({
              type: 'warning',
              allowEscapeKey: true,
              title: this.translate.instant('Please complete the mark entry before submitting the result'),
              confirmButtonText: this.translate.instant('OK'),
            }).then((result) => {
              if (result) {
                this.blocNotCompleted = true;
              }
            });
          }
        } else {
          Swal.fire({
            type: 'warning',
            allowEscapeKey: true,
            title: this.translate.instant('Please complete the mark entry before submitting the result'),
            confirmButtonText: this.translate.instant('OK'),
          }).then((result) => {
            if (result) {
              this.blocNotCompleted = true;
            }
          });
        }
      } else {
        this.selectedBlockStepper = ins;
        if (ins > this.blockIndex) {
          this.nextIndex = ins;
          this.blockIndex = ins;
        } else {
          this.nextIndex = ins;
          this.blockIndex = ins;
        }
        this.removeValueArray();
        this.getGrandOral();
        this.stepBlock = true;
        this.stepSubmit = false;
      }
    } else {
      Swal.fire({
        type: 'warning',
        title: this.translate.instant('TMTC_S01.TITLE'),
        text: this.translate.instant('TMTC_S01.TEXT'),
        confirmButtonText: this.translate.instant('TMTC_S01.BUTTON_1'),
        showCancelButton: true,
        cancelButtonText: this.translate.instant('TMTC_S01.BUTTON_2'),
        allowEscapeKey: false,
        allowOutsideClick: false,
      }).then((result) => {
        if (result.value) {
          // stop it

        } else {
          this.selectBlock(block, ins, true);
          this.savedFormValue = _.cloneDeep(this.templateForm.value);
        }
      });
    }
  }

  leave(data, alreadyValidate?) {
    let validation = true;
    if (this.isDataChanged() && !alreadyValidate) {
      validation = false;
    }

    if (validation) {

      this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
        if (data.jury_organization_id.jury_activity === 'off_platform_jury') {
          this.router.navigate(['/jury-organization', data.jury_organization_id._id, 'jury-mark-entry']);
        } else {
          this.router.navigate(['/jury-organization', data.jury_organization_id._id, 'schedule-juries']);
        }
      });
    } else {
      Swal.fire({
        type: 'warning',
        title: this.translate.instant('TMTC_S01.TITLE'),
        text: this.translate.instant('TMTC_S01.TEXT'),
        confirmButtonText: this.translate.instant('TMTC_S01.BUTTON_1'),
        showCancelButton: true,
        cancelButtonText: this.translate.instant('TMTC_S01.BUTTON_2'),
        allowEscapeKey: false,
        allowOutsideClick: false,
      }).then((result) => {
        if (result.value) {
          // stop it

        } else {
          this.leave(data, true);
          this.savedFormValue = _.cloneDeep(this.templateForm.value);
        }
      });
    }
  }

  goToScheduleJuries(data) {

    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
      if (data.jury_organization_id.jury_activity === 'off_platform_jury') {
        this.router.navigate(['/jury-organization', data.jury_organization_id._id, 'jury-mark-entry']);
      } else {
        this.router.navigate(['/jury-organization', data.jury_organization_id._id, 'schedule-juries']);
      }
    });
  }

  isDataChanged() {
    const savedForm = JSON.stringify(this.savedFormValue);
    const currentForm = JSON.stringify(this.templateForm.value);
    if (savedForm !== currentForm) {


      return true;
    } else {
      return false;
    }
  }

  checkStatusGOSubmit() {
    if ((this.isPresidentJury || this.isJuryCorector) && !this.isGrandOralSubmitted) {
      return true;
    } else {
      return false;
    }
  }

  checkStatusGOValidate() {
    if (this.isPresidentJury || this.isJuryCorector) {
      return false;
    } else if (this.isCertifierAdmin || this.isUserADMTC) {
      return true;
      // if (this.markEntryTaskStatus !== 'validated' ) {
      //   return true;
      // }
    }
  }

  swalError(err) {
    this.isWaitingForResponse = false;
    Swal.fire({
      type: 'error',
      title: 'Error',
      text: err && err['message'] ? err['message'] : err,
      confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
    });
  }

  generateRefBlock(data, index) {
    let refId;
    if (data?.block_id?.is_specialization) {
      refId = 'S' + (this.allSpecializationBlockId.indexOf(data?.block_id?._id) + 1);
    } else {
      refId = data?.block_id?.block_of_tempelate_competence?.ref_id;
    }
    return refId
  }

  downloadResultFile(data) {
    this.isWaitingForResponse = true;
    const payload = {
      rncp_id: data.rncp_title._id,
      student_id: data.students.student_id._id,
      lang: this.translate.currentLang,
      grand_oral_id: data.jury_organization_id._id,
      is_from_mark_entry: true,
    };

    this.subs.sink = this.rncpTitleService.downloadGrandOralResult(payload).subscribe((resp) => {
      let fileName;
      fileName = _.cloneDeep(resp['fileName']);

      this.isWaitingForResponse = false;
      const a = document.createElement('a');
      a.target = 'blank';
      a.href = `${environment.apiUrl}/fileuploads/${fileName.fileName}?download=true`.replace('/graphql', '');
      a.download = fileName.fileName;
      a.click();
      a.remove();
      // const newBlob = new Blob([resp], { type: "text/pdf" });
      // const data = window.URL.createObjectURL(newBlob);
      // const link = document.createElement('a');
      // link.href = data;
      // link.target = '_blank';
      // link.download = this.translate.instant('Grand Oral Result') + '.pdf';
      // document.body.appendChild(link);
      // link.click();
      // link.remove();
    });
  }
}
