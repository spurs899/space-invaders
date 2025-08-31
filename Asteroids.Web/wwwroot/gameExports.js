// Minimal exports of pure helpers/entities for testing without DOM/canvas
// Keep logic in sync with Asteroids.Web/wwwroot/main.js where feasible.

export function clamp(v,a,b){ return Math.min(b, Math.max(a, v)); }
export function rand(a,b){ return a + Math.random()*(b-a); }
export function chance(p){ return Math.random() < p; }

export function wrapFactory(W,H){
  function wrapX(x){ if(x< -10) return W+10; if(x>W+10) return -10; return x; }
  function wrapY(y){ if(y< -10) return H+10; if(y>H+10) return -10; return y; }
  return { wrapX, wrapY };
}

export function makeBulletFactory(W,H){
  const { wrapX, wrapY } = wrapFactory(W,H);
  return function makeBullet(x,y,vx,vy, friendly=true){
    return { x, y, vx, vy, friendly, life:1.2, dead:false,
      update(dt){ this.x+=this.vx*dt; this.y+=this.vy*dt; this.x=wrapX(this.x); this.y=wrapY(this.y); this.life-=dt; if(this.life<=0) this.dead=true; }
    };
  }
}

export function dist2(a,b){ const dx=a.x-b.x, dy=a.y-b.y; return dx*dx+dy*dy; }

export function makeAsteroidFactory(W,H){
  const { wrapX, wrapY } = wrapFactory(W,H);
  function poly(radius, verts){
    const pts=[]; const jitter=radius*0.35;
    for(let i=0;i<verts;i++){
      const ang = i/verts * Math.PI*2;
      const r = radius + rand(-jitter, jitter);
      pts.push({x: Math.cos(ang)*r, y: Math.sin(ang)*r});
    }
    return pts;
  }
  return function makeAsteroid(x,y,size){
    const s=size;
    const radius = s===3? 48 : s===2? 28 : 16;
    const speed = s===3? rand(20,50) : s===2? rand(40,80) : rand(70,120);
    const dir = rand(0, Math.PI*2);
    const shape = poly(radius, 10 + (s*2));
    return { x,y, s, radius, shape, dead:false, vx: Math.cos(dir)*speed, vy: Math.sin(dir)*speed,
      update(dt){ this.x+=this.vx*dt; this.y+=this.vy*dt; this.x=wrapX(this.x); this.y=wrapY(this.y); }
    };
  };
}
