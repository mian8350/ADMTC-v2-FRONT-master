import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import { SubSink } from 'subsink';
import * as _ from 'lodash';
import Swal from 'sweetalert2';
import { PageTitleService } from 'app/core/page-title/page-title.service';
import { TranslateService } from '@ngx-translate/core';
@Component({
  selector: 'ms-title-manager-follow-up-company',
  templateUrl: './title-manager-follow-up-company.component.html',
  styleUrls: ['./title-manager-follow-up-company.component.scss'],
})
export class TitleManagerFollowUpCompanyComponent implements OnInit, OnDestroy {
  allCompanyProcess: any;
  private subs = new SubSink();
  titleId: any;
  classId: any;
  isWaitingForResponse: boolean = false;
  companyProcessData: any;
  dataMapping: any;

  constructor(
    private route: ActivatedRoute,
    private rncpTitleService: RNCPTitlesService,
    private translate: TranslateService,
    private router: Router,
    private pageTitleService: PageTitleService,
  ) {}

  ngOnInit() {
    this.titleId = this.route.snapshot.params['titleId'];
    this.classId = this.route.snapshot.params['classId'];


    this.getCompanyProcess();
    this.getOneTitleById();
  }

  getCompanyProcess() {
    this.isWaitingForResponse = true;
    this.subs.sink = this.rncpTitleService.getCompanayProcess(this.titleId, this.classId).subscribe(
      (resp) => {
        this.isWaitingForResponse = false;
        if (resp) {

          const companyProcess = _.cloneDeep(resp);
          this.companyProcessData = companyProcess;

          for (let i = 0; i < this.companyProcessData.length; i++) {
            const countData =
              (this.companyProcessData[i].student_with_active_contract_count / this.companyProcessData[i].total_student) * 100;
            this.companyProcessData[i].percentage = Number.isNaN(countData) ? 0 : countData;
          }

        }
        this.getDataMapping();
      },
      (err) => {
        this.isWaitingForResponse = false;

        Swal.fire({
          type: 'error',
          title: 'Error',
          text: err && err['message'] ? err['message'] : err,
          confirmButtonText: 'OK',
        });
      },
    );
  }

  getDataMapping() {
    this.dataMapping = [];
    this.allCompanyProcess = {
      student_with_active_contract_count: 0,
      total_student: 0,
      percentage: 0,
      job_description_done_count: 0,
      problematic_done_count: 0,
      mentor_evaluation_done_count: 0,
      pro_evaluation_done_count: 0,
      soft_skill_pro_evaluation_done_count: 0,
    };

    this.companyProcessData.forEach((list, i) => {
      const data = {
        student_with_active_contract_count: parseInt(list.student_with_active_contract_count),
        job_description_done_count: parseInt(list.job_description_done_count),
        problematic_done_count: parseInt(list.problematic_done_count),
        mentor_evaluation_done_count: parseInt(list.mentor_evaluation_done_count),
        pro_evaluation_done_count: parseInt(list.pro_evaluation_done_count),
        soft_skill_pro_evaluation_done_count: parseInt(list.soft_skill_pro_evaluation_done_count),
        total_student: parseInt(list.total_student),
      };
      if (data) {
        this.dataMapping.push(data);
      }
    });
    this.dataMapping.forEach((element) => {
      this.allCompanyProcess.student_with_active_contract_count += element.student_with_active_contract_count;
      this.allCompanyProcess.job_description_done_count += element.job_description_done_count;
      this.allCompanyProcess.problematic_done_count += element.problematic_done_count;
      this.allCompanyProcess.mentor_evaluation_done_count += element.mentor_evaluation_done_count;
      this.allCompanyProcess.pro_evaluation_done_count += element.pro_evaluation_done_count;
      this.allCompanyProcess.soft_skill_pro_evaluation_done_count += element.soft_skill_pro_evaluation_done_count;
      this.allCompanyProcess.total_student += element.total_student;
    });

    const percentage = ((this.allCompanyProcess.student_with_active_contract_count / this.allCompanyProcess.total_student) * 100).toFixed(
      2,
    );
    this.allCompanyProcess.percentage = parseFloat(percentage);

    this.isWaitingForResponse = false;
  }

  checkClassCard(total, selectData) {
    const countData = (selectData / total) * 100;
    const countedData = Number.isNaN(countData) ? 0 : countData;
    if (countedData === 100) {
      return 'done-100';
    } else if (countedData > 50) {
      return 'done-more-50';
    } else {
      return 'done-bellow-50';
    }
    // if (countedData <= 100 && countedData > 80) {
    //   return 'done-100';
    // } else if (countedData <= 80 && countedData > 50) {
    //   return 'done-more-50';
    // } else {
    //   return 'done-bellow-50';
    // }
  }

  getOneTitleById() {
    this.subs.sink = this.rncpTitleService.getOneTitleById(this.titleId).subscribe((resp) => {
      if (resp) {

        this.setPageTitle(resp);
      }
    });
  }

  setPageTitle(data) {
    if (data) {
      const title = data.short_name;
      this.pageTitleService.setTitle(this.translate.instant('Follow_Up.Company Process', { title_name: title }));
      this.subs.sink = this.translate.onLangChange.subscribe(() => {
        this.pageTitleService.setTitle(this.translate.instant('Follow_Up.Company Process', { title_name: title }));
      });
    }
  }

  goToStudentTableTitle() {
    // this.router.navigate(['students'], {
    //   queryParams: { title: this.titleId, class: this.classId}
    // });
    window.open(`/students?title=${this.titleId}&class=${this.classId}`, '_blank');
  }

  goToStudentTableSchool(schoolId) {
    // this.router.navigate(['students'], {
    //   queryParams: { school: schoolId, title: this.titleId, class: this.classId}
    // });
    window.open(`/students?school=${schoolId}&title=${this.titleId}&class=${this.classId}`, '_blank');
  }
  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
