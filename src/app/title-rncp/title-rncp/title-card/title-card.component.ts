import { Component, OnInit, Input } from '@angular/core';
import { Router } from '@angular/router';
import * as _ from 'lodash';
import { ApplicationUrls } from 'app/shared/settings';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'ms-title-card',
  templateUrl: './title-card.component.html',
  styleUrls: ['./title-card.component.scss']
})
export class TitleCardComponent implements OnInit {
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
    this.router.navigate([`/title-rncp/details/${rncpId}`]);
  }
  // *************** To Get Height window screen and put in style css height
  getAutomaticHeight() {
    this.myInnerHeight = window.innerHeight - 278;
    return this.myInnerHeight;
  }

  getFontSize(titleShortName: string) {
    return 26;
    // let fontSize = 24;
    // if (titleShortName.length >= 15) {
    //   fontSize = 22;
    // }
    // if (titleShortName.length >= 17) {
    //   fontSize = 20;
    // }
    // if (titleShortName.length >= 18) {
    //   fontSize = 18;
    // }
    // if (titleShortName.length >= 20) {
    //   fontSize = 15;
    // }
    // if (titleShortName.length >= 26) {
    //   fontSize = 13;
    // }
    // return fontSize;
  }

  imgUrl(src: string) {
    return (src ? this.sanitizer.bypassSecurityTrustUrl(this.serverimgPath + src) : '');
  }

}
