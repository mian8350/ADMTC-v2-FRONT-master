import { ImageBase64 } from './image-base64';
import * as moment from 'moment';

export class PdfDefaultScore {
  static CPCD2020Id = '5d66629077ef432f084f4dc2'; // id for title "CPCD 2020"
  static isHaveEcts = false;

  static getPdfTitle(student) {
    if (student.rncp_title._id === this.CPCD2020Id) {
      return 'Certification Professionnelle - ' + student.rncp_title.long_name;
    }
    return 'Certification Professionnelle - ' + student.rncp_title.long_name;
  }

  static computePDF(student: any, result, expertise, journalText?, pdfData?, studentTranscript?) {
    const cpeaPdf = `
            <div class="main-container-rgp">
              <div class="upper-container" style="height: 100px !important;">
                <div class="con-65" style="width: 80% !important;">
                ${this.getUserInfo(student, result)}
                </div>
                <div class="retake-stamp" style="margin:0; position: absolute; left: 430px; margin-top: 0px;">
                  <img style="max-height: 100px; width: 100px;" src="${ImageBase64.retakeStamp}">
                </div>
                <div class="con-35" style="width: 20% !important;">
                  <img style="max-height:100px;" src="${this.getLogo(student)}">
                </div>
              </div>
              <div style="width:90%;  margin: 0 auto 10px; display:block; text-align:center;font-size: 12px;">
                <b>${this.getPdfTitle(student)}<b/>
              </div>

              <div class="result-container" style="padding: 0px 7px !important;margin: 0 !important;">
                <div style="padding: 10px;">
                  ${this.compueteTable(result, expertise, pdfData, studentTranscript)}
                </div>
                ${this.getFooter(student, journalText)}
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
        <p class="stud-detail-para"><span style="width:160px;display: inline-block;">Centre
        :</span><b>${student.school ? student.school.short_name : ''}</b></p>
    <p class="stud-detail-para"><span style="width:160px;display: inline-block;">Session
        :</span><b>2021</b></p>`;
  }

