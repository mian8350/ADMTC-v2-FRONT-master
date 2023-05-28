import { Component, ViewChild, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { PlatformService } from '../../service/platform/platform.service';
import { SubSink } from 'subsink';
import { UntypedFormBuilder, UntypedFormGroup, Validators, UntypedFormControl } from '@angular/forms';
import * as moment from 'moment';
import { map } from 'rxjs/operators';
export const Entity = [
  { key: 'admtc', value: 'admtc' },
  { key: 'certifier', value: 'certifier' },
  { key: 'academic', value: 'academic' },
  { key: 'company', value: 'company' },
];
@Component({
  selector: 'ms-user-type-mgmt',
  templateUrl: './user-type-mgmt.component.html',
  styleUrls: ['./user-type-mgmt.component.scss'],
})
export class UserTypeMgmtComponent implements OnInit, AfterViewInit, OnDestroy {
  form: UntypedFormGroup;
  usertypelist = [];
  AddNewStatus = false;
  usertype: any;
  entity = Entity;
  disableElement = false;
  dataSource = new MatTableDataSource([]);
  EditMode = false;
  displayedColumns: string[] = [
    'name',
    'entity',
    'systemTypes',
    'mgmt',
    'questionnaireType',
    'epreuves',
    'outils',
    'communication',
    'examens',
    'organisation',
    'programme',
    'certification',
    'archives',
    'action',
  ];
  filterColumns: string[] = [
    'nameFilter',
    'entityFilter',
    'systemTypesFilter',
    'mgmtFilter',
    'questionnaireTypeFilter',
    'epreuvesFilter',
    'outilsFilter',
    'communicationFilter',
    'examensFilter',
    'organisationFilter',
    'programmeFilter',
    'certificationFilter',
    'archivesFilter',
    'actionFilter',
  ];
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: false }) sort: MatSort;
  private subs = new SubSink();
  noData: any;
  nameFilter = new UntypedFormControl('');
  entityFilter = new UntypedFormControl('');
  systemTypesFilter = new UntypedFormControl('All');
  managementFilter = new UntypedFormControl('All');
  questionnaireTypeFilter = new UntypedFormControl('');
  epreuvesFilter = new UntypedFormControl('All');
  outilsFilter = new UntypedFormControl('All');
  communicationFilter = new UntypedFormControl('All');
  examensFilter = new UntypedFormControl('All');
  organisationFilter = new UntypedFormControl('All');
  programmeFilter = new UntypedFormControl('All');
  certificationFilter = new UntypedFormControl('All');
  archivesFilter = new UntypedFormControl('All');

  systemTypesFilterList = ['All'];
  operationList = [
    {
      label: 'All',
      value: 'All',
    },
    {
      label: 'View',
      value: 'V',
    },
    {
      label: 'Update',
      value: 'U',
    },
    {
      label: 'Download',
      value: 'D',
    },
  ];

  filteredValues = {
    name: '',
    entity: '',
    management: 'All',
    epreuves: 'All',
    outils: 'All',
    communication: 'All',
    examens: 'All',
    organisation: 'All',
    programme: 'All',
    certification: 'All',
    archives: 'All',
  };

  constructor(private platformService: PlatformService, private fb: UntypedFormBuilder) {}

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
  }

  ngOnInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.filter = JSON.stringify(this.filteredValues);
    this.dataSource.filterPredicate = this.customFilterPredicate();

    this.subs.sink = this.platformService.getUserType().subscribe((userTypes: any[]) => {
      this.dataSource.data = userTypes;
      this.noData = this.dataSource.connect().pipe(map(dataa => dataa.length === 0));
    });
    this.subs.sink = this.nameFilter.valueChanges.subscribe(name => {
      this.filteredValues['name'] = name;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });
    this.subs.sink = this.entityFilter.valueChanges.subscribe(entity => {
      this.filteredValues['entity'] = entity;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });
    this.subs.sink = this.managementFilter.valueChanges.subscribe(mgm => {
      this.filteredValues['management'] = mgm;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });
    this.subs.sink = this.epreuvesFilter.valueChanges.subscribe(epre => {
      this.filteredValues['epreuves'] = epre;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });
    this.subs.sink = this.outilsFilter.valueChanges.subscribe(outils => {
      this.filteredValues['outils'] = outils;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });
    this.subs.sink = this.communicationFilter.valueChanges.subscribe(communication => {
      this.filteredValues['communication'] = communication;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });
    this.subs.sink = this.examensFilter.valueChanges.subscribe(exam => {
      this.filteredValues['examens'] = exam;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });
    this.subs.sink = this.organisationFilter.valueChanges.subscribe(org => {
      this.filteredValues['organisation'] = org;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });
    this.subs.sink = this.programmeFilter.valueChanges.subscribe(prog => {
      this.filteredValues['programme'] = prog;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });
    this.subs.sink = this.certificationFilter.valueChanges.subscribe(resp => {
      this.filteredValues['certification'] = resp;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });
    this.subs.sink = this.archivesFilter.valueChanges.subscribe(resp => {
      this.filteredValues['archives'] = resp;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });
  }

  customFilterPredicate() {
    return function(data, filter: string): boolean {
      const searchString = JSON.parse(filter);
      const nameFound = data.name
        ? data.name
            .toString()
            .trim()
            .toLowerCase()
            .indexOf(searchString.name.toLowerCase()) !== -1
        : true;
      const entityFound = data.entity
        ? data.entity
            .toString()
            .trim()
            .toLowerCase()
            .indexOf(searchString.entity.toLowerCase()) !== -1
        : true;

      const managementFound =
        searchString.management.toLowerCase() === 'all' ||
        (data.mgmt &&
          data.mgmt
            .toString()
            .trim()
            .toLowerCase()
            .indexOf(searchString.management.toLowerCase()) !== -1);

      const epreuvesFound =
        searchString.epreuves.toLowerCase() === 'all' ||
        (data.epreuves &&
          data.epreuves
            .toString()
            .trim()
            .toLowerCase()
            .indexOf(searchString.epreuves.toLowerCase()) !== -1);

      const outilsFound =
        searchString.outils.toLowerCase() === 'all' ||
        (data.outils &&
          data.outils
            .toString()
            .trim()
            .toLowerCase()
            .indexOf(searchString.outils.toLowerCase()) !== -1);
      const communicationFound =
        searchString.communication.toLowerCase() === 'all' ||
        (data.communication &&
          data.communication
            .toString()
            .trim()
            .toLowerCase()
            .indexOf(searchString.communication.toLowerCase()) !== -1);
      const examensFound =
        searchString.examens.toLowerCase() === 'all' ||
        (data.examens &&
          data.examens
            .toString()
            .trim()
            .toLowerCase()
            .indexOf(searchString.examens.toLowerCase()) !== -1);
      const organisationFound =
        searchString.organisation.toLowerCase() === 'all' ||
        (data.organisation &&
          data.organisation
            .toString()
            .trim()
            .toLowerCase()
            .indexOf(searchString.organisation.toLowerCase()) !== -1);
      const programmeFound =
        searchString.programme.toLowerCase() === 'all' ||
        (data.programme &&
          data.programme
            .toString()
            .trim()
            .toLowerCase()
            .indexOf(searchString.programme.toLowerCase()) !== -1);
      const certificationFound =
        searchString.certification.toLowerCase() === 'all' ||
        (data.certification &&
          data.certification
            .toString()
            .trim()
            .toLowerCase()
            .indexOf(searchString.certification.toLowerCase()) !== -1);
      const archivesFound =
        searchString.archives.toLowerCase() === 'all' ||
        (data.archives &&
          data.archives
            .toString()
            .trim()
            .toLowerCase()
            .indexOf(searchString.archives.toLowerCase()) !== -1);
      return (
        nameFound &&
        entityFound &&
        managementFound &&
        epreuvesFound &&
        outilsFound &&
        communicationFound &&
        examensFound &&
        organisationFound &&
        programmeFound &&
        certificationFound &&
        archivesFound
      );
    };
  }

  getOperatonCode(operation) {
    let code = '';

    switch (operation) {
      case 'View': {
        code = 'V';
        break;
      }
      case 'Update': {
        code = 'U';
        break;
      }
      case 'Download': {
        code = 'D';
        break;
      }
      default: {
        code = '';
        break;
      }
    }
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  EditUserType(row) {
    this.AddNewStatus = true;
    this.EditMode = true;
    this.usertype = row;
    this.initForm();
    if (row.isSystemType) {
      this.disableElement = true;
    } else {
      this.disableElement = false;
    }
  }
  addUserTypeMgmt() {}

  initForm() {
    this.form = this.fb.group({
      isUserCollection: [this.usertype && this.usertype.isUserCollection ? this.usertype.isUserCollection : true],
      name: [this.usertype ? this.translateUserTypeOnlyIfSystem(this.usertype) : '', Validators.required],
      entity: [this.usertype ? this.usertype.entity : '', Validators.required],
      description: [this.usertype ? this.usertype.description : '', Validators.required],
      studentManagement: [this.usertype ? this.usertype.studentManagement : false],
      FolderPermission: this.fb.group({
        admissions: this.fb.group({
          status: [this.checkPermissionForPrint(this.usertype, 'admissions', 'status', '')],
          permissions: this.fb.group({
            view: [this.checkPermissionForPrint(this.usertype, 'admissions', 'permissions', 'view')],
            update: [this.checkPermissionForPrint(this.usertype, 'admissions', 'permissions', 'update')],
            download: [this.checkPermissionForPrint(this.usertype, 'admissions', 'permissions', 'download')],
          }),
        }),
        annalesEpreuves: this.fb.group({
          status: [this.checkPermissionForPrint(this.usertype, 'annalesEpreuves', 'status', '')],
          permissions: this.fb.group({
            view: [this.checkPermissionForPrint(this.usertype, 'annalesEpreuves', 'permissions', 'view')],
            update: [this.checkPermissionForPrint(this.usertype, 'annalesEpreuves', 'permissions', 'update')],
            download: [this.checkPermissionForPrint(this.usertype, 'annalesEpreuves', 'permissions', 'download')],
          }),
        }),
        boiteaOutils: this.fb.group({
          status: [this.checkPermissionForPrint(this.usertype, 'boiteaOutils', 'status', '')],
          permissions: this.fb.group({
            view: [this.checkPermissionForPrint(this.usertype, 'boiteaOutils', 'permissions', 'view')],
            update: [this.checkPermissionForPrint(this.usertype, 'boiteaOutils', 'permissions', 'update')],
            download: [this.checkPermissionForPrint(this.usertype, 'boiteaOutils', 'permissions', 'download')],
          }),
        }),
        communication: this.fb.group({
          status: [this.checkPermissionForPrint(this.usertype, 'communication', 'status', '')],
          permissions: this.fb.group({
            view: [this.checkPermissionForPrint(this.usertype, 'communication', 'permissions', 'view')],
            update: [this.checkPermissionForPrint(this.usertype, 'communication', 'permissions', 'update')],
            download: [this.checkPermissionForPrint(this.usertype, 'communication', 'permissions', 'download')],
          }),
        }),
        examens: this.fb.group({
          status: [this.checkPermissionForPrint(this.usertype, 'examens', 'status', '')],
          permissions: this.fb.group({
            view: [this.checkPermissionForPrint(this.usertype, 'examens', 'permissions', 'view')],
            update: [this.checkPermissionForPrint(this.usertype, 'examens', 'permissions', 'update')],
            download: [this.checkPermissionForPrint(this.usertype, 'examens', 'permissions', 'download')],
          }),
        }),
        organisation: this.fb.group({
          status: [this.checkPermissionForPrint(this.usertype, 'organisation', 'status', '')],
          permissions: this.fb.group({
            view: [this.checkPermissionForPrint(this.usertype, 'organisation', 'permissions', 'view')],
            update: [this.checkPermissionForPrint(this.usertype, 'organisation', 'permissions', 'update')],
            download: [this.checkPermissionForPrint(this.usertype, 'organisation', 'permissions', 'download')],
          }),
        }),
        programme: this.fb.group({
          status: [this.checkPermissionForPrint(this.usertype, 'programme', 'status', '')],
          permissions: this.fb.group({
            view: [this.checkPermissionForPrint(this.usertype, 'programme', 'permissions', 'view')],
            update: [this.checkPermissionForPrint(this.usertype, 'programme', 'permissions', 'update')],
            download: [this.checkPermissionForPrint(this.usertype, 'programme', 'permissions', 'download')],
          }),
        }),
        epreuvesCertification: this.fb.group({
          status: [this.checkPermissionForPrint(this.usertype, 'epreuvesCertification', 'status', '')],
          permissions: this.fb.group({
            view: [this.checkPermissionForPrint(this.usertype, 'epreuvesCertification', 'permissions', 'view')],
            update: [this.checkPermissionForPrint(this.usertype, 'epreuvesCertification', 'permissions', 'update')],
            download: [this.checkPermissionForPrint(this.usertype, 'epreuvesCertification', 'permissions', 'download')],
          }),
        }),
        archives: this.fb.group({
          status: [this.checkPermissionForPrint(this.usertype, 'archives', 'status', '')],
          permissions: this.fb.group({
            view: [this.checkPermissionForPrint(this.usertype, 'archives', 'permissions', 'view')],
            update: [this.checkPermissionForPrint(this.usertype, 'archives', 'permissions', 'update')],
            download: [this.checkPermissionForPrint(this.usertype, 'archives', 'permissions', 'download')],
          }),
        }),
        studentaccessoption: this.fb.group({
          status: [false],
        }),
      }),
    });
  }

  translateUserTypeOnlyIfSystem(userType): string {
    if (userType.isSystemType) {
      return this.getTranslateADMTCSTAFFKEY(userType.name);
    } else {
      return userType.name;
    }
  }
  getTranslateADMTCSTAFFKEY(name) {
    // let value = this.translate.instant('ADMTCSTAFFKEY.' + name.toUpperCase());
    // return value != 'ADMTCSTAFFKEY.' + name.toUpperCase() ? value : name;
    return name;
  }
  getTranslateENTITY(name) {
    // let value = this.translate.instant('SETTINGS.USERTYPES.ENTITYNAME.' + name.toUpperCase());
    // return value != 'SETTINGS.USERTYPES.ENTITYNAME.' + name.toUpperCase() ? value : name;

    return name;
  }

  checkPermissionForPrint(row, field1, field2, permision) {
    if (field2 === 'status') {
      if (row && row.FolderPermission && row.FolderPermission[0] && row.FolderPermission[0][field1][field2]) {
        return true;
      }
    } else {
      if (row && row.FolderPermission && row.FolderPermission[0] && row.FolderPermission[0][field1][field2][permision]) {
        return true;
      }
    }

    return false;
  }

  filterReset() {
    this.filteredValues = {
      name: '',
      entity: '',
      management: 'All',
      epreuves: 'All',
      outils: 'All',
      communication: 'All',
      examens: 'All',
      organisation: 'All',
      programme: 'All',
      certification: 'All',
      archives: 'All',
    };

    this.dataSource.filter = JSON.stringify(this.filteredValues);

    this.nameFilter.setValue('');
    this.entityFilter.setValue('');
    this.systemTypesFilter.setValue('All');
    this.managementFilter.setValue('All');
    this.questionnaireTypeFilter.setValue('');
    this.epreuvesFilter.setValue('All');
    this.outilsFilter.setValue('All');
    this.communicationFilter.setValue('All');
    this.examensFilter.setValue('All');
    this.organisationFilter.setValue('All');
    this.programmeFilter.setValue('All');
    this.certificationFilter.setValue('All');
    this.archivesFilter.setValue('All');
  }

  cancel() {
    this.AddNewStatus = false;
  }
  addScholarSeason() {}
  saveUserType() {
    this.AddNewStatus = false;
  }
}
