export const STYLE = `
<style>
.pdf-container {
  font-size: 12px !important;
  background-color: #ffffff;
  color: #000000;
  padding: 10px;
}
.document-parent {
  -webkit-print-color-adjust: exact;
  white-space: normal;
}
.p-grid {
  display: flex;
  flex-wrap: wrap;
  margin-right: unset !important;
  margin-left: unset !important;
  margin-top: unset !important;
}
.title-section {
  margin-bottom: 30px;
}
.p-col-12 {
  width: 100%;
  font-size: 12px;
}
.pad-y-none {
  padding-top: 0 !important;
  padding-bottom: 0 !important;
}
.text-center {
  text-align: center !important;
}
.font-bold {
  font-weight: 700!important;
  font-size: 12px;
}
.outline-border-grey {
  border: 1px solid black;
  background: #d6d6d6;
  color: black;
}
.border-outline-bottom {
  border-bottom: 2px solid black;
  background: #ffffff;
  color: black;
  width: 100%;
}
.outline-border-white {
  border: 1px solid black;
  background: white;
  color: black;
}
.outline-border-x-none {
  border-left: 0px !important;
  border-right: 0px !important;
}
.outline-border-bottom-none {
  border-bottom: 0px !important;
}
.outline-border-dot {
  border-bottom: 1px dotted black;
  border-top: 1px dotted black;
  border-right: 1px solid black;
  border-left: 1px solid black;
  background: white;
  color: black;
}
.outline-border-dot-top {
  border-top: 1px dotted black;
  background: white;
  color: black;
}
.outline-border-dashed {
  border-style: dashed solid dashed solid;
  border-width: 1px;
  border-color: black;
  background: white;
  color: black;
}
.p-col-6 {
  width: 50%;
  font-size: 12px;
}
.p-col-2 {
  width: 16.6667%;
  font-size: 12px;
}
.text-right {
  text-align: right !important;
}
.pad-t-md,
.pad-y-md {
  padding-top: 1rem !important;
}
.mat-card:hover {
  box-shadow: none !important;
}
.pdf-card {
  margin: 1rem;
  border-radius: 2px;
  padding: 8px;
  background-color: #607d8b !important;
  -webkit-print-color-adjust: exact;
}


.doc-title {
  text-align: center;
  font-weight: 700;
  display: block;
}

.doc-table {
  border-collapse: collapse;
  width: 100%;
  margin: 30px auto;
}

tbody {
  display: table-row-group;
  vertical-align: middle;
  border-color: inherit;
}

.table-row-border {
  border: 2px solid #000;
}

.table-row-side-border {
  border-right: 2px solid #000;
  border-left: 2px solid #000;
  border-bottom: 2px solid #000;
}

.gray-bg {
  background-color: #d6d6d6;
  -webkit-print-color-adjust: exact;
  padding: 3px 5px;
}

.blue-bg {
  background-color: #ecf3ff;
  -webkit-print-color-adjust: exact;
  padding: 3px 5px;
}

.white-bg {
  background-color: #ffffff;
  -webkit-print-color-adjust: exact;
  padding: 3px 5px;
}

.placeholder-text {
  color: transparent;
}

.footer {
  left: 0;
  bottom: 0;
  font-weight: 700;
  margin-top: 450px;
  text-align: center;
}

.block-fieldset-spacing {
  margin-bottom: 0.5rem;
}

.page-break-title {
  justify-content: center;
  display: flex;
  align-items: center;
}

.placeholder-text {
  color: transparent;
}

.cert-preview {
  background-color: #ffffff;
  color: #000000;
}

.card-row {
  margin: 1em 0 !important;
  padding: 8px;
}

.title-cert-text {
  display: block;
  text-align: center;
  font-weight: 700;
}

.message-cert-text {
  margin-top: 10px;
  font-size: 12px;
}

</style>
`;
