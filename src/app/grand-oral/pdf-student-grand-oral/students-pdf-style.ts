export const STYLES = `table {
  border: 5px black;
}

th {
  padding: 15px 7px;
}
.no-padding {
  padding: 0px !important;
}
.competences {
  text-align: center;
  vertical-align: middle;
  padding: 0px 0px !important;
  -webkit-transform: rotate(-90deg);
  transform: rotate(-90deg);
  height: 100%;
  width: 40px;
  min-width: 30px;
}

.noScroll::-webkit-scrollbar {
  display: none;
}

tbody {
  height: 100px; /* Just for the demo          */
  overflow-y: auto; /* Trigger vertical scroll    */
  overflow-x: hidden; /* Hide the horizontal scroll */
}
span.h-text {
  width: 100%;
  display: block;
}
.h-left {
  border: 0px;
  text-align: left;
}
.h-lefts {
  border: 0px;
  text-align: left;
  padding: 0px;
  margin: 0px;
  height: 10px;
}
.h-right {
  border: 0px;
  text-align: right;
}
.h-center {
  text-align: center;
}
.over-table {
  width: 1555px;
}
.border-none {
  border: 0px !important;
}
.text-center {
  text-align: center !important;
}
.scroll {
  height: 100px;
  overflow-y: auto; /* Trigger vertical scroll    */
  overflow-x: hidden; /* Hide the horizontal scroll */
}
th {
  padding: 0px;
}
h4 {
  padding: 0px !important;
  margin: 0px;
}
.clear-format {
  margin: 0px;
  padding: 0px;
}
.border {
  border: 1px solid black;
  display: inline-block;
}
.container {
  width: 100%;
  overflow: auto;
}
.title {
  width: 415px;
  display: inline-block;
}
.sub-containt {
  display: inline-flex;
  font-size: 14px;
}
.inline {
  display: inline-block;
}
.left {
  float: left;
}
.right {
  float: right;
}
.t-left {
  text-align: left;
}
.t-right {
  text-align: right;
}
.t-center {
  text-align: center;
}
.rotate-270 {
  text-align: center;
  transform: rotate(270deg);
  position: absolute;
  top: 28px;
  left: -20px;
  width: 66px;
  padding: 0px;
  margin: 0px;
}
.note-5 {
}
.level {
}
.inline-flex {
  display: flex;
}
.relative {
  position: relative;
}
.acad {
  min-width: 520px;
}
.eval {
  min-width: 210px;
}
.prof {
  min-width: 210px;
}
.grand {
  max-width: 360px;
}
.comps {
  left: 7px;
  top: 75px;
}
.justification {
  vertical-align: middle;
  text-align: center;
  padding: 27px 0px;
}
.justification-1 {
  vertical-align: middle;
  text-align: center;
  padding: 47px 0px;
  height: 131px;
}
.justification-2 {
  vertical-align: middle;
  text-align: center;
  padding: 65px 0px;
  height: 167px;
}
.p-right {
  padding-right: 5px !important;
}
.bilan {
  left: -11px !important;
}
.width-header {
  width: 1345px;
}
.comps-1 {
  left: -6px;
  top: 75px;
}
.comps-2 {
  left: 12px;
  top: 75px;
}
.block {
  width: 145px;
  top: 65px;
  left: -18px;
}
.body {
  width: 1744px;
  margin-top: 7px !important;
  border-top: 4px solid black !important;
  border: 1px solid black;
  overflow-x: hidden;
}
.body-1 {
  height: 600px;
  border-top: 4px solid !important;
  border: 1px solid;    margin: 0px !important;
  width: 1328px !important;
}
.m-bottom {
  margin-bottom: 25px !important;
}
.m-none {
  margin: 0px !important;
}
.note {
  min-width: 27px;
}
.level {
  min-width: 28px;
}
.note-1 {
  min-width: 28px;
  font-size: 12px;
}
.level-1 {
  min-width: 29px;
}
.note-2 {
  min-width: 44px;
}
.level-2 {
  min-width: 42px;
}
.first-column {
  text-align: left;
    padding-left: 10px !important;
    width: 180px;
}
.second-column {
  width: 150px;
}
.margin-none {
  margin: 0 !important;
}
.mrgn-all-xs {
  margin: 0.5rem !important;
}
.mrgn-all-md {
  margin: 1rem !important;
}
.mrgn-all-lg {
  margin: 2rem !important;
}
.mrgn-all-xl {
  margin: 3rem !important;
}
.mrgn-l-none,
.mrgn-x-none {
  margin-left: 0 !important;
}
.mrgn-l-xs,
.mrgn-x-xs {
  margin-left: 0.5rem !important;
}
.mrgn-l-sm,
.mrgn-x-sm {
  margin-left: 0.675rem !important;
}
.mrgn-l-md,
.mrgn-x-md {
  margin-left: 1rem !important;
}
.mrgn-l-lg,
.mrgn-x-lg {
  margin-left: 2rem !important;
}
.mrgn-l-xl,
.mrgn-x-xl {
  margin-left: 3rem !important;
}
.mrgn-l-r-sm {
  margin-right: 0.5rem !important;
  margin-left: 0.5rem !important;
}

.mrgn-r-none,
.mrgn-x-none {
  margin-right: 0 !important;
}
.mrgn-r-xs,
.mrgn-x-xs {
  margin-right: 0.5rem !important;
}

.mrgn-r-sm,
.mrgn-x-sm {
  margin-right: 0.675rem !important;
}
.mrgn-r-md,
.mrgn-x-md {
  margin-right: 1rem !important;
}
.mrgn-r-lg,
.mrgn-x-lg {
  margin-right: 2rem !important;
}
.mrgn-r-xl,
.mrgn-x-xl {
  margin-right: 3rem !important;
}
//Margin bottom
body .mrgn-b-none {
  margin-bottom: 0 !important;
}
.mrgn-b-xs,
.mrgn-y-xs {
  margin-bottom: 0.5rem !important;
}
.mrgn-b-sm,
.mrgn-y-sm {
  margin-bottom: 0.675rem !important;
}
.mrgn-b-md,
.mrgn-y-md {
  margin-bottom: 1rem !important;
}
.mrgn-b-lg,
.mrgn-y-lg {
  margin-bottom: 2rem !important;
}
.mrgn-b-xl,
.mrgn-y-xl {
  margin-bottom: 3rem !important;
}
//Margin top
body .mrgn-t-none {
  margin-top: 0 !important;
}
.mrgn-t-xs,
.mrgn-y-xs {
  margin-top: 0.5rem !important;
}
.mrgn-t-sm,
.mrgn-y-sm {
  margin-top: 0.675rem !important;
}
.mrgn-t-md,
.mrgn-y-md {
  margin-top: 1rem !important;
}
.mrgn-t-mdl,
.mrgn-y-mdl {
  margin-top: 1.2rem !important;
}
.mrgn-t-lg,
.mrgn-y-lg {
  margin-top: 2rem !important;
}
.mrgn-t-xl,
.mrgn-y-xl {
  margin-top: 3rem !important;
}
//Padding
//padding all
.padding-none {
  padding: 0 !important;
}
.pad-all-xs {
  padding: 0.5rem !important;
}
.pad-all-sm {
  padding: 0.675rem !important;
}
.pad-all-md {
  padding: 1rem !important;
}
.pad-all-lg {
  padding: 2rem !important;
}
.pad-all-xl {
  padding: 3rem !important;
}
//Padding top bottom
.pad-t-none {
  padding-top: 0 !important;
}
.pad-b-none {
  padding-bottom: 0 !important;
}
.pad-y-none {
  padding-top: 0 !important;
  padding-bottom: 0 !important;
}
.pad-t-xs,
.pad-y-xs {
  padding-top: 0.5rem !important;
}
.pad-b-xs,
.pad-y-xs {
  padding-bottom: 0.5rem !important;
}
.pad-t-sm,
.pad-y-sm {
  padding-top: 0.675rem !important;
}
.pad-b-sm,
.pad-y-sm {
  padding-bottom: 0.675rem !important;
}
.pad-t-md,
.pad-y-md {
  padding-top: 1rem !important;
}
.pad-b-md,
.pad-y-md {
  padding-bottom: 1rem !important;
}
.pad-b-lg,
.pad-y-lg {
  padding-bottom: 2rem !important;
}
.pad-t-lg,
.pad-y-lg {
  padding-top: 2rem !important;
}
.pad-t-xl,
.pad-y-xl {
  padding-top: 0.8rem !important;
}
.pad-b-xl,
.pad-y-xl {
  padding-bottom: 0 !important;
}
//padding left/right
.pad-l-none {
  padding-left: 0 !important;
}
.pad-l-xs,
.pad-x-xs {
  padding-left: 0.5rem !important;
}
.pad-l-sm,
.pad-x-sm {
  padding-left: 0.675rem !important;
}
.pad-l-md,
.pad-x-md {
  padding-left: 1rem !important;
}
.pad-l-lg,
.pad-x-lg {
  padding-left: 2rem !important;
}
.pad-l-xl,
.pad-x-xl {
  padding-left: 3rem !important;
}
.pad-r-none {
  padding-right: 0 !important;
}
.pad-r-xs,
.pad-x-xs {
  padding-right: 0.5rem !important;
}
.pad-r-sm,
.pad-x-sm {
  padding-right: 0.675rem !important;
}
.pad-r-md,
.pad-x-md {
  padding-right: 1rem !important;
}
.pad-r-lg,
.pad-x-lg {
  padding-right: 2rem !important;
}
.pad-r-xl,
.pad-x-xl {
  padding-right: 3rem !important;
}
// flex justify content
.justify-content-start {
  display: flex !important;
  justify-content: flex-start !important;
  align-items: center !important;
}
.justify-content-end {
  display: flex !important;
  justify-content: flex-end !important;
  align-items: center !important;
}
.justify-content-center {
  display: flex !important;
  justify-content: center !important;
  align-items: center !important;
}
.justify-content-between {
  display: flex !important;
  justify-content: space-between !important;
  align-items: center !important;
}
.justify-content-space-around {
  display: flex !important;
  justify-content: space-around !important;
  align-items: center !important;
}
.vertical-center {
  display: flex;
  align-items: center;
}
// custom style
.pad-t-l-r-md {
  padding-top: 1rem !important;
  padding-left: 1rem !important;
  padding-right: 1rem !important;
}
.pad-wrap {
  padding-left: 1rem !important;
  padding-right: 1rem !important;
}
body .mat-pad-none {
  padding: 0 !important;
}
.thumb-gap {
  margin: 0.2rem;
}

.pa-1 {
  padding: 1rem !important;
}
.pr-1 {
  padding-right: 1rem !important;
}
.pl-1 {
  padding-left: 1rem !important;
}
.pt-1 {
  padding-top: 1rem !important;
}
.pb-1 {
  padding-bottom: 1rem !important;
}
.px-1 {
  padding-left: 1rem !important;
  padding-right: 1rem !important;
}
.px-3 {
  padding-left: 3rem !important;
  padding-right: 3rem !important;
}
.py-1 {
  padding-top: 1rem !important;
  padding-bottom: 1rem !important;
}

.ma-1 {
  margin: 1rem !important;
}
.mr-1 {
  margin-right: 1rem !important;
}
.ml-1 {
  margin-left: 1rem !important;
}
.mt-1 {
  margin-top: 1rem !important;
}
.mb-1 {
  margin-bottom: 1rem !important;
}
.mx-1 {
  margin-left: 1rem !important;
  margin-right: 1rem !important;
}
.my-1 {
  margin-top: 1rem !important;
  margin-bottom: 1rem !important;
}

.text-center {
  text-align: center;
}
.text-right {
  text-align: right;
}

.font-weight-bold{
  font-weight: bold;
}

.document * {
  font-size: 12px;
}

.document-view{
  border-left: 2px solid #424242;;
}

.document-parent {
  -webkit-print-color-adjust: exact;
  white-space: normal;
  overflow: hidden;
  padding: 0;
}

.document {
  background-color: white;
  color: black;
  overflow: hidden;
}

.orientation-portrait {
  width: 21cm;
  height: 29.6cm;
}

.orientation-landscape {
  width: 29.7cm;
  height: 20.9cm;
}

.preview-orientation-portrait {
  width: 100%;
  height: 812pt;
}

.preview-orientation-landscape {
  width: 100%;
  height: 565pt;
}

.full-width {
  width: 100%;
}

.lineme {
  display: flex;
  margin-top: 3px;
  margin-bottom: 3px
}

.signature {
  height: 4rem;
  border: 1px solid black;
  padding-left: 4px;
}

.lineme:after {
  margin-left: 5px;
  display: block;
  content: "";
  border-bottom: 1px dotted;
  flex: 1 1 auto;
}

// .signature:after {
//   margin-left: 5px;
//   display: block;
//   content: "";
//   border: 1px solid;
//   flex: 1 1 auto;
// }

.doc-header .doc-header-fields {
  margin-top: 20px;
}

.doc-header .doc-header-fields .doc-header-left {
  width: 45%;
  display: inline-block;
  vertical-align: top;
}

.doc-header .doc-header-fields .doc-header-right {
  float: right;
  width: 45%;
  display: inline-block;
  vertical-align: top;
}

.float-right {
  float: right;
}

.doc-group-details {
  margin-top: 1rem;
  margin-bottom: 1rem;
  text-align: center;
}
.doc-group-details .group-header{
  font-size: 1.1rem;
}
.doc-group-details .group-table {
  border-collapse: collapse;
  width: 60%;
  margin: auto;
}
.doc-group-details .group-table .header {
  background-color: #d6d6d6;
}
.doc-group-details .group-table th {
  font-weight: bold;
}
.doc-group-details .group-table td, th {
  resize: both;
  border: 1px solid black;
  padding: 4px 5px;
  // white-space: initial;
  word-wrap: break-word;
}

.doc-grid {
  margin-top: 30px;
}
.doc-grid .doc-table {
  border-collapse: collapse;
}
.doc-grid .doc-table .section {
  background-color: #d6d6d6;
  //text-align: center;
  padding: 12px 5px;
}
.doc-grid .doc-table td, th {
  resize: both;
  border: 1px solid black;
  padding: 4px 5px;
  // white-space: initial;
  word-wrap: break-word;
}
.doc-grid .doc-table td.no-border {
  border: 0;
}
.doc-grid .doc-table td.head {
  background-color: #d6d6d6;
  font-weight: bold;
}
.doc-grid .list-header {
  border: 1px solid #000;
  padding-top: 5px;
  padding-bottom: 5px;
}
.doc-grid .comment-section {
  width: 100%;
  margin-top: 1rem;
  border-bottom: 1px dotted #000;
}

.ql-editor .fix-ql-ul {
  list-style: disc;
  //position: absolute;
}

.doc-footer .doc-footer-text {
  margin-top: 30px;
  text-align: center;
  font-size: 12px;
  width: 100%;
}
.doc-footer .doc-footer-fields {
  margin-top: 30px;
}
.doc-footer .doc-footer-fields .doc-footer-left {
  width: 45%;
  display: inline-block;
  vertical-align: top;
}

.doc-footer .doc-footer-fields .doc-footer-right {
  float: right;
  width: 45%;
  display: inline-block;
  vertical-align: top;
}

.doc-page-no {
  text-align: right;
  font-size: 12px;
  font-weight: 400;
  margin-top: -10px;
}

.doc-title {
  text-align: center;
  font-size: 16px
}

.doc-result-text {
  font-size: 14px;
  font-weight: bold;
  text-align: center;
  padding: 15px;
}

.doc-table-wrapper {
  padding: 30px;
  margin-left: 15%;
  height: 100%;
}

.bg-gray {
  background-color: gray;
}

.overflow-auto {
  overflow: auto;
}
@page {
  margin: 27mm 16mm 27mm 16mm;
}
.page-break {
  page-break-before: always;
  position: relative;
}
.page-break-after {
  page-break-after: always;
  position: relative;
}
.backgreen {
  background-color: #ddf2f0;
  -webkit-print-color-adjust: exact;
}
.pad {
  padding-top: 10mm !important;
  padding-right: 30mm !important;
  padding-left: 3mm !important;
  padding-bottom: 0mm !important;
}
`;

