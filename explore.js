// Interface-only disclosure. Scene, audio and camera code stay untouched.
const header=document.querySelector('header'),story=document.getElementById('story');
const trigger=document.createElement('button');trigger.id='explore-controls';trigger.textContent='Explore';trigger.type='button';trigger.setAttribute('aria-haspopup','dialog');trigger.setAttribute('aria-controls','explore-panel');trigger.setAttribute('aria-expanded','false');header.append(trigger);
const drawer=document.createElement('dialog');drawer.id='explore-panel';drawer.setAttribute('aria-labelledby','explore-title');drawer.innerHTML='<div class="explore-heading"><h2 id="explore-title">Field notes</h2><button id="close-explore" type="button">Done</button></div>';
function section(title,...nodes){const group=document.createElement('section'),h=document.createElement('h3');h.textContent=title;group.append(h,...nodes.filter(Boolean));drawer.append(group)}
const label=document.querySelector('label:has(#chapter)'),select=document.getElementById('chapter');
label.classList.add('chapter-source');select.tabIndex=-1;select.setAttribute('aria-hidden','true');
const tokens=document.createElement('div');tokens.className='place-tokens';tokens.setAttribute('role','radiogroup');tokens.setAttribute('aria-label',select.getAttribute('aria-label'));
for(const option of select.options){const b=document.createElement('button');b.className='place-token';b.type='button';b.textContent=option.text.split(',')[0];b.dataset.value=option.value;b.setAttribute('role','radio');b.addEventListener('click',()=>{select.value=option.value;select.dispatchEvent(new Event('change',{bubbles:true}));sync()});b.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight'].includes(e.key))return;e.preventDefault();const buttons=[...tokens.children],i=buttons.indexOf(b),n=buttons[(i+(e.key==='ArrowRight'?1:buttons.length-1))%buttons.length];n.click();n.focus()});tokens.append(b)}
function sync(){for(const b of tokens.children){const on=b.dataset.value===select.value;b.setAttribute('aria-checked',String(on));b.tabIndex=on?0:-1}}sync();select.addEventListener('change',sync);new MutationObserver(sync).observe(document.getElementById('position'),{childList:true,subtree:true,characterData:true});
section('Places',tokens,label,document.querySelector('.scene-nav'));
section('View & sound',document.querySelector('nav'),document.querySelector('.world-note'));
section('Guide',document.querySelector('.story-actions'),document.querySelector('.disclaimer'));
document.body.append(drawer);
trigger.addEventListener('click',()=>{drawer.showModal();trigger.setAttribute('aria-expanded','true');document.getElementById('close-explore').focus()});document.getElementById('close-explore').addEventListener('click',()=>drawer.close());
drawer.addEventListener('close',()=>{trigger.setAttribute('aria-expanded','false');if(!document.getElementById('panel').open)trigger.focus()});
document.getElementById('guide').addEventListener('click',()=>drawer.close(),true);
// The original story dialog restores its trigger, which now lives in this drawer.
// Send focus to the disclosure if that trigger is hidden when the story closes.
document.getElementById('panel').addEventListener('close',()=>{if(!document.activeElement?.checkVisibility()||document.activeElement===document.body)trigger.focus()});
let previous=0;new ResizeObserver(()=>{const height=Math.ceil(story.getBoundingClientRect().height);if(height===previous)return;previous=height;document.documentElement.style.setProperty('--story-height',height+'px');window.dispatchEvent(new Event('resize'))}).observe(story);
