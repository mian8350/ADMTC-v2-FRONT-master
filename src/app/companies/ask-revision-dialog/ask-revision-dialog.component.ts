import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntypedFormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { CompanyService } from 'app/service/company/company.service';
import { SubSink } from 'subsink';
import Swal from 'sweetalert2';

@Component({
  selector: 'ms-ask-revision-dialog',
  templateUrl: './ask-revision-dialog.component.html',
  styleUrls: ['./ask-revision-dialog.component.scss'],
})
export class AskRevisionDialogComponent implements OnInit, OnDestroy {
  private subs = new SubSink();
  askReviewForm: UntypedFormGroup;
  whoIsIt: string;
  currentLang: any;
  companyId: any;
  userId: any;
  dataMentor: any;
  isWaitingForResponse = false;

  constructor(
    private matDialogRef: MatDialogRef<AskRevisionDialogComponent>,
    private fb: UntypedFormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private translate: TranslateService,
    private companyService: CompanyService,
  ) {}

  ngOnInit() {
    this.initForm();
    this.whoIsIt = this.data.reqNumber;
    this.companyId = this.data.companyId;
    this.userId = this.data.userLogin;
    this.currentLang = this.translate.currentLang.toLowerCase();
  }

  // *************** Function to initialize form field
  initForm() {
    this.askReviewForm = this.fb.group({
      description: [null, Validators.required],
    });
  }

  // *************** Function to handle submit revision
  submitData() {
    this.isWaitingForResponse = true;
    if (this.whoIsIt === '_1') {
      this.revisionCompany();
    } else if (this.whoIsIt === '_2') {
      this.dataMentor = this.data.dataMentor;
      this.revisionMentor();
    }
  }

  // *************** Function to submit revision company
  revisionCompany() {
    const desc = this.askReviewForm.get('description').value;
    this.subs.sink = this.companyService.sendRevisionCompany(this.companyId, this.userId, desc, this.currentLang).subscribe(
      (resp) => {
        this.isWaitingForResponse = false;
        Swal.fire({
          type: 'success',
          title: 'Bravo!',
          confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
        });
        this.matDialogRef.close();
      },
      (err) => {
        this.matDialogRef.close();

      },
    );
  }

  // *************** Function to submit revision mentor
  revisionMentor() {
    const desc = this.askReviewForm.get('description').value;
    this.subs.sink = this.companyService
      .sendRevisionMentor(this.dataMentor._id, this.companyId, this.userId, desc, this.currentLang)
      .subscribe(
        (resp) => {
          this.isWaitingForResponse = false;
          Swal.fire({
            type: 'success',
            title: 'Bravo!',
            confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
          });
          this.matDialogRef.close();
        },
        (err) => {
          this.matDialogRef.close();

        },
      );
  }

  // *************** Function to close dialog
  onClose() {
    this.matDialogRef.close();
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
