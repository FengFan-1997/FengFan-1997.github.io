import type { Position } from '../types';

export const lerp = (start: number, end: number, factor: number): number => {
  return start + (end - start) * factor;
};

export const calculateAngle = (from: Position, to: Position): number => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  return Math.atan2(dy, dx);
};

export const calculateDistance = (p1: Position, p2: Position): number => {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
};

export const getRandomPosition = (
  containerWidth: number, 
  containerHeight: number, 
  agentSize: number, 
  padding: number = 20
): Position => {
  const maxX = containerWidth - agentSize - padding;
  const maxY = containerHeight - agentSize - padding;
  const minX = padding;
  const minY = padding;

  return {
    x: Math.random() * (maxX - minX) + minX,
    y: Math.random() * (maxY - minY) + minY
  };
};
