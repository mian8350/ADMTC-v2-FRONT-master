import { Component, OnInit, ChangeDetectorRef, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import Swal from 'sweetalert2';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { SwalPartialTargets } from '@sweetalert2/ngx-sweetalert2';
import { UntypedFormGroup, UntypedFormBuilder, Validators, UntypedFormControl } from '@angular/forms';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { PromoService } from '../../service/promo/promo.service';
import { CoreService } from './../../service/core/core.service';
import { SubSink } from 'subsink';

@Component({
  selector: 'ms-auto-promo',
  templateUrl: './auto-promo.component.html',
  styleUrls: ['./auto-promo.component.scss'],
})
export class AutoPromoComponent implements OnInit, OnDestroy {
  translatePipe: TranslatePipe;
  promoForm: UntypedFormGroup;

  displayedColumns: string[] = ['ref', 'title', 'subTitle', 'login', 'register', 'schoolPage', 'action'];
  filterColumns: string[] = [
    'refFilter',
    'titleFilter',
    'subTitleFilter',
    'loginFilter',
    'registerFilter',
    'schoolPageFilter',
    'actionFilter',
  ];

  dataSource = new MatTableDataSource([]);

  refFilter = new UntypedFormControl();
  titleFilter = new UntypedFormControl();
  subTitleFilter = new UntypedFormControl();
  loginFilter = new UntypedFormControl('all');
  registerFilter = new UntypedFormControl('all');
  schoolPageFilter = new UntypedFormControl('all');

  filteredValues = {
    ref: '',
    title: '',
    subTitle: '',
    login: 'all',
    register: 'all',
    schoolPage: 'all',
  };

  operation = 'Save';
  selectedIndex = null;
  private subs = new SubSink();

  @ViewChild(MatSort, { static: true }) sort: MatSort;
  private intVal: any;
  private timeOutVal: any;

  constructor(
    private translate: TranslateService,
    private _ref: ChangeDetectorRef,
    public readonly SwalTargets: SwalPartialTargets,
    private fb: UntypedFormBuilder,
    private promoService: PromoService,
    public coreService: CoreService,
  ) {}

  ngOnInit() {

    this.translatePipe = new TranslatePipe(this.translate, this._ref);

    // this.subs.sink = this.promoService.getPromos().subscribe((promos: any) => {
    //   this.dataSource.data = promos;
    // });
    this.dataSource.sort = this.sort;

    this.subs.sink = this.refFilter.valueChanges.subscribe((ref) => {
      this.filteredValues['ref'] = ref;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });

    this.subs.sink = this.titleFilter.valueChanges.subscribe((title) => {
      this.filteredValues['title'] = title;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });

    this.subs.sink = this.subTitleFilter.valueChanges.subscribe((subTitle) => {
      this.filteredValues['subTitle'] = subTitle;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });

    this.subs.sink = this.loginFilter.valueChanges.subscribe((login) => {
      this.filteredValues['login'] = login;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });

    this.subs.sink = this.registerFilter.valueChanges.subscribe((register) => {
      this.filteredValues['register'] = register;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });

    this.subs.sink = this.schoolPageFilter.valueChanges.subscribe((schoolPage) => {
      this.filteredValues['schoolPage'] = schoolPage;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });

    this.dataSource.filterPredicate = this.customFilterPredicate();

    this.promoForm = this.fb.group({
      ref: [null, Validators.required],
      title: [null, Validators.required],
      subTitle: [null, Validators.required],
      content: [null, Validators.required],
      login: [false],
      register: [false],
      schoolPage: [false],
      backgroundImage: [null],
    });
  }

  get checkboxSelected() {
    return this.promoForm.get('login').value || this.promoForm.get('register').value || this.promoForm.get('schoolPage').value;
  }

  customFilterPredicate() {
    const myFilterPredicate = function (data, filter: string): boolean {
      const searchString = JSON.parse(filter);
      const refFound = data.ref.toString().trim().toLowerCase().indexOf(searchString.ref.toLowerCase()) !== -1;
      const titleFound = data.title.toString().trim().toLowerCase().indexOf(searchString.title.toLowerCase()) !== -1;
      const subTitleFound = data.subTitle.toString().trim().toLowerCase().indexOf(searchString.subTitle.toLowerCase()) !== -1;
      const loginFound = searchString.login.toLowerCase() === 'all' ? true : data.login;
      const registerFound = searchString.register.toLowerCase() === 'all' ? true : data.register;
      const schoolPageFound = searchString.schoolPage.toLowerCase() === 'all' ? true : data.schoolPage;
      return refFound && titleFound && subTitleFound && loginFound && registerFound && schoolPageFound;
    };
    return myFilterPredicate;
  }

  resetAllFilter() {
    this.refFilter.setValue('');
    this.titleFilter.setValue('');
    this.subTitleFilter.setValue('');
    this.loginFilter.setValue('all');
    this.registerFilter.setValue('all');
    this.schoolPageFilter.setValue('all');

    this.filteredValues = {
      ref: '',
      title: '',
      subTitle: '',
      login: 'all',
      register: 'all',
      schoolPage: 'all',
    };
  }

  chooseFile(fileUpload: HTMLInputElement) {
    fileUpload.onchange = () => {
      const file = fileUpload.files[0];
      if (file.type === 'image/png' || file.type === 'image/jpeg' || file.type === 'image/gif') {
        const reader = new FileReader();
        reader.onload = () => {
          this.promoForm.patchValue({
            backgroundImage: reader.result,
          });
        };
        reader.readAsDataURL(file);
      } else {
        Swal.fire({
          type: 'info',
          text: this.translate.instant('Only png/jpg/gif files are allowed'),
        });
      }
    };
    fileUpload.click();
  }

  addPromo() {
    if (this.operation === 'Update' && this.selectedIndex > -1) {
      this.dataSource.data[this.selectedIndex] = this.promoForm.getRawValue();
      this.operation = 'Save';
      this.selectedIndex = -1;
    } else {
      this.dataSource.data.push(this.promoForm.getRawValue());
    }
    this.promoForm.reset();
    this.refFilter.setValue('');
    Swal.close();
  }

  editPromo(index) {
    this.selectedIndex = index;
    this.operation = 'Update';
    this.promoForm.patchValue(this.dataSource.data[index]);
  }

  removePromo(event) {
    let timeDisabled = 5;
    Swal.fire({
      allowOutsideClick: false,
      title: this.translate.instant('DASHBOARD_DELETE.deletedTitle'),
      html: this.translate.instant('this action will delete promo !'),
      type: 'warning',
      allowEscapeKey: true,
      showCancelButton: true,
      confirmButtonText: this.translate.instant('THUMBSUP.SWEET_ALERT.CONFIRM', { timer: timeDisabled }),
      cancelButtonText: this.translate.instant('DASHBOARD_DELETE.NO'),
      allowEnterKey: false,
      onOpen: () => {
        Swal.disableConfirmButton();
        const confirmBtnRef = Swal.getConfirmButton();
        this.intVal = setInterval(() => {
          timeDisabled -= 1;
          confirmBtnRef.innerText = this.translate.instant('DELETE_ITEM_TEMPLATE.BUTTON_1') + ` (${timeDisabled})`;
        }, 1000);
        clearInterval(this.timeOutVal);
        this.timeOutVal = setTimeout(() => {
          confirmBtnRef.innerText = this.translate.instant('DELETE_ITEM_TEMPLATE.BUTTON_1');
          Swal.enableConfirmButton();
          clearInterval(this.intVal);
          clearTimeout(this.timeOutVal);
        }, timeDisabled * 1000);
      },
    }).then((res) => {
      clearTimeout(this.timeOutVal);
      if (res.value) {
        this.dataSource.data.splice(this.selectedIndex, 1);
        this.refFilter.setValue('');
        Swal.fire({
          allowOutsideClick: false,
          type: 'success',
          title: this.translate.instant('EVENT_S1.TITLE'),
          html: this.translate.instant('promo deleted'),
          confirmButtonText: this.translate.instant('EVENT_S1.BUTTON'),
        });
      }
    });
  }

  addPromoCancel() {
    this.operation = 'Save';
    this.selectedIndex = -1;
    this.promoForm.reset();
  }

  removePromoCancel(event) {
    this.operation = 'Save';
    this.selectedIndex = -1;
  }

  persistElementIndex(index) {
    this.selectedIndex = index;
  }

  ngOnDestroy() {
    clearInterval(this.intVal);
    clearTimeout(this.timeOutVal);
    this.subs.unsubscribe();
  }
}
