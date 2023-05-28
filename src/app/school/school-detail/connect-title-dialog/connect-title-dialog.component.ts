import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntypedFormBuilder, UntypedFormGroup, UntypedFormArray, Validators } from '@angular/forms';
import { debounceTime } from 'rxjs/operators';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import * as _ from 'lodash';
import { SchoolService } from 'app/service/schools/school.service';
import Swal from 'sweetalert2';
import { Specialization, Title } from 'app/school/School.model';
import { TranslateService } from '@ngx-translate/core';
import { SubSink } from 'subsink';

@Component({
  selector: 'ms-connect-title-dialog',
  templateUrl: './connect-title-dialog.component.html',
  styleUrls: ['./connect-title-dialog.component.scss'],
})
export class ConnectTitleDialogComponent implements OnInit, OnDestroy {
  private subs = new SubSink();
  connectedTitleForm: UntypedFormGroup;
  tempPreparationCenterForm: UntypedFormGroup;

  filteredTempTitle = [];
  filteredTempClass = [];

  filteredTitle: Title[][] = [];
  unfilteredClass: any[][] = [];
  filteredClass: any[][] = [];
  filteredSpecialization: Specialization[][] = [];
  allTitles: Title[] = [];
  allClass: any[] = [];
  private selectedTitles = [];
  private selectedClass = [];
  disableSubmit = true;
  isWaitingForResponse = false;
  private intVal: any;
  private timeOutVal: any;
  certifierId = [];

  constructor(
    private dialogRef: MatDialogRef<ConnectTitleDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public parentData: { schoolId: string, schoolCertifier: any},
    private fb: UntypedFormBuilder,
    private rncpTitleService: RNCPTitlesService,
    private schoolService: SchoolService,
    private translate: TranslateService,
  ) {}

  ngOnInit() {
    if(this.parentData.schoolCertifier.length) {
      this.parentData.schoolCertifier.forEach(data => {
        this.certifierId.push(data._id);
      })
    }
    this.initConnectedTitleForm();
    this.initTempPreparationCenterForm();
    this.getAllTitles();
  }

  getAllTitles() {
    this.isWaitingForResponse = true;
    this.subs.sink = this.rncpTitleService.GetAllTitleDropdownList('').subscribe((resp) => {
      this.isWaitingForResponse = false;
      if(resp) {
        this.allTitles = resp.filter( data => !this.certifierId.includes(data._id));
        this.allTitles.sort((a, b) => {
          return a.short_name.toLowerCase() > b.short_name.toLowerCase() ? 1 : -1;
        });
        this.filteredTempTitle = this.allTitles;
        this.filteredTitle.push(this.allTitles);
      }
    });
  }

  getClassOfATempTitle(titleId: string) {
    this.subs.sink = this.rncpTitleService.getClassesByTitle(titleId).subscribe((resp) => {
      this.isWaitingForResponse = false;
      this.allClass = resp;
      this.filteredTempClass = resp;
      this.allClass.sort((a, b) => {
        return a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1;
      });
    });
  }

  getClassOfATitle(titleId: string, index: number) {
    this.isWaitingForResponse = true;
    this.subs.sink = this.rncpTitleService.getClassesByTitle(titleId).subscribe((resp) => {
      this.isWaitingForResponse = false;
      this.allClass = resp;
      this.allClass.sort((a, b) => {
        return a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1;
      });

      this.unfilteredClass[index] = this.allClass;
      this.filteredClass[index] = this.allClass;
      this.filteredSpecialization.push([]);
    });
  }

  initConnectedTitleForm() {
    this.connectedTitleForm = this.fb.group({
      preparation_center_ats: this.fb.array([]),
    });
    // this.preparationCenterFormArray.push(this.initPreparationCenterForm());
  }

  initPreparationCenterForm() {
    return this.fb.group({
      rncp_title_id: [null],
      class_id: [null],
      selected_specializations: [null],
      selectedTitle: [null, Validators.required], // dummy field to save object selected title name and id
      selectedClass: [null, Validators.required], // dummy field to save class
    });
  }

  initTempPreparationCenterForm() {
    this.tempPreparationCenterForm = this.fb.group({
      rncp_title_id: [null],
      class_id: [null],
      selected_specializations: [null],
      selectedTitle: [null, Validators.required], // dummy field to save object selected title name and id
      selectedClass: [null, Validators.required], // dummy field to save class
    });
  }

