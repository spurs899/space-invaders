/*
  Stick Space Invaders - minimal, no dependencies
  - Keyboard: Left/Right or A/D to move, Space to shoot
  - Goal: Clear waves of stick-geometry invaders
*/
(function(){
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');

  // Game state
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
    if(['ArrowLeft','ArrowRight','a','d','A','D',' '].includes(e.key)){
      e.preventDefault();
    }
    keys.add(e.key);
  });
  window.addEventListener('keyup', (e)=>keys.delete(e.key));

  // Util
  function clamp(v, a, b){ return Math.min(b, Math.max(a, v)); }
  function rand(a,b){ return a + Math.random()*(b-a); }
  function chance(p){ return Math.random() < p; }

  // Entities
  function makePlayer(){
    return {
      x: W/2, y: H-70, w: 40, h: 40, speed: 360, cd: 0, lives: 3, inv: 0,
      draw(){
        // Stick geometry ship: triangle with stick gun
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.strokeStyle = this.inv>0? '#7fffd4' : '#8bd0ff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, -15); ctx.lineTo(20, 15); ctx.lineTo(-20, 15); ctx.closePath();
        ctx.stroke();
        // gun
        ctx.beginPath();
        ctx.moveTo(0, -15); ctx.lineTo(0, -25); ctx.stroke();
        ctx.restore();
      }
    };
  }

  function makeBullet(x,y,vy, friendly){
    return { x, y, vy, friendly, dead:false,
      update(dt){ this.y += this.vy*dt; if(this.y < -20 || this.y > H+20) this.dead = true; },
      draw(){ ctx.strokeStyle = friendly? '#9aff9a' : '#ff8080'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(this.x, this.y); ctx.lineTo(this.x, this.y + (friendly? -10:10)); ctx.stroke(); }
    };
  }

  function makeInvader(x,y, type){
    // type affects size, pattern, and score
    const t = type || 0;
    const w = 30, h = 24;
    const score = 10 + t*5;
    return { x, y, w, h, t, dead:false, shootCd: rand(1,3),
      update(dt){ this.y += Math.sin((this.x+this.y+time*0.5)*0.02) * 6 * dt; this.shootCd -= dt; },
      draw(){
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.strokeStyle = ['#ffd166','#ffb4a2','#a0c4ff'][t%3];
        ctx.lineWidth = 2.5;
        // stick alien: a box body and two antennae; variants tweak shape
        ctx.strokeRect(-w/2, -h/2, w, h);
        // eyes
        ctx.beginPath();
        ctx.moveTo(-8, -2); ctx.lineTo(-4, -2); ctx.moveTo(8, -2); ctx.lineTo(4, -2); ctx.stroke();
        // legs/arms variants
        if(t===0){
          ctx.beginPath(); ctx.moveTo(-w/2, h/2); ctx.lineTo(-w/2-6, h/2+8); ctx.moveTo(w/2, h/2); ctx.lineTo(w/2+6, h/2+8); ctx.stroke();
        } else if(t===1){
          ctx.beginPath(); ctx.moveTo(0,-h/2); ctx.lineTo(0,-h/2-10); ctx.stroke();
        } else {
          ctx.beginPath(); ctx.moveTo(-w/2,0); ctx.lineTo(-w/2-8,0); ctx.moveTo(w/2,0); ctx.lineTo(w/2+8,0); ctx.stroke();
        }
        ctx.restore();
      },
      score
    };
  }

  function makeBlock(x,y){
    // simple stick bunker: three vertical posts connected by a bar
    const segments = [
      {a:{x:-20,y:0}, b:{x:20,y:0}},
      {a:{x:-20,y:0}, b:{x:-20,y:-20}},
      {a:{x:0,y:0}, b:{x:0,y:-28}},
      {a:{x:20,y:0}, b:{x:20,y:-20}},
    ];
    return {x,y, segs:segments, hp:12,
      hit(){ this.hp--; if(this.hp<=0) this.segs.length = 0; },
      draw(){
        ctx.save(); ctx.translate(this.x,this.y);
        ctx.strokeStyle = '#7da6d8'; ctx.lineWidth=3;
        for(const s of this.segs){ ctx.beginPath(); ctx.moveTo(s.a.x, s.a.y); ctx.lineTo(s.b.x, s.b.y); ctx.stroke(); }
        ctx.restore();
      }
    };
  }

  function lineHitRect(x1,y1,x2,y2, rx,ry,rw,rh){
    // approximate bullet line vs rect overlap
    const minX = Math.min(x1,x2), maxX=Math.max(x1,x2);
    const minY = Math.min(y1,y2), maxY=Math.max(y1,y2);
    return !(rx>maxX || ry>maxY || rx+rw<minX || ry+rh<minY);
  }

  // Game containers
  let player, bullets, enemies, blocks, enemyDir, enemyStepY, enemySpeedX, enemyShootRate, score, wave, time, gameOver;

  function reset(){
    player = makePlayer();
    bullets = [];
    enemies = [];
    blocks = [];
    enemyDir = 1;
    enemyStepY = 22;
    enemySpeedX = 60;
    enemyShootRate = 0.4; // per second across group
    score = 0;
    wave = 1;
    time = 0;
    gameOver = false;

    // create bunkers
    const by = H - 180;
    const spacing = W/4;
    for(let i=1;i<=3;i++) blocks.push(makeBlock(spacing*i - spacing/2, by));

    spawnWave(wave);
    updateHUD();
  }

  function spawnWave(n){
    enemies.length = 0;
    const cols = 8;
    const rows = 4 + Math.min(3, n-1);
    const margin = 80;
    const gapX = (W - margin*2) / (cols-1);
    for(let r=0;r<rows;r++){
      for(let c=0;c<cols;c++){
        const x = margin + c*gapX;
        const y = 120 + r*60;
        enemies.push(makeInvader(x,y, r%3));
      }
    }
    enemySpeedX = 60 + (n-1)*15;
    enemyShootRate = 0.35 + Math.min(0.25, (n-1)*0.05);
  }

  function updateHUD(){
    HUD.score.textContent = `Score: ${score}`;
    HUD.lives.textContent = `Lives: ${player.lives}`;
    HUD.wave.textContent = `Wave: ${wave}`;
    HUD.restart.hidden = !gameOver;
  }

  function playerShoot(){
    if(player.cd>0) return;
    bullets.push(makeBullet(player.x, player.y-25, -560, true));
    player.cd = 0.25;
  }

  function enemyTryShoot(dt){
    // probabilistic group shooting
    const alive = enemies.filter(e=>!e.dead);
    if(alive.length===0) return;
    const shotsExpected = enemyShootRate * dt * alive.length * 0.12; // scale down
    if(chance(shotsExpected)){
      const shooter = alive[(Math.random()*alive.length)|0];
      bullets.push(makeBullet(shooter.x, shooter.y+16, 260 + rand(0,80), false));
    }
  }

  function rectsOverlap(a,b){
    return Math.abs(a.x-b.x) < (a.w/2 + b.w/2) && Math.abs(a.y-b.y) < (a.h/2 + b.h/2);
  }

  function update(dt){
    time += dt;
    if(gameOver){ return; }

    // Player input
    let dx = 0;
    if(keys.has('ArrowLeft') || keys.has('a') || keys.has('A')) dx -= 1;
    if(keys.has('ArrowRight') || keys.has('d') || keys.has('D')) dx += 1;
    player.x = clamp(player.x + dx*player.speed*dt, 24, W-24);
    if((keys.has(' ') || keys.has('Space')) && !keys.has('Shift')) playerShoot();
    player.cd = Math.max(0, player.cd - dt);
    player.inv = Math.max(0, player.inv - dt);

    // Enemies horizontal marching
    let minX = Infinity, maxX = -Infinity, maxY = -Infinity;
    for(const e of enemies){
      if(e.dead) continue;
      e.x += enemyDir * enemySpeedX * dt;
      e.update(dt);
      minX = Math.min(minX, e.x - e.w/2);
      maxX = Math.max(maxX, e.x + e.w/2);
      maxY = Math.max(maxY, e.y + e.h/2);
    }
    if(minX < 20 || maxX > W-20){
      enemyDir *= -1;
      for(const e of enemies){ if(!e.dead) e.y += enemyStepY; }
    }

    // Enemy shooting
    enemyTryShoot(dt);

    // Bullets
    for(const b of bullets){ b.update(dt); }

    // Collisions: bullets vs enemies
    for(const b of bullets){
      if(b.dead || !b.friendly) continue;
      for(const e of enemies){
        if(e.dead) continue;
        if(lineHitRect(b.x, b.y, b.x, b.y-10, e.x-e.w/2, e.y-e.h/2, e.w, e.h)){
          e.dead = true; b.dead = true; score += e.score; break;
        }
      }
    }

    // Bullets vs player
    if(player.inv<=0){
      for(const b of bullets){
        if(b.dead || b.friendly) continue;
        if(lineHitRect(b.x, b.y, b.x, b.y+10, player.x-20, player.y-20, 40,40)){
          b.dead = true; player.lives--; player.inv = 1.2;
          if(player.lives<=0){ gameOver = true; HUD.restart.hidden = false; }
          break;
        }
      }
    }

    // Bullets vs blocks
    for(const b of bullets){ if(b.dead) continue; for(const bl of blocks){
      // simple AABB around bunker
      if(lineHitRect(b.x,b.y, b.x, b.y+(b.friendly?-10:10), bl.x-24, bl.y-32, 48, 36)){
        b.dead = true; bl.hit(); break;
      }
    }}

    // Enemies reach ground
    if(maxY > H-120){ gameOver = true; HUD.restart.hidden = false; }

    // Cleanup
    bullets = bullets.filter(b=>!b.dead);

    // Wave cleared
    if(enemies.every(e=>e.dead)){
      wave++; spawnWave(wave);
    }

    updateHUD();
  }

  function draw(){
    ctx.clearRect(0,0,W,H);

    // star field
    ctx.fillStyle = '#0f1722';
    for(let i=0;i<70;i++){
      const x = (i*97 + (time*20)%W) % W;
      const y = (i*53 + (i*i)%H) % H;
      ctx.fillRect(x, y, 2, 2);
    }

    // ground line
    ctx.strokeStyle = '#1f2a3a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0,H-100); ctx.lineTo(W,H-100); ctx.stroke();

    // draw entities
    for(const bl of blocks){ bl.draw(); }
    for(const e of enemies){ if(!e.dead) e.draw(); }
    for(const b of bullets){ b.draw(); }
    player.draw();

    if(gameOver){
      ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0,0,W,H);
      ctx.fillStyle = '#e6f0ff'; ctx.textAlign='center';
      ctx.font = 'bold 42px system-ui'; ctx.fillText('Game Over', W/2, H/2 - 10);
      ctx.font = '16px system-ui'; ctx.fillText('Press Restart or R to play again', W/2, H/2 + 24);
    }
  }

  // Loop
  let last = performance.now();
  function frame(t){
    const dt = Math.min(0.033, (t-last)/1000);
    last = t;
    update(dt);
    draw();
    requestAnimationFrame(frame);
  }

  // Restart button / key
  HUD.restart.addEventListener('click', ()=>{ reset(); });
  window.addEventListener('keydown', (e)=>{
    if((e.key==='r' || e.key==='R') && gameOver){ reset(); }
  });

  // Start
  reset();
  requestAnimationFrame(frame);
})();