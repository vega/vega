import {Canvas, Image} from 'canvas';

export function domCanvas(w: number, h: number): HTMLCanvasElement | null;
export function nodeCanvas(w: number, h: number, type?: 'pdf' | 'svg'): Canvas | null;

export function canvas(w: number, h: number, type?: 'pdf' | 'svg'): HTMLCanvasElement | Canvas | null;
export function image(): HTMLImageElement | Image | null;
