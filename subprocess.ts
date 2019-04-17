console.log('SUBPROCESS');
let scheme = new CustomScheme();
scheme.scheme_name = 'client';
scheme.is_standard = true;
scheme.is_secure = false;
scheme.is_local = false;
scheme.is_display_isolated = false;
scheme.is_csp_bypassing = true;
scheme.is_cors_enabled = false;

subprocess.add_custom_scheme(scheme);
subprocess.start();