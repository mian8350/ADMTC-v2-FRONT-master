import { ImageBase64 } from './image-base64';
import * as moment from 'moment';

export class PdfCPEA {
  static RAB2020Id = '5d7a209c3690f75c78fa7869'; // id for title "RAB 2020"

  static getHeaderLogo(student) {
    if (student.rncp_title._id === this.RAB2020Id) {
      return ImageBase64.h3CampusLogo;
    }
    return ImageBase64.cpeaLogo;
  }

  static computerCPEAPDF(student: any, result, expertise) {
    const cpeaPdf = `
        <div class="main-container-rgp">
        <div class="upper-container" style="height: 100px !important;">
          <div class="con-65" style="width: 80% !important;">
          ${this.getUserInfo(student, result)}
          </div>
          <div class="con-35" style="width: 20% !important;">
            <img style="max-width:100px;" src="${this.getLogo(student)}">
          </div>
        </div>

        <div class="result-container" style="padding: 0px 7px !important;margin: 0 !important;">
          <div style="padding: 10px;border: 3px solid black;">
            ${this.compueteMatieresTable(result, expertise)}
          </div>
          <br />
          <div style="padding: 10px;border: 3px solid black;">
            ${this.compueteMoyenneTable(result.total_mark)}
            <br />
            ${this.compueteDecisionTable(result)}

            <div style="text-align: right;font-weight: 700;margin-top:10px">
               ***Non Applicable
            </div>

          </div>
          ${this.getFooter(student)}
        </div>
      </div>
      `;
    return cpeaPdf;
  }

  static getUserInfo(student, result) {
    return `
    <p class="stud-detail-para"><span style="width:160px;display: inline-block;">Nom :</span><b>${student.last_name}
      </b></p>
    <p class="stud-detail-para"><span style="width:160px;display: inline-block;">Prénom
    :</span><b>${student.first_name} </b></p>
    <p class="stud-detail-para"><span style="width:160px;display: inline-block;">Née le
    :</span><b>${moment(this.transformMinusOne(result.student_id.date_of_birth)).format('DD-MM-YYYY')}</b></p>
    <p class="stud-detail-para"><span style="width:160px;display: inline-block;vertical-align: top;">Section : </span>
      <span style="display: inline-block;">
        <b>Certification Professionnelle</b> <br>
        <b>Responsable Administratif bilingue - Office Manager</b>
      </span>
    </p>
    <p class="stud-detail-para"><span style="width:160px;display: inline-block;">Année
        :</span><b>2020 - 2021</b></p>`;
  }