  get preparationCenterFormArray() {
    const valid = this.connectedTitleForm.get('preparation_center_ats');
    return this.connectedTitleForm.get('preparation_center_ats') as UntypedFormArray;
  }


  //on add button click
  addPreparationCenterFormArray() {

    this.preparationCenterFormArray.push(this.tempPreparationCenterForm as UntypedFormGroup);
    this.filteredSpecialization[this.preparationCenterFormArray.length - 1] =
      this.tempPreparationCenterForm.get('selectedClass').value.specializations; //add the list of specializations to the dropdown in the bottom
    this.resetTempForm();
    // this.filteredTitle.push(this.allTitles);
  }

  //reset the top form
  resetTempForm() {
    this.filteredTempTitle = this.allTitles;
    this.filteredTempClass = null;
    this.initTempPreparationCenterForm();
  }

  //on button remove click
  removePreparationCenterFormArray(index: number) {
    if (!this.checkIfConnectionClean(index)) {
      let timeDisabled = 5;
      Swal.fire({
        type: 'warning',
        title: this.translate.instant('SCHOOL_SWAL.SCHOOL_S8.TITLE'),
        html: this.translate.instant('SCHOOL_SWAL.SCHOOL_S8.TEXT'),
        footer: `<span style="margin-left: auto">SCHOOL_S8</span>`,
        allowEscapeKey: true,
        showCancelButton: true,
        confirmButtonText: this.translate.instant('SCHOOL_SWAL.SCHOOL_S8.BUTTON_CONFIRM', { timer: timeDisabled }),
        cancelButtonText: this.translate.instant('SCHOOL_SWAL.SCHOOL_S8.BUTTON_CANCEL'),
        allowOutsideClick: false,
        allowEnterKey: false,
        onOpen: () => {
          Swal.disableConfirmButton();
          const confirmBtnRef = Swal.getConfirmButton();
          this.intVal = setInterval(() => {
            timeDisabled -= 1;
            confirmBtnRef.innerText = this.translate.instant('SCHOOL_SWAL.SCHOOL_S8.BUTTON_CONFIRM') + ` (${timeDisabled})`;
          }, 1000);

          this.timeOutVal = setTimeout(() => {
            confirmBtnRef.innerText = this.translate.instant('SCHOOL_SWAL.SCHOOL_S8.BUTTON_CONFIRM');
            Swal.enableConfirmButton();
            clearInterval(this.intVal);
            clearTimeout(this.timeOutVal);
          }, timeDisabled * 1000);
        },
      }).then((res) => {
        clearTimeout(this.timeOutVal);
        if (res.value) {
          this.preparationCenterFormArray.removeAt(index);
          this.filteredTitle.splice(index, 1);
          this.unfilteredClass.splice(index, 1);
          this.filteredClass.splice(index, 1);
          this.filteredSpecialization.splice(index, 1);
          // Swal.fire({
          //   type: 'success',
          //   title: this.translate.instant('EVENT_S1.TITLE'),
          //   html: this.translate.instant('preparation center deleted'),
          //   confirmButtonText: this.translate.instant('EVENT_S1.BUTTON'),
          // });
        }
      });
    } else {
      this.preparationCenterFormArray.removeAt(index);
      this.filteredTitle.splice(index, 1);
      this.filteredClass.splice(index, 1);
      this.unfilteredClass.splice(index, 1);
      this.filteredSpecialization.splice(index, 1);
    }
  }

  checkIfConnectionClean(index: number) {
    let result = false;
    const data = this.preparationCenterFormArray.at(index).value;

    const isEmpty = !Object.values(data).some((x) => x !== null && x !== '' && x !== []);
    if (isEmpty) {
      result = true;
      return result;
    }
    return result;
  }


  //listener for the temp form on the top for the title field
  onFilterTempTitle() {
    this.subs.sink = this.tempPreparationCenterForm
      .get('selectedTitle')
      .valueChanges.pipe(debounceTime(300))
      .subscribe((searchString) => {
        if (searchString && typeof searchString === 'string') {
          this.filteredTempTitle = this.allTitles.filter((title) => title.short_name.toLowerCase().includes(searchString.toLowerCase()));
          if (searchString === '') {
            this.filteredTempTitle = this.allTitles;
          }
        }
      });
  }

