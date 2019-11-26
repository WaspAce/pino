export enum UriScheme {
  SCHEME_HTTP = 'http',
  SCHEME_HTTPS = 'https',
  SCHEME_FTP = 'ftp'
}

const DELIM_SCHEME = '://';
const DELIM_CREDENTIALS = '@';
const DELIM_PATH = '/';
const DELIM_PARAMS = '?';
const DELIM_PASSWORD = ':';
const DELIMITER_PORT = ':';

const PORT_HTTP = '80';
const PORT_HTTPS = '443';
const PORT_FTP = '21';

const HOST_LOCALHOST = 'localhost';

export class URI {
  user = '';
  password = '';
  host = '';
  port = PORT_HTTP;
  path = '';
  params = '';

  private f_scheme = UriScheme.SCHEME_HTTP;
  private custom_port = false;

  private separate_scheme(
    url: string
  ): string {
    let result = url;
    if (url.indexOf(DELIM_SCHEME) > -1) {
      const splitted = url.split(DELIM_SCHEME);
      this.f_scheme = splitted[0] as UriScheme;
      result = splitted[1];
    }
    return result;
  }

  private parse_protocol() {
    switch (this.f_scheme.toLowerCase()) {
      case UriScheme.SCHEME_HTTPS:
        this.port = PORT_HTTPS;
        break;
      case UriScheme.SCHEME_FTP:
        this.port = PORT_FTP;
        break;
      default:
        break;
    }
  }

  private separate_credentials(
    without_scheme: string
  ) {
    let result = without_scheme;
    const x = without_scheme.indexOf(DELIM_CREDENTIALS);
    const y = without_scheme.indexOf(DELIM_PATH);
    if (x > -1 && (x < y || y < 0)) {
      let splitted = without_scheme.split(DELIM_CREDENTIALS);
      const tmp = splitted[0];
      result = splitted[1];
      if (tmp.indexOf(DELIM_PASSWORD) > -1) {
        splitted = tmp.split(DELIM_PASSWORD);
        this.user = splitted[0];
        this.password = splitted[1];
      } else {
        this.user = tmp;
      }
    }
    return result;
  }

  private extract_path_and_params(
    without_credentials: string
  ): string {
    let domain = '';
    let result = '';
    if (without_credentials.indexOf(DELIM_PATH) > -1) {
      const splitted = without_credentials.split(DELIM_PATH);
      domain = splitted.shift();
      result = splitted.join(DELIM_PATH);
    } else {
      domain = without_credentials;
    }
    if (domain.indexOf('[') === 0) {
      const splitted = domain.split(']');
      this.host = splitted[0].split('[')[1];
      domain = splitted[1];
      if (domain.indexOf(DELIMITER_PORT) === 0) {
        this.port = domain.split(DELIMITER_PORT)[1];
        this.custom_port = true;
      }
    } else {
      if (domain.indexOf(DELIMITER_PORT) > -1) {
        const splitted = domain.split(DELIMITER_PORT);
        this.host = splitted[0];
        this.port = splitted[1];
        this.custom_port = true;
      } else {
        this.host = domain;
      }
    }
    return result;
  }

  private separate_path_and_params(
    path_and_params
  ) {
    if (path_and_params.indexOf(DELIM_PARAMS) > -1) {
      const splitted = path_and_params.split(DELIM_PARAMS);
      this.path = DELIM_PATH + splitted[0];
      this.params = splitted[1];
    } else {
      this.path = DELIM_PATH + path_and_params;
    }
  }

  private correct_host() {
    if (this.host === '') {
      this.host = HOST_LOCALHOST;
    }
  }

  private scheme_matches_port(): boolean {
    const lower = this.f_scheme.toLowerCase();
    return (lower === UriScheme.SCHEME_FTP && this.port === PORT_FTP) ||
      (lower === UriScheme.SCHEME_HTTP && this.port === PORT_HTTP) ||
      (lower === UriScheme.SCHEME_HTTPS && this.port === PORT_HTTPS);
  }

  constructor(
    url?: string
  ) {
    this.parse(url);
  }

  parse(
    url: string
  ) {
    const without_scheme = this.separate_scheme(url);
    this.parse_protocol();
    const without_credentials = this.separate_credentials(without_scheme);
    const path_and_params = this.extract_path_and_params(without_credentials);
    this.separate_path_and_params(path_and_params);
    this.correct_host();
  }

  stringify(): string {
    let result = this.f_scheme + DELIM_SCHEME + this.user;
    if (this.password !== '') {
      result += DELIM_PASSWORD + this.password;
    }
    if (this.user !== '') {
      result += DELIM_CREDENTIALS;
    }
    result += this.host;
    if (this.custom_port || !this.scheme_matches_port()) {
      result += DELIMITER_PORT + this.port;
    }
    result += this.path;
    if (this.params !== '') {
      result += DELIM_PARAMS + this.params;
    }
    return result;
  }

  set scheme(
    value: UriScheme
  ) {
    this.f_scheme = value;
    switch (value) {
      case UriScheme.SCHEME_HTTP:
        this.port = PORT_HTTP;
        break;
      case UriScheme.SCHEME_HTTPS:
        this.port = PORT_HTTPS;
        break;
      case UriScheme.SCHEME_FTP:
        this.port = PORT_FTP;
        break;
      default:
        break;
    }
  }

  get scheme(): UriScheme {
    return this.f_scheme;
  }
}
