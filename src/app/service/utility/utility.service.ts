import { Injectable } from '@angular/core';
import { AuthService } from '../auth-service/auth.service';
import * as _ from 'lodash';
import { NgxPermissionsService } from 'ngx-permissions';
import { Apollo } from 'apollo-angular';
import { Observable } from 'rxjs';
import { AppPermission } from 'app/models/app-permission.model';
import gql from 'graphql-tag';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class UtilityService {
  userTypeList = [
    {
      _id: '5a2e1ecd53b95d22c82f954e',
      name: 'ADMTC Admin',
    },
    {
      _id: '5a2e1ecd53b95d22c82f954b',
      name: 'ADMTC Director',
    },
    {
      _id: '5a2e1ecd53b95d22c82f954d',
      name: 'ADMTC Visitor',
    },
    {
      _id: '5a2e1ecd53b95d22c82f9555',
      name: 'Academic Admin',
    },
    {
      _id: '5a2e1ecd53b95d22c82f9554',
      name: 'Academic Director',
    },
    {
      _id: '5cdbdeaf4b1f6a1b5a0b3fb6',
      name: 'Academic Final Jury Member',
    },
    {
      _id: '5c173695ba179819bd115df1',
      name: 'Academic Final Jury Member',
    },
    {
      _id: '5a2e1ecd53b95d22c82f9550',
      name: 'Certifier Admin',
    },
    {
      _id: '5a66cd0813f5aa05902fac1e',
      name: 'Chief Group Academic',
    },
    {
      _id: '5bc066042a35327127ad9dfa',
      name: 'Collaborateur Ext. ADMTC',
    },
    {
      _id: '5b1ffb5c9e25da6d30bde480',
      name: 'Correcteur PFE Oral',
    },
    {
      _id: '5a2e1ecd53b95d22c82f9559',
      name: 'Corrector',
    },
    {
      _id: '5f33552b683818419d13028b',
      name: 'Animator Business game',
    },
    {
      _id: '5b210d24090336708818ded1',
      name: 'Corrector Certifier',
    },
    {
      _id: '5a2e1ecd53b95d22c82f9552',
      name: 'Corrector Quality',
    },
    {
      _id: '5a2e1ecd53b95d22c82f9551',
      name: 'Corrector of Problematic',
    },
    {
      _id: '5a9e7ddf8228f45eb2e9bc77',
      name: 'Cross Corrector',
    },
    {
      _id: '5a2e1ecd53b95d22c82f954f',
      name: 'CR School Director',
    },
    {
      _id: '5a2e1ecd53b95d22c82f9553',
      name: 'PC School Director',
    },
    {
      _id: '5a2e603c53b95d22c82f958f',
      name: 'HR',
    },
    {
      _id: '5a2e603f53b95d22c82f9590',
      name: 'Mentor',
    },
    {
      _id: '5a3cd5e7e6fae44c7c11561e',
      name: 'President of Jury',
    },
    {
      _id: '5cdbde9b4b1f6a1b5a0b3fb5',
      name: 'Professional Jury Member',
    },
    {
      _id: '5a2e1ecd53b95d22c82f954c',
      name: 'Sales',
    },
    {
      _id: '5a2e1ecd53b95d22c82f9558',
      name: 'Teacher',
    },
    {
      _id: '5e93dd18ef9a2925e85eeb29',
      name: 'Teacher Certifier',
    },
  ];

  industryList = [
    'food',
    'bank',
    'wood_paper_cardboard_printing',
    'building_construction_materials',
    'chemistry_parachemistry',
    'sales_trading_distribution',
    'education',
    'edition_communication_multimedia',
    'electronics_electricity',
    'studies_and_consultancy',
    'professional_training',
    'pharmaceutical_industry',
    'it_telecom',
    'machinery_and_equipment_automotive',
    'metallurgy_metal_working',
    'plastic_rubber',
    'business_services',
    'textile_clothing_shoes',
    'transport_logistics',
    'other'
  ];

  constructor(
    private authService: AuthService,
    private permissionService: NgxPermissionsService,
    private apollo: Apollo,
    private permissions: NgxPermissionsService,
  ) {}

  getAppPermission(): Observable<AppPermission> {
    return this.apollo
      .query({
        query: gql`
          query {
            GetAppPermission {
              group_name
              group_logo
              is_site_active
            }
          }
        `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAppPermission']));
  }

  getCurrentUser() {
    return JSON.parse(localStorage.getItem('userProfile'));
  }

  getCurrentUserType() {
    const user = this.getCurrentUser();
    if (user && user.entities && user.entities[0] && user.entities[0].type && user.entities[0].type._id) {
      return user.entities[0].type._id;
    } else {
      return null;
    }
  }

  getAssignedTitles() {
    const user = JSON.parse(localStorage.getItem('userProfile'));
    const titles = [];
    if (user && user.entities && user.entities.length) {
      user.entities.forEach((entity) => {
        if (entity && entity.assigned_rncp_title) {
          titles.push(entity.assigned_rncp_title);
        }
      });
    }
    return titles;
  }

  getAllAssignedTitles(entities) {
    const titles = [];
    if (entities && entities.length) {
      entities.forEach((entity) => {
        if (entity && entity.assigned_rncp_title) {
          titles.push(entity.assigned_rncp_title);
        }
      });
    }
    return titles;
  }

  isUserADMTC() {
    const permission = this.authService.getPermission();
    let isEntityExist = false;

    permission.forEach((entityName) => {
      if (entityName === 'ADMTC Admin') {
        isEntityExist = true;
      }
    });
    return isEntityExist;
  }

  isUserADMTCDir() {
    const permission = this.authService.getPermission();
    let isEntityExist = false;
    permission.forEach((entityName) => {
      if (entityName === 'ADMTC Director') {
        isEntityExist = true;
      }
    });
    return isEntityExist;
  }

  isUserEntityADMTC() {
    return !!this.permissions.getPermission('ADMTC Admin') || !!this.permissions.getPermission('ADMTC Director');
    // const permission = this.authService.getPermission();
    // let isEntityExist = false;
    // permission.forEach((entityName) => {
    //   if (entityName === 'ADMTC Admin' || entityName === 'ADMTC Director') {
    //     isEntityExist = true;
    //   }
    // });
    // return isEntityExist;
  }

  isUserJuryMember() {
    return (
      !!this.permissions.getPermission('Academic Final Jury Member') ||
      !!this.permissions.getPermission('Professional Jury Member Certifier') ||
      !!this.permissions.getPermission('Professional Jury Member') ||
      !!this.permissions.getPermission('Academic jury member')
    );
  }

  isUserOneOfADMTCEntity() {
    const user = this.getCurrentUser();
    let result = false;
    if (user && user.entities) {
      user.entities.forEach((entity) => {
        if (entity && entity.entity_name === 'admtc') {
          result = true;
        }
      });
    }
    return result;
  }

  isUserAcadir() {
    const permission = this.authService.getPermission();
    let isEntityExist = false;
    permission.forEach((entityName) => {
      if (entityName === 'Academic Director') {
        isEntityExist = true;
      }
    });
    return isEntityExist;
  }

  isUserAcadAdmin() {
    const permission = this.authService.getPermission();
    let isEntityExist = false;
    permission.forEach((entityName) => {
      if (entityName === 'Academic Admin') {
        isEntityExist = true;
      }
    });
    return isEntityExist;
  }

  isUserAcadDirAdmin() {
    return (
      !!this.permissions.getPermission('Academic Admin') ||
      !!this.permissions.getPermission('Academic Director') ||
      !!this.permissions.getPermission('PC School Director')
    );
    // const permission = this.authService.getPermission();
    // let isEntityExist = false;
    // permission.forEach((entityName) => {
    //   if (entityName === 'Academic Director' || entityName === 'Academic Admin') {
    //     isEntityExist = true;
    //   }
    // });
    // return isEntityExist;
  }

  isUserPCDirector() {
    return !!this.permissions.getPermission('PC School Director');
  }

  isUserCRDirAdmin() {
    return !!this.permissions.getPermission('Certifier Admin') || !!this.permissions.getPermission('CR School Director');
    // const permission = this.authService.getPermission();
    // let isEntityExist = false;
    // permission.forEach((entityName) => {
    //   if (entityName === 'Certifier Admin' || entityName === 'CR School Director') {
    //     isEntityExist = true;
    //   }
    // });
    // return isEntityExist;
  }

  isUserJuryCorrector() {
    return !!this.permissions.getPermission('Jury Corrector');
  }

  isUserCompany() {
    return !!this.permissions.getPermission('Mentor') || !!this.permissions.getPermission('HR');
  }

  isUserPresidentOfJury() {
    return !!this.permissions.getPermission('President of Jury');
  }

  isUserCrossCorrection() {
    const permission = this.authService.getPermission();
    let isEntityExist = false;
    permission.forEach((entityName) => {
      if (entityName === 'Cross Corrector') {
        isEntityExist = true;
      }
    });
    return isEntityExist;
  }

  isUserStudent() {
    const permission = this.authService.getPermission();
    let isEntityExist = false;
    permission.forEach((entityName) => {
      if (entityName === 'Student') {
        isEntityExist = true;
      }
    });
    return isEntityExist;
  }

  // !!this.permissions.getPermission('Student');

  isUserMentor() {
    const permission = this.authService.getPermission();
    let isEntityExist = false;
    permission.forEach((entityName) => {
      if (entityName === 'Mentor') {
        isEntityExist = true;
      }
    });
    return isEntityExist;
  }

  isCorrector() {
    const permission = this.authService.getPermission();
    let isEntityExist = false;
    permission.forEach((entityName) => {
      if (entityName === 'Corrector') {
        isEntityExist = true;
      }
    });
    return isEntityExist;
  }

  isAnimator() {
    const permission = this.authService.getPermission();
    let isEntityExist = false;
    permission.forEach((entityName) => {
      if (entityName === 'Animator Business game') {
        isEntityExist = true;
      }
    });
    return isEntityExist;
  }

  isDirector() {
    const permission = this.authService.getPermission();
    let isEntityExist = false;
    permission.forEach((entityName) => {
      if (entityName === 'PC School Director') {
        isEntityExist = true;
      }
    });
    return isEntityExist;
  }

  isTeacher() {
    const permission = this.authService.getPermission();
    let isEntityExist = false;
    permission.forEach((entityName) => {
      if (entityName === 'Teacher') {
        isEntityExist = true;
      }
    });
    return isEntityExist;
  }

  isProfesionalJuryMember() {
    const permission = this.authService.getPermission();
    let isEntityExist = false;
    permission.forEach((entityName) => {
      if (entityName === 'Professional Jury Member') {
        isEntityExist = true;
      }
    });
    return isEntityExist;
  }

  isCertifierAdmin() {
    const permission = this.authService.getPermission();
    let isEntityExist = false;
    permission.forEach((entityName) => {
      if (entityName === 'Certifier Admin') {
        isEntityExist = true;
      }
    });
    return isEntityExist;
  }

  isAcademicJuryMember() {
    const permission = this.authService.getPermission();
    let isEntityExist = false;
    permission.forEach((entityName) => {
      if (entityName === 'Academic Final Jury Member') {
        isEntityExist = true;
      }
    });
    return isEntityExist;
  }

  isCertifierDirector() {
    const permission = this.authService.getPermission();
    let isEntityExist = false;
    permission.forEach((entityName) => {
      if (entityName === 'CR School Director') {
        isEntityExist = true;
      }
    });
    return isEntityExist;
  }

  isCorrectorCertifier() {
    const permission = this.authService.getPermission();
    let isEntityExist = false;
    permission.forEach((entityName) => {
      if (entityName === 'Corrector Certifier') {
        isEntityExist = true;
      }
    });
    return isEntityExist;
  }

  isCorrectorOfProblematic() {
    return !!this.permissions.getPermission('Corrector of Problematic');
    // const permission = this.authService.getPermission();
    // let isEntityExist = false;

    // permission.forEach((entityName) => {
    //   if (entityName === 'Corrector of Problematic') {
    //     isEntityExist = true;
    //   }
    // });
    // return isEntityExist;
  }

  isCorrectorQuality() {
    const permission = this.authService.getPermission();
    let isEntityExist = false;
    permission.forEach((entityName) => {
      if (entityName === 'Corrector Quality') {
        isEntityExist = true;
      }
    });
    return isEntityExist;
  }

  isPresidentofJury() {
    const permission = this.authService.getPermission();
    let isEntityExist = false;
    permission.forEach((entityName) => {
      if (entityName === 'President of Jury') {
        isEntityExist = true;
      }
    });
    return isEntityExist;
  }

  isMentor() {
    const permission = this.authService.getPermission();
    let isEntityExist = false;
    permission.forEach((entityName) => {
      if (entityName === 'Mentor') {
        isEntityExist = true;
      }
    });
    return isEntityExist;
  }

  isChiefGroupAcademic() {
    const permission = this.authService.getPermission();
    let isEntityExist = false;
    permission.forEach((entityName) => {
      if (entityName === 'Chief Group Academic') {
        isEntityExist = true;
      }
    });
    return isEntityExist;
  }

  isUserVisitor() {
    const permission = this.authService.getPermission();
    let isEntityExist = false;
    permission.forEach((entityName) => {
      if (entityName === 'ADMTC Visitor') {
        isEntityExist = true;
      }
    });
    return isEntityExist;
  }

  checkUserIsFromGroupOfSchools() {
    const currentUser = JSON.parse(localStorage.getItem('userProfile'));
    let result = false;
    if (currentUser && currentUser.entities && currentUser.entities.length) {
      currentUser.entities.forEach((entity) => {
        if (entity.entity_name === 'group_of_schools') {
          result = true;
        }
      });
    }

    return result;
  }

  checkIsCurrentUserIncluded(userTypes: { _id: string; name: string }[]) {
    if (userTypes && userTypes.length) {
      for (const userType of userTypes) {
        let validate = false;
        switch (userType.name) {
          case 'Academic Director':
            validate = this.isUserAcadir();
            break;
          case 'Academic Admin':
            validate = this.isUserAcadAdmin();
            break;
          case 'Cross Corrector':
            validate = this.isUserCrossCorrection();
            break;
          case 'Corrector':
            validate = this.isCorrector();
            break;
          case 'Animator Business game':
            validate = this.isAnimator();
            break;
          case 'PC School Director':
            validate = this.isDirector();
            break;
          case 'Teacher':
            validate = this.isTeacher();
            break;
          case 'Professional Jury Member':
            validate = this.isProfesionalJuryMember();
            break;
          case 'Certifier Admin':
            validate = this.isCertifierAdmin();
            break;
          case 'Academic Final Jury Member':
            validate = this.isAcademicJuryMember();
            break;
          case 'CR School Director':
            validate = this.isCertifierDirector();
            break;
          case 'Corrector Certifier':
            validate = this.isCorrectorCertifier();
            break;
          case 'Corrector of Problematic':
            validate = this.isCorrectorOfProblematic();
            break;
          case 'Corrector Quality':
            validate = this.isCorrectorQuality();
            break;
          case 'President of Jury':
            validate = this.isPresidentofJury();
            break;
          case 'Mentor':
            validate = this.isMentor();
            break;
          case 'Chief Group Academic':
            validate = this.isChiefGroupAcademic();
            break;
        }
        if (validate) {
          return validate;
        }
      }
    }
    return false;
  }

  checkIsCurrentUserAssigned(userTypes: { _id: string; name: string }[]) {
    if (userTypes && userTypes.length) {
      for (const userType of userTypes) {
        let validate = false;
        switch (userType.name) {
          case 'Academic Director':
            validate = this.isUserAcadir() || this.isUserAcadAdmin() ? true : false;
            break;
          case 'Academic Admin':
            validate = this.isUserAcadir() || this.isUserAcadAdmin() ? true : false;
            break;
          case 'Cross Corrector':
            validate = this.isUserCrossCorrection();
            break;
          case 'Corrector':
            validate = this.isCorrector();
            break;
          case 'Animator Business game':
            validate = this.isAnimator();
            break;
          case 'PC School Director':
            validate = this.isDirector();
            break;
          case 'Teacher':
            validate = this.isTeacher();
            break;
          case 'Professional Jury Member':
            validate = this.isProfesionalJuryMember();
            break;
          case 'Certifier Admin':
            validate = this.isCertifierAdmin();
            break;
          case 'Academic Final Jury Member':
            validate = this.isAcademicJuryMember();
            break;
          case 'CR School Director':
            validate = this.isCertifierDirector();
            break;
          case 'Corrector Certifier':
            validate = this.isCorrectorCertifier();
            break;
          case 'Corrector of Problematic':
            validate = this.isCorrectorOfProblematic();
            break;
          case 'Corrector Quality':
            validate = this.isCorrectorQuality();
            break;
          case 'President of Jury':
            validate = this.isPresidentofJury();
            break;
          case 'Mentor':
            validate = this.isMentor();
            break;
          case 'Chief Group Academic':
            validate = this.isChiefGroupAcademic();
            break;
        }
        if (validate) {
          return validate;
        }
      }
    }
    return false;
  }

  getUserAllAssignedTitle() {
    const user = this.getCurrentUser();
    const entities = user.entities;
    const titleId = [];

    if (entities && entities.length) {
      entities.forEach((entity) => {
        if (entity.assigned_rncp_title && entity.assigned_rncp_title._id && !titleId.includes(entity.assigned_rncp_title._id)) {
          titleId.push(entity.assigned_rncp_title._id);
        }
      });
    }

    return titleId;
  }

  getAcademicAllAssignedTitle(entities) {
    const titleId = [];

    if (entities && entities.length) {
      entities.forEach((entity) => {
        if (entity.assigned_rncp_title && entity.assigned_rncp_title._id && !titleId.includes(entity.assigned_rncp_title._id)) {
          titleId.push(entity.assigned_rncp_title._id);
        }
      });
    }

    return titleId;
  }

  getAcademicAllAssignedSchool(entities) {
    const schoolId = [];

    if (entities && entities.length) {
      entities.forEach((entity) => {
        if (entity.school && entity.school._id && !schoolId.includes(entity.school._id)) {
          schoolId.push(entity.school._id);
        }
      });
    }

    return schoolId;
  }

  getUserAllAssignedSchool() {
    const user = this.getCurrentUser();
    const entities = user.entities;
    const schoolId = [];

    if (entities && entities.length) {
      entities.forEach((entity) => {
        if (entity.school && entity.school._id && !schoolId.includes(entity.school._id)) {
          schoolId.push(entity.school._id);
        }
      });
    }

    return schoolId;
  }

  getUserAllAssignedClass() {
    const user = this.getCurrentUser();
    const entities = user.entities;
    const classId = [];

    if (entities && entities.length) {
      entities.forEach((entity) => {
        if (entity.class && entity.class._id && !classId.includes(entity.class._id)) {
          classId.push(entity.class._id);
        }
      });
    }

    return classId;
  }

  getAcademicAllAssignedClass(entities) {
    const classId = [];

    if (entities && entities.length) {
      entities.forEach((entity) => {
        if (entity.class && entity.class._id && !classId.includes(entity.class._id)) {
          classId.push(entity.class._id);
        }
      });
    }

    return classId;
  }

  getUserAllSchoolAcadDirAdmin() {
    const user = this.getCurrentUser();
    const entities = user.entities.filter((ent) => ent.type.name === 'Academic Admin' || ent.type.name === 'Academic Director');
    const schoolId = [];

    if (entities && entities.length) {
      entities.forEach((entity) => {
        if (entity.school && entity.school._id && !schoolId.includes(entity.school._id)) {
          schoolId.push(entity.school._id);
        }
      });
    }

    return schoolId;
  }

  getUserAllSchoolCerAdmin() {
    const user = this.getCurrentUser();
    const entities = user.entities.filter((ent) => ent.type.name === 'Certifier Admin');
    const schoolId = [];

    if (entities && entities.length) {
      entities.forEach((entity) => {
        if (entity.school && entity.school._id && !schoolId.includes(entity.school._id)) {
          schoolId.push(entity.school._id);
        }
      });
    }

    return schoolId;
  }

  getAllSchoolFromChiefGroupUser() {
    const user = this.getCurrentUser();
    const entities = user.entities;

    let result = [];
    if (entities && entities.length) {
      let foundEntity;
      for (const entity of entities) {
        if (entity && entity.type && entity.type.name === 'Chief Group Academic') {
          foundEntity = entity;

        }
      }

      if (foundEntity && foundEntity.group_of_schools && foundEntity.group_of_schools.length) {
        foundEntity.group_of_schools.forEach((school) => {
          if (school && school._id) {
            result.push(school._id);
          }
        });
      }
      if (foundEntity.group_of_school) {
        if (foundEntity.group_of_school.headquarter) {
          result.push(foundEntity.group_of_school.headquarter._id);
        }
        if (foundEntity.group_of_school.school_members && foundEntity.group_of_school.school_members.length) {
          foundEntity.group_of_school.school_members.forEach((school) => {
            result.push(school._id);
          });
        }
      }
    }

    return result;
  }

  getAllSchoolFromCRUser() {
    const user = this.getCurrentUser();
    const entities = user.entities;

    const result = [];
    if (entities && entities.length) {
      let foundEntity;
      foundEntity = entities.filter((ent) => ent.type.name === 'CR School Director');
      if (foundEntity && foundEntity.length) {
        foundEntity.forEach((en) => {
          if (en.school && en.school._id) {
            result.push(en.school._id);
          }
        });

        return result;
        // } else {

        //   return result;
      }
    }
  }

  getAllTitleFromCRUser() {
    const user = this.getCurrentUser();
    const entities = user.entities;

    const result = [];
    if (entities && entities.length) {
      let foundEntity;
      foundEntity = entities.filter((ent) => ent.type.name === 'CR School Director');
      if (foundEntity && foundEntity.length) {
        foundEntity.forEach((en) => {
          if (en.school && en.assigned_rncp_title.short_name) {
            result.push(en.assigned_rncp_title.short_name);
          }
        });

        return result;
      }
    }
  }

  getAllTitleIdFromCRUser() {
    const user = this.getCurrentUser();
    const entities = user.entities;

    const result = [];
    if (entities && entities.length) {
      let foundEntity;
      foundEntity = entities.filter((ent) => {
        if (this.permissionService.getPermission('CR School Director')) {
          return ent.type.name === 'CR School Director';
        } else if (this.permissionService.getPermission('Certifier Admin')) {
          return ent.type.name === 'Certifier Admin';
        }
      });
      if (foundEntity && foundEntity.length) {
        foundEntity.forEach((en) => {
          if (en.school && en.assigned_rncp_title._id) {
            result.push(en.assigned_rncp_title._id);
          }
        });

        return result;
      }
    }
  }

  simpleDiacriticSensitiveRegex(text: string): string {
    if (text) {
      return text
        .replace(/[a,á,à,ä,Å]/g, 'a')
        .replace(/[e,é,ë,è,ê,É]/g, 'e')
        .replace(/[i,í,ï,Î,î,ı]/g, 'i')
        .replace(/[o,ó,ö,ò,ô]/g, 'o')
        .replace(/[u,ü,ú,ù]/g, 'u')
        .replace(/[ç]/g, 'c')
        .replace(/[ ,-]/g, ' ')
        .replace(/[',’]/g, '’');
    } else {
      return '';
    }
  }

  disregardSpace(text: string): string {
    if (text) {
      return text.replace(/\s/g, '');
    } else {
      return '';
    }
  }

  simplifyRegex(text: string): string {
    if (text) {
      return this.simpleDiacriticSensitiveRegex(this.disregardSpace(text.trim().toLowerCase()));
    } else {
      return '';
    }
  }

  cleanHTML(text: string) {
    if (text) {
      let result = '';
      result = text.replace(/<[^>]*>/g, '').replace(/\&nbsp;/g, ' ');
      result = _.unescape(result);
      return result;
    } else {
      return '';
    }
  }

  isUrlFormat(text: string) {
    var pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
    '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
    '(\\?[;&a-z-\\d%_.,~+=-|#]*)?'+ // query string
    '(\\#[-a-z-\\d_,|#=.]*)?$','i'); // fragment locator

    return !!pattern.test(text);
  }

  countFileSize(file: File, maxSize: number) {

    if (file && file.size && maxSize) {
      const inMb = file.size / 1024 / 1024;
      return inMb < maxSize;
    } else if (maxSize === 0) {
      return true;
    } else {
      return false;
    }
  }

  getFileExtension(fileName: string) {
    if (fileName) {
      return fileName.split('.').pop();
    } else {
      return '';
    }
  }

  getFileTypeFromExtension(extension: string) {
    // doc and presentation
    const docper = ['doc', 'docx', 'ppt', 'pptx', 'txt', 'pdf', 'xlsx', 'xls'];
    const img = [
      'tiff',
      'pjp',
      'jfif',
      'gif',
      'svg',
      'bmp',
      'png',
      'jpeg',
      'svgz',
      'jpg',
      'webp',
      'ico',
      'xbm',
      'dib',
      'tif',
      'pjpeg',
      'avif',
    ];
    const vid = ['ogm', 'wmv', 'mpg', 'webm', 'ogv', 'mov', 'asx', 'mpeg', 'mp4', 'm4v', 'avi'];
    if (extension) {
      if (docper.includes(extension)) {
        return 'docper';
      } else if (img.includes(extension)) {
        return 'image';
      } else if (vid.includes(extension)) {
        return 'video';
      }
    }
  }

  getInitials(firstName: string, lastName: string) {
    const tempFirst = firstName ? firstName : '';
    const tempLast = lastName ? lastName : '';
    return tempFirst.charAt(0) + tempLast.charAt(0);
  }

  checkIfStringMongoDBID(stringInput: string) {
    const checkValidObjectId = new RegExp('^[0-9a-fA-F]{24}$');
    return stringInput.match(checkValidObjectId);
  }

  getIndustryList() {
    return this.industryList;
  }

  isUserLoginPCStaff() {
    const currentUser = this.getCurrentUser();
    if (currentUser) {
      const entities = currentUser.entities;
      let isPCStaff = false;
      if (entities && entities[0] && entities[0].entity_name === 'academic' && entities[0].school_type === 'preparation_center') {
        isPCStaff = true;
      }
      return isPCStaff;
    }
  }

  isUserLoginCRStaff() {
    const currentUser = this.getCurrentUser();
    if (currentUser) {
      const entities = currentUser.entities;
      let isCRStaff = false;
      if (entities && entities[0] && entities[0].entity_name === 'academic' && entities[0].school_type === 'certifier') {
        isCRStaff = true;
      }
      return isCRStaff;
    }
  }

  sortEntitiesByHierarchy(entities) {
    let sortedEntities = [];
    if (entities && entities[0] && entities[0].entity_name === 'academic') {
      if (entities[0].school_type === 'preparation_center') {
        if (_.find(entities, (entity) => entity.type.name === 'Academic Director')) {
          sortedEntities.push(_.find(entities, (entity) => entity.type.name === 'Academic Director'));
        }
        if (_.find(entities, (entity) => entity.type.name === 'PC School Director')) {
          sortedEntities.push(_.find(entities, (entity) => entity.type.name === 'PC School Director'));
        }
        if (_.find(entities, (entity) => entity.type.name === 'Academic Admin')) {
          sortedEntities.push(_.find(entities, (entity) => entity.type.name === 'Academic Admin'));
        }
        if (_.find(entities, (entity) => entity.type.name === 'Professional Jury Member')) {
          sortedEntities.push(_.find(entities, (entity) => entity.type.name === 'Professional Jury Member'));
        }
        if (_.find(entities, (entity) => entity.type.name === 'Academic Final Jury Member')) {
          sortedEntities.push(_.find(entities, (entity) => entity.type.name === 'Academic Final Jury Member'));
        }
        if (_.find(entities, (entity) => entity.type.name === 'Teacher')) {
          sortedEntities.push(_.find(entities, (entity) => entity.type.name === 'Teacher'));
        }
        if (_.find(entities, (entity) => entity.type.name === 'Corrector')) {
          sortedEntities.push(_.find(entities, (entity) => entity.type.name === 'Corrector'));
        }
        if (_.find(entities, (entity) => entity.type.name === 'Cross Corrector')) {
          sortedEntities.push(_.find(entities, (entity) => entity.type.name === 'Cross Corrector'));
        }
        sortedEntities = sortedEntities.concat(entities);
        sortedEntities = _.uniqBy(sortedEntities, 'type.name');
      } else {
        if (_.find(entities, (entity) => entity.type.name === 'CR School Director')) {
          sortedEntities.push(_.find(entities, (entity) => entity.type.name === 'CR School Director'));
        }
        if (_.find(entities, (entity) => entity.type.name === 'Certifier Admin')) {
          sortedEntities.push(_.find(entities, (entity) => entity.type.name === 'Certifier Admin'));
        }
        if (_.find(entities, (entity) => entity.type.name === 'Academic Admin')) {
          sortedEntities.push(_.find(entities, (entity) => entity.type.name === 'Academic Admin'));
        }
        if (_.find(entities, (entity) => entity.type.name === 'Corrector Certifier')) {
          sortedEntities.push(_.find(entities, (entity) => entity.type.name === 'Corrector Certifier'));
        }
        if (_.find(entities, (entity) => entity.type.name === 'Corrector Quality')) {
          sortedEntities.push(_.find(entities, (entity) => entity.type.name === 'Corrector Quality'));
        }
        if (_.find(entities, (entity) => entity.type.name === 'Corrector of Problematic')) {
          sortedEntities.push(_.find(entities, (entity) => entity.type.name === 'Corrector of Problematic'));
        }
        if (_.find(entities, (entity) => entity.type.name === 'Correcteur PFE Oral')) {
          sortedEntities.push(_.find(entities, (entity) => entity.type.name === 'Correcteur PFE Oral'));
        }
        if (_.find(entities, (entity) => entity.type.name === 'President of Jury')) {
          sortedEntities.push(_.find(entities, (entity) => entity.type.name === 'President of Jury'));
        }
        if (_.find(entities, (entity) => entity.type.name === 'Teacher Certifier')) {
          sortedEntities.push(_.find(entities, (entity) => entity.type.name === 'Teacher Certifier'));
        }
        sortedEntities = sortedEntities.concat(entities);
        sortedEntities = _.uniqBy(sortedEntities, 'type.name');
      }
    } else {
      sortedEntities = entities;
    }
    return sortedEntities;
  }

  decodeHTMLEntities(str) {
    if (str && typeof str === 'string') {
      // strip script/html tags
      str = str.replace(/<script[^>]*>([\S\s]*?)<\/script>/gim, '');
      str = str.replace(/<\/?\w(?:[^"'>]|"[^"]*"|'[^']*')*>/gim, '');
    }

    return str;
  }
}
