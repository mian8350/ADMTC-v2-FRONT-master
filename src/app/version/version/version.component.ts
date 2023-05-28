import { Component, OnInit } from '@angular/core';
import { VersionService } from '../version.service';

@Component({
  selector: 'ms-version',
  templateUrl: './version.component.html',
  styleUrls: ['./version.component.scss']
})
export class VersionComponent implements OnInit {

  frontendVersion: string;
  backendVersion: string;

  constructor(
    private versionService: VersionService
  ) { }

  ngOnInit() {
    const packages = require('../../../../package.json');
    this.frontendVersion = packages.version;

    this.versionService.getBackendVersion().subscribe(resp => this.backendVersion = resp);
  }

}
