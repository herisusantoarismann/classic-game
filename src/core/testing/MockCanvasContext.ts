/**
 * MockCanvasContext.ts
 * Lightweight, zero-dependency Mock CanvasRenderingContext2D for headless testing.
 * Records call metrics and detects any NaN / Infinity values in canvas rendering calls.
 */

export interface NanErrorDetail {
  method: string;
  args: unknown[];
  errorArgIndex: number;
  invalidValue: unknown;
}

export class MockCanvasContext {
  // Stats & Error tracking
  public callCount = 0;
  public methodCounts: Record<string, number> = {};
  public nanErrors: NanErrorDetail[] = [];

  // State properties
  public fillStyle: string | CanvasGradient | CanvasPattern = '#000000';
  public strokeStyle: string | CanvasGradient | CanvasPattern = '#000000';
  public lineWidth = 1;
  public lineCap: CanvasLineCap = 'butt';
  public lineJoin: CanvasLineJoin = 'miter';
  public font = '10px sans-serif';
  public textAlign: CanvasTextAlign = 'start';
  public textBaseline: CanvasTextBaseline = 'alphabetic';
  public globalAlpha = 1.0;
  public shadowColor = 'transparent';
  public shadowBlur = 0;
  public shadowOffsetX = 0;
  public shadowOffsetY = 0;
  public imageSmoothingEnabled = true;

  private lineDash: number[] = [];

  private validateNumbers(method: string, args: unknown[], indicesToCheck: number[]): void {
    this.callCount++;
    this.methodCounts[method] = (this.methodCounts[method] || 0) + 1;

    for (const idx of indicesToCheck) {
      const val = args[idx];
      if (typeof val === 'number' && !Number.isFinite(val)) {
        this.nanErrors.push({
          method,
          args: [...args],
          errorArgIndex: idx,
          invalidValue: val,
        });
      }
    }
  }

  public fillRect(x: number, y: number, w: number, h: number): void {
    this.validateNumbers('fillRect', [x, y, w, h], [0, 1, 2, 3]);
  }

  public strokeRect(x: number, y: number, w: number, h: number): void {
    this.validateNumbers('strokeRect', [x, y, w, h], [0, 1, 2, 3]);
  }

  public clearRect(x: number, y: number, w: number, h: number): void {
    this.validateNumbers('clearRect', [x, y, w, h], [0, 1, 2, 3]);
  }

  public beginPath(): void {
    this.callCount++;
    this.methodCounts['beginPath'] = (this.methodCounts['beginPath'] || 0) + 1;
  }

  public closePath(): void {
    this.callCount++;
    this.methodCounts['closePath'] = (this.methodCounts['closePath'] || 0) + 1;
  }

  public moveTo(x: number, y: number): void {
    this.validateNumbers('moveTo', [x, y], [0, 1]);
  }

  public lineTo(x: number, y: number): void {
    this.validateNumbers('lineTo', [x, y], [0, 1]);
  }

  public arc(
    x: number,
    y: number,
    radius: number,
    startAngle: number,
    endAngle: number,
    _counterclockwise?: boolean
  ): void {
    this.validateNumbers('arc', [x, y, radius, startAngle, endAngle], [0, 1, 2, 3, 4]);
  }

  public arcTo(x1: number, y1: number, x2: number, y2: number, radius: number): void {
    this.validateNumbers('arcTo', [x1, y1, x2, y2, radius], [0, 1, 2, 3, 4]);
  }

  public ellipse(
    x: number,
    y: number,
    radiusX: number,
    radiusY: number,
    rotation: number,
    startAngle: number,
    endAngle: number,
    _counterclockwise?: boolean
  ): void {
    this.validateNumbers('ellipse', [x, y, radiusX, radiusY, rotation, startAngle, endAngle], [0, 1, 2, 3, 4, 5, 6]);
  }

  public bezierCurveTo(
    cp1x: number,
    cp1y: number,
    cp2x: number,
    cp2y: number,
    x: number,
    y: number
  ): void {
    this.validateNumbers('bezierCurveTo', [cp1x, cp1y, cp2x, cp2y, x, y], [0, 1, 2, 3, 4, 5]);
  }

  public quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void {
    this.validateNumbers('quadraticCurveTo', [cpx, cpy, x, y], [0, 1, 2, 3]);
  }

  public rect(x: number, y: number, w: number, h: number): void {
    this.validateNumbers('rect', [x, y, w, h], [0, 1, 2, 3]);
  }

  public roundRect(
    x: number,
    y: number,
    w: number,
    h: number,
    radii?: number | number[]
  ): void {
    const numbers = [x, y, w, h];
    if (typeof radii === 'number') numbers.push(radii);
    this.validateNumbers('roundRect', numbers, [0, 1, 2, 3]);
  }

