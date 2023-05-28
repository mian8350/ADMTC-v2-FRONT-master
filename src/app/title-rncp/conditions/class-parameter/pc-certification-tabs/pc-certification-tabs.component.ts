import { Component, Input, OnInit } from '@angular/core';
@Component({
  selector: 'ms-pc-certification-tabs',
  templateUrl: './pc-certification-tabs.component.html',
  styleUrls: ['./pc-certification-tabs.component.scss']
})
export class PcCertificationTabsComponent implements OnInit {

  @Input() rncpId: string;
  @Input() classId: string;

  constructor() { }

  ngOnInit(): void {

  }

}
