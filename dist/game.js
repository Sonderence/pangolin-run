'use strict';
const canvas=document.querySelector('#scene'),screen=canvas.getContext('2d'),pixelCanvas=document.createElement('canvas'),ctx=pixelCanvas.getContext('2d'),$=s=>document.querySelector(s);
const W=1200,H=480,GROUND=378,PX=190;
pixelCanvas.width=400;pixelCanvas.height=160;ctx.scale(1/3,1/3);screen.imageSmoothingEnabled=false;
let mode='ready',distance=0,speed=6,y=0,vy=0,angle=0,spawn=150,obstacles=[],particles=[],last=0,best=0,milestone=0,flash=0,clock=0,speedTier=0;
const held=new Set(),theme=matchMedia('(prefers-color-scheme: dark)');let palette={};
try{best=Number(localStorage.getItem('pangolin-best'))||0}catch{}
function colors(){const css=getComputedStyle(document.documentElement);for(const k of ['sky','far','tree','grass','soil','bird','ink'])palette[k]=css.getPropertyValue('--'+k).trim();$('#theme').textContent=theme.matches?'Dark · follows your browser':'Light · follows your browser'}colors();theme.addEventListener('change',colors);
const digits=n=>String(n).padStart(5,'0');$('#best').textContent=digits(best);
function score(){return Math.round(distance*.025)}
function start(){held.clear();introduced.eagle=introduced.spear=false;distance=0;speed=6;speedTier=0;y=vy=angle=0;spawn=130;obstacles=[];particles=[];milestone=flash=0;mode='running';$('#overlay').hidden=true;$('#pause').textContent='Ⅱ Pause';$('#pause').setAttribute('aria-label','Pause game');$('#status').textContent='Find your rhythm. Keep rolling.';canvas.focus()}
function overlay(title,hint,label){$('#message').textContent=title;$('#hint').textContent=hint;$('#start').innerHTML=label+' <span>→</span>';$('#overlay').hidden=false;$('#overline').textContent=mode==='dead'?'A GOOD RUN. ANOTHER ONE?':'TAKE A BREATHER'}
function pause(){if(mode==='running'){mode='paused';held.clear();overlay('Catch your breath.','Your grasslands will be right here.','Keep rolling');$('#pause').textContent='▶ Resume';$('#pause').setAttribute('aria-label','Resume game')}else if(mode==='paused'){mode='running';$('#overlay').hidden=true;$('#pause').textContent='Ⅱ Pause';$('#pause').setAttribute('aria-label','Pause game')}}
function action(a){if(mode==='ready'||mode==='dead'){start();return}if(mode!=='running')return;if(a==='jump'&&y===0&&!held.has('block')){vy=-13.5;held.delete('duck')}else if(a!=='jump')held.add(a)}
$('#start').onclick=()=>mode==='paused'?pause():start();$('#pause').onclick=pause;
const map={Space:'jump',ArrowUp:'jump',KeyW:'jump',ArrowDown:'duck',KeyS:'duck',KeyB:'block',ArrowRight:'block'};
document.addEventListener('keydown',e=>{if(map[e.code]||['KeyP','Escape'].includes(e.code)){e.preventDefault();if(e.repeat)return;if(e.code==='KeyP'||e.code==='Escape'){pause();return}action(map[e.code])}});document.addEventListener('keyup',e=>{if(map[e.code]){e.preventDefault();held.delete(map[e.code])}});
for(const b of document.querySelectorAll('[data-action]')){b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);action(b.dataset.action)});for(const ev of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(ev,()=>held.delete(b.dataset.action))}
window.addEventListener('blur',()=>{if(mode==='running')pause()});document.addEventListener('visibilitychange',()=>{if(document.hidden&&mode==='running')pause()});
function path(points,fill,stroke,width=2){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));if(fill){ctx.closePath();ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke()}}
function ellipse(x,y,rx,ry,color){ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fillStyle=color;ctx.fill()}
function die(kind){mode='dead';held.clear();const n=score();if(n>best){best=n;try{localStorage.setItem('pangolin-best',best)}catch{}$('#best').textContent=digits(best)}const tips={thorn:'Jump over thorn bushes with SPACE or ↑.',eagle:'Hold ↓ or S on the ground to duck. Eagles catch you if you jump.',spear:'Hold B or → on the ground to block. Spears curve toward you; jumping and ducking cannot evade them.'};overlay('One more roll?',hazardTip(kind)+' Score: '+digits(n),'Try again');$('#status').textContent='Every roll is a fresh start.'}
function update(dt){clock+=dt/60;if(mode!=='running')return;const tier=speedStage(score());if(tier>speedTier){speed+=.8*(tier-speedTier);speedTier=tier;}const travel=speed*dt;distance+=travel;if(speedTier<6)speed=Math.min(16+speedTier*.8,speed+.003*dt);angle+=travel/29;if(y<0||vy<0){y+=vy*dt;vy+=.6*dt;if(y>=0){y=vy=0}}spawn-=dt;if(spawn<=0){spawnHazard()}for(const o of obstacles){const previousX=o.x;o.x-=travel*(o.kind==='spear'?1.22:1);if(o.kind==='spear'){o.sy=spearY(o.x);}const duck=held.has('duck')&&y===0,block=held.has('block')&&y===0&&!duck;const left=PX-(duck?27:21),right=PX+(duck?30:22),top=GROUND+y-(duck?29:52),bottom=GROUND+y-5;const ow=o.kind==='thorn'?52:o.kind==='eagle'?65:93;const ot=o.kind==='thorn'?GROUND-45:o.kind==='eagle'?GROUND-69:GROUND-34;const ob=o.kind==='thorn'?GROUND:o.kind==='eagle'?GROUND-46:GROUND-24;if(!o.done&&o.kind==='spear'&&block&&o.x<PX+67&&o.x+ow>PX+20){o.done=true;for(let i=0;i<12;i++)particles.push({x:PX+55,y:GROUND-30,vx:Math.random()*6,vy:-Math.random()*4,life:25});$('#status').textContent='Blocked. Those scales mean business.'}if(!o.done&&(o.kind==='spear'?(previousX>right&&o.x<=right||left<o.x+ow&&right>o.x):o.kind==='eagle'?(left<o.x+ow&&right>o.x&&!duck):left<o.x+ow&&right>o.x&&top<ob&&bottom>ot)){die(o.kind);break}}obstacles=obstacles.filter(o=>o.x>-120&&!o.done);for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt}particles=particles.filter(p=>p.life>0);const n=score();$('#score').textContent=digits(n);if(n>=milestone+100){milestone=Math.floor(n/100)*100;flash=90;$('#status').textContent=milestone+' points. Keep that roll going.'}flash=Math.max(0,flash-dt);$('#milestone').textContent=flash>0&&Math.floor(flash/10)%2===0?'✦ '+milestone:''}
function frame(t){const dt=last?Math.min((t-last)/16.6667,2):1;last=t;update(dt);scenery();obstacles.forEach(obstacle);pangolin();for(const p of particles)ellipse(p.x,p.y,3,2,'#bdad72');screen.drawImage(pixelCanvas,0,0,W,H);requestAnimationFrame(frame)}requestAnimationFrame(frame);