  static compueteTable(result, expertise, pdfData, studentTranscript?) {
    let table = null;
    const isThereEcts = pdfData.block_of_competence_conditions.filter((list) => list.block_id.block_of_competence_condition_credit);
    if (isThereEcts && isThereEcts.length) {
      const isPass = studentTranscript.block_competence_condition_details.filter(
        (blockStudent) => blockStudent.decision_school_board_id.condition_type === 'pass',
      );
      if (isPass && isPass.length) {
        this.isHaveEcts = true;
      } else {
        this.isHaveEcts = false;
      }
    } else {
      this.isHaveEcts = false;
    }

    if (result && result.block_of_competence_conditions && pdfData) {
      if (this.isHaveEcts) {
        table = `
      <table cellspacing="0" style="width:100%;font-size:11px;">
        <thead>
          <tr>
            <th style="width: 50%;float: unset; height: 25px !important;" class="header-card">
              EPREUVES
            </th>
            <th style="width: 12.5%;float: unset; height: 25px !important;" class="header-card">
              NOTES
            </th>
            <th style="width: 12.5%;float: unset; height: 25px !important;" class="header-card">
              POIDS EN %
            </th>
            <th style="width: 12.5%;float: unset; height: 25px !important;" class="header-card">
              COEFFICIENT
            </th>
            <th style="width: 12.5%;float: unset; height: 25px !important;" class="header-card">
              CREDITS ECTS
            </th>
          </tr>
        </thead>
        <tbody>
      `;
      } else {
        table = `
        <table cellspacing="0" style="width:100%;font-size:11px;">
          <thead>
            <tr>
              <th style="width: 50%;float: unset; height: 25px !important;" class="header-card">
                EPREUVES
              </th>
              <th style="width: 12.5%;float: unset; height: 25px !important;" class="header-card">
                NOTES
              </th>
              <th style="width: 12.5%;float: unset; height: 25px !important;" class="header-card">
                POIDS EN %
              </th>
              <th style="width: 12.5%;float: unset; height: 25px !important;" class="header-card">
                COEFFICIENT
              </th>
            </tr>
          </thead>
          <tbody>
        `;
      }

      let tableBody = '';
      let subjectRow = '';
      let testRow = '';
      let totalCredits = 0;
      let validate = true;

      pdfData.block_of_competence_conditions.forEach((block, blockIndex) => {
        if (this.isHaveEcts) {
          tableBody =
            tableBody +
            `<tr class="gray-background">
          <td colspan="4" style="font-weight: 700">${block.block_id.block_of_competence_condition}</td>
          <td style="text-align: center">#{expertiseCredits}#</td>
        </tr>`;
        } else {
          tableBody =
            tableBody +
            `<tr class="gray-background">
          <td colspan="4" style="font-weight: 700">${block.block_id.block_of_competence_condition}</td>
        </tr>`;
        }

        if (this.isHaveEcts) {
          block.subjects.forEach((subject, subjectIndex) => {
            subjectRow = `<tr>
            <td style="font-weight: 700;text-align: right">${subject.subject_id.subject_name}</td>
            <td ></td>
            <td ></td>
            <td style="font-weight: 700;text-align: center">${subject.coefficient}</td>
            <td ></td>
          </tr>`;

            testRow = '';
            subject.evaluations.forEach((test) => {
              testRow =
                testRow +
                `<tr>
              <td style="font-weight: 100;text-align: right">${test.evaluation_id.evaluation}</td>
              <td style="font-weight: 100;text-align: right">${test.mark}</td>
              <td style="text-align: center">${test.weight}%</td>
              <td style="font-weight: 100;text-align: right"></td>
              <td ></td>
            </tr>`;
            });
            subjectRow = subjectRow + testRow;

            let statusDecision = '';
            if (
              block &&
              block.block_id &&
              block.block_id._id &&
              studentTranscript &&
              studentTranscript.block_competence_condition_details &&
              studentTranscript.block_competence_condition_details[blockIndex] &&
              studentTranscript.block_competence_condition_details[blockIndex].block_id &&
              studentTranscript.block_competence_condition_details[blockIndex].block_id._id &&
              block.block_id._id === studentTranscript.block_competence_condition_details[blockIndex].block_id._id &&
              studentTranscript.block_competence_condition_details[blockIndex].decision_school_board_id &&
              studentTranscript.block_competence_condition_details[blockIndex].decision_school_board_id.condition_type
            ) {
              if (studentTranscript.block_competence_condition_details[blockIndex].decision_school_board_id.condition_type === 'pass') {
                statusDecision = 'Validé';
              } else if (
                studentTranscript.block_competence_condition_details[blockIndex].decision_school_board_id.condition_type === 'fail'
              ) {
                statusDecision = 'Non Validé';
              } else if (
                studentTranscript.block_competence_condition_details[blockIndex].decision_school_board_id.condition_type === 'retake'
              ) {
                statusDecision = 'Rattrapage';
              }
            }
            // show different UI for last subject
            if (block.subjects.length - 1 === subjectIndex) {
              subjectRow =
                subjectRow +
                `<tr>
                <td style="font-weight: 700;text-align: right">Moyenne Bloc ${blockIndex + 1}</td>
                <td class="gray-background" style="text-align: center">${block.total_mark.toFixed(2)}/20</td>
                <td ></td>
                <td ></td>
                <td style="text-align: right">
                ${statusDecision}
                </td>
              </tr>`;
              validate = validate && subject.total_mark >= block.block_id.min_score;
              if (
                block &&
                block.block_id &&
                block.block_id._id &&
                studentTranscript &&
                studentTranscript.block_competence_condition_details &&
                studentTranscript.block_competence_condition_details[blockIndex] &&
                studentTranscript.block_competence_condition_details[blockIndex].block_id &&
                studentTranscript.block_competence_condition_details[blockIndex].block_id._id &&
                block.block_id._id === studentTranscript.block_competence_condition_details[blockIndex].block_id._id &&
                studentTranscript.block_competence_condition_details[blockIndex].decision_school_board_id &&
                studentTranscript.block_competence_condition_details[blockIndex].decision_school_board_id &&
                studentTranscript.block_competence_condition_details[blockIndex].decision_school_board_id.condition_type === 'pass'
              ) {
                totalCredits = totalCredits + Number(block.block_id.block_of_competence_condition_credit);
              }
              tableBody = tableBody.replace(
                '#{expertiseCredits}#',
                block &&
                  block.block_id &&
                  block.block_id._id &&
                  studentTranscript &&
                  studentTranscript.block_competence_condition_details &&
                  studentTranscript.block_competence_condition_details[blockIndex] &&
                  studentTranscript.block_competence_condition_details[blockIndex].block_id &&
                  studentTranscript.block_competence_condition_details[blockIndex].block_id._id &&
                  block.block_id._id === studentTranscript.block_competence_condition_details[blockIndex].block_id._id &&
                  studentTranscript.block_competence_condition_details[blockIndex].decision_school_board_id &&
                  studentTranscript.block_competence_condition_details[blockIndex].decision_school_board_id &&
                  studentTranscript.block_competence_condition_details[blockIndex].decision_school_board_id.condition_type === 'pass'
                  ? block.block_id.block_of_competence_condition_credit
                  : '-',
                // block.total_mark >= block.block_id.min_score ? block.block_id.block_of_competence_condition_credit : '',
              );
            }

            subjectRow =
              subjectRow +
              `<tr style="height:10px">
              <td colspan="4"></tb>
            </tr>`;
            tableBody = tableBody + subjectRow;
          });
        } else {
          block.subjects.forEach((subject, subjectIndex) => {
            subjectRow = `<tr>
            <td style="font-weight: 700;text-align: right">${subject.subject_id.subject_name}</td>
            <td ></td>
            <td ></td>
            <td style="font-weight: 700;text-align: center">${subject.coefficient}</td>
          </tr>`;

            testRow = '';
            subject.evaluations.forEach((test) => {
              testRow =
                testRow +
                `<tr>
              <td style="font-weight: 100;text-align: right">${test.evaluation_id.evaluation}</td>
              <td style="font-weight: 100;text-align: right">${test.mark}</td>
              <td style="text-align: center">${test.weight}%</td>
              <td style="font-weight: 100;text-align: right"></td>
            </tr>`;
            });
            subjectRow = subjectRow + testRow;

            let statusDecision = '';
            if (
              block &&
              block.block_id &&
              block.block_id._id &&
              studentTranscript &&
              studentTranscript.block_competence_condition_details &&
              studentTranscript.block_competence_condition_details[blockIndex] &&
              studentTranscript.block_competence_condition_details[blockIndex].block_id &&
              studentTranscript.block_competence_condition_details[blockIndex].block_id._id &&
              block.block_id._id === studentTranscript.block_competence_condition_details[blockIndex].block_id._id &&
              studentTranscript.block_competence_condition_details[blockIndex].decision_school_board_id &&
              studentTranscript.block_competence_condition_details[blockIndex].decision_school_board_id.condition_type
            ) {
              if (studentTranscript.block_competence_condition_details[blockIndex].decision_school_board_id.condition_type === 'pass') {
                statusDecision = 'Validé';
              } else if (
                studentTranscript.block_competence_condition_details[blockIndex].decision_school_board_id.condition_type === 'fail'
              ) {
                statusDecision = 'Non Validé';
              } else if (
                studentTranscript.block_competence_condition_details[blockIndex].decision_school_board_id.condition_type === 'retake'
              ) {
                statusDecision = 'Rattrapage';
              }
            }
            // show different UI for last subject
            if (block.subjects.length - 1 === subjectIndex) {
              subjectRow =
                subjectRow +
                `<tr>
                <td style="font-weight: 700;text-align: right">Moyenne Bloc ${blockIndex + 1}</td>
                <td class="gray-background" style="text-align: center">${block.total_mark.toFixed(2)}/20</td>
                <td ></td>
                <td style="text-align: right">
                ${statusDecision}
                </td>
              </tr>`;
              validate = validate && subject.total_mark >= block.block_id.min_score;
              if (
                block &&
                block.block_id &&
                block.block_id._id &&
                studentTranscript &&
                studentTranscript.block_competence_condition_details &&
                studentTranscript.block_competence_condition_details[blockIndex] &&
                studentTranscript.block_competence_condition_details[blockIndex].block_id &&
                studentTranscript.block_competence_condition_details[blockIndex].block_id._id &&
                block.block_id._id === studentTranscript.block_competence_condition_details[blockIndex].block_id._id &&
                studentTranscript.block_competence_condition_details[blockIndex].decision_school_board_id &&
                studentTranscript.block_competence_condition_details[blockIndex].decision_school_board_id &&
                studentTranscript.block_competence_condition_details[blockIndex].decision_school_board_id.condition_type === 'pass'
              ) {
                totalCredits = totalCredits + Number(block.block_id.block_of_competence_condition_credit);
              }
            }

            subjectRow =
              subjectRow +
              `<tr style="height:10px">
              <td colspan="4"></tb>
            </tr>`;
            tableBody = tableBody + subjectRow;
          });
        }
      });

      if (this.isHaveEcts) {
        table =
          table +
          tableBody +
          `</tbody>
              <tfoot>
                <tr>
                    <td colspan="4" class="header-card" style="float: unset;border: 1px solid #17365d;height: 25px !important; margin-bottom: 0!important">
                        Décision :  ${
                          studentTranscript &&
                          studentTranscript.decision_school_board_id &&
                          studentTranscript.decision_school_board_id.condition_name
                            ? studentTranscript.decision_school_board_id.condition_name
                            : pdfData.parameter_obtained_id.condition_name
                        }
                    </td>
                    <td style="font-weight: 700;text-align: center;border: 1px solid black;">
                        ${totalCredits}
                    </td>
                </tr>
              </tfoot>
        </table>`;
      } else {
        table =
          table +
          tableBody +
          `</tbody>
              <tfoot>
                <tr>
                    <td colspan="4" class="header-card" style="float: unset;border: 1px solid #17365d;height: 25px !important; margin-bottom: 0!important">
                        Décision :  ${
                          studentTranscript &&
                          studentTranscript.decision_school_board_id &&
                          studentTranscript.decision_school_board_id.condition_name
                            ? studentTranscript.decision_school_board_id.condition_name
                            : pdfData.parameter_obtained_id.condition_name
                        }
                    </td>
                </tr>
              </tfoot>
        </table>`;
      }
    }

    return table;
  }

