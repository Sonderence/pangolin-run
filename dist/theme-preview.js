'use strict';
const requestedTheme=new URLSearchParams(location.search).get('theme');
const previewTheme=['galaxy','mono','grasslands'].includes(requestedTheme)?requestedTheme:'blossom';
const previewScores={grasslands:8000,blossom:1000,galaxy:3000,mono:5000};
mode='preview';distance=previewScores[previewTheme]*40;clock=2;angle=.7;
obstacles=[{kind:'thorn',x:450},{kind:'eagle',x:700},{kind:'spear',x:970,sy:spearY(970)}];
$('#overlay').hidden=true;$('.eyebrow').textContent='THEME SHOWCASE / '+previewScores[previewTheme].toLocaleString()+' POINTS';
$('h1').textContent={grasslands:'Grasslands',blossom:'Cherry blossoms',galaxy:'Galaxy',mono:'Black & white'}[previewTheme];$('.lede').textContent='All three hazards shown together for comparison. Preview only — no need to reach the score.';
$('#score').textContent=digits(score());const names=hazardNames();$('#status').textContent='JUMP: '+names.thorn.toUpperCase()+' / DUCK: '+names.eagle.toUpperCase()+' / BLOCK: '+names.spear.toUpperCase();
