import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { Cacheable } from 'ngx-cacheable';
import { Apollo } from 'apollo-angular';
import { StudentIdsData, StudentTableData } from '../../students/student.model';
import gql from 'graphql-tag';
import { map } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { SchoolStudentTableSubject, TestDropdown } from 'app/title-rncp/conditions/jury-decision-parameter/jury-decision-parameter.model';
import { title } from 'process';

@Injectable({
  providedIn: 'root',
})
export class StudentsService {
  CountryList: [
    { id: '1'; countryName: 'France' },
    { id: '2'; countryName: 'Afghanistan' },
    { id: '3'; countryName: 'South Africa' },
    { id: '4'; countryName: 'Albania' },
    { id: '5'; countryName: 'Algeria' },
    { id: '6'; countryName: 'Germany' },
    { id: '7'; countryName: 'Angola' },
    { id: '8'; countryName: 'Anguilla' },
    { id: '9'; countryName: 'Antarctique' },
    { id: '10'; countryName: 'Antigua and Barbuda' },
    { id: '11'; countryName: 'Netherlands Antilles' },
    { id: '12'; countryName: 'Saudi Arabia' },
    { id: '13'; countryName: 'Argentina' },
    { id: '14'; countryName: 'Armenia' },
    { id: '15'; countryName: 'Aruba' },
    { id: '16'; countryName: 'Australia' },
    { id: '17'; countryName: 'Austria' },
    { id: '18'; countryName: 'Azerbaijan' },
    { id: '19'; countryName: 'Bahamas' },
    { id: '20'; countryName: 'Bahrain' },
    { id: '21'; countryName: 'Bangladesh' },
    { id: '22'; countryName: 'Barbados' },
    { id: '23'; countryName: 'Belarus' },
    { id: '24'; countryName: 'Belgium' },
    { id: '25'; countryName: 'Belize' },
    { id: '26'; countryName: 'Benin' },
    { id: '27'; countryName: 'Bermuda' },
    { id: '28'; countryName: 'Bhutan' },
    { id: '29'; countryName: 'Bolivia' },
    { id: '30'; countryName: 'Bosnia and Herzegovina' },
    { id: '31'; countryName: 'Botswana' },
    { id: '32'; countryName: 'Brazil' },
    { id: '33'; countryName: 'Brunei Darussalam' },
    { id: '34'; countryName: 'Bulgaria' },
    { id: '35'; countryName: 'Burkina Faso' },
    { id: '36'; countryName: 'Cambodia' },
    { id: '37'; countryName: 'Cape Verde' },
    { id: '38'; countryName: 'Chile' },
    { id: '39'; countryName: 'China' },
    { id: '40'; countryName: 'Cyprus' },
    { id: '41'; countryName: 'Colombia' },
    { id: '42'; countryName: 'Costa Rica' },
    { id: '43'; countryName: 'Ivory Coast' },
    { id: '44'; countryName: 'Croatia' },
    { id: '45'; countryName: 'Cuba' },
    { id: '46'; countryName: 'Denmark' },
    { id: '47'; countryName: 'Djibouti' },
    { id: '48'; countryName: 'Dominique' },
    { id: '49'; countryName: 'Egypt' },
    { id: '50'; countryName: 'El Salvador' },
    { id: '51'; countryName: 'United Arab Emirates' },
    { id: '52'; countryName: 'Ecuador' },
    { id: '53'; countryName: 'Eritrea' },
    { id: '54'; countryName: 'Spain' },
    { id: '55'; countryName: 'Estonia' },
    { id: '56'; countryName: 'Federated States of Micronesia' },
    { id: '57'; countryName: 'United States' },
    { id: '58'; countryName: 'Ethiopia' },
    { id: '59'; countryName: 'Russian Federation' },
    { id: '60'; countryName: 'Fiji' },
    { id: '61'; countryName: 'Finland' },
    { id: '62'; countryName: 'Gabon' },
    { id: '63'; countryName: 'Gambia' },
    { id: '64'; countryName: 'Georgia' },
    { id: '65'; countryName: 'Ghana' },
    { id: '66'; countryName: 'Gibraltar' },
    { id: '67'; countryName: 'Greece' },
    { id: '68'; countryName: 'Granada' },
    { id: '69'; countryName: 'Greenland' },
    { id: '70'; countryName: 'Guadeloupe' },
    { id: '71'; countryName: 'Guam' },
    { id: '72'; countryName: 'Guatemala' },
    { id: '73'; countryName: 'Guinea' },
    { id: '74'; countryName: 'Guinea-Bissau' },
    { id: '75'; countryName: 'Equatorial Guinea' },
    { id: '76'; countryName: 'Guyana' },
    { id: '77'; countryName: 'French Guiana' },
    { id: '78'; countryName: 'Haiti' },
    { id: '79'; countryName: 'Honduras' },
    { id: '80'; countryName: 'Hong Kong' },
    { id: '82'; countryName: 'Hungary' },
    { id: '83'; countryName: 'Bouvet Island' },
    { id: '84'; countryName: 'Christmas Island' },
    { id: '85'; countryName: 'Isle of Man' },
    { id: '86'; countryName: 'Norfolk Island' },
    { id: '87'; countryName: 'Islands (malvinas) Falkland' },
    { id: '88'; countryName: 'land Islands' },
    { id: '89'; countryName: 'Cocos (Keeling) Islands' },
    { id: '90'; countryName: 'Cook Islands' },
    { id: '91'; countryName: 'Faroe Islands' },
    { id: '92'; countryName: 'Solomon Islands' },
    { id: '93'; countryName: 'Turks and Caicos Islands' },
    { id: '94'; countryName: 'British Virgin Islands' },
    { id: '95'; countryName: 'United States Virgin Islands' },
    { id: '96'; countryName: 'India' },
    { id: '97'; countryName: 'Indonesia' },
    { id: '98'; countryName: 'Iraq' },
    { id: '99'; countryName: 'Ireland' },
    { id: '100'; countryName: 'Iceland' },
    { id: '101'; countryName: 'Israel' },
    { id: '102'; countryName: 'Italy' },
    { id: '103'; countryName: 'Libyan Arab Jamahiriya' },
    { id: '104'; countryName: 'Jamaica' },
    { id: '105'; countryName: 'Japan' },
    { id: '106'; countryName: 'Jordan' },
    { id: '107'; countryName: 'Kazakhstan' },
    { id: '108'; countryName: 'Kenya' },
    { id: '109'; countryName: 'Kyrgyzstan' },
    { id: '110'; countryName: 'Kiribati' },
    { id: '111'; countryName: 'Kuwait' },
    { id: '112'; countryName: 'Lesotho' },
    { id: '113'; countryName: 'Latvia' },
    { id: '114'; countryName: 'Lebanon' },
    { id: '115'; countryName: 'Liberia' },
    { id: '116'; countryName: 'Liechtenstein' },
    { id: '117'; countryName: 'Lithuania' },
    { id: '118'; countryName: 'Luxembourg' },
    { id: '119'; countryName: 'Macau' },
    { id: '121'; countryName: 'Malaysia' },
    { id: '122'; countryName: 'Malawi' },
    { id: '123'; countryName: 'Maldives' },
    { id: '124'; countryName: 'Mali' },
    { id: '125'; countryName: 'Malta' },
    { id: '126'; countryName: 'Morocco' },
    { id: '127'; countryName: 'Martinique' },
    { id: '128'; countryName: 'Mauritius' },
    { id: '129'; countryName: 'Mauritania' },
    { id: '130'; countryName: 'Mayotte' },
    { id: '131'; countryName: 'Mexico' },
    { id: '132'; countryName: 'Monaco' },
    { id: '133'; countryName: 'Mongolia' },
    { id: '134'; countryName: 'Montserrat' },
    { id: '135'; countryName: 'Mozambique' },
    { id: '136'; countryName: 'Myanmar' },
    { id: '137'; countryName: 'Namibia' },
    { id: '138'; countryName: 'Nauru' },
    { id: '139'; countryName: 'Nepal' },
    { id: '140'; countryName: 'Nicaragua' },
    { id: '141'; countryName: 'Niger' },
    { id: '142'; countryName: 'Nigeria' },
    { id: '143'; countryName: 'Niue' },
    { id: '144'; countryName: 'Norway' },
    { id: '145'; countryName: 'New Caledonia' },
    { id: '146'; countryName: 'New Zealand' },
    { id: '147'; countryName: 'Oman' },
    { id: '148'; countryName: 'Uganda' },
    { id: '149'; countryName: 'Uzbekistan' },
    { id: '150'; countryName: 'Pakistan' },
    { id: '151'; countryName: 'Palau' },
    { id: '152'; countryName: 'Panama' },
    { id: '153'; countryName: 'Papua New Guinea' },
    { id: '154'; countryName: 'Netherlands' },
    { id: '155'; countryName: 'Peru' },
    { id: '156'; countryName: 'Philippines' },
    { id: '157'; countryName: 'Pitcairn' },
    { id: '158'; countryName: 'Poland' },
    { id: '159'; countryName: 'French Polynesia' },
    { id: '160'; countryName: 'Puerto Rico' },
    { id: '161'; countryName: 'Portugal' },
    { id: '162'; countryName: 'Qatar' },
    { id: '163'; countryName: 'Syrian Arab Republic' },
    { id: '164'; countryName: 'Central African Republic' },
    { id: '165'; countryName: 'Republic of Korea' },
    { id: '166'; countryName: 'Republic of Moldova' },
    { id: '167'; countryName: 'Democratic Republic of Congo' },
    { id: '168'; countryName: 'Lao Peoples Democratic Republic' },
    { id: '169'; countryName: 'Dominican Republic' },
    { id: '170'; countryName: 'Islamic Republic of Iran' },
    { id: '171'; countryName: 'Democratic Peoples Republic of Korea' },
    { id: '172'; countryName: 'Czech Republic' },
    { id: '173'; countryName: 'United Republic of Tanzania' },
    { id: '174'; countryName: 'Meeting' },
    { id: '175'; countryName: 'United Kingdom' },
    { id: '176'; countryName: 'Rwanda' },
    { id: '177'; countryName: 'Western Sahara' },
    { id: '178'; countryName: 'Saint Kitts and Nevis' },
    { id: '179'; countryName: 'San Marino' },
    { id: '180'; countryName: 'Holy See (state of Vatican City)' },
    { id: '181'; countryName: 'Saint Vincent and the Grenadines' },
    { id: '182'; countryName: 'Saint Helena' },
    { id: '183'; countryName: 'Saint Lucia' },
    { id: '184'; countryName: 'Samoa' },
    { id: '185'; countryName: 'American Samoa' },
    { id: '186'; countryName: 'Sao Tome and Principe' },
    { id: '187'; countryName: 'Senegal' },
    { id: '188'; countryName: 'Serbia and Montenegro' },
    { id: '189'; countryName: 'Seychelles' },
    { id: '190'; countryName: 'Sierra Leone' },
    { id: '191'; countryName: 'Singapore' },
    { id: '192'; countryName: 'Slovakia' },
    { id: '193'; countryName: 'Slovenia' },
    { id: '194'; countryName: 'Somalia' },
    { id: '195'; countryName: 'Sudan' },
    { id: '196'; countryName: 'Sri Lanka' },
    { id: '197'; countryName: 'Sweden' },
    { id: '198'; countryName: 'Suriname' },
    { id: '199'; countryName: 'Swaziland' },
    { id: '200'; countryName: 'Tajikistan' },
    { id: '201'; countryName: 'Taiwan' },
    { id: '202'; countryName: 'Chad' },
    { id: '203'; countryName: 'Palestinian Territory Occupied' },
    { id: '204'; countryName: 'Thailand' },
    { id: '205'; countryName: 'Timor-Leste' },
    { id: '206'; countryName: 'Togo' },
    { id: '207'; countryName: 'Tokelau' },
    { id: '208'; countryName: 'Tonga' },
    { id: '209'; countryName: 'Trinidad and Tobago' },
    { id: '210'; countryName: 'Tunisia' },
    { id: '211'; countryName: 'Turkmenistan' },
    { id: '212'; countryName: 'Turkey' },
    { id: '213'; countryName: 'Tuvalu' },
    { id: '214'; countryName: 'Ukraine' },
    { id: '215'; countryName: 'Uruguay' },
    { id: '216'; countryName: 'Vanuatu' },
    { id: '217'; countryName: 'Venezuela' },
    { id: '218'; countryName: 'Viet Nam' },
    { id: '219'; countryName: 'Wallis and Futuna' },
    { id: '220'; countryName: 'Yemen' },
    { id: '221'; countryName: 'Zambia' },
    { id: '222'; countryName: 'Zimbabwe' },
    { id: '223'; countryName: 'Cameroon' },
    { id: '224'; countryName: 'Canada' },
    { id: '225'; countryName: 'Comoros' },
    { id: '226'; countryName: 'Paraguay' },
    { id: '227'; countryName: 'Romania' },
    { id: '228'; countryName: 'Saint Pierre and Miquelon' },
    { id: '229'; countryName: 'Switzerland' },
    { id: '230'; countryName: 'Burundi' },
  ];

  nationalitiesList = [
    { id: '1', countryName: 'France' },
    { id: '2', countryName: 'Afghanistan' },
    { id: '3', countryName: 'South Africa' },
    { id: '4', countryName: 'Albania' },
    { id: '5', countryName: 'Algeria' },
    { id: '6', countryName: 'Germany' },
    { id: '7', countryName: 'Angola' },
    { id: '8', countryName: 'Anguilla' },
    { id: '9', countryName: 'Antarctique' },
    { id: '10', countryName: 'Antigua and Barbuda' },
    { id: '11', countryName: 'Netherlands Antilles' },
    { id: '12', countryName: 'Saudi Arabia' },
    { id: '13', countryName: 'Argentina' },
    { id: '14', countryName: 'Armenia' },
    { id: '15', countryName: 'Aruba' },
    { id: '16', countryName: 'Australia' },
    { id: '17', countryName: 'Austria' },
    { id: '18', countryName: 'Azerbaijan' },
    { id: '19', countryName: 'Bahamas' },
    { id: '20', countryName: 'Bahrain' },
    { id: '21', countryName: 'Bangladesh' },
    { id: '22', countryName: 'Barbados' },
    { id: '23', countryName: 'Belarus' },
    { id: '24', countryName: 'Belgium' },
    { id: '25', countryName: 'Belize' },
    { id: '26', countryName: 'Benin' },
    { id: '27', countryName: 'Bermuda' },
    { id: '28', countryName: 'Bhutan' },
    { id: '29', countryName: 'Bolivia' },
    { id: '30', countryName: 'Bosnia and Herzegovina' },
    { id: '31', countryName: 'Botswana' },
    // { id: '32', countryName: 'Brazil' },
    { id: '33', countryName: 'Brunei Darussalam' },
    { id: '34', countryName: 'Bulgaria' },
    { id: '35', countryName: 'Burkina Faso' },
    { id: '36', countryName: 'Cambodia' },
    { id: '37', countryName: 'Cape Verde' },
    { id: '38', countryName: 'Chile' },
    { id: '39', countryName: 'China' },
    { id: '40', countryName: 'Cyprus' },
    { id: '41', countryName: 'Colombia' },
    { id: '42', countryName: 'Costa Rica' },
    { id: '43', countryName: 'Ivory Coast' },
    { id: '44', countryName: 'Croatia' },
    { id: '45', countryName: 'Cuba' },
    { id: '46', countryName: 'Denmark' },
    { id: '47', countryName: 'Djibouti' },
    { id: '48', countryName: 'Dominique' },
    { id: '49', countryName: 'Egypt' },
    { id: '50', countryName: 'El Salvador' },
    { id: '51', countryName: 'United Arab Emirates' },
    { id: '52', countryName: 'Ecuador' },
    { id: '53', countryName: 'Eritrea' },
    { id: '54', countryName: 'Spain' },
    { id: '55', countryName: 'Estonia' },
    { id: '56', countryName: 'Federated States of Micronesia' },
    { id: '57', countryName: 'United States' },
    { id: '58', countryName: 'Ethiopia' },
    { id: '59', countryName: 'Russian Federation' },
    { id: '60', countryName: 'Fiji' },
    // { id: '61', countryName: 'Finland' },
    { id: '62', countryName: 'Gabon' },
    { id: '63', countryName: 'Gambia' },
    { id: '64', countryName: 'Georgia' },
    { id: '65', countryName: 'Ghana' },
    { id: '66', countryName: 'Gibraltar' },
    { id: '67', countryName: 'Greece' },
    { id: '68', countryName: 'Granada' },
    { id: '69', countryName: 'Greenland' },
    { id: '70', countryName: 'Guadeloupe' },
    { id: '71', countryName: 'Guam' },
    { id: '72', countryName: 'Guatemala' },
    { id: '73', countryName: 'Guinea' },
    { id: '74', countryName: 'Guinea-Bissau' },
    { id: '75', countryName: 'Equatorial Guinea' },
    { id: '76', countryName: 'Guyana' },
    { id: '77', countryName: 'French Guiana' },
    { id: '78', countryName: 'Haiti' },
    { id: '79', countryName: 'Honduras' },
    { id: '80', countryName: 'Hong Kong' },
    { id: '82', countryName: 'Hungary' },
    { id: '83', countryName: 'Bouvet Island' },
    { id: '84', countryName: 'Christmas Island' },
    { id: '85', countryName: 'Isle of Man' },
    { id: '86', countryName: 'Norfolk Island' },
    { id: '87', countryName: 'Islands (malvinas) Falkland' },
    { id: '88', countryName: 'land Islands' },
    { id: '89', countryName: 'Cocos (Keeling) Islands' },
    { id: '90', countryName: 'Cook Islands' },
    { id: '91', countryName: 'Faroe Islands' },
    { id: '92', countryName: 'Solomon Islands' },
    { id: '93', countryName: 'Turks and Caicos Islands' },
    { id: '94', countryName: 'British Virgin Islands' },
    { id: '95', countryName: 'United States Virgin Islands' },
    { id: '96', countryName: 'India' },
    { id: '97', countryName: 'Indonesia' },
    { id: '98', countryName: 'Iraq' },
    { id: '99', countryName: 'Ireland' },
    { id: '100', countryName: 'Iceland' },
    { id: '101', countryName: 'Israel' },
    { id: '102', countryName: 'Italy' },
    { id: '103', countryName: 'Libyan Arab Jamahiriya' },
    { id: '104', countryName: 'Jamaica' },
    { id: '105', countryName: 'Japan' },
    { id: '106', countryName: 'Jordan' },
    { id: '107', countryName: 'Kazakhstan' },
    { id: '108', countryName: 'Kenya' },
    { id: '109', countryName: 'Kyrgyzstan' },
    { id: '110', countryName: 'Kiribati' },
    { id: '111', countryName: 'Kuwait' },
    { id: '112', countryName: 'Lesotho' },
    { id: '113', countryName: 'Latvia' },
    { id: '114', countryName: 'Lebanon' },
    { id: '115', countryName: 'Liberia' },
    { id: '116', countryName: 'Liechtenstein' },
    { id: '117', countryName: 'Lithuania' },
    { id: '118', countryName: 'Luxembourg' },
    { id: '119', countryName: 'Macau' },
    { id: '121', countryName: 'Malaysia' },
    { id: '122', countryName: 'Malawi' },
    { id: '123', countryName: 'Maldives' },
    { id: '124', countryName: 'Maliian' },
    { id: '125', countryName: 'Malta' },
    { id: '126', countryName: 'Morocco' },
    { id: '127', countryName: 'Martinique' },
    { id: '128', countryName: 'Mauritius' },
    { id: '129', countryName: 'Mauritania' },
    { id: '130', countryName: 'Mayotte' },
    { id: '131', countryName: 'Mexico' },
    { id: '132', countryName: 'Monaco' },
    { id: '133', countryName: 'Mongolia' },
    { id: '134', countryName: 'Montserrat' },
    { id: '135', countryName: 'Mozambique' },
    { id: '136', countryName: 'Myanmar' },
    { id: '137', countryName: 'Namibia' },
    { id: '138', countryName: 'Nauru' },
    { id: '139', countryName: 'Nepal' },
    { id: '140', countryName: 'Nicaragua' },
    { id: '141', countryName: 'Niger' },
    { id: '142', countryName: 'Nigeria' },
    { id: '143', countryName: 'Niue' },
    { id: '144', countryName: 'Norway' },
    { id: '145', countryName: 'New Caledonia' },
    { id: '146', countryName: 'New Zealand' },
    { id: '147', countryName: 'Oman' },
    { id: '148', countryName: 'Uganda' },
    { id: '149', countryName: 'Uzbekistan' },
    { id: '150', countryName: 'Pakistan' },
    { id: '151', countryName: 'Palau' },
    { id: '152', countryName: 'Panama' },
    { id: '153', countryName: 'Papua New Guinea' },
    { id: '154', countryName: 'Netherlands' },
    { id: '155', countryName: 'Peru' },
    { id: '156', countryName: 'Philippines' },
    { id: '157', countryName: 'Pitcairn' },
    { id: '158', countryName: 'Poland' },
    { id: '159', countryName: 'French Polynesia' },
    { id: '160', countryName: 'Puerto Rico' },
    { id: '161', countryName: 'Portugal' },
    { id: '162', countryName: 'Qatar' },
    { id: '163', countryName: 'Syrian Arab Republic' },
    { id: '164', countryName: 'Central African Republic' },
    { id: '165', countryName: 'Republic of Korea' },
    { id: '166', countryName: 'Republic of Moldova' },
    { id: '167', countryName: 'Democratic Republic of Congo' },
    { id: '168', countryName: 'Lao Peoples Democratic Republic' },
    { id: '169', countryName: 'Dominican Republic' },
    { id: '170', countryName: 'Islamic Republic of Iran' },
    { id: '171', countryName: 'Democratic Peoples Republic of Korea' },
    { id: '172', countryName: 'Czech Republic' },
    { id: '173', countryName: 'United Republic of Tanzania' },
    { id: '174', countryName: 'Meeting' },
    { id: '175', countryName: 'United Kingdom' },
    { id: '176', countryName: 'Rwanda' },
    { id: '177', countryName: 'Western Sahara' },
    { id: '178', countryName: 'Saint Kitts and Nevis' },
    { id: '179', countryName: 'San Marino' },
    { id: '180', countryName: 'Holy See (state of Vatican City)' },
    { id: '181', countryName: 'Saint Vincent and the Grenadines' },
    { id: '182', countryName: 'Saint Helena' },
    { id: '183', countryName: 'Saint Lucia' },
    { id: '184', countryName: 'Samoa' },
    { id: '185', countryName: 'American Samoa' },
    { id: '186', countryName: 'Sao Tome and Principe' },
    { id: '187', countryName: 'Senegal' },
    { id: '188', countryName: 'Serbia and Montenegro' },
    { id: '189', countryName: 'Seychelles' },
    { id: '190', countryName: 'Sierra Leone' },
    { id: '191', countryName: 'Singapore' },
    { id: '192', countryName: 'Slovakia' },
    { id: '193', countryName: 'Slovenia' },
    { id: '194', countryName: 'Somalia' },
    { id: '195', countryName: 'Sudan' },
    { id: '196', countryName: 'Sri Lanka' },
    { id: '197', countryName: 'Sweden' },
    { id: '198', countryName: 'Suriname' },
    { id: '199', countryName: 'Swaziland' },
    { id: '200', countryName: 'Tajikistan' },
    { id: '201', countryName: 'Taiwan' },
    { id: '202', countryName: 'Chad' },
    { id: '203', countryName: 'Palestinian Territory Occupied' },
    { id: '204', countryName: 'Thailand' },
    { id: '205', countryName: 'Timor-Leste' },
    { id: '206', countryName: 'Togo' },
    { id: '207', countryName: 'Tokelau' },
    { id: '208', countryName: 'Tonga' },
    { id: '209', countryName: 'Trinidad and Tobago' },
    { id: '210', countryName: 'Tunisia' },
    { id: '211', countryName: 'Turkmenistan' },
    { id: '212', countryName: 'Turkey' },
    { id: '213', countryName: 'Tuvalu' },
    { id: '214', countryName: 'Ukraine' },
    { id: '215', countryName: 'Uruguay' },
    { id: '216', countryName: 'Vanuatu' },
    { id: '217', countryName: 'Venezuela' },
    { id: '218', countryName: 'Viet Nam' },
    { id: '219', countryName: 'Wallis and Futuna' },
    { id: '220', countryName: 'Yemen' },
    { id: '221', countryName: 'Zambia' },
    { id: '222', countryName: 'Zimbabwe' },
    { id: '223', countryName: 'Cameroon' },
    { id: '224', countryName: 'Canada' },
    { id: '225', countryName: 'Comoros' },
    { id: '226', countryName: 'Paraguay' },
    { id: '227', countryName: 'Romania' },
    { id: '229', countryName: 'Switzerland' },
    { id: '230', countryName: 'Burundi' },
    { id: '231', countryName: 'American' },
    { id: '232', countryName: 'English' },
    { id: '233', countryName: 'Andorran' },
    { id: '234', countryName: 'Bissau-Guinéenne' },
    { id: '235', countryName: 'British' },
    { id: '236', countryName: 'Burmese' },
    { id: '237', countryName: 'Scotland' },
    { id: '238', countryName: 'Welsh' },
    { id: '239', countryName: 'Hellenic' },
    { id: '240', countryName: 'Herzegovinian' },
    { id: '241', countryName: 'Hollandaise' },
    { id: '242', countryName: 'Iran' },
    { id: '243', countryName: 'Kittitian-and-nevicienne' },
    { id: '244', countryName: 'Kossovienne' },
    { id: '245', countryName: 'Laotian' },
    { id: '246', countryName: 'Macedonian' },
    { id: '247', countryName: 'Malagasy' },
    { id: '248', countryName: 'Marshallaise' },
    { id: '249', countryName: 'Micronesian' },
    { id: '250', countryName: 'Mosotho' },
    { id: '251', countryName: 'North Korea' },
    { id: '253', countryName: 'South Korea' },
    { id: '254', countryName: 'Barbudans' },
    { id: '255', countryName: 'Belarusian' },
    { id: '257', countryName: 'Brazilian' },
    { id: '258', countryName: 'Korean' },
    { id: '259', countryName: 'Ecuadorian' },
    { id: '260', countryName: 'Eritrean' },
    { id: '261', countryName: 'Spanish' },
    { id: '262', countryName: 'East Timorese' },
    { id: '263', countryName: 'Finnish' },
    { id: '264', countryName: 'Maldivan' },
    { id: '265', countryName: 'Moroccan' },
    { id: '266', countryName: 'Mauritian' },
    { id: '267', countryName: 'Moldovan' },
    { id: '268', countryName: 'Salvadoran' },
    { id: '269', countryName: 'Republic of the Congo' },
    { id: '270', countryName: 'Democratic Republic of the Congo' },
  ];

