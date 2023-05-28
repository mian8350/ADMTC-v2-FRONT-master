// The file for the current environment will overwrite this one during build.
// Different environments can be found in ./environment.{dev|prod}.ts, and
// you can create your own and use it with the --env flag.
// The build system defaults to the dev environment.

export const environment = {
  production: false,
  PDF_SERVER_URL: 'https://zetta-pdf.net/',
  apiUrl: 'https://api.v2.zetta-demo.space/graphql',
  apiUrlTask: 'https://development.task-service.zetta-demo.space/graphql',
  // local storage name to store  the token
  tokenKey: 'admtc-token-encryption',
  siteKey: '6Lf_OvQZAAAAAHl8OwsG9XOYjqtTj8gaFsvZ6_3I',
  timezoneDiff: 2,
  studentEnvironment : 'https://student.v2.zetta-demo.space',
  formEnvironment : 'https://v2.zetta-demo.space/'
};
