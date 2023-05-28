import { Component, OnInit } from '@angular/core';
import { MatCard } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatPaginator } from '@angular/material/paginator';
import { Questionnaire } from '../questionaire.model';
import { QuetionaireService } from '../quetionaire.service';
import * as _ from 'lodash';
import { QuestionnaireSimulationDialogComponent } from '../questionnaire-simulation-dialog/questionnaire-simulation-dialog.component';
import { Router } from '@angular/router';
@Component({
  selector: 'ms-questionnaire-document',
  templateUrl: './questionnaire-document.component.html',
  styleUrls: ['./questionnaire-document.component.scss']
})
export class QuestionnaireDocumentComponent implements OnInit {
  // visiblePage = 1;
  // pages: number;

  visiblePage = 1;
  pages: number;
  questionnaire = new Questionnaire;
  pageSectionsArray: any[] = [];

  constructor(private questService: QuetionaireService, public dialog: MatDialog, private router: Router) { }

  ngOnInit() {
    this.questService.getQuestionnaire().subscribe(resp => {
      this.questionnaire = resp;
      if (resp) {
        this.renderData();
      }
    })
    // })
  }

  getArrayExceptFirst() {
    return this.pageSectionsArray.slice(1);
  }

  showPreviousPage() {
    if (this.visiblePage > 1) {
      this.visiblePage = this.visiblePage - 1;
    }
  }

  showNextPage() {
    if (this.visiblePage < this.pages) {
      this.visiblePage = this.visiblePage + 1;
    }
  }

  renderData() {
    const competences = [...this.questionnaire.competence];
    this.pageSectionsArray = [];

    const firstSegmentWithPageBreak = _.findIndex(competences, {'page_break': true});
    if (firstSegmentWithPageBreak === -1) {
      this.pageSectionsArray[0] = competences;
    } else {
      this.divideCompetencesByPageBreak(competences);
    }
    this.pages = this.pageSectionsArray.length;
  }

  divideCompetencesByPageBreak(competences, index = 0) {
      const firstCompetenceWithPageBreak = _.findIndex(competences, {'page_break': true});
      if (firstCompetenceWithPageBreak === -1) {
        this.pageSectionsArray.push(competences);
      } else {
        this.pageSectionsArray.push([]);
        for (let j = 0; j <= firstCompetenceWithPageBreak; j++) {
          this.pageSectionsArray[index].push(competences[j]);
        }
        competences.splice(0, firstCompetenceWithPageBreak + 1);
        index += 1;
        this.divideCompetencesByPageBreak(competences, index);
        this.pages = this.pageSectionsArray.length;
      }
  }

  showBottomGrid(index) {
    return (this.pages === index);
  }

  openPreview() {

    this.router.navigate([])
    .then(result => { 
      window.open(`/questionnaire-tools/simulation/${this.questionnaire._id}`, '_blank'); 
    });
    // const dialogRef = this.dialog.open(QuestionnaireSimulationDialogComponent, {
    //   panelClass: 'questionnaire-simulation-pop-up',
    //   disableClose: true
    // });
    // dialogRef.afterClosed().subscribe((result) => {

    // });
  }


  // showPreviousPage() {
  //   if (this.visiblePage > 1) {
  //     this.visiblePage = this.visiblePage - 1;
  //   }
  // }

  // showNextPage() {
  //   if (this.visiblePage < this.pages) {
  //     this.visiblePage = this.visiblePage + 1;
  //   }
  // }
}