  nationalitiesFrList = [
    { id: '1', countryName: 'Française' },
    { id: '2', countryName: 'Afghan' },
    { id: '3', countryName: 'Sud-africaine' },
    { id: '4', countryName: 'Albanaise' },
    { id: '5', countryName: 'Algérienne' },
    { id: '6', countryName: 'Allemagne' },
    { id: '7', countryName: 'Angolaise' },
    { id: '8', countryName: 'Anguilla' },
    { id: '9', countryName: 'Antartique' },
    { id: '10', countryName: 'Antiguaise et barbudienne' },
    { id: '11', countryName: 'Antilles Néerlandaises' },
    { id: '12', countryName: 'Saoudienne' },
    { id: '13', countryName: 'Argentine' },
    { id: '14', countryName: 'Armenienne' },
    { id: '15', countryName: 'Aruba' },
    { id: '16', countryName: 'Australienne' },
    { id: '17', countryName: 'Autrichienne' },
    { id: '18', countryName: 'Azerbaïdjanaise' },
    { id: '19', countryName: 'Bahamienne' },
    { id: '20', countryName: 'Bahreinienne' },
    { id: '21', countryName: 'Bangladaise' },
    { id: '22', countryName: 'Barbadienne' },
    { id: '23', countryName: 'Bielorusse' },
    { id: '24', countryName: 'Belge' },
    { id: '25', countryName: 'Belizienne' },
    { id: '26', countryName: 'Beninoise' },
    { id: '27', countryName: 'Bermudes' },
    { id: '28', countryName: 'Bhoutanaise' },
    { id: '29', countryName: 'Bolivienne' },
    { id: '30', countryName: 'Bosnienne' },
    { id: '31', countryName: 'Botswanaise' },
    { id: '32', countryName: 'Brésilienne' },
    { id: '33', countryName: 'Bruneienne' },
    { id: '34', countryName: 'Bulgare' },
    { id: '35', countryName: 'Burkinabe' },
    { id: '36', countryName: 'Cambodgienne' },
    { id: '37', countryName: 'Cap-verdienne' },
    { id: '38', countryName: 'Chilienne' },
    { id: '39', countryName: 'Chinoise' },
    { id: '40', countryName: 'Chypriote' },
    { id: '41', countryName: 'Colombie' },
    { id: '42', countryName: 'Costaricienne' },
    { id: '43', countryName: 'Ivoirienne' },
    { id: '44', countryName: 'Croate' },
    { id: '45', countryName: 'Cubaine' },
    { id: '46', countryName: 'Danoise' },
    { id: '47', countryName: 'Djiboutienne' },
    { id: '48', countryName: 'Dominique' },
    { id: '49', countryName: 'Égyptienne' },
    { id: '50', countryName: 'El Salvador' },
    { id: '51', countryName: 'Emirienne' },
    { id: '52', countryName: 'Équatorienne' },
    { id: '53', countryName: 'Érythrée' },
    { id: '54', countryName: 'Espagne' },
    { id: '55', countryName: 'Estonie' },
    { id: '56', countryName: 'États Fédérés de Micronésie' },
    { id: '57', countryName: 'États-Unis' },
    { id: '58', countryName: 'Éthiopie' },
    { id: '59', countryName: 'Fédération de Russie' },
    { id: '60', countryName: 'Fidji' },
    { id: '61', countryName: 'Finlande' },
    { id: '62', countryName: 'Gabon' },
    { id: '63', countryName: 'Gambie' },
    { id: '64', countryName: 'Géorgie' },
    { id: '65', countryName: 'Ghana' },
    { id: '66', countryName: 'Gibratlar' },
    { id: '67', countryName: 'Grecque' },
    { id: '68', countryName: 'Grenade' },
    { id: '69', countryName: 'Groenland' },
    { id: '70', countryName: 'Guadeloupe' },
    { id: '71', countryName: 'Guam' },
    { id: '72', countryName: 'Guatémaltèque' },
    { id: '73', countryName: 'Guineenne' },
    { id: '74', countryName: 'Guinée-Bissau' },
    { id: '75', countryName: 'Guinée Équatoriale' },
    { id: '76', countryName: 'Guyanienne' },
    { id: '77', countryName: 'Guyane Française' },
    { id: '78', countryName: 'Haïtienne' },
    { id: '79', countryName: 'Hondurienne' },
    { id: '80', countryName: 'Hong-Kong' },
    { id: '82', countryName: 'Hongroise' },
    { id: '83', countryName: 'Île Bouvet' },
    { id: '84', countryName: 'Île Christmas' },
    { id: '85', countryName: 'Île de Man' },
    { id: '86', countryName: 'Île Norfolk' },
    { id: '87', countryName: 'Îles (malvinas) Falkland' },
    { id: '88', countryName: 'Îles Åland' },
    { id: '89', countryName: 'Îles Cocos (Keeling)' },
    { id: '90', countryName: 'Îles Cook' },
    { id: '91', countryName: 'Îles Féroé' },
    { id: '92', countryName: 'Îles Salomon' },
    { id: '93', countryName: 'Îles Turks et Caïques' },
    { id: '94', countryName: 'Îles Vierges Britanniques' },
    { id: '95', countryName: 'Îles Vierges des États-Unis' },
    { id: '96', countryName: 'Inde' },
    { id: '97', countryName: 'Indonésie' },
    { id: '98', countryName: 'Iraq' },
    { id: '99', countryName: 'Irlande' },
    { id: '100', countryName: 'Islande' },
    { id: '101', countryName: 'Israël' },
    { id: '102', countryName: 'Italie' },
    { id: '103', countryName: 'Jamahiriya Arabe Libyenne' },
    { id: '104', countryName: 'Jamaïque' },
    { id: '105', countryName: 'Japon' },
    { id: '106', countryName: 'Jordanie' },
    { id: '107', countryName: 'Kazakhstan' },
    { id: '108', countryName: 'Kenya' },
    { id: '109', countryName: 'Kirghizistan' },
    { id: '110', countryName: 'Kiribati' },
    { id: '111', countryName: 'Koweït' },
    { id: '112', countryName: 'Lesotho' },
    { id: '113', countryName: 'Lettonie' },
    { id: '114', countryName: 'Liban' },
    { id: '115', countryName: 'Libéria' },
    { id: '116', countryName: 'Liechtenstein' },
    { id: '117', countryName: 'Lituanie' },
    { id: '118', countryName: 'Luxembourg' },
    { id: '119', countryName: 'Macao' },
    { id: '121', countryName: 'Malaisie' },
    { id: '122', countryName: 'Malawi' },
    { id: '123', countryName: 'Maldives' },
    { id: '124', countryName: 'Malienne' },
    { id: '125', countryName: 'Maltaise' },
    { id: '126', countryName: 'Marocaine' },
    { id: '127', countryName: 'Martinique' },
    { id: '128', countryName: 'Maurice' },
    { id: '129', countryName: 'Mauritanienne' },
    { id: '130', countryName: 'Mayotte' },
    { id: '131', countryName: 'Mexicaine' },
    { id: '132', countryName: 'Monaco' },
    { id: '133', countryName: 'Mongole' },
    { id: '134', countryName: 'Montenegrine' },
    { id: '135', countryName: 'Mozambicaine' },
    { id: '136', countryName: 'Birmane' },
    { id: '137', countryName: 'Namibienne' },
    { id: '138', countryName: 'Nauruane' },
    { id: '139', countryName: 'Nepalaise' },
    { id: '140', countryName: 'Nicaraguayenne' },
    { id: '141', countryName: 'Niger' },
    { id: '142', countryName: 'Nigerienne' },
    { id: '143', countryName: 'Niué' },
    { id: '144', countryName: 'Norvégienne' },
    { id: '145', countryName: 'Nouvelle-Calédonie' },
    { id: '146', countryName: 'Nouvelle-Zélande' },
    { id: '147', countryName: 'Oman' },
    { id: '148', countryName: 'Ouganda' },
    { id: '149', countryName: 'Ouzbeke' },
    { id: '150', countryName: 'Pakistan' },
    { id: '151', countryName: 'Palaos' },
    { id: '152', countryName: 'Panama' },
    { id: '153', countryName: 'Papouasie-Nouvelle-Guinée' },
    { id: '154', countryName: 'Pays-Bas' },
    { id: '155', countryName: 'Pérou' },
    { id: '156', countryName: 'Philippines' },
    { id: '157', countryName: 'Pitcairn' },
    { id: '158', countryName: 'Pologne' },
    { id: '159', countryName: 'Polynésie française' },
    { id: '160', countryName: 'Porto Rico' },
    { id: '161', countryName: 'Portugal' },
    { id: '162', countryName: 'Qatar' },
    { id: '163', countryName: 'République arabe syrienne' },
    { id: '164', countryName: 'République centrafricaine' },
    { id: '165', countryName: 'République de Corée' },
    { id: '166', countryName: 'République de Moldova' },
    { id: '167', countryName: 'République Démocratique du Congo' },
    { id: '168', countryName: 'République démocratique populaire lao' },
    { id: '169', countryName: 'République Dominicaine' },
    { id: '170', countryName: 'République islamique d`Iran' },
    { id: '171', countryName: 'République Populaire Démocratique de Corée' },
    { id: '172', countryName: 'République Tchèque' },
    { id: '173', countryName: 'République-Unie de Tanzanie' },
    { id: '174', countryName: 'Réunion' },
    { id: '175', countryName: 'Royaume-Uni' },
    { id: '176', countryName: 'Rwanda' },
    { id: '177', countryName: 'Sahara Occidental' },
    { id: '178', countryName: 'Saint-Kitts-et-Nevis' },
    { id: '179', countryName: 'Saint-Mari' },
    { id: '180', countryName: 'Saint-Siège (État de la Cité du Vatican)' },
    { id: '181', countryName: 'Saint-Vincent-et-les-Grenadines' },
    { id: '182', countryName: 'Sainte-Hélène' },
    { id: '183', countryName: 'Sainte-Lucie' },
    { id: '184', countryName: 'Samoa' },
    { id: '185', countryName: 'Samoa américaines' },
    { id: '186', countryName: 'Sao Tomé et Principe' },
    { id: '187', countryName: 'Sénégal' },
    { id: '188', countryName: 'Serbie et Monténégro' },
    { id: '189', countryName: 'les Seychelles' },
    { id: '190', countryName: 'Sierra Leone' },
    { id: '191', countryName: 'Singapour' },
    { id: '192', countryName: 'Slovaquie' },
    { id: '193', countryName: 'Slovénie' },
    { id: '194', countryName: 'Somalia' },
    { id: '195', countryName: 'Soudan' },
    { id: '196', countryName: 'Sri Lanka' },
    { id: '197', countryName: 'Suède' },
    { id: '198', countryName: 'Suriname' },
    { id: '199', countryName: 'Swaziland' },
    { id: '200', countryName: 'Tadjikistan' },
    { id: '201', countryName: 'Taïwan' },
    { id: '202', countryName: 'Tchad' },
    { id: '203', countryName: 'Territoire palestinien Occupé' },
    { id: '204', countryName: 'Thaïlande' },
    { id: '205', countryName: 'Timor-Leste' },
    { id: '206', countryName: 'Togo' },
    { id: '207', countryName: 'Tokelau' },
    { id: '208', countryName: 'Tonga' },
    { id: '209', countryName: 'Trinité-et-Tobago' },
    { id: '210', countryName: 'Tunisie' },
    { id: '211', countryName: 'Turkménistan' },
    { id: '212', countryName: 'Turquie' },
    { id: '213', countryName: 'Tuvalu' },
    { id: '214', countryName: 'Ukraine' },
    { id: '215', countryName: 'Uruguay' },
    { id: '216', countryName: 'Vanuatu' },
    { id: '217', countryName: 'Venezuela' },
    { id: '218', countryName: 'Viet Nam' },
    { id: '219', countryName: 'Wallis and Futuna' },
    { id: '220', countryName: 'Yémen' },
    { id: '221', countryName: 'Zambia' },
    { id: '222', countryName: 'Zimbabwe' },
    { id: '223', countryName: 'Camerounaise' },
    { id: '224', countryName: 'Canadienne' },
    { id: '225', countryName: 'Comorienne' },
    { id: '226', countryName: 'Paraguayenne' },
    { id: '227', countryName: 'Roumaine' },
    { id: '229', countryName: 'Suisse' },
    { id: '230', countryName: 'Burundaise' },
    { id: '231', countryName: 'Américaine' },
    { id: '232', countryName: 'Anglaise' },
    { id: '233', countryName: 'Andorrane' },
    { id: '234', countryName: 'Bissau-Guinéenne' },
    { id: '235', countryName: 'Britannique' },
    { id: '236', countryName: 'Burmese' },
    { id: '237', countryName: 'Écossais' },
    { id: '238', countryName: 'Gallois' },
    { id: '239', countryName: 'Hellenique' },
    { id: '240', countryName: 'Herzegoviniese' },
    { id: '241', countryName: 'HollandHollandaiseaise' },
    { id: '242', countryName: 'Iraniese' },
    { id: '243', countryName: 'Kittitienne-et-nevicienne' },
    { id: '244', countryName: 'Kossovienne' },
    { id: '245', countryName: 'Laotienne' },
    { id: '246', countryName: 'Macedonienne' },
    { id: '247', countryName: 'Malgache' },
    { id: '248', countryName: 'Marshallaise' },
    { id: '249', countryName: 'Micronesienne' },
    { id: '250', countryName: 'Mosotho' },
    { id: '251', countryName: 'Nord-coréenne' },
    { id: '253', countryName: 'Sud-coréenne' },
    { id: '254', countryName: 'Barbudaine' },
    { id: '255', countryName: 'Belarusian' },
    { id: '257', countryName: 'Brazilian' },
    { id: '258', countryName: 'Coréenne' },
    { id: '259', countryName: 'Équatorienne' },
    { id: '260', countryName: 'Erythreenne' },
    { id: '261', countryName: 'Espagnole' },
    { id: '262', countryName: 'Est-timoraise' },
    { id: '263', countryName: 'Finnish' },
    { id: '264', countryName: 'Maldivienne' },
    { id: '265', countryName: 'Marocaine' },
    { id: '266', countryName: 'Mauritian' },
    { id: '267', countryName: 'Mauricienne' },
    { id: '268', countryName: 'Salvadorienne' },
    { id: '269', countryName: 'République du Congo' },
    { id: '270', countryName: ' République Démocratique du Congo' },
  ];

  // To detect change in student card
  // data when click on rncp title card
  triggerStudentCardSource = new BehaviorSubject<number>(0);
  triggerStudentCard$ = this.triggerStudentCardSource.asObservable();

  triggerStudentSummary = new BehaviorSubject<boolean>(false);
  triggerStudentSummary$ = this.triggerStudentSummary.asObservable();

  triggerStudentCardPosition = new BehaviorSubject<number>(0);
  triggerStudentCardPosition$ = this.triggerStudentCardPosition.asObservable();

  constructor(private httpClient: HttpClient, private apollo: Apollo, private translate: TranslateService) {}
  updateStudentCard(isUpdate: boolean) {
    if (isUpdate) {
      this.triggerStudentCardSource.next(this.triggerStudentCardSource.value + 1);
    }
  }
  updateStudentCardPosition(data: any) {
    if (data) {
      this.triggerStudentCardPosition.next(data);
    }
  }

  refreshStudentSummaryCard(value: boolean) {
    this.triggerStudentSummary.next(value);
  }

  resetStudentCardTrigger(isReset: boolean) {
    if (isReset) {
      this.triggerStudentCardSource.next(0);
    }
  }

  resetStudentCardPosition(isReset: boolean) {
    if (isReset) {
      this.triggerStudentCardPosition.next(0);
    }
  }