  //listener for the temp form on the top for the class field
  onFilterTempClassOfTitle() {
    this.subs.sink = this.tempPreparationCenterForm
      .get('selectedClass')
      .valueChanges.pipe(debounceTime(300))
      .subscribe((searchString) => {
        if (searchString && typeof searchString === 'string') {
          this.filteredTempClass = this.allClass.filter((classObj) => classObj.name.toLowerCase().includes(searchString.toLowerCase()));
          if (searchString === '') {
            this.filteredTempClass = this.allClass;
          }
        }
      });
  }


  //listener for the bottom added form for the title field
  getTitleDropdownList(index: number) {
    this.subs.sink = this.preparationCenterFormArray
      .at(index)
      .get('selectedTitle')
      .valueChanges.pipe(debounceTime(100))
      .subscribe((searchString) => {
        if (searchString && typeof searchString === 'string') {
          this.subs.sink = this.rncpTitleService.GetAllTitleDropdownList(searchString).subscribe((resp) => {

            if (resp) {
              resp = resp.filter( data => !this.certifierId.includes(data._id));

              if (this.selectedTitles.length > 0) {
                // check if the data is changed or not
                if (this.selectedTitles[index]) {
                  this.selectedTitles[index] = {
                    _id: '',
                    short_name: '',
                  };
                  this.preparationCenterFormArray.at(index).get('rncp_title_id').setValue(null);

                }
  
                this.selectedTitles.forEach((t) => {
                  resp = resp.filter((tit) => {
                    return tit._id !== t._id;
                  });
                  return resp;
                });
                this.filteredTitle[index] = resp;
                this.filteredTitle[index].sort((a, b) => {
                  return a.short_name.toLowerCase() > b.short_name.toLowerCase() ? 1 : -1;
                });
              } else {
                this.filteredTitle[index] = resp;
                this.filteredTitle[index].sort((a, b) => {
                  return a.short_name.toLowerCase() > b.short_name.toLowerCase() ? 1 : -1;
                });
              }
            }
          });
        }
      });
  }

   //listener for the bottom added form for the class field
  onFilterClassDropdownFromTitle(index) {
    this.subs.sink = this.preparationCenterFormArray
      .at(index)
      .get('selectedClass')
      .valueChanges.pipe(debounceTime(400))
      .subscribe((searchString) => {
        if (searchString && searchString.length && typeof searchString === 'string') {
          this.filteredClass[index] = this.unfilteredClass[index].filter((classObj) =>
            classObj.name.toLowerCase().includes(searchString.toLowerCase()),
          );
          if (searchString === '') {
            this.filteredClass[index] = this.unfilteredClass[index];
            this.preparationCenterFormArray.at(index).get('selected_specializations').setValue(null);
            this.filteredSpecialization[index] = [];
          }
        }
      });
  }

  //on select event for the top form for title field
  selectTempTitle(event: MatAutocompleteSelectedEvent) {
    if (event.option.value) {
      this.tempPreparationCenterForm.patchValue({ selectedTitle: event.option.value });
      this.tempPreparationCenterForm.patchValue({ rncp_title_id: event.option.value._id });

      //make the class to null so when user change title it resets
      this.tempPreparationCenterForm.patchValue({ selectedClass: null });
      this.tempPreparationCenterForm.patchValue({ class_id: null });
      this.getClassOfATempTitle(event.option.value._id);
    }
  }

  //on select event for the top form for the class field
  selectTempClass(event: MatAutocompleteSelectedEvent) {
    if (event.option.value) {
      this.tempPreparationCenterForm.patchValue({ selectedClass: event.option.value });
      this.tempPreparationCenterForm.patchValue({ class_id: event.option.value._id });

    }
  }

  //on select event for the bottom form for the title field
  selectTitle(event: MatAutocompleteSelectedEvent, index: number) {
    if (event.option.value) {
      if (this.selectedTitles && this.selectedTitles[index]) {
        this.selectedTitles[index] = event.option.value;
      } else {
        this.selectedTitles.push(event.option.value);
      }
      this.preparationCenterFormArray.at(index).get('rncp_title_id').setValue(event.option.value._id);
      this.selectedClass[index] = null;
      this.preparationCenterFormArray.at(index).get('selectedClass').setValue(null);
      this.preparationCenterFormArray.at(index).get('class_id').setValue(null);
      this.getClassOfATitle(event.option.value._id, index);
    }
  }