function unlockedKinds(n=score()){return n<150?['thorn']:n<500?['thorn','eagle']:['thorn','eagle','spear']}
function spawnHazard(){
 const choices=unlockedKinds().filter(k=>!(k==='spear'&&obstacles.some(o=>o.kind==='thorn'))&&!(k==='thorn'&&obstacles.some(o=>o.kind==='spear')));
 if(!choices.length){spawn=10;return}
 // Introduce each new mechanic immediately at its threshold.
 const kind=score()>=500&&!introduced.spear?'spear':score()>=150&&!introduced.eagle?'eagle':choices[Math.floor(Math.random()*choices.length)];
 if(!choices.includes(kind)){spawn=10;return}
 introduced[kind]=true;obstacles.push({kind,x:W+80,sy:spearY(W+80)});
 const level=Math.min(score()/1000,1);spawn=(620-level*180+Math.random()*200)/speed+38-level*12;
}
const introduced={eagle:false,spear:false};
function spearY(x){
 const t=Math.max(0,Math.min(1,(W+80-x)/(W+80-PX)));
 const target=GROUND+y-(held.has('duck')&&y===0?17:29);
 // High lob followed by a late homing bend, readable until the final approach.
 return (1-t)*(GROUND-155)+t*target-115*4*t*(1-t);
}
function rect(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(Math.round(x/3)*3,Math.round(y/3)*3,w,h)}
function sprite(rows,x,y,scale,colors){rows.forEach((row,r)=>[...row].forEach((p,c)=>{if(colors[p])rect(x+c*scale,y+r*scale,scale,scale,colors[p])}))}
// Original pastoral pixel scenery: stepped silhouettes and clustered highlights.
function tree(x,base,size){const z=Math.max(3,Math.round(size*5));sprite([
'.......ddd........','.....ddgggdd......','....dggllllgd.....','...dglllhlgggd....','..dgglhhlllgggd...','.dgglllgllhlgggd..','dgglgllhhllgggggd.','dggglllgllglggggd.','.dgggllggllggggd..','..ddgggggggggdd...','....ddgggggdd.....','.......trt........','......ttrtt.......','......trrtt.......','.....tttrttt......'],x,base-z*15,z,theme.matches?{d:'#1d3d33',g:'#356347',l:'#547d50',h:'#77945b',t:'#493c35',r:'#756044'}:{d:'#31593b',g:'#548445',l:'#80ad50',h:'#b4ce70',t:'#654832',r:'#a97847'});
}
function grassScenery(){const dark=theme.matches;rect(0,0,W,H,dark?'#192b42':'#99cbbf');
 // Distant haze, sun/moon, and small block-shaped clouds.
 rect(0,190,W,120,dark?'#34485b':'#c4d9ba');sprite(['..ssss..','.ssssss.','ssssssss','ssssssss','.ssssss.','..ssss..'],970,78,6,{s:dark?'#dbddb1':'#f8dda0'});
 for(let i=0;i<4;i++){const x=((i*345-distance*.025)%1500+1500)%1500-100;rect(x+18,120+i%2*30,60,12,dark?'#4b5c69':'#e7eacb');rect(x,132+i%2*30,108,12,dark?'#4b5c69':'#e7eacb')}
 // Hills are stepped on the pixel grid, with separate parallax layers.
 for(let layer=0;layer<3;layer++){const base=260+layer*27,offset=distance*(.025+layer*.028);for(let x=0;x<W;x+=12){const h=24+Math.sin((x+offset)/180+layer)*20+Math.sin((x+offset)/79)*7;rect(x,base-h,12,GROUND-base+h,dark?['#3d5660','#3a604e','#426e48'][layer]:['#87ad96','#6e9d6a','#8eaf61'][layer])}}
 for(let i=0;i<8;i++)tree(((i*220-distance*.12)%1900+1900)%1900-180,347,.6+(i%3)*.16);
 // Flowered meadow behind the playable track.
 rect(0,345,W,33,dark?'#38573d':'#91b85c');for(let i=0;i<65;i++){let x=((i*47-distance*.23)%1300+1300)%1300;const yy=349+(i%5)*4;rect(x,yy,3,9,dark?'#68935b':'#679343');if(i%3===0){rect(x-3,yy,9,3,i%2?'#efcf81':'#dec7b4');rect(x,yy-3,3,3,'#f5df9a')}}
 for(let i=0;i<6;i++)sprite(['b...b','.b.b.','..b..'],((i*239-clock*7)%1400+1400)%1400-60,100+(i%3)*31,3,{b:dark?'#bdc9ac':'#5d7966'});
 rect(0,GROUND,W,H-GROUND,dark?'#665640':'#b68e59');rect(0,GROUND,W,6,dark?'#91a666':'#c2cf74');rect(0,GROUND+6,W,9,dark?'#4c713e':'#699545');rect(0,GROUND+15,W,6,dark?'#443f31':'#8f693f');
 for(let i=0;i<130;i++){const x=((i*37-distance*.8)%1250+1250)%1250,yy=GROUND+27+(i%7)*9;rect(x,yy,6,3,i%3===0?(dark?'#887252':'#d0ac72'):(dark?'#514735':'#9b774b'));if(i%11===0){rect(x,yy-3,9,3,dark?'#92927b':'#d1c298')}}
}
function pangolin(){const duck=held.has('duck')&&y===0,block=held.has('block')&&y===0&&!duck;
 const fur={o:'#49372b',s:'#795034',m:'#ae7746',h:'#d3a15f',l:'#f1ce8c',b:'#c99760',c:'#f4d7a0',e:'#1e2c24',n:'#65412d'};
 if(duck){
  // Separate unrolled pose. The low armored back fits beneath the eagle.
  sprite([
'.............ooooooo................',
'..........ooosmhlhmmsoo.............',
'........oosmhlssmhssmhsoo...........',
'......oosmhlhmmhlhmmhlhms oo.........'.replace(/ /g,''),
'....oosmssmhssmhssmhssmhmsoo........',
'..oosmhlhmmhlhmmhlhmmhlhmsobbo......',
'oomssmhssmhssmhssmhssmmsobbebbo.....',
'..ooosssssssssssssssssooobcccbbno...',
'......oooooobbbboooobbboooobcccbbno.',
'............oooo....ooo....ooooooo..'],PX-63,GROUND-30,3,fur);
  // Small swept-back scale tips retain the familiar crawling silhouette.
  for(const [dx,dy] of [[-30,-24],[-18,-30],[-6,-33],[6,-30],[18,-27]]){
   sprite(['..o','ohh','smh'],PX+dx,GROUND+dy,3,fur);
  }
  const stride=Math.floor(distance/18)%4;
  // Two pairs of little clawed feet alternate, rather than rotating the body.
  for(const [base,phase] of [[-18,0],[18,2]]){const step=(stride+phase)%4;const offset=[-3,0,3,0][step];rect(PX+base+offset,GROUND-6,6,3,fur.s);rect(PX+base+offset+3,GROUND-3,9,3,fur.c)}
 }else{
  // A round, closed ball: the plated tail spirals around a tucked face.
  const roll=[
'.......ooooooo.......',
'.....oosmhhlhmsoo.....',
'....osmhlssmhlhmso....',
'...osmhlhmmhlssmhmso..',
'..osmssmhssmhlhmmhmso.',
'..omhllhmmhlhmmhssmso.',
'.osmssmhoooooomhllhmso',
'.omhlhmossmmmsohssmhmo',
'.omhssmoshllhmsohlhmmo',
'.omhlmoshlsslhsohssmmo',
'.omhsmoshmbebhsohlhmmo',
'.omhlmosmbccnsohssmhmo',
'.omhssmosbbcooshllhmso',
'..omhlmsoooooshssmhmo.',
'..osmhssmmmsshllhmmso.',
'...osmhllhmmhssmhmso..',
'....osmssmhllhmmso....',
'.....oosmhssmmsoo.....',
'.......ooooooo.......'];
  ctx.save();ctx.translate(PX,GROUND+y-30);
  // Sixteen distinct pixel-stepped angles make the armor visibly tumble.
  if(!block)ctx.rotate(Math.floor(angle/(Math.PI/8))*Math.PI/8);
  sprite(roll,-30,-27,3,fur);
  // Modest pointed scales break up the round armor edge.
  for(const [x,z,r] of [[-18,-24,-.25],[-6,-27,0],[9,-27,.25],[24,-18,.65],[30,-3,1],[27,12,1.3],[15,24,1.7],[0,27,2],[-15,24,2.3],[-27,12,2.65],[-30,-3,3],[-27,-18,3.4]]){
   ctx.save();ctx.translate(x,z);ctx.rotate(r*Math.PI/2);sprite(['...o','..oh','..hl','omhl','ssmh'],0,-9,3,fur);ctx.restore();
  }
  ctx.restore();
 }
 if(block)sprite(['..ss..','.sggs.','sggggs','sglggs','sglggs','sglggs','.sggs.','..ss..'],PX+30,GROUND-66,6,{s:'#dfe5ae',g:'#86a956',l:'#b8d578'});
 if(y===0&&mode==='running'&&Math.random()<.25)particles.push({x:PX-30,y:GROUND-2,vx:-2,vy:-Math.random(),life:20})}
