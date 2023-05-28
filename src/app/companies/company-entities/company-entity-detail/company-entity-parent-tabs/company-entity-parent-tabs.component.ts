import { SchoolService } from './../../../../service/schools/school.service';
import { UserService } from './../../../../service/user/user.service';
import { Component, Input, OnInit } from '@angular/core';
import { AuthService } from 'app/service/auth-service/auth.service';

@Component({
  selector: 'ms-company-entity-parent-tabs',
  templateUrl: './company-entity-parent-tabs.component.html',
  styleUrls: ['./company-entity-parent-tabs.component.scss']
})
export class CompanyEntityParentTabsComponent implements OnInit {
  selectedIndex = 0;
  @Input() companyId;
  @Input() entityRC;
  userData= []
  isWaitingForResponse = false

  constructor(private schoolService: SchoolService, private authService: AuthService) { }

  ngOnInit() {
    this.getAllUsers()
  }
  
  getAllUsers() {
    this.userData = [];
    this.isWaitingForResponse = true
    this.schoolService.getAllUserNote().subscribe(
      (respAdmtc) => {
        this.isWaitingForResponse = false
        this.userData = respAdmtc;
      },
      (err) => {
        this.authService.postErrorLog(err);
        this.userData = [];
        this.isWaitingForResponse = false;
      },
    );
  }

}
