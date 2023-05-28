import { SubSink } from 'subsink';
import { UntypedFormControl } from '@angular/forms';
import { Component, OnInit, EventEmitter, Output, Input } from '@angular/core';
import { debounceTime } from 'rxjs/operators';
import { CompanyService } from 'app/service/company/company.service';
import { AddCompanyDialogComponent } from '../add-company-dialog/add-company-dialog.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { PermissionService } from 'app/service/permission/permission.service';
@Component({
  selector: 'ms-company-header-bar',
  templateUrl: './company-header-bar.component.html',
  styleUrls: ['./company-header-bar.component.scss'],
})
export class CompanyHeaderBarComponent implements OnInit {
  @Input() source = '';
  @Output() isReset = new EventEmitter<boolean>();
  search = new UntypedFormControl('');
  mentorSearch = new UntypedFormControl('');
  private subs = new SubSink();

  constructor(public dialog: MatDialog, private companyService: CompanyService, private permissionService: PermissionService) {}

  ngOnInit() {
    this.search.valueChanges.pipe(debounceTime(400)).subscribe((resp) => {
      this.companyService.filterCompany(resp);
    });
    this.mentorSearch.valueChanges.pipe(debounceTime(400)).subscribe((resp) => {
      this.companyService.filterMentor(resp);
    });
  }
  reset() {
    this.search.setValue('', { emitEvent: false });
    this.mentorSearch.setValue('', { emitEvent: false });
    this.companyService.filterCompany(null);
    this.companyService.filterMentor(null);
    this.isReset.emit(true);
  }

  addCompany() {
    this.subs.sink = this.dialog
      .open(AddCompanyDialogComponent, {
        disableClose: true,
        width: '50%',
        minHeight: '100px',
        panelClass: 'no-padding-pop-up',
        data: 'company',
      })
      .afterClosed()
      .subscribe((result) => {

        if (result) {
        }
      });
  }

  showButtonAddCompany() {
    if (this.source && this.source === 'entities') {
      return this.permissionService.showButtonAddCompanyEntityPerm();
    } else {
      return this.permissionService.showButtonAddCompanyBranchPerm();
    }
  }
}