  //on select event for the bottom form for the class field
  selectClass(event: MatAutocompleteSelectedEvent, index: number) {
    if (event.option.value) {
      if (this.selectedClass && this.selectedClass[index]) {
        this.selectedClass[index] = event.option.value;
      } else {
        this.selectedClass.push(event.option.value);
      }
      this.preparationCenterFormArray.at(index).get('class_id').setValue(event.option.value._id);
      this.preparationCenterFormArray.at(index).get('selected_specializations').setValue(null);
      this.filteredSpecialization[index] = event.option.value.specializations ? event.option.value.specializations : [];
    }
  }

  displayTitle(title: Title) {
    return title && title.short_name ? title.short_name : '';
  }

  displayClass(classObj: any) {
    return classObj && classObj.name ? classObj.name : '';
  }

  // getSubmitCorrected(): boolean {
  //   const valid = this.connectedTitleForm.get('selectedTitle');
  //   if (valid.value && valid.value.length) {
  //     // valid.value.forEach((data) => {
  //     //   if (data.selectedTitle !== null && data.selected_specializations !== null) {
  //     //     if (data.selectedTitle !== '' && data.selected_specializations.length > 0) {
  //           this.disableSubmit = true;
  //           // return false;
  //         } else {
  //           this.disableSubmit = false;
  //           // return true;
  //     //     }
  //     //   }
  //     // });
  //   }
  //   return this.disableSubmit;
  // }

  submit() {
    this.isWaitingForResponse = true;
    const prepCenterData = _.cloneDeep(this.connectedTitleForm.value);

    if (prepCenterData.preparation_center_ats && prepCenterData.preparation_center_ats.length) {
      prepCenterData.preparation_center_ats.forEach((prepCenter) => {
        delete prepCenter.selectedTitle;
        delete prepCenter.selectedClass;
      });
    }
    this.subs.sink = this.schoolService.getSchool(this.parentData.schoolId).subscribe((resp) => {
      if (resp) {
        delete resp._id;
        // combine complete school data with preparation_center_ats data
        const payload = {
          long_name: resp.long_name,
          short_name: resp.short_name,
          preparation_center_ats: [],
        };

        this.subs.sink = this.schoolService.getSchoolPreparationCenterAndCertifier(this.parentData.schoolId).subscribe((school) => {
          if (school && school.preparation_center_ats && school.preparation_center_ats.length) {
            school.preparation_center_ats.forEach((prep) => {
              // add existing preparation_center_ats to payload
              if (prep.rncp_title_id) {
                payload.preparation_center_ats.push({
                  rncp_title_id: prep.rncp_title_id._id,
                  class_id: prep.class_id._id,
                  selected_specializations:
                    prep.selected_specializations && prep.selected_specializations.length
                      ? prep.selected_specializations.map((spec) => spec._id)
                      : [],
                });
              }
            });
          }
          // add preparation_center_ats from connectedTitleForm to payload
          prepCenterData.preparation_center_ats.forEach((prep) => {

            payload.preparation_center_ats.push(prep);
          });

          // payload.preparation_center_ats = _.uniqBy(payload.preparation_center_ats, 'rncp_title_id');

          this.isWaitingForResponse = false;
          this.updateSchool(payload);
        });
      }
    });
  }

  updateSchool(payload: any) {
    this.subs.sink = this.schoolService.updateSchool(this.parentData.schoolId, payload).subscribe(
      (resp) => {
        if (resp) {
          Swal.fire({ type: 'success', title: 'Bravo!' });
        }
        this.dialogRef.close(true);
      },
      (error1) => {
        Swal.fire({
          type: 'error',
          title: this.translate.instant('SM_SCHOOL_S6.TITLE'),
          html: this.translate.instant('SM_SCHOOL_S6.TEXT'),
          footer: `<span style="margin-left: auto">SM_SCHOOL_S6</span>`,
          confirmButtonText: this.translate.instant('SM_SCHOOL_S6.BUTTON'),
        });
      },
    );
  }

  closeDialog() {
    this.dialogRef.close(false);
  }

  validateSubmitButton() {
    let result = true;

    if (this.connectedTitleForm.invalid || !this.preparationCenterFormArray.length) {
      result = false;
    } else {
      const data = this.preparationCenterFormArray.value;
      for (const pc of data) {

        if (pc && pc.selectedTitle && typeof pc.selectedTitle === 'string') {
          result = false;
          break;
        }
      }
    }
    return result;
  }

  ngOnDestroy() {
    clearTimeout(this.timeOutVal);
    clearInterval(this.intVal);
    this.subs.unsubscribe();
  }
}
