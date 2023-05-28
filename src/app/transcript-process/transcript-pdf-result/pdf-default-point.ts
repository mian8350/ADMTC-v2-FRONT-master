import { ImageBase64 } from './image-base64';
import * as moment from 'moment';
import { L } from '@angular/cdk/keycodes';

export class PdfDefaultPoint {
  static isHaveEcts = false;
  static getPdfTitle(student) {
    if (student && student.rncp_title) {
      return student.rncp_title.long_name;
    }
    return '';
  }

  static computePDFPage1(student: any, result, expertise, journalText?, pdfData?, studentTranscript?) {
    const cpeaPdf = `
    <div style="display: block; text-align: center; margin-top: 10px; margin-left: 20px;">
      <img style="max-height: 70px" src="${this.getLogo(student)}">
    </div>
    <div class="retake-stamp" style="margin:0; position: absolute; right: 0px; margin-top: 0px;">
      <img style="max-height: 100px; width: 100px;" src="${ImageBase64.retakeStamp}">
    </div>
    <div class="main-container-rgp">
       <div style="display: block;">
          ${this.generateStudentData(student, result)}
          <div class="second-head-cpc">
            <div style="font-size: 14px;">BULLETIN RECAPITULATIF</div>
            <div style="font-size: 12px;"> ${this.getPdfTitle(student)}</div>
          </div>
          ${this.generateBlockTable(student, result, expertise, journalText, pdfData, studentTranscript)}
       </div>
    </div>
          `;
    return cpeaPdf;
  }

  static computePDFPage2(student: any, result, expertise, journalText?, pdfData?, studentTranscript?) {
    const cpeaPdf = `
    <div style="margin-top: 20px; page-break-after: always;"></div>
    <div style="display: block; text-align: center; margin-top: 10px; margin-left: 20px;">
      <img style="max-height: 70px" src="${this.getLogo(student)}">
    </div>
    <div class="retake-stamp" style="margin:0; position: absolute; right: 0px; margin-top: 0px;">
      <img style="max-height: 100px; width: 100px;" src="${ImageBase64.retakeStamp}">
    </div>
    <div class="main-container-rgp">
       <div style="display: block;">
          ${this.generateStudentData(student, result)}
          <div class="second-head-cpc">
             <div style="font-size: 14px;">FICHE D'EVALUATION DE LA CERTIFICATION PROFESSIONNELLE</div>
             <div style="font-size: 12px;"> ${this.getPdfTitle(student)}</div>
          </div>
          ${this.generateCompetenceTable(student, result, expertise, journalText, pdfData, studentTranscript)}
       </div>
    </div>
          `;
    return cpeaPdf;
  }

  static generateStudentData(student, result) {
    let body = '';
    body = `
    <table style="width: 100%">
      <tr class="tr-cpc">
        <td >Certificateur</td>
        <td style="text-align: center">${student.rncp_title.certifier.short_name}</td>
      </tr>
      <tr class="tr-cpc">
        <td>Lieu de préparation</td>
        <td style="text-align: center">${student.school.long_name}</td>
      </tr>
      <tr class="tr-cpc">
        <td>Année de promotion</td>
        <td style="text-align: center">2021</td>
      </tr>
      <tr class="tr-cpc">
        <td>Nom et prénom de l'Apprenant</td>
        <td style="text-align: center">${student.first_name} ${student.last_name}</td>
      </tr>
      <tr class="tr-cpc">
        <td>Date et lieu de naissance</td>
        <td style="text-align: center">
           ${moment(this.transformMinusOne(result.student_id.date_of_birth)).format('DD-MM-YYYY')} á ${result.student_id.place_of_birth}
        </td>
      </tr>
    </table>
    `;
    return body;
  }