  static compueteMatieresTable(result, expertise) {
    let table = null;

    if (result && result.block_of_competence_conditions) {
      table = `
      <table cellspacing="0" style="width:100%;font-size:11px;">
            <thead>
              <tr>
                <th style="width: 34%;float: unset" class="header-card">
                  MATIERES
                </th>
                <th style="width: 1%;border: 0"></th>
                <th style="width: 7%;float: unset" class="header-card">
                  Coef
                </th>
                <th style="width: 1%;border: 0"></th>
                <th style="width: 11%;float: unset" class="header-card">
                  Contrôle Continu
                </th>
                <th style="width: 1%;border: 0"></th>
                <th style="width: 11%;float: unset" class="header-card">
                  Partiel
                </th>
                <th style="width: 1%;border: 0"></th>
                <th style="width: 11%;float: unset" class="header-card">
                  Examen Final
                </th>
                <th style="width: 1%;border: 0"></th>
                <th style="width: 11%;float: unset" class="header-card">
                  Moyenne
                </th>
                <th style="width: 1%;border: 0"></th>
                <th style="width: 9%;float: unset" class="header-card">
                  Validation
                </th>
              </tr>
              <tr style="height: 30px">
                <th ></th>
                <th ></th>
                <th ></th>
                <th ></th>
                <th ></th>
                <th ></th>
                <th ></th>
                <th ></th>
                <th ></th>
                <th ></th>
                <th ></th>
                <th ></th>
                <th style="border-right: 0 !important;"></th>
              </tr>
            </thead>
            <tbody>`;

      let expertiseBlock = null;

      let tableBody = '';
      let subjectBlock = null;
      let subjectRow = '';
      result.block_of_competence_conditions.forEach((block, index) => {
        // WIll count total coef per subject
        let blockCoefficient = 0;

        expertiseBlock = expertise.block_of_competence_conditions.find((exp) => block.block_id._id === exp.block_id._id);
        if (
          // handle special blocks
          block.id === '5b7ebac9be5f73719e3d0a83' ||
          block.id === '5d7a21293690f75c78fa7899' // block id for OUTILS BUREAUTIQUES
        ) {
          tableBody =
            tableBody +
            `<tr class="border-botttom right-border">
              <td style="font-weight: 700">${expertiseBlock.block_id.block_of_competence_condition}</td>
              <td></td>
              <td style="text-align: center">#{expertiseCredits}#</td>
              <td></td>
              <td style="text-align: right;font-weight: 700">10%</td>
              <td></td>
              <td style="text-align: right;font-weight: 700">0%</td>
              <td></td>
              <td style="text-align: right;font-weight: 700">90%</td>
              <td></td>
              <td style="text-align: left;font-weight: 700;text-align: center"></td>
              <td></td>
              <td style="text-align: center;font-weight: 700;border-right: 0 !important;">***</td>
            </tr>
          `;
        } else {
          tableBody =
            tableBody +
            `<tr class="border-botttom right-border">
              <td style="font-weight: 700">${expertiseBlock.block_id.block_of_competence_condition}</td>
              <td></td>
              <td style="text-align: center">#{expertiseCredits}#</td>
              <td></td>
              <td style="text-align: right;font-weight: 700">10%</td>
              <td></td>
              <td style="text-align: right;font-weight: 700">20%</td>
              <td></td>
              <td style="text-align: right;font-weight: 700">70%</td>
              <td></td>
              ${
                index < 2
                  ? `<td style="text-align: left;font-weight: 700;text-align: center">
                    ${block.totalExpertiseScore !== undefined ? block.totalExpertiseScore : 0}
                  </td>`
                  : `<td style="text-align: left;font-weight: 700;text-align: center"></td>`
              }
              <td></td>
              ${
                index < 2
                  ? `<td style="text-align: center;font-weight: 700;border-right: 0 !important;">
                    ${block.totalExpertiseScore >= 10 ? 'Validé' : 'Non Validé'}
                  </td>`
                  : `<td style="text-align: center;font-weight: 700;border-right: 0 !important;">***</td>`
              }
            </tr>
          `;
        }

        expertiseBlock.subject.forEach((subjectLoop) => {
          blockCoefficient += subjectLoop.coefficient !== undefined ? subjectLoop.coefficient : 0;
          subjectRow = '';

          subjectBlock = result.subjects.find((sub) => sub.name.toLocaleLowerCase() === subjectLoop.subjectName.toLocaleLowerCase());

          if (
            // handle special blocks
            block.id === '5b7ebac9be5f73719e3d0a83' ||
            block.id === '5d7a21293690f75c78fa7899' // block id for OUTILS BUREAUTIQUES
          ) {
            subjectRow =
              subjectRow +
              `<tr class="right-border" style="height: 10px;">
                        <td style="padding-left: 15px;">${subjectBlock.name}</td>
                        <td ></td>
                        <td ></td>
                        <td ></td>
                        <td style="text-align: left">
                        ${(subjectBlock.tests[0] || { total: 0.0 }).total}
                        </td>
                        <td ></td>
                        <td style="text-align: left"></td>
                        <td ></td>
                        <td style="text-align: left">
                        ${(subjectBlock.tests[1] || { total: 0.0 }).total}
                        </td>
                        <td ></td>
                        <td style="font-weight: 700;text-align: center">${subjectBlock.total !== undefined ? subjectBlock.total : 0}</td>
                        <td ></td>
                        <td style="border-right: 0 !important;"></td>
                      </tr>`;
          } else {
            if (subjectBlock.name === 'Gestion de projet Ecrit + Oral') {
              const totalExam = (
                ((subjectBlock.tests[2] || { total: 0.0 }).total + (subjectBlock.tests[3] || { total: 0.0 }).total) /
                2
              ).toFixed(2);
              subjectRow =
                subjectRow +
                `<tr class="right-border" style="height: 10px;">
                        <td style="padding-left: 15px;">${subjectBlock.name}</td>
                        <td ></td>
                        <td ></td>
                        <td ></td>
                        <td style="text-align: left">
                        ${(subjectBlock.tests[0] || { total: 0.0 }).total}
                        </td>
                        <td ></td>
                        <td style="text-align: left">
                        ${(subjectBlock.tests[1] || { total: 0.0 }).total}
                        </td>
                        <td ></td>
                        <td style="text-align: left">
                        ${totalExam}
                        </td>
                        <td ></td>
                        <td style="font-weight: 700;text-align: center">${subjectBlock.total !== undefined ? subjectBlock.total : 0}</td>
                        <td ></td>
                        <td style="border-right: 0 !important;"></td>
                      </tr>`;
            } else {
              subjectRow =
                subjectRow +
                `<tr class="right-border" style="height: 10px;">
                        <td style="padding-left: 15px;">${subjectBlock.name}</td>
                        <td ></td>
                        <td ></td>
                        <td ></td>
                        <td style="text-align: left">
                        ${(subjectBlock.tests[0] || { total: 0.0 }).total}
                        </td>
                        <td ></td>
                        <td style="text-align: left">
                        ${(subjectBlock.tests[1] || { total: 0.0 }).total}
                        </td>
                        <td ></td>
                        <td style="text-align: left">
                        ${(subjectBlock.tests[2] || { total: 0.0 }).total}
                        </td>
                        <td ></td>
                        <td style="font-weight: 700;text-align: center">${subjectBlock.total !== undefined ? subjectBlock.total : 0}</td>
                        <td ></td>
                        <td style="border-right: 0 !important;"></td>
                      </tr>`;
            }
          }

          tableBody = tableBody + subjectRow;
        });

        tableBody = tableBody.replace('#{expertiseCredits}#', `${blockCoefficient}`);

        tableBody =
          tableBody +
          ` <tr class="right-border" style="height: 20px">
                      <td ></td>
                      <td ></td>
                      <td ></td>
                      <td ></td>
                      <td ></td>
                      <td ></td>
                      <td ></td>
                      <td ></td>
                      <td ></td>
                      <td ></td>
                      <td ></td>
                      <td ></td>
                      <td style="border-right: 0 !important;"></td>
                    </tr>`;
      });

      table =
        table +
        tableBody +
        `</tbody>
              </table>
          `;
    }

    return table;
  }

