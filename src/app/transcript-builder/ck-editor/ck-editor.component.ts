import { Component, OnInit, AfterViewInit } from '@angular/core';

import * as DecoupledEditor from 'assets/ckeditor5-custom/ckeditor.js'
import { TranscriptBuilderService } from 'app/service/transcript-builder/transcript-builder.service';
import { ChangeEvent } from '@ckeditor/ckeditor5-angular';

@Component({
  selector: 'ms-ck-editor',
  templateUrl: './ck-editor.component.html',
  styleUrls: ['./ck-editor.component.scss'],
})
export class CkEditorComponent implements OnInit, AfterViewInit {
  public Editor = DecoupledEditor;
  pages: any[];
  pageCounter = 0;
  transcriptData: any;
  expandJsonPanel = true;

  public config = {
    extraPlugins: 'colordialog',
  };

  constructor(private transcriptBuilderService: TranscriptBuilderService) {}

  ngOnInit() {
    this.pages = [];
    this.addPage();
    this.selectPage(this.pages[0]);
    this.transcriptBuilderService.getTranscriptData().subscribe(res => (this.transcriptData = res));
  }

  toggleJsonPanel() {
    this.expandJsonPanel = !this.expandJsonPanel;
  }

  ngAfterViewInit(): void {
    // setTimeout(() => {
    //   DecoupledEditor.create(document.querySelector('.document-editor__editable'))
    //     .then(editor => {
    //       const toolbarContainer = document.querySelector('.document-editor__toolbar');
    //       toolbarContainer.appendChild(editor.ui.view.toolbar.element);
    //       // window.editor = editor;
    //     })
    //     .catch(err => {
    //       console.error(err);
    //     });
    // }, 1000);
  }

  public onReady(editor) {
    setTimeout(() => {
      editor.ui.getEditableElement().parentElement.insertBefore(editor.ui.view.toolbar.element, editor.ui.getEditableElement());

      editor.plugins.forEach(element => {

      });
    }, 1);
  }

  public onChange({ editor }: ChangeEvent) {
    if (editor) {
      const data = editor.getData();


    }
  }

  submit() {

  }

  preView() {
    const wnd = window.open('about:blank', 'PRINT', '_blank');

    let data = this.pages[0].editorData;
    data = data.replace('${nom}', this.transcriptData.nom);

    wnd.document.write(data);
    wnd.print();
    wnd.close();
    return true;
  }

  addPage() {
    this.pageCounter++;
    this.pages.push({
      name: `Page ${this.pageCounter}`,
      selected: false,
      editorData: this.getSamplePageContent(),
    });
  }

  deletePage() {
    const selectedIndex = this.pages.findIndex(p => p.selected === true);
    if (selectedIndex > -1) {
      this.pages.splice(selectedIndex, 1);
      this.selectPage(this.pages[0]);
    }
  }

  selectPage(page) {
    this.pages.forEach(p => {
      if (p.name === page.name) {
        p.selected = true;
      } else {
        p.selected = false;
      }
    });
  }

  getSamplePageContent() {
    // tslint:disable-next-line: max-line-length
    return `<figure class="table"><table><tbody><tr><td>Nom :</td><td>&nbsp;</td></tr><tr><td>Prénom :</td><td>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;</td></tr><tr><td>Née le :</td><td>&nbsp;</td></tr><tr><td>Année :</td><td>&nbsp;</td></tr><tr><td>Centre de préparation :</td><td>&nbsp;</td></tr></tbody></table></figure><p><strong>CERTIFICATION PROFESSIONNELLE : DIRECTEUR DES RESSOURCES HUMAINES</strong></p><figure class="table"><table><tbody><tr><td colspan="3">EPREUVES</td><td>NOTES</td><td>COEF</td></tr><tr><td colspan="3">EPREUVES DE LA CERTIFICATION</td><td>&nbsp;</td><td>&nbsp;</td></tr><tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr><tr><td>UE1.A</td><td>Analyse des enjeux et des problématiques d'une organisation</td><td>&nbsp;</td><td>13</td><td>4</td></tr><tr><td>&nbsp;</td><td>Ecrit&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;</td><td>50%</td><td>14</td><td>&nbsp;</td></tr><tr><td>&nbsp;</td><td>Oral</td><td>50%</td><td>12</td><td>&nbsp;</td></tr></tbody></table></figure><figure class="table"><table><tbody><tr><td>COMPETENCES EVALUEES</td><td>MOYENNE ANNUELLE</td><td>UE VALIDEES</td><td>CREDITS ECTS</td></tr><tr><td>UE 1 - Auditer l'organisation d'une entreprise - Rechercher et développer des politiques RH</td><td>16</td><td>validée</td><td>40</td></tr><tr><td>UE 2 - Mettre en œuvre des Pratiques RH/RSE, des systèmes de management des RH et encadrer des équipes</td><td>0</td><td>&nbsp;</td><td>20</td></tr><tr><td>UE 3 - Piloter la qualité et optimiser les performances des systèmes de management RH</td><td>20</td><td>validée</td><td>15</td></tr><tr><td>UE 4 - Conduire le dialogue social et l'accompagnement du changement au sein d'organisation</td><td>4.5</td><td>validée</td><td>15</td></tr><tr><td>UE 5 - Définir les stratégies de politiques RH de l'entreprise</td><td>30.4</td><td>validée</td><td>30</td></tr></tbody></table></figure>`;
  }
}
