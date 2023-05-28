import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { SubSink } from 'subsink';
import * as _ from 'lodash';
import { ParseUtcToLocalPipe } from 'app/shared/pipes/parse-utc-to-local.pipe';
import { MatTabGroup } from '@angular/material/tabs';

@Component({
  selector: 'ms-class-title-gov-registration-tab',
  templateUrl: './class-title-gov-registration-tab.component.html',
  styleUrls: ['./class-title-gov-registration-tab.component.scss'],
  providers: [ParseUtcToLocalPipe],
})
export class ClassTitleGovRegistrationTabComponent implements OnInit, OnDestroy {
  private subs = new SubSink();
  @Input() selectedRncpTitleId: string;
  @Input() selectedClassId: string;  
  selectedIndex = 0;
  sortedData: any;

  constructor() {}

  ngOnInit() {
    
  }  

  IndexChange(val :number){
    this.selectedIndex = val;     
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