  static compueteMarksTable(result, expertise) {
    let table = null;

    if (result && result.blocks) {
      table = `
    <table cellspacing="0" style="width:100%;font-size:11px;">
        <thead>
          <tr >
            <th style="width: 55%;float: unset;background-color: unset !important;" class="header-card">
            </th>
            <th style="width: 1%;border: 0"></th>
            <th style="width: 14%;float: unset" class="header-card">
              Coef
            </th>
            <th style="width: 1%;border: 0"></th>
            <th style="width: 14%;float: unset" class="header-card">
              Moyenne Ponderée
            </th>
            <th style="width: 1%;border: 0"></th>
            <th style="width: 14%;float: unset" class="header-card">
              Validation
            </th>
          </tr>
        </thead>
        <tbody>`;

      let expertiseBlock = null;
      let tableBody = '';

      result.blocks.forEach((block) => {
        expertiseBlock = expertise.expertiseList.find((exp) => block.id === exp._id);

        tableBody =
          tableBody +
          ` <tr  style="height: 30px;">
                    <td style="font-weight: 700">${expertiseBlock.blockOfExperise}</td>
                    <td ></td>
                    <td style="text-align: center">${block.coefficient}</td>
                    <td ></td>
                    <td style="text-align: center">${block.totalScore}/20</td>
                    <td ></td>
                    <td style="text-align: center">${block.totalScore < block.minScore ? 'Non' : ''} Validé</td>
                  </tr>`;
      });

      table =
        table +
        tableBody +
        `</tbody>
              </table>
          `;
    }

    return table;
  }

