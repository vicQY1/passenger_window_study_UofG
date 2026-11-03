/*
 * VIDEO PILOT v3.2.2
 * One local film file. Select a region (front / middle / rear) AND a film segment (A / B / C).
 * The video playback clock is capped at a configured duration (default 300 s per segment).
 * The same segment can be assigned to any region; the pairing must be counterbalanced by the researcher.
 * Native video.currentTime tracks media time, not a separately running setTimeout.
 */
(()=>{
  'use strict';
  const $=id=>document.getElementById(id);
  const video=$('windowVideo'),overlay=$('videoObject');
  const regionSelect=$('videoRegion'),segmentSelect=$('videoSegment');
  const durationInput=$('videoLimitSeconds'),progress=$('videoProgress'),status=$('videoStatus');
  const soundToggle=$('videoSound');
  
  let videoURL=null,filename='',events=[],block=null,completed=false,frameId=null;
  let clipNumber=0; // Number of recorded segment completions; for pilot diagnostics only.
  const lang=(zh,en)=>window.APP.language==='en'?en:zh;
  const f=n=>Number.isFinite(Number(n))?Number(n).toFixed(3):'';
  const durationSeconds=()=>Math.max(1,Math.min(600,Math.floor(Number(durationInput.value)||300)));
  const segmentIdx=()=>Math.max(0,Math.min(2,Number(segmentSelect.value)||0));
  const clipStart=()=>durationSeconds()*segmentIdx();
  const clipEnd=()=>clipStart()+durationSeconds();
  const mmss=s=>{const n=Math.max(0,Math.floor(s));return String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0');};
  const changeControlsDisabled=disabled=>{[regionSelect,segmentSelect,durationInput].forEach(el=>el.disabled=disabled);};
  
function placement() {
  const g = window.APP.getGeometry();

  const column = {
    rear: 0,
    middle: 1,
    front: 2
  }[regionSelect.value];

  const w = g.windowW / 3;
  const h = w * 9 / 16;

  const x = g.windowX + column * w;
  const y = g.windowY + (g.windowH - h) / 2;

  return { x, y, w, h };
}


  function relayout(){
    const p=placement(),{ppm}=window.APP.getGeometry();
    // Native HTML layer: same local door millimetres, converted to CSS pixels.
    overlay.style.left=(p.x*ppm)+'px';
    overlay.style.top=(p.y*ppm)+'px';
    overlay.style.width=(p.w*ppm)+'px';
    overlay.style.height=(p.h*ppm)+'px';
  }
  function writeEvent(type,note='',extra={}){
    const g=window.APP.getGeometry(),p=placement();
    const start=block?block.start:clipStart(),end=block?block.end:clipEnd();
    events.push({
      timestamp_iso:new Date().toISOString(),performance_ms:f(performance.now()),type,
      participant_id:$('participantId').value.trim(),session_id:$('sessionId').value.trim(),
      filename,region:block?.region||regionSelect.value,segment:block?.segment??segmentIdx(),
      clip_start_s:start,clip_end_s:end,clip_duration_s:end-start,
      video_current_time_s:f(video.currentTime||0),video_total_duration_s:f(video.duration),
      video_progress_s:f(Math.max(0,(video.currentTime||0)-start)),
      completed_full_segment:completed,
      window_width_mm:g.windowW,window_height_mm:g.windowH,window_inclination_deg:g.tiltDeg,
      video_x_mm:f(p.x-g.windowX),video_y_mm:f(p.y-g.windowY),
      video_width_mm:p.w,video_height_mm:p.h,audio_enabled:!video.muted,
      note,...extra
    });
  }
  function setStatus(zh,en){status.textContent=lang(zh,en);}
  function updateProgress(){
    const start=block?block.start:clipStart(),end=block?block.end:clipEnd();
    const elapsed=completed?(end-start):Math.max(0,Math.min(end-start,(video.currentTime||0)-start));
    progress.textContent=`${mmss(elapsed)} / ${mmss(end-start)}`;
  }
  function releaseFrame(){if(frameId!==null)cancelAnimationFrame(frameId);frameId=null;}
  function finishAtLimit(){
    if(!block||completed)return;
    completed=true;
    video.pause();
    releaseFrame();
    writeEvent('segment_limit_reached','Automatic pause at segment media-time limit');
    clipNumber++;
    updateProgress();
    setStatus(`已自动暂停：${block.region} · 片段 ${'ABC'[block.segment]}，完成 ${mmss(block.end-block.start)}。请在 Qualtrics 完成问卷。`,
      `Auto-paused: ${block.region}, segment ${'ABC'[block.segment]}. Completed ${mmss(block.end-block.start)}. Complete the questionnaire in Qualtrics.`);
  }
  function checkBoundary(){
    updateProgress();
    if(block&&!completed&&!video.paused&&video.currentTime>=block.end-0.035)finishAtLimit();
  }
  function videoFrame(){
    frameId=null;
    if(!video.paused){checkBoundary();if(!video.paused)frameId=requestAnimationFrame(videoFrame);}
  }
  function videoPause(){video.pause();releaseFrame();changeControlsDisabled(false);}
  function stopVideo(hide=true){
    videoPause();
    if(block&&!completed)writeEvent('segment_interrupted','Manually stopped before segment completion');
    block=null;completed=false;
    if(hide){overlay.hidden=true;}
    if(video.readyState>=1)try{video.currentTime=clipStart();}catch(e){}
    updateProgress();
  }
  function loadedMetadata(){
    if(!Number.isFinite(video.duration)){
      setStatus('视频时长不可识别，无法进行定时试次。','Video duration unavailable. Timed trials cannot run.');
      return;
    }
    if(video.duration+0.15<clipEnd()){
      setStatus(`文件总长 ${mmss(video.duration)}，不足片段 ${'ABC'[segmentIdx()]} 的 ${mmss(clipStart())}–${mmss(clipEnd())}。请选择较短时长或有效片段。`,
        `File duration ${mmss(video.duration)} is too short for segment ${'ABC'[segmentIdx()]} (${mmss(clipStart())}–${mmss(clipEnd())}).`);
      return;
    }
    video.currentTime=clipStart();
    updateProgress();
    setStatus(`视频已加载（${mmss(video.duration)}），已准备 ${'ABC'[segmentIdx()]} 片段；选择位置后点击播放。`,
      `Video loaded (${mmss(video.duration)}). Segment ${'ABC'[segmentIdx()]} ready. Select a region and press Play.`);
  }
  function chooseFile(){
    const file=$('videoFile').files?.[0];if(!file)return;
    stopVideo(true);
    video.removeAttribute('src');video.load();
    if(videoURL)URL.revokeObjectURL(videoURL);
    videoURL=URL.createObjectURL(file);filename=file.name;
    video.src=videoURL;video.playbackRate=1;video.muted=!soundToggle.checked;video.volume=1;video.load();
    relayout();overlay.hidden=false;
    writeEvent('file_loaded');
    setStatus(`已载入 ${filename}，正在读取时长。`,`Loaded ${filename}; reading duration.`);
  }
  function chooseSegmentOrRegion(){
    // A changed selection starts a NEW region/segment rather than continuing the old data.
    stopVideo(false);
    relayout();
    if (videoURL) {
      overlay.hidden = false; 
    }
    writeEvent('region_or_segment_selected');
    if(videoURL&&video.readyState>=1)loadedMetadata();
    else updateProgress();
  }
  async function play(){
    if(!videoURL){setStatus('请先选本地 MP4。','Choose a local MP4 first.');return;}
    if(video.readyState<1){setStatus('正在读取视频元数据，请稍后再次播放。','Video metadata is loading. Press Play after it loads.');return;}
    if(!Number.isFinite(video.duration)||video.duration+0.15<clipEnd()){
      setStatus(`片段结束时间 ${mmss(clipEnd())} 超出视频总长 ${mmss(video.duration||0)}。`,`Segment end ${mmss(clipEnd())} exceeds file duration ${mmss(video.duration||0)}.`);
      return;
    }
    window.SPATIAL?.stopIfRunning('switched_to_video');
    const start=clipStart(),end=clipEnd();
    if(!block||completed){
      block={start,end,region:regionSelect.value,segment:segmentIdx()};
      completed=false;
      
      video.currentTime=start;
      writeEvent('segment_started');
    }
    if(video.currentTime<block.start-0.02||video.currentTime>=block.end-0.02)video.currentTime=block.start;
    video.playbackRate=1;
    relayout();overlay.hidden=false;
    $('fixationCross').hidden=!$('fixationEnabled').checked;
    try{
      await video.play();
      changeControlsDisabled(true);
      if(frameId===null)frameId=requestAnimationFrame(videoFrame);
      setStatus(`正在播放：${block.region} · 片段 ${'ABC'[block.segment]}；到 ${mmss(block.end)} 自动暂停。`,
        `Playing: ${block.region}, clip ${'ABC'[block.segment]}; auto-pause at ${mmss(block.end)}.`);
    }catch(err){writeEvent('play_error',err.message);setStatus(`播放失败：${err.message}`,`Playback failed: ${err.message}`);}
  }
 
  soundToggle.addEventListener('change',()=>{video.muted=!soundToggle.checked;writeEvent('audio_setting_changed');});
  $('videoFile').addEventListener('change',chooseFile);
  $('videoPlay').addEventListener('click',play);
  $('videoPause').addEventListener('click',()=>{videoPause();writeEvent('manual_pause');setStatus('已暂停，可以继续当前片段。','Paused; you can resume this segment.');});
  $('videoStop').addEventListener('click',()=>{stopVideo(true);writeEvent('stop_hide');setStatus('已停止并隐藏。','Stopped and hidden.');});
  regionSelect.addEventListener('change',chooseSegmentOrRegion);
  segmentSelect.addEventListener('change',chooseSegmentOrRegion);
  durationInput.addEventListener('change',chooseSegmentOrRegion);
 
  $('videoCsvBtn').addEventListener('click',()=>window.APP.csvExport(events,'window_video_events'));
  video.addEventListener('loadedmetadata',loadedMetadata);
  video.addEventListener('timeupdate',checkBoundary);
  video.addEventListener('play',()=>{changeControlsDisabled(true);writeEvent('play');});
  video.addEventListener('pause',()=>{releaseFrame();changeControlsDisabled(false);writeEvent('pause');});
  video.addEventListener('ended',()=>{
    releaseFrame();
    if(block&&!completed){
      if(video.currentTime >= block.end - 0.15)finishAtLimit();
      else {writeEvent('file_ended_before_limit');setStatus('文件已结束，但没有播放满设定片段时长。','File ended before the configured segment limit.');}
    }
  });
  video.addEventListener('error',()=>{
    if(videoURL){writeEvent('media_error',video.error?.message||'unknown');setStatus('视频解码失败：建议 H.264 MP4。','Cannot decode video. Use H.264 MP4.');}
  });
  document.addEventListener('window:geometry',()=>{
    if(!video.paused){videoPause();writeEvent('paused_due_to_geometry_change');}
    relayout();
  });
  window.addEventListener('pagehide',()=>{releaseFrame();if(videoURL)URL.revokeObjectURL(videoURL);});
  window.VIDEO={stopVideo};
  relayout();updateProgress();
})();
