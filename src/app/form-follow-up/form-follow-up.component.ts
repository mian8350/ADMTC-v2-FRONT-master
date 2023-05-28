import { PermissionService } from 'app/service/permission/permission.service';
import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Observable } from 'rxjs';
import { debounceTime, map, startWith, tap, filter } from 'rxjs/operators';
import { SubSink } from 'subsink';
import { FormFollowUpService } from './form-follow-up.service';
import * as _ from 'lodash';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'app/service/auth-service/auth.service';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import { UtilityService } from 'app/service/utility/utility.service';
import { PageTitleService } from 'app/core/page-title/page-title.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'ms-form-follow-up',
  templateUrl: './form-follow-up.component.html',
  styleUrls: ['./form-follow-up.component.scss'],
})
export class FormFollowUpComponent implements OnInit, OnDestroy, AfterViewInit {
  private subs = new SubSink();

  displayedColumns: string[] = ['templateName', 'type', 'title', 'class', 'titleManager', 'action'];
  filterColumns: string[] = ['templateNameFilter', 'typeFilter', 'titleFilter', 'classFilter', 'titleManagerFilter', 'actionFilter'];
  dataSource = new MatTableDataSource([]);
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  dataCount: number;
  @ViewChild(MatSort, { static: true }) sort: MatSort;

  sortValue: any;
  isWaitingForResponse = true;
  templateCount = 0;
  noData: any;

  datas: any;

  filteredValues = {
    template_name: '',
    type: '',
    title: '',
    class: '',
    title_manager: '',
    logged_in_user_type_id: '',
  };

  templateNameFilter: UntypedFormControl = new UntypedFormControl('');

  typeFilter: UntypedFormControl = new UntypedFormControl('');
  typeFilterData = [
    { value: 'quality_file', label: 'Quality File' },
    { value: 'student_admission', label: 'Student Admission' },
  ];

  titleFilter: UntypedFormControl = new UntypedFormControl('');
  titleFilterData: any;
  filteredTitle: Observable<any>;

  classFilter: UntypedFormControl = new UntypedFormControl('');
  classFilterData: any;
  filteredClass: Observable<any>;
  filteredClassByTitle: any;

  titleManagerFilter = new UntypedFormControl('');
  userData: any;
  isUserAcadDir: any;
  isUserCertifierAdmin: boolean;
  titleId: string;
  classId: string;

  constructor(
    private formFollowUpService: FormFollowUpService,
    private router: Router,
    private route: ActivatedRoute,
    private rncpTitlesService: RNCPTitlesService,
    private authService: AuthService,
    private utilService: UtilityService,
    private translate: TranslateService,
    private pageTitleService: PageTitleService,
    private permissionService: PermissionService
  ) {}

  ngOnInit() {
    this.pageTitleService.setTitle('Form Follow Up Table');
    this.userData = this.authService.getCurrentUser();
    this.isUserAcadDir = this.utilService.isUserAcadir();
    this.isUserCertifierAdmin = this.utilService.isCertifierAdmin();

    this.isWaitingForResponse = true; 
    this.titleId = this.route.snapshot.queryParamMap.get('titleId');
    this.classId = this.route.snapshot.queryParamMap.get('classId');
    this.filteredValues.title = this.titleId ? this.titleId : '';
    this.filteredValues.class = this.classId ? this.classId : '';

    this.getDropdown();
    this.getFormFollowUpDatas();
    this.initFilter();
  }

  ngAfterViewInit() {
    // this.dataSource.sort = this.sort;
    this.subs.sink = this.paginator.page
      .pipe(
        startWith(null),
        tap(() => {
          this.getFormFollowUpDatas();
        }),
      )
      .subscribe();
  }

  getDropdown() {
    let userLogin = '';
    if (this.isUserAcadDir) {
      userLogin = 'acadir';
    } else if (this.isUserCertifierAdmin) {
      userLogin = 'certifier';
    } else {
      userLogin = null;
    }
    let filter = {
      logged_in_user_type_id: this.userData.entities[0].type._id
    }
    this.subs.sink = this.rncpTitlesService.getAllFormFollowUpDropdown(filter).subscribe((resp) => {
      if (resp) {
        const datas = _.cloneDeep(resp);
        this.titleFilterData = datas?.rncp_title_id;
        this.titleFilterData = _.uniqBy(this.titleFilterData, '_id');

        if(this.titleId) {
          const filteredClass = resp.filter( data => data._id === this.titleId);
          this.titleFilter.setValue(filteredClass[0].short_name)
        }
        this.filteredTitle = this.titleFilter.valueChanges.pipe(
          startWith(''),
          map((searchTxt) =>
            this.titleFilterData.filter((option) => {
              if (searchTxt) {
                return option.short_name.toLowerCase().includes(searchTxt.toLowerCase());
              }
              return true;
            }),
          ),
        );
      }
    });
  }

