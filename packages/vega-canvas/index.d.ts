import {Canvas, Image} from 'canvas';

export function domCanvas(w: number, h: number): HTMLCanvasElement | null;
export function nodeCanvas(w: number, h: number): Canvas | null;

export function canvas(w: number, h: number): HTMLCanvasElement | Canvas | null;
export function image(): HTMLImageElement | Image | null;
