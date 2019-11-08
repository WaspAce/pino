export class BezierCurve {
  points: Point[] = [];

  private get_binomial_coefficient(
    n: number,
    k: number
  ): number {
    let coeff = 1;
    for (let x = n - k + 1; x <= n; x++) {
      coeff *= x;
    }
    for (let x = 1; x <= k; x++) {
      coeff /= x;
    }
    return coeff;
  }

  private calculate_points() {
    this.points[0] = this.start_point;
    this.points[this.step_count - 1] = this.end_point;
    const step = 1 / (this.step_count - 1);
    for (let i = 0; i < this.step_count; i++) {
      const t = i * step;
      let qx = 0;
      let qy = 0;
      if (this.control_points.length > 0) {
        for (let j = 0; j < this.control_points.length; j++) {
          const q = this.get_binomial_coefficient(this.control_points.length - 1, j) *
            Math.pow(1 - t, j) *
            Math.pow(t, this.control_points.length - 1 - j);
          qx += q * this.control_points[j].x;
          qy += q * this.control_points[j].y;
        }
      } else {
        qx = this.end_point.x - (this.end_point.x - this.start_point.x) * i / (this.step_count - 1);
        qy = this.end_point.y - (this.end_point.y - this.start_point.y) * i / (this.step_count - 1);
      }
      const point = new Point();
      point.x = qx;
      point.y = qy;
      this.points[this.step_count - i - 1] = point;
    }
  }

  constructor(
    private readonly start_point: Point,
    private readonly end_point: Point,
    private readonly control_points: Point[],
    private readonly step_count: number
  ) {
    this.control_points.unshift(start_point);
    this.control_points.push(end_point);
    this.control_points.push(end_point);
    this.calculate_points();
  }
}