  getAllClass() {
    let filter = {
      rncp_title_id: this.filteredValues?.title ? this.filteredValues?.title : null
    };
    this.subs.sink = this.rncpTitlesService.getAllFormFollowUpDropdown(filter).subscribe((resp) => {
      if (resp) {
        const datas = _.cloneDeep(resp);

        this.classFilterData = datas?.class_ids;
        this.classFilterData = _.uniqBy(this.classFilterData, '_id');
        this.filteredClass = this.classFilterData;
        if(this.classId) {
          const filteredClass = resp.filter( data => data._id === this.classId);
          this.classFilter.setValue(filteredClass[0].name)
        }
        this.filteredClass = this.classFilter.valueChanges.pipe(
          startWith(''),
          map((searchTxt) =>
            this.classFilterData.filter((option) => {
              if (searchTxt) {
                return option.name.toLowerCase().includes(searchTxt.toLowerCase());
              }
              return true;
            }),
          ),
        );
      }
    });
  }

  getFormFollowUpDatas() {
    this.initFilter();
    this.getAllClass();
    this.isWaitingForResponse = true;
    const pagination = {
      limit: this.paginator.pageSize ? this.paginator.pageSize : 10,
      page: this.paginator.pageIndex ? this.paginator.pageIndex : 0,
    };
    let filter = ``;
    filter += `logged_in_user_type_id : "${this.userData.entities[0].type._id}"`;
    filter += this.filteredValues.template_name ? `template_name : "${this.filteredValues.template_name}"` : '';
    filter += this.filteredValues.type ? `template_type : "${this.filteredValues.type}"` : '';
    filter += this.filteredValues.title ? `rncp_title_id : "${this.filteredValues.title}"` : '';
    filter += this.filteredValues.class ? `class_id : "${this.filteredValues.class}"` : '';
    filter += this.filteredValues.title_manager ? `title_manager : "${this.filteredValues.title_manager}"` : '';


    this.subs.sink = this.formFollowUpService.getAllFormFollowUp(filter, this.sortValue, pagination).subscribe((resp) => {

      this.datas = _.cloneDeep(resp);
      if (resp) {
        this.filteredClassByTitle = resp;
        this.dataSource.data = resp;
        this.paginator.length = resp && resp[0] && resp[0].count_document ? resp[0].count_document : 0;
        this.dataCount = resp && resp[0] && resp[0].count_document ? resp[0].count_document : 0;
      }
      this.noData = this.dataSource.connect().pipe(map((data) => data.length === 0));
      this.isWaitingForResponse = false;
    });
  }

  initFilter() {

    this.subs.sink = this.templateNameFilter.valueChanges.pipe(debounceTime(800)).subscribe((nameSearch) => {
      this.filteredValues.template_name = nameSearch.toLowerCase();
      this.paginator.pageIndex = 0;
      this.getFormFollowUpDatas();
    });
    this.subs.sink = this.typeFilter.valueChanges.subscribe((typeSearch) => {
      this.filteredValues.type = typeSearch;
      this.paginator.pageIndex = 0;
      this.getFormFollowUpDatas();
    });
    this.subs.sink = this.titleManagerFilter.valueChanges.pipe(debounceTime(800)).subscribe((nameSearch) => {
      this.filteredValues.title_manager = nameSearch.toLowerCase();
      this.paginator.pageIndex = 0;
      this.getFormFollowUpDatas();
    });
  }

  setTitleFilter(titleId: string) {
    this.filteredValues.title = titleId;
    this.paginator.pageIndex = 0;
    if (!titleId) {
      this.filteredValues.class = '';
      this.classFilter.setValue('');
    }
    this.getFormFollowUpDatas();
  }

  setClassFilter(classId: string) {
    this.filteredValues.class = classId;
    this.paginator.pageIndex = 0;
    this.getFormFollowUpDatas();
  }

  resetSelection() {
    this.filteredValues = {
      template_name: '',
      type: '',
      title: '',
      class: '',
      title_manager: '',
      logged_in_user_type_id: '',
    };

    this.templateNameFilter.setValue('', { emitEvent: false });
    this.typeFilter.setValue('', { emitEvent: false });
    this.titleFilter.setValue('', { emitEvent: false });
    this.classFilter.setValue('', { emitEvent: false });
    this.titleManagerFilter.setValue('', { emitEvent: false });

    this.sort.direction = '';
    this.sort.active = '';
    this.sortValue = null;

    this.paginator.pageIndex = 0;

    this.classId = null;
    this.titleId = null;

    this.getDropdown();
    this.getFormFollowUpDatas();
  }
  sortData(sort: Sort) {
    this.sortValue = sort.direction ? { [sort.active]: sort.direction ? sort.direction : `asc` } : null;
    if (!this.isWaitingForResponse) {
      this.paginator.pageIndex = 0;
      this.getFormFollowUpDatas();
    }
  }
  goToTemplateDetail(templateId, templateType, rncpId, classId) {

    if (templateId && templateType) {
      this.router.navigate(['/form-follow-up/details/', templateId], {
        queryParams: { form_type: templateType, rncp_id: rncpId, class_id: classId },
      });
    }
  }
  ngOnDestroy(): void {
    this.pageTitleService.setTitle('');
    this.subs.unsubscribe();
  }
}
