export interface PinoOptions {
  gui?: boolean;
  loop_interval_ms?: number;
  aviable_rect?: Rect;
  screen_rect?: Rect;
  view_rect?: Rect;
  frame_rate?: number;
  init_scripts?: string[];
  main_frame_only?: boolean;
  user_agent?: string;
  load_timeout_ms?: number;
}