function grassObstacle(o){if(o.kind==='thorn')sprite(['....t......','....ot..t..','.t..og..o..','.ogoggtgo..','togghggggto','.ogtgggggo.','ogghggtgggo','.ooooooooo.'],o.x,GROUND-48,6,{o:'#172c24',g:theme.matches?'#a6bd58':'#345531',h:theme.matches?'#d3df83':'#699247',t:theme.matches?'#fff0c5':'#fff0b0'});
 else if(o.kind==='eagle'){const wings=Math.sin(clock*12)>0?['w........w..','.ww....ww...','..ww..ww....','...wwww.....']:['............','............','www....www..','.wwwwwwww...'];sprite([...wings,'...wwhhhy...','....wwheeey.','.....ww.....'],o.x,GROUND-129,6,{w:'#634b34',h:'#d7d2af',e:'#202b1d',y:'#d9a64b'});sprite(['y..y','y..y','yy.yy'],o.x+30,GROUND-87,3,{y:'#d9a64b'});ctx.save();ctx.fillStyle=biome()==='galaxy'?'#f4d7a0':palette.ink;ctx.font='bold 15px monospace';ctx.fillText('DUCK ↓',Math.round(o.x/3)*3,GROUND-147);ctx.restore()}
 else{const yy=o.sy??spearY(o.x),next=spearY(o.x-8);ctx.save();ctx.translate(o.x,yy);ctx.rotate(Math.atan2(yy-next,8));sprite(['.....m.........................','...mml.........................','.mmlllrbbbbbbbbbbbbbbbbbbbbbbbb','mlllllrbbbbbbbbbbbbbbbbbbbbbbbb','.mmdddrbbbbbbbbbbbbbbbbbbbbbbbb','...mmd.........................','.....m.........................'],0,-9,3,{m:'#384f50',l:'#e1e6d4',d:'#8fa8a2',r:'#c5a269',b:'#98613b'});ctx.restore();for(let i=1;i<=3;i++)rect(o.x+i*27,spearY(o.x+i*27),3,3,palette.bird)}
}

