// Minimal exports of pure helpers/entities for testing without coupling to DOM/canvas
// Duplicates logic from main.js to avoid refactoring game runtime. Keep in sync if logic changes.

export function clamp(v, a, b){ return Math.min(b, Math.max(a, v)); }
export function rand(a,b){ return a + Math.random()*(b-a); }
export function chance(p){ return Math.random() < p; }

export function makeBulletFactory(H){
  return function makeBullet(x,y,vy, friendly){
    return { x, y, vy, friendly, dead:false,
      update(dt){
        this.y += this.vy*dt;
        // Consider bullet visual length (10px): check tip vs bounds
        if (this.friendly ? (this.y - 10 < -20) : (this.y + 10 > H + 20)) this.dead = true;
      }
    };
  }
}
