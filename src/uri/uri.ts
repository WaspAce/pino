const DELIM_SCHEMA = '://';
const DELIM_CREDENTIALS = '@';
const DELIM_PATH = '/';
const DELIM_PARAMS = '?';
const DELIM_PASSWORD = ':';
const DELIMITER_PORT = ':';

const SCHEMA_HTTP = 'HTTP';
const SCHEMA_HTTPS = 'HTTPS';
const SCHEMA_FTP = 'FTP';

const PORT_HTTP = '80';
const PORT_HTTPS = '443';
const PORT_FTP = '21';

const HOST_LOCALHOST = 'localhost';

export class URI {
  schema = SCHEMA_HTTP.toLowerCase();
  user = '';
  password = '';
  host = '';
  port = PORT_HTTP;
  path = '';
  params = '';

  private separate_schema(
    url: string
  ): string {
    let result = url;
    if (url.indexOf(DELIM_SCHEMA) > -1) {
      const splitted = url.split(DELIM_SCHEMA);
      this.schema = splitted[0];
      result = splitted[1];
    }
    return result;
  }

  private parse_protocol() {
    switch (this.schema.toUpperCase()) {
      case SCHEMA_HTTPS:
        this.port = PORT_HTTPS;
        break;
      case SCHEMA_FTP:
        this.port = PORT_FTP;
        break;
      default:
        break;
    }
  }

  private separate_credentials(
    without_schema: string
  ) {
    let result = without_schema;
    const x = without_schema.indexOf(DELIM_CREDENTIALS);
    const y = without_schema.indexOf(DELIM_PATH);
    if (x > -1 && (x < y || y < 0)) {
      let splitted = without_schema.split(DELIM_CREDENTIALS);
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
      domain = splitted[0];
      result = splitted[1];
    } else {
      domain = without_credentials;
    }
    if (domain.indexOf('[') === 0) {
      const splitted = domain.split(']');
      this.host = splitted[0].split('[')[1];
      domain = splitted[1];
      if (domain.indexOf(DELIMITER_PORT) === 0) {
        this.port = domain.split(DELIMITER_PORT)[1];
      }
    } else {
      if (domain.indexOf(DELIMITER_PORT) > -1) {
        const splitted = domain.split(DELIMITER_PORT);
        this.host = splitted[0];
        this.port = splitted[1];
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

  private schema_matches_port(): boolean {
    const upper = this.schema.toUpperCase();
    return (upper === SCHEMA_FTP && this.port === PORT_FTP) ||
      (upper === SCHEMA_HTTP && this.port === PORT_HTTP) ||
      (upper === SCHEMA_HTTPS && this.port === PORT_HTTPS);
  }

  constructor(
    url?: string
  ) {
    this.parse(url);
  }

  parse(
    url: string
  ) {
    const without_schema = this.separate_schema(url);
    this.parse_protocol();
    const without_credentials = this.separate_credentials(without_schema);
    const path_and_params = this.extract_path_and_params(without_credentials);
    this.separate_path_and_params(path_and_params);
    this.correct_host();
  }

  stringify(): string {
    let result = this.schema + DELIM_SCHEMA + this.user;
    if (this.password !== '') {
      result += DELIM_PASSWORD + this.password;
    }
    if (this.user !== '') {
      result += DELIM_CREDENTIALS;
    }
    result += this.host;
    if (!this.schema_matches_port()) {
      result += DELIMITER_PORT + this.port;
    }
    result += this.path;
    if (this.params !== '') {
      result += DELIM_PARAMS + this.params;
    }
    return result;
  }
}
