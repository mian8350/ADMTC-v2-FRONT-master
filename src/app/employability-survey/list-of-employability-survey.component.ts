import { PermissionService } from 'app/service/permission/permission.service';
import { AfterViewInit, Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { SelectionModel } from '@angular/cdk/collections';
import { SubSink } from 'subsink';
import { UntypedFormControl } from '@angular/forms';
import { CreateEmployabilitySurveyProcessDialogComponent } from './create-employability-survey-process-dialog/create-employability-survey-process-dialog.component';
import { EmployabilitySurveyService } from 'app/service/employability-survey/employability-survey.service';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import Swal from 'sweetalert2';
import * as _ from 'lodash';
import { debounceTime, map, startWith, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { JuryOrganizationService } from 'app/service/jury-organization/jury-organization.service';
import { UtilityService } from 'app/service/utility/utility.service';
import { PageTitleService } from 'app/core/page-title/page-title.service';
import { FormBuilderService } from 'app/service/form-builder/form-builder.service';

@Component({
  selector: 'ms-list-of-employability-survey',
  templateUrl: './list-of-employability-survey.component.html',
  styleUrls: ['./list-of-employability-survey.component.scss'],
})
export class ListOfEmployabilitySurveyComponent implements OnInit, AfterViewInit, OnDestroy {
  displayedColumns: string[] = ['name', 'title', 'class', 'template_selected', 'type', 'status', 'action'];
  filterColumns: string[] = ['nameFilter', 'titleFilter', 'classFilter', 'templateFilter', 'typeFilter', 'statusFilter', 'actionFilter'];
  dataSource = new MatTableDataSource([]);
  noData: any;
  selection = new SelectionModel<any>(true, []);
  private subs = new SubSink();
  isWaitingForResponse = false;
  dataCount = 0;
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  sortValue = null;

  nameFilter = new UntypedFormControl(null);
  classFilter = new UntypedFormControl(null);
  titleFilter = new UntypedFormControl(null);
  templateFilter = new UntypedFormControl(null);
  typeFilter = new UntypedFormControl(null);
  statusFilter = new UntypedFormControl(null);
  isReset = false;

  filteredValues = {
    name: '',
    class_id: '',
    rncp_title_id: '',
    form_builder_id: '',
  };
  currentPage: number = 0;

  classList = [];
  titleList = [];
  esList = [];
  surveyTypeList = ['one_time', 'continuous'];
  statusList = ['all_survey_completed', 'survey_not_completed_due_date_not_passed', 'survey_not_completed_due_date_already_passed', 'not_started'];
  classFiltered: Observable<any[]>;
  titleFiltered: Observable<any[]>;
  esTemplateListFilter: Observable<any[]>;
  surveyTypeListFilter: Observable<any[]>;
  statusListFilter: Observable<any[]>;
  isPageLoading = false;

  constructor(
    public dialog: MatDialog,
    private esService: EmployabilitySurveyService,
    private router: Router,
    private translate: TranslateService,
    private juryOrgServ: JuryOrganizationService,
    private utilService: UtilityService,
    private rncpTitleService: RNCPTitlesService,
    private pageTitleService: PageTitleService,
    private formBuilderService: FormBuilderService,
    public permissionService: PermissionService
  ) {}

  ngOnInit() {
    this.pageTitleService.setTitle('List of Employability Survey');
    // this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
    //   this.pageTitleService.setTitle(this.translate.instant('List of Employability Survey'));
    // });
    this.initFilter();
    this.getAllClass();
    this.getAllTitle();
    this.getESTemplate();
    this.getSurveyType();
    this.getStatus();
    this.fetchAllSurveyProcess();
    this.paginator.pageSize = 10;
    this.subs.sink = this.translate.onLangChange.pipe().subscribe(() => {
      this.getStatus();
    })
  }

  initFilter() {
    this.subs.sink = this.nameFilter.valueChanges.pipe(debounceTime(400)).subscribe((statusSearch) => {
      // const symbol = /[-!$%^&*()_+|~=`{}\[\]:";'<>?,.\/]/;
      const symbol1 = /\\/;
      if (!statusSearch.match(symbol1)) {
        this.filteredValues.name = statusSearch ? statusSearch.toLowerCase() : '';
        this.paginator.pageIndex = 0;
        if (!this.isReset) {
          this.fetchAllSurveyProcess();
        }
      } else {
        this.nameFilter.setValue('');
        this.filteredValues.name = '';
        this.paginator.pageIndex = 0;
        if (!this.isReset) {
          this.fetchAllSurveyProcess();
        }
      }
    });
  }

  ngAfterViewInit() {
    this.subs.sink = this.paginator.page
      .pipe(
        startWith(null),
        tap(() => {
          if (!this.isReset) {
            this.fetchAllSurveyProcess();
          }
        }),
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    this.pageTitleService.setTitle('');
  }

  fetchAllSurveyProcess() {
    const pagination = {
      limit: this.paginator.pageSize ? this.paginator.pageSize : 10,
      page: this.paginator.pageIndex ? this.paginator.pageIndex : 0,
    };
    this.isWaitingForResponse = true;
    this.esService.getAllEmployabilitySurveyProcess(pagination, this.filteredValues, this.sortValue).subscribe(
      (resp) => {
        if (resp) {
          let processes = _.cloneDeep(resp);
          processes = this.filterUniqueTemplateNames(processes);

          this.dataSource.data = processes;
          this.dataCount = resp.length > 0 && resp[0].count_document ? resp[0].count_document : 0;

          this.isWaitingForResponse = false;
        }
        this.noData = this.dataSource.connect().pipe(map((data) => data.length === 0));
        setTimeout(() => (this.isReset = false), 400);
      },
      (err) => (this.isWaitingForResponse = false),
    );
  }

  filterUniqueTemplateNames(resp) {
    return resp.map((process) => ({
      ...process,
      employability_surveys: process.employability_surveys
        ? this.removeDuplicatesInSurveyTemplates(
            process.employability_surveys,
            process.is_es_new_flow_form_builder ? 'form_builder_id' : 'questionnaire_template_id',
          )
        : process.employability_surveys,
    }));
  }

  removeDuplicatesInSurveyTemplates(arr, key) {
    if (!arr || !Array.isArray(arr)) return;
    let modified = arr.filter((value, index, self) => index === self.findIndex((t) => t[key] && value[key] && t[key]._id === value[key]._id));

    return modified;
  }

  sortData(sort: Sort) {
    this.sortValue = sort.direction ? { [sort.active]: sort.direction ? sort.direction : `asc` } : null;
    this.paginator.pageIndex = 0;
    if (!this.isReset) {
      this.fetchAllSurveyProcess();
    }
    // this.getAllJuryOrganizationData();
    // if (this.dataLoaded) {
    //   this.paginator.pageIndex = 0;
    //   this.getAllJuryOrganizationsList();
    //   if (!this.isReset) {
    //     this.getAllJuryOrganizationsList();
    //   }
    // }
  }

  resetAllFilter() {
    this.isReset = true;
    this.paginator.pageIndex = 0;
    this.filteredValues = {
      name: '',
      class_id: '',
      rncp_title_id: '',
      form_builder_id: '',
    };
    this.sort.sort({ id: '', start: 'asc', disableClear: false });
    this.sort.direction = '';
    this.sort.active = '';
    this.sortValue = null;
    // this.dataSource.filter = JSON.stringify(this.filteredValues);
    this.nameFilter.setValue('');
    this.titleFilter.setValue('');
    this.classFilter.setValue('');
    this.templateFilter.setValue('');
    this.typeFilter.setValue('');
    this.statusFilter.setValue('');
    this.getAllClass();
    this.fetchAllSurveyProcess();
  }

  openAddSurveyDialog() {
    let dialogRef = this.dialog
      .open(CreateEmployabilitySurveyProcessDialogComponent, {
        width: '650px',
        panelClass: 'certification-rule-pop-up',
        disableClose: true,
      })
      .afterClosed()
      .subscribe((payload: any) => {
        // if (payload) {
        //   const payloadSend = this.createPayload(payload);
        //   this.submitSurveyProcess(payload);
        // }
      });
  }

  createPayload(data) {
    if (data) {
      if (data.employability_survey_type === 'continuous') {
        const payload = {
          rncp_title_id: data.rncp_title_id,
          class_id: data.class_id,
          name: data.name,
          employability_survey_type: data.employability_survey_type,
        };
        return payload;
      } else {
        const payload = {
          rncp_title_id: data.rncp_title_id,
          class_id: data.class_id,
          name: data.name,
          employability_survey_type: data.employability_survey_type,
          type_of_student_participant: data.type_of_student_participant,
        };
        return payload;
      }
    }
  }

  submitSurveyProcess(payload: any) {
    this.isPageLoading = true;
    this.subs.sink = this.esService.createEmployabilitySurveyProcess(payload).subscribe(
      (resp) => {
      if (resp.data) {
        this.isPageLoading = false;

        Swal.fire({
          type: 'success',
          title: 'Bravo',
        }).then(() => {
          this.router.navigate(['/employability-survey/details/', resp.data.CreateEmployabilitySurveyProcess._id]);
        });
      } else {
        this.isPageLoading = false;
        if (resp.errors[0].message === 'Employability process name already exist') {
          this.swalErrorNameExist();
        } else if (resp.errors[0].message === 'No student matching condition in this title') {

          this.swalErrorStudentNotFound(payload.type_of_student_participant);
        }

      }
    }
    );
  }

  goToESDetails(esProcess) {

    this.router.navigate(['employability-survey', 'details', esProcess._id]);
  }

  deleteESProcess(esProcess) {
    const ESName = esProcess.name;
    Swal.fire({
      title: this.translate.instant('Surveys_S3.TITLE'),
      html: this.translate.instant('Surveys_S3.TEXT', { ESName }),
      type: 'warning',
      allowEscapeKey: true,
      showCancelButton: true,
      confirmButtonText: this.translate.instant('Surveys_S3.BUTTON1'),
      cancelButtonText: this.translate.instant('Surveys_S3.BUTTON2'),
    }).then((result) => {
      if (result.value) {
        this.subs.sink = this.esService.deleteEmployabilitySurveyProcess(esProcess._id).subscribe((resp) => {
          Swal.fire({
            type: 'success',
            title: this.translate.instant('Bravo'),
          }).then((res) => {
            this.fetchAllSurveyProcess();
          });
        });
      }
    });
  }

  getAllClass(rncp_id?) {
    const titleId = rncp_id ? rncp_id : '';
    this.subs.sink = this.esService.getAllClass(titleId).subscribe((res) => {
      if (res) {
        this.classList = _.cloneDeep(res);
        this.classFiltered = this.classFilter.valueChanges.pipe(
          startWith(''),
          map((searchText) =>
            this.classList
              .filter((classes) => (classes ? classes.name.toLowerCase().includes(searchText.toLowerCase()) : false))
              .sort((a: any, b: any) => a.name.localeCompare(b.name)),
          ),
        );
      }
    });
  }

  classSelected(value) {
    this.filteredValues.class_id = value === 'AllS' ? '' : value;
    this.paginator.pageIndex = 0;
    if (!this.isReset) {
      this.fetchAllSurveyProcess();
    }
  }

  getStatus() {
    this.statusListFilter = this.statusFilter.valueChanges.pipe(
      startWith(''),
      map((searchText) =>
        this.statusList
          .filter((statuss) => (statuss ? this.translate.instant(statuss).toLowerCase().includes(searchText.toLowerCase()) : false))
          .sort((a: any, b: any) => {
            if (this.utilService.simplifyRegex(this.translate.instant(a)) > this.utilService.simplifyRegex(this.translate.instant(b))) {
              return 1;
            } else if (this.utilService.simplifyRegex(this.translate.instant(b)) > this.utilService.simplifyRegex(this.translate.instant(a))) {
              return -1;
            } else {
              return 0;
            }
          }),
      ),
    );
  }

  statusSelected(value) {
    if (value !== 'AllS') {
      this.filteredValues['employability_survey_completed_status'] = value;
      this.paginator.pageIndex = 0;
      if (!this.isReset) {
        this.fetchAllSurveyProcess();
      }
    } else {
      if (this.filteredValues['employability_survey_completed_status']) {
        delete this.filteredValues['employability_survey_completed_status'];
        this.paginator.pageIndex = 0;
        if (!this.isReset) {
          this.fetchAllSurveyProcess();
        }
      }
    }
  }

  getAllTitle() {
    this.subs.sink = this.juryOrgServ.getTitleDropdownFilterList().subscribe((res) => {
      if (res) {
        this.titleList = _.cloneDeep(res);
        this.titleFiltered = this.titleFilter.valueChanges.pipe(
          startWith(''),
          map((searchTxt) =>
            this.titleList
             .filter((option) => (option ? option.short_name.toLowerCase().includes(searchTxt.toLowerCase()) : ''))
              .sort((firstTitle, secondTitle) => {
                if (
                  this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(firstTitle.short_name)).toLowerCase() <
                  this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(secondTitle.short_name)).toLowerCase()
                ) {
                  return -1;
                } else if (
                  this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(firstTitle.short_name)).toLowerCase() >
                  this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(secondTitle.short_name)).toLowerCase()
                ) {
                  return 1;
                } else {
                  return 0;
                }
              }),
          ),
        );
      }
    });
  }

  titleSelected(value) {
    this.classFilter.setValue('');
    this.filteredValues.class_id = '';
    this.filteredValues.rncp_title_id = value === 'AllS' ? '' : value;
    this.paginator.pageIndex = 0;
    if (!this.isReset) {
      this.fetchAllSurveyProcess();
    }
    this.getAllClass(this.filteredValues.rncp_title_id);
  }

  getESTemplate() {
    this.subs.sink = this.formBuilderService.getAllFormBuildersDropdown({status: true, template_type: 'employability_survey'}).subscribe((resp) => {

      if (resp) {
        this.esList = _.cloneDeep(resp);
        this.esTemplateListFilter = this.templateFilter.valueChanges.pipe(
          startWith(''),
          map((searchText) =>
            this.esList
              .filter((eslist) => (eslist && eslist.form_builder_name ? this.utilService.simpleDiacriticSensitiveRegex(eslist.form_builder_name).toLowerCase().includes(this.utilService.simpleDiacriticSensitiveRegex(searchText).toLowerCase()) : false))
              .sort((a: any, b: any) => {
                if (
                  this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(a.form_builder_name)).toLowerCase() <
                  this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(b.form_builder_name)).toLowerCase()
                ) {
                  return -1;
                } else if (
                  this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(a.form_builder_name)).toLowerCase() >
                  this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(b.form_builder_name)).toLowerCase()
                ) {
                  return 1;
                } else {
                  return 0;
                }
              }
                // a.form_builder_name.localeCompare(b.form_builder_name)
              ),

          ),
        );
      }
    });
  }

  templateSelected(value) {
    this.filteredValues.form_builder_id = value === 'AllS' ? '' : value;
    this.paginator.pageIndex = 0;
    if (!this.isReset) {
      this.fetchAllSurveyProcess();
    }
  }

  getSurveyType() {
    this.surveyTypeListFilter = this.typeFilter.valueChanges.pipe(
      startWith(''),
      map((searchText) =>
        this.surveyTypeList
          .filter((surveyType) =>
            surveyType ? this.translate.instant(surveyType).toLowerCase().includes(searchText.toLowerCase()) : false,
          )
          .sort((a: any, b: any) => a.localeCompare(b)),
      ),
    );
  }

  surveyTypeSelected(value) {
    if (value !== 'AllS') {
      this.filteredValues['employability_survey_type'] = value;
      this.paginator.pageIndex = 0;
      if (!this.isReset) {
        this.fetchAllSurveyProcess();
      }
    } else {
      if (this.filteredValues['employability_survey_type']) {
        delete this.filteredValues['employability_survey_type'];
        this.paginator.pageIndex = 0;
        if (!this.isReset) {
          this.fetchAllSurveyProcess();
        }
      }
    }
  }

  swalErrorNameExist() {
    Swal.fire({
      type: 'warning',
      title: this.translate.instant('Uniquename_S2.TITLE'),
      text: this.translate.instant('Uniquename_S2.TEXT'),
      confirmButtonText: this.translate.instant('Uniquename_S2.BUTTON'),
    });
  }

  swalErrorStudentNotFound(type) {

    const passTypes = ['all_pass_final_transcript', 'all_pass_after_retake_final_transcript'];
    const failTypes = ['all_fail_final_transcript', 'all_fail_after_retake_final_transcript'];
    const retakeTypes = ['all_retake_final_transcript'];

    let typeName = '';
    if (passTypes.includes(type)) {
      typeName = this.translate.instant('pass');
    } else if (failTypes.includes(type)) {
      typeName = this.translate.instant('fail');
    } else if (retakeTypes.includes(type)) {
      typeName = this.translate.instant('retake');
    }

    Swal.fire({
      type: 'error',
      title: this.translate.instant('Survey_Student_Not_Found.TITLE'),
      html: this.translate.instant('Survey_Student_Not_Found.TEXT', { typeName: typeName }),
      confirmButtonText: this.translate.instant('Survey_Student_Not_Found.BUTTON'),
    });
  }

  renderTemplateNameTooltips(surveys, is_es_new_flow_form_builder: boolean) {
    let tooltip = '';
    let count = 0;
    // const type = _.uniqBy(recipients, 'name');
    if (surveys && surveys.length) {
      for (const survey of surveys) {
        count++;
        if (!survey.form_builder_id && !survey.questionnaire_template_id) return;
        if (count > 1) {
          tooltip = tooltip + ', ';
          tooltip =
            tooltip +
            (is_es_new_flow_form_builder ? survey.form_builder_id.form_builder_name : survey.questionnaire_template_id.questionnaire_name);
        } else {
          tooltip =
            tooltip +
            (is_es_new_flow_form_builder ? survey.form_builder_id.form_builder_name : survey.questionnaire_template_id.questionnaire_name);
        }
      }
    }
    return tooltip;
  }
}