  public fill(): void {
    this.callCount++;
    this.methodCounts['fill'] = (this.methodCounts['fill'] || 0) + 1;
  }

  public stroke(): void {
    this.callCount++;
    this.methodCounts['stroke'] = (this.methodCounts['stroke'] || 0) + 1;
  }

  public clip(): void {
    this.callCount++;
    this.methodCounts['clip'] = (this.methodCounts['clip'] || 0) + 1;
  }

  public save(): void {
    this.callCount++;
    this.methodCounts['save'] = (this.methodCounts['save'] || 0) + 1;
  }

  public restore(): void {
    this.callCount++;
    this.methodCounts['restore'] = (this.methodCounts['restore'] || 0) + 1;
  }

  public translate(x: number, y: number): void {
    this.validateNumbers('translate', [x, y], [0, 1]);
  }

  public rotate(angle: number): void {
    this.validateNumbers('rotate', [angle], [0]);
  }

  public scale(x: number, y: number): void {
    this.validateNumbers('scale', [x, y], [0, 1]);
  }

  public transform(a: number, b: number, c: number, d: number, e: number, f: number): void {
    this.validateNumbers('transform', [a, b, c, d, e, f], [0, 1, 2, 3, 4, 5]);
  }

  public setTransform(..._args: unknown[]): void {
    this.callCount++;
    this.methodCounts['setTransform'] = (this.methodCounts['setTransform'] || 0) + 1;
  }

  public resetTransform(): void {
    this.callCount++;
    this.methodCounts['resetTransform'] = (this.methodCounts['resetTransform'] || 0) + 1;
  }

  public fillText(text: string, x: number, y: number, maxWidth?: number): void {
    const indices = [1, 2];
    if (typeof maxWidth === 'number') indices.push(3);
    this.validateNumbers('fillText', [text, x, y, maxWidth], indices);
  }

  public strokeText(text: string, x: number, y: number, maxWidth?: number): void {
    const indices = [1, 2];
    if (typeof maxWidth === 'number') indices.push(3);
    this.validateNumbers('strokeText', [text, x, y, maxWidth], indices);
  }

  public measureText(text: string): TextMetrics {
    this.callCount++;
    this.methodCounts['measureText'] = (this.methodCounts['measureText'] || 0) + 1;
    const width = (text || '').length * 6; // Realistic monospace approx
    return {
      width,
      actualBoundingBoxAscent: 8,
      actualBoundingBoxDescent: 2,
      actualBoundingBoxLeft: 0,
      actualBoundingBoxRight: width,
      fontBoundingBoxAscent: 10,
      fontBoundingBoxDescent: 2,
      alphabeticBaseline: 0,
      emHeightAscent: 10,
      emHeightDescent: 2,
      hangingBaseline: 8,
      ideographicBaseline: -2,
    } as TextMetrics;
  }

  public drawImage(...args: unknown[]): void {
    this.callCount++;
    this.methodCounts['drawImage'] = (this.methodCounts['drawImage'] || 0) + 1;
    // Check numeric args after the image arg
    for (let i = 1; i < args.length; i++) {
      const val = args[i];
      if (typeof val === 'number' && !Number.isFinite(val)) {
        this.nanErrors.push({
          method: 'drawImage',
          args: [...args],
          errorArgIndex: i,
          invalidValue: val,
        });
      }
    }
  }

  public setLineDash(segments: number[]): void {
    this.lineDash = [...segments];
  }

  public getLineDash(): number[] {
    return [...this.lineDash];
  }

  public createLinearGradient(x0: number, y0: number, x1: number, y1: number): CanvasGradient {
    this.validateNumbers('createLinearGradient', [x0, y0, x1, y1], [0, 1, 2, 3]);
    return {
      addColorStop: () => {},
    } as unknown as CanvasGradient;
  }

  public createRadialGradient(
    x0: number,
    y0: number,
    r0: number,
    x1: number,
    y1: number,
    r1: number
  ): CanvasGradient {
    this.validateNumbers('createRadialGradient', [x0, y0, r0, x1, y1, r1], [0, 1, 2, 3, 4, 5]);
    return {
      addColorStop: () => {},
    } as unknown as CanvasGradient;
  }

  public resetStats(): void {
    this.callCount = 0;
    this.methodCounts = {};
    this.nanErrors = [];
  }
}

/**
 * Creates a mock HTMLCanvasElement bound to the MockCanvasContext
 */
export function createMockCanvas(width: number, height: number, ctx: MockCanvasContext): HTMLCanvasElement {
  return {
    width,
    height,
    getContext: (_type: string) => ctx as unknown as CanvasRenderingContext2D,
    getBoundingClientRect: () => ({
      width,
      height,
      top: 0,
      left: 0,
      bottom: height,
      right: width,
      x: 0,
      y: 0,
      toJSON: () => {},
    }),
  } as unknown as HTMLCanvasElement;
}
