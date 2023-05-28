import { Component, Input, OnInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { ApplicationUrls } from 'app/shared/settings';

@Component({
  selector: 'ms-title-rncp-card',
  templateUrl: './title-rncp-card.component.html',
  styleUrls: ['./title-rncp-card.component.scss']
})
export class TitleRncpCardComponent implements OnInit {
  @Input() parentSource: string;
  @Input() filteredTitles: any[] = [];

  serverimgPath = `${ApplicationUrls.baseApi}/fileuploads/`.replace('/graphql', '');
  myInnerHeight = 600;
  constructor(
    private router: Router,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit() {
    this.filteredTitles = this.filteredTitles.sort((a, b) => {
      return a.short_name.toLowerCase().localeCompare(b.short_name.toLowerCase());
    });
  }

  /* On click title*/
  onClickRncpTitle(rncpId: string) {
    if (this.parentSource) {
      switch (this.parentSource) {
        case 'title_rncp_parameter':
          this.router.navigate([`/title-rncp/details/${rncpId}`]);
          break;
        case 'title_rncp_manager':
          this.router.navigate([`/title-manager/dashboard/${rncpId}`])
          break;
        default:
          break;
      }
    }
  }
  // *************** To Get Height window screen and put in style css height
  getAutomaticHeight() {
    this.myInnerHeight = window.innerHeight - 278;
    return this.myInnerHeight;
  }

  getFontSize(titleShortName: string) {
    return 26;
  }

  imgUrl(src: string) {
    return (src ? this.sanitizer.bypassSecurityTrustUrl(this.serverimgPath + src) : '');
  }

}
