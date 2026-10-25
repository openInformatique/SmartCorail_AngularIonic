// Paramètres OAuth2 Azure AD repris de COL_OAuth2 (OAuth2_LireClientID, OAuth2_LireURLAuth,
// OAuth2_LireURLToken, OAuth2_LireScope). Ce sont des identifiants publics d'application cliente (pas de secret).
// Un seul tenant et une seule application pour PROD/QUAL et pour CARGO/CARGOMM.

const TENANT = '0a8cf587-062e-4caa-b22a-191d71fb28d3';

export const OAUTH2_CLIENT_ID = 'f4c7cbc0-b8a3-4763-8311-1280e4f64763';
export const OAUTH2_URL_AUTH = `https://login.microsoftonline.com/${TENANT}/oauth2/v2.0/authorize`;
export const OAUTH2_URL_TOKEN = `https://login.microsoftonline.com/${TENANT}/oauth2/v2.0/token`;
export const OAUTH2_SCOPE =
  'api://360e563a-2570-4b83-99a7-7fad0d18aa4c/SmartCorail.Access openid offline_access email User.Read profile';

/** OAuth2_URLRedirection : utilisée par WINDEV sous Android. */
export const OAUTH2_REDIRECTION_LOCALHOST = 'http://localhost:8080/';
/** OAuth2_URLRedirection_iOS : utilisée par WINDEV sous iOS (« prod » aussi en QUAL). */
export const OAUTH2_REDIRECTION_SCHEMA = 'msauth.lu.cflmm.smartcorail.prod://auth';

/** OAuth2_ParamètresSupplémentaires. */
export const OAUTH2_PARAMETRES_SUPPLEMENTAIRES = { prompt: 'login' };