  static generateBlockTable(student, result, expertise, journalText, pdfData, studentTranscript) {
    const isThereEcts = expertise.block_of_competence_conditions.filter((list) => list.block_id.block_of_competence_condition_credit);
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
    let body = '';
    let body2 = '';
    let sur20Total = 0;
    let totalStr = '';
    let totalMaxPointSur = 0;
    let total_block_of_competence_condition_credit = 0;
    if (this.isHaveEcts) {
      body = `
      <table style="width: 100%">
        <tr class="tr-cpc">
          <th style="font-weight: 600; width: 70%">Compétences</th>
          <th style="font-weight: 600; width: 10%"> Notes<br/>(sur 20)</th>
          <th style="font-weight: 600; width: 10%">Points</th>
          <th style="font-weight: 600; width: 10%">Crédits ECTS</th>
        </tr>
        `;
    } else {
      body = `
      <table style="width: 100%">
        <tr class="tr-cpc">
          <th style="font-weight: 600; width: 70%">Compétences</th>
          <th style="font-weight: 600; width: 10%"> Notes<br/>(sur 20)</th>
          <th style="font-weight: 600; width: 10%">Points</th>
        </tr>
        `;
    }
    if (expertise && expertise.block_of_competence_conditions.length) {
      expertise.block_of_competence_conditions.forEach((block, indBlock) => {
        let currentBlock = ``;

        if (this.isHaveEcts) {
          if (
            block &&
            block.block_id &&
            block.block_id._id &&
            studentTranscript &&
            studentTranscript.block_competence_condition_details &&
            studentTranscript.block_competence_condition_details[indBlock] &&
            studentTranscript.block_competence_condition_details[indBlock].block_id &&
            studentTranscript.block_competence_condition_details[indBlock].block_id._id &&
            block.block_id._id === studentTranscript.block_competence_condition_details[indBlock].block_id._id &&
            studentTranscript.block_competence_condition_details[indBlock].decision_school_board_id &&
            studentTranscript.block_competence_condition_details[indBlock].decision_school_board_id &&
            studentTranscript.block_competence_condition_details[indBlock].decision_school_board_id.condition_type === 'pass'
          ) {
            total_block_of_competence_condition_credit =
              total_block_of_competence_condition_credit + Number(block.block_id.block_of_competence_condition_credit);
          }
          const ects = result.block_of_competence_conditions[indBlock].block_id.block_of_competence_condition_credit;
          let statusDecision = 0;
          if (
            block &&
            block.block_id &&
            block.block_id._id &&
            studentTranscript &&
            studentTranscript.block_competence_condition_details &&
            studentTranscript.block_competence_condition_details[indBlock] &&
            studentTranscript.block_competence_condition_details[indBlock].block_id &&
            studentTranscript.block_competence_condition_details[indBlock].block_id._id &&
            block.block_id._id === studentTranscript.block_competence_condition_details[indBlock].block_id._id &&
            studentTranscript.block_competence_condition_details[indBlock].decision_school_board_id &&
            studentTranscript.block_competence_condition_details[indBlock].decision_school_board_id &&
            studentTranscript.block_competence_condition_details[indBlock].decision_school_board_id.condition_type === 'pass'
          ) {
            statusDecision = block.block_id.block_of_competence_condition_credit;
          }
          if (!ects || ects === 0) {
            currentBlock = `
            <div>
            <tr class="tr-cpc gray-background">
              <td style="font-weight: 600; text-align: left">${this.getCharactersByIndex(indBlock + 1)} - ${
              block.block_id.block_of_competence_condition
            }</td>
              <td></td>
              <td></td>
              <td style="background-color: #fff!important; text-align: center">${'-'}</td>
            </tr>
            <div>`;
          } else {
            if (statusDecision) {
              currentBlock = `
              <div>
              <tr class="tr-cpc gray-background">
                <td style="font-weight: 600; text-align: left">${this.getCharactersByIndex(indBlock + 1)} - ${
                block.block_id.block_of_competence_condition ? block.block_id.block_of_competence_condition : '-'
              } </td>
                <td></td>
                <td></td>
                <td style="background-color: #fff!important; text-align: center">${statusDecision}</td>
              </tr>
              <div>`;
            } else {
              currentBlock = `
              <div>
              <tr class="tr-cpc gray-background">
                <td style="font-weight: 600; text-align: left">${this.getCharactersByIndex(indBlock + 1)} - ${
                block.block_id.block_of_competence_condition
              }</td>
                <td></td>
                <td></td>
                <td style="background-color: #fff!important; text-align: center">${'-'}</td>
              </tr>
              <div>`;
            }
          }

          if (block.subjects && block.subjects.length) {
            block.subjects.forEach((subject, indSubject) => {
              sur20Total = sur20Total + Number(subject.total_mark);
              const tempSubject1 = `
              <tr class="tr-cpc">
                 <td style="text-align: right">${subject.subject_id.subject_name}</td>
                 <td style="text-align: right">${subject.total_mark ? subject.total_mark.toFixed(2) : '0'}</td>
                 <td class="gray-background"></td>
                 <td class="gray-background"></td>
              </tr>`;
              currentBlock += tempSubject1;
            });
          }

          const tempBody3 = `
          <tr class="tr-cpc">
            <td style="text-align: left">
             Total points du bloc de compétence sur ${result.block_of_competence_conditions[indBlock].max_point.toFixed(2)}
            </td>
            <td class="gray-background"></td>
            <td style="text-align: right">${result.block_of_competence_conditions[indBlock].total_point.toFixed(2)}</td>
            <td class="gray-background"></td>
          </tr>`;
          totalMaxPointSur = totalMaxPointSur + block.max_point;
          currentBlock += tempBody3;
          body2 += currentBlock;
          if (indBlock === expertise.block_of_competence_conditions.length - 1) {
            totalStr = totalStr + this.getCharactersByIndex(indBlock + 1);
          } else {
            totalStr = totalStr + this.getCharactersByIndex(indBlock + 1) + '+';
          }
        } else {
          if (
            block &&
            block.block_id &&
            block.block_id._id &&
            studentTranscript &&
            studentTranscript.block_competence_condition_details &&
            studentTranscript.block_competence_condition_details[indBlock] &&
            studentTranscript.block_competence_condition_details[indBlock].block_id &&
            studentTranscript.block_competence_condition_details[indBlock].block_id._id &&
            block.block_id._id === studentTranscript.block_competence_condition_details[indBlock].block_id._id &&
            studentTranscript.block_competence_condition_details[indBlock].decision_school_board_id &&
            studentTranscript.block_competence_condition_details[indBlock].decision_school_board_id &&
            studentTranscript.block_competence_condition_details[indBlock].decision_school_board_id.condition_type === 'pass'
          ) {
            total_block_of_competence_condition_credit =
              total_block_of_competence_condition_credit + Number(block.block_id.block_of_competence_condition_credit);
          }
          const ects = result.block_of_competence_conditions[indBlock].block_id.block_of_competence_condition_credit;
          let statusDecision = 0;
          if (
            block &&
            block.block_id &&
            block.block_id._id &&
            studentTranscript &&
            studentTranscript.block_competence_condition_details &&
            studentTranscript.block_competence_condition_details[indBlock] &&
            studentTranscript.block_competence_condition_details[indBlock].block_id &&
            studentTranscript.block_competence_condition_details[indBlock].block_id._id &&
            block.block_id._id === studentTranscript.block_competence_condition_details[indBlock].block_id._id &&
            studentTranscript.block_competence_condition_details[indBlock].decision_school_board_id &&
            studentTranscript.block_competence_condition_details[indBlock].decision_school_board_id &&
            studentTranscript.block_competence_condition_details[indBlock].decision_school_board_id.condition_type === 'pass'
          ) {
            statusDecision = block.block_id.block_of_competence_condition_credit;
          }
          if (!ects || ects === 0) {
            currentBlock = `
            <div>
            <tr class="tr-cpc gray-background">
              <td style="font-weight: 600; text-align: left">${this.getCharactersByIndex(indBlock + 1)} - ${
              block.block_id.block_of_competence_condition
            }</td>
              <td></td>
              <td></td>
            </tr>
            <div>`;
          } else {
            if (statusDecision) {
              currentBlock = `
              <div>
              <tr class="tr-cpc gray-background">
                <td style="font-weight: 600; text-align: left">${this.getCharactersByIndex(indBlock + 1)} - ${
                block.block_id.block_of_competence_condition ? block.block_id.block_of_competence_condition : '-'
              } </td>
                <td></td>
                <td></td>
              </tr>
              <div>`;
            } else {
              currentBlock = `
              <div>
              <tr class="tr-cpc gray-background">
                <td style="font-weight: 600; text-align: left">${this.getCharactersByIndex(indBlock + 1)} - ${
                block.block_id.block_of_competence_condition
              }</td>
                <td></td>
                <td></td>
              </tr>
              <div>`;
            }
          }

          if (block.subjects && block.subjects.length) {
            block.subjects.forEach((subject, indSubject) => {
              sur20Total = sur20Total + Number(subject.total_mark);
              const tempSubject1 = `
              <tr class="tr-cpc">
                 <td style="text-align: right">${subject.subject_id.subject_name}</td>
                 <td style="text-align: right">${subject.total_mark ? subject.total_mark.toFixed(2) : '0'}</td>
                 <td class="gray-background"></td>
              </tr>`;
              currentBlock += tempSubject1;
            });
          }

          const tempBody3 = `
          <tr class="tr-cpc">
            <td style="text-align: left">
             Total points du bloc de compétence sur ${result.block_of_competence_conditions[indBlock].max_point.toFixed(2)}
            </td>
            <td class="gray-background"></td>
            <td style="text-align: right">${result.block_of_competence_conditions[indBlock].total_point.toFixed(2)}</td>
          </tr>`;
          totalMaxPointSur = totalMaxPointSur + block.max_point;
          currentBlock += tempBody3;
          body2 += currentBlock;
          if (indBlock === expertise.block_of_competence_conditions.length - 1) {
            totalStr = totalStr + this.getCharactersByIndex(indBlock + 1);
          } else {
            totalStr = totalStr + this.getCharactersByIndex(indBlock + 1) + '+';
          }
        }
      });
    }

    // Remove + if appear on last index its horror
    const lastWord = totalStr.substring(totalStr.length - 1);
    if (lastWord === '+') {
      totalStr = totalStr.slice(0, -1);
    }
    let body3 = '';
    if (this.isHaveEcts) {
      body3 = `</table>
        <table style="width: 100%; margin: 5px 0;">
        <tr class="tr-cpc gray-background">
          <th style="width: 70%">SCORE</th>
          <th style="color: #d8d8d8; width: 10%"></th>
          <th style="color: #d8d8d8; width: 10%"></th>
          <th style="width: 10%; background-color: #fff!important;">${total_block_of_competence_condition_credit}</th>
        </tr>

        <div>
          <tr class="tr-cpc">
            <td>Total ${totalStr} sur 20</td>
            <td style="text-align: center">${result.total_mark ? result.total_mark.toFixed(2) : ''}</td>
            <td class="gray-background"></td>
            <td class="gray-background"></td>
          </tr>
          <tr class="tr-cpc">
            <td>Total ${totalStr} sur ${totalMaxPointSur}</td>
            <td class="gray-background"></td>
            <td style="text-align: center">${result.total_point ? result.total_point.toFixed(2) : ''}</td>
            <td class="gray-background"></td>
          </tr>
        </div>
      </table>`;
    } else {
      body3 = `</table>
        <table style="width: 100%; margin: 5px 0;">
        <tr class="tr-cpc gray-background">
          <th style="width: 70%">SCORE</th>
          <th style="color: #d8d8d8; width: 10%"></th>
          <th style="color: #d8d8d8; width: 10%"></th>
        </tr>

        <div>
          <tr class="tr-cpc">
            <td>Total ${totalStr} sur 20</td>
            <td style="text-align: center">${result.total_mark ? result.total_mark.toFixed(2) : ''}</td>
            <td class="gray-background"></td>
          </tr>
          <tr class="tr-cpc">
            <td>Total ${totalStr} sur ${totalMaxPointSur}</td>
            <td class="gray-background"></td>
            <td style="text-align: center">${result.total_point ? result.total_point.toFixed(2) : ''}</td>
          </tr>
        </div>
      </table>`;
    }
    const body4 = `<div style="margin-top: 20px; page-break-after: always;">
      <div style="display: block; text-align: right; margin-top: 20px">
        <img style="max-height: 80px" src="${this.getSignature(student)}">
      </div>
      ${this.getFooter(student, journalText)}
    </div>`;
    body += body2;
    body += body3;
    body += body4;
    return body;
  }

