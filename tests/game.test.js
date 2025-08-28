import { describe, it, expect, vi } from 'vitest';
import { clamp, rand, chance, makeBulletFactory } from '../SpaceInvaders.Web/wwwroot/gameExports.js';

describe('util functions', () => {
  it('clamp clamps within bounds', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(11, 0, 10)).toBe(10);
  });

  it('rand returns within [a,b)', () => {
    // mock Math.random to deterministic values
    const spy = vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const r = rand(10, 20);
    expect(r).toBe(15);
    spy.mockRestore();
  });

  it('chance respects probability', () => {
    const spy = vi.spyOn(Math, 'random');
    spy.mockReturnValue(0.2);
    expect(chance(0.3)).toBe(true);
    spy.mockReturnValue(0.31);
    expect(chance(0.3)).toBe(false);
    spy.mockRestore();
  });
});

describe('bullet behavior', () => {
  it('bullet updates position and dies when out of bounds', () => {
    const H = 800;
    const makeBullet = makeBulletFactory(H);
    const b = makeBullet(100, 100, -200, true);
    b.update(0.1); // y -= 20
    expect(b.y).toBe(80);
    expect(b.dead).toBe(false);

    // Move past top bound (y < -20)
    b.y = -19; b.update(0.001);
    expect(b.dead).toBe(true);
  });

  it('bullet dies when beyond bottom bound H+20', () => {
    const H = 800;
    const makeBullet = makeBulletFactory(H);
    const b = makeBullet(100, H+19, 50, false);
    b.update(0.05); // y increases by 2.5 -> > H+20
    expect(b.dead).toBe(true);
  });
});
