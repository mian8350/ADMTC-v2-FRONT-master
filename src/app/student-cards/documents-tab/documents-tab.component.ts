import { Component, OnInit, Input, Output, EventEmitter, OnDestroy, OnChanges } from '@angular/core';
import { AcadKitFolder } from 'app/rncp-titles/dashboard/academic-kit.model';
import { SchoolService } from 'app/service/schools/school.service';
import { SubSink } from 'subsink';
import * as _ from 'lodash';

@Component({
  selector: 'ms-documents-tab',
  templateUrl: './documents-tab.component.html',
  styleUrls: ['./documents-tab.component.scss'],
})
export class DocumentsTabComponent implements OnInit, OnChanges, OnDestroy {
  @Input() studentId = '';
  @Input() studentPrevCourseData?: any;
  @Input() schoolId: string;
  @Output() continue = new EventEmitter<boolean>();

  private subs = new SubSink();

  rootFolders: AcadKitFolder[] = [];
  isWaitingForResponse = false;
  customRootFolderIndex: number;

  selectedClassId = '';
  selectedRncpTitleId = '';

  constructor(private schoolService: SchoolService) {}

  ngOnInit() {
  }

  ngOnChanges() {
    this.subs.sink = this.schoolService.selectedRncpTitleId$.subscribe((id) => (this.selectedRncpTitleId = id));
    this.subs.sink = this.schoolService.selectedClassId$.subscribe((id) => {
      this.selectedClassId = id;
    });
    this.getPublishedRootFolder();
  }

  getPublishedRootFolder() {
    let titleId = this.selectedRncpTitleId;
    let classId = this.selectedClassId;
    if (this.studentPrevCourseData) {
      titleId = this.studentPrevCourseData.rncp_title._id;
      classId = this.studentPrevCourseData.current_class._id;
    }
    // get all root Folders data from academic Kit of this title
    this.isWaitingForResponse = true;

    this.subs.sink = this.schoolService
      .getPublishedFoldersAndDocsOfSelectedClass(classId)
      .subscribe((resp) => {
        if (resp) {
          const temp = _.cloneDeep(resp);

          if (temp.academic_kit && temp.academic_kit.categories && temp.academic_kit.categories.length) {
            temp.academic_kit.categories = temp.academic_kit.categories.filter(
              (category) => category.folder_name !== '06. EPREUVES DE LA CERTIFICATION',
            );
          }
          this.rootFolders = temp.academic_kit.categories;
        }
        this.isWaitingForResponse = false;
      }, err => this.isWaitingForResponse = false);
  }

  getCustomRootFolderIndex(folderIndex: number) {
    // to get index of newly created custom folder other than default folder "01. ADMISSIONS" to "07. ARCHIVES"
    if (folderIndex + 1 > 7) {
      this.customRootFolderIndex = folderIndex + 1;
      return this.customRootFolderIndex;
    }
    return null;
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