function speedStage(n){return n>=8000?6:n>=5000?5:n>=3000?4:n>=1500?3:n>=800?2:n>=300?1:0}
function biome(n=score()){
 if(n<8000)return n>=5000?'mono':n>=3000?'galaxy':n>=1000?'blossom':'grasslands';
 // After the first circuit: grass +1000, blossom +2000, galaxy +5000, mono +3000.
 const lap=(n-8000)%11000;return lap>=8000?'mono':lap>=3000?'galaxy':lap>=1000?'blossom':'grasslands';
}
let shownBiome='';
function scenery(){const stage=biome();if(shownBiome!==stage){shownBiome=stage;$('.game').dataset.biome=stage;$('#biome-name').textContent=stage==='mono'?'BLACK & WHITE':stage==='galaxy'?'GALAXY':stage==='blossom'?'CHERRY BLOSSOMS':'GRASSLANDS';updateHazardLabels();}
 if(stage==='grasslands'){grassScenery();return}
 if(stage==='blossom'){blossomScenery();return}if(stage==='mono'){monoScenery();return}galaxyScenery();
}
function blossomScenery(){const dark=theme.matches;rect(0,0,W,H,dark?'#30243f':'#f5dfeb');rect(0,205,W,173,dark?'#534259':'#dac0d6');
 sprite(['..ssss..','.ssssss.','ssssssss','ssssssss','.ssssss.','..ssss..'],970,78,6,{s:dark?'#e1d2d4':'#fff0c2'});
 for(let layer=0;layer<2;layer++)for(let x=0;x<W;x+=12){let h=35+Math.sin((x+distance*.04)/180+layer)*25;rect(x,285+layer*30-h,12,120,dark?['#645064','#72546b'][layer]:['#c6a5c3','#b1ad91'][layer])}
 for(let i=0;i<8;i++){const x=((i*205-distance*.12)%1800+1800)%1800-150;const z=6+(i%2)*2;sprite(['......pppp......','....ppllllpp....','..ppllhllhllpp..','.pllhllllhlllpp.','pplllhlllhllllpp','plhllllhlllhlllp','.pplllhllllllpp.','...pppllpllpp...','......tttt......','......tttt......','.....tt.ttt.....','....tt...ttt....'],x,345-z*12,z,{p:dark?'#a75f8d':'#ce729d',l:dark?'#d394b4':'#f3adc9',h:dark?'#ebbbd1':'#ffe0e8',t:dark?'#62465a':'#886174'})}
 rect(0,345,W,33,dark?'#6a6158':'#c5c995');for(let i=0;i<40;i++){const x=((i*79-distance*.2+Math.sin(clock+i)*15)%1300+1300)%1300,yy=95+(i*37+clock*18)%270;rect(x,yy,6,3,i%2?'#f3b6d0':'#ffe0eb');rect(x+3,yy+3,3,3,'#d88bb2')}
 rect(0,GROUND,W,H-GROUND,dark?'#6d535f':'#d3a6aa');rect(0,GROUND,W,6,dark?'#d19ab6':'#f3c2d3');rect(0,GROUND+6,W,9,dark?'#917a79':'#aba77c');for(let i=0;i<100;i++)rect(((i*41-distance*.8)%1250+1250)%1250,GROUND+21+(i%8)*9,6,3,i%2?'#e4b6c5':'#b8889d');
}
function galaxyScenery(){rect(0,0,W,H,'#111229');
 // Broad dithered nebula bands create depth without obscuring hazards.
 for(let layer=0;layer<3;layer++)for(let x=0;x<W;x+=12){const yy=155+Math.sin((x+distance*.025)/240+layer*.5)*75;rect(x,yy+layer*15,12,42,['#24203f','#32264f','#42305b'][layer])}
 for(let i=0;i<95;i++){const x=((i*127-distance*(.015+(i%3)*.01))%1250+1250)%1250,yy=65+(i*53)%270;rect(x,yy,i%9===0?6:3,3,i%2?'#b6c6e5':'#f2d5e9');if(i%13===0){rect(x,yy-3,3,9,'#e9e5fb');rect(x-3,yy,9,3,'#e9e5fb')}}
 sprite(['....pppp....','..pppppppp..','.pphhhhpppp.','pphhhhpppppp','pppppppppppp','.pppppppppp.','..pppppppp..','....pppp....'],950,95,9,{p:'#7963a5',h:'#b59dd2'});for(let i=0;i<18;i++)rect(895+i*12,153+i*3,15,3,'#c2accc');
 // Cratered moon surface preserves the same readable ground line.
 rect(0,GROUND,W,H-GROUND,'#55576e');rect(0,GROUND,W,6,'#b7b5d2');rect(0,GROUND+6,W,9,'#75798e');for(let i=0;i<35;i++){const x=((i*83-distance*.8)%1300+1300)%1300,yy=GROUND+24+(i%5)*12;rect(x,yy,24,6,'#3b3e57');rect(x+3,yy+6,18,3,'#76788e')}
}

