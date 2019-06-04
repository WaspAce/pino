/// <reference types="gui_panel" />
import { IPino } from './../pino_types';
export declare class PinoGui {
    private readonly pino;
    view: GuiPanel;
    private form;
    private create_form;
    private on_view_change_bounds;
    private do_on_view_mouse_wheel;
    private do_on_mouse_down;
    private do_on_mouse_up;
    private do_on_mouse_move;
    private do_on_key_press;
    private do_on_key_down;
    private do_on_key_up;
    private create_view;
    constructor(pino: IPino);
}
