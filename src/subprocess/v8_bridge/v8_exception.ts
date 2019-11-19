export interface PinoV8Exception {
  message: string;
  script_resource_name: string;
  source_line: string;
  line_number: number;
  start_position: number;
  end_position: number;
  start_column: number;
  end_column: number;
}