  static generateCompetenceTable(student, result, expertise, journalText, pdfData, studentTranscript) {
    let totalMarks = 0;
    let totalStr = '';
    let body2 = `
    <table style="width: 100%; margin-bottom: 10px;">
      <tr class="tr-cpc">
        <td width="30%" style="text-align: center">Blocs de compétences</td>
        <td width="25%" style="text-align: center">Objectifs</td>
        <td width="20%" style="text-align: center">Maximum Points</td>
        <td width="10%" style="text-align: center">Nb de points</td>
        <td width="15%" style="text-align: center">Validation*</td>
      </tr>
      <tr class="tr-cpc"><td></td><td></td><td></td><td></td><td></td></tr>
      <div>
    `;
    if (expertise.block_of_competence_conditions && expertise.block_of_competence_conditions.length) {
      expertise.block_of_competence_conditions.forEach((block, blockIndex) => {
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
          } else if (studentTranscript.block_competence_condition_details[blockIndex].decision_school_board_id.condition_type === 'fail') {
            statusDecision = 'Non Validé';
          } else if (
            studentTranscript.block_competence_condition_details[blockIndex].decision_school_board_id.condition_type === 'retake'
          ) {
            statusDecision = 'Rattrapage';
          }
        }

        body2 =
          body2 +
          `<tr class="tr-cpc">
                <td style="font-weight: 600">
                   ${this.getCharactersByIndex(blockIndex + 1)} - ${block.block_id.block_of_competence_condition}
                </td>
                <td>${block.block_id.description}</td>
                <td style="text-align: center">
                   ${block && block.max_point ? block.max_point : '-'}
                </td>
                <td style="text-align: center">${block.total_point ? block.total_point.toFixed(2) : '-'}</td>
                <td style="text-align: center">${statusDecision}</td>
             </tr>`;

        totalMarks = totalMarks + Number(block.max_point);
        if (blockIndex === expertise.block_of_competence_conditions.length - 1) {
          totalStr = totalStr + this.getCharactersByIndex(blockIndex + 1);
        } else {
          totalStr = totalStr + this.getCharactersByIndex(blockIndex + 1) + '+';
        }
      });
    }

    // Remove + if appear on last index its horror
    const lastWord = totalStr.substring(totalStr.length - 1);
    if (lastWord === '+') {
      totalStr = totalStr.slice(0, -1);
    }
    const passThreshold = 100;

    // ${Number(result.total_point) >= passThreshold ? 'validé' : 'Non validé'} -> old value for total a+b+c+d+....
    body2 =
      body2 +
      `
        <tr class="tr-cpc"><td></td><td></td><td></td><td></td><td></td></tr>
      </div>
      <tr class="tr-cpc">
        <td style="font-weight: 600">TOTAL ${totalStr}</td>
        <td></td>
        <td style="text-align: center; font-weight: 600">${totalMarks}</td>
        <td style="text-align: center;">${result.total_point ? result.total_point.toFixed(2) : ''}</td>
        <td style="text-align: center; border: 0px !important"></td>
      </tr>
    </table>

    <table style="width: 100%; margin-bottom: 30px;">
      <tr>
        <td width="30%"></td>
        <td width="25%"></td>
        <td width="20%" style="border: 1px solid #686868 !important">Décision du Jury</td>
        <td width="25%" style="text-align: center; border: 1px solid #686868 !important;">
           ${
             studentTranscript && studentTranscript.decision_school_board_id && studentTranscript.decision_school_board_id.condition_name
               ? studentTranscript.decision_school_board_id.condition_name
               : '-'
           }
        </td>
      </tr>
    </table>

    <div style="width: 100%">
      <div style="width: 65%; display: inline-block;">
        <span style="font-weight: 600; display: block; margin-bottom: 10px">
          *Rappel des conditions cumulatives pour l'attribution de la Certification professionnelle :
        </span>`;

    if (expertise.class_id && expertise.class_id.pass_fail_conditions && expertise.class_id.pass_fail_conditions.length) {
      const passFail = expertise.class_id.pass_fail_conditions.find((list) => list.condition_type === 'pass');
      if (passFail && passFail.condition_parameters && passFail.condition_parameters.length) {
        passFail.condition_parameters.forEach((score, scoreIndex) => {
          if (score.correlation) {
            body2 =
              body2 +
              `
            <span style="display: block">
              ${this.getCorrelation(score)}
            </span>`;
          }

          body2 =
            body2 +
            `
          <span style="display: block">
              ${this.getCodeCorversion(score)} -
              ${this.getNameCorversion(score)} ${this.getSignCharacter(score)}
            </span>`;
        });
      }
    }
    // body2 =
    //   body2 +
    //   `
    //     <span style="display: block">
    //       TOTAL ${totalStr} ≥ à ${result.total_point}/${totalMarks} (10/20)
    //     </span>`;

    body2 =
      body2 +
      `
          </div>
          <div style="width: 34%; display: inline-block;">
            <div style="display: block; text-align: center; margin-top: 20px">
              <img style="max-height: 80px" src="${this.getSignature(student)}">
            </div>
          </div>
        </div>
        `;
    return body2;
  }

  static getFooterText(student, journalText) {
    return `
      <div style="font-size:9px; display:block">
        ${journalText}
      </div>
    `;
  }

  static getFooter(student, journalText) {
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
      return ImageBase64.whiteBg;
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
      return ImageBase64.whiteBg;
    }
  }

  static getCharactersByIndex(index: number) {
    if (index === 1) {
      return 'A';
    } else if (index === 2) {
      return 'B';
    } else if (index === 3) {
      return 'C';
    } else if (index === 4) {
      return 'D';
    } else if (index === 5) {
      return 'E';
    } else if (index === 6) {
      return 'F';
    } else if (index === 7) {
      return 'G';
    } else if (index === 8) {
      return 'H';
    } else if (index === 9) {
      return 'I';
    } else if (index === 10) {
      return 'J';
    } else if (index === 11) {
      return 'K';
    }
  }

  static getSignCharacter(score) {
    if (score.validation_parameter.sign === 'less_than') {
      return `< à ${score.pass_mark}`;
    } else if (score.validation_parameter.sign === 'less_than_or_equal') {
      return `<= à ${score.pass_mark}`;
    } else if (score.validation_parameter.sign === 'equal') {
      return `= à ${score.pass_mark}`;
    } else if (score.validation_parameter.sign === 'more_than_or_equal') {
      return `>= à ${score.pass_mark}`;
    } else if (score.validation_parameter.sign === 'more_than') {
      return `> à ${score.pass_mark}`;
    } else if (score.validation_parameter.sign === 'pass') {
      return 'Validé';
    } else if (score.validation_parameter.sign === 'failed') {
      return 'Non Validé';
    }
  }

  static getNameCorversion(passFail) {
    if (passFail.validation_type === 'overall_score') {
      if (passFail.validation_parameter.parameter_type === 'average') {
        return 'Moyenne';
      } else {
        return 'Pourcentage';
      }
    } else if (passFail.validation_type === 'block') {
      return passFail.validation_parameter.block_id.block_of_competence_condition;
    } else if (passFail.validation_type === 'subject') {
      return passFail.validation_parameter.subject_id.subject_name;
    } else if (passFail.validation_type === 'evaluation') {
      return passFail.validation_parameter.evaluation_id.evaluation;
    }
  }

  static getCodeCorversion(passFail) {
    if (passFail.validation_type === 'overall_score') {
      return 'Score global';
    } else if (passFail.validation_type === 'block') {
      return 'Bloc';
    } else if (passFail.validation_type === 'subject') {
      return 'Epreuve';
    } else if (passFail.validation_type === 'evaluation') {
      return 'Evaluation';
    }
  }

  static getCorrelation(passFail) {
    if (passFail.correlation === 'AND') {
      return 'et';
    } else if (passFail.correlation === 'OR') {
      return 'ou';
    }
  }
}
