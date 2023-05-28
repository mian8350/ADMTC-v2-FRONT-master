import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { PageTitleService } from 'app/core/page-title/page-title.service';
import { RncpTitleCardData } from 'app/rncp-titles/RncpTitle.model';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import { ApplicationUrls } from 'app/shared/settings';
import { SubSink } from 'subsink';
import { DomSanitizer } from '@angular/platform-browser';
import * as _ from 'lodash';
import { AcademicKitService } from 'app/service/rncpTitles/academickit.service';
import { FormControl } from '@angular/forms';
import { map, startWith } from 'rxjs/operators';
import { PermissionService } from 'app/service/permission/permission.service';

@Component({
  selector: 'ms-title-manager-dashboard',
  templateUrl: './title-manager-dashboard.component.html',
  styleUrls: ['./title-manager-dashboard.component.scss'],
})
export class TitleManagerDashboardComponent implements OnInit, OnDestroy {
  

   
  private subs = new SubSink();

  rncpTitle: RncpTitleCardData;
  classList = [];
  serverimgPath = `${ApplicationUrls.baseApi}/fileuploads/`.replace('/graphql', '');
  selectedClass: any;

  titleClassesFilter = new FormControl('');
  filteredClass;

  constructor(
    private pageTitleService: PageTitleService,
    private sanitizer: DomSanitizer,
    private route: ActivatedRoute,
    private translate: TranslateService,
    private academicKitService: AcademicKitService,
    private rncpTitlesService: RNCPTitlesService,
    private permissionService: PermissionService
  ) { }

  ngOnInit() {
    this.subs.sink = this.route.paramMap.subscribe((param) => {
      const titleId = param.get('titleId');
      this.subs.sink = this.rncpTitlesService.getOneTitleById(titleId).subscribe((resp) => {
        if (resp) {
          this.rncpTitle = resp;
          this.rncpTitlesService.setSelectedTitle(this.rncpTitle);

          this.pageTitleService.setIcon('import_contacts');
          this.fetchClasses(this.rncpTitle._id);
        }
      });
    });

    this.filteredClass = this.titleClassesFilter.valueChanges.pipe(startWith(''),
          map((searchTxt) => this.classList.filter((option) => option.name.toLowerCase().includes(searchTxt.toLowerCase())))); 
  }

  setClassFilter(classSelected) {
    if(classSelected) {
        this.onSelectClass(classSelected);
    }
  }

  fetchClasses(titleId: string, selectedClass?) {
    this.subs.sink = this.rncpTitlesService.getClassByRncpTitle(titleId).subscribe((classesResp) => {
      let tempClassList = _.cloneDeep(classesResp);
      this.classList = tempClassList.sort((classA: any, classB: any) => classA.name.localeCompare(classB.name));
      this.triggerSelectClassAfterFilter(this.classList, selectedClass);
      if(this.classList && this.classList.length) {        
        this.titleClassesFilter.setValue(this.classList[0].name);                  
      }
    });
  }

  triggerSelectClassAfterFilter(tempClassList, selectedClass?) {
    const selectedClassFromService = this.academicKitService.getSelectedClass();
    if (
      this.classList &&
      selectedClass &&
      tempClassList.find((classData) => classData && classData._id && classData._id === selectedClass._id)
    ) {
      const foundClass = tempClassList.find((classData) => classData && classData._id && classData._id === selectedClass._id);
      this.onSelectClass(foundClass);
    } else if (
      this.classList &&
      selectedClassFromService &&
      tempClassList.find((classData) => classData && selectedClassFromService && classData._id === selectedClassFromService._id)
    ) {
      this.onSelectClass(selectedClassFromService);
    } else if (this.classList && this.classList[0]) {
      this.onSelectClass(this.classList[0]);
    }
  }

  onSelectClass(classObject: any) {

    this.selectedClass = classObject;
    this.academicKitService.setSelectedClass(classObject);
    const classString = this.translate.instant('COMPANY.CLASS');
    this.pageTitleService.setTitle(`${this.rncpTitle.short_name} - ${classString} ${this.selectedClass.name}`);
  }

  imgURL(src: string) {
    return this.sanitizer.bypassSecurityTrustUrl(this.serverimgPath + src);
  }

  showPendingTask() {
    return this.permissionService.showPendingTaskPerm()
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
    this.pageTitleService.setTitle('');
    this.pageTitleService.setIcon('');
  }
 
}
