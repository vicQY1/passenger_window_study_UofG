/*
 * experiment.js (Spatial Target Pilot)
 * Read: makeTargets() → makeSequence() → presentNext() → onTouch() → finishTrial().
 * Fixed 4 × 3 coordinates; only their sequence changes pseudorandomly.
 */
(()=>{
 'use strict';
 const $=id=>document.getElementById(id);
 const stage = $('stage'),
      cross = $('targetCross'),
      home = $('homeTarget'),
      preview = $('previewLayer');

 const S={phase:'idle',targets:[],order:[],index:-1,active:null,trialStartMs:0,trialOnsetISO:'',
   timeoutId:null,nextId:null,trialRows:[],touchRows:[],previewOn:false,firstTouch:null,missCount:0,
   seed:'',runningConfig:null,abortReason:'', homeStartMs: 0 ,lastTarget:null};
 const n=(id,d)=>{const a=Number($(id).value);return Number.isFinite(a)&&$(id).value.trim()?a:d;};
 const f=x=>Number.isFinite(x)?Number(x).toFixed(3):'';
 const text=(zh,en)=>window.APP.language==='en'?en:zh;


 function getConfig(){
   return {layout:$('gridLayout').value,repetitions:Math.max(1,Math.min(5,Math.floor(n('repetitions',2)))),
     targetSize:n('targetSizeMm',30),hitRadius:n('hitRadiusMm',50),
     timeout:n('timeoutMs',5000),iti:n('itiMs',400),seed:$('sequenceSeed').value.trim()||'pilot-001',
     participant:$('participantId').value.trim()||'anonymous',session:$('sessionId').value.trim()||'S01',
     hand:$('interactionHand').value,dominance:$('handDominance').value,windowSide:'left', 
     returnHome: $('returnToCenter').checked,
        strictHitRadius: $('strictHitRadius').checked};
 }
 
 
function makeTargets(config) {
    const layouts={
      '4x3_200': {cols:4, rows:3, step:200, skipCenter:false},
      '5x3_150': {cols:5, rows:3, step:150, skipCenter:true},
      '5x3_170': {cols: 5, rows: 3, step: 170, skipCenter: true},
      '8x5_100': {cols:8, rows:5, step:100, skipCenter:false}
    };
    const spec=layouts[config.layout];
    if(!spec)throw new Error('Unknown grid layout: '+config.layout);
    const {cols,rows,step,skipCenter}=spec;
    const g=window.APP.getGeometry();
    const spanX=(cols-1)*step,spanY=(rows-1)*step;
    const minEdge=Math.max(20,config.hitRadius+5);
    if(g.windowW<spanX+2*minEdge||g.windowH<spanY+2*minEdge){
      throw new Error(`Window too small for ${cols}x${rows} at ${step} mm with ${minEdge} mm edge clearance.`);
    }
    const x0=(g.windowW-spanX)/2,y0=(g.windowH-spanY)/2;
    const points=[];
    for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
      // Reserve (375,225) mm as home. It cannot be a zero-distance acquisition target.
      if(skipCenter && row===1 && col===2)continue;
      points.push({id:`R${row+1}C${col+1}`,row:row+1,column:col+1,
        xn:(x0+col*step)/g.windowW,yn:(y0+row*step)/g.windowH});
    }
    return points;
  }

 function seededGenerator(seedString){
   // Deterministic 32-bit FNV-like mixing followed by xorshift32.
   let state=2166136261;
   for(let i=0;i<seedString.length;i++){
     state=Math.imul(state^seedString.charCodeAt(i),16777619)>>>0;
   }
   if(state===0)state=1;
   return ()=>{state^=state<<13;state^=state>>>17;state^=state<<5;return (state>>>0)/4294967296;};
 }
 function shuffled(items,rnd){
   const a=[...items];
   for(let i=a.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
   return a;
 }
 function neighbor(a,b){return !!a&&!!b&&(a.id===b.id||Math.abs(a.row-b.row)+Math.abs(a.column-b.column)===1);}
 function makeSequence(targets,cfg){
   const random=seededGenerator(cfg.seed+'|'+cfg.layout+'|'+cfg.repetitions);
   const seq=[];
   for(let repeat=1;repeat<=cfg.repetitions;repeat++){
     let found=null;
     for(let attempt=0;attempt<5000;attempt++){
       const sample=shuffled(targets,random);
       if(seq.length&&neighbor(seq[seq.length-1],sample[0]))continue;
       if(sample.some((item,i)=>i>0&&neighbor(sample[i-1],item)))continue;
       found=sample;break;
     }
     if(!found)throw new Error('Could not construct balanced constrained sequence.');
     seq.push(...found.map(t=>({...t,repetition:repeat})));
   }
   return seq;
 }
 function pointCoords(target){
   const g=window.APP.getGeometry();
   return {x:g.windowW*target.xn,y:g.windowH*target.yn,
     doorX:g.windowX+g.windowW*target.xn,doorY:g.windowY+g.windowH*target.yn};
 }
 

function sizeCross() {
  const g = window.APP.getGeometry();
  const cfg = S.runningConfig || getConfig();

  const size = cfg.targetSize * g.ppm;
  const stroke = Math.max(2, 2.5 * g.ppm);

  // 两个十字使用相同的物理尺寸
  [cross, home].forEach(el => {
    el.style.width = size + 'px';
    el.style.height = size + 'px';
    el.style.setProperty('--stroke', stroke + 'px');
  });
}



 function updateCross(){
   if(!S.active)return;
   const p=pointCoords(S.active),ppm=window.APP.getGeometry().ppm;
   cross.style.left=p.doorX*ppm+'px';cross.style.top=p.doorY*ppm+'px';
 }
 function showPreview(){
   preview.innerHTML='';
   if(!S.previewOn)return;
   const g=window.APP.getGeometry();
       let arr;

    try {
      arr = makeTargets(getConfig());
    } catch (err) {
      message(err.message);
      return;
    }

   arr.forEach(p=>{
     const xy=pointCoords(p),el=document.createElement('span');
     el.className='previewTarget';
     el.style.left=xy.doorX*g.ppm+'px';el.style.top=xy.doorY*g.ppm+'px';
     const label=document.createElement('small');label.textContent=p.id;
     el.textContent='+';el.appendChild(label);preview.appendChild(el);
   });
 }
 function message(s){$('spatialStatus').textContent=s;}
 function setStatus(){
   const c=S.runningConfig||getConfig();
   const total=S.order.length;
   message(`${text('状态','State')}: ${S.phase}\n${text('当前试次','Trial')}: ${S.index>=0?S.index+1:0}/${total}\n${text('已记录试次','Recorded trials')}: ${S.trialRows.length} | ${text('点击事件','Touch events')}: ${S.touchRows.length}\n${text('条件','Condition')}: LEFT WINDOW / ${c.hand.toUpperCase()} HAND`);
 }
 function saveCheckpoint(){
   try{localStorage.setItem('windowStudy_v321_checkpoint',JSON.stringify({
     version:'3.2.1',savedAt:new Date().toISOString(),seed:S.seed,
     trialRows:S.trialRows,touchRows:S.touchRows}));}catch(e){console.warn('Checkpoint storage unavailable',e);}
 }
 function start(){
   if(['target', 'iti', 'home'].includes(S.phase))return;
   window.VIDEO?.stopVideo();
   $('fixationCross').hidden=true;
   S.runningConfig=getConfig();
   try{S.targets=makeTargets(S.runningConfig);S.order=makeSequence(S.targets,S.runningConfig);}
   catch(err){message('Sequence error: '+err.message);return;}
   S.seed=S.runningConfig.seed;
   S.trialRows=[];S.touchRows=[];S.index=-1;S.active=null;S.phase='iti';
   S.lastTarget=null;
   S.previewOn = false;
    showPreview();

    cross.hidden = true;
    home.hidden = true;

    saveCheckpoint();

    if (S.runningConfig.returnHome) {
      showHome();
    } else {
      presentNext();
    }
 }
 function stopIfRunning(reason='manual_stop'){
   if(!['target', 'iti', 'home'].includes(S.phase))return;
   clearTimeout(S.timeoutId);clearTimeout(S.nextId);
   if(S.phase==='target'&&S.active)finishTrial('interrupted',reason);
   S.phase='stopped';S.active=null;cross.hidden=true;saveCheckpoint();setStatus();home.hidden = true;
 }

 
function showHome() {
  const g = window.APP.getGeometry();

  sizeCross();

  clearTimeout(S.timeoutId);
  clearTimeout(S.nextId);

  S.active = null;
  S.phase = 'home';

  cross.hidden = true;

  // 返回点固定在车窗中心
  home.style.left =
    (g.windowX + g.windowW / 2) * g.ppm + 'px';

  home.style.top =
    (g.windowY + g.windowH / 2) * g.ppm + 'px';

  home.hidden = false;
  S.homeStartMs = performance.now();

  setStatus();
}


 
function completeTask() {
  // 清除尚未执行的计时器
  clearTimeout(S.timeoutId);
  clearTimeout(S.nextId);

  S.timeoutId = null;
  S.nextId = null;

  // 正式结束实验
  S.phase = 'complete';
  S.active = null;

  // 隐藏目标和中心返回点
  cross.hidden = true;
  home.hidden = true;

  // 保存当前数据
  saveCheckpoint();

  // 显示完成信息
  const total = S.order.length;
  const recorded = S.trialRows.length;

  message(
    `${text('实验完成', 'Experiment complete')}\n` +
    `${recorded} / ${total} trials\n` +
    text(
      '请导出试次 CSV 和点击 CSV。',
      'Please export the trial and touch CSV files.'
    )
  );
}

 
function presentNext() {

  // 只允许在目标间隔阶段进入下一试次
  if (S.phase !== 'iti') return;

  clearTimeout(S.timeoutId);
  clearTimeout(S.nextId);

  // 进入下一个目标
  S.index++;

  // 防止超出计划试次数
  if (S.index >= S.order.length) {
    S.phase = 'complete';
    S.active = null;

    cross.hidden = true;
    home.hidden = true;

    saveCheckpoint();
    setStatus();
    return;
  }

  // 读取当前目标并清空上一试次的状态
  S.active = S.order[S.index];
  S.firstTouch = null;
  S.missCount = 0;
  S.trialStartMs = 0;

  // 隐藏 Home，显示目标十字
  S.phase = 'target';
  home.hidden = true;

  sizeCross();
  updateCross();
  cross.hidden = false;

  // 记录目标呈现时间
  requestAnimationFrame(() => {
    if (S.phase !== 'target') return;

    S.trialStartMs = performance.now();
    S.trialOnsetISO = new Date().toISOString();

    S.timeoutId = setTimeout(
      () => finishTrial('timeout'),
      S.runningConfig.timeout
    );

    setStatus();
  });
}




 function finishTrial(result,reason='',hitPoint=null){
   if(S.phase!=='target'||!S.active)return;
   clearTimeout(S.timeoutId);
   const cfg=S.runningConfig,g=window.APP.getGeometry(),t=S.active;
   const target=pointCoords(t);
   S.lastTarget=t;

   const d=hitPoint?Math.hypot(hitPoint.windowX-target.x,hitPoint.windowY-target.y):NaN;
   const elapsed=hitPoint?hitPoint.touchMs-S.trialStartMs:NaN;
   S.trialRows.push({
     participant_id:cfg.participant,session_id:cfg.session,window_side:cfg.windowSide,
     hand:cfg.hand,hand_dominance:cfg.dominance,seed:cfg.seed,
     window_width_mm:g.windowW,window_height_mm:g.windowH,window_tilt_deg:g.tiltDeg,
     target_layout:cfg.layout,grid_spacing_mm:
        cfg.layout === '5x3_170' ? 170 :
        cfg.layout==='5x3_150'?150:
        cfg.layout==='8x5_100'?100:200,trial_index:S.index+1,target_id:t.id,row:t.row,column:t.column,
     repetition:t.repetition,target_x_mm:f(target.x),target_y_mm:f(target.y),
     target_x_norm:f(t.xn),target_y_norm:f(t.yn),
     onset_iso:S.trialOnsetISO,first_touch_latency_ms:S.firstTouch?f(S.firstTouch.touchMs-S.trialStartMs):'',
     first_touch_x_mm:S.firstTouch?f(S.firstTouch.windowX):'',
     first_touch_y_mm:S.firstTouch?f(S.firstTouch.windowY):'',
     first_touch_error_mm:S.firstTouch?f(Math.hypot(S.firstTouch.windowX-target.x,S.firstTouch.windowY-target.y)):'',
     hit_time_ms:f(elapsed),hit_x_mm:hitPoint?f(hitPoint.windowX):'',
     hit_y_mm:hitPoint?f(hitPoint.windowY):'',hit_error_mm:f(d),
     miss_count:S.missCount,result,reason,
     target_hit_radius_mm:cfg.hitRadius,target_visual_width_mm:cfg.targetSize,
     timeout_limit_ms:cfg.timeout,iti_ms:cfg.iti,
     screen_width_mm:g.screenWidthMm,calibration_scale_percent:g.scalePercent,
     window_bottom_screen_mm:g.windowBottomMm,window_center_screen_mm:g.windowCenterMm,
     completed_iso:new Date().toISOString(),
     hit_test_mode:
       cfg.strictHitRadius ? 'radius' : 'whole_window',

     accepted_touch_within_radius:
       hitPoint ? d <= cfg.hitRadius : '',
   });


   saveCheckpoint();

      S.active = null;
      S.phase = 'iti';
      cross.hidden = true;

      // 手动中止时，不继续安排目标
      if (result === 'interrupted') {
        setStatus();
        return;
      }

      // 判断刚完成的是否为最后一个目标
      if (S.index + 1 >= S.order.length) {
        completeTask();
        return;
      }

      // 还有目标时，才进入下一轮
      if (cfg.returnHome) {
        showHome();
      } else {
        setStatus();
        S.nextId = setTimeout(presentNext, cfg.iti);
      }
   
   }


 
function onHomeTouch(e) {
  e.preventDefault();

  const cfg = S.runningConfig;
  if (!cfg) return;

  const g = window.APP.getGeometry();
  const p = window.APP.clientToWindow(
    e.clientX, e.clientY
  );

  const time = performance.now();

  const error = Math.hypot(
    p.windowX - g.windowW / 2,
    p.windowY - g.windowH / 2
  );

  // 中心返回区半径为25 mm
  const hit = p.zone === 'window' && error <= 25;
  const gridSpacingMm = 
    cfg.layout === '5x3_170' ? 170 :
    cfg.layout === '5x3_150' ? 150 :
    cfg.layout === '8x5_100' ? 100 : 200;

  let homeToTarget = '';
  if (S.lastTarget) {
    const t = pointCoords(S.lastTarget);
    homeToTarget = f(
      Math.hypot(t.x - g.windowW / 2, t.y - g.windowH / 2)
    );
  }


   S.touchRows.push({
    participant_id: cfg.participant,
    session_id: cfg.session,
    window_side: 'left',
    hand: cfg.hand,
    event_type: 'home_touch',
    trial_index: S.index + 1,
    target_id: 'HOME',
    timestamp_iso: new Date().toISOString(),
    window_x_mm: f(p.windowX),
    window_y_mm: f(p.windowY),
    error_mm: f(error),
    hit,
    pointer_type: e.pointerType || 'unknown',
    grid_spacing_mm: gridSpacingMm,
    home_required: cfg.returnHome,
    home_to_target_distance_mm: homeToTarget,
  });

  // 按“是否在车窗内”着色：窗内绿、窗外红
  window.APP.showDot(e.clientX, e.clientY, hit);

  if (!hit) {
    saveCheckpoint();
    setStatus();
    return;
  }

  // 记录“返回中心”的耗时到上一目标行
  if (S.index >= 0 && S.trialRows.length) {
    const last = S.trialRows[S.trialRows.length - 1];
    last.return_to_home_ms = f(time - S.homeStartMs);
    last.home_returned_iso = new Date().toISOString();
  }

  home.hidden = true;
  S.phase = 'iti';
  saveCheckpoint();
  setStatus();

  S.nextId = setTimeout(presentNext, S.runningConfig.iti);
}



 function onTouch(e){
   if (S.phase === 'home') {
      onHomeTouch(e);
      return;
      }
   if(S.phase!=='target'||!S.active)return;
   e.preventDefault();
   // Ignore target only before the first drawn frame is timestamped.
   if(!S.trialStartMs)return;
   const cfg=S.runningConfig,g=window.APP.getGeometry(),p=window.APP.clientToWindow(e.clientX,e.clientY);
   const t=S.active,target=pointCoords(t),err=Math.hypot(p.windowX-target.x,p.windowY-target.y);
   const touchMs=performance.now();
   
   const insideWindow = p.zone === 'window';
   const withinRadius = err <= cfg.hitRadius;
    // 严格模式：必须在目标半径内
    // 宽松模式：车窗内任意位置都接受
   const hit = insideWindow && (
      !cfg.strictHitRadius || withinRadius
    );

   if(!S.firstTouch)S.firstTouch={...p,touchMs};
   if(!hit)S.missCount++;
   const row={participant_id:cfg.participant,session_id:cfg.session,window_side:'left',
     hand:cfg.hand,seed:cfg.seed,trial_index:S.index+1,target_id:t.id,
     timestamp_iso:new Date().toISOString(),performance_ms:f(touchMs),
     latency_from_target_ms:f(touchMs-S.trialStartMs),pointer_type:e.pointerType||'unknown',
     input_label:$('inputMode').value==='auto'?(e.pointerType||'unknown'):$('inputMode').value,
     zone:p.zone,screen_x_css_px:f(p.screenX),screen_y_css_px:f(p.screenY),
     window_x_mm:f(p.windowX),window_y_mm:f(p.windowY),
     target_x_mm:f(target.x),target_y_mm:f(target.y),error_mm:f(err),hit,
     window_width_mm:g.windowW,window_height_mm:g.windowH,
     outside_window:p.zone!=='window',error_within_hit_radius:err<=cfg.hitRadius,
     event_type:'target_touch', 
     hit_test_mode:
        cfg.strictHitRadius ? 'radius' : 'whole_window',
     within_target_radius: withinRadius,};

   S.touchRows.push(row);window.APP.showDot(e.clientX,e.clientY,hit);
   if(hit)finishTrial('hit','', {...p,touchMs});else{saveCheckpoint();setStatus();}
 }
 $('startSpatialBtn').addEventListener('click',start);
 $('stopSpatialBtn').addEventListener('click',()=>stopIfRunning());
 $('previewBtn').addEventListener('click',()=>{
   if(['target', 'iti', 'home'].includes(S.phase))return;
   S.previewOn=!S.previewOn;showPreview();
   $('previewBtn').textContent=S.previewOn?text('隐藏点位预览','Hide target preview'):text('显示点位预览','Show target preview');
 });
 $('trialsCsvBtn').addEventListener('click',()=>window.APP.csvExport(S.trialRows,'window_trials'));
 $('eventsCsvBtn').addEventListener('click',()=>window.APP.csvExport(S.touchRows,'window_touches'));
 $('gridLayout').addEventListener('change',()=>{
   if(window.SPATIAL?.isRunning()) window.SPATIAL.stopIfRunning('grid_layout_changed');
   showPreview();
 });

 
$('strictHitRadius').addEventListener('change', () => {
  if (['target', 'home', 'iti'].includes(S.phase)) {
    $('strictHitRadius').checked =
      S.runningConfig.strictHitRadius;

    message(text(
      '请结束当前实验后再切换命中模式。',
      'Change the hit-test mode between blocks only.'
    ));
  }
});

 document.addEventListener('window:geometry',()=>{
   if(['target', 'iti', 'home'].includes(S.phase)){
     // Geometry must remain frozen within a task. Stop rather than silently moving targets.
     stopIfRunning('geometry_changed');
   }
   sizeCross();showPreview();
 });

 
function updatePointerMode(e) {
  if (e.pointerType === 'touch') {
    stage.classList.add('touch-input');
  } else if (e.pointerType === 'mouse') {
    stage.classList.remove('touch-input');
  }
}

// 鼠标移动或手指触摸时，自动切换显示方式
stage.addEventListener('pointermove', updatePointerMode);
stage.addEventListener('pointerdown', updatePointerMode);


 stage.addEventListener('pointerdown',onTouch,{passive:false});
 window.SPATIAL={isRunning:()=>['target', 'iti', 'home'].includes(S.phase),stopIfRunning,getState:()=>S.phase};
 setStatus();
})();
