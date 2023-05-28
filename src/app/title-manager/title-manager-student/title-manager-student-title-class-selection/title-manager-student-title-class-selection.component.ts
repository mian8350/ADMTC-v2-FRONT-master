import { Component, Input, OnInit } from '@angular/core';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import { SubSink } from 'subsink';
import * as _ from 'lodash';
import { SchoolService } from 'app/service/schools/school.service';
import { UntypedFormControl } from '@angular/forms';
import { debounceTime } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { PageTitleService } from 'app/core/page-title/page-title.service';

@Component({
  selector: 'ms-title-manager-student-title-class-selection',
  templateUrl: './title-manager-student-title-class-selection.component.html',
  styleUrls: ['./title-manager-student-title-class-selection.component.scss'],
})
export class TitleManagerStudentTitleClassSelectionComponent implements OnInit {
  private subs = new SubSink();
  @Input() selectedRncpTitleId: string;
  @Input() selectedClassId: string;
  isWaitingForResponse;
  initialRncpTitles: any[] = [];
  initialClasses: any[] = [];
  filteredRncpTitles: any[] = [];
  filteredClasses: any[] = [];
  rncpTitleInput = new UntypedFormControl(null);
  classInput = new UntypedFormControl({ value: null, disabled: true });

  constructor(
    private rncpTitleService: RNCPTitlesService,
    private schoolService: SchoolService,
    private translate: TranslateService,
    private pageTitleService: PageTitleService,
  ) {}

  ngOnInit() {
    this.pageTitleService.setIcon('school');
    this.pageTitleService.setTitle(this.translate.instant('NAV.TABLEOFSTUDENT'));
    this.getRncpTitles();
    if (this.selectedRncpTitleId) {
      this.getClasses();
    }
    this.sinkOnFilterChanges();
    this.sinkOnLangChange();
  }

  sinkOnFilterChanges() {
    this.subs.sink = this.rncpTitleInput.valueChanges.pipe(debounceTime(250)).subscribe((value) => {
      if (!value) {
        this.filteredRncpTitles = [...this.initialRncpTitles];
      } else {
        this.filteredRncpTitles = this.initialRncpTitles.filter((title) => {
          return (
            typeof value === 'string' &&
            typeof title.short_name === 'string' &&
            title.short_name.toLowerCase().trim().includes(value.toLowerCase().trim())
          );
        });
      }
    });

    this.subs.sink = this.classInput.valueChanges.pipe(debounceTime(250)).subscribe((value) => {
      if (!value) {
        this.filteredClasses = [...this.initialClasses];
      } else {
        this.filteredClasses = this.initialClasses.filter((item) => {
          return (
            typeof value === 'string' &&
            typeof item.name === 'string' &&
            item.name.toLowerCase().trim().includes(value.toLowerCase().trim())
          );
        });
      }
    });
  }

  sinkOnLangChange() {
    this.subs.sink = this.translate.onLangChange.subscribe(() => {
      this.updatePageTitle();
    });
  }

  updatePageTitle() {
    let pageTitle = this.translate.instant('NAV.TABLEOFSTUDENT');
    if (typeof this.selectedRncpTitleId === 'string' && this.selectedRncpTitleId !== '') {
      const rncpTitle = this.initialRncpTitles.find((title) => {
        return typeof title._id === 'string' && title._id === this.selectedRncpTitleId;
      });
      pageTitle += ' >> ';
      pageTitle += rncpTitle.short_name;
    }
    if (typeof this.selectedClassId === 'string' && this.selectedClassId !== '') {
      const classObj = this.initialClasses.find((item) => {
        return typeof item._id === 'string' && item._id === this.selectedClassId;
      });
      pageTitle += ' - ';
      pageTitle += classObj.name;
    }
    this.pageTitleService.setIcon('school');
    this.pageTitleService.setTitle(pageTitle);
  }

  getRncpTitles() {
    this.subs.sink = this.rncpTitleService.getRncpTitlesManager().subscribe((resp) => {
      resp.sort((a, b) => {
        if (
          typeof a.short_name === 'string' &&
          typeof b.short_name === 'string' &&
          a.short_name.toLowerCase() < b.short_name.toLowerCase()
        ) {
          return -1;
        }
        if (
          typeof a.short_name === 'string' &&
          typeof b.short_name === 'string' &&
          a.short_name.toLowerCase() > b.short_name.toLowerCase()
        ) {
          return 1;
        }
        return 0;
      });
      this.initialRncpTitles = _.cloneDeep(resp);
      this.filteredRncpTitles = _.cloneDeep(resp);

      if (this.selectedRncpTitleId) {
        const title = this.initialRncpTitles.find((title) => {
          return typeof title._id === 'string' && typeof title.short_name === 'string' && title._id === this.selectedRncpTitleId;
        });
        this.rncpTitleInput.patchValue(title.short_name);
      }
    });
  }

