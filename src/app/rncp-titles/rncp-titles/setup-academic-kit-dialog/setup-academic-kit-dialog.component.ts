import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import { Router } from '@angular/router';
import { UntypedFormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { startWith, map, debounceTime } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { AcademicKitService } from 'app/service/rncpTitles/academickit.service';
import { RncpTitleCardData } from 'app/rncp-titles/RncpTitle.model';
import { SubSink } from 'subsink';

@Component({
  selector: 'ms-setup-academic-kit-dialog',
  templateUrl: './setup-academic-kit-dialog.component.html',
  styleUrls: ['./setup-academic-kit-dialog.component.scss'],
})
export class SetupAcademicKitDialogComponent implements OnInit, OnDestroy {
  private subs = new SubSink();
  showSelectTitle = false;
  titleControl = new UntypedFormControl();
  classControl = new UntypedFormControl();
  titleList: { _id: string; short_name: string }[] = [];
  classList: any[];
  filteredTitle: Observable<{ _id: string; short_name: string }[]>;
  filteredClass: Observable<any[]>;
  selectedTitle: { _id: string; short_name: string };
  selectedClass: any;

  constructor(
    public dialogRef: MatDialogRef<SetupAcademicKitDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public parentData,
    private rncpTitleService: RNCPTitlesService,
    private acadKitService: AcademicKitService,
    private router: Router,
  ) {}

  ngOnInit() {}

  showDuplicateField() {
    this.showSelectTitle = true;
    this.getRncpTitles();
  }

  getRncpTitles() {
    this.subs.sink = this.rncpTitleService.getAllPublishedWithClassTitleDropdown(true).subscribe((resp) => {
      this.titleList = resp;

      this.filteredTitle = this.titleControl.valueChanges.pipe(
        startWith(''),
        map((search) =>
          this.titleList
            .filter((title) => title.short_name.toLowerCase().includes(search.toLowerCase()))
            .sort((a: any, b: any) => a.short_name.localeCompare(b.short_name)),
        ),
      );
    });
  }

  getClassesOfATitle(titleId: string) {
    this.subs.sink = this.rncpTitleService
      .getClassOfTitle(titleId)
      .pipe(
        map((classes) => {
          return classes.filter((classItem) => classItem.academic_kit && classItem.academic_kit.is_created);
        }),
      )
      .subscribe((classObj) => {
        this.classList = classObj;
        this.filteredClass = this.classControl.valueChanges.pipe(
          debounceTime(500),
          startWith(''),
          map((search) =>
            this.classList
              .filter((classItem) => classItem.name.toLowerCase().includes(search.toLowerCase()))
              .sort((a: any, b: any) => a.name.localeCompare(b.name)),
          ),
        );
      });
  }

  displayTitleName(title: { _id: string; short_name: string }): string {
    return title && title.short_name ? title.short_name : '';
  }

  setSelectedTitle(title: { _id: string; short_name: string }) {
    this.selectedTitle = title;
    this.getClassesOfATitle(this.selectedTitle._id);
  }

  setSelectedClass(classObj: any) {
    this.selectedClass = classObj;
  }

  resetSelected() {
    this.selectedTitle = null;
    this.selectedClass = null;
  }

  duplicateAcadKit() {

    this.subs.sink = this.acadKitService.duplicateAcademicKit(this.selectedClass._id, this.parentData._id).subscribe((resp) => {
      if (resp) {
        Swal.fire({ type: 'success', title: 'Bravo!' });
        this.dialogRef.close(true);
      } else {
        Swal.fire({ type: 'error', title: 'Error' });
      }
    });
  }

  setupNewAcadKit() {

    this.subs.sink = this.acadKitService.setupBasicAcademicKit(this.parentData._id).subscribe((resp) => {
      if (resp) {
        Swal.fire({ type: 'success', title: 'Bravo!' });
        this.dialogRef.close(true);
      } else {
        Swal.fire({ type: 'error', title: 'Error' });
      }
    });
  }

  closeDialog() {
    // this.router.navigate(['/rncpTitles']);
    this.dialogRef.close('cancel');
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
