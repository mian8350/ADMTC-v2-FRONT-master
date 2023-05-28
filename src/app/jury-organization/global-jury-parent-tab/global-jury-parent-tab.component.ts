import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatTabGroup } from '@angular/material/tabs';
import { ActivatedRoute } from '@angular/router';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { PageTitleService } from 'app/core/page-title/page-title.service';
import { SubSink } from 'subsink';

@Component({
  selector: 'ms-global-jury-parent-tab',
  templateUrl: './global-jury-parent-tab.component.html',
  styleUrls: ['./global-jury-parent-tab.component.scss'],
})
export class GlobalJuryParentTabComponent implements OnInit, OnDestroy {
  @ViewChild('settingMatGroup', { static: false }) settingMatGroup: MatTabGroup;
  isWaitingForResponse = false;

  private subs = new SubSink();
  selectedIndex: number;
  constructor(private translate: TranslateService, private pageTitleService: PageTitleService, private router: ActivatedRoute) {}

  ngOnInit() {
    this.pageTitleService.setTitle(this.translate.instant('NAV.List Jury Schedule'));
    this.subs.sink = this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      this.pageTitleService.setTitle(this.translate.instant('NAV.List Jury Schedule'));
    });

    const tab = this.router.snapshot.queryParamMap.get('open');

    if (tab) {
      this.moveToTab(tab);
    }
  }

  moveToTab(tab) {
    this.isWaitingForResponse = true;
    if (tab) {
      switch (tab) {
        case 'all-tab':
          setTimeout(() => {
            this.selectedIndex = 1;
            this.isWaitingForResponse = false;
          }, 1000);
          break;
        default:
          this.selectedIndex = 0;
          this.isWaitingForResponse = false;
      }
    }
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
    this.pageTitleService.setIcon('');
    this.pageTitleService.setTitle('');
  }
}
