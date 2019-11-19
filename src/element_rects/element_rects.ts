const ELEMENT_RECT_PADDING_PERCENT = 10;
const ELEMENT_RECT_PADDING_PX = 5;

export interface IPinoElementRects {
  full: Rect;
  view: Rect;
}

export class PinoElementRects implements IPinoElementRects {
  full = new Rect();
  view = new Rect();

  get view_with_padding(): Rect {
    const full_with_padding = new Rect(
      this.full.x,
      this.full.y,
      this.full.width,
      this.full.height
    );
    let padding_width = Math.max(full_with_padding.width * ELEMENT_RECT_PADDING_PERCENT / 100, ELEMENT_RECT_PADDING_PX);
    const half_width = Math.floor(full_with_padding.width / 2);
    if (padding_width > half_width) {
      padding_width = half_width;
    }
    let padding_height = Math.max(full_with_padding.height * ELEMENT_RECT_PADDING_PERCENT / 100, ELEMENT_RECT_PADDING_PX);
    const half_height = Math.floor(full_with_padding.height / 2);
    if (padding_height > half_height) {
      padding_height = half_height;
    }
    full_with_padding.x += padding_width;
    full_with_padding.right -= padding_width;
    full_with_padding.y += padding_height;
    full_with_padding.bottom -= padding_height;
    return this.view.intersection(full_with_padding);
  }
}
