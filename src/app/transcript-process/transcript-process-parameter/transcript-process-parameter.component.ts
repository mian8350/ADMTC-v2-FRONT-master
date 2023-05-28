import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { UntypedFormArray, UntypedFormControl, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { ActivatedRoute, Router } from '@angular/router';
import { TranscriptProcessService } from 'app/service/transcript-process/transcript-process.service';
import { debounceTime, map } from 'rxjs/operators';
import { SubSink } from 'subsink';
import * as _ from 'lodash';
import Swal from 'sweetalert2';
import { UtilityService } from 'app/service/utility/utility.service';
import { TranslateService } from '@ngx-translate/core';
import { NestedTreeControl } from '@angular/cdk/tree';

@Component({
  selector: 'ms-transcript-process-parameter',
  templateUrl: './transcript-process-parameter.component.html',
  styleUrls: ['./transcript-process-parameter.component.scss'],
})
export class TranscriptProcessParameterComponent implements OnInit, OnDestroy {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @Input() titleId: '';
  @Input() classId: '';
  @Input() transcriptId: '';
  private subs = new SubSink();
  dataSource = new MatTableDataSource([]);

  treeControl = new NestedTreeControl<any>((node) => node.children);
  dataTreeSource = new MatTreeNestedDataSource<any>();

  parameterForm: UntypedFormGroup;
  firstForm: any;
  savedForm;
  displayedColumns: string[] = ['school'];
  filterColumns: string[] = ['schoolFilter'];
  formattedSchool = [];
  blocks = [];
  filteredValues = { school: '' };
  schoolFilter = new UntypedFormControl('');

  noData;
  dataCount = 0;
  isWaitingForResponse = false;

  savedTranscriptData;

  expandedToggle: boolean[][] = [];

  private timeOutVal: any;

  constructor(
    private fb: UntypedFormBuilder,
    private transcriptService: TranscriptProcessService,
    private router: Router,
    private route: ActivatedRoute,
    private utilService: UtilityService,
    private translate: TranslateService,
  ) {}

  ngOnInit() {
    this.initForm();
    this.getFormData();
  }

  initForm() {
    this.parameterForm = this.fb.group({
      is_final_transcript: [false],
      jury_decision: [false],
      transcript_process_status: [''],
      school_ids: this.fb.array([]),
      block_competence_condition_details: this.fb.array([]),
      block_competence_template_details: this.fb.array([]),
      block_competence_softskill_details: this.fb.array([]),
    });
    this.firstForm = _.cloneDeep(this.parameterForm.value);
  }

  getBlockConditionDetails(): UntypedFormArray {
    return this.parameterForm.get('block_competence_condition_details') as UntypedFormArray;
  }

  getBlockTemplateDetails(): UntypedFormArray {
    return this.parameterForm.get('block_competence_template_details') as UntypedFormArray;
  }

  getBlocksoftskillDetails(): UntypedFormArray {
    return this.parameterForm.get('block_competence_softskill_details') as UntypedFormArray;
  }

  initBlockForm(blockId, isBlockSelected, isPreviousBlock) {
    return this.fb.group({
      block_id: [blockId ? blockId : '', [Validators.required]],
      is_block_selected: [isBlockSelected ? isBlockSelected : false],
      is_block_coming_from_previous_process: [isPreviousBlock ? isPreviousBlock : false]
    });
  }

  getFormData() {
    this.isWaitingForResponse = true;
    this.subs.sink = this.transcriptService.getOneTranscriptDetailProcess(this.transcriptId).subscribe(
      (resp) => {
        this.isWaitingForResponse = false;

        if (resp) {
          this.savedTranscriptData = _.cloneDeep(resp);
          const response = _.cloneDeep(resp);
          if (response.school_ids && response.school_ids.length) {
            this.dataSource.data = response.school_ids;
            this.dataSource.paginator = this.paginator;
            this.dataCount = response.school_ids.length ? response.school_ids.length : 0;
            this.noData = this.dataSource.connect().pipe(map((data) => data.length === 0));

            this.formattedSchool = response.school_ids.map((school) => school._id);

            this.setFilterAndSorting();
          } else {
            this.getSchoolList();
          }

          this.parameterForm.patchValue(response);
          this.firstForm = _.cloneDeep(this.parameterForm.value);
          this.savedForm = this.parameterForm.value;


        }
        this.getBlockList();
      },
      (err) => {
        this.isWaitingForResponse = false;
        this.formattedSchool = [];
        this.getBlockList();
      },
    );
  }

  createPayload() {

    let payload = this.parameterForm.value;
    payload['school_ids'] = this.formattedSchool;

    if (payload.is_final_transcript) {
      payload['type'] = 'final_transcript';
    } else {
      payload['type'] = 'transcript';
    }

    return payload;
  }

  createPayloadBlocksId(payload) {
    const tempPayload = _.cloneDeep(payload);


    let mappedBlocks = [];

    if (tempPayload.block_competence_condition_details && tempPayload.block_competence_condition_details.length) {
      tempPayload.block_competence_condition_details.forEach((block) => {
        if (block.block_id && block.is_block_selected) {
          mappedBlocks.push(block.block_id);
        }
      });
    }

    return mappedBlocks;
  }

  saveFirstStepTranscript() {
    const payload = this.createPayload();
    this.isWaitingForResponse = true;
    this.subs.sink = this.transcriptService.saveTranscriptProcessStepOne(this.transcriptId, payload).subscribe(
      (resp) => {
        this.isWaitingForResponse = false;
        Swal.fire({
          type: 'success',
          title: this.translate.instant('Bravo !'),
          confirmButtonText: this.translate.instant('Ok'),
          allowEnterKey: false,
          allowEscapeKey: false,
          allowOutsideClick: false,
        }).then(res => {

          if (payload.block_competence_condition_details && this.allowStartInputDecision()) {
            this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
              this.router.navigate(['transcript-process', this.transcriptId], { queryParams: { tab: 'publishParameters' } });
            });
          } else {
            this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
              this.router.navigate(['transcript-process', this.transcriptId], { queryParams: { tab: 'parameter' } });
            });
          }
        })
      },
      (err) => {
        this.isWaitingForResponse = false;

        Swal.fire({
          type: 'error',
          title: 'Error',
          text: err && err['message'] ? err['message'] : err,
          confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
        });
      },
    );
  }

  startInputDecision() {
    let timeDisabled = 5;
    Swal.fire({
      type: 'warning',
      title: this.translate.instant('TRANSCRIPT_S14.TITLE'),
      html: this.translate.instant('TRANSCRIPT_S14.TEXT'),
      allowEscapeKey: true,
      showCancelButton: true,
      confirmButtonText: this.translate.instant('TRANSCRIPT_S14.CONFIRM', { timer: timeDisabled }),
      cancelButtonText: this.translate.instant('TRANSCRIPT_S14.CANCEL'),
      allowOutsideClick: false,
      allowEnterKey: false,
      onOpen: () => {
        Swal.disableConfirmButton();
        const confirmBtnRef = Swal.getConfirmButton();
        const intVal = setInterval(() => {
          timeDisabled -= 1;
          confirmBtnRef.innerText = this.translate.instant('TRANSCRIPT_S14.CONFIRM') + ` (${timeDisabled})`;
        }, 1000);
        this.timeOutVal = setTimeout(() => {
          confirmBtnRef.innerText = this.translate.instant('TRANSCRIPT_S14.CONFIRM');
          Swal.enableConfirmButton();
          clearInterval(intVal);
          clearTimeout(this.timeOutVal);
        }, timeDisabled * 1000);
      },
    }).then((res) => {
      if (res.value) {
        const payload = this.createPayload();
        this.isWaitingForResponse = true;
        this.subs.sink = this.transcriptService.saveTranscriptProcessStepOne(this.transcriptId, payload).subscribe(
          (resp) => {
            this.isWaitingForResponse = false;
            if (resp) {
              this.checkForPassFailParameterDone();
            }
          },
          (err) => {
            this.isWaitingForResponse = false;
            this.swalError(err);
          },
        );
      }
    });
  }

  checkForPassFailParameterDone() {
    const payload = this.createPayload();
    this.isWaitingForResponse = true;
    const payloadBlockIds = this.createPayloadBlocksId(payload);

    this.subs.sink = this.transcriptService.getBlockNotHavePassFailCondition(this.titleId, this.classId, payloadBlockIds).subscribe(
      (responseValidation) => {
        this.isWaitingForResponse = false;
        if (responseValidation && responseValidation.length) {
          this.swalPassFailNotDone(responseValidation);
        } else {
          this.checkForTestValidation();
        }
      },
      (err) => {
        this.isWaitingForResponse = false;
        this.swalError(err);
      },
    );
  }

  checkForTestValidation() {
    const payload = this.createPayload();
    this.isWaitingForResponse = true;
    const payloadBlockIds = this.createPayloadBlocksId(payload);

    this.subs.sink = this.transcriptService.checkAllTestsInBlockValidatedUpdated(payloadBlockIds).subscribe(
      (responseValidation) => {
        this.isWaitingForResponse = false;
        if (responseValidation && responseValidation.length) {
          this.swalNotValidated(responseValidation);
        } else {
          this.callAPIStartInputDecision();
        }
      },
      (err) => {
        this.isWaitingForResponse = false;
        this.swalError(err);
      },
    );
  }

  callAPIStartInputDecision() {
    this.isWaitingForResponse = true;
    this.subs.sink = this.transcriptService.startTransriptProcess(this.transcriptId).subscribe(
      (response) => {
        this.isWaitingForResponse = false;
        Swal.fire({
          type: 'success',
          title: this.translate.instant('Bravo !'),
          confirmButtonText: this.translate.instant('OK'),
          allowEnterKey: false,
          allowEscapeKey: false,
          allowOutsideClick: false,
        }).then(() => {


          this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
            this.router.navigate(['transcript-process', response._id], { queryParams: { tab: 'resultInput' } });
          });
        });
      },
      (err) => {
        this.isWaitingForResponse = false;
        this.swalError(err);
      },
    );
  }

  leave() {
    let validation = false;
    const currentData = JSON.stringify(this.parameterForm.value);
    const savedData = JSON.stringify(this.savedForm);

    if (currentData === savedData) {
      validation = true;
    }

    if (!validation) {
      Swal.fire({
        type: 'warning',
        title: this.translate.instant('TMTC_S01.TITLE'),
        text: this.translate.instant('TMTC_S01.TEXT'),
        confirmButtonText: this.translate.instant('TMTC_S01.BUTTON_1'),
        showCancelButton: true,
        cancelButtonText: this.translate.instant('TMTC_S01.BUTTON_2'),
        allowOutsideClick: false,
      }).then((res) => {
        if (res.dismiss) {
          this.router.navigate(['/transcript-process']);
        }
      });
    } else {
      this.router.navigate(['/transcript-process']);
    }
  }

  getSchoolList() {
    this.isWaitingForResponse = true;
    this.subs.sink = this.transcriptService.getSchoolPCList([this.titleId], this.classId).subscribe(
      (resp) => {
        this.isWaitingForResponse = false;
        if (resp) {

          this.dataSource.data = resp;
          this.dataSource.paginator = this.paginator;
          this.setFilterAndSorting();
          this.dataCount = resp.length ? resp.length : 0;
          this.noData = this.dataSource.connect().pipe(map((data) => data.length === 0));

          this.formattedSchool = resp.map((school) => school._id);


        }
      },
      (err) => {
        this.isWaitingForResponse = false;
        this.formattedSchool = [];
      },
    );
  }

  setFilterAndSorting() {
    this.subs.sink = this.schoolFilter.valueChanges.subscribe((searchTxt) => {
      this.filteredValues.school = searchTxt;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });

    this.dataSource.sortingDataAccessor = (item, property) => {

      switch (property) {
        case 'school':
          return item.short_name ? item.short_name : null;
        default:
          return item[property];
      }
    };
    this.dataSource.sort = this.sort;
    this.dataSource.filterPredicate = this.customFilterPredicate();
  }

  reset() {
    this.paginator.pageIndex = 0;
    this.sort.sort({ id: null, start: 'desc', disableClear: false });
    this.filteredValues.school = '';
    this.dataSource.filter = JSON.stringify(this.filteredValues);
    this.schoolFilter.setValue('');
  }

  customFilterPredicate() {
    return function (data, filter: string): boolean {
      const searchString = JSON.parse(filter);

      const schoolFound = data.short_name
        ? data.short_name.toString().trim().toLowerCase().indexOf(searchString.school.toLowerCase()) !== -1
        : true;

      return schoolFound;
    };
  }

  getBlockList() {
    // Check first if the class if eval by competence or score. if competence need to filter based on block_type. on Score all.
    let classType;
    if (this.savedTranscriptData && this.savedTranscriptData.class_id && this.savedTranscriptData.class_id.type_evaluation === 'expertise') {
      classType = {
        block_type: 'competence'
      };
    }

    this.isWaitingForResponse = true;
    this.subs.sink = this.transcriptService.getAllBlocksForTranscript(this.titleId, this.classId, classType).subscribe(
      (resp) => {
        this.isWaitingForResponse = false;
        if (resp) {
          const response = _.cloneDeep(resp);


          const filteredblock = response.filter((block) => block.count_for_title_final_score);
          this.blocks = filteredblock;

          const selectedBlocks =
            this.savedTranscriptData && this.savedTranscriptData.block_competence_condition_details
              ? this.savedTranscriptData.block_competence_condition_details
              : [];
          if (filteredblock && filteredblock.length) {
            filteredblock.forEach((block, blockIndex) => {
              if (block && block._id) {
                const found = selectedBlocks.find((selectedBlock) => selectedBlock.block_id && selectedBlock.block_id._id === block._id);
                if (found) {
                  this.getBlockConditionDetails().push(this.initBlockForm(block._id, found.is_block_selected, found.is_block_coming_from_previous_process));
                } else {
                  this.getBlockConditionDetails().push(this.initBlockForm(block._id, false, false));
                }

                this.expandedToggle.push([]);
                if (block.subjects && block.subjects.length) {
                  block.subjects.forEach((subject, subjectIndex) => {
                    this.expandedToggle[blockIndex].push(false);
                  });
                }
              }
            });
          }

          this.savedForm = this.parameterForm.value;
          this.firstForm = _.cloneDeep(this.parameterForm.value);


        }
      },
      (err) => {
        this.isWaitingForResponse = false;
      },
    );
  }

  comparison() {
    const firstForm = JSON.stringify(this.firstForm);
    const form = JSON.stringify(this.parameterForm.value);
    if (firstForm === form) {
      return true;
    } else {
      return false;
    }
  }

  swalError(err) {

    Swal.fire({
      type: 'error',
      title: 'Error',
      text: err && err['message'] ? err['message'] : err,
      confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
    });
  }

  swalPassFailNotDone(blockList) {

    let blockListOrder = '';

    if (blockList && blockList.length) {
      blockListOrder += '<ul style="text-align: start; margin-left: 20px">';
      blockList.forEach((block) => {
        if (block && block && block.block_of_competence_condition) {
          blockListOrder += `<li> ${this.utilService.cleanHTML(block.block_of_competence_condition)} </li>`;
        }
      });
      blockListOrder += '</ul>';
    }

    Swal.fire({
      type: 'error',
      title: this.translate.instant('TRANSCRIPT_S15.TITLE'),
      html: this.translate.instant('TRANSCRIPT_S15.TEXT', { listOfBlock: blockListOrder }),
      confirmButtonText: this.translate.instant('TRANSCRIPT_S15.BUTTON'),
    });
  }

  swalNotValidated(blockList) {

    let blockListOrder = '';

    // if (blockList && blockList.length) {
    //   blockListOrder += '<ul style="text-align: start; margin-left: 20px">';
    //   blockList.forEach((block) => {
    //     if (block && block.block_id && block.block_id.block_of_competence_condition) {
    //       blockListOrder += `<li> ${this.utilService.cleanHTML(block.block_id.block_of_competence_condition)} </li>`;
    //     }
    //     if (block && block.test_id && block.test_id.length) {
    //       blockListOrder += '<ul style="text-align: start;">';
    //       block.test_id.forEach((test) => {
    //         if (test && test.name) {
    //           blockListOrder += `<li> ${test.name} </li>`;
    //         }
    //       });
    //       blockListOrder += '</ul>';
    //     }
    //   });
    //   blockListOrder += '</ul>';
    // }

    Swal.fire({
      type: 'error',
      title: this.translate.instant('TRANSCRIPT_S5.TITLE'),
      html: this.translate.instant('TRANSCRIPT_S5.TEXT'),
      confirmButtonText: this.translate.instant('TRANSCRIPT_S5.BUTTON'),
    });
  }

  allowStartInputDecision() {
    const blocksData = this.getBlockConditionDetails().value;

    let result = false;

    if (this.parameterForm.get('is_final_transcript').value) {
      if (blocksData && blocksData.length && blocksData.some((block) => !block.is_block_selected)) {
        result = false;
      } else {
        result = true;
      }
    } else {
      if (blocksData && blocksData.length && blocksData.some((block) => block.is_block_selected)) {
        result = true;
      }
    }

    if (!(blocksData && blocksData.length)) {
      result = false;
    }

    return result;
  }

  changeTranscriptToggle(event: MatSlideToggleChange) {



    if (this.parameterForm.get('is_final_transcript').value) {
      const blocksData = this.getBlockConditionDetails().value;

      if (blocksData && blocksData.length) {
        blocksData.forEach((block, blockIndex) => {
          this.getBlockConditionDetails().at(blockIndex).get('is_block_selected').patchValue(true);
        });
      }
    }
  }

  openToggle(blockIndex, subjectIndex) {
    this.expandedToggle[blockIndex][subjectIndex] = !this.expandedToggle[blockIndex][subjectIndex];
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
