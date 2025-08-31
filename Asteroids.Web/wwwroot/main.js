/*
  Stick Asteroids - minimal, no dependencies
  - Keyboard: Left/Right or A/D to rotate, Up/W to thrust, Space to shoot
  - Goal: Clear waves of asteroids; saucer may appear
*/
(function(){
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');

  const W = canvas.width;
  const H = canvas.height;
  const HUD = {
    score: document.getElementById('score'),
    lives: document.getElementById('lives'),
    wave: document.getElementById('wave'),
    restart: document.getElementById('restart')
  };

  const keys = new Set();
  window.addEventListener('keydown', (e)=>{
    if(['ArrowLeft','ArrowRight','ArrowUp','a','d','w','A','D','W',' '].includes(e.key)) e.preventDefault();
    keys.add(e.key);
  });
  window.addEventListener('keyup', (e)=>keys.delete(e.key));

  function clamp(v,a,b){ return Math.min(b, Math.max(a, v)); }
  function rand(a,b){ return a + Math.random()*(b-a); }
  function chance(p){ return Math.random() < p; }

  // wrap helpers
  function wrapX(x){ if(x< -10) return W+10; if(x>W+10) return -10; return x; }
  function wrapY(y){ if(y< -10) return H+10; if(y>H+10) return -10; return y; }

  function makeShip(){
    return { x: W/2, y: H/2, a: -Math.PI/2, vx:0, vy:0, thrusting:false, cd:0, lives:3, inv:0,
      draw(){
        ctx.save(); ctx.translate(this.x,this.y); ctx.rotate(this.a);
        ctx.strokeStyle = this.inv>0? '#7fffd4' : '#8bd0ff'; ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(16,0); ctx.lineTo(-12,10); ctx.lineTo(-6,0); ctx.lineTo(-12,-10); ctx.closePath();
        ctx.stroke();
        if(this.thrusting){ ctx.strokeStyle='#ffd166'; ctx.beginPath(); ctx.moveTo(-12,0); ctx.lineTo(-18,0); ctx.stroke(); }
        ctx.restore();
      }
    };
  }

  function makeBullet(x,y,vx,vy, friendly=true){
    return {x,y,vx,vy, friendly, life:1.2, dead:false,
      update(dt){ this.x+=this.vx*dt; this.y+=this.vy*dt; this.x=wrapX(this.x); this.y=wrapY(this.y); this.life-=dt; if(this.life<=0) this.dead=true; },
      draw(){ ctx.strokeStyle = friendly? '#9aff9a':'#ff8080'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(this.x, this.y); ctx.lineTo(this.x-this.vx*0.02, this.y-this.vy*0.02); ctx.stroke(); }
    };
  }

  function poly(radius, verts){
    const pts=[]; const jitter=radius*0.35;
    for(let i=0;i<verts;i++){
      const ang = i/verts * Math.PI*2;
      const r = radius + rand(-jitter, jitter);
      pts.push({x: Math.cos(ang)*r, y: Math.sin(ang)*r});
    }
    return pts;
  }

  function makeAsteroid(x,y, size){
    const s = size; // 3=big, 2=med, 1=small
    const radius = s===3? 48 : s===2? 28 : 16;
    const speed = s===3? rand(20,50) : s===2? rand(40,80) : rand(70,120);
    const dir = rand(0, Math.PI*2);
    const shape = poly(radius, 10 + (s*2));
    return {x,y, vx: Math.cos(dir)*speed, vy: Math.sin(dir)*speed, s, radius, shape, dead:false,
      update(dt){ this.x+=this.vx*dt; this.y+=this.vy*dt; this.x=wrapX(this.x); this.y=wrapY(this.y); },
      draw(){ ctx.save(); ctx.translate(this.x,this.y); ctx.strokeStyle='#a0c4ff'; ctx.lineWidth=2.5; ctx.beginPath(); ctx.moveTo(this.shape[0].x, this.shape[0].y); for(let i=1;i<this.shape.length;i++){ ctx.lineTo(this.shape[i].x, this.shape[i].y);} ctx.closePath(); ctx.stroke(); ctx.restore(); }
    };
  }

  function dist2(a,b){ const dx=a.x-b.x, dy=a.y-b.y; return dx*dx+dy*dy; }

  // Game state
  let ship, bullets, rocks, score, wave, gameOver, time;

  function reset(){
    ship = makeShip();
    bullets = [];
    rocks = [];
    score = 0; wave = 1; gameOver=false; time=0;
    spawnWave(wave);
    updateHUD();
  }

  function spawnWave(n){
    rocks.length=0;
    const big = 3 + Math.min(3, n-1);
    for(let i=0;i<big;i++){
      let x,y; // spawn away from ship
      do{ x=rand(0,W); y=rand(0,H);} while(dist2({x,y},{x:ship.x,y:ship.y}) < 200*200);
      rocks.push(makeAsteroid(x,y,3));
    }
  }

  function updateHUD(){
    HUD.score.textContent = `Score: ${score}`;
    HUD.lives.textContent = `Lives: ${ship.lives}`;
    HUD.wave.textContent = `Level: ${wave}`;
    HUD.restart.hidden = !gameOver;
  }

  function shoot(){
    if(ship.cd>0) return;
    const speed = 520;
    const vx = Math.cos(ship.a)*speed + ship.vx;
    const vy = Math.sin(ship.a)*speed + ship.vy;
    bullets.push(makeBullet(ship.x+Math.cos(ship.a)*16, ship.y+Math.sin(ship.a)*16, vx, vy, true));
    ship.cd = 0.22;
  }

  function explodeAsteroid(rock){
    rock.dead=true;
    if(rock.s>1){
      const count = 2;
      for(let i=0;i<count;i++){
        const r = makeAsteroid(rock.x, rock.y, rock.s-1);
        r.vx += rand(-60,60); r.vy += rand(-60,60);
        rocks.push(r);
      }
    }
    score += rock.s===3? 20 : rock.s===2? 50 : 100;
  }

  function update(dt){
    time+=dt; if(gameOver) return;
    // input
    ship.thrusting = keys.has('ArrowUp') || keys.has('w') || keys.has('W');
    const left = keys.has('ArrowLeft') || keys.has('a') || keys.has('A');
    const right = keys.has('ArrowRight') || keys.has('d') || keys.has('D');
    if(left && !right) ship.a -= 3.4*dt; else if(right && !left) ship.a += 3.4*dt;
    if((keys.has(' ') || keys.has('Space')) && !keys.has('Shift')) shoot();
    ship.cd = Math.max(0, ship.cd - dt);
    ship.inv = Math.max(0, ship.inv - dt);

    // thrust physics
    if(ship.thrusting){ ship.vx += Math.cos(ship.a)*260*dt; ship.vy += Math.sin(ship.a)*260*dt; }
    // friction
    ship.vx *= 0.996; ship.vy *= 0.996;
    ship.x += ship.vx*dt; ship.y += ship.vy*dt; ship.x = wrapX(ship.x); ship.y = wrapY(ship.y);

    // bullets
    for(const b of bullets) b.update(dt);

    // rocks
    for(const r of rocks) r.update(dt);

    // collisions bullets vs rocks
    for(const b of bullets){ if(b.dead || !b.friendly) continue; for(const r of rocks){ if(r.dead) continue; if(dist2(b,r) < (r.radius*r.radius)){ b.dead=true; explodeAsteroid(r); break; } } }

    // rocks vs ship
    if(ship.inv<=0){
      for(const r of rocks){ if(r.dead) continue; if(dist2(ship,r) < (r.radius+12)*(r.radius+12)){ ship.lives--; ship.inv=1.2; if(ship.lives<=0){ gameOver=true; HUD.restart.hidden=false; } break; } }
    }

    // cleanup
    bullets = bullets.filter(b=>!b.dead);
    rocks = rocks.filter(r=>!r.dead);

    // next wave when no rocks
    if(rocks.length===0){ wave++; spawnWave(wave); }

    updateHUD();
  }

  function draw(){
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = '#0f1722'; for(let i=0;i<70;i++){ const x=(i*97 + (time*20)%W)%W; const y=(i*53 + (i*i)%H)%H; ctx.fillRect(x,y,2,2); }

    // ship trail could be added later
    for(const r of rocks) r.draw();
    for(const b of bullets) b.draw();
    ship.draw();

    if(gameOver){
      ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0,0,W,H);
      ctx.fillStyle = '#e6f0ff'; ctx.textAlign='center';
      ctx.font = 'bold 42px system-ui'; ctx.fillText('Game Over', W/2, H/2 - 10);
      ctx.font = '16px system-ui'; ctx.fillText('Press Restart or R to play again', W/2, H/2 + 24);
    }
  }

  // loop
  let last = performance.now();
  function frame(t){ const dt = Math.min(0.033, (t-last)/1000); last=t; update(dt); draw(); requestAnimationFrame(frame);}  

  // restart
  HUD.restart.addEventListener('click', ()=>reset());
  window.addEventListener('keydown', (e)=>{ if((e.key==='r'||e.key==='R') && gameOver) reset(); });

  reset();
  requestAnimationFrame(frame);
})();