const QLEDITORSTYLES = `
.ql-editor {
  box-sizing: border-box;
  cursor: text;
  line-height: 1.42;
  height: 100%;
  outline: none;
  overflow-y: auto;
  padding: 12px 15px;
  tab-size: 4;
  -moz-tab-size: 4;
  text-align: left;
  white-space: pre-wrap;
  word-wrap: break-word;
}
.ql-editor p,
.ql-editor ol,
.ql-editor ul,
.ql-editor pre,
.ql-editor blockquote,
.ql-editor h1,
.ql-editor h2,
.ql-editor h3,
.ql-editor h4,
.ql-editor h5,
.ql-editor h6 {
  margin: 0;
  padding: 0;
  counter-reset: list-1 list-2 list-3 list-4 list-5 list-6 list-7 list-8 list-9;
}
.ql-editor ol,
.ql-editor ul {
  padding-left: 1.5em;
}
.ql-editor ol > li,
.ql-editor ul > li {
  list-style-type: none;
}
.ql-editor ul > li::before {
  content: '\\2022';
}
.ql-editor ul[data-checked=true],
.ql-editor ul[data-checked=false] {
  pointer-events: none;
}
.ql-editor ul[data-checked=true] > li *,
.ql-editor ul[data-checked=false] > li * {
  pointer-events: all;
}
.ql-editor ul[data-checked=true] > li::before,
.ql-editor ul[data-checked=false] > li::before {
  color: #777;
  cursor: pointer;
  pointer-events: all;
}
.ql-editor ul[data-checked=true] > li::before {
  content: '\\2611';
}
.ql-editor ul[data-checked=false] > li::before {
  content: '\\2610';
}
.ql-editor li::before {
  display: inline-block;
  margin-right: 0.3em;
  text-align: right;
  white-space: nowrap;
  width: 1.2em;
}
.ql-editor li:not(.ql-direction-rtl)::before {
  margin-left: -1.5em;
}
.ql-editor ol li,
.ql-editor ul li {
  padding-left: 1.5em;
}
.ql-editor ol li {
  counter-reset: list-1 list-2 list-3 list-4 list-5 list-6 list-7 list-8 list-9;
  counter-increment: list-num;
}
.ql-editor ol li:before {
  content: counter(list-num, decimal) '. ';
}
.ql-editor ol li.ql-indent-1 {
  counter-increment: list-1;
}
.ql-editor ol li.ql-indent-1:before {
  content: counter(list-1, lower-alpha) '. ';
}
.ql-editor ol li.ql-indent-1 {
  counter-reset: list-2 list-3 list-4 list-5 list-6 list-7 list-8 list-9;
}
.ql-editor ol li.ql-indent-2 {
  counter-increment: list-2;
}
.ql-editor ol li.ql-indent-2:before {
  content: counter(list-2, lower-roman) '. ';
}
.ql-editor ol li.ql-indent-2 {
  counter-reset: list-3 list-4 list-5 list-6 list-7 list-8 list-9;
}
.ql-editor ol li.ql-indent-3 {
  counter-increment: list-3;
}
.ql-editor ol li.ql-indent-3:before {
  content: counter(list-3, decimal) '. ';
}
.ql-editor ol li.ql-indent-3 {
  counter-reset: list-4 list-5 list-6 list-7 list-8 list-9;
}
.ql-editor ol li.ql-indent-4 {
  counter-increment: list-4;
}
.ql-editor ol li.ql-indent-4:before {
  content: counter(list-4, lower-alpha) '. ';
}
.ql-editor ol li.ql-indent-4 {
  counter-reset: list-5 list-6 list-7 list-8 list-9;
}
.ql-editor ol li.ql-indent-5 {
  counter-increment: list-5;
}
.ql-editor ol li.ql-indent-5:before {
  content: counter(list-5, lower-roman) '. ';
}
.ql-editor ol li.ql-indent-5 {
  counter-reset: list-6 list-7 list-8 list-9;
}
.ql-editor ol li.ql-indent-6 {
  counter-increment: list-6;
}
.ql-editor ol li.ql-indent-6:before {
  content: counter(list-6, decimal) '. ';
}
.ql-editor ol li.ql-indent-6 {
  counter-reset: list-7 list-8 list-9;
}
.ql-editor ol li.ql-indent-7 {
  counter-increment: list-7;
}
.ql-editor ol li.ql-indent-7:before {
  content: counter(list-7, lower-alpha) '. ';
}
.ql-editor ol li.ql-indent-7 {
  counter-reset: list-8 list-9;
}
.ql-editor ol li.ql-indent-8 {
  counter-increment: list-8;
}
.ql-editor ol li.ql-indent-8:before {
  content: counter(list-8, lower-roman) '. ';
}
.ql-editor ol li.ql-indent-8 {
  counter-reset: list-9;
}
.ql-editor ol li.ql-indent-9 {
  counter-increment: list-9;
}
.ql-editor ol li.ql-indent-9:before {
  content: counter(list-9, decimal) '. ';
}
.ql-editor .ql-indent-1:not(.ql-direction-rtl) {
  padding-left: 3em;
}
.ql-editor li.ql-indent-1:not(.ql-direction-rtl) {
  padding-left: 4.5em;
}
.ql-editor .ql-indent-1.ql-direction-rtl.ql-align-right {
  padding-right: 3em;
}
.ql-editor li.ql-indent-1.ql-direction-rtl.ql-align-right {
  padding-right: 4.5em;
}
.ql-editor .ql-indent-2:not(.ql-direction-rtl) {
  padding-left: 6em;
}
.ql-editor li.ql-indent-2:not(.ql-direction-rtl) {
  padding-left: 7.5em;
}
.ql-editor .ql-indent-2.ql-direction-rtl.ql-align-right {
  padding-right: 6em;
}
.ql-editor li.ql-indent-2.ql-direction-rtl.ql-align-right {
  padding-right: 7.5em;
}
.ql-editor .ql-indent-3:not(.ql-direction-rtl) {
  padding-left: 9em;
}
.ql-editor li.ql-indent-3:not(.ql-direction-rtl) {
  padding-left: 10.5em;
}
.ql-editor .ql-indent-3.ql-direction-rtl.ql-align-right {
  padding-right: 9em;
}
.ql-editor li.ql-indent-3.ql-direction-rtl.ql-align-right {
  padding-right: 10.5em;
}
.ql-editor .ql-indent-4:not(.ql-direction-rtl) {
  padding-left: 12em;
}
.ql-editor li.ql-indent-4:not(.ql-direction-rtl) {
  padding-left: 13.5em;
}
.ql-editor .ql-indent-4.ql-direction-rtl.ql-align-right {
  padding-right: 12em;
}
.ql-editor li.ql-indent-4.ql-direction-rtl.ql-align-right {
  padding-right: 13.5em;
}
.ql-editor .ql-indent-5:not(.ql-direction-rtl) {
  padding-left: 15em;
}
.ql-editor li.ql-indent-5:not(.ql-direction-rtl) {
  padding-left: 16.5em;
}
.ql-editor .ql-indent-5.ql-direction-rtl.ql-align-right {
  padding-right: 15em;
}
.ql-editor li.ql-indent-5.ql-direction-rtl.ql-align-right {
  padding-right: 16.5em;
}
.ql-editor .ql-indent-6:not(.ql-direction-rtl) {
  padding-left: 18em;
}
.ql-editor li.ql-indent-6:not(.ql-direction-rtl) {
  padding-left: 19.5em;
}
.ql-editor .ql-indent-6.ql-direction-rtl.ql-align-right {
  padding-right: 18em;
}
.ql-editor li.ql-indent-6.ql-direction-rtl.ql-align-right {
  padding-right: 19.5em;
}
.ql-editor .ql-indent-7:not(.ql-direction-rtl) {
  padding-left: 21em;
}
.ql-editor li.ql-indent-7:not(.ql-direction-rtl) {
  padding-left: 22.5em;
}
.ql-editor .ql-indent-7.ql-direction-rtl.ql-align-right {
  padding-right: 21em;
}
.ql-editor li.ql-indent-7.ql-direction-rtl.ql-align-right {
  padding-right: 22.5em;
}
.ql-editor .ql-indent-8:not(.ql-direction-rtl) {
  padding-left: 24em;
}
.ql-editor li.ql-indent-8:not(.ql-direction-rtl) {
  padding-left: 25.5em;
}
.ql-editor .ql-indent-8.ql-direction-rtl.ql-align-right {
  padding-right: 24em;
}
.ql-editor li.ql-indent-8.ql-direction-rtl.ql-align-right {
  padding-right: 25.5em;
}
.ql-editor .ql-indent-9:not(.ql-direction-rtl) {
  padding-left: 27em;
}
.ql-editor li.ql-indent-9:not(.ql-direction-rtl) {
  padding-left: 28.5em;
}
.ql-editor .ql-indent-9.ql-direction-rtl.ql-align-right {
  padding-right: 27em;
}
.ql-editor li.ql-indent-9.ql-direction-rtl.ql-align-right {
  padding-right: 28.5em;
}
.ql-editor .ql-video {
  display: block;
  max-width: 100%;
}
.ql-editor .ql-video.ql-align-center {
  margin: 0 auto;
}
.ql-editor .ql-video.ql-align-right {
  margin: 0 0 0 auto;
}
.ql-editor .ql-bg-black {
  background-color: #000;
}
.ql-editor .ql-bg-red {
  background-color: #e60000;
}
.ql-editor .ql-bg-orange {
  background-color: #f90;
}
.ql-editor .ql-bg-yellow {
  background-color: #ff0;
}
.ql-editor .ql-bg-green {
  background-color: #008a00;
}
.ql-editor .ql-bg-blue {
  background-color: #06c;
}
.ql-editor .ql-bg-purple {
  background-color: #93f;
}
.ql-editor .ql-color-white {
  color: #fff;
}
.ql-editor .ql-color-red {
  color: #e60000;
}
.ql-editor .ql-color-orange {
  color: #f90;
}
.ql-editor .ql-color-yellow {
  color: #ff0;
}
.ql-editor .ql-color-green {
  color: #008a00;
}
.ql-editor .ql-color-blue {
  color: #06c;
}
.ql-editor .ql-color-purple {
  color: #93f;
}
.ql-editor .ql-font-serif {
  font-family: Georgia, Times New Roman, serif;
}
.ql-editor .ql-font-monospace {
  font-family: Monaco, Courier New, monospace;
}
.ql-editor .ql-size-small {
  font-size: 0.75em;
}
.ql-editor .ql-size-large {
  font-size: 1.5em;
}
.ql-editor .ql-size-huge {
  font-size: 2.5em;
}
.ql-editor .ql-direction-rtl {
  direction: rtl;
  text-align: inherit;
}
.ql-editor .ql-align-center {
  text-align: center;
}
.ql-editor .ql-align-justify {
  text-align: justify;
}
.ql-editor .ql-align-right {
  text-align: right;
}
.ql-editor.ql-blank::before {
  color: rgba(0,0,0,0.6);
  content: attr(data-placeholder);
  font-style: italic;
  pointer-events: none;
  position: absolute;
}
.title-text {
  display: block;
  text-align: center;
  font-weight: 700;
}
.message-text {
  margin-top: 10px;
  font-size: 12px;
}
.gene-block {
  display: block !important;
}
.eval-col-1 {
  width: 8cm; !important;
}
.eval-col-2 {
  width: 4cm; !important;
}
.eval-col-3 {
  width: 3cm; !important;
}
.eval-col-4 {
  width: 3cm; !important;
}
.p-col-1, .p-col-2, .p-col-3, .p-col-4, .p-col-5, .p-col-6, .p-col-7, .p-col-8, .p-col-9, .p-col-10, .p-col-11, .p-col-12 {
  flex: 0 0 auto;
  padding: 5px;
}
.pad-none {
  padding: 0px !important;
}
.score-column {
  width: 84px;
  display: inline-block;
  text-align: center;
}
.hide {
  display: none;
}
.operator-footer-text {
  position: absolute;
  bottom: 5%;
  left: 0;
  right: 0;
  text-align: center;
}

.baseline {
  float: left;
  padding-right: 10px;
  align-items: baseline;
}
.label-reject {
  color: black !important;
}

.justify-around {
  text-align: center;
  position: relative;
  display: inline-flex;
}
.spinner-wrapper {
  width: 100%;
  height: 100%;
  display: -webkit-box;
  display: flex;
  -webkit-box-pack: center;
  justify-content: center;
  -webkit-box-align: center;
  align-items: center;
  top: 0px;
  left: 0;
  z-index: 998;
  position: absolute;
  background-color: #00000059;
  margin: 0 auto;
}

.label-status {
  padding: 0px;
  font-family: Roboto, 'Helvetica Neue', sans-serif !important;
  box-shadow: 0px 3px 1px -2px rgba(0, 0, 0, 0.2), 0px 2px 2px 0px rgba(0, 0, 0, 0.14), 0px 1px 5px 0px rgba(0, 0, 0, 0.12);
  box-sizing: border-box;
  position: relative;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  outline: 0;
  border: none;
  -webkit-tap-highlight-color: transparent;
  display: inline-block;
  text-decoration: none;
  vertical-align: baseline;
  transform: translate3d(0, 0, 0);
  transition: background 0.4s cubic-bezier(0.25, 0.8, 0.25, 1), box-shadow 280ms cubic-bezier(0.4, 0, 0.2, 1);
  color: black;
}
.card-status {
  border-radius: 4px;
  width: 175px;
  height: 65px !important;
  float: left;
  display: flex;
  flex-flow: column wrap;
  justify-content: center;
}

.font-status {
  width: 140px;
  display: block;
  text-align: center;
  vertical-align: middle;
  float: left;
  font-weight: 600;
}

.text-status {
  font-size: 14px;
  max-width: 140px;
  margin: 2px auto;
  color: #000;
  font-weight: 700;
}

.font-status-validate {
  width: 110px;
  display: block;
  text-align: center;
  vertical-align: middle;
  float: left;
  font-weight: 600;
}

.text-status-validate {
font-size: 12px;
  max-width: 100px;
  margin: auto;
  color: #000;
  font-weight: 700;
}
.title-job {
  font-size: 20px;
  font-weight: 600;
  text-align: center;
}

.background-status {
  border-radius: 10px;
  cursor: default;
  margin-right: 10px;
  border: 2px solid #000000;
}

.background-rejected {
  border-radius: 10px;
  cursor: default;
  border: 2px solid #000000;
}

.icon-true {
  color: green;
  text-align: center;
  font-size: 30px;
  font-weight: 900;
  position: relative;
  top: 0px;
  right: 4px;
}

.icon-false {
  color: red;
  text-align: center;
  font-size: 35px;
  position: relative;
  font-weight: 900;
  top: -5px;
  right: 4px;
}
.red-button {
  color: white !important;
  background-color: red;
}
.yellow-button {
  background-color: #fdd835;
}

.grey-text {
  color: darkgray;
}

.width-eighty {
  width: 80%;
}

.width-ninety {
  width: 90%;
}

.width-95 {
  width: 95%;
}

.self-center {
  align-self: center;
}

.white-border-center {
  border: 2px solid whitesmoke;
  text-align: center;
}

.white-border-start {
  border: 2px solid whitesmoke;
}

.mission-activity {}

.plus_button {
  margin-top: 15px;
  margin-right: 5px;
  height: 250%;
  width: 35px;
}
.title-header {
  margin: 0px 0px 0px 0px;
}
.text-center {
  text-align: center;
}
.float-right {
  float: right;
}
.float-left {
  float: left;
}
.margin-none {
  margin: 0px;
}
.criteria-section {
  margin: 0px 0px 0px 20px;
}
.criteria-section-field {
  padding: 0px 0px 0px 0px;
}
.competency-section {
  padding: 10px 0px 0px 0px;
}
.padding-5 {
  padding: 5px;
}
.criteria-border-top {
  border-top: none;
}
.criteria-border-bottom {
  border-bottom: none;
}
.pad-top10 {
  padding-top: 10px;
}
.pad-btn-none {
  padding-bottom: 0px;
}
.pad-top-none {
  padding-top: 0px;
}
.x-pad-none {
  padding-bottom: 0px;
  padding-top: 0px;
}
:host ::ng-deep textarea.mat-input-element {
  padding: 0px;
  margin: -2px 0;
}
.overlow-auto {
  overflow: auto;
}
.btn-sticky {
  position: fixed;
  top: 302px;
  right: 120px;
}
.btn-sticky-save {
  position: fixed;
  top: 302px;
  right: 32px;
}
.mrgn-right-15 {
  margin-right: 15px !important;
}
.autonomy {
  width: 65%;
  float: left;
}
.knowledges {
  width: 85%;
  float: left;
}
.knowhow {
  width: 85%;
  float: left;
}
.objective {
  width: 75%;
  float: left;
}
.objective-s {
  width: 60%;
  float: left;
}
.mrgn-10 {
  margin: 10px;
}
.mrgn-right-none {
  margin-right: 0px;
}
.height-50 {
  max-height: 50px;
}
.width-objective {
  width: 44.555% !important;
}
.full-width {
  width: 100%;
}
.pad-left {
  padding: 0.5em;
}
.yellow-border{
  border: 2px solid #000000;
}
.p-col-6 {
  width: 50%;
}
.p-col-12 {
  width: 100%;
}
.p-col-1, .p-col-2, .p-col-3, .p-col-4, .p-col-5, .p-col-6, .p-col-7, .p-col-8, .p-col-9, .p-col-10, .p-col-11, .p-col-12 {
  -webkit-box-flex: 0;
  flex: 0 0 auto;
  padding: 0.5em;
}
.p-col-5 {
  width: 41.6667%;
}
.no-padding {
  padding: 0px !important
}
.p-col-4 {
    width: 33.3333%;
}
.p-col-3 {
    width: 25%;
}
.p-col-9 {
    width: 75%;
}
.p-col-8 {
  width: 66.6667%;
}
.font-bolds {
  font-weight: 800;
  color: black;
}
.margin-bot-10px {
  margin-bottom: 10px !important;
}
.orange-border {
  border-color: #000000;
  border-style: solid;
  font-size: 12px;
  margin-left: 0px;
  margin-right: 0px;
  margin-top: 1em;
}

.grey-border {
  border-color: #000000;
  border-style: solid;
  margin-bottom: 1em;
  font-size: 12px;
  width: 100%;
}

.yellow {
  color: #ffd740;
}

.orange {
  color: #f49f36;
}

.red {
  color: #ff4040;
}

.green {
  color: #008000;
}

.green-yellow {
  color: #adff2f;
}

.large-icon {
  transform: scale(1.5);
}
`;

export const STUDENTSTYLES =
  `
<style>
` +
  STYLES +
  `
</style>
`;