function hazardNames(stage=biome()){return stage==='mono'?{thorn:'squares',eagle:'lasers',spear:'triangles'}:stage==='blossom'?{thorn:'raspberry bushes',eagle:'snowy owls',spear:'arrows'}:stage==='galaxy'?{thorn:'moon rocks',eagle:'flying saucers',spear:'shooting stars'}:{thorn:'thorn bushes',eagle:'eagles',spear:'spears'}}
function hazardTip(kind){const names=hazardNames();return kind==='thorn'?'Jump over '+names.thorn+' with SPACE or ↑.':kind==='eagle'?'Hold ↓ or S on the ground to duck under '+names.eagle+'. Jumping will not work.':'Hold B or → on the ground to block '+names.spear+'. They curve toward you; jumping and ducking cannot evade them.'}
function updateHazardLabels(){const n=hazardNames();$('[data-action="jump"] small').textContent='Clear the '+n.thorn;$('[data-action="duck"] small').textContent='Stay below the '+n.eagle;$('[data-action="block"] small').textContent='Scales up. Stop the '+n.spear+'.';canvas.setAttribute('aria-label','Jump over '+n.thorn+', duck under '+n.eagle+', and block '+n.spear+'. Space to start.')}
function obstacle(o){const stage=biome();if(stage==='grasslands'){grassObstacle(o);return}if(stage==='mono'){monoObstacle(o);return}
 if(o.kind==='thorn'){
  if(stage==='blossom')sprite(['....g.g....','..ggggggg..','.ggrgggrgg.','gggrrgrrggg','ggrgggggrgg','gggggrrgggg','.ggrgrrggg.','..ggggggg..'],o.x,GROUND-48,6,{g:'#466543',r:'#c74169'});
  else sprite(['....ss.....','...shhs....','..shhhs.ss.','.shhddsshs.','shhdddhhhhs','shhdddhdhhs','shdddhddhds','sssssssssss'],o.x,GROUND-48,6,{s:'#4a4667',h:'#aaa2bd',d:'#706985'});
 }else if(o.kind==='eagle'){
  if(stage==='blossom'){const wings=Math.sin(clock*12)>0?['w..........w','www......www','.wwww..wwww.','..wwwwwwww..']:['............','............','wwww....wwww','.wwwwwwwwww.'];sprite([...wings,'...wyee yw...'.replace(/ /g,''),'....wwbww...','.....www....'],o.x,GROUND-129,6,{w:'#f1eee4',y:'#d9bc61',e:'#333b45',b:'#a69b8b'});sprite(['d...d','.d.d.'],o.x+12,GROUND-99,3,{d:'#b7b5ac'})}
  else{sprite(['.....ccc....','....cbbbc...','...cbbhbbc..','..sssssssss.','ssllllllllss','.ssssssssss.','...y..y..y..'],o.x,GROUND-129,6,{c:'#8b9eb9',b:'#9edcd5',h:'#dcf4e3',s:'#786b99',l:'#d6c5ed',y:'#eac879'});}
  ctx.save();ctx.fillStyle=stage==='galaxy'?'#f4d7a0':palette.ink;ctx.font='bold 15px monospace';ctx.fillText('DUCK ↓',Math.round(o.x/3)*3,GROUND-147);ctx.restore();
 }else{
  const yy=o.sy??spearY(o.x),next=spearY(o.x-8);ctx.save();ctx.translate(o.x,yy);ctx.rotate(Math.atan2(yy-next,8));
  if(stage==='blossom')sprite(['..m.......................f..','mmm......................ff..','mhlbbbbbbbbbbbbbbbbbbbbbbf...','mmm......................ff..','..m.......................f..'],0,-6,3,{m:'#697c83',h:'#e6e6d8',l:'#b9c7c0',b:'#a87549',f:'#cf8b9f'});
  else{for(let i=0;i<9;i++)rect(35+i*6,-3+(i%3)*3,12,3,'#bc85ba');sprite(['....g....','....g....','...glg...','ggglllggg','.gllhllg.','..glllg..','..glglg..','..g...g..'],0,-24,6,{g:'#eebd63',l:'#ffe9a2',h:'#fff9df'});}
  ctx.restore();for(let i=1;i<=3;i++)rect(o.x+i*27,spearY(o.x+i*27),3,3,stage==='galaxy'?'#d5addb':palette.bird);
 }
}

