import { BezierCurve } from './bezier_curve';

const MAX_CONTROL_POINTS = 4;
const REFERENCE_MIN_STEP_COUNT = 2;

export class BezierPath {

  points: Point[] = [];

  private reference_points: Point[] = [];

  private distance(
    start: Point,
    end: Point
  ): number {
    return Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
  }

  private diagonal(
    rect: Rect
  ): number {
    return Math.sqrt(Math.pow(rect.width, 2) + Math.pow(rect.height, 2));
  }

  private get_control_points_count(
    start_point: Point,
    end_point: Point
  ): number {
    const distance = this.distance(start_point, end_point);
    const diagonal = this.diagonal(this.view_rect);
    let result = MAX_CONTROL_POINTS - Math.round(diagonal / distance);
    if (result < 0) {
      result = 0;
    }
    return result;
  }

  private get_control_points(
    start_point: Point,
    end_point: Point
  ): Point[] {
    const result = [];
    let control_points_count = this.get_control_points_count(start_point, end_point);
    control_points_count = Math.round(Math.random() * control_points_count);
    for (let i = 0; i < control_points_count; i++) {
      result.push(new Point(
        this.view_rect.x + 5 + Math.random() * (this.view_rect.width - 15),
        this.view_rect.y + 5 + Math.random() * (this.view_rect.height - 15)
      ));
    }
    return result;
  }

  private get_step_count(
    base: number
  ): number {
    let result = Math.round(base + Math.random() * base);
    if (result < 2) {
      result = 2;
    }
    return result;
  }

  private calculate_reference() {
    const control_points = this.get_control_points(this.start_point, this.end_point);
    let step_count = this.get_step_count(this.get_control_points_count(this.start_point, this.end_point));
    if (step_count < REFERENCE_MIN_STEP_COUNT) {
      step_count = REFERENCE_MIN_STEP_COUNT;
    }
    const curve = new BezierCurve(
      this.start_point,
      this.end_point,
      control_points,
      step_count
    );
    this.reference_points = curve.points;
  }

  private calculate_curves() {
    for (let i = 0; i < this.reference_points.length - 1; i++) {
      const start_point = this.reference_points[i];
      const end_point = this.reference_points[i + 1];
      const distance = this.distance(start_point, end_point);
      const step_count = this.get_step_count(distance / this.speed);
      const curve = new BezierCurve(
        start_point,
        end_point,
        this.get_control_points(start_point, end_point),
        step_count
      );
      this.points = this.points.concat(curve.points);
    }
  }

  constructor(
    private readonly start_point: Point,
    private readonly end_point: Point,
    private readonly view_rect: Rect,
    private readonly speed: number
  ) {
    this.calculate_reference();
    this.calculate_curves();
  }
}