  static compueteMoyenneTable(finalScore) {
    const table = `<table cellspacing="0" style="width:100%;font-size:11px;">
    <thead>
      <tr>
        <th style="width: 70%;float: unset;text-align: left;padding-left:10px;" class="header-card">
          MOYENNE GENERALE
        </th>
        <th style="width: 30%;float: unset;text-align: left" ; class="header-card">
        ${finalScore}/20
        </th>
      </tr>
    </thead>
  </table>`;

    return table;
  }

  static compueteDecisionTable(result) {
    const table = `<table cellspacing="0" style="width:100%;font-size:11px;">
    <thead>
      <tr>
        <th style="width: 70%;float: unset;text-align: left;padding-left:10px;" class="header-card">
          DECISION DU JURY DE SCOLARITE
        </th>
        <th style="width: 30%;float: unset;text-align: left" ; class="header-card">
          ${result && result.toLocaleLowerCase() === 'pass' ? 'ADMIS' : 'REFUSÉ'}
        </th>
      </tr>
    </thead>
  </table>`;

    return table;
  }

  static GetStamp(student) {
    if (student.rncp_title._id === this.RAB2020Id) {
      return ImageBase64.h3CampusStamp;
    }
    return ImageBase64.cpeaStamp;
  }

  static getSchoolName(student) {
    if (student.rncp_title._id === this.RAB2020Id) {
      return 'H3 Campus';
    }
    return 'CPEA';
  }

  static getFooter(student) {
    return `
  <div style="display: block; text-align: center; margin-top: 70px">
    <img style="max-height: 50px" src="${this.GetStamp(student)}">
  </div>
  <div style="width: 90%; font-size: 10px; margin: 5px auto 30px; text-align: center; position: fixed; bottom: 0">
    <div style="font-size:9px; display:block">
      <b>Certification Professionnelle : Responsable Administratif(ve) bilingue - Office Manager</b>
    </div>
    <div style="font-size:9px; display:block">
        certifications professionnelles au niveau II (Fr) - 6 (Eu), sous l’intitulé « Responsable Administratif(ve)
    </div>
    <div style="font-size:9px; display:block">
        bilingue - Office Manager » avec effet au 21/04/2017 jusqu’au 21/04/2022 - Code NFS 310
    </div>
    <div style="font-size:11px; display:block">
        ${this.getSchoolName(student)} - 35 rue de Clichy - 75009 PARIS
    </div>
  </div>`;
  }
  static transformMinusOne(date: any): any {
    const originalDate = String(date);

    if (originalDate.length === 8) {
      // convert from yyyymmdd to date format accepted by mat datepicker
      const year: number = +originalDate.substring(0, 4);
      const month: number = +originalDate.substring(4, 6);
      const day: number = +originalDate.substring(6, 8);
      return new Date(year, month, day);
    } else if (originalDate.includes('/')) {
      // convert from mm/dd/yyyy to date format accepted by mat datepicker
      const dateStringArray = originalDate.split('/');
      const year = +dateStringArray[2];
      const month = +dateStringArray[0] - 1;
      const day = +dateStringArray[1];
      return new Date(year, month, day);
    } else {
      return date;
    }
  }