function monoScenery(){const bg=theme.matches?'#101010':'#f5f5f5',fg=theme.matches?'#eeeeee':'#151515',muted=theme.matches?'#484848':'#c4c4c4';rect(0,0,W,H,bg);for(let i=0;i<18;i++){const x=((i*83-distance*.06)%1300+1300)%1300;rect(x,100+i%4*42,21,21,muted)}rect(0,GROUND,W,6,fg);rect(0,GROUND+6,W,H-GROUND-6,bg);for(let i=0;i<60;i++)rect(((i*47-distance*.8)%1250+1250)%1250,GROUND+24+(i%5)*12,12,3,muted)}
function monoObstacle(o){const fg=theme.matches?'#fafafa':'#111111',bg=theme.matches?'#111111':'#fafafa';if(o.kind==='thorn'){rect(o.x,GROUND-48,54,48,fg);rect(o.x+6,GROUND-42,42,36,bg);rect(o.x+12,GROUND-36,30,24,fg)}else if(o.kind==='eagle'){rect(o.x,GROUND-108,72,6,fg);rect(o.x,GROUND-111,6,12,fg);rect(o.x+66,GROUND-111,6,12,fg);ctx.save();ctx.fillStyle=fg;ctx.font='bold 15px monospace';ctx.fillText('DUCK ↓',o.x,GROUND-147);ctx.restore()}else{const yy=o.sy??spearY(o.x),next=spearY(o.x-8);ctx.save();ctx.translate(o.x,yy);ctx.rotate(Math.atan2(yy-next,8));path([[0,0],[54,-27],[54,27]],fg);path([[15,0],[45,-15],[45,15]],bg);ctx.restore()}}
