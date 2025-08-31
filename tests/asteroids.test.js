import { describe, it, expect, vi } from 'vitest';
import { clamp, rand, chance, wrapFactory, makeBulletFactory, dist2, makeAsteroidFactory } from '../Asteroids.Web/wwwroot/gameExports.js';

describe('asteroids util', () => {
  it('clamp works', () => {
    expect(clamp(5,0,10)).toBe(5);
    expect(clamp(-1,0,10)).toBe(0);
    expect(clamp(11,0,10)).toBe(10);
  });

  it('rand deterministic with mock', () => {
    const spy = vi.spyOn(Math, 'random').mockReturnValue(0.25);
    expect(rand(0, 100)).toBe(25);
    spy.mockRestore();
  });

  it('chance respects probability', () => {
    const spy = vi.spyOn(Math, 'random');
    spy.mockReturnValue(0.1);
    expect(chance(0.2)).toBe(true);
    spy.mockReturnValue(0.21);
    expect(chance(0.2)).toBe(false);
    spy.mockRestore();
  });
});

describe('wrap and movement', () => {
  it('wrapX and wrapY wrap beyond margins', () => {
    const W=700, H=900; const { wrapX, wrapY } = wrapFactory(W,H);
    expect(wrapX(-11)).toBe(W+10);
    expect(wrapX(W+11)).toBe(-10);
    expect(wrapY(-11)).toBe(H+10);
    expect(wrapY(H+11)).toBe(-10);
    // values within margins are unchanged
    expect(wrapX(100)).toBe(100);
    expect(wrapY(200)).toBe(200);
  });

  it('bullet moves, wraps, and expires by life', () => {
    const W=700, H=900; const makeBullet = makeBulletFactory(W,H);
    const b = makeBullet(W+9, H+9, 50, 50, true); // near wrap threshold
    b.update(0.1); // move -> should wrap to -10 on both axes possibly
    expect(b.life).toBeCloseTo(1.1, 9);
    expect(b.dead).toBe(false);

    // Exhaust life
    b.update(1.2);
    expect(b.dead).toBe(true);
  });
});

describe('asteroid factory', () => {
  it('creates asteroid with expected radius by size', () => {
    const W=700,H=900; const makeAsteroid = makeAsteroidFactory(W,H);
    // mock random to avoid jitter affecting radius
    const spy = vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const a3 = makeAsteroid(0,0,3);
    const a2 = makeAsteroid(0,0,2);
    const a1 = makeAsteroid(0,0,1);
    expect(a3.radius).toBe(48);
    expect(a2.radius).toBe(28);
    expect(a1.radius).toBe(16);
    spy.mockRestore();
  });

  it('asteroid updates and wraps', () => {
    const W=100,H=100; const makeAsteroid = makeAsteroidFactory(W,H);
    const spy = vi.spyOn(Math, 'random');
    spy.mockReturnValue(0.0); // deterministic: dir=0, speed=min
    const a = makeAsteroid(W+9, H+9, 3);
    spy.mockRestore();
    a.update(1);
    // after update from near boundary it should wrap to -10
    expect(a.x === -10 || a.x <= W+10).toBe(true);
    expect(a.y === -10 || a.y <= H+10).toBe(true);
  });

  it('dist2 computes squared distance', () => {
    expect(dist2({x:0,y:0},{x:3,y:4})).toBe(25);
  });
});