  getClasses() {
    this.isWaitingForResponse = true;
    this.classInput.enable();
    this.subs.sink = this.rncpTitleService.getClassesByTitle(this.selectedRncpTitleId).subscribe((resp) => {
      this.isWaitingForResponse = false;
      resp.sort((a, b) => {
        if (typeof a.name === 'string' && typeof b.name === 'string' && a.name.toLowerCase() < b.name.toLowerCase()) return -1;
        if (typeof a.name === 'string' && typeof b.name === 'string' && a.name.toLowerCase() > b.name.toLowerCase()) return 1;
        return 0;
      });
      this.initialClasses = _.cloneDeep(resp);
      this.filteredClasses = _.cloneDeep(resp);

      // *************** If only one class, then auto select them
      if (this.initialClasses && this.initialClasses.length === 1) {
        this.onSelectClass(this.initialClasses[0]);
      }
    });
  }

  onSelectTitle(selectedTitle) {
    if (selectedTitle && selectedTitle._id) {
      this.selectedRncpTitleId = selectedTitle._id;
      this.schoolService.setSelectedRncpTitleId(this.selectedRncpTitleId);
      this.schoolService.setSelectedClassId('');
      this.schoolService.setCurrentStudentTitleId(this.selectedRncpTitleId);
      this.schoolService.setCurrentStudentClassId('');
      this.getClasses();
    } else if (selectedTitle === null) {
      this.initialClasses = [];
      this.filteredClasses = [];
      this.selectedRncpTitleId = null;
      this.classInput.disable();
      this.schoolService.setSelectedRncpTitleId('');
      this.schoolService.setSelectedClassId('');
      this.schoolService.setCurrentStudentTitleId('');
      this.schoolService.setCurrentStudentClassId('');
    }
    this.updatePageTitle();
  }

  onSelectClass(selectedClass) {
    if (selectedClass && selectedClass._id) {
      this.selectedClassId = selectedClass._id;
      this.schoolService.setSelectedRncpTitleId(this.selectedRncpTitleId);
      this.schoolService.setCurrentStudentTitleId(this.selectedRncpTitleId);
      this.schoolService.setSelectedClassId(this.selectedClassId);
      this.schoolService.setCurrentStudentClassId(this.selectedClassId);
    } else if (selectedClass === null) {
      this.selectedClassId = null;
      this.schoolService.setSelectedClassId('');
      this.schoolService.setCurrentStudentClassId('');
    }
    this.updatePageTitle();
  }

  /* onSelectedTitleChanged() {
    if (this.selectedRncpTitleId !== '0') {
      this.schoolService.setSelectedRncpTitleId(this.selectedRncpTitleId);
      this.schoolService.setSelectedClassId('');
      this.schoolService.setCurrentStudentTitleId(this.selectedRncpTitleId);
      this.schoolService.setCurrentStudentClassId('');
      this.getClasses();
    } else {
      this.selectedRncpTitleId = null;
      this.schoolService.setSelectedRncpTitleId('');
      this.schoolService.setSelectedClassId('');
      this.schoolService.setCurrentStudentTitleId('');
      this.schoolService.setCurrentStudentClassId('');
    }
  }
  onSelectedClassChanged() {
    if (this.selectedClassId !== '0') {
      this.schoolService.setSelectedRncpTitleId(this.selectedRncpTitleId);
      this.schoolService.setCurrentStudentTitleId(this.selectedRncpTitleId);
      this.schoolService.setSelectedClassId(this.selectedClassId);
      this.schoolService.setCurrentStudentClassId(this.selectedClassId);
    } else {
      this.selectedClassId = null;
      this.schoolService.setSelectedClassId('');
      this.schoolService.setCurrentStudentClassId('');
    }
  } */

  ngOnDestroy(): void {
    this.pageTitleService.setIcon('');
    this.pageTitleService.setTitle('');
    this.subs.unsubscribe();
  }
}
