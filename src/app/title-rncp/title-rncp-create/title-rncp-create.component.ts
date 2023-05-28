import { Component, OnInit, ViewChild } from '@angular/core';
import { Observable } from 'rxjs';
import Swal from 'sweetalert2';
import * as _ from 'lodash';
import { CreateTitleIdentityComponent } from './create-title-identity/create-title-identity.component';
import { TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';

@Component({
  selector: 'ms-title-rncp-create',
  templateUrl: './title-rncp-create.component.html',
  styleUrls: ['./title-rncp-create.component.scss'],
})
export class TitleRncpCreateComponent implements OnInit {
  @ViewChild('titleIdentity', { static: false }) titleIdentity: CreateTitleIdentityComponent;
  constructor(private translate: TranslateService, private router: Router) {}

  ngOnInit() {}

  canDeactivate(): Observable<boolean> | Promise<boolean> | boolean {
    let validation = true;



    if (
      (!this.titleIdentity.titleIdentityForm.untouched || !this.titleIdentity.titleIdentityForm.get('add_school').untouched) &&
      !this.titleIdentity.saveSuccessfull
    ) {
      validation = false;
    }
    if (!validation) {
      return new Promise((resolve, reject) => {
        Swal.fire({
          type: 'warning',
          title: this.translate.instant('TMTC_S01.TITLE'),
          text: this.translate.instant('TMTC_S01.TEXT'),
          footer: `<span style="margin-left: auto">TMTC_S01</span>`,
          confirmButtonText: this.translate.instant('TMTC_S01.BUTTON_1'),
          showCancelButton: true,
          cancelButtonText: this.translate.instant('TMTC_S01.BUTTON_2'),
          allowEscapeKey: false,
          allowOutsideClick: false,
        }).then((result) => {
          if (result.value) {
            resolve(false);
          } else {
            resolve(true);
          }
        });
      });
    } else {
      return true;
    }
  }
}
