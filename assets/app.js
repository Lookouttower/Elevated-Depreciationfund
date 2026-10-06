'use strict';
// Original semicolon timecodes interpreted as drop-frame at the verified 30000/1001 source frame rate.
const timecodeSeconds = tc => {const [h,m,s,f]=tc.split(';').map(Number);const minutes=h*60+m;return ((h*3600+m*60+s)*30+f-2*(minutes-Math.floor(minutes/10)))/(30000/1001);};
const topics=[
{id:'passive',title:'Passive Income',start:'00;00;41;23',end:'00;02;40;22'},
{id:'active',title:'Active Income',start:'00;02;40;22',end:'00;03;28;19'},
{id:'difference',title:'Difference Between the Funds',start:'00;03;28;19',end:'00;03;48;12'},
{id:'travel',title:'Travel Credit',start:'00;03;48;12',end:'00;04;18;17'}
].map(t=>({...t,from:timecodeSeconds(t.start),to:timecodeSeconds(t.end)}));
const $=id=>document.getElementById(id),video=$('video');let selected=null,ready=false,complete=false;
const fmt=s=>{s=Math.max(0,Math.floor(s||0));return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;};
const bounds=()=>({from:selected?.from||0,to:selected?.to||video.duration||0});
$('chapters').innerHTML=topics.map((t,i)=>`<button class="topic" data-id="${t.id}" aria-pressed="false"><span class="number">0${i+1}</span><span><strong>${t.title}</strong><small>${fmt(t.from)} – ${fmt(t.to)}</small></span><span class="triangle" aria-hidden="true">▷</span></button>`).join('');
function sync(){const {from,to}=bounds();$('elapsed').textContent=fmt(video.currentTime-from);$('duration').textContent=fmt(to-from);$('seek').value=to>from?Math.min(1000,Math.max(0,(video.currentTime-from)/(to-from)*1000)):0;}
function endSection(){video.pause();complete=true;$('finished-title').textContent=selected?.title||'Full overview';$('finished').hidden=false;}
async function play(){if(!ready){$('status').textContent='The video is still loading. Please try Play in a moment.';return;}const {from,to}=bounds();if(complete||video.currentTime<from||video.currentTime>=to){video.currentTime=from;}complete=false;$('finished').hidden=true;try{await video.play();}catch(e){if(e.name!=='AbortError')$('status').textContent='Playback could not start. Please press Play to try again.';}}
function select(id){video.pause();selected=topics.find(t=>t.id===id)||null;complete=false;$('finished').hidden=true;document.querySelectorAll('[data-id]').forEach(b=>{const active=b.dataset.id===id;b.classList.toggle('selected',active);b.setAttribute('aria-pressed',String(active));});$('current').textContent=selected?.title||'Full overview';$('mode').textContent=selected?'Pauses at the end of this topic':'Play at your pace';if(ready){if(selected&&selected.to>video.duration+.1){$('status').textContent='This video is shorter than the selected section. Please reload the page.';return;}video.currentTime=bounds().from;sync();play();}else{$('status').textContent='Topic selected. Please press Play once the video has loaded.';}}
document.querySelectorAll('[data-id]').forEach(b=>b.addEventListener('click',()=>select(b.dataset.id)));
video.addEventListener('loadedmetadata',()=>{ready=true;['toggle','seek','mute','fullscreen'].forEach(id=>$(id).disabled=false);$('status').textContent='Choose a topic, or press Play to watch the full overview.';if(selected&&selected.to>video.duration+.1){selected=null;select('full');}else{video.currentTime=bounds().from;sync();}});
video.addEventListener('error',()=>{ready=false;['toggle','seek','mute','fullscreen'].forEach(id=>$(id).disabled=true);$('status').textContent='The video could not load. Check your connection and try again.';$('empty').hidden=false;video.hidden=true;});
$('toggle').onclick=()=>video.paused?play():video.pause();$('replay').onclick=play;
video.addEventListener('play',()=>{$('toggle').textContent='Pause';$('toggle').setAttribute('aria-label','Pause video');});video.addEventListener('pause',()=>{$('toggle').textContent='Play';$('toggle').setAttribute('aria-label','Play video');});
function enforce(){if(ready&&selected&&!video.paused&&!video.seeking&&video.currentTime>=selected.to){endSection();}sync();}
video.addEventListener('timeupdate',enforce);video.addEventListener('ended',endSection);
// Frequent boundary checks also operate while the native full-screen player is in use.
setInterval(()=>{if(!video.paused)enforce();},25);
$('seek').addEventListener('input',()=>{const {from,to}=bounds();video.currentTime=from+(to-from)*Number($('seek').value)/1000;complete=false;$('finished').hidden=true;sync();});
$('mute').onclick=()=>{video.muted=!video.muted;$('mute').textContent=video.muted?'Muted':'Sound on';$('mute').setAttribute('aria-label',video.muted?'Unmute video':'Mute video');};
$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if(document.querySelector('.screen').requestFullscreen)await document.querySelector('.screen').requestFullscreen();else if(video.webkitEnterFullscreen)video.webkitEnterFullscreen();else $('status').textContent='Fullscreen is not supported in this browser.';}catch{$('status').textContent='Fullscreen is not available. You can continue watching here.';}};

$('retry').onclick=()=>{$('empty').hidden=true;video.hidden=false;video.load();};
video.src='assets/overview.mp4';video.load();
