/*
 * app.js = the only geometry and physical-scale controller.
 * Read: PRESETS → updateGeometry() → layoutDoor() → clientToWindow().
 * No Citroën image, no duplicate experimentWindow, no second coordinate system.
 */
(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  const PRESETS=Object.freeze({
    small:{w:625,h:475},
    median:{w:684,h:494},
    large:{w:700,h:550},
    dloPilot:{w:700,h:450},
    suvUpperPilot:{w:750,h:450}
  });
  const g={
    windowW:750,windowH:450, doorW:910,doorH:1150,
    windowX:70,windowY:70,screenPpm:1,
    doorLeftPx:0,doorTopPx:0,screenWidthMm:1895,
    scalePercent:100,windowBottomMm:630,windowCenterMm:947.5,
    tiltDeg:4, path:null,outerPath:null
  };
  let sceneURL=null;
  let diagnosticEnabled=false;
  const diagnosticRows=[];
  const hitCtx=document.createElement('canvas').getContext('2d');
  const doorGroup=$('doorGroup');
  const stage=$('stage');
  const currentWindowPath=$('windowClipPath');
  const windowOutline=$('windowOutlineVisible');
  const windowTrim=$('windowTrimOuter');
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const num=(id,d)=>{const str=$(id).value;const v=Number(str);return str.trim()&&Number.isFinite(v)?v:d;};
  const fmt=v=>Number.isFinite(v)?Number(v).toFixed(3):'';

const WINDOW_CORNER_RADIUS_MM = 15;

// 生成圆角矩形路径
function roundedRectPath(x, y, w, h, r) {
  return `
    M ${x + r} ${y}
    H ${x + w - r}
    Q ${x + w} ${y} ${x + w} ${y + r}
    V ${y + h - r}
    Q ${x + w} ${y + h} ${x + w - r} ${y + h}
    H ${x + r}
    Q ${x} ${y + h} ${x} ${y + h - r}
    V ${y + r}
    Q ${x} ${y} ${x + r} ${y}
    Z
  `;
}

function makePath() {
  return roundedRectPath(
    g.windowX,
    g.windowY,
    g.windowW,
    g.windowH,
    WINDOW_CORNER_RADIUS_MM
  );
}

  function updateGeometry(){
    window.SPATIAL?.stopIfRunning('geometry_changed');
    g.windowW=clamp(num('windowWidthMm',750),400,900);
    g.windowH=clamp(num('windowHeightMm',450),300,650);
    g.doorW=g.windowW+160;
    g.doorH=g.windowH+700;
    const p=makePath();
    currentWindowPath.setAttribute('d',p);
    windowOutline.setAttribute('d',p);
    g.path=new Path2D(p);
    const wx=g.windowX,wy=g.windowY,ww=g.windowW,wh=g.windowH,dw=g.doorW,dh=g.doorH;
    const outer=`M28 30 Q35 23 55 23 L${dw-61} 23 Q${dw-24} 27 ${dw-18} 64 L${dw-18} ${dh-78} Q${dw-19} ${dh-22} ${dw-63} ${dh-12} L155 ${dh-12} Q107 ${dh-12} 74 ${dh-50} L25 ${dh-118} L20 96 Q18 42 28 30 Z`;
    g.outerPath=new Path2D(outer);
    $('doorOutline').setAttribute('d',outer);
    
    windowTrim.setAttribute(
      'd',
      roundedRectPath(
        wx - 12,
        wy - 12,
        ww + 24,
        wh + 24,
        WINDOW_CORNER_RADIUS_MM + 12
      )
    );

    // The same physical (mm) drawing coordinates drive SVG, clips and hit testing.
    $('doorSvg').setAttribute('viewBox',`0 0 ${dw} ${dh}`);
    $('doorSvg').querySelectorAll('#darkGlass, #scenePhoto').forEach(el=>{
      el.setAttribute('width',dw);el.setAttribute('height',dh);
    });
    $('demoScene').querySelector('rect').setAttribute('width',dw);
    $('beltLine').setAttribute('d',`M45 ${wy+wh+48} L${dw-42} ${wy+wh+48}`);
    $('panelSeam').setAttribute('d',`M82 ${wy+wh+100} Q${dw/2} ${wy+wh+82} ${dw-75} ${wy+wh+103}`);
    $('armrest').setAttribute('d',`M120 ${wy+wh+146} Q140 ${wy+wh+128} 186 ${wy+wh+128} H${dw-310} Q${dw-281} ${wy+wh+130} ${dw-276} ${wy+wh+154} V${wy+wh+230} Q${dw-278} ${wy+wh+252} ${dw-315} ${wy+wh+255} H145 Q118 ${wy+wh+251} 120 ${wy+wh+218} Z`);
    $('armrestGrip').setAttribute('d',`M175 ${wy+wh+181} H${dw-370} Q${dw-348} ${wy+wh+182} ${dw-348} ${wy+wh+200} Q${dw-350} ${wy+wh+219} ${dw-382} ${wy+wh+220} H196 Q170 ${wy+wh+219} 170 ${wy+wh+201} Z`);
    $('doorHandle').setAttribute('x',dw-214);$('doorHandle').setAttribute('y',wy+wh+151);
    $('handleGrip').setAttribute('x',dw-168);$('handleGrip').setAttribute('y',wy+wh+160);
    $('speaker').setAttribute('d',`M124 ${wy+wh+308} Q138 ${wy+wh+278} 177 ${wy+wh+278} H323 Q352 ${wy+wh+279} 366 ${wy+wh+313} L375 ${dh-48} H158 Q128 ${dh-51} 124 ${dh-88} Z`);
    $('speakerInset').setAttribute('d',`M157 ${wy+wh+341} L320 ${wy+wh+341}`);
    $('lowerPocket').setAttribute('d',`M400 ${wy+wh+320} Q650 ${wy+wh+300} ${dw-90} ${wy+wh+326} L${dw-85} ${dh-47} Q625 ${dh-25} 430 ${dh-47} Z`);
    layoutDoor();
  }
  function layoutDoor(){
    window.SPATIAL?.stopIfRunning('calibration_or_layout_changed');
    g.screenWidthMm=clamp(num('screenWidthMm',1895),100,10000);
    g.scalePercent=clamp(num('scalePercent',100),40,180);
    g.windowCenterMm=num('windowCenterScreenMm',947.5);
    g.windowBottomMm=num('windowBottomScreenMm',630);
    g.tiltDeg=clamp(num('inclinationDeg',4),0,30);
    g.screenPpm=window.innerWidth/g.screenWidthMm*g.scalePercent/100;
    // Window centre and bottom edge are fixed screen coordinates across sizes.
    const leftMm=g.windowCenterMm-(g.windowX+g.windowW/2);
    const topMm=g.windowBottomMm-(g.windowY+g.windowH);
    g.doorLeftPx=leftMm*g.screenPpm;
    g.doorTopPx=topMm*g.screenPpm;
    doorGroup.style.left=`${g.doorLeftPx}px`;
    doorGroup.style.top=`${g.doorTopPx}px`;
    doorGroup.style.width=`${g.doorW*g.screenPpm}px`;
    doorGroup.style.height=`${g.doorH*g.screenPpm}px`;
    $('ruler').style.width=`${100*g.screenPpm}px`;
    $('geometryReadoutValue').textContent=`${g.windowW.toFixed(0)} × ${g.windowH.toFixed(0)} mm`;
    const fix=$('fixationCross');fix.style.left=`${(g.windowX+g.windowW*0.5)*g.screenPpm}px`;fix.style.top=`${(g.windowY+g.windowH*0.5)*g.screenPpm}px`;
    document.dispatchEvent(new CustomEvent('window:geometry',{detail:getGeometry()}));
  }
  function getGeometry(){
    return {windowW:g.windowW,windowH:g.windowH,windowX:g.windowX,windowY:g.windowY,
      doorW:g.doorW,doorH:g.doorH,ppm:g.screenPpm,tiltDeg:g.tiltDeg,
      doorLeftPx:g.doorLeftPx,doorTopPx:g.doorTopPx,windowBottomMm:g.windowBottomMm,
      screenWidthMm:g.screenWidthMm,scalePercent:g.scalePercent,windowCenterMm:g.windowCenterMm};
  }
  function clientToWindow(clientX,clientY){
    const localX=(clientX-g.doorLeftPx)/g.screenPpm;
    const localY=(clientY-g.doorTopPx)/g.screenPpm;
    const insideWindow=hitCtx.isPointInPath(g.path,localX,localY);
    const onDoor=hitCtx.isPointInPath(g.outerPath,localX,localY);
    const windowX=localX-g.windowX,windowY=localY-g.windowY;
    return {screenX:clientX,screenY:clientY,doorX:localX,doorY:localY,
      windowX,windowY,windowNX:windowX/g.windowW,windowNY:windowY/g.windowH,
      zone:insideWindow?'window':onDoor?'door':'outside'};
  }
  function showDot(cx,cy,success){
    const marker=document.createElement('div');
    marker.className=`feedback-dot ${success?'hit':'miss'}`;
    marker.style.left=cx+'px';marker.style.top=cy+'px';
    const d=Math.max(6,g.screenPpm*6);
    marker.style.width=`${d}px`;marker.style.height=`${d}px`;
    $('feedbackLayer').appendChild(marker);
    setTimeout(()=>marker.remove(),420);
  }
  function csvExport(rows,prefix){
    if(!rows.length){alert('No data / 暂无数据');return;}
    const fields=[...new Set(rows.flatMap(o=>Object.keys(o)))];
    const esc=v=>'"'+String(v??'').replaceAll('"','""')+'"';
    const csv=[fields.join(','),...rows.map(row=>fields.map(f=>esc(row[f])).join(','))].join('\r\n');
    const url=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}));
    const a=document.createElement('a');a.href=url;a.download=prefix+'_'+new Date().toISOString().replace(/[:.]/g,'-')+'.csv';a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1800);
  }
  function setSceneMode(){
    const mode=$('sceneMode').value;
    $('demoScene').style.display=mode==='demo'?'':'none';
    $('scenePhoto').style.display=mode==='photo'?'':'none';
    $('darkGlass').setAttribute('fill',mode==='dark'?'#182a35':'#a8becb');
    $('demoScene').style.filter=`blur(${num('sceneBlur',3)}px)`;
    $('scenePhoto').style.filter=`blur(${num('sceneBlur',3)}px)`;
    $('scenePhoto').style.opacity=(clamp(num('sceneOpacity',100),10,100)/100).toFixed(2);
  }
  function loadPhoto(){
    const file=$('sceneFile').files?.[0]; if(!file||!file.type.startsWith('image/'))return;
    if(sceneURL)URL.revokeObjectURL(sceneURL);
    sceneURL=URL.createObjectURL(file);
    $('scenePhoto').setAttribute('href',sceneURL);
    $('sceneMode').value='photo';setSceneMode();
  }
  function setLanguage(lang){
    window.APP.language=lang;
    document.documentElement.lang=lang==='en'?'en':'zh-CN';
    const tr=window.TRANSLATIONS[lang];
    document.querySelectorAll('[data-i18n]').forEach(e=>{
      const key=e.dataset.i18n;
      if(tr[key])e.textContent=tr[key];
    });
    $('langZh').classList.toggle('active',lang==='zh');
    $('langEn').classList.toggle('active',lang==='en');
    try{localStorage.setItem('windowPilot_lang_v321',lang);}catch(e){}
  }
  function setPreset(){
    const p=PRESETS[$('windowPreset').value];
    if(p){$('windowWidthMm').value=p.w;$('windowHeightMm').value=p.h;}
    updateGeometry();
  }
  function geometryManual(){ $('windowPreset').value='custom';updateGeometry(); }
  function togglePanel(){
    const hidden=$('panel').hidden;
    $('panel').hidden=!hidden;
    $('showPanelBtn').hidden=hidden;
  }
  $('windowPreset').addEventListener('change',setPreset);
  ['windowWidthMm','windowHeightMm'].forEach(id=>$(id).addEventListener('change',geometryManual));
  ['screenWidthMm','scalePercent','windowCenterScreenMm','windowBottomScreenMm','inclinationDeg'].forEach(id=>$(id).addEventListener('change',layoutDoor));
  $('centerWindowBtn').onclick=()=>{$('windowCenterScreenMm').value=(num('screenWidthMm',1895)/2).toFixed(1);layoutDoor();};
  $('sceneMode').addEventListener('change',setSceneMode);
  $('sceneBlur').addEventListener('input',setSceneMode);
  $('sceneOpacity').addEventListener('input',setSceneMode);
  $('fixationEnabled').addEventListener('change',()=>{$('fixationCross').hidden=!$('fixationEnabled').checked;});
  $('sceneFile').addEventListener('change',loadPhoto);
  $('langZh').onclick=()=>setLanguage('zh');
  $('langEn').onclick=()=>setLanguage('en');
  $('hidePanelBtn').onclick=togglePanel;
  $('showPanelBtn').onclick=togglePanel;
  document.addEventListener('keydown',e=>{if(e.key.toLowerCase()==='h'&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName))togglePanel();});
  $('fullscreenBtn').onclick=async()=>{try{if(!document.fullscreenElement)await document.documentElement.requestFullscreen();else await document.exitFullscreen();}catch(err){alert(err.message);}};
  window.addEventListener('resize',layoutDoor);
  stage.addEventListener('pointerdown',e=>{
    if(!diagnosticEnabled||window.SPATIAL?.isRunning())return;
    const p=clientToWindow(e.clientX,e.clientY);
    const row={timestamp:new Date().toISOString(),pointer_type:e.pointerType,input_label:$('inputMode').value==='auto'?(e.pointerType||'unknown'):$('inputMode').value,zone:p.zone,screen_x_css_px:fmt(p.screenX),screen_y_css_px:fmt(p.screenY),window_x_mm:fmt(p.windowX),window_y_mm:fmt(p.windowY),window_x_norm:fmt(p.windowNX),window_y_norm:fmt(p.windowNY),...getGeometry()};
    diagnosticRows.push(row);
    $('touchStatus').textContent=`${p.zone} | (${fmt(p.windowX)}, ${fmt(p.windowY)}) mm\n(${fmt(p.screenX)}, ${fmt(p.screenY)}) CSS px | ${e.pointerType}`;
    showDot(e.clientX,e.clientY,p.zone==='window');
  },{passive:true});
  $('diagnosticsBtn').onclick=()=>{diagnosticEnabled=!diagnosticEnabled;$('diagnosticsBtn').textContent=diagnosticEnabled?'触摸诊断：开 / Diagnostic ON':'触摸诊断：关 / Diagnostic OFF';};
  $('diagnosticsCsvBtn').onclick=()=>csvExport(diagnosticRows,'window_diagnostics');
  window.addEventListener('pagehide',()=>{if(sceneURL)URL.revokeObjectURL(sceneURL);});
  window.APP={getGeometry,clientToWindow,showDot,csvExport,language:'zh',updateGeometry,layoutDoor};
  let preferredLang='zh';try{preferredLang=localStorage.getItem('windowPilot_lang_v321')==='en'?'en':'zh';}catch(e){}
  setPreset();setSceneMode();setLanguage(preferredLang);
})();
