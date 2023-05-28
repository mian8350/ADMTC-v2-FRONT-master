import { Component, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { TranslateService, LangChangeEvent } from '@ngx-translate/core';
import { PageTitleService } from 'app/core/page-title/page-title.service';
import { PermissionService } from 'app/service/permission/permission.service';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import { UtilityService } from 'app/service/utility/utility.service';
import * as _ from 'lodash';
import { NgxPermissionsService } from 'ngx-permissions';
import { Observable } from 'rxjs';
import { startWith, map } from 'rxjs/operators';
import { SubSink } from 'subsink';


@Component({
  selector: 'ms-title-manager-list',
  templateUrl: './title-manager-list.component.html',
  styleUrls: ['./title-manager-list.component.scss']
})
export class TitleManagerListComponent implements OnInit, OnDestroy {

  rncpTitles: any[] = [];
  filteredTitles: any[] = [];
  listOfCertifier = [];
  selectedCertifier = '';
  tabIndex = 0;
  isWaitingForResponse;
  private subs = new SubSink();
  searchForm = new UntypedFormControl('');
  private timeOutVal: any;

  manager = []
  managerFilterList = [];
  managerFilter = new UntypedFormControl('');
  managerFilterId = null
  filteredManager: Observable<any[]>;

  constructor(
    private rncpTitleService: RNCPTitlesService,
    public translate: TranslateService,
    private pageTitleService: PageTitleService,
    private utilService: UtilityService,
    public dialog: MatDialog,
    public permissionService: PermissionService,
    private permissions: NgxPermissionsService
  ) {

  }

  ngOnInit() {
    this.setPageTitle();
    this.getRNCPTitles()
    this.filterRncpTitle();
    this.getManager()
    this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      if (this.managerFilter.value !== "All") {
        const foundUserType = _.find(this.managerFilterList, (type) => type.name === this.managerFilter.value);
        const found = foundUserType ? _.find(this.manager, (type) => type._id === foundUserType.id) : null;
        const currLang = found ? found.last_name.toUpperCase() + " " + found.first_name + " " + this.translate.instant(found.civility) : this.managerFilter.value;
        this.managerFilter.setValue(currLang)
      } else if (this.managerFilter.value === "All") {
        this.managerFilter.setValue(this.translate.instant('All'))
      }
      this.managerFilterList = []
      this.managerFilterList.unshift({ id: null, name: this.translate.instant('All') })
      this.manager.map(value => {
        this.managerFilterList.push({ id: value._id, name: value.last_name.toUpperCase() + " " + value.first_name + " " + this.translate.instant(value.civility)})
      })

      this.filteredManager = this.managerFilter.valueChanges.pipe(
        startWith(''),
        map((searchText) =>
          this.managerFilterList.filter((manager) =>
            manager && manager.name ? manager.name.toLowerCase().includes(searchText.toLowerCase()) : false,
          )
        ),
      );
    })
  }
  getRNCPTitles() {
    this.isWaitingForResponse = true;
    this.subs.sink = this.rncpTitleService.getRncpTitlesManager(this.managerFilterId).subscribe((titles: any[]) => {
      this.isWaitingForResponse = false;
      this.rncpTitles = titles;
      this.filteredTitles = titles;
      this.rncpTitles = _.orderBy(this.rncpTitles, ['short_name'], ['asc']);
      this.filteredTitles = _.orderBy(this.filteredTitles, ['short_name'], ['asc']);
      this.rncpTitles = this.rncpTitles.sort((a, b) => {
        return a.short_name.toLowerCase().localeCompare(b.short_name.toLowerCase());
      });
      this.filteredTitles = this.filteredTitles.sort((a, b) => {
        return a.short_name.toLowerCase().localeCompare(b.short_name.toLowerCase());
      });
      this.rncpTitles.forEach((title) => {
        if (title.certifier) {
          this.listOfCertifier.push(title.certifier.short_name);
        }
      });
      this.listOfCertifier = [...new Set(this.listOfCertifier)];
      this.listOfCertifier = this.listOfCertifier.sort((a, b) => {
        return a.toLowerCase().localeCompare(b.toLowerCase());
      });
    });
  }

  setPageTitle() {
    this.pageTitleService.setTitle('List of RNCP Title');
    // add .svg icon inside src/assets/icons then register it in app.module
    // this.pageTitleService.setIcon('certificate');
  }

  resetSearch() {
    this.tabIndex = 0;
    this.searchForm.setValue('');
    this.managerFilter.setValue('');
    this.managerFilterId = null;
    this.getRNCPTitles();
    this.filteredTitles = this.rncpTitles;
    this.selectedCertifier = 'all';
  }

  filterRncpTitle() {
    this.subs.sink = this.searchForm.valueChanges.pipe(startWith('')).subscribe((searchString: string) => {
      if (this.tabIndex !== 0) {
        this.tabIndex = 0;
      }
      this.timeOutVal = setTimeout(() => {
        this.filteredTitles = this.rncpTitles.filter((title) => {
          if (title.short_name || title.long_name) {
            return (
              this.utilService
                .simpleDiacriticSensitiveRegex(title.short_name)
                .toLowerCase()
                .indexOf(this.utilService.simpleDiacriticSensitiveRegex(searchString).toLowerCase().trim()) !== -1 ||
              this.utilService
                .simpleDiacriticSensitiveRegex(title.long_name)
                .toLowerCase()
                .indexOf(this.utilService.simpleDiacriticSensitiveRegex(searchString).toLowerCase().trim()) !== -1
            );
          } else {
            return false;
          }
        });
      }, 500);
      // clearTimeout(this.timeOutVal);
    });
  }

  // Filter title by certifier
  filterTitleByCertifier(certifier: string, index: number) {
    if (index) {
      this.tabIndex = index;
    }
    if (certifier === 'all' || certifier === '' || certifier === 'All' || certifier === 'Tous') {
      this.filteredTitles = this.rncpTitles;
    } else {
      this.filteredTitles = this.rncpTitles.filter((title) => {
        const certi = title.certifier ? title.certifier.short_name === certifier : '';
        return certi;
      });
    }
  }
  getManager() {
    this.isWaitingForResponse = true
    this.managerFilterList.unshift({ id: null, name: this.translate.instant('All') })
    this.subs.sink = this.rncpTitleService.getAllUserADMTC().subscribe(resp => {
      if (resp) {
        this.manager = _.cloneDeep(resp)
        this.manager
          .sort((name1, name2) => name1.last_name.toLowerCase() > name2.last_name.toLowerCase() ? 1 : name1.last_name.toLowerCase() < name2.last_name.toLowerCase() ? -1 : 0)
          .map(value => {
            this.managerFilterList.push({ id: value._id, name: value.last_name.toUpperCase() + " " + value.first_name + " " + this.translate.instant(value.civility) })
          })

        this.filteredManager = this.managerFilter.valueChanges.pipe(
          startWith(''),
          map((searchText) =>
            this.managerFilterList.filter((manager) =>
              manager && manager.name ? manager.name.toLowerCase().includes(searchText.toLowerCase()) : false,
            )
          ),
        );
      }
      this.isWaitingForResponse = false
    })
  }
  setManagerFilter(id) {
    this.managerFilterId = id ? id : null
    this.getRNCPTitles()
  }
  ngOnDestroy() {
    clearTimeout(this.timeOutVal);
    this.subs.unsubscribe();
    this.pageTitleService.setTitle('');
    this.pageTitleService.setIcon('');
  }
}
