import { Component, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { DateAdapter } from '@angular/material/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatDialogConfig, MatDialogModule } from '@angular/material/dialog';
import { PlatformService } from '../../service/platform/platform.service';
import { SubSink } from 'subsink';
import { AddScholarSeasonDialogComponent } from '../add-scholar-season-dialog/add-scholar-season-dialog.component';
import { UntypedFormControl } from '@angular/forms';
import * as moment from 'moment';
import * as _ from 'lodash';
import { map } from 'rxjs/operators';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'ms-scholer-season',
  templateUrl: './scholer-season.component.html',
  styleUrls: ['./scholer-season.component.scss'],
})
export class ScholerSeasonComponent implements OnInit, OnDestroy {
  dataSource = new MatTableDataSource([]);
  displayedColumns: string[] = ['scholarseason', 'description', 'from', 'to', 'rncpTitles', 'action'];
  filterColumns: string[] = ['scholarseasonfilter', 'descriptionfilter', 'fromfilter', 'tofilter', 'rncpTitlesfilter', 'actionfilter'];
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  private subs = new SubSink();
  scholarDialogComponent: MatDialogRef<AddScholarSeasonDialogComponent>;
  noData: any;
  configCat: MatDialogConfig = {
    disableClose: true,
    width: '600px',
  };

  scholarFilter = new UntypedFormControl('');
  descriptionFilter = new UntypedFormControl('');
  fromFilter = new UntypedFormControl('');
  toFilter = new UntypedFormControl('');
  rncpFilter = new UntypedFormControl('');

  filteredValues = {
    scholarSession: '',
    description: '',
    from: '',
    to: '',
    rncp: '',
  };

  constructor(
    private platformService: PlatformService,
    private translate: TranslateService,
    public dialog: MatDialog,
    private dateAdapter: DateAdapter<Date>,
    ) {}

  ngOnInit() {
    this.dateAdapter.setLocale(this.translate.currentLang);
    this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      this.dateAdapter.setLocale(this.translate.currentLang);
    });
    this.subs.sink = this.platformService.getScholerSeason().subscribe((scholerSeasonList: any[]) => {
      this.dataSource.data = scholerSeasonList;
      this.dataSource.sort = this.sort;
      this.dataSource.paginator = this.paginator;
      this.noData = this.dataSource.connect().pipe(map(dataa => dataa.length === 0));
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });
    this.subs.sink = this.scholarFilter.valueChanges.subscribe(school => {
      this.filteredValues['scholarSession'] = school;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });
    this.subs.sink = this.descriptionFilter.valueChanges.subscribe(description => {
      this.filteredValues['description'] = description;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });
    this.subs.sink = this.fromFilter.valueChanges.subscribe(from => {
      const newDate = moment(from).format('YYYY-MM-DD');
      this.filteredValues['from'] = newDate !== 'Invalid date' ? newDate : '';
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });
    this.subs.sink = this.toFilter.valueChanges.subscribe(to => {
      const newDate = moment(to).format('YYYY-MM-DD');
      this.filteredValues['to'] = newDate !== 'Invalid date' ? newDate : '';
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });
    this.subs.sink = this.rncpFilter.valueChanges.subscribe(rncp => {
      this.filteredValues['rncp'] = rncp;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });
    this.dataSource.filterPredicate = this.customFilterPredicate();
  }

  customFilterPredicate() {
    return function(data, filter: string): boolean {
      const searchString = JSON.parse(filter);
      const scholarFound = data.scholarseason
        ? data.scholarseason
            .toString()
            .trim()
            .toLowerCase()
            .indexOf(searchString.scholarSession.toLowerCase()) !== -1
        : true;

      const descriptionFound = data.description
        ? data.description
            .toString()
            .trim()
            .toLowerCase()
            .indexOf(searchString.description.toLowerCase()) !== -1
        : true;

      const fromFound = data.from
        ? moment(data.from)
            .format('YYYY-MM-DD')
            .toString()
            .trim()
            .toLowerCase()
            .indexOf(searchString.from.toLowerCase()) !== -1
        : true;

      const toFound = data.to
        ? moment(data.to)
            .format('YYYY-MM-DD')
            .toString()
            .trim()
            .toLowerCase()
            .indexOf(searchString.to.toLowerCase()) !== -1
        : true;

      const rncpFound = data.rncptitles.find(
        title => title.shortName && title.shortName.toLowerCase().indexOf(searchString.rncp.toLowerCase()) !== -1,
      );
      return scholarFound && descriptionFound && fromFound && toFound && rncpFound;
    };
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  openEditDialog(rowData: any) {
    this.scholarDialogComponent = this.dialog.open(AddScholarSeasonDialogComponent, this.configCat);
  }

  resetFilter() {
    this.descriptionFilter.setValue('');
    this.fromFilter.setValue('');
    this.toFilter.setValue('');
    this.scholarFilter.setValue('');
    this.rncpFilter.setValue('');

    this.filteredValues = {
      description: '',
      from: '',
      rncp: '',
      scholarSession: '',
      to: '',
    };
    this.dataSource.filter = JSON.stringify(this.filteredValues);
  }

  sorting(event) {
    if (event.active === 'rncpTitles') {
      const sortBy = 'rncptitles';
      const sortMode = event.direction;
      this.dataSource.data = _.orderBy(this.dataSource.data, [sortBy], [sortMode]);
    }
  }

  addScholarSeason() {}
  deleteSeason() {}

  renderTooltipTitle(entities) {
    let tooltip = '';
    const type = _.uniqBy(entities, 'shortName');
    for (const entity of type) {
      if (entity) {
        tooltip = tooltip + this.translate.instant(entity.shortName) + `, `;
      }
    }
    return tooltip;
  }
}
