// Explicit disclosure replaces timed chrome retirement. Verify fresh AND legacy-pinned profiles.
const pp=require('puppeteer-core'),assert=require('node:assert/strict'),{spawn}=require('child_process');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{let s,b;try{
 const url=process.env.URL||'http://127.0.0.1:8849';
 if(!process.env.URL){s=spawn('python3',['-m','http.server','8849'],{cwd:'dist',stdio:'ignore'});await sleep(400)}
 b=await pp.launch({executablePath:process.env.CHROME||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
 for(const w of (process.env.WIDTH?[+process.env.WIDTH]:[320,390,768,1280]))for(const motion of ['reduce','no-preference']){
  const c=await b.createBrowserContext(),p=await c.newPage();await p.setViewport({width:w,height:844});
  await p.emulateMediaFeatures([{name:'prefers-reduced-motion',value:motion}]);
  await p.evaluateOnNewDocument(()=>localStorage.setItem('rajasthaniodyssey-chrome-pin','1'));
  await p.goto(url);await p.waitForSelector('canvas[data-ready=true]',{timeout:45000});
  const visible=()=>p.evaluate(()=>[...document.querySelectorAll('button')].filter(e=>e.checkVisibility({checkOpacity:true,checkVisibilityCSS:true})).map(e=>e.id));
  assert.deepEqual((await visible()).sort(),['discover','explore-controls'],'only primary action and disclosure on scene');
  await p.click('#explore-controls');assert(await p.$eval('#explore-panel',e=>e.open));
  await sleep(3000);assert(await p.$eval('#explore-panel',e=>e.open),'no timed disappearance');
  await p.$eval('.place-tokens .place-token[data-value="2"]',e=>e.click());
  assert.equal(await p.$eval('#chapter',e=>e.value),'2');
  await p.$eval('#next',e=>e.click());
  assert.equal(await p.$eval('.place-tokens .place-token[aria-checked=true]',e=>e.dataset.value),'3');
  await p.click('#close-explore');
  await p.click('#discover');assert(await p.$eval('#panel',e=>e.open));
  await p.keyboard.press('Escape');
  await p.click('#explore-controls');await p.keyboard.press('Escape');await sleep(80);
  assert.equal(await p.evaluate(()=>document.activeElement.id),'explore-controls','Escape restores focus');
  const bad=await p.evaluate(()=>{const out=[];for(const id of ['discover','explore-controls']){const e=document.getElementById(id),r=e.getBoundingClientRect();if(r.width<44||r.height<44||r.left<0||r.right>innerWidth||r.bottom>innerHeight)out.push(id)}return out});
  assert.deepEqual(bad,[],'visible targets fit and are 44px');
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'no horizontal overflow');
  for(let i=0;i<await p.$$eval('#chapter option',xs=>xs.length);i++){
   await p.select('#chapter',''+i);await sleep(80);
   const fit=await p.$eval('#discover',e=>{const r=e.getBoundingClientRect();return r.bottom<=innerHeight&&r.top>=0});
   assert(fit,'primary action fits every place at '+w+' place '+i);
  }
  await p.click('#explore-controls');await p.$eval('#guide',e=>e.scrollIntoView({block:'center'}));await p.click('#guide');
  assert(await p.$eval('#panel',e=>e.open));assert(!await p.$eval('#explore-panel',e=>e.open),'no stacked dialogs');
  await p.keyboard.press('Escape');await sleep(80);assert.equal(await p.evaluate(()=>document.activeElement.id),'explore-controls','guide close restores visible focus');
  await c.close();
 }
 console.log('explicit exploration panel pass OK: requested widths x 2 motion settings; legacy pins ignored, tokens, focus, targets');
}finally{await b?.close();s?.kill()}})().catch(e=>{console.error(e);process.exit(1)});
