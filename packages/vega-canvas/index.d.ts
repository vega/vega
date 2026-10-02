import {Canvas, Image} from 'canvas';

export function domCanvas(w: number, h: number): HTMLCanvasElement | null;
export function nodeCanvas(w: number, h: number, type?: 'pdf' | 'svg'): Canvas | null;
export function offscreenCanvas(w: number, h: number): OffscreenCanvas | null;
export function isOffscreenCanvas(canvas: unknown): canvas is OffscreenCanvas;

export function canvas(w: number, h: number, type?: 'pdf' | 'svg'): HTMLCanvasElement | Canvas | OffscreenCanvas | null;
export function image(): HTMLImageElement | Image | null;
