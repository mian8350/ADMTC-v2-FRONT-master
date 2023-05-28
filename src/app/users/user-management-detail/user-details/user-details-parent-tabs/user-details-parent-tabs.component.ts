import { MatTab, MatTabHeader, MatTabGroup } from '@angular/material/tabs';
import { UserService } from 'app/service/user/user.service';
import { TranslateService } from '@ngx-translate/core';
import { Component, Input, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import Swal from 'sweetalert2';

@Component({
  selector: 'ms-user-details-parent-tabs',
  templateUrl: './user-details-parent-tabs.component.html',
  styleUrls: ['./user-details-parent-tabs.component.scss']
})
export class UserDetailsParentTabsComponent implements OnInit, AfterViewInit {
  selectedIndex = 0;
  @Input() userId: string;
  @Input() status: string;
  @ViewChild('tab', { static: false }) tab: MatTabGroup;

  constructor(
    private translate: TranslateService,
    private userService: UserService
  ) { }

  ngOnInit() {
  }

  ngAfterViewInit(): void {
    this.tab._handleClick = this.checkIfAnyChildrenFormInvalid.bind(this);
  }


  checkIfAnyChildrenFormInvalid(tab: MatTab, tabHeader: MatTabHeader, idx: number) {
    if (!this.userService.childrenFormValidationStatus) {
      return this.fireUnsavedDataWarningSwal(tab, tabHeader, idx);
    }
    return true && MatTabGroup.prototype._handleClick.apply(this.tab, [tab, tabHeader, idx]);
  }

  fireUnsavedDataWarningSwal(tab: MatTab, tabHeader: MatTabHeader, idx: number) {
    Swal.fire({
      type: 'warning',
      title: this.translate.instant('TMTC_S01.TITLE'),
      text: this.translate.instant('TMTC_S01.TEXT'),
      confirmButtonText: this.translate.instant('TMTC_S01.BUTTON_1'),
      footer: `<span style="margin-left: auto">TMTC_S01</span>`,
      showCancelButton: true,
      cancelButtonText: this.translate.instant('TMTC_S01.BUTTON_2'),
      allowEscapeKey: false,
      allowOutsideClick: false,
    }).then((result) => {
      if (result.value) {
        return false;
      } else {
        this.userService.childrenFormValidationStatus = true;
        return true && MatTabGroup.prototype._handleClick.apply(this.tab, [tab, tabHeader, idx]);
      }
    });
  }
}