  getStudentId(userId): Observable<any> {
    return this.apollo
      .query({
        query: gql`
        query{
          GetOneUser(_id:"${userId}"){
              _id
              student_id {
                  _id
                  rncp_title {
                    _id
                    short_name
                  }
                  current_class {
                    _id
                    name
                  }
              }
              email
          }
        }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetOneUser']));
  }

  getStudentSchool(studentId): Observable<any> {
    return this.apollo
      .query({
        query: gql`
        query{
          GetOneStudent(_id:"${studentId}"){
            
          }
        }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetOneUser']));
  }

  // @Cacheable()
  getAllStudents(pagination, sortValue, filter): Observable<any[]> {
    return this.apollo
      .watchQuery<any[]>({
        query: gql`
          query GetAllStudents($pagination: PaginationInput, $sort: StudentSorting) {
            GetAllStudents(pagination: $pagination, sorting: $sort, ${filter}) {
              count_document
              incorrect_email
              _id
              civility
              first_name
              last_name
              email
              photo
              is_photo_in_s3
              photo_s3_path
              is_thumbups_green
              status
              school {
                _id
                short_name
              }
              rncp_title {
                _id
                short_name
              }
              current_class {
                _id
                name
              }
              final_transcript_id {
                _id
                status
                final_transcript_status
                certification_status
                jury_decision_for_final_transcript
                input_final_decision_status
                is_validated
                student_decision
                after_final_retake_decision
                has_jury_finally_decided
                retake_test_for_students {
                  test_id {
                    _id
                  }
                }
              }
              corrected_tests {
                correction {
                  correction_grid {
                    correction {
                      additional_total
                      total
                    }
                  }
                  expected_documents {
                    validation_status
                    document {
                      s3_file_name
                    }
                  }
                  mark_entry_document {
                    s3_file_name
                  }
                }
                test {
                  expected_documents {
                    document_name
                  }
                  correction_status_for_schools {
                    correction_status
                  }
                  correction_grid {
                    correction {
                      total_zone {
                        display_additional_total
                      }
                    }
                  }
                  evaluation_id {
                    _id
                  }
                }
              }
              companies {
                mentor {
                  _id
                  first_name
                  last_name
                  civility
                  email
                }
              }
              user_id {
                _id
              }
              job_description_id {
                _id
                job_name
                job_description_status
              }
              problematic_id {
                _id
                problematic_status
              }
              mentor_evaluation_id {
                _id
                mentor_evaluation_status
              }
              employability_survey_ids {
                _id
                survey_status
                validator
              }
            }
          }
        `,
        variables: {
          pagination,
          sort: sortValue ? sortValue : {},
        },
        fetchPolicy: 'network-only',
      })
      .valueChanges.pipe(map((resp) => resp.data['GetAllStudents']));
  }
  getAllStudentsActive(pagination, sortValue, filter): Observable<any[]> {
    return this.apollo
      .watchQuery<any[]>({
        query: gql`
          query GetAllStudents($pagination: PaginationInput, $sort: StudentSorting) {
            GetAllStudents(pagination: $pagination, sorting: $sort, ${filter}, status: active_pending, group_details: true) {
              group_details {
                name
                test {
                  name
                }
              }
              count_document
              incorrect_email
              _id
              civility
              first_name
              last_name
              email
              photo
              date_of_birth
              place_of_birth
              tele_phone
              academic_journey_id {
                diplomas {
                  diploma_photo
                }
              }
              createdAt
              certificate_issuance_status
              identity_verification_status
              is_photo_in_s3
              photo_s3_path
              is_thumbups_green
              status
              student_title_status
              school {
                _id
                short_name
              }
              rncp_title {
                _id
                short_name
              }
              current_class {
                _id
                name
              }
              final_transcript_id {
                _id
                status
                final_transcript_status
                certification_status
                jury_decision_for_final_transcript
                input_final_decision_status
                is_validated
                student_decision
                after_final_retake_decision
                has_jury_finally_decided
                retake_test_for_students {
                  test_id {
                    _id
                  }
                }
              }
              user_id {
                _id
              }
              job_description_id {
                _id
                job_name
                job_description_status
              }
              problematic_id {
                _id
                problematic_status
              }
              mentor_evaluation_id {
                _id
                mentor_evaluation_status
              }
              employability_survey_ids {
                _id
                survey_status
                validator
              }
              soft_skill_pro_evaluation {
                status
              }
              academic_pro_evaluation {
                status
              }
              specialization {
                _id
                name
                is_specialization_assigned
                is_specialization_assigned_to_block
              }
              companies {
                company {
                  _id
                  company_name
                }
                status
                mentor {
                  _id
                  first_name
                  last_name
                  civility
                  email
                }
                category_insertion
                type_of_formation
              }
            }
          }
        `,
        variables: {
          pagination,
          sort: sortValue ? sortValue : {},
        },
        fetchPolicy: 'network-only',
      })
      .valueChanges.pipe(map((resp) => resp.data['GetAllStudents']));
  }
  getAllStudentsProblematic(pagination, sortValue, filter, schoolId, rncpId, userId): Observable<any[]> {
    return this.apollo
      .watchQuery<any[]>({
        query: gql`
          query GetAllStudents($pagination: PaginationInput, $sort: StudentSorting) {
            GetAllStudents(pagination: $pagination, sorting: $sort, ${filter ? filter : ''},
              status: active_completed,
              is_corrector_problematic: true
              ) {
              group_details {
                name
                test {
                  name
                }
              }
              count_document
              incorrect_email
              _id
              civility
              first_name
              last_name
              email
              photo
              date_of_birth
              place_of_birth
              tele_phone
              academic_journey_id {
                diplomas {
                  diploma_photo
                }
              }
              createdAt
              certificate_issuance_status
              identity_verification_status
              is_photo_in_s3
              photo_s3_path
              is_thumbups_green
              status
              student_title_status
              school {
                _id
                short_name
              }
              rncp_title {
                _id
                short_name
              }
              current_class {
                _id
                name
              }
              final_transcript_id {
                _id
                status
                final_transcript_status
                certification_status
                jury_decision_for_final_transcript
                input_final_decision_status
                is_validated
                student_decision
                after_final_retake_decision
                has_jury_finally_decided
                retake_test_for_students {
                  test_id {
                    _id
                  }
                }
              }
              user_id {
                _id
              }
              job_description_id {
                _id
                job_name
                job_description_status
              }
              problematic_id {
                _id
                problematic_status
              }
              mentor_evaluation_id {
                _id
                mentor_evaluation_status
              }
              employability_survey_ids {
                _id
                survey_status
                validator
              }
              soft_skill_pro_evaluation {
                status
              }
              academic_pro_evaluation {
                status
              }
              companies {
                company {
                  _id
                  company_name
                }
                status
                mentor {
                  _id
                  first_name
                  last_name
                  civility
                  email
                }
              }
            }
          }
        `,
        variables: {
          pagination,
          sort: sortValue ? sortValue : {},
        },
        fetchPolicy: 'network-only',
      })
      .valueChanges.pipe(map((resp) => resp.data['GetAllStudents']));
  }
  getAllStudentsCompleted(pagination, sortValue, filter): Observable<any[]> {
    return this.apollo
      .watchQuery<any[]>({
        query: gql`
          query GetAllStudents($pagination: PaginationInput, $sort: StudentSorting, $filter: FilterStudent) {
            GetAllStudents(pagination: $pagination, sorting: $sort, filter: $filter, status: completed, group_details: true) {
              group_details {
                name
                test {
                  name
                }
              }
              count_document
              is_thumbups_green
              incorrect_email
              _id
              civility
              first_name
              last_name
              email
              photo
              date_of_birth
              place_of_birth
              tele_phone
              student_title_status
              academic_journey_id {
                diplomas {
                  diploma_photo
                }
              }
              createdAt
              certificate_issuance_status
              identity_verification_status
              is_photo_in_s3
              photo_s3_path
              status
              school {
                _id
                short_name
              }
              rncp_title {
                _id
                short_name
              }
              current_class {
                _id
                name
              }
              soft_skill_pro_evaluation {
                status
              }
              academic_pro_evaluation {
                status
              }
              final_transcript_id {
                _id
                status
                final_transcript_status
                certification_status
                jury_decision_for_final_transcript
                input_final_decision_status
                is_validated
                student_decision
                after_final_retake_decision
                has_jury_finally_decided
                retake_test_for_students {
                  test_id {
                    _id
                  }
                }
              }
              user_id {
                _id
              }
              employability_survey_ids {
                _id
                survey_status
                validator
              }
              job_description_id {
                _id
                job_name
                job_description_status
              }
              problematic_id {
                _id
                problematic_status
              }
              mentor_evaluation_id {
                _id
                mentor_evaluation_status
              }
              specialization {
                _id
                name
              }
              companies {
                company {
                  _id
                  company_name
                }
                status
                mentor {
                  _id
                  first_name
                  last_name
                  civility
                  email
                }
              }
            }
          }
        `,
        variables: {
          pagination,
          sort: sortValue ? sortValue : {},
          filter: filter ? filter : {},
        },
        fetchPolicy: 'network-only',
      })
      .valueChanges.pipe(map((resp) => resp.data['GetAllStudents']));
  }
  getAllStudentsSuspended(pagination, sortValue, filter): Observable<any[]> {
    return this.apollo
      .watchQuery<any[]>({
        query: gql`
          query GetAllStudents($pagination: PaginationInput, $sort: StudentSorting, $filter: FilterStudent) {
            GetAllStudents(pagination: $pagination, sorting: $sort, filter: $filter, status: suspended) {
              group_details {
                name
                test {
                  name
                }
              }
              count_document
              incorrect_email
              _id
              civility
              first_name
              last_name
              email
              photo
              date_of_birth
              place_of_birth
              tele_phone
              academic_journey_id {
                diplomas {
                  diploma_photo
                }
              }
              createdAt
              certificate_issuance_status
              identity_verification_status
              is_photo_in_s3
              photo_s3_path
              is_thumbups_green
              reason_for_resignation
              date_of_resignation
              status
              student_title_status
              school {
                _id
                short_name
              }
              soft_skill_pro_evaluation {
                status
              }
              academic_pro_evaluation {
                status
              }
              rncp_title {
                _id
                short_name
              }
              current_class {
                _id
                name
              }
              final_transcript_id {
                _id
                status
                final_transcript_status
                certification_status
                jury_decision_for_final_transcript
                input_final_decision_status
                is_validated
                student_decision
                after_final_retake_decision
                has_jury_finally_decided
                retake_test_for_students {
                  test_id {
                    _id
                  }
                }
              }
              user_id {
                _id
              }
              job_description_id {
                _id
                job_name
                job_description_status
              }
              problematic_id {
                _id
                problematic_status
              }
              mentor_evaluation_id {
                _id
                mentor_evaluation_status
              }
              employability_survey_ids {
                _id
                survey_status
                validator
              }
              specialization {
                _id
                name
              }
              companies {
                company {
                  _id
                  company_name
                }
                status
                mentor {
                  _id
                  first_name
                  last_name
                  civility
                  email
                }
              }
            }
          }
        `,
        variables: {
          pagination,
          sort: sortValue ? sortValue : {},
          filter: filter || {},
        },
        fetchPolicy: 'network-only',
      })
      .valueChanges.pipe(map((resp) => resp.data['GetAllStudents']));
  }
  getAllStudentDeactivated(pagination, sortValue, filter): Observable<StudentTableData[]> {
    return this.apollo
      .query<StudentTableData[]>({
        query: gql`
          query GetDeactivatedStudents($pagination: PaginationInput, $sort: StudentSorting, $filter: FilterDeactivatedStudent) {
            GetDeactivatedStudents(pagination: $pagination, sorting: $sort, filter: $filter) {
              group_details {
                name
                test {
                  name
                }
              }
              count_document
              incorrect_email
              _id
              civility
              first_name
              last_name
              email
              photo
              date_of_birth
              place_of_birth
              tele_phone
              academic_journey_id {
                diplomas {
                  diploma_photo
                }
              }
              createdAt
              certificate_issuance_status
              identity_verification_status
              is_photo_in_s3
              photo_s3_path
              is_thumbups_green
              reason_for_resignation
              date_of_resignation
              status
              student_title_status
              school {
                _id
                short_name
              }
              rncp_title {
                _id
                short_name
              }
              current_class {
                _id
                name
              }
              final_transcript_id {
                _id
                status
                final_transcript_status
                certification_status
                jury_decision_for_final_transcript
                input_final_decision_status
                is_validated
                student_decision
                after_final_retake_decision
                has_jury_finally_decided
                retake_test_for_students {
                  test_id {
                    _id
                  }
                }
              }
              user_id {
                _id
              }
              soft_skill_pro_evaluation {
                status
              }
              academic_pro_evaluation {
                status
              }
              job_description_id {
                _id
                job_name
                job_description_status
              }
              problematic_id {
                _id
                problematic_status
              }
              mentor_evaluation_id {
                _id
                mentor_evaluation_status
              }
              employability_survey_ids {
                _id
                survey_status
                validator
              }
              specialization {
                _id
                name
              }
              companies {
                company {
                  _id
                  company_name
                }
                status
                mentor {
                  _id
                  first_name
                  last_name
                  civility
                  email
                }
              }
            }
          }
        `,
        variables: {
          pagination,
          sort: sortValue ? sortValue : {},
          filter: filter || {},
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetDeactivatedStudents']));
  }

  getAllStudentsExport(filter): Observable<StudentTableData[]> {
    return this.apollo
      .watchQuery<StudentTableData[]>({
        query: gql`
          query {
            GetAllStudents(${filter}, status: active_pending) {
              count_document
              _id
              civility
              first_name
              last_name
              email
              photo
              date_of_birth
              place_of_birth
              createdAt
              certificate_issuance_status
identity_verification_status
              is_photo_in_s3
              photo_s3_path
              is_thumbups_green
              status
              school {
                _id
                short_name
              }
              rncp_title {
                _id
                short_name
              }
              current_class {
                _id
                name
              }
              final_transcript_id {
                _id
                status
                final_transcript_status
                certification_status
                jury_decision_for_final_transcript
                input_final_decision_status
                is_validated
                student_decision
                after_final_retake_decision
                has_jury_finally_decided
                retake_test_for_students {
                  test_id {
                    _id
                  }
                }
              }
              corrected_tests {
                correction {
                  correction_grid {
                    correction {
                      additional_total
                      total
                    }
                  }
                  expected_documents {
                    validation_status
                    document {
                      s3_file_name
                    }
                  }
                  mark_entry_document {
                    s3_file_name
                  }
                }
                test {
                  expected_documents {
                    document_name
                  }
                  correction_status_for_schools {
                    correction_status
                  }
                  correction_grid {
                    correction {
                      total_zone {
                        display_additional_total
                      }
                    }
                  }
                  evaluation_id {
                    _id
                  }
                }
              }
              soft_skill_pro_evaluation {
                status
              }
              academic_pro_evaluation {
                status
              }
              companies {
                company {
                  _id
                  company_name
                }
                status
                mentor {
                  _id
                  first_name
                  last_name
                  civility
                  email
                }
              }
              user_id {
                _id
              }
              job_description_id {
                _id
                job_name
                job_description_status
              }
              problematic_id {
                _id
                problematic_status
              }
              mentor_evaluation_id {
                _id
                mentor_evaluation_status
              }
              employability_survey_ids {
                _id
                survey_status
                validator
              }
            }
          }
        `,
        fetchPolicy: 'network-only',
      })
      .valueChanges.pipe(map((resp) => resp.data['GetAllStudents']));
  }
  getAllStudentsExportComplete(filter): Observable<StudentTableData[]> {
    return this.apollo
      .watchQuery<StudentTableData[]>({
        query: gql`
          query {
            GetAllStudents(${filter}, status: completed) {
              count_document
              _id
              civility
              first_name
              last_name
              email
              photo
              date_of_birth
              place_of_birth
              createdAt
              certificate_issuance_status
identity_verification_status
              is_photo_in_s3
              photo_s3_path
              is_thumbups_green
              status
              school {
                _id
                short_name
              }
              rncp_title {
                _id
                short_name
              }
              current_class {
                _id
                name
              }
              final_transcript_id {
                _id
                status
                final_transcript_status
                certification_status
                jury_decision_for_final_transcript
                input_final_decision_status
                is_validated
                student_decision
                after_final_retake_decision
                has_jury_finally_decided
                retake_test_for_students {
                  test_id {
                    _id
                  }
                }
              }
              soft_skill_pro_evaluation {
                status
              }
              academic_pro_evaluation {
                status
              }
              corrected_tests {
                correction {
                  correction_grid {
                    correction {
                      additional_total
                      total
                    }
                  }
                  expected_documents {
                    validation_status
                    document {
                      s3_file_name
                    }
                  }
                  mark_entry_document {
                    s3_file_name
                  }
                }
                test {
                  expected_documents {
                    document_name
                  }
                  correction_status_for_schools {
                    correction_status
                  }
                  correction_grid {
                    correction {
                      total_zone {
                        display_additional_total
                      }
                    }
                  }
                  evaluation_id {
                    _id
                  }
                }
              }
              companies {
                company {
                  _id
                  company_name
                }
                status
                mentor {
                  _id
                  first_name
                  last_name
                  civility
                  email
                }
              }
              user_id {
                _id
              }
              job_description_id {
                _id
                job_name
                job_description_status
              }
              problematic_id {
                _id
                problematic_status
              }
              mentor_evaluation_id {
                _id
                mentor_evaluation_status
              }
              employability_survey_ids {
                _id
                survey_status
                validator
              }
              previous_courses_id {
                rncp_id {
                  _id
                  short_name
                }
              }
            }
          }
        `,
        fetchPolicy: 'network-only',
      })
      .valueChanges.pipe(map((resp) => resp.data['GetAllStudents']));
  }
  getAllStudentsExportSuspended(filter): Observable<StudentTableData[]> {
    return this.apollo
      .watchQuery<StudentTableData[]>({
        query: gql`
          query {
            GetAllStudents(${filter}, status: suspended) {
              count_document
              _id
              civility
              first_name
              last_name
              email
              photo
              is_photo_in_s3
              photo_s3_path
              is_thumbups_green
              reason_for_resignation
              date_of_resignation
              status
              school {
                _id
                short_name
              }
              rncp_title {
                _id
                short_name
              }
              current_class {
                _id
                name
              }
              soft_skill_pro_evaluation {
                status
              }
              academic_pro_evaluation {
                status
              }
              final_transcript_id {
                _id
                status
                final_transcript_status
                certification_status
                jury_decision_for_final_transcript
                input_final_decision_status
                is_validated
                student_decision
                after_final_retake_decision
                has_jury_finally_decided
                retake_test_for_students {
                  test_id {
                    _id
                  }
                }
              }
              corrected_tests {
                correction {
                  correction_grid {
                    correction {
                      additional_total
                      total
                    }
                  }
                  expected_documents {
                    validation_status
                    document {
                      s3_file_name
                    }
                  }
                  mark_entry_document {
                    s3_file_name
                  }
                }
                test {
                  expected_documents {
                    document_name
                  }
                  correction_status_for_schools {
                    correction_status
                  }
                  correction_grid {
                    correction {
                      total_zone {
                        display_additional_total
                      }
                    }
                  }
                  evaluation_id {
                    _id
                  }
                }
              }
              companies {
                company {
                  _id
                  company_name
                }
                status
                mentor {
                  _id
                  first_name
                  last_name
                  civility
                  email
                }
              }
              user_id {
                _id
              }
              job_description_id {
                _id
                job_name
                job_description_status
              }
              problematic_id {
                _id
                problematic_status
              }
              mentor_evaluation_id {
                _id
                mentor_evaluation_status
              }
              employability_survey_ids {
                _id
                survey_status
                validator
              }
            }
          }
        `,
        fetchPolicy: 'network-only',
      })
      .valueChanges.pipe(map((resp) => resp.data['GetAllStudents']));
  }
  getAllStudentsExportDeactivated(filter): Observable<StudentTableData[]> {
    return this.apollo
      .watchQuery<StudentTableData[]>({
        query: gql`
          query {
            GetDeactivatedStudents(${filter}) {
              count_document
              _id
              civility
              first_name
              last_name
              email
              photo
              is_photo_in_s3
              photo_s3_path
              is_thumbups_green
              reason_for_resignation
              date_of_resignation
              status
              school {
                _id
                short_name
              }
              rncp_title {
                _id
                short_name
              }
              current_class {
                _id
                name
              }
              soft_skill_pro_evaluation {
                status
              }
              academic_pro_evaluation {
                status
              }
              final_transcript_id {
                _id
                status
                final_transcript_status
                certification_status
                jury_decision_for_final_transcript
                input_final_decision_status
                is_validated
                student_decision
                after_final_retake_decision
                has_jury_finally_decided
                retake_test_for_students {
                  test_id {
                    _id
                  }
                }
              }
              corrected_tests {
                correction {
                  correction_grid {
                    correction {
                      additional_total
                      total
                    }
                  }
                  expected_documents {
                    validation_status
                    document {
                      s3_file_name
                    }
                  }
                  mark_entry_document {
                    s3_file_name
                  }
                }
                test {
                  expected_documents {
                    document_name
                  }
                  correction_status_for_schools {
                    correction_status
                  }
                  correction_grid {
                    correction {
                      total_zone {
                        display_additional_total
                      }
                    }
                  }
                  evaluation_id {
                    _id
                  }
                }
              }
              companies {
                company {
                  _id
                  company_name
                }
                status
                mentor {
                  _id
                  first_name
                  last_name
                  civility
                  email
                }
              }
              user_id {
                _id
              }
              job_description_id {
                _id
                job_name
                job_description_status
              }
              problematic_id {
                _id
                problematic_status
              }
              mentor_evaluation_id {
                _id
                mentor_evaluation_status
              }
              employability_survey_ids {
                _id
                survey_status
                validator
              }
            }
          }
        `,
        fetchPolicy: 'network-only',
      })
      .valueChanges.pipe(map((resp) => resp.data['GetDeactivatedStudents']));
  }

  getAllStudentsChiefGroup(pagination, school_ids, sortValue, filter): Observable<StudentTableData[]> {
    return this.apollo
      .watchQuery<StudentTableData[]>({
        query: gql`
          query GetAllStudentsChiefGroup($pagination: PaginationInput, $school_ids: [ID], $sort: StudentSorting) {
            GetAllStudents(
              pagination: $pagination,
              school_ids: $school_ids,
              sorting: $sort, ${filter},
              status: active_pending,
              group_details: true
            ) {
              group_details {
                name
                test {
                  name
                }
              }
              count_document
              incorrect_email
              _id
              civility
              first_name
              last_name
              email
              photo
              date_of_birth
              place_of_birth
              tele_phone
              student_title_status
              academic_journey_id {
                diplomas {
                  diploma_photo
                }
              }
              soft_skill_pro_evaluation {
                status
              }
              academic_pro_evaluation {
                status
              }
              createdAt
              certificate_issuance_status
              identity_verification_status
              is_photo_in_s3
              photo_s3_path
              is_thumbups_green
              status
              school {
                _id
                short_name
              }
              rncp_title {
                _id
                short_name
              }
              current_class {
                _id
                name
              }
              final_transcript_id {
                _id
                status
                final_transcript_status
                certification_status
                jury_decision_for_final_transcript
                input_final_decision_status
                is_validated
                student_decision
                after_final_retake_decision
                has_jury_finally_decided
                retake_test_for_students {
                  test_id {
                    _id
                  }
                }
              }
              user_id {
                _id
              }
              job_description_id {
                _id
                job_name
                job_description_status
              }
              problematic_id {
                _id
                problematic_status
              }
              mentor_evaluation_id {
                _id
                mentor_evaluation_status
              }
              employability_survey_ids {
                _id
                survey_status
                validator
              }
              specialization {
                _id
                name
                is_specialization_assigned
                is_specialization_assigned_to_block
              }
              companies {
                company {
                  _id
                  company_name
                }
                status
                mentor {
                  _id
                  first_name
                  last_name
                  civility
                  email
                }
                category_insertion
                type_of_formation
              }
            }
          }
        `,
        variables: {
          pagination,
          sort: sortValue ? sortValue : {},
          school_ids,
        },
        fetchPolicy: 'network-only',
      })
      .valueChanges.pipe(map((resp) => resp.data['GetAllStudents']));
  }
  getAllStudentsChiefGroupCompleted(pagination, school_ids, sortValue, filter): Observable<StudentTableData[]> {
    return this.apollo
      .watchQuery<StudentTableData[]>({
        query: gql`
          query GetAllStudentsChiefGroup($pagination: PaginationInput, $school_ids: [ID], $sort: StudentSorting, $filter: FilterStudent) {
            GetAllStudents(
              pagination: $pagination
              school_ids: $school_ids
              sorting: $sort
              filter: $filter
              status: completed
              group_details: true
            ) {
              group_details {
                name
                test {
                  name
                }
              }
              count_document
              is_thumbups_green
              incorrect_email
              _id
              civility
              first_name
              last_name
              email
              photo
              date_of_birth
              place_of_birth
              tele_phone
              student_title_status
              academic_journey_id {
                diplomas {
                  diploma_photo
                }
              }
              soft_skill_pro_evaluation {
                status
              }
              academic_pro_evaluation {
                status
              }
              createdAt
              certificate_issuance_status
              identity_verification_status
              is_photo_in_s3
              photo_s3_path
              status
              school {
                _id
                short_name
              }
              previous_courses_id {
                rncp_id {
                  _id
                  short_name
                }
              }
              rncp_title {
                _id
                short_name
              }
              current_class {
                _id
                name
              }
              final_transcript_id {
                _id
                status
                final_transcript_status
                certification_status
                jury_decision_for_final_transcript
                input_final_decision_status
                is_validated
                student_decision
                after_final_retake_decision
                has_jury_finally_decided
                retake_test_for_students {
                  test_id {
                    _id
                  }
                }
              }
              user_id {
                _id
              }
              employability_survey_ids {
                _id
                survey_status
                validator
              }
              job_description_id {
                _id
                job_name
                job_description_status
              }
              problematic_id {
                _id
                problematic_status
              }
              mentor_evaluation_id {
                _id
                mentor_evaluation_status
              }
              specialization {
                _id
                name
              }
              companies {
                company {
                  _id
                  company_name
                }
                status
                mentor {
                  _id
                  first_name
                  last_name
                  civility
                  email
                }
              }
            }
          }
        `,
        variables: {
          pagination,
          sort: sortValue ? sortValue : {},
          school_ids,
          filter: filter || {},
        },
        fetchPolicy: 'network-only',
      })
      .valueChanges.pipe(map((resp) => resp.data['GetAllStudents']));
  }
  getAllStudentsChiefGroupSuspended(pagination, school_ids, sortValue, filter): Observable<StudentTableData[]> {
    return this.apollo
      .watchQuery<StudentTableData[]>({
        query: gql`
          query GetAllStudentsChiefGroup($pagination: PaginationInput, $school_ids: [ID], $sort: StudentSorting, $filter: FilterStudent) {
            GetAllStudents(pagination: $pagination, school_ids: $school_ids, sorting: $sort, filter: $filter, status: suspended) {
              group_details {
                name
                test {
                  name
                }
              }
              count_document
              incorrect_email
              _id
              civility
              first_name
              last_name
              email
              photo
              date_of_birth
              place_of_birth
              tele_phone
              academic_journey_id {
                diplomas {
                  diploma_photo
                }
              }
              createdAt
              certificate_issuance_status
              identity_verification_status
              is_photo_in_s3
              photo_s3_path
              is_thumbups_green
              reason_for_resignation
              date_of_resignation
              status
              student_title_status
              school {
                _id
                short_name
              }
              rncp_title {
                _id
                short_name
              }
              current_class {
                _id
                name
              }
              soft_skill_pro_evaluation {
                status
              }
              academic_pro_evaluation {
                status
              }
              final_transcript_id {
                _id
                status
                final_transcript_status
                certification_status
                jury_decision_for_final_transcript
                input_final_decision_status
                is_validated
                student_decision
                after_final_retake_decision
                has_jury_finally_decided
                retake_test_for_students {
                  test_id {
                    _id
                  }
                }
              }
              user_id {
                _id
              }
              job_description_id {
                _id
                job_name
                job_description_status
              }
              problematic_id {
                _id
                problematic_status
              }
              mentor_evaluation_id {
                _id
                mentor_evaluation_status
              }
              employability_survey_ids {
                _id
                survey_status
                validator
              }
              specialization {
                _id
                name
              }
              companies {
                company {
                  _id
                  company_name
                }
                status
                mentor {
                  _id
                  first_name
                  last_name
                  civility
                  email
                }
              }
            }
          }
        `,
        variables: {
          pagination,
          sort: sortValue ? sortValue : {},
          school_ids,
          filter: filter || {},
        },
        fetchPolicy: 'network-only',
      })
      .valueChanges.pipe(map((resp) => resp.data['GetAllStudents']));
  }
  getAllStudentsChiefGroupDeactivated(pagination, school_ids, sortValue, filter): Observable<StudentTableData[]> {
    return this.apollo
      .watchQuery<StudentTableData[]>({
        query: gql`
          query GetAllStudentsChiefGroup($pagination: PaginationInput, $school_ids: [ID], $sort: StudentSorting, $filter: FilterDeactivatedStudent) {
            GetDeactivatedStudents(pagination: $pagination, school_ids: $school_ids, sorting: $sort, filter: $filter) {
              group_details {
                name
                test {
                  name
                }
              }
              count_document
              incorrect_email
              _id
              civility
              first_name
              last_name
              email
              photo
              date_of_birth
              place_of_birth
              tele_phone
              academic_journey_id {
                diplomas {
                  diploma_photo
                }
              }
              createdAt
              certificate_issuance_status
              identity_verification_status
              is_photo_in_s3
              photo_s3_path
              is_thumbups_green
              reason_for_resignation
              date_of_resignation
              status
              student_title_status
              school {
                _id
                short_name
              }
              rncp_title {
                _id
                short_name
              }
              current_class {
                _id
                name
              }
              soft_skill_pro_evaluation {
                status
              }
              academic_pro_evaluation {
                status
              }
              final_transcript_id {
                _id
                status
                final_transcript_status
                certification_status
                jury_decision_for_final_transcript
                input_final_decision_status
                is_validated
                student_decision
                after_final_retake_decision
                has_jury_finally_decided
                retake_test_for_students {
                  test_id {
                    _id
                  }
                }
              }
              user_id {
                _id
              }
              job_description_id {
                _id
                job_name
                job_description_status
              }
              problematic_id {
                _id
                problematic_status
              }
              mentor_evaluation_id {
                _id
                mentor_evaluation_status
              }
              employability_survey_ids {
                _id
                survey_status
                validator
              }
              specialization {
                _id
                name
              }
              companies {
                company {
                  _id
                  company_name
                }
                status
                mentor {
                  _id
                  first_name
                  last_name
                  civility
                  email
                }
              }
            }
          }
        `,
        variables: {
          pagination,
          sort: sortValue ? sortValue : {},
          school_ids,
          filter: filter || {},
        },
        fetchPolicy: 'network-only',
      })
      .valueChanges.pipe(map((resp) => resp.data['GetDeactivatedStudents']));
  }

  getAllStudentsCR(pagination, sortValue, filter): Observable<StudentTableData[]> {
    return this.apollo
      .watchQuery<StudentTableData[]>({
        query: gql`
          query GetAllStudentsCR($pagination: PaginationInput, $sort: StudentSorting) {
            GetAllStudents(pagination: $pagination, ${filter}, sorting: $sort, status: active_pending, group_details: true) {
              group_details {
                name
                test {
                  name
                }
              }
              count_document
              incorrect_email
              _id
              civility
              first_name
              last_name
              photo
              email
              date_of_birth
              place_of_birth
              tele_phone
              student_title_status
              academic_journey_id {
                diplomas {
                  diploma_photo
                }
              }
              createdAt
              certificate_issuance_status
              identity_verification_status
              is_photo_in_s3
              photo_s3_path
              is_thumbups_green
              status
              school {
                _id
                short_name
              }
              rncp_title {
                _id
                short_name
              }
              current_class {
                _id
                name
              }
              soft_skill_pro_evaluation {
                status
              }
              academic_pro_evaluation {
                status
              }
              final_transcript_id {
                _id
                status
                final_transcript_status
                certification_status
                jury_decision_for_final_transcript
                input_final_decision_status
                is_validated
                student_decision
                after_final_retake_decision
                has_jury_finally_decided
                retake_test_for_students {
                  test_id {
                    _id
                  }
                }
              }
              user_id {
                _id
              }
              job_description_id {
                _id
                job_name
                job_description_status
              }
              problematic_id {
                _id
                problematic_status
              }
              mentor_evaluation_id {
                _id
                mentor_evaluation_status
              }
              employability_survey_ids {
                _id
                survey_status
                validator
              }
              specialization {
                _id
                name
                is_specialization_assigned
                is_specialization_assigned_to_block
              }
              companies {
                company {
                  _id
                  company_name
                }
                status
                mentor {
                  _id
                  first_name
                  last_name
                  civility
                  email
                }
                category_insertion
                type_of_formation
              }
            }
          }
        `,
        variables: {
          pagination,
          sort: sortValue ? sortValue : {},
        },
        fetchPolicy: 'network-only',
      })
      .valueChanges.pipe(map((resp) => resp.data['GetAllStudents']));
  }
  getAllStudentsCRCompleted(pagination, sortValue, filter): Observable<StudentTableData[]> {
    return this.apollo
      .watchQuery<StudentTableData[]>({
        query: gql`
          query GetAllStudentsCR($pagination: PaginationInput, $sort: StudentSorting, $filter: FilterStudent) {
            GetAllStudents(pagination: $pagination, filter: $filter, sorting: $sort, status: completed, group_details: true) {
              group_details {
                name
                test {
                  name
                }
              }
              count_document
              is_thumbups_green
              incorrect_email
              _id
              civility
              first_name
              last_name
              photo
              email
              date_of_birth
              place_of_birth
              tele_phone
              student_title_status
              academic_journey_id {
                diplomas {
                  diploma_photo
                }
              }
              createdAt
              certificate_issuance_status
              identity_verification_status
              is_photo_in_s3
              photo_s3_path
              status
              school {
                _id
                short_name
              }
              soft_skill_pro_evaluation {
                status
              }
              academic_pro_evaluation {
                status
              }
              previous_courses_id {
                rncp_id {
                  _id
                  short_name
                }
              }
              rncp_title {
                _id
                short_name
              }
              current_class {
                _id
                name
              }
              final_transcript_id {
                _id
                status
                final_transcript_status
                certification_status
                jury_decision_for_final_transcript
                input_final_decision_status
                is_validated
                student_decision
                after_final_retake_decision
                has_jury_finally_decided
                retake_test_for_students {
                  test_id {
                    _id
                  }
                }
              }
              user_id {
                _id
              }
              employability_survey_ids {
                _id
                survey_status
                validator
              }
              job_description_id {
                _id
                job_name
                job_description_status
              }
              problematic_id {
                _id
                problematic_status
              }
              mentor_evaluation_id {
                _id
                mentor_evaluation_status
              }
              specialization {
                _id
                name
              }
              companies {
                company {
                  _id
                  company_name
                }
                status
                mentor {
                  _id
                  first_name
                  last_name
                  civility
                  email
                }
              }
            }
          }
        `,
        variables: {
          pagination,
          sort: sortValue ? sortValue : {},
          filter: filter || {},
        },
        fetchPolicy: 'network-only',
      })
      .valueChanges.pipe(map((resp) => resp.data['GetAllStudents']));
  }
  getAllStudentsCRSuspended(pagination, sortValue, filter): Observable<StudentTableData[]> {
    return this.apollo
      .watchQuery<StudentTableData[]>({
        query: gql`
          query GetAllStudentsCR($pagination: PaginationInput, $sort: StudentSorting, $filter: FilterStudent) {
            GetAllStudents(pagination: $pagination, filter: $filter, sorting: $sort, status: suspended) {
              group_details {
                name
                test {
                  name
                }
              }
              count_document
              incorrect_email
              _id
              civility
              first_name
              last_name
              email
              photo
              date_of_birth
              place_of_birth
              tele_phone
              academic_journey_id {
                diplomas {
                  diploma_photo
                }
              }
              createdAt
              certificate_issuance_status
              identity_verification_status
              is_photo_in_s3
              photo_s3_path
              is_thumbups_green
              reason_for_resignation
              date_of_resignation
              status
              student_title_status
              school {
                _id
                short_name
              }
              rncp_title {
                _id
                short_name
              }
              current_class {
                _id
                name
              }
              soft_skill_pro_evaluation {
                status
              }
              academic_pro_evaluation {
                status
              }
              final_transcript_id {
                _id
                status
                final_transcript_status
                certification_status
                jury_decision_for_final_transcript
                input_final_decision_status
                is_validated
                student_decision
                after_final_retake_decision
                has_jury_finally_decided
                retake_test_for_students {
                  test_id {
                    _id
                  }
                }
              }
              user_id {
                _id
              }
              job_description_id {
                _id
                job_name
                job_description_status
              }
              problematic_id {
                _id
                problematic_status
              }
              mentor_evaluation_id {
                _id
                mentor_evaluation_status
              }
              employability_survey_ids {
                _id
                survey_status
                validator
              }
              specialization {
                _id
                name
              }
              companies {
                company {
                  _id
                  company_name
                }
                status
                mentor {
                  _id
                  first_name
                  last_name
                  civility
                  email
                }
              }
            }
          }
        `,
        variables: {
          pagination,
          sort: sortValue ? sortValue : {},
          filter: filter || {},
        },
        fetchPolicy: 'network-only',
      })
      .valueChanges.pipe(map((resp) => resp.data['GetAllStudents']));
  }
  getAllStudentsCRDeactivated(pagination, sortValue, filter): Observable<StudentTableData[]> {
    return this.apollo
      .watchQuery<StudentTableData[]>({
        query: gql`
          query GetAllStudentsCR($pagination: PaginationInput, $sort: StudentSorting, $filter: FilterDeactivatedStudent) {
            GetDeactivatedStudents(pagination: $pagination, filter: $filter, sorting: $sort) {
              group_details {
                name
                test {
                  name
                }
              }
              count_document
              incorrect_email
              _id
              civility
              first_name
              last_name
              email
              photo
              date_of_birth
              place_of_birth
              tele_phone
              academic_journey_id {
                diplomas {
                  diploma_photo
                }
              }
              createdAt
              certificate_issuance_status
              identity_verification_status
              is_photo_in_s3
              photo_s3_path
              is_thumbups_green
              reason_for_resignation
              date_of_resignation
              status
              student_title_status
              school {
                _id
                short_name
              }
              rncp_title {
                _id
                short_name
              }
              current_class {
                _id
                name
              }
              soft_skill_pro_evaluation {
                status
              }
              academic_pro_evaluation {
                status
              }
              final_transcript_id {
                _id
                status
                final_transcript_status
                certification_status
                jury_decision_for_final_transcript
                input_final_decision_status
                is_validated
                student_decision
                after_final_retake_decision
                has_jury_finally_decided
                retake_test_for_students {
                  test_id {
                    _id
                  }
                }
              }
              user_id {
                _id
              }
              job_description_id {
                _id
                job_name
                job_description_status
              }
              problematic_id {
                _id
                problematic_status
              }
              mentor_evaluation_id {
                _id
                mentor_evaluation_status
              }
              employability_survey_ids {
                _id
                survey_status
                validator
              }
              specialization {
                _id
                name
              }
              companies {
                company {
                  _id
                  company_name
                }
                status
                mentor {
                  _id
                  first_name
                  last_name
                  civility
                  email
                }
              }
            }
          }
        `,
        variables: {
          pagination,
          sort: sortValue ? sortValue : {},
          filter: filter || {},
        },
        fetchPolicy: 'network-only',
      })
      .valueChanges.pipe(map((resp) => resp.data['GetDeactivatedStudents']));
  }

  getAllStudentsMentor(pagination, mentor_id, sortValue, filter): Observable<StudentTableData[]> {
    return this.apollo
      .watchQuery<StudentTableData[]>({
        query: gql`
          query GetAllStudentsMentor($pagination: PaginationInput, $mentor_id: ID, $sort: StudentSorting) {
            GetAllStudents(
              pagination: $pagination,
              mentor_id: $mentor_id,
              ${filter},
              sorting: $sort,
              status: active_pending,
              group_details: true
            ) {
              group_details {
                name
                test {
                  name
                }
              }
              count_document
              incorrect_email
              _id
              civility
              first_name
              email
              last_name
              photo
              date_of_birth
              place_of_birth
              tele_phone
              academic_journey_id {
                diplomas {
                  diploma_photo
                }
              }
              createdAt
              certificate_issuance_status
              identity_verification_status
              is_photo_in_s3
              photo_s3_path
              is_thumbups_green
              status
              student_title_status
              school {
                _id
                short_name
              }
              rncp_title {
                _id
                short_name
              }
              current_class {
                _id
                name
              }
              soft_skill_pro_evaluation {
                status
              }
              academic_pro_evaluation {
                status
              }
              final_transcript_id {
                _id
                status
                final_transcript_status
                certification_status
                jury_decision_for_final_transcript
                input_final_decision_status
                is_validated
                student_decision
                after_final_retake_decision
                has_jury_finally_decided
                retake_test_for_students {
                  test_id {
                    _id
                  }
                }
              }
              user_id {
                _id
              }
              job_description_id {
                _id
                job_name
                job_description_status
              }
              problematic_id {
                _id
                problematic_status
              }
              mentor_evaluation_id {
                _id
                mentor_evaluation_status
              }
              employability_survey_ids {
                _id
                survey_status
                validator
              }
              specialization {
                _id
                name
                is_specialization_assigned
                is_specialization_assigned_to_block
              }
              companies {
                company {
                  _id
                  company_name
                }
                status
                mentor {
                  _id
                  first_name
                  last_name
                  civility
                  email
                }
                category_insertion
                type_of_formation
              }
            }
          }
        `,
        variables: {
          pagination,
          sort: sortValue ? sortValue : {},
          mentor_id,
        },
        fetchPolicy: 'network-only',
      })
      .valueChanges.pipe(map((resp) => resp.data['GetAllStudents']));
  }

  getAllStudentsCompany(mentor_id, search): Observable<StudentTableData[]> {
    return this.apollo
      .watchQuery<StudentTableData[]>({
        query: gql`
          query GetAllStudentsMentor($mentor_id: ID) {
            GetAllStudents(mentor_id: $mentor_id, search: "${search}") {
              count_document
              _id
              civility
              first_name
              email
              last_name
              photo
              is_photo_in_s3
              photo_s3_path
              is_thumbups_green
              status
              school {
                _id
                short_name
              }
              rncp_title {
                _id
                short_name
              }
              current_class {
                _id
                name
              }
              soft_skill_pro_evaluation {
                status
              }
              academic_pro_evaluation {
                status
              }
              final_transcript_id {
                _id
                status
                final_transcript_status
                certification_status
                jury_decision_for_final_transcript
                input_final_decision_status
                is_validated
                student_decision
                after_final_retake_decision
                has_jury_finally_decided
                retake_test_for_students {
                  test_id {
                    _id
                  }
                }
              }
              corrected_tests {
                correction {
                  correction_grid {
                    correction {
                      additional_total
                      total
                    }
                  }
                  expected_documents {
                    validation_status
                    document {
                      s3_file_name
                    }
                  }
                  mark_entry_document {
                    s3_file_name
                  }
                }
                test {
                  expected_documents {
                    document_name
                  }
                  correction_status_for_schools {
                    correction_status
                  }
                  correction_grid {
                    correction {
                      total_zone {
                        display_additional_total
                      }
                    }
                  }
                  evaluation_id {
                    _id
                  }
                }
              }
              companies {
                company {
                  _id
                  company_name
                }
                status
                mentor {
                  _id
                  first_name
                  last_name
                  civility
                  email
                }
              }
              user_id {
                _id
              }
              job_description_id {
                _id
                job_name
                job_description_status
              }
              problematic_id {
                _id
                problematic_status
              }
              mentor_evaluation_id {
                _id
                mentor_evaluation_status
              }
              employability_survey_ids {
                _id
                survey_status
                validator
              }
              student_title_status
            }
          }
        `,
        variables: {
          mentor_id,
        },
        fetchPolicy: 'network-only',
      })
      .valueChanges.pipe(map((resp) => resp.data['GetAllStudents']));
  }
  getAllStudentsMentorCompleted(pagination, mentor_id, sortValue, filter): Observable<StudentTableData[]> {
    return this.apollo
      .watchQuery<StudentTableData[]>({
        query: gql`
          query GetAllStudentsMentor($pagination: PaginationInput, $mentor_id: ID, $sort: StudentSorting, $filter: FilterStudent) {
            GetAllStudents(
              pagination: $pagination
              mentor_id: $mentor_id
              filter: $filter
              sorting: $sort
              status: completed
              group_details: true
            ) {
              group_details {
                name
                test {
                  name
                }
              }
              count_document
              is_thumbups_green
              incorrect_email
              _id
              civility
              first_name
              email
              last_name
              photo
              date_of_birth
              place_of_birth
              tele_phone
              student_title_status
              academic_journey_id {
                diplomas {
                  diploma_photo
                }
              }
              soft_skill_pro_evaluation {
                status
              }
              academic_pro_evaluation {
                status
              }
              createdAt
              certificate_issuance_status
              identity_verification_status
              is_photo_in_s3
              photo_s3_path
              status
              school {
                _id
                short_name
              }
              previous_courses_id {
                rncp_id {
                  _id
                  short_name
                }
              }
              rncp_title {
                _id
                short_name
              }
              current_class {
                _id
                name
              }
              final_transcript_id {
                _id
                status
                final_transcript_status
                certification_status
                jury_decision_for_final_transcript
                input_final_decision_status
                is_validated
                student_decision
                after_final_retake_decision
                has_jury_finally_decided
                retake_test_for_students {
                  test_id {
                    _id
                  }
                }
              }
              user_id {
                _id
              }
              employability_survey_ids {
                _id
                survey_status
                validator
              }
              job_description_id {
                _id
                job_name
                job_description_status
              }
              problematic_id {
                _id
                problematic_status
              }
              mentor_evaluation_id {
                _id
                mentor_evaluation_status
              }
              specialization {
                _id
                name
              }
              companies {
                company {
                  _id
                  company_name
                }
                status
                mentor {
                  _id
                  first_name
                  last_name
                  civility
                  email
                }
              }
            }
          }
        `,
        variables: {
          pagination,
          sort: sortValue ? sortValue : {},
          mentor_id,
          filter: filter || {},
        },
        fetchPolicy: 'network-only',
      })
      .valueChanges.pipe(map((resp) => resp.data['GetAllStudents']));
  }
  getAllStudentsMentorSuspended(pagination, mentor_id, sortValue, filter): Observable<StudentTableData[]> {
    return this.apollo
      .watchQuery<StudentTableData[]>({
        query: gql`
          query GetAllStudentsMentor($pagination: PaginationInput, $mentor_id: ID, $sort: StudentSorting, $filter: FilterStudent) {
            GetAllStudents(pagination: $pagination, mentor_id: $mentor_id, filter: $filter, sorting: $sort, status: suspended) {
              group_details {
                name
                test {
                  name
                }
              }
              count_document
              incorrect_email
              _id
              civility
              first_name
              last_name
              email
              photo
              date_of_birth
              place_of_birth
              tele_phone
              academic_journey_id {
                diplomas {
                  diploma_photo
                }
              }
              soft_skill_pro_evaluation {
                status
              }
              academic_pro_evaluation {
                status
              }
              createdAt
              certificate_issuance_status
              identity_verification_status
              is_photo_in_s3
              photo_s3_path
              is_thumbups_green
              reason_for_resignation
              date_of_resignation
              status
              student_title_status
              school {
                _id
                short_name
              }
              rncp_title {
                _id
                short_name
              }
              current_class {
                _id
                name
              }
              final_transcript_id {
                _id
                status
                final_transcript_status
                certification_status
                jury_decision_for_final_transcript
                input_final_decision_status
                is_validated
                student_decision
                after_final_retake_decision
                has_jury_finally_decided
                retake_test_for_students {
                  test_id {
                    _id
                  }
                }
              }
              user_id {
                _id
              }
              job_description_id {
                _id
                job_name
                job_description_status
              }
              problematic_id {
                _id
                problematic_status
              }
              mentor_evaluation_id {
                _id
                mentor_evaluation_status
              }
              employability_survey_ids {
                _id
                survey_status
                validator
              }
              specialization {
                _id
                name
              }
              companies {
                company {
                  _id
                  company_name
                }
                status
                mentor {
                  _id
                  first_name
                  last_name
                  civility
                  email
                }
              }
            }
          }
        `,
        variables: {
          pagination,
          sort: sortValue ? sortValue : {},
          mentor_id,
          filter: filter || {},
        },
        fetchPolicy: 'network-only',
      })
      .valueChanges.pipe(map((resp) => resp.data['GetAllStudents']));
  }
  getAllStudentsMentorDeactivated(pagination, mentor_id, sortValue, filter): Observable<StudentTableData[]> {
    return this.apollo
      .watchQuery<StudentTableData[]>({
        query: gql`
          query GetAllStudentsMentor($pagination: PaginationInput, $mentor_id: ID, $sort: StudentSorting, $filter: FilterDeactivatedStudent) {
            GetDeactivatedStudents(pagination: $pagination, mentor_id: $mentor_id, filter: $filter, sorting: $sort) {
              group_details {
                name
                test {
                  name
                }
              }
              count_document
              incorrect_email
              _id
              civility
              first_name
              last_name
              email
              photo
              date_of_birth
              place_of_birth
              tele_phone
              academic_journey_id {
                diplomas {
                  diploma_photo
                }
              }
              soft_skill_pro_evaluation {
                status
              }
              academic_pro_evaluation {
                status
              }
              createdAt
              certificate_issuance_status
              identity_verification_status
              is_photo_in_s3
              photo_s3_path
              is_thumbups_green
              reason_for_resignation
              date_of_resignation
              status
              student_title_status
              school {
                _id
                short_name
              }
              rncp_title {
                _id
                short_name
              }
              current_class {
                _id
                name
              }
              final_transcript_id {
                _id
                status
                final_transcript_status
                certification_status
                jury_decision_for_final_transcript
                input_final_decision_status
                is_validated
                student_decision
                after_final_retake_decision
                has_jury_finally_decided
                retake_test_for_students {
                  test_id {
                    _id
                  }
                }
              }
              user_id {
                _id
              }
              job_description_id {
                _id
                job_name
                job_description_status
              }
              problematic_id {
                _id
                problematic_status
              }
              mentor_evaluation_id {
                _id
                mentor_evaluation_status
              }
              employability_survey_ids {
                _id
                survey_status
                validator
              }
              specialization {
                _id
                name
              }
              companies {
                company {
                  _id
                  company_name
                }
                status
                mentor {
                  _id
                  first_name
                  last_name
                  civility
                  email
                }
              }
            }
          }
        `,
        variables: {
          pagination,
          sort: sortValue ? sortValue : {},
          mentor_id,
          filter: filter || {},
        },
        fetchPolicy: 'network-only',
      })
      .valueChanges.pipe(map((resp) => resp.data['GetDeactivatedStudents']));
  }

  getAllStudentsCRExport(rncp_title_ids, filter): Observable<StudentTableData[]> {
    return this.apollo
      .watchQuery<StudentTableData[]>({
        query: gql`
          query GetAllStudentsCR($rncp_title_ids: [ID]) {
            GetAllStudents(rncp_title_ids: $rncp_title_ids, ${filter}, status: active_pending) {
              count_document
              _id
              civility
              first_name
              last_name
              photo
              date_of_birth
              place_of_birth
              createdAt
              certificate_issuance_status
identity_verification_status
              is_photo_in_s3
              photo_s3_path
              is_thumbups_green
              status
              school {
                _id
                short_name
              }
              rncp_title {
                _id
                short_name
              }
              current_class {
                _id
                name
              }
              soft_skill_pro_evaluation {
                status
              }
              academic_pro_evaluation {
                status
              }
              final_transcript_id {
                _id
                status
                final_transcript_status
                certification_status
                jury_decision_for_final_transcript
                input_final_decision_status
                is_validated
                student_decision
                after_final_retake_decision
                has_jury_finally_decided
                retake_test_for_students {
                  test_id {
                    _id
                  }
                }
              }
              corrected_tests {
                correction {
                  correction_grid {
                    correction {
                      additional_total
                      total
                    }
                  }
                  expected_documents {
                    validation_status
                    document {
                      s3_file_name
                    }
                  }
                  mark_entry_document {
                    s3_file_name
                  }
                }
                test {
                  expected_documents {
                    document_name
                  }
                  correction_status_for_schools {
                    correction_status
                  }
                  correction_grid {
                    correction {
                      total_zone {
                        display_additional_total
                      }
                    }
                  }
                  evaluation_id {
                    _id
                  }
                }
              }
              user_id {
                _id
              }
              job_description_id {
                _id
                job_name
                job_description_status
              }
              problematic_id {
                _id
                problematic_status
              }
              mentor_evaluation_id {
                _id
                mentor_evaluation_status
              }
              employability_survey_ids {
                _id
                survey_status
                validator
              }
              companies {
                company {
                  _id
                  company_name
                }
                status
                mentor {
                  _id
                  first_name
                  last_name
                  civility
                  email
                }
              }
            }
          }
        `,
        variables: {
          rncp_title_ids,
        },
        fetchPolicy: 'network-only',
      })
      .valueChanges.pipe(map((resp) => resp.data['GetAllStudents']));
  }
  getAllStudentsCRExportCompleted(rncp_title_ids, filter): Observable<StudentTableData[]> {
    return this.apollo
      .watchQuery<StudentTableData[]>({
        query: gql`
          query GetAllStudentsCR($rncp_title_ids: [ID]) {
            GetAllStudents(rncp_title_ids: $rncp_title_ids, ${filter}, status: completed) {
              count_document
              _id
              civility
              first_name
              last_name
              photo
              date_of_birth
              place_of_birth
              createdAt
              certificate_issuance_status
identity_verification_status
              is_photo_in_s3
              photo_s3_path
              is_thumbups_green
              status
              school {
                _id
                short_name
              }
              soft_skill_pro_evaluation {
                status
              }
              academic_pro_evaluation {
                status
              }
              previous_courses_id {
                rncp_id {
                  _id
                  short_name
                }
              }
              rncp_title {
                _id
                short_name
              }
              current_class {
                _id
                name
              }
              final_transcript_id {
                _id
                status
                final_transcript_status
                certification_status
                jury_decision_for_final_transcript
                input_final_decision_status
                is_validated
                student_decision
                after_final_retake_decision
                has_jury_finally_decided
                retake_test_for_students {
                  test_id {
                    _id
                  }
                }
              }
              corrected_tests {
                correction {
                  correction_grid {
                    correction {
                      additional_total
                      total
                    }
                  }
                  expected_documents {
                    validation_status
                    document {
                      s3_file_name
                    }
                  }
                  mark_entry_document {
                    s3_file_name
                  }
                }
                test {
                  expected_documents {
                    document_name
                  }
                  correction_status_for_schools {
                    correction_status
                  }
                  correction_grid {
                    correction {
                      total_zone {
                        display_additional_total
                      }
                    }
                  }
                  evaluation_id {
                    _id
                  }
                }
              }
              user_id {
                _id
              }
              job_description_id {
                _id
                job_name
                job_description_status
              }
              problematic_id {
                _id
                problematic_status
              }
              mentor_evaluation_id {
                _id
                mentor_evaluation_status
              }
              employability_survey_ids {
                _id
                survey_status
                validator
              }
              companies {
                company {
                  _id
                  company_name
                }
                status
                mentor {
                  _id
                  first_name
                  last_name
                  civility
                  email
                }
              }
            }
          }
        `,
        variables: {
          rncp_title_ids,
        },
        fetchPolicy: 'network-only',
      })
      .valueChanges.pipe(map((resp) => resp.data['GetAllStudents']));
  }
  getAllStudentsCRExportSuspended(rncp_title_ids, filter): Observable<StudentTableData[]> {
    return this.apollo
      .watchQuery<StudentTableData[]>({
        query: gql`
          query GetAllStudentsCR($rncp_title_ids: [ID]) {
            GetAllStudents(rncp_title_ids: $rncp_title_ids, ${filter}, status: suspended) {
              count_document
              _id
              civility
              first_name
              last_name
              photo
              is_photo_in_s3
              photo_s3_path
              is_thumbups_green
              reason_for_resignation
              date_of_resignation
              status
              school {
                _id
                short_name
              }
              rncp_title {
                _id
                short_name
              }
              current_class {
                _id
                name
              }
              soft_skill_pro_evaluation {
                status
              }
              academic_pro_evaluation {
                status
              }
              final_transcript_id {
                _id
                status
                final_transcript_status
                certification_status
                jury_decision_for_final_transcript
                input_final_decision_status
                is_validated
                student_decision
                after_final_retake_decision
                has_jury_finally_decided
                retake_test_for_students {
                  test_id {
                    _id
                  }
                }
              }
              corrected_tests {
                correction {
                  correction_grid {
                    correction {
                      additional_total
                      total
                    }
                  }
                  expected_documents {
                    validation_status
                    document {
                      s3_file_name
                    }
                  }
                  mark_entry_document {
                    s3_file_name
                  }
                }
                test {
                  expected_documents {
                    document_name
                  }
                  correction_status_for_schools {
                    correction_status
                  }
                  correction_grid {
                    correction {
                      total_zone {
                        display_additional_total
                      }
                    }
                  }
                  evaluation_id {
                    _id
                  }
                }
              }
              user_id {
                _id
              }
              job_description_id {
                _id
                job_name
                job_description_status
              }
              problematic_id {
                _id
                problematic_status
              }
              mentor_evaluation_id {
                _id
                mentor_evaluation_status
              }
              employability_survey_ids {
                _id
                survey_status
                validator
              }
              companies {
                company {
                  _id
                  company_name
                }
                status
                mentor {
                  _id
                  first_name
                  last_name
                  civility
                  email
                }
              }
            }
          }
        `,
        variables: {
          rncp_title_ids,
        },
        fetchPolicy: 'network-only',
      })
      .valueChanges.pipe(map((resp) => resp.data['GetAllStudents']));
  }
  getAllStudentsCRExportDeactivated(rncp_title_ids, filter): Observable<StudentTableData[]> {
    return this.apollo
      .watchQuery<StudentTableData[]>({
        query: gql`
        query GetAllStudentsCR($rncp_title_ids: [ID]) {
          GetDeactivatedStudents(rncp_title_ids: $rncp_title_ids, ${filter}) {
              count_document
              _id
              civility
              first_name
              last_name
              photo
              is_photo_in_s3
              photo_s3_path
              is_thumbups_green
              reason_for_resignation
              date_of_resignation
              status
              school {
                _id
                short_name
              }
              rncp_title {
                _id
                short_name
              }
              current_class {
                _id
                name
              }
              soft_skill_pro_evaluation {
                status
              }
              academic_pro_evaluation {
                status
              }
              final_transcript_id {
                _id
                status
                final_transcript_status
                certification_status
                jury_decision_for_final_transcript
                input_final_decision_status
                is_validated
                student_decision
                after_final_retake_decision
                has_jury_finally_decided
                retake_test_for_students {
                  test_id {
                    _id
                  }
                }
              }
              corrected_tests {
                correction {
                  correction_grid {
                    correction {
                      additional_total
                      total
                    }
                  }
                  expected_documents {
                    validation_status
                    document {
                      s3_file_name
                    }
                  }
                  mark_entry_document {
                    s3_file_name
                  }
                }
                test {
                  expected_documents {
                    document_name
                  }
                  correction_status_for_schools {
                    correction_status
                  }
                  correction_grid {
                    correction {
                      total_zone {
                        display_additional_total
                      }
                    }
                  }
                  evaluation_id {
                    _id
                  }
                }
              }
              user_id {
                _id
              }
              job_description_id {
                _id
                job_name
                job_description_status
              }
              problematic_id {
                _id
                problematic_status
              }
              mentor_evaluation_id {
                _id
                mentor_evaluation_status
              }
              employability_survey_ids {
                _id
                survey_status
                validator
              }
              companies {
                company {
                  _id
                  company_name
                }
                status
                mentor {
                  _id
                  first_name
                  last_name
                  civility
                  email
                }
              }
            }
          }
        `,
        variables: {
          rncp_title_ids,
        },
        fetchPolicy: 'network-only',
      })
      .valueChanges.pipe(map((resp) => resp.data['GetDeactivatedStudents']));
  }

  getAllStudentsMentorExport(mentor_id, filter): Observable<StudentTableData[]> {
    return this.apollo
      .watchQuery<StudentTableData[]>({
        query: gql`
          query GetAllStudentsMentor($mentor_id: ID) {
            GetAllStudents(mentor_id: $mentor_id, ${filter}, status: active_pending) {
              count_document
              _id
              civility
              first_name
              last_name
              photo
              date_of_birth
              place_of_birth
              createdAt
              certificate_issuance_status
identity_verification_status
              is_photo_in_s3
              photo_s3_path
              is_thumbups_green
              status
              school {
                _id
                short_name
              }
              rncp_title {
                _id
                short_name
              }
              current_class {
                _id
                name
              }
              soft_skill_pro_evaluation {
                status
              }
              academic_pro_evaluation {
                status
              }
              final_transcript_id {
                _id
                status
                final_transcript_status
                certification_status
                jury_decision_for_final_transcript
                input_final_decision_status
                is_validated
                student_decision
                after_final_retake_decision
                has_jury_finally_decided
                retake_test_for_students {
                  test_id {
                    _id
                  }
                }
              }
              corrected_tests {
                correction {
                  correction_grid {
                    correction {
                      additional_total
                      total
                    }
                  }
                  expected_documents {
                    validation_status
                    document {
                      s3_file_name
                    }
                  }
                  mark_entry_document {
                    s3_file_name
                  }
                }
                test {
                  expected_documents {
                    document_name
                  }
                  correction_status_for_schools {
                    correction_status
                  }
                  correction_grid {
                    correction {
                      total_zone {
                        display_additional_total
                      }
                    }
                  }
                  evaluation_id {
                    _id
                  }
                }
              }
              user_id {
                _id
              }
              job_description_id {
                _id
                job_name
                job_description_status
              }
              problematic_id {
                _id
                problematic_status
              }
              mentor_evaluation_id {
                _id
                mentor_evaluation_status
              }
              employability_survey_ids {
                _id
                survey_status
                validator
              }
              companies {
                company {
                  _id
                  company_name
                }
                status
                mentor {
                  _id
                  first_name
                  last_name
                  civility
                  email
                }
              }
            }
          }
        `,
        variables: {
          mentor_id,
        },
        fetchPolicy: 'network-only',
      })
      .valueChanges.pipe(map((resp) => resp.data['GetAllStudents']));
  }
  getAllStudentsMentorExportCompleted(mentor_id, filter): Observable<StudentTableData[]> {
    return this.apollo
      .watchQuery<StudentTableData[]>({
        query: gql`
          query GetAllStudentsMentor($mentor_id: ID) {
            GetAllStudents(mentor_id: $mentor_id, ${filter}, status: completed) {
              count_document
              _id
              civility
              first_name
              last_name
              photo
              date_of_birth
              place_of_birth
              createdAt
              certificate_issuance_status
identity_verification_status
              is_photo_in_s3
              photo_s3_path
              is_thumbups_green
              status
              school {
                _id
                short_name
              }
              previous_courses_id {
                rncp_id {
                  _id
                  short_name
                }
              }
              rncp_title {
                _id
                short_name
              }
              soft_skill_pro_evaluation {
                status
              }
              academic_pro_evaluation {
                status
              }
              current_class {
                _id
                name
              }
              final_transcript_id {
                _id
                status
                final_transcript_status
                certification_status
                jury_decision_for_final_transcript
                input_final_decision_status
                is_validated
                student_decision
                after_final_retake_decision
                has_jury_finally_decided
                retake_test_for_students {
                  test_id {
                    _id
                  }
                }
              }
              corrected_tests {
                correction {
                  correction_grid {
                    correction {
                      additional_total
                      total
                    }
                  }
                  expected_documents {
                    validation_status
                    document {
                      s3_file_name
                    }
                  }
                  mark_entry_document {
                    s3_file_name
                  }
                }
                test {
                  expected_documents {
                    document_name
                  }
                  correction_status_for_schools {
                    correction_status
                  }
                  correction_grid {
                    correction {
                      total_zone {
                        display_additional_total
                      }
                    }
                  }
                  evaluation_id {
                    _id
                  }
                }
              }
              user_id {
                _id
              }
              job_description_id {
                _id
                job_name
                job_description_status
              }
              problematic_id {
                _id
                problematic_status
              }
              mentor_evaluation_id {
                _id
                mentor_evaluation_status
              }
              employability_survey_ids {
                _id
                survey_status
                validator
              }
              companies {
                company {
                  _id
                  company_name
                }
                status
                mentor {
                  _id
                  first_name
                  last_name
                  civility
                  email
                }
              }
            }
          }
        `,
        variables: {
          mentor_id,
        },
        fetchPolicy: 'network-only',
      })
      .valueChanges.pipe(map((resp) => resp.data['GetAllStudents']));
  }
  getAllStudentsMentorExportSuspended(mentor_id, filter): Observable<StudentTableData[]> {
    return this.apollo
      .watchQuery<StudentTableData[]>({
        query: gql`
          query GetAllStudentsMentor($mentor_id: ID) {
            GetAllStudents(mentor_id: $mentor_id, ${filter}, status: suspended) {
              count_document
              _id
              civility
              first_name
              last_name
              photo
              is_photo_in_s3
              photo_s3_path
              is_thumbups_green
              reason_for_resignation
              date_of_resignation
              status
              school {
                _id
                short_name
              }
              rncp_title {
                _id
                short_name
              }
              current_class {
                _id
                name
              }
              soft_skill_pro_evaluation {
                status
              }
              academic_pro_evaluation {
                status
              }
              final_transcript_id {
                _id
                status
                final_transcript_status
                certification_status
                jury_decision_for_final_transcript
                input_final_decision_status
                is_validated
                student_decision
                after_final_retake_decision
                has_jury_finally_decided
                retake_test_for_students {
                  test_id {
                    _id
                  }
                }
              }
              corrected_tests {
                correction {
                  correction_grid {
                    correction {
                      additional_total
                      total
                    }
                  }
                  expected_documents {
                    validation_status
                    document {
                      s3_file_name
                    }
                  }
                  mark_entry_document {
                    s3_file_name
                  }
                }
                test {
                  expected_documents {
                    document_name
                  }
                  correction_status_for_schools {
                    correction_status
                  }
                  correction_grid {
                    correction {
                      total_zone {
                        display_additional_total
                      }
                    }
                  }
                  evaluation_id {
                    _id
                  }
                }
              }
              user_id {
                _id
              }
              job_description_id {
                _id
                job_name
                job_description_status
              }
              problematic_id {
                _id
                problematic_status
              }
              mentor_evaluation_id {
                _id
                mentor_evaluation_status
              }
              employability_survey_ids {
                _id
                survey_status
                validator
              }
              companies {
                company {
                  _id
                  company_name
                }
                status
                mentor {
                  _id
                  first_name
                  last_name
                  civility
                  email
                }
              }
            }
          }
        `,
        variables: {
          mentor_id,
        },
        fetchPolicy: 'network-only',
      })
      .valueChanges.pipe(map((resp) => resp.data['GetAllStudents']));
  }
  getAllStudentsMentorExportDeactivated(mentor_id, filter): Observable<StudentTableData[]> {
    return this.apollo
      .watchQuery<StudentTableData[]>({
        query: gql`
          query GetAllStudentsMentor($mentor_id: ID) {
            GetDeactivatedStudents(mentor_id: $mentor_id, ${filter}) {
              count_document
              _id
              civility
              first_name
              last_name
              photo
              is_photo_in_s3
              photo_s3_path
              is_thumbups_green
              reason_for_resignation
              date_of_resignation
              status
              school {
                _id
                short_name
              }
              rncp_title {
                _id
                short_name
              }
              current_class {
                _id
                name
              }
              soft_skill_pro_evaluation {
                status
              }
              academic_pro_evaluation {
                status
              }
              final_transcript_id {
                _id
                status
                final_transcript_status
                certification_status
                jury_decision_for_final_transcript
                input_final_decision_status
                is_validated
                student_decision
                after_final_retake_decision
                has_jury_finally_decided
                retake_test_for_students {
                  test_id {
                    _id
                  }
                }
              }
              corrected_tests {
                correction {
                  correction_grid {
                    correction {
                      additional_total
                      total
                    }
                  }
                  expected_documents {
                    validation_status
                    document {
                      s3_file_name
                    }
                  }
                  mark_entry_document {
                    s3_file_name
                  }
                }
                test {
                  expected_documents {
                    document_name
                  }
                  correction_status_for_schools {
                    correction_status
                  }
                  correction_grid {
                    correction {
                      total_zone {
                        display_additional_total
                      }
                    }
                  }
                  evaluation_id {
                    _id
                  }
                }
              }
              user_id {
                _id
              }
              job_description_id {
                _id
                job_name
                job_description_status
              }
              problematic_id {
                _id
                problematic_status
              }
              mentor_evaluation_id {
                _id
                mentor_evaluation_status
              }
              employability_survey_ids {
                _id
                survey_status
                validator
              }
              companies {
                company {
                  _id
                  company_name
                }
                status
                mentor {
                  _id
                  first_name
                  last_name
                  civility
                  email
                }
              }
            }
          }
        `,
        variables: {
          mentor_id,
        },
        fetchPolicy: 'network-only',
      })
      .valueChanges.pipe(map((resp) => resp.data['GetDeactivatedStudents']));
  }

  getAllStudentsChiefGroupExport(school_ids, filter): Observable<StudentTableData[]> {
    return this.apollo
      .watchQuery<StudentTableData[]>({
        query: gql`
          query GetAllStudentsChiefGroup($school_ids: [ID]) {
            GetAllStudents(school_ids: $school_ids, ${filter}, status: active_pending) {
              count_document
              _id
              civility
              first_name
              last_name
              photo
              date_of_birth
              place_of_birth
              createdAt
              certificate_issuance_status
identity_verification_status
              is_photo_in_s3
              photo_s3_path
              is_thumbups_green
              status
              school {
                _id
                short_name
              }
              rncp_title {
                _id
                short_name
              }
              current_class {
                _id
                name
              }
              soft_skill_pro_evaluation {
                status
              }
              academic_pro_evaluation {
                status
              }
              final_transcript_id {
                _id
                status
                final_transcript_status
                certification_status
                jury_decision_for_final_transcript
                input_final_decision_status
                is_validated
                student_decision
                after_final_retake_decision
                has_jury_finally_decided
                retake_test_for_students {
                  test_id {
                    _id
                  }
                }
              }
              corrected_tests {
                correction {
                  correction_grid {
                    correction {
                      additional_total
                      total
                    }
                  }
                  expected_documents {
                    validation_status
                    document {
                      s3_file_name
                    }
                  }
                  mark_entry_document {
                    s3_file_name
                  }
                }
                test {
                  expected_documents {
                    document_name
                  }
                  correction_status_for_schools {
                    correction_status
                  }
                  correction_grid {
                    correction {
                      total_zone {
                        display_additional_total
                      }
                    }
                  }
                  evaluation_id {
                    _id
                  }
                }
              }
              user_id {
                _id
              }
              job_description_id {
                _id
                job_name
                job_description_status
              }
              problematic_id {
                _id
                problematic_status
              }
              mentor_evaluation_id {
                _id
                mentor_evaluation_status
              }
              employability_survey_ids {
                _id
                survey_status
                validator
              }
              companies {
                company {
                  _id
                  company_name
                }
                status
                mentor {
                  _id
                  first_name
                  last_name
                  civility
                  email
                }
              }
            }
          }
        `,
        variables: {
          school_ids,
        },
        fetchPolicy: 'network-only',
      })
      .valueChanges.pipe(map((resp) => resp.data['GetAllStudents']));
  }
  getAllStudentsChiefGroupExportCompleted(school_ids, filter): Observable<StudentTableData[]> {
    return this.apollo
      .watchQuery<StudentTableData[]>({
        query: gql`
          query GetAllStudentsChiefGroup($school_ids: [ID]) {
            GetAllStudents(school_ids: $school_ids, ${filter}, status: completed) {
              count_document
              _id
              civility
              first_name
              last_name
              photo
              date_of_birth
              place_of_birth
              createdAt
              certificate_issuance_status
identity_verification_status
              is_photo_in_s3
              photo_s3_path
              is_thumbups_green
              status
              school {
                _id
                short_name
              }
              previous_courses_id {
                rncp_id {
                  _id
                  short_name
                }
              }
              soft_skill_pro_evaluation {
                status
              }
              academic_pro_evaluation {
                status
              }
              rncp_title {
                _id
                short_name
              }
              current_class {
                _id
                name
              }
              final_transcript_id {
                _id
                status
                final_transcript_status
                certification_status
                jury_decision_for_final_transcript
                input_final_decision_status
                is_validated
                student_decision
                after_final_retake_decision
                has_jury_finally_decided
                retake_test_for_students {
                  test_id {
                    _id
                  }
                }
              }
              corrected_tests {
                correction {
                  correction_grid {
                    correction {
                      additional_total
                      total
                    }
                  }
                  expected_documents {
                    validation_status
                    document {
                      s3_file_name
                    }
                  }
                  mark_entry_document {
                    s3_file_name
                  }
                }
                test {
                  expected_documents {
                    document_name
                  }
                  correction_status_for_schools {
                    correction_status
                  }
                  correction_grid {
                    correction {
                      total_zone {
                        display_additional_total
                      }
                    }
                  }
                  evaluation_id {
                    _id
                  }
                }
              }
              user_id {
                _id
              }
              job_description_id {
                _id
                job_name
                job_description_status
              }
              problematic_id {
                _id
                problematic_status
              }
              mentor_evaluation_id {
                _id
                mentor_evaluation_status
              }
              employability_survey_ids {
                _id
                survey_status
                validator
              }
              companies {
                company {
                  _id
                  company_name
                }
                status
                mentor {
                  _id
                  first_name
                  last_name
                  civility
                  email
                }
              }
            }
          }
        `,
        variables: {
          school_ids,
        },
        fetchPolicy: 'network-only',
      })
      .valueChanges.pipe(map((resp) => resp.data['GetAllStudents']));
  }
  getAllStudentsChiefGroupExportSuspended(school_ids, filter): Observable<StudentTableData[]> {
    return this.apollo
      .watchQuery<StudentTableData[]>({
        query: gql`
          query GetAllStudentsChiefGroup($school_ids: [ID]) {
            GetAllStudents(school_ids: $school_ids, ${filter}, status: suspended) {
              count_document
              _id
              civility
              first_name
              last_name
              photo
              is_photo_in_s3
              photo_s3_path
              is_thumbups_green
              reason_for_resignation
              date_of_resignation
              status
              school {
                _id
                short_name
              }
              rncp_title {
                _id
                short_name
              }
              current_class {
                _id
                name
              }
              soft_skill_pro_evaluation {
                status
              }
              academic_pro_evaluation {
                status
              }
              final_transcript_id {
                _id
                status
                final_transcript_status
                certification_status
                jury_decision_for_final_transcript
                input_final_decision_status
                is_validated
                student_decision
                after_final_retake_decision
                has_jury_finally_decided
                retake_test_for_students {
                  test_id {
                    _id
                  }
                }
              }
              corrected_tests {
                correction {
                  correction_grid {
                    correction {
                      additional_total
                      total
                    }
                  }
                  expected_documents {
                    validation_status
                    document {
                      s3_file_name
                    }
                  }
                  mark_entry_document {
                    s3_file_name
                  }
                }
                test {
                  expected_documents {
                    document_name
                  }
                  correction_status_for_schools {
                    correction_status
                  }
                  correction_grid {
                    correction {
                      total_zone {
                        display_additional_total
                      }
                    }
                  }
                  evaluation_id {
                    _id
                  }
                }
              }
              user_id {
                _id
              }
              job_description_id {
                _id
                job_name
                job_description_status
              }
              problematic_id {
                _id
                problematic_status
              }
              mentor_evaluation_id {
                _id
                mentor_evaluation_status
              }
              employability_survey_ids {
                _id
                survey_status
                validator
              }
              companies {
                company {
                  _id
                  company_name
                }
                status
                mentor {
                  _id
                  first_name
                  last_name
                  civility
                  email
                }
              }
            }
          }
        `,
        variables: {
          school_ids,
        },
        fetchPolicy: 'network-only',
      })
      .valueChanges.pipe(map((resp) => resp.data['GetAllStudents']));
  }
  getAllStudentsChiefGroupExportDeactivated(school_ids, filter): Observable<StudentTableData[]> {
    return this.apollo
      .watchQuery<StudentTableData[]>({
        query: gql`
          query GetAllStudentsChiefGroup($school_ids: [ID]) {
            GetDeactivatedStudents(school_ids: $school_ids, ${filter}) {
              count_document
              _id
              civility
              first_name
              last_name
              photo
              is_photo_in_s3
              photo_s3_path
              is_thumbups_green
              reason_for_resignation
              date_of_resignation
              status
              school {
                _id
                short_name
              }
              rncp_title {
                _id
                short_name
              }
              current_class {
                _id
                name
              }
              soft_skill_pro_evaluation {
                status
              }
              academic_pro_evaluation {
                status
              }
              final_transcript_id {
                _id
                status
                final_transcript_status
                certification_status
                jury_decision_for_final_transcript
                input_final_decision_status
                is_validated
                student_decision
                after_final_retake_decision
                has_jury_finally_decided
                retake_test_for_students {
                  test_id {
                    _id
                  }
                }
              }
              corrected_tests {
                correction {
                  correction_grid {
                    correction {
                      additional_total
                      total
                    }
                  }
                  expected_documents {
                    validation_status
                    document {
                      s3_file_name
                    }
                  }
                  mark_entry_document {
                    s3_file_name
                  }
                }
                test {
                  expected_documents {
                    document_name
                  }
                  correction_status_for_schools {
                    correction_status
                  }
                  correction_grid {
                    correction {
                      total_zone {
                        display_additional_total
                      }
                    }
                  }
                  evaluation_id {
                    _id
                  }
                }
              }
              user_id {
                _id
              }
              job_description_id {
                _id
                job_name
                job_description_status
              }
              problematic_id {
                _id
                problematic_status
              }
              mentor_evaluation_id {
                _id
                mentor_evaluation_status
              }
              employability_survey_ids {
                _id
                survey_status
                validator
              }
              companies {
                company {
                  _id
                  company_name
                }
                status
                mentor {
                  _id
                  first_name
                  last_name
                  civility
                  email
                }
              }
            }
          }
        `,
        variables: {
          school_ids,
        },
        fetchPolicy: 'network-only',
      })
      .valueChanges.pipe(map((resp) => resp.data['GetDeactivatedStudents']));
  }

  getStudentDropdownBySchoolTitleClass(schoolId: string, titleID: string, classId: string): Observable<any> {
    return this.apollo
      .query({
        query: gql`
      query getStudentListOfGroupCreation{
        GetAllStudents(
          school: "${schoolId}",
          rncp_title: "${titleID}",
          current_class: "${classId}",
        ) {
          _id
          first_name
          last_name
        }
      }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllStudents']));
  }

  getAllStudentsDeactive(rncpId, classId, schoolId, pagination?, search?: string): Observable<StudentTableData[]> {
    return this.apollo
      .query<StudentTableData[]>({
        query: gql`
          query GetAllStudents($rncpId: ID, $classId: ID, $schoolId: ID, $pagination: PaginationInput, $search: String) {
            GetAllStudents(
              rncp_title: $rncpId
              current_class: $classId
              school: $schoolId
              pagination: $pagination
              search: $search
              status: deactivated
            ) {
              count_document
              _id
              civility
              first_name
              last_name
              photo
              is_photo_in_s3
              photo_s3_path
              is_thumb_up_green
              status
              email
              school {
                _id
                short_name
              }
              rncp_title {
                _id
                short_name
              }
              final_transcript_id {
                final_transcript_status
              }
            }
          }
        `,
        variables: {
          rncpId,
          classId,
          schoolId,
          pagination,
          search,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllStudents']));
  }

  getDeactivatedStudent(rncp_title, current_class, school, pagination, sortValue, filter): Observable<StudentTableData[]> {
    return this.apollo
      .query<StudentTableData[]>({
        query: gql`
          query GetDeactivatedStudents(
            $rncp_title: ID
            $current_class: ID
            $school: ID
            $pagination: PaginationInput
            $sorting: StudentSorting
            $filter: FilterDeactivatedStudent
          ) {
            GetDeactivatedStudents(
              filter: $filter
              rncp_title: $rncp_title
              current_class: $current_class
              school: $school
              pagination: $pagination
              sorting: $sorting
            ) {
              reason_for_resignation
              date_of_resignation
              count_document
              _id
              civility
              first_name
              last_name
              full_name
              is_thumbups_green
              status
              email
              school {
                _id
                short_name
              }
              rncp_title {
                _id
                short_name
              }
              current_class {
                _id
                name
              }
              final_transcript_id {
                final_transcript_status
              }
              problematic_id {
                problematic_status
              }
              job_description_id {
                job_description_status
              }
              mentor_evaluation_id {
                mentor_evaluation_status
              }
            }
          }
        `,
        variables: {
          rncp_title,
          current_class,
          school,
          pagination,
          sorting: sortValue ? sortValue : {},
          filter,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetDeactivatedStudents']));
  }

  getAllDeactivatedStudent(rncp_title, current_class, school, sortValue, filter): Observable<StudentTableData[]> {
    return this.apollo
      .query<StudentTableData[]>({
        query: gql`
          query GetDeactivatedStudents(
            $rncp_title: ID
            $current_class: ID
            $school: ID
            $sorting: StudentSorting
          ) {
            GetDeactivatedStudents(
              ${filter}
              rncp_title: $rncp_title
              current_class: $current_class
              school: $school
              sorting: $sorting
            ) {
              count_document
              _id
              civility
              first_name
              last_name
              full_name
              is_thumbups_green
              status
              email
              school {
                _id
                short_name
              }
              rncp_title {
                _id
                short_name
              }
              final_transcript_id {
                final_transcript_status
              }
              problematic_id {
                problematic_status
              }
              job_description_id {
                job_description_status
              }
              mentor_evaluation_id {
                mentor_evaluation_status
              }
            }
          }
        `,
        variables: {
          rncp_title,
          current_class,
          school,
          sorting: sortValue ? sortValue : {},
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetDeactivatedStudents']));
  }

  validateOrRejectStudentDocumentExpected(
    docId: string,
    studentId: string,
    testId: string,
    testCorrectionId: string,
    validationStatus: string,
    lang: string,
  ): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
      mutation {
        ValidateOrRejectStudentDocumentExpected(
          doc_id: "${docId}"
          student_id: "${studentId}"
          test_id: "${testId}"
          test_correction_id: "${testCorrectionId}"
          validation_status: ${validationStatus}
          lang: "${lang}"
        ) {
          _id
        }
      }
      `,
      })
      .pipe(map((resp) => resp.data['ValidateOrRejectStudentDocumentExpected']));
  }

  getStudentsbyClassTitle(rncpId, classId, schoolId, status, pagination, sortValue, filter): Observable<StudentTableData[]> {
    return this.apollo
      .query<StudentTableData[]>({
        query: gql`
          query GetAllStudents(
            $rncpId: ID,
            $classId: ID,
            $schoolId: ID,
            $status: EnumFilterStatus,
            $pagination: PaginationInput,
            $sort: StudentSorting,
            $check_visibility: Boolean
          ) {
            GetAllStudents(
              rncp_title: $rncpId
              current_class: $classId
              school: $schoolId
              pagination: $pagination
              status: $status
              sorting: $sort
              check_grand_oral_started: true,
              check_visibility: $check_visibility
              ${filter}
            ) {
              count_document
              _id
              civility
              first_name
              last_name
              photo
              email
              is_photo_in_s3
              photo_s3_path
              is_thumbups_green
              student_title_status
              status
              date_of_resignation
              reason_for_resignation
              companies {
                company {
                  _id
                  company_name
                }
                status
                mentor {
                  _id
                  first_name
                  last_name
                  civility
                  email
                }
              }
              school {
                _id
                short_name
              }
              rncp_title {
                _id
                short_name
              }
              current_class {
                _id
                name
                jury_process_name
              }
              user_id {
                _id
              }
              problematic_id {
                problematic_status
              }
              job_description_id {
                job_description_status
              }
              mentor_evaluation_id {
                mentor_evaluation_status
              }
              employability_survey_ids {
                _id
                survey_status
                validator
              }
              final_transcript_id {
                _id
                status
                final_transcript_status
                certification_status
                jury_decision_for_final_transcript
                input_final_decision_status
                is_validated
                student_decision
                after_final_retake_decision
                has_jury_finally_decided
                retake_test_for_students {
                  test_id {
                    _id
                  }
                }
              }
              tests_result {
                correction_progress
                test_correction {
                  test {
                    _id
                    correction_grid {
                      correction {
                        total_zone {
                          display_additional_total
                        }
                      }
                    }
                  }
                  correction_grid {
                    correction {
                      total
                      additional_total
                    }
                  }
                }
                evaluation {
                  _id
                }
              }
              corrected_tests {
                correction {
                  _id
                  correction_grid {
                    correction {
                      additional_total
                      total
                    }
                  }
                  expected_documents {
                    document_name
                    validation_status
                    document {
                      s3_file_name
                      _id
                    }
                  }
                  mark_entry_document {
                    s3_file_name
                  }
                }
                test {
                  _id
                  type
                  expected_documents {
                    document_name
                  }
                  correction_status_for_schools {
                    correction_status
                  }
                  correction_grid {
                    correction {
                      total_zone {
                        display_additional_total
                      }
                    }
                  }
                  evaluation_id {
                    _id
                  }
                }
                is_visible
              }
              soft_skill_pro_evaluation {
                status
              }
              academic_pro_evaluation {
                status
              }
              student_cv {
                _id
                s3_file_name
                cv_document_status
                status
                parent_rncp_title{
                  _id
                  short_name
                }
                parent_class_id{
                  _id
                  name
                }
              }
              student_presentation {
                _id
                s3_file_name
                presentation_document_status
                status
                parent_rncp_title{
                  _id
                  short_name
                }
                parent_class_id{
                  _id
                  name
                }
              }
              is_grand_oral_started
            }
          }
        `,
        variables: {
          rncpId,
          classId,
          schoolId,
          status,
          pagination,
          check_visibility: status === 'active_pending' ? true : false,
          sort: sortValue ? sortValue : {},
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllStudents']));
  }
  getStudentsTitleManager(rncpId, classId, pagination, sortValue, filter): Observable<StudentTableData[]> {
    return this.apollo
      .query<StudentTableData[]>({
        query: gql`
          query GetAllStudents(
            $rncpId: ID,
            $classId: ID,
            $pagination: PaginationInput,
            $sort: StudentSorting,
            $check_visibility: Boolean
          ) {
            GetAllStudents(
              rncp_title: $rncpId
              current_class: $classId
              pagination: $pagination
              sorting: $sort
              check_grand_oral_started: true,
              check_visibility: $check_visibility
              ${filter}
            ) {
              count_document
              _id
              civility
              first_name
              last_name
              photo
              email
              is_photo_in_s3
              photo_s3_path
              is_thumbups_green
              student_title_status
              status
              school {
                _id
                short_name
              }
              rncp_title {
                _id
                short_name
              }
              current_class {
                _id
              }
              user_id {
                _id
              }
              problematic_id {
                problematic_status
              }
              job_description_id {
                job_description_status
              }
              mentor_evaluation_id {
                mentor_evaluation_status
              }
              employability_survey_ids {
                _id
                survey_status
                validator
              }
              final_transcript_id {
                _id
                status
                final_transcript_status
                certification_status
                jury_decision_for_final_transcript
                input_final_decision_status
                is_validated
                student_decision
                after_final_retake_decision
                has_jury_finally_decided
                retake_test_for_students {
                  test_id {
                    _id
                  }
                }
              }
              tests_result {
                correction_progress
                test_correction {
                  test {
                    _id
                    correction_grid {
                      correction {
                        total_zone {
                          display_additional_total
                        }
                      }
                    }
                  }
                  correction_grid {
                    correction {
                      total
                      additional_total
                    }
                  }
                }
                evaluation {
                  _id
                }
              }
              corrected_tests {
                correction {
                  _id
                  correction_grid {
                    correction {
                      additional_total
                      total
                    }
                  }
                  expected_documents {
                    document_name
                    validation_status
                    document {
                      s3_file_name
                      _id
                    }
                  }
                  mark_entry_document {
                    s3_file_name
                  }
                }
                test {
                  _id
                  type
                  expected_documents {
                    document_name
                  }
                  correction_status_for_schools {
                    correction_status
                  }
                  correction_grid {
                    correction {
                      total_zone {
                        display_additional_total
                      }
                    }
                  }
                  evaluation_id {
                    _id
                  }
                }
                is_visible
              }
              soft_skill_pro_evaluation {
                status
              }
              academic_pro_evaluation {
                status
              }
              student_cv {
                _id
                s3_file_name
                cv_document_status
                status
                parent_rncp_title{
                  _id
                  short_name
                }
                parent_class_id{
                  _id
                  name
                }
              }
              student_presentation {
                _id
                s3_file_name
                presentation_document_status
                status
                parent_rncp_title{
                  _id
                  short_name
                }
                parent_class_id{
                  _id
                  name
                }
              }
              is_grand_oral_started
            }
          }
        `,
        variables: {
          rncpId,
          classId,
          pagination,
          check_visibility: status === 'active_pending' ? true : false,
          sort: sortValue ? sortValue : {},
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllStudents']));
  }

  getStudentsbyIDsClassTitle(rncpId, classId, schoolId, status, pagination, sortValue, filter): Observable<StudentIdsData[]> {
    return this.apollo
      .query<StudentTableData[]>({
        query: gql`
          query GetAllStudentsIDs(
            $rncpId: ID,
            $classId: ID,
            $schoolId: ID,
            $status: EnumFilterStatus,
            $pagination: PaginationInput,
            $sort: StudentSorting
          ) {
            GetAllStudents(
              rncp_title: $rncpId
              current_class: $classId
              school: $schoolId
              pagination: $pagination
              status: $status
              sorting: $sort
              ${filter}
            ) {
              count_document
              _id
            }
          }
        `,
        variables: {
          rncpId,
          classId,
          schoolId,
          status,
          pagination,
          sort: sortValue ? sortValue : {},
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllStudents']));
  }

  getAllStudentsByTitleAndClassOnly(
    rncpId,
    classId,
    pagination?: any,
    sortValue?: any,
    filter?: any,
    certificate_issuance_process_id?: any,
  ): Observable<any[]> {
    return this.apollo
      .query<any[]>({
        query: gql`
          query GetAllStudentsIDs(
            $rncpId: ID
            $classId: ID
            $pagination: PaginationInput
            $sort: StudentSorting
            $filter: FilterStudent
            $certificate_issuance_process_id: ID
          ) {
            GetAllStudents(
              rncp_title: $rncpId
              current_class: $classId
              pagination: $pagination
              sorting: $sort
              filter: $filter
              status: active_completed_suspended
              certificate_issuance_process_id: $certificate_issuance_process_id
            ) {
              count_document
              incorrect_email
              _id
              civility
              first_name
              last_name
              photo
              date_of_birth
              place_of_birth
              academic_journey_id {
                diplomas {
                  diploma_photo
                }
              }
              certificate_process_pdfs {
                certificate_process_id {
                  _id
                }
                parchemins_certificate
                block_certificate
                supplement_certificate
                certification_process_status
                date_issuance
              }
              createdAt
              certification_process_status
              certificate_issuance_status
              identity_verification_status
              is_photo_in_s3
              photo_s3_path
              is_thumbups_green
              status
              school {
                _id
                short_name
              }
              rncp_title {
                _id
                short_name
              }
              current_class {
                _id
                name
              }
              final_transcript_id {
                _id
                status
                final_transcript_status
                certification_status
                jury_decision_for_final_transcript
                input_final_decision_status
                is_validated
                student_decision
                after_final_retake_decision
                has_jury_finally_decided
                retake_test_for_students {
                  test_id {
                    _id
                  }
                }
              }
              user_id {
                _id
              }
              job_description_id {
                _id
                job_name
                job_description_status
              }
              problematic_id {
                _id
                problematic_status
              }
              mentor_evaluation_id {
                _id
                mentor_evaluation_status
              }
              employability_survey_ids {
                _id
                survey_status
                validator
                employability_survey_process_id {
                  _id
                }
                employability_survey_parameter_id {
                  _id
                }
              }
              soft_skill_pro_evaluation {
                status
              }
              academic_pro_evaluation {
                status
              }
              companies {
                company {
                  _id
                  company_name
                }
                status
                mentor {
                  _id
                  first_name
                  last_name
                  civility
                  email
                }
              }
              certificate_process_pdfs {
                parchemins_certificate
                block_certificate
                supplement_certificate
              }
            }
          }
        `,
        variables: {
          rncpId,
          classId,
          pagination: pagination ? pagination : { page: 0, limit: 10 },
          sort: sortValue ? sortValue : {},
          filter: filter ? filter : null,
          certificate_issuance_process_id: certificate_issuance_process_id ? certificate_issuance_process_id : null,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllStudents']));
  }

  getStudentsCardDataSendToCertifierProblematic(schoolId, rncpId, classId): Observable<StudentTableData[]> {
    return this.apollo
      .query<StudentTableData[]>({
        query: gql`
        query{
          GetAllStudents(
          sorting: { last_name: asc },
          school: "${schoolId}",
          rncp_title: "${rncpId}",
          current_class: "${classId}",
          status: active_completed,
          filter: {problematic: sent_to_certifier}
        ) {
            _id
            civility
            first_name
            last_name
            photo
            is_photo_in_s3
            photo_s3_path
            rncp_title {
              _id
              short_name
            }
            current_class {
              _id
              name
            }
            email
            status
            student_title_status
            incorrect_email
            previous_courses_id {
              _id
              rncp_id{
                _id
              }
              class_id {
                _id
              }
            }
          }
        }`,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllStudents']));
  }

  getStudentsCardData(schoolId, rncpId, classId, studentStatus, status): Observable<StudentTableData[]> {
    return this.apollo
      .query<StudentTableData[]>({
        query: gql`
          query{
            GetAllStudents(
            sorting: { last_name: asc },
            school: "${schoolId}",
            rncp_title: "${rncpId}",
            current_class: "${classId}",
            filter: {student_status: ${studentStatus}},
            status: ${status}
          ) {
            _id
            civility
            first_name
            last_name
            photo
            is_photo_in_s3
            photo_s3_path
            rncp_title {
              _id
              short_name
            }
            current_class {
              _id
              name
            }
            email
            status
            student_title_status
            incorrect_email
            previous_courses_id {
              _id
              rncp_id{
                _id
              }
              class_id {
                _id
              }
              status
              student_title_status
            }
          }
        }`,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllStudents']));
  }

  getOneStudentsCardDataPreviousCourse(schoolId: string, rncpId: string, classId: string, studentId: string): Observable<any[]> {
    return this.apollo
      .query<StudentTableData[]>({
        query: gql`
        query{
          GetAllStudents(
            sorting: { last_name: asc },
            school: "${schoolId}",
            rncp_title: "${rncpId}",
            current_class: "${classId}",
            status: student_card_active_completed,
            student_ids: ["${studentId}"]
          ) {
            _id
            civility
            first_name
            last_name
            photo
            is_photo_in_s3
            photo_s3_path
            rncp_title {
              _id
              short_name
            }
            current_class {
              _id
              name
            }
            email
            status
            student_title_status
            tele_phone
            incorrect_email
            previous_courses_id {
              _id
              rncp_id{
                _id
              }
              class_id {
                _id
              }
              status
              student_title_status
            }
            soft_skill_pro_evaluation {
                status
              }
              academic_pro_evaluation {
                status
              }
            is_thumbups_green
            user_id{
              _id
            }
            school{
              _id
              short_name
            }
            group_details {
              name
              test {
                name
              }
            }
            incorrect_email
            date_of_birth
            place_of_birth
            identity_verification_status
            job_description_id{
              _id
              job_description_status
            }
            problematic_id{
              _id
              problematic_status
            }
            mentor_evaluation_id{
              _id
              mentor_evaluation_status
            }
            employability_survey_ids{
              _id
              survey_status
            }
            final_transcript_id {
                _id
                status
                final_transcript_status
                certification_status
                jury_decision_for_final_transcript
                input_final_decision_status
                is_validated
                student_decision
                after_final_retake_decision
                has_jury_finally_decided
                retake_test_for_students {
                  test_id {
                    _id
                  }
                }
            }
            user_id {              
              last_login {
                date
                time
              }
            }
            partial_blocks {
              _id
              block_of_competence_condition
            }
            reason_for_resignation
            date_of_resignation
            resignation_by {
              _id
              civility
              first_name
              last_name
            }
            companies {
              company {
                status
              }
              mentor {
                last_name
                first_name
                civility
                email
              }
            }
          }
        }`,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllStudents']));
  }

  getOneStudentsCardData(
    schoolId: string,
    rncpId: string,
    classId: string,
    studentId: string,
    studentStatus: string,
    status: string,
  ): Observable<any[]> {
    return this.apollo
      .query<StudentTableData[]>({
        query: gql`
          query getOneStudentsCardData(
            $schoolId: ID
            $rncpId: ID
            $classId: ID
            $studentId: ID
            $studentStatus: EnumFilterStudentStatus
            $status: EnumFilterStatus
          ) {
            GetAllStudents(
              sorting: { last_name: asc }
              school: $schoolId
              rncp_title: $rncpId
              current_class: $classId
              filter: { student_status: $studentStatus }
              status: $status
              student_ids: [$studentId]
            ) {
              _id
              civility
              first_name
              last_name
              photo
              is_photo_in_s3
              photo_s3_path
              rncp_title {
                _id
                short_name
              }
              current_class {
                _id
                name
              }
              email
              status
              student_title_status
              tele_phone
              incorrect_email
              previous_courses_id {
                _id
                rncp_id {
                  _id
                }
                class_id {
                  _id
                }
                status
                student_title_status
              }
              soft_skill_pro_evaluation {
                status
              }
              academic_pro_evaluation {
                status
              }
              is_thumbups_green
              user_id {
                _id
              }
              school {
                _id
                short_name
              }
              group_details {
                name
                test {
                  name
                }
              }
              incorrect_email
              date_of_birth
              place_of_birth
              identity_verification_status
              job_description_id {
                _id
                job_description_status
              }
              problematic_id {
                _id
                problematic_status
              }
              mentor_evaluation_id {
                _id
                mentor_evaluation_status
              }
              employability_survey_ids {
                _id
                survey_status
              }
              final_transcript_id {
                _id
                status
                final_transcript_status
                certification_status
                jury_decision_for_final_transcript
                input_final_decision_status
                is_validated
                student_decision
                after_final_retake_decision
                has_jury_finally_decided
                retake_test_for_students {
                  test_id {
                    _id
                  }
                }
              }
              user_id {
                last_login {
                  date
                  time
                }
              }
              partial_blocks {
                _id
                block_of_competence_condition
              }
              reason_for_resignation
              date_of_resignation
              resignation_by {
                _id
                civility
                first_name
                last_name
              }
              companies {
                company {
                  status
                }
                mentor {
                  last_name
                  first_name
                  civility
                  email
                }
                status
              }
            }
          }
        `,
        fetchPolicy: 'network-only',
        variables: {
          schoolId,
          rncpId,
          classId,
          studentId,
          studentStatus,
          status,
        },
      })
      .pipe(map((resp) => resp.data['GetAllStudents']));
  }

  getOneStudent(studentId: string): Observable<any> {
    return this.apollo
      .query<any>({
        query: gql`
        query{
          GetOneStudent(
            _id: "${studentId}"
          ) {
            _id
            email
            first_name
            last_name
            civility
            rncp_title {
              _id
              short_name
              long_name
            }
            current_class {
              _id
              name
            }
            specialization {
              _id
            }
            photo_s3_path
            photo
            job_description_id {
              _id
              job_name
              company {
                status
                company {
                  company_name
                  company_logo
                  status
                }
              }
              mentor {
                _id
                first_name
                last_name
                civility
              }
              block_of_template_competences {
                competence_templates {
                  competence_template_id {
                    _id
                    ref_id
                  }
                  missions_activities_autonomy {
                    mission
                    activity
                    autonomy_level
                  }
                  is_mission_related_to_competence
                }
              }
            }
            school {
              logo
            }
            companies {
              status
              company {
                status
                _id
                company_name
                company_logo
              }
              mentor {
                _id
                first_name
                last_name
                civility
              }
            }
          }
        }`,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetOneStudent']));
  }

  getOneStudentUserId(studentId: string) {
    return this.apollo
      .query<any>({
        query: gql`
        query{
          GetOneStudent(
            _id: "${studentId}"
          ) {
            _id
            user_id {
              _id
            }
          }
        }`,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetOneStudent']));
  }

  getStudentsPdfPersonalized(schoolId: string, rncpId: string, classId: string, studentIds?): Observable<StudentTableData[]> {
    return this.apollo
      .query<StudentTableData[]>({
        query: gql`
          query getStudentsPdfPersonalized($school: ID, $rncp_title: ID, $current_class: ID, $student_ids: [ID]) {
            GetAllStudents(
              sorting: { last_name: asc }
              status: active_completed
              school: $school
              rncp_title: $rncp_title
              current_class: $current_class
              student_ids: $student_ids
            ) {
              _id
              civility
              first_name
              last_name
              school {
                _id
                short_name
              }
              job_description_id {
                block_of_template_competences {
                  block_of_template_competence_id {
                    _id
                  }
                  competence_templates {
                    competence_template_id {
                      _id
                    }
                    is_mission_related_to_competence
                    missions_activities_autonomy {
                      mission
                      activity
                      autonomy_level
                    }
                  }
                }
              }
            }
          }
        `,
        fetchPolicy: 'network-only',
        variables: {
          school: schoolId,
          rncp_title: rncpId,
          current_class: classId,
          student_ids: studentIds,
        },
      })
      .pipe(map((resp) => resp.data['GetAllStudents']));
  }

  getAllEvaluation(rncpId: string, classId: string): Observable<TestDropdown[]> {
    return this.apollo
      .query({
        query: gql`
        query{
          GetAllEvaluations(filter: {
            class_id: "${classId}"
            rncp_title_id: "${rncpId}"
          }){
            _id
            evaluation
            retake_evaluation{
              _id
              evaluation
            }
            retake_subject_id{
              _id
              status
            }
          }
        }`,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllEvaluations']));
  }

  GetAllSubjects(rncpId: string, classId: string): Observable<SchoolStudentTableSubject[]> {
    return this.apollo
      .query({
        query: gql`
        query{
          GetAllSubjects(filter: {
            class_id: "${classId}"
            rncp_title_id: "${rncpId}"
          }){
            _id
            subject_name
            order
            evaluations {
              _id
              evaluation
              order
              result_visibility
            }
          }
        }`,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllSubjects']));
  }

  getAllBlockCompetence(rncpId, classId, is_exclude_specialization?: boolean): Observable<TestDropdown[]> {
    return this.apollo
      .query<TestDropdown[]>({
        query: gql`
          query GetAllBlockOfCompetenceConditions(
            $rncp_title_id: ID!
            $class_id: ID!
            $is_retake_by_block: Boolean
            $is_exclude_specialization: Boolean
          ) {
            GetAllBlockOfCompetenceConditions(
              class_id: $class_id
              rncp_title_id: $rncp_title_id
              is_retake_by_block: $is_retake_by_block
              is_exclude_specialization: $is_exclude_specialization
            ) {
              _id
              block_of_competence_condition
              specialization {
                _id
              }
            }
          }
        `,
        fetchPolicy: 'network-only',
        variables: {
          rncp_title_id: rncpId,
          class_id: classId,
          is_retake_by_block: false,
          is_exclude_specialization: is_exclude_specialization,
        },
      })
      .pipe(map((resp) => resp.data['GetAllBlockOfCompetenceConditions']));
  }

  getStudentsCourseData(studentId: string): Observable<any> {
    return this.apollo
      .query({
        query: gql`
        query{
          GetOneStudent(_id: "${studentId}"){
            _id
            rncp_title {
              _id
            }
            current_class {
              _id
            }
            specialization {
              _id
              name
            }
            parallel_intake
            email
            is_take_full_prepared_title
            is_have_exemption_block
            partial_blocks {
              _id
              block_of_competence_condition
            }
            exemption_blocks {
              block_id {
                _id
              }
              reason
              rncp_title_in_platform {
                _id
              }
              rncp_title_outside_platform
              justification_document
            }
            exemption_block_justifications {
              s3_file_name
              document_name
            }
          }
        }`,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetOneStudent']));
  }

  getStudentsPreviousCourseData(schoolId: string, rncpId: string, classId: string, studentId: string): Observable<any[]> {
    return this.apollo
      .query({
        query: gql`
        query{
          GetAllStudents(
            sorting: { last_name: asc },
            school: "${schoolId}",
            rncp_title: "${rncpId}",
            current_class: "${classId}",
            status: student_card_active_completed,
            student_ids: ["${studentId}"]
          ){
            _id
            rncp_title {
              _id
            }
            current_class {
              _id
            }
            specialization {
              _id
              name
            }
            parallel_intake
            email
            is_take_full_prepared_title
            is_have_exemption_block
            partial_blocks {
              _id
              block_of_competence_condition
            }
            exemption_blocks {
              block_id {
                _id
              }
              reason
              rncp_title_in_platform {
                _id
              }
              rncp_title_outside_platform
              justification_document
            }
            exemption_block_justifications {
              s3_file_name
              document_name
            }
          }
        }`,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllStudents']));
  }

  getStudentsIdentityData(studentId: string, titleId?: string, classId?: string): Observable<any> {
    return this.apollo
      .query({
        query: gql`
          query GetOneStudent($_id: ID!, $rncp_title_id: ID, $class_id: ID) {
            GetOneStudent(_id: $_id, rncp_title_id: $rncp_title_id, class_id: $class_id) {
              _id
              civility
              first_name
              last_name
              tele_phone
              email
              date_of_birth
              place_of_birth
              nationality
              user_id {
                _id
              }
              send_date_acad_pro {
                date_utc
                time_utc
              }
              send_date_soft_skill {
                date_utc
                time_utc
              }
              student_address {
                address
                postal_code
                country
                city
                region
                department
                is_main_address
              }
              job_description_id {
                _id
              }
              photo
              is_photo_in_s3
              photo_s3_path
              academic_journey_id {
                _id
                general_presentation {
                  first_name
                  photo
                }
              }
              send_date_soft_skill {
                date_utc
                time_utc
              }
              soft_skill_pro_evaluation {
                status
                test_id {
                  _id
                  send_date_to_mentor {
                    date_utc
                    time_utc
                  }
                }
                last_access {
                  date_utc
                  time_utc
                }
              }
              send_date_acad_pro {
                date_utc
                time_utc
              }
              soft_skill_auto_evaluation {
                test_id {
                  _id
                  name
                  is_published
                  published_date
                }
                task_id {
                  _id
                }
                status
              }
              academic_pro_evaluation {
                status
                test_id {
                  _id
                  send_date_to_mentor {
                    date_utc
                    time_utc
                  }
                }
                last_access {
                  date_utc
                  time_utc
                }
              }
              academic_auto_evaluation {
                task_id {
                  _id
                }
                test_id {
                  _id
                  name
                  is_published
                  published_date
                }
                status
              }
              companies {
                status
                start_date {
                  date
                  time
                }
                end_date {
                  date
                  time
                }
                contract_closed_date {
                  date
                  time
                }
                reason_deactivating_contract
                company {
                  status
                  _id
                  company_name
                  company_logo
                }
                mentor {
                  _id
                  first_name
                  last_name
                  civility
                  user_status
                }
              }
              type_of_formation
              vae_access
              postal_code_of_birth
            }
          }
        `,
        variables: {
          _id: studentId,
          rncp_title_id: titleId ? titleId : null,
          class_id: classId ? classId : null,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetOneStudent']));
  }

  getStudentsPreviousCourseIdentityData(schoolId: string, rncpId: string, classId: string, studentId: string): Observable<any[]> {
    return this.apollo
      .query({
        query: gql`
        query{
          GetAllStudents(
            sorting: { last_name: asc },
            school: "${schoolId}",
            rncp_title: "${rncpId}",
            current_class: "${classId}",
            status: student_card_active_completed,
            student_ids: ["${studentId}"]
          ) {
            _id
            civility
            first_name
            last_name
            tele_phone
            email
            date_of_birth
            place_of_birth
            nationality
            send_date_acad_pro {
              date_utc
              time_utc
            }
            send_date_soft_skill {
              date_utc
              time_utc
            }
            student_address {
              address
              postal_code
              country
              city
              region
              department
              is_main_address
            }
            job_description_id {
              _id
            }
            photo
            is_photo_in_s3
            photo_s3_path
            academic_journey_id {
              _id
              general_presentation {
                first_name
                photo
              }
            }
            companies {
              status
              company {
                status
                _id
                company_name
                company_logo
              }
              mentor {
                _id
                first_name
                last_name
                civility
                user_status
              }
            }
            send_date_soft_skill {
              date_utc
              time_utc
            }
            soft_skill_pro_evaluation {
              status
              test_id {
                _id
                send_date_to_mentor {
                  date_utc
                  time_utc
                }
              }
              last_access {
                date_utc
                time_utc
              }
            }
            send_date_acad_pro {
              date_utc
              time_utc
            }
            soft_skill_auto_evaluation {
              test_id {
                _id
                name
                is_published
                published_date
              }
              task_id {
                _id
              }
              status
            }
            academic_pro_evaluation {
              status
              test_id {
                _id
                send_date_to_mentor {
                  date_utc
                  time_utc
                }
              }
              last_access {
                date_utc
                time_utc
              }
            }
            academic_auto_evaluation {
                task_id {
                  _id
                }
                test_id {
                  _id
                  name
                  is_published
                  published_date
                }
                status
              }
          }
        }`,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllStudents']));
  }

  getStudentsJobDescIdentityData(studentId: string): Observable<any> {
    return this.apollo
      .query({
        query: gql`
        query{
          GetOneStudent(_id: "${studentId}"){
            _id
            civility
            first_name
            last_name
            tele_phone
            email
            date_of_birth
            place_of_birth
            nationality
            professional_email
            parents{
              relation
              family_name
              name
              civility
              job
              professional_email
              email
              parent_address{
                address
                postal_code
                city
                country
              }
            }
            job_description_id {
              _id
            }
            school {
              _id
              short_name
              long_name
            }
            rncp_title {
              _id
              short_name
              long_name
            }
            current_class {
              name
            }
            student_address {
              address
              postal_code
              country
              city
              region
              department
              is_main_address
            }
            companies {
              company {
                _id
                company_name
              }
            job_description_id {
              _id
            }
            problematic_id {
              _id
            }
            mentor_evaluation_id {
              _id
            }
              is_active
              status
              mentor {
                _id
                first_name
                last_name
                civility
              }
              start_date{
                date
                time
              }
              end_date{
                date
                time
              }
            }
            photo
            is_photo_in_s3
            photo_s3_path
          }
        }`,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetOneStudent']));
  }

  getStudentsPreviousCourseJobDescIdentityData(schoolId: string, rncpId: string, classId: string, studentId: string): Observable<any[]> {
    return this.apollo
      .query({
        query: gql`
        query{
          GetAllStudents(
            sorting: { last_name: asc },
            school: "${schoolId}",
            rncp_title: "${rncpId}",
            current_class: "${classId}",
            status: student_card_active_completed,
            student_ids: ["${studentId}"]
          ){
            _id
            civility
            first_name
            last_name
            tele_phone
            email
            date_of_birth
            place_of_birth
            nationality
            professional_email
            parents{
              relation
              family_name
              name
              civility
              job
              professional_email
              email
              parent_address{
                address
                postal_code
                city
                country
              }
            }
            job_description_id {
              _id
            }
            school {
              _id
              short_name
              long_name
            }
            rncp_title {
              _id
              short_name
              long_name
            }
            current_class {
              name
            }
            student_address {
              address
              postal_code
              country
              city
              region
              department
              is_main_address
            }
            companies {
              company {
                _id
                company_name
              }
            job_description_id {
              _id
            }
            problematic_id {
              _id
            }
            mentor_evaluation_id {
              _id
            }
              is_active
              status
              mentor {
                _id
                first_name
                last_name
                civility
              }
              start_date{
                date
                time
              }
              end_date{
                date
                time
              }
            }
            photo
            is_photo_in_s3
            photo_s3_path
          }
        }`,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllStudents']));
  }

  getStudentsESDetailData(studentId: string): Observable<any> {
    return this.apollo
      .query({
        query: gql`
        query{
          GetOneStudent(_id: "${studentId}"){
            _id
            civility
            first_name
            last_name
            tele_phone
            email
            date_of_birth
            place_of_birth
            nationality
            professional_email
            parents{
              relation
              family_name
              name
              civility
              job
              professional_email
              email
              parent_address{
                address
                postal_code
                city
                country
              }
            }
            school {
              _id
              short_name
              long_name
            }
            rncp_title {
              _id
              short_name
              long_name
            }
            current_class {
              name
            }
            student_address {
              address
              postal_code
              country
              city
              region
              department
              is_main_address
            }
            companies {
              company {
                _id
                company_name
              }
              is_active
              status
              mentor {
                _id
                first_name
                last_name
                civility
              }
              start_date{
                date
                time
              }
              end_date{
                date
                time
              }
              contract_closed_date {
                date
                time
              }
              reason_deactivating_contract
            }
            photo
            is_photo_in_s3
            photo_s3_path
          }
        }`,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetOneStudent']));
  }

  getStudentsPreviousESDetailData(schoolId: string, rncpId: string, classId: string, studentId: string): Observable<any[]> {
    return this.apollo
      .query({
        query: gql`
        query{
          GetAllStudents(
            sorting: { last_name: asc },
            school: "${schoolId}",
            rncp_title: "${rncpId}",
            current_class: "${classId}",
            status: active_completed_suspended,
            student_ids: ["${studentId}"]
          ){
            _id
            civility
            first_name
            last_name
            tele_phone
            email
            date_of_birth
            place_of_birth
            nationality
            professional_email
            parents{
              relation
              family_name
              name
              civility
              job
              professional_email
              email
              parent_address{
                address
                postal_code
                city
                country
              }
            }
            school {
              _id
              short_name
              long_name
            }
            rncp_title {
              _id
              short_name
              long_name
            }
            current_class {
              name
            }
            student_address {
              address
              postal_code
              country
              city
              region
              department
              is_main_address
            }
            companies {
              company {
                _id
                company_name
              }
              is_active
              status
              mentor {
                _id
                first_name
                last_name
                civility
              }
              start_date{
                date
                time
              }
              end_date{
                date
                time
              }
            }
            photo
            is_photo_in_s3
            photo_s3_path
          }
        }`,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllStudents']));
  }

  getStudentsCompanyData(studentId: string, titleId?: string, classId?: string): Observable<any> {
    return this.apollo
      .query({
        query: gql`
          query ($_id: ID!, $rncp_title_id: ID, $class_id: ID) {
            GetOneStudent(_id: $_id, rncp_title_id: $rncp_title_id, class_id: $class_id) {
              _id
              certificate_issuance_status
              identity_verification_status
              final_transcript_id {
                final_transcript_status
                certification_status
              }
              companies {
                category_insertion
                type_of_formation
                company {
                  _id
                  company_name
                }
                start_date {
                  date
                  time
                }
                end_date {
                  date
                  time
                }
                contract_closed_date {
                  date
                  time
                }
                reason_deactivating_contract
                status
                is_active
                mentor {
                  _id
                  first_name
                  last_name
                  civility
                  user_status
                  email
                }
                job_description_id {
                  _id
                  job_description_status
                  status
                  class_id {
                    _id
                  }
                }
                problematic_id {
                  _id
                  problematic_status
                  status
                }
                mentor_evaluation_id {
                  _id
                  mentor_evaluation_status
                  status
                }
              }
              job_description_id {
                _id
                job_description_status
                status
                class_id {
                  _id
                }
              }
              problematic_id {
                _id
                problematic_status
                status
              }
              mentor_evaluation_id {
                _id
                mentor_evaluation_status
                status
              }
              retake_tests {
                _id
              }
              soft_skill_pro_evaluation {
                status
                test_id {
                  _id
                  send_date_to_mentor {
                    date_utc
                    time_utc
                  }
                }
              }
              academic_pro_evaluation {
                status
                test_id {
                  _id
                  send_date_to_mentor {
                    date_utc
                    time_utc
                  }
                }
              }
            }
          }
        `,
        variables: {
          _id: studentId,
          rncp_title_id: titleId ? titleId : null,
          class_id: classId ? classId : null,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetOneStudent']));
  }

  getStudentsPreviousCourseCompanyData(schoolId: string, rncpId: string, classId: string, studentId: string): Observable<any[]> {
    return this.apollo
      .query({
        query: gql`
      query {
        GetAllStudents(
          sorting: { last_name: asc },
          school: "${schoolId}",
          rncp_title: "${rncpId}",
          current_class: "${classId}",
          status: student_card_active_completed,
          student_ids: ["${studentId}"]
        ) {
          _id
          certificate_issuance_status
          identity_verification_status
          final_transcript_id {
            final_transcript_status
            certification_status
          }
          companies {
            company {
              _id
              company_name
            }
            start_date {
              date
              time
            }
            end_date {
              date
              time
            }
            contract_closed_date {
              date
              time
            }
            reason_deactivating_contract
            status
            is_active
            mentor {
              _id
              first_name
              last_name
              civility
              user_status
              email
            }
            job_description_id {
              _id
              job_description_status
              status
              class_id {
                _id
              }
            }
            problematic_id {
              _id
              problematic_status
              status
            }
            mentor_evaluation_id {
              _id
              mentor_evaluation_status
              status
            }
          }
          job_description_id {
            _id
            job_description_status
            status
            class_id {
              _id
            }
          }
          problematic_id {
            _id
            problematic_status
            status
          }
          mentor_evaluation_id {
            _id
            mentor_evaluation_status
            status
          }
          retake_tests {
            _id
          }
          soft_skill_pro_evaluation {
            status
            test_id {
              _id
              send_date_to_mentor {
                date_utc
                time_utc
              }
            }
          }
          academic_pro_evaluation {
            status
            test_id {
              _id
              send_date_to_mentor {
                date_utc
                time_utc
              }
            }
          }
        }
      }`,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllStudents']));
  }

  getStudentsDetailData(studentId: string, titleId?: string, classId?: string): Observable<any> {
    return this.apollo
      .query({
        query: gql`
          query GetOneStudentDetails($_id: ID!, $rncp_title_id: ID, $class_id: ID) {
            GetOneStudent(_id: $_id, rncp_title_id: $rncp_title_id, class_id: $class_id) {
              _id
              certificate_issuance_status
              final_transcript_id {
                final_transcript_status
                certification_status
              }
              user_id {
                _id
              }
              companies {
                company {
                  _id
                  company_name
                }
                start_date {
                  date
                  time
                }
                end_date {
                  date
                  time
                }
                contract_closed_date {
                  date
                  time
                }
                reason_deactivating_contract
                status
                is_active
                mentor {
                  _id
                  first_name
                  last_name
                  civility
                }
              }
              job_description_id {
                _id
                job_description_status
                status
                class_id {
                  _id
                }
              }
              problematic_id {
                _id
                problematic_status
                status
              }
              mentor_evaluation_id {
                _id
                mentor_evaluation_status
                status
              }
              employability_survey_ids {
                _id
              }
              retake_tests {
                _id
              }
              admission_status
              admission_process_id {
                _id
                steps {
                  _id
                  step_type
                }
              }
            }
          }
        `,
        variables: {
          _id: studentId,
          rncp_title_id: titleId ? titleId : null,
          class_id: classId ? classId : null,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetOneStudent']));
  }

  getStudentAdmissionFormStatus(studentId: string): Observable<any> {
    return this.apollo
      .query({
        query: gql`
        query GetOneStudentDetails{
          GetOneStudent(_id: "${studentId}"){
            _id
            admission_status
            admission_process_id {
              _id
              steps {
                _id
                step_type
              }
            }
          }
        }`,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetOneStudent']));
  }

  getStudentsPreviousDetailData(schoolId: string, rncpId: string, classId: string, studentId: string): Observable<any[]> {
    return this.apollo
      .query({
        query: gql`
        query {
          GetAllStudents(
            sorting: { last_name: asc },
            school: "${schoolId}",
            rncp_title: "${rncpId}",
            current_class: "${classId}",
            status: student_card_active_completed,
            student_ids: ["${studentId}"]
          ){
            _id
            certificate_issuance_status
            final_transcript_id {
              final_transcript_status
              certification_status
            }
            user_id {
              _id
            }
            companies {
              company {
                _id
                company_name
              }
              start_date {
                date
                time
              }
              end_date {
                date
                time
              }
              status
              is_active
              mentor {
                _id
                first_name
                last_name
                civility
              }
            }
            job_description_id {
              _id
              job_description_status
              status
              class_id {
                _id
              }
            }
            problematic_id {
              _id
              problematic_status
              status
            }
            mentor_evaluation_id {
              _id
              mentor_evaluation_status
              status
            }
            employability_survey_ids{
              _id
            }
            retake_tests {
              _id
            }
            admission_status
            admission_process_id {
              _id
              steps {
                step_type
              }
            }
          }
        }`,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllStudents']));
  }

  getCompanyData(studentId: string): Observable<any> {
    return this.apollo
      .query({
        query: gql`
        query{
          GetOneStudent(_id: "${studentId}"){
            _id
            companies {
              company {
                _id
                company_name
                company_addresses {
                  address
                  city
                  region
                  postal_code
                  country
                }
              }
              start_date {
                date
                time
              }
              end_date {
                date
                time
              }
              status
              is_active
              mentor {
                _id
                first_name
                last_name
                civility
              }
            }
          }
        }`,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetOneStudent']));
  }

  getStudentsCertification(studentId: string): Observable<any> {
    return this.apollo
      .query({
        query: gql`
        query{
          GetOneStudent(_id: "${studentId}"){
            _id
            first_name
            last_name
            civility
            date_of_birth
            is_thumbups_green
            academic_journey_id {
              diplomas {
                diploma_photo
              }
            }
            rncp_title {
              _id
              short_name
              long_name
              rncp_level
              certifier{
                logo
              }
            }
            school {
              _id
              short_name
            }
            certificate_issuance_status
            identity_verification_status
            certificate_issued_on {
              year
              month
              date
            }
            final_transcript_pdf_link
            final_transcript_id {
              _id
              status
              final_transcript_status
              certification_status
              final_transcript_generated_on{
                year
                date
                month
                day
              }
              jury_decision_for_final_transcript
              jury_decision_generated_on{
                year
                date
                month
                day
              }
              retake_test_for_students{
                test_id {
                  _id
                }
                name
                position
                is_test_accepted_by_student
              }
              retake_block_for_students{
                test_id{
                  _id
                }
                name
                block_name
                is_test_accepted_by_student
                block_id{
                  _id
                  is_retake_by_block
                  selected_block_retake {
                    _id
                    block_of_competence_condition
                  }
                }
              }
              input_final_decision_status
              is_validated
              student_decision
              student_decision_generated_on{
                year
                date
                month
                day
              }
              after_final_retake_decision
              after_final_retake_decision_generated_on{
                year
                date
                month
                day
              }
              has_jury_finally_decided
            }
            final_transcript_pdf_histories {
              transcript_process_id {
                _id
              }
              student_transcript_id {
                _id
              }
              final_transcript_pdf_link
            }
          }
        }`,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetOneStudent']));
  }

  getStudentsPreviousCertification(schoolId: string, rncpId: string, classId: string, studentId: string): Observable<any[]> {
    return this.apollo
      .query({
        query: gql`
        query{
          GetAllStudents(
            sorting: { last_name: asc },
            school: "${schoolId}",
            rncp_title: "${rncpId}",
            current_class: "${classId}",
            status: student_card_active_completed,
            student_ids: ["${studentId}"]
          ){
            _id
            first_name
            last_name
            civility
            date_of_birth
            is_thumbups_green
            academic_journey_id {
              diplomas {
                diploma_photo
              }
            }
            rncp_title {
              _id
              short_name
              long_name
              rncp_level
            }
            school {
              _id
              short_name
            }
            certificate_issuance_status
            identity_verification_status
            certificate_issued_on {
              year
              month
              date
            }
            final_transcript_pdf_link
            final_transcript_id {
              _id
              status
              final_transcript_status
              certification_status
              final_transcript_generated_on{
                year
                date
                month
                day
              }
              jury_decision_for_final_transcript
              jury_decision_generated_on{
                year
                date
                month
                day
              }
              retake_test_for_students{
                test_id {
                  _id
                }
                name
                position
                is_test_accepted_by_student
              }
              retake_block_for_students{
                test_id{
                  _id
                }
                name
                block_name
                is_test_accepted_by_student
                block_id{
                  _id
                  is_retake_by_block
                  selected_block_retake {
                    _id
                    block_of_competence_condition
                  }
                }
              }
              input_final_decision_status
              is_validated
              student_decision
              student_decision_generated_on{
                year
                date
                month
                day
              }
              after_final_retake_decision
              after_final_retake_decision_generated_on{
                year
                date
                month
                day
              }
              has_jury_finally_decided
            }
            final_transcript_pdf_histories {
              transcript_process_id {
                _id
              }
              student_transcript_id {
                _id
              }
              final_transcript_pdf_link
            }
          }
        }`,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllStudents']));
  }

  getStudentsDetailCertification(studentId: string): Observable<any> {
    return this.apollo
      .query({
        query: gql`
        query{
          GetOneStudent(_id: "${studentId}"){
            _id
            first_name
            last_name
            civility
            sex
            email
            date_of_birth
            place_of_birth
            nationality
            tele_phone
            student_address {
              address
              postal_code
              city
              region
              department
              country
              is_main_address
            }
            certificate_issuance_status
            identity_verification_status
            certificate_issued_on {
              year
              month
              date
            }
            school {
              short_name
              long_name
              school_address {
                address1
                address2
                postal_code
                city
                region
                department
                country
              }
              country
              preparation_center_ats {
                rncp_title_id {
                  _id
                  short_name
                }
                selected_specializations {
                  _id
                  name
                }
              }
              certifier_ats {
                _id
                short_name
              }
              school_siret
              status
            }
            rncp_title {
              _id
              short_name
              long_name
              rncp_code
              rncp_level
              journal_text
              journal_date
            }
            certificate_process_pdfs {
              certificate_process_id {
                _id
                date_of_certificate_issuance
                certificate_process_status
                rncp_id {
                  _id
                }
                class_id {
                  _id
                }
              }
              certification_process_status
            }
          }
        }`,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetOneStudent']));
  }

  getStudentsPrevCourseDetailCertification(schoolId: string, rncpId: string, classId: string, studentId: string): Observable<any[]> {
    return this.apollo
      .query({
        query: gql`
        query{
          GetAllStudents(
            sorting: { last_name: asc },
            school: "${schoolId}",
            rncp_title: "${rncpId}",
            current_class: "${classId}",
            status: student_card_active_completed,
            student_ids: ["${studentId}"]
          ){
            _id
            first_name
            last_name
            civility
            sex
            email
            date_of_birth
            place_of_birth
            nationality
            tele_phone
            student_address {
              address
              postal_code
              city
              region
              department
              country
              is_main_address
            }
            certificate_issuance_status
            identity_verification_status
            certificate_issued_on {
              year
              month
              date
            }
            school {
              short_name
              long_name
              school_address {
                address1
                address2
                postal_code
                city
                region
                department
                country
              }
              country
              preparation_center_ats {
                rncp_title_id {
                  _id
                  short_name
                }
                selected_specializations {
                  _id
                  name
                }
              }
              certifier_ats {
                _id
                short_name
              }
              school_siret
              status
            }
            rncp_title {
              _id
              short_name
              long_name
              rncp_code
              rncp_level
              journal_text
              journal_date
            }
            certificate_process_pdfs {
              certificate_process_id {
                _id
                date_of_certificate_issuance
                certificate_process_status
                rncp_id {
                  _id
                }
                class_id {
                  _id
                }
              }
              certification_process_status
            }
          }
        }`,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllStudents']));
  }

  getStudentsParentData(studentId: string): Observable<any> {
    return this.apollo
      .query({
        query: gql`
        query{
          GetOneStudent(_id: "${studentId}"){
            email
            student_address {
              address
              postal_code
              country
              city
              region
              department
              is_main_address
            }
            parents {
              relation
              family_name
              name
              civility
              tele_phone
              email
              is_same_address
              parent_address {
                address
                postal_code
                country
                city
                region
                department
                is_main_address
              }
            }
          }
        }`,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetOneStudent']));
  }

  getStudentsESData(student_id: string, title_id: string, class_id: string): Observable<any> {
    return this.apollo
      .query({
        query: gql`
        query GetOneStudentDetails($student_id: ID!, $title_id: ID, $class_id: ID) {
          GetOneStudent(_id: $student_id, rncp_title_id: $title_id, class_id: $class_id){
            _id
            civility
            first_name
            last_name
            school {
              short_name
            }
            employability_survey_ids{
              _id
              send_date
              send_time
              expiration_date
              expiration_time
              questionnaire_id{
                _id
                questionnaire_name
              }
              form_builder_id {
                form_builder_name
              }
              survey_status
              validator
              employability_survey_process_id {
                _id
                name
              }
              employability_survey_parameter_id {
                send_date
                send_time
                expiration_date
                expiration_time
              }
            }
          }
        }`,
        variables: {
          student_id,
          title_id,
          class_id,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetOneStudent']));
  }

  getStudentsPreviousESData(schoolId: string, rncpId: string, classId: string, studentId: string): Observable<any[]> {
    return this.apollo
      .query({
        query: gql`
        query {
          GetAllStudents(
            sorting: { last_name: asc },
            school: "${schoolId}",
            rncp_title: "${rncpId}",
            current_class: "${classId}",
            status: active_completed_suspended,
            student_ids: ["${studentId}"]
          ){
            _id
            civility
            first_name
            last_name
            school {
              short_name
            }
            employability_survey_ids{
              _id
              send_date
              send_time
              questionnaire_id{
                _id
                questionnaire_name
              }
              form_builder_id {
                form_builder_name
              }
              employability_survey_process_id{
                _id
                name
              }
              survey_status
              validator
            }
          }
        }`,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllStudents']));
  }

  updateStudentData(studentId: string, payload): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation UpdateStudent($studentId: ID!, $payload: StudentInput) {
            UpdateStudent(_id: $studentId, student_input: $payload) {
              _id
            }
          }
        `,
        variables: {
          studentId,
          payload,
        },
      })
      .pipe(map((resp) => resp.data['UpdateStudent']));
  }

  updateStudent(_id, payload, lang): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation UpdateStudent($_id: ID!, $payload: StudentInput, $lang: String) {
            UpdateStudent(_id: $_id, student_input: $payload, lang: $lang) {
              _id
            }
          }
        `,
        variables: {
          _id,
          payload,
          lang,
        },
      })
      .pipe(map((resp) => resp.data['UpdateStudent']));
  }

  IsFinalTranscriptStarted(rncp_id, class_id): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation  {
            IsFinalTranscriptStarted(rncp_id: "${rncp_id}", class_id: "${class_id}")
          }
        `,
      })
      .pipe(map((resp) => resp.data['IsFinalTranscriptStarted']));
  }

  SendStudentIdentityVerification(student_ids): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation SendStudentIdentityVerification($student_ids: [ID], $lang: String) {
            SendStudentIdentityVerification(student_ids: $student_ids, lang: $lang)
          }
        `,
        variables: {
          student_ids,
          lang: localStorage.getItem('currentLang'),
        },
      })
      .pipe(map((resp) => resp.data['SendStudentIdentityVerification']));
  }

  UpdateStudentIdentityVerificationStatus(student_id, identity_verification_status, titleId?, classId?): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation UpdateStudentIdentityVerificationStatus(
            $student_id: ID
            $identity_verification_status: EnumCertificateIssuanceStatus
            $lang: String
            $rncp_title_id: ID
            $class_id: ID
          ) {
            UpdateStudentIdentityVerificationStatus(
              student_id: $student_id
              identity_verification_status: $identity_verification_status
              lang: $lang
              rncp_title_id: $rncp_title_id
              class_id: $class_id
            ) {
              _id
              certificate_issuance_status
              identity_verification_status
            }
          }
        `,
        variables: {
          student_id,
          identity_verification_status,
          lang: localStorage.getItem('currentLang'),
          rncp_title_id: titleId,
          class_id: classId,
        },
      })
      .pipe(map((resp) => resp.data['UpdateStudentIdentityVerificationStatus']));
  }

  reactivateStudent(studentId: string, date: string, reason: string) {
    return this.apollo
      .mutate({
        mutation: gql`
        mutation ReactivateStudent(
          $studentId: ID!
          $date: String
          $reason: String
        ) {
          ReactivateStudent(
            student_id: $studentId
            date_of_reactivation: $date 
            reason_for_reactivation: $reason
          ) {
            _id
          }
        }
      `,
      variables: { studentId, date, reason }
      })
      .pipe(map((resp) => resp.data['ReactivateStudent']));
  }

  sendJobDesc(payload): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation ($job_desc_input: JobDescriptionInput, $lang: String) {
            CreateJobDescription(job_desc_input: $job_desc_input, lang: $lang) {
              _id
              job_name
            }
          }
        `,
        variables: {
          job_desc_input: payload,
          lang: localStorage.getItem('currentLang'),
        },
      })
      .pipe(map((resp) => resp.data['CreateJobDescription']));
  }

  updateCourseStudentData(studentId: string, payload): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation UpdateStudent($studentId: ID!, $payload: StudentInput) {
            UpdateStudent(_id: $studentId, student_input: $payload) {
              _id
              rncp_title {
                _id
              }
              current_class {
                _id
              }
            }
          }
        `,
        variables: {
          studentId,
          payload,
        },
      })
      .pipe(map((resp) => resp.data['UpdateStudent']));
  }

  RequestStudentEmailChange(student_id: string, rncp_id: string, school_id: string, reason: string): Observable<any> {
    return this.apollo.mutate({
      mutation: gql`
        mutation RequestStudentEmailChange($student_id: ID!, $rncp_id: ID!, $school_id: ID!, $reason: String, $lang: String!) {
          RequestStudentEmailChange(student_id: $student_id, rncp_id: $rncp_id, school_id: $school_id, reason: $reason, lang: $lang)
        }
      `,
      variables: { student_id, rncp_id, school_id, reason, lang: this.translate.currentLang },
    });
  }

  closeContractStudent(studentId: string, companyId: string, mentorId: string): Observable<any> {
    return this.apollo.mutate({
      mutation: gql`
      mutation {
        DeativateStudentCompanyContract (
          student_id: "${studentId}"
          company_id: "${companyId}"
          mentor_id: "${mentorId}"
        ) {
          _id
          first_name
          last_name
          civility
        }
      }
      `,
    });
  }

  deactivateStudent(studentId: string, reason: string, date: string, student_deactivated_tests_keep: string[]): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
      mutation DeactiveStudent ($student_deactivated_tests_keep: [ID]) {
        DeativateStudent(student_id: "${studentId}", reason_for_resignation: "${reason}", date_of_resignation: "${date}", student_deactivated_tests_keep: $student_deactivated_tests_keep) {
          _id
          first_name
          last_name
          email
        }
      }
      `,
        variables: {
          student_deactivated_tests_keep,
        },
      })
      .pipe(map((resp) => resp.data['DeativateStudent']));
  }

  deactiveStudentResignation(payload):Observable<any>{
    return this.apollo.mutate({
      mutation: gql`
      mutation DeativateStudent($student_id: ID!, $reason_for_resignation: String, $date_of_resignation: String, $student_deactivated_tests_keep: [ID]) {
        DeativateStudent(student_id: $student_id, reason_for_resignation: $reason_for_resignation, date_of_resignation: $date_of_resignation, student_deactivated_tests_keep: $student_deactivated_tests_keep) {
          _id
          email
          first_name
          last_name
        }
      }`, 
      variables : {
        student_id: payload?.student_id,
        reason_for_resignation: payload?.reason_for_resignation,
        date_of_resignation: payload?.date_of_resignation,
        student_deactivated_tests_keep: payload?.student_deactivated_tests_keep
      }
    })
    .pipe(map((resp)=> resp.data['DeativateStudent']));
  }

  checkAllowDeactivateStudent(studentId: string): Observable<any> {
    return this.apollo
      .query({
        query: gql`
      query checkAllowDeactivateStudent($studentId: ID) {
        CheckAllowDeactivateStudent(student_id: $studentId)
      }
      `,
        variables: {
          studentId,
        },
      })
      .pipe(map((resp) => resp.data['CheckAllowDeactivateStudent']));
  }

  getDeactiveStudentTestList(titleId, classId): Observable<any> {
    return this.apollo
      .query({
        query: gql`
          query {
            GetAllTests(rncp_title_id: "${titleId}", class_id: "${classId}", is_published: true) {
              _id
              name
              is_published
              block_of_competence_condition_id {
                _id
                block_of_competence_condition
              }
            }
          }`,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllTests']));
  }

  transferStudentToDifferentSchoolSameTitle(studentId: string, schoolId: string, lang: string): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
      mutation {
        TransferStudentToDifferentSchool(
          student_id: "${studentId}",
          school_id: "${schoolId}",
          lang: "${lang}",
        ) {
          _id
        }
      }
      `,
        errorPolicy: 'all',
      })
      .pipe(map((resp) => resp));
  }

  transferStudent(studentId: string, titleId: string, classId: string, schoolId: string, lang: string, specializationId: string): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
        mutation TransferStudent(
          $studentId: ID!, 
          $titleId: ID!, 
          $classId: ID!, 
          $schoolId: ID!, 
          $lang: String,
          $specializationId: ID,
        ) {
          TransferStudent(
            student_id: $studentId,
            rncp_title_id: $titleId,
            class_id: $classId,
            school_id: $schoolId,
            lang: $lang,
            specialization_id: $specializationId,
          ) {
            _id
          }
        }
        `,
        variables: {
          studentId,
          titleId,
          classId,
          schoolId,
          specializationId,
          lang,
        },
        errorPolicy: 'all',
      })
      .pipe(map((resp) => resp));
  }

  getAllDeactivatedAndSuspendedStudentsChiefGroup(pagination, school_ids, sortValue, filter): Observable<StudentTableData[]> {
    return this.apollo
      .watchQuery<StudentTableData[]>({
        query: gql`
          query getAllDeactivatedAndSuspendedStudentsChiefGroup($pagination: PaginationInput, $school_ids: [ID], $sort: StudentSorting) {
            GetDeactivatedAndSuspendedStudents(
              pagination: $pagination,
              school_ids: $school_ids,
              sorting: $sort, ${filter},
            ) {
              count_document
              incorrect_email
              _id
              civility
              first_name
              last_name
              email
              photo
              date_of_birth
              place_of_birth
              tele_phone
              academic_journey_id {
                diplomas {
                  diploma_photo
                }
              }
              createdAt
              certificate_issuance_status
              identity_verification_status
              is_photo_in_s3
              photo_s3_path
              is_thumbups_green
              reason_for_resignation
              date_of_resignation
              status
              student_title_status
              school {
                _id
                short_name
              }
              rncp_title {
                _id
                short_name
              }
              current_class {
                _id
                name
              }
              final_transcript_id {
                _id
                status
                final_transcript_status
                certification_status
                jury_decision_for_final_transcript
                input_final_decision_status
                is_validated
                student_decision
                after_final_retake_decision
                has_jury_finally_decided
                retake_test_for_students {
                  test_id {
                    _id
                  }
                }
              }
              user_id {
                _id
              }
              job_description_id {
                _id
                job_name
                job_description_status
              }
              problematic_id {
                _id
                problematic_status
              }
              mentor_evaluation_id {
                _id
                mentor_evaluation_status
              }
              employability_survey_ids {
                _id
                survey_status
                validator
              }
              companies {
                company {
                  _id
                  company_name
                }
                status
                mentor {
                  _id
                  first_name
                  last_name
                  civility
                  email
                }
              }
            }
          }
        `,
        variables: {
          pagination,
          sort: sortValue ? sortValue : {},
          school_ids,
        },
        fetchPolicy: 'network-only',
      })
      .valueChanges.pipe(map((resp) => resp.data['GetDeactivatedAndSuspendedStudents']));
  }

  getAllDeactivatedAndSuspendedStudentsCR(pagination, sortValue, filter): Observable<StudentTableData[]> {
    return this.apollo
      .watchQuery<StudentTableData[]>({
        query: gql`
          query getAllDeactivatedAndSuspendedStudentsCR($pagination: PaginationInput, $sort: StudentSorting) {
            GetDeactivatedAndSuspendedStudents(
              pagination: $pagination, ${filter}, sorting: $sort
            ) {
              count_document
              incorrect_email
              _id
              civility
              first_name
              last_name
              email
              photo
              date_of_birth
              place_of_birth
              tele_phone
              academic_journey_id {
                diplomas {
                  diploma_photo
                }
              }
              createdAt
              certificate_issuance_status
              identity_verification_status
              is_photo_in_s3
              photo_s3_path
              is_thumbups_green
              reason_for_resignation
              date_of_resignation
              status
              student_title_status
              school {
                _id
                short_name
              }
              rncp_title {
                _id
                short_name
              }
              current_class {
                _id
                name
              }
              final_transcript_id {
                _id
                status
                final_transcript_status
                certification_status
                jury_decision_for_final_transcript
                input_final_decision_status
                is_validated
                student_decision
                after_final_retake_decision
                has_jury_finally_decided
                retake_test_for_students {
                  test_id {
                    _id
                  }
                }
              }
              user_id {
                _id
              }
              job_description_id {
                _id
                job_name
                job_description_status
              }
              problematic_id {
                _id
                problematic_status
              }
              mentor_evaluation_id {
                _id
                mentor_evaluation_status
              }
              employability_survey_ids {
                _id
                survey_status
                validator
              }
              companies {
                company {
                  _id
                  company_name
                }
                status
                mentor {
                  _id
                  first_name
                  last_name
                  civility
                  email
                }
              }
            }
          }
        `,
        variables: {
          pagination,
          sort: sortValue ? sortValue : {},
        },
        fetchPolicy: 'network-only',
      })
      .valueChanges.pipe(map((resp) => resp.data['GetDeactivatedAndSuspendedStudents']));
  }

  getAllDeactivatedAndSuspendedStudentsMentor(pagination, mentor_id, sortValue, filter): Observable<StudentTableData[]> {
    return this.apollo
      .watchQuery<StudentTableData[]>({
        query: gql`
          query getAllDeactivatedAndSuspendedStudentsMentor($pagination: PaginationInput, $mentor_id: ID, $sort: StudentSorting) {
            GetDeactivatedAndSuspendedStudents(
              pagination: $pagination,
              mentor_id: $mentor_id,
              ${filter},
              sorting: $sort,
            ) {
              count_document
              incorrect_email
              _id
              civility
              first_name
              last_name
              email
              photo
              date_of_birth
              place_of_birth
              tele_phone
              academic_journey_id {
                diplomas {
                  diploma_photo
                }
              }
              createdAt
              certificate_issuance_status
              identity_verification_status
              is_photo_in_s3
              photo_s3_path
              is_thumbups_green
              reason_for_resignation
              date_of_resignation
              status
              student_title_status
              school {
                _id
                short_name
              }
              rncp_title {
                _id
                short_name
              }
              current_class {
                _id
                name
              }
              final_transcript_id {
                _id
                status
                final_transcript_status
                certification_status
                jury_decision_for_final_transcript
                input_final_decision_status
                is_validated
                student_decision
                after_final_retake_decision
                has_jury_finally_decided
                retake_test_for_students {
                  test_id {
                    _id
                  }
                }
              }
              user_id {
                _id
              }
              job_description_id {
                _id
                job_name
                job_description_status
              }
              problematic_id {
                _id
                problematic_status
              }
              mentor_evaluation_id {
                _id
                mentor_evaluation_status
              }
              employability_survey_ids {
                _id
                survey_status
                validator
              }
              companies {
                company {
                  _id
                  company_name
                }
                status
                mentor {
                  _id
                  first_name
                  last_name
                  civility
                  email
                }
              }
            }
          }
        `,
        variables: {
          pagination,
          sort: sortValue ? sortValue : {},
          mentor_id,
        },
        fetchPolicy: 'network-only',
      })
      .valueChanges.pipe(map((resp) => resp.data['GetDeactivatedAndSuspendedStudents']));
  }

  getAllDeactivatedAndSuspendedStudents(pagination, sortValue, filter): Observable<any[]> {
    return this.apollo
      .watchQuery<any[]>({
        query: gql`
          query getAllDeactivatedAndSuspendedStudents($pagination: PaginationInput, $sort: StudentSorting) {
            GetDeactivatedAndSuspendedStudents(pagination: $pagination, sorting: $sort, ${filter}) {
              count_document
              incorrect_email
              _id
              civility
              first_name
              last_name
              email
              photo
              date_of_birth
              place_of_birth
              tele_phone
              academic_journey_id {
                diplomas {
                  diploma_photo
                }
              }
              createdAt
              certificate_issuance_status
              identity_verification_status
              is_photo_in_s3
              photo_s3_path
              is_thumbups_green
              reason_for_resignation
              date_of_resignation
              status
              student_title_status
              school {
                _id
                short_name
              }
              rncp_title {
                _id
                short_name
              }
              current_class {
                _id
                name
              }
              final_transcript_id {
                _id
                status
                final_transcript_status
                certification_status
                jury_decision_for_final_transcript
                input_final_decision_status
                is_validated
                student_decision
                after_final_retake_decision
                has_jury_finally_decided
                retake_test_for_students {
                  test_id {
                    _id
                  }
                }
              }
              user_id {
                _id
              }
              job_description_id {
                _id
                job_name
                job_description_status
              }
              problematic_id {
                _id
                problematic_status
              }
              mentor_evaluation_id {
                _id
                mentor_evaluation_status
              }
              employability_survey_ids {
                _id
                survey_status
                validator
              }
              companies {
                company {
                  _id
                  company_name
                }
                status
                mentor {
                  _id
                  first_name
                  last_name
                  civility
                  email
                }
              }
            }
          }
        `,
        variables: {
          pagination,
          sort: sortValue ? sortValue : {},
        },
        fetchPolicy: 'network-only',
      })
      .valueChanges.pipe(map((resp) => resp.data['GetDeactivatedAndSuspendedStudents']));
  }

  // ----------------------------------------------------------
  // ===================== DUMMY DATA =========================
  // ----------------------------------------------------------

  @Cacheable()
  getStudents(): Observable<any[]> {
    return this.httpClient.get<any[]>('assets/data/students.json');
  }

  @Cacheable()
  getCorrectionData(): Observable<any> {
    return this.httpClient.get<any[]>('assets/data/eval-pro-correction.json');
  }

  getNationalitiesList() {
    return this.nationalitiesList;
  }

  getNationalitiesFrList() {
    return this.nationalitiesFrList;
  }

  getCountriesList() {
    return this.CountryList;
  }

  getDummyStudent() {
    let tempRead;
    return (tempRead = [
      {
        _id: '5aaa5ad06a853f0fddecbd2b',
        first_name: 'Arnaud',
        last_name: 'Goujon',
        photo: '',
        is_photo_in_s3: false,
        photo_s3_path: null,
        is_thumb_up_green: null,
        status: 'active',
        school: {
          _id: '5a87023d3de35a550ae3ab6f',
          short_name: 'ALTEA',
        },
        rncp_title: {
          _id: '5a44b48e87c22c6b63007207',
          short_name: 'S-DMOE Sep2016',
        },
        final_transcript_id: null,
      },
    ]);
  }

  validateOrRejectStudentCvPresentation(docId: string, validationStatus: string, lang: string): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
      mutation {
        ValidateOrRejectCvAndPresentation(
          doc_id: "${docId}"
          validation_status: ${validationStatus}
          lang: "${lang}"
        ) {
          _id
        }
      }
      `,
      })
      .pipe(map((resp) => resp.data['ValidateOrRejectCvAndPresentation']));
  }

  getLimitationForDocument(docId): Observable<any> {
    return this.apollo
      .query({
        query: gql`
        query{
          GetLimitationForRejectDocument(doc_id: "${docId}"){
            operator_allow
            acad_allow
            due_date {
              date
              time
            }
          }
        }`,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetLimitationForRejectDocument']));
  }

  GenerateFinalTranscriptPDF(transcript_process_id, student_id): Observable<any[]> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation GenerateFinalTranscriptPDF($transcript_process_id: ID!, $student_id: ID!) {
            GenerateFinalTranscriptPDF(transcript_process_id: $transcript_process_id, student_id: $student_id)
          }
        `,
        variables: {
          transcript_process_id,
          student_id,
        },
      })
      .pipe(map((resp) => resp.data['GenerateFinalTranscriptPDF']));
  }

  checkStudentWithinSameClassAndTitle(filter) {
    return this.apollo
      .query({
        query: gql`
          query{
            GetAllEligibleStudentESProcess(${filter}){
              rncp_title {
                _id
              }
              class_id {
                _id
              }
              students {
                _id
              }
            }
          }
        `,
        fetchPolicy: 'network-only',
      })
      .pipe(
        map((resp) => {
          return resp.data['GetAllEligibleStudentESProcess'];
        }),
      );
  }

  SendOneTimeEmployabilitySurvey(employability_survey_process_input) {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation SendOneTimeEmployabilitySurvey($employability_survey_process_input: SendOneTimeEmployabilitySurveyProcessInput) {
            SendOneTimeEmployabilitySurvey(employability_survey_process_input: $employability_survey_process_input) {
              _id
            }
          }
        `,
        variables: {
          employability_survey_process_input,
          lang: localStorage.getItem('currentLang'),
        },
      })
      .pipe(map((resp) => resp.data['SendOneTimeEmployabilitySurvey']));
  }

  getClassList(): Observable<any> {
    return this.apollo
      .query({
        query: gql`
          query {
            GetAllClasses {
              _id
              name
            }
          }
        `,
        fetchPolicy: 'network-only',
      })
      .pipe(
        map((resp) => {
          return resp.data['GetAllClasses'];
        }),
      );
  }

  getClassListFilter(rncp_id): Observable<any> {
    return this.apollo
      .query({
        query: gql`
          query GetAllClasses($rncp_id: String) {
            GetAllClasses(rncp_id: $rncp_id) {
              _id
              name
            }
          }
        `,
        fetchPolicy: 'network-only',
        variables: {
          rncp_id,
        },
      })
      .pipe(
        map((resp) => {
          return resp.data['GetAllClasses'];
        }),
      );
  }

  getListYearOfCertifications(): Observable<string[]> {
    return this.apollo
      .query({
        query: gql`
          query {
            GetListYearOfCertifications {
              year
              has_completed_student
            }
          }
        `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetListYearOfCertifications']));
  }

  // To get all my document in student table
  getAllMydocument(pagination, filter, sorting): Observable<any> {
    return this.apollo.query({
      query: gql`
        query getAllMyDocuments($pagination: PaginationInput, $filter: MyDocumentFilterInput, $sorting: MyDocumentSorting) {
          GetAllMyDocuments(pagination: $pagination, filter: $filter, sorting: $sorting) {
            _id
            document_name
            s3_file_name
            document_generation_type
            updated_at
            count_document
            created_by {
              _id
            }
            type_of_document
            parent_class_id {
              _id
            }
            parent_rncp_title {
              _id
            }
            uploaded_for_student {
              _id
            }
            school_id {
              _id
            }
          }
        }
      `,
      variables: {
        pagination,
        filter,
        sorting,
      },
      fetchPolicy: 'network-only',
    });
    // .pipe(map((resp) => resp.data['GetAllMyDocuments']));
  }

  importStudentCompanies(payload, lang, file: File): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation ImportStudentCompany($import_student_company_input: ImportStudentCompany!, $lang: String, $file: Upload!) {
            ImportStudentCompany(import_student_company_input: $import_student_company_input, lang: $lang, file: $file) {
              studentCompaniesAdded {
                name
                status
                message
              }
              studentCompaniesNotAdded {
                name
                status
                message
              }
            }
          }
        `,
        variables: {
          import_student_company_input: payload,
          file: file,
          lang,
        },
        context: {
          useMultipart: true,
        },
      })
      .pipe(map((resp) => resp.data['ImportStudentCompany']));
  }

  sendReminderStudN1(student_id): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation SendReminderStudN1($lang: String, $student_id: ID!) {
            SendReminderStudN1(student_id: $student_id, lang: $lang)
          }
        `,
        variables: {
          student_id,
          lang: this.translate.currentLang,
        },
      })
      .pipe(map((resp) => resp.data['SendReminderStudN1']));
  }

  getAllFormBuilderFieldTypes(student_id, pagination, filter, sorting): Observable<any> {
    return this.apollo
      .query({
        query: gql`
          query GetAllFormBuilderFieldTypes(
            $student_id: ID
            $pagination: PaginationInput
            $filter: FilterFormBuilderFieldType
            $sorting: SortingFormBuilderFieldType
          ) {
            GetAllFormBuilderFieldTypes(student_id: $student_id, pagination: $pagination, filter: $filter, sorting: $sorting) {
              student_id {
                _id
                first_name
                last_name
              }
              count_document
              question_label
              question_answer
            }
          }
        `,
        variables: {
          student_id,
          pagination,
          filter,
          sorting,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllFormBuilderFieldTypes']));
  }

  getOneStudentSpecialization(student_id: string): Observable<string> {
    return this.apollo.query({
      query: gql`
      query GetOneStudentSpecialization($student_id: ID!) {
        GetOneStudent(_id: $student_id) {
          specialization {
            _id
          }
        }
      }`,
      variables: { student_id },
      fetchPolicy: 'network-only'
    }).pipe(map(res => res.data['GetOneStudent']?.specialization?._id))
  }

  getAllTitles() {
    return this.apollo.query({
      query: gql`
        query GetAllTitles {
          GetAllTitles {
            _id
            short_name
          }
        }
      `, fetchPolicy: 'network-only'
    })
    .pipe(map((resp) => resp.data['GetAllTitles']));
  }

  getAllClasses(rncp_id?) {
    return this.apollo.query({
      query: gql`
        query GetAllClasses($rncp_id: String) {
          GetAllClasses(rncp_id: $rncp_id) {
            _id
            name
          }
        }
      `, variables: { rncp_id }, fetchPolicy: 'network-only'
    })
    .pipe(map((resp) => resp.data['GetAllClasses']));
  }

  getAllSchools(rncp_title_ids?, class_id?) {
    return this.apollo.query({
      query: gql`
        query GetAllSchools($rncp_title_ids: [ID], $class_id: ID) {
          GetAllSchools(rncp_title_ids: $rncp_title_ids, class_id: $class_id) {
            _id
            short_name
          }
        }
      `, variables: { 
          rncp_title_ids, 
          class_id 
        }, fetchPolicy: 'network-only'
    })
    .pipe(map((resp) => resp.data['GetAllSchools']));
  }

  transferStudentResignation(payload): Observable<any> {
    return this.apollo.mutate({
      mutation: gql`
        mutation TransferStudent(
          $student_id: ID!, 
          $rncp_title_id: ID!, 
          $class_id: ID!, 
          $school_id: ID!, 
          $reason: String,
          $lang: String,
          $is_transfer_with_resign: Boolean,
          $is_transfer_without_resign: Boolean
          ) {
        TransferStudent(
          student_id: $student_id,
          rncp_title_id: $rncp_title_id,
          class_id: $class_id,
          school_id: $school_id,,
          reason: $reason
          lang: $lang,
          is_transfer_with_resign: $is_transfer_with_resign,
          is_transfer_without_resign: $is_transfer_without_resign
        ) {
          _id
        }
      }
      `, variables: {
        student_id: payload?.studentId,
        rncp_title_id: payload?.titleId,
        class_id: payload?.classId,
        school_id: payload?.schoolId,
        reason: payload?.reason,
        lang: localStorage.getItem('currentLang'),
        is_transfer_with_resign: payload?.isTransferWithResign,
        is_transfer_without_resign: payload?.isTransferWithoutResign
      }
      })
      .pipe(map((resp) => resp));
  }

  getSuspendStudentTestList(titleId, classId): Observable<any> {
    return this.apollo
      .query({
        query: gql`
          query GetAllTests($titleId: ID, $classId: ID) {
            GetAllTests(rncp_title_id: $titleId, class_id: $classId, is_published: true) {
              _id
              name
              is_published
              block_of_competence_condition_id {
                _id
                block_of_competence_condition
              }
            }
          }`,
          variables: {
            titleId,
            classId
          },
          fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllTests']));
  }
}
