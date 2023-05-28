import { Component, Input, OnChanges, OnDestroy, OnInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';
import { AcademicJourneyService } from 'app/service/academic-journey/academic-journey.service';
import { ApplicationUrls } from 'app/shared/settings';
import { SubSink } from 'subsink';
import * as _ from 'lodash';
import { environment } from 'environments/environment';
import { UtilityService } from 'app/service/utility/utility.service';

@Component({
  selector: 'ms-exemption-justification-diploma-view',
  templateUrl: './exemption-justification-diploma-view.component.html',
  styleUrls: ['./exemption-justification-diploma-view.component.scss']
})
export class ExemptionJustificationDiplomaViewComponent implements OnInit, OnChanges, OnDestroy {
  @Input() studentId = '';
  @Input() schoolId: string;

  private subs = new SubSink();

  pdfIcon = '../../../../../../assets/img/pdf.png';
  serverimgPath = `${ApplicationUrls.baseApi}/fileuploads/`.replace('/graphql', '');

  exemptionDocsData = [];

  isWaitingForResponse = false;

  constructor(
    private acadJourneyService: AcademicJourneyService,
    public translate: TranslateService,
    private sanitizer: DomSanitizer,
    private utilService: UtilityService
  ) { }

  ngOnInit() {
    this.getExemptionDocuments();
  }

  ngOnChanges() {
    this.getExemptionDocuments();
  }

  getExemptionDocuments() {
    this.isWaitingForResponse = true;
    this.subs.sink = this.acadJourneyService.getMyExemptionDocuments(this.studentId).subscribe((response) => {

      this.isWaitingForResponse = false;
      const temp = _.cloneDeep(response);
      if (temp) {
        this.exemptionDocsData = temp.exemption_block_justifications ? temp.exemption_block_justifications : [];
      } else {
        this.exemptionDocsData = [];
      }
    });
  }

  downloadFile(fileUrl: string) {

    const a = document.createElement('a');
    a.target = 'blank';
    a.href = `${environment.apiUrl}/fileuploads/${fileUrl}?download=true`.replace('/graphql', '');
    a.click();
    a.remove();
  }

  imgURL(src: string) {
    const isPDF =
      this.utilService.getFileExtension(src).toLocaleLowerCase() === 'pdf' ||
      this.utilService.getFileExtension(src).toLocaleLowerCase() === 'PDF';
    if (isPDF) {
      return this.pdfIcon;
    } else {
      return this.sanitizer.bypassSecurityTrustUrl(this.serverimgPath + src);
    }
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

}