  static getFooterText(student, journalText) {
    return `
      <div style="font-size:8px; display:block">
        ${journalText}
      </div>
    `;
  }

  static getFooter(student, journalText) {
    if (this.getSignature(student) === 'whiteBg') {
      return `
        <div style="width: 90%; text-align: center; position: fixed; bottom: 0; margin-bottom: 10px">
          <div style="font-size:9px; display:block">
            <b>${this.getPdfTitle(student)}</b>
          </div>
          ${this.getFooterText(student, journalText)}
          <div style="font-size:11px; display:block">
          ${student && student.rncp_title && student.rncp_title.certifier ? student.rncp_title.certifier.short_name : ''} - ${
        student && student.rncp_title && student.rncp_title.certifier && student.rncp_title.certifier.school_address
          ? student.rncp_title.certifier.school_address.address1
          : ''
      } - ${
        student && student.rncp_title && student.rncp_title.certifier && student.rncp_title.certifier.school_address
          ? student.rncp_title.certifier.school_address.postal_code
          : ''
      } - ${
        student && student.rncp_title && student.rncp_title.certifier && student.rncp_title.certifier.school_address
          ? student.rncp_title.certifier.school_address.city
          : ''
      }
          </div>
        </div>
      `;
    } else {
      return `
    <div style="width: 90%; text-align: center; position: fixed; bottom: 0; margin-bottom: 10px">
      <div style="width: 75%;float: left; margin-left: 15px;">
        <div style="font-size:8px; display:block">
          <b>${this.getPdfTitle(student)}</b>
        </div>
          ${this.getFooterText(student, journalText)}
        <div style="font-size:11px; display:block">
         ${student && student.rncp_title && student.rncp_title.certifier ? student.rncp_title.certifier.short_name : ''} - ${
        student && student.rncp_title && student.rncp_title.certifier && student.rncp_title.certifier.school_address
          ? student.rncp_title.certifier.school_address.address1
          : ''
      } - ${
        student && student.rncp_title && student.rncp_title.certifier && student.rncp_title.certifier.school_address
          ? student.rncp_title.certifier.school_address.postal_code
          : ''
      } - ${
        student && student.rncp_title && student.rncp_title.certifier && student.rncp_title.certifier.school_address
          ? student.rncp_title.certifier.school_address.city
          : ''
      }
        </div>
      </div>
      <div style="margin:0;padding-right: 45px;width: 10%;position: absolute;right: 60px;">
        <img src="${this.getSignature(student)}" style="max-height:110px; min-width: 110px">
      </div>
    </div>
      `;
    }
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

  static getSignature(studentData) {
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
      return ImageBase64.sogesteStamp;
    } else if (
      studentData &&
      studentData.rncp_title &&
      studentData.rncp_title.certifier &&
      studentData.rncp_title.certifier._id === c3InstituteID
    ) {
      return ImageBase64.C32020Stamp;
    } else if (
      studentData &&
      studentData.rncp_title &&
      studentData.rncp_title.certifier &&
      studentData.rncp_title.certifier._id === cesacomID
    ) {
      return ImageBase64.cesacomStamp;
    } else if (
      studentData &&
      studentData.rncp_title &&
      studentData.rncp_title.certifier &&
      studentData.rncp_title.certifier._id === eimpID
    ) {
      return 'whiteBg';
      // return ImageBase64.cpebSign;
    } else if (
      studentData &&
      studentData.rncp_title &&
      studentData.rncp_title.certifier &&
      studentData.rncp_title.certifier._id === h3CampusID
    ) {
      return ImageBase64.h3CampusStamp;
      // } else if (
      //   studentData &&
      //   studentData.rncp_title &&
      //   studentData.rncp_title.certifier &&
      //   studentData.rncp_title.certifier._id === hitemaID
      // ) {
      //   return ImageBase64.h3hitemaLogo;
    } else if (
      studentData &&
      studentData.rncp_title &&
      studentData.rncp_title.certifier &&
      studentData.rncp_title.certifier._id === imcpID
    ) {
      return ImageBase64.imcpSign;
      // } else if (
      //   studentData &&
      //   studentData.rncp_title &&
      //   studentData.rncp_title.certifier &&
      //   studentData.rncp_title.certifier._id === initiativeID
      // ) {
      //   return ImageBase64.initiativesLogo;
      // } else if (
      //   studentData &&
      //   studentData.rncp_title &&
      //   studentData.rncp_title.certifier &&
      //   studentData.rncp_title.certifier._id === instaID
      // ) {
      //   return ImageBase64.instaLogo;
    } else if (
      studentData &&
      studentData.rncp_title &&
      studentData.rncp_title.certifier &&
      studentData.rncp_title.certifier._id === iscgID
    ) {
      return ImageBase64.iscgStamp;
    } else if (
      studentData &&
      studentData.rncp_title &&
      studentData.rncp_title.certifier &&
      studentData.rncp_title.certifier._id === manitudeID
    ) {
      return ImageBase64.manitudeStamp;
      // } else if (
      //   studentData &&
      //   studentData.rncp_title &&
      //   studentData.rncp_title.certifier &&
      //   studentData.rncp_title.certifier._id === modspeID
      // ) {
      //   return ImageBase64.modspeLogo;
      // } else if (
      //   studentData &&
      //   studentData.rncp_title &&
      //   studentData.rncp_title.certifier &&
      //   studentData.rncp_title.certifier._id === zettabyteID
      // ) {
      //   return ImageBase64.zettabyteLogo;
    } else {
      return 'whiteBg';
    }
  }
}