  static getLogo(studentData) {
    const c3InstituteID = '596c7111bbd70454dc9c287d';
    const cesacomID = '5b3e06e727a41d7a83376066';
    const eimpID = '5aaa688b6a853f0fddecc061';
    const h3CampusID = '5b791476d9dfe135d5461144';
    const hitemaID = '598289e7528f24319d46251c';
    const imcpID = '5b3b7be2e9a880184ecc5c72';
    const initiativeID = '5b69eeba81935943d24d26e8';
    const instaID = '5b3cdb6476a39548534c757a';
    const iscgID = '59828bab528f24319d462520';
    const manitudeID = '5da9895b25a0ba09f97b596e';
    const modspeID = '5bec684507f85336b6d61417';
    const sogesteEssccotID = '5c503955eb9f9272f18c64be';
    const zettabyteID = '601e5fe97d0ceb4c01c9a181';
    if (
      studentData &&
      studentData.rncp_title &&
      studentData.rncp_title.certifier &&
      studentData.rncp_title.certifier._id === sogesteEssccotID
    ) {

      // return ImageBase64.rgpLogo;
      return ImageBase64.sogesteLogo;
    } else if (
      studentData &&
      studentData.rncp_title &&
      studentData.rncp_title.certifier &&
      studentData.rncp_title.certifier._id === c3InstituteID
    ) {
      return ImageBase64.c3InstituteLogo;
    } else if (
      studentData &&
      studentData.rncp_title &&
      studentData.rncp_title.certifier &&
      studentData.rncp_title.certifier._id === cesacomID
    ) {
      return ImageBase64.cesacomLogo;
    } else if (
      studentData &&
      studentData.rncp_title &&
      studentData.rncp_title.certifier &&
      studentData.rncp_title.certifier._id === eimpID
    ) {
      return ImageBase64.eimpLogo;
    } else if (
      studentData &&
      studentData.rncp_title &&
      studentData.rncp_title.certifier &&
      studentData.rncp_title.certifier._id === h3CampusID
    ) {
      return ImageBase64.h3CampusLogo;
    } else if (
      studentData &&
      studentData.rncp_title &&
      studentData.rncp_title.certifier &&
      studentData.rncp_title.certifier._id === hitemaID
    ) {
      return ImageBase64.h3hitemaLogo;
    } else if (
      studentData &&
      studentData.rncp_title &&
      studentData.rncp_title.certifier &&
      studentData.rncp_title.certifier._id === imcpID
    ) {
      return ImageBase64.imcpLogoNew;
    } else if (
      studentData &&
      studentData.rncp_title &&
      studentData.rncp_title.certifier &&
      studentData.rncp_title.certifier._id === initiativeID
    ) {
      return ImageBase64.initiativesLogo;
    } else if (
      studentData &&
      studentData.rncp_title &&
      studentData.rncp_title.certifier &&
      studentData.rncp_title.certifier._id === instaID
    ) {
      return ImageBase64.instaLogo;
    } else if (
      studentData &&
      studentData.rncp_title &&
      studentData.rncp_title.certifier &&
      studentData.rncp_title.certifier._id === iscgID
    ) {
      return ImageBase64.iscgLogo;
    } else if (
      studentData &&
      studentData.rncp_title &&
      studentData.rncp_title.certifier &&
      studentData.rncp_title.certifier._id === manitudeID
    ) {
      return ImageBase64.manitudeLogo;
    } else if (
      studentData &&
      studentData.rncp_title &&
      studentData.rncp_title.certifier &&
      studentData.rncp_title.certifier._id === modspeID
    ) {
      return ImageBase64.modspeLogo;
    } else if (
      studentData &&
      studentData.rncp_title &&
      studentData.rncp_title.certifier &&
      studentData.rncp_title.certifier._id === zettabyteID
    ) {
      return ImageBase64.zettabyteLogo;
    } else {
      return ImageBase64.whiteBg;
    }
    // return ImageBase64.rgpLogo;

    // if (studentData && studentData.rncp_title && studentData.rncp_title.certifier && studentData.rncp_title.certifier.logo) {
    //   // ************** Certifier Logo is here, but only link
    //   const url = `${environment.apiUrl}/fileuploads/${studentData.rncp_title.certifier.logo}`.replace('/graphql', '');
    //   return url;
    // } else {
    //   return ImageBase64.rgpLogo;
    // }
  }
}
