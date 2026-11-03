/* English/Chinese labels are defined here; UI and code remain separate. */
window.TRANSLATIONS={
  zh:{
    footer:'概念 SUV 后门 · 几何 Pilot · 非真实车型复刻',showPanel:'显示设置 (H)',language:'语言 / Language',
    title:'后排侧车窗交互实验 · V3.2.6',
    intro:'左侧车窗 Pilot。保留 V3.2 的校准、视频、中英文和数据导出，移除旧 C3 车门与重复坐标系统。',
    geometryTitle:'1 · 几何与校准',presetLabel:'车窗尺寸',small:'小 · 625 × 475 mm',medium:'中 · 684 × 494 mm',
    large:'较大几何 Pilot · 700 × 550 mm（未验证）',dloPilot:'可见开口假设 Pilot · 700 × 450 mm',suvUpperPilot:'SUV 较大开口候选 · 750 × 450 mm（待验证）',custom:'自定义',windowWidth:'车窗宽度（mm）',windowHeight:'车窗高度（mm）',
    screenWidth:'显示屏有效宽度（mm）',scale:'校准比例（%）',windowCenter:'窗中心距屏幕左端（mm）',
    windowBottom:'窗下沿距屏幕顶端（mm）',inclination:'实际安装倾角（°，日志）',center:'水平居中',geometryReadout:'当前车窗尺寸',
    calibrationNote:'先用真实屏幕宽度和 100 mm 标尺校准。切换尺寸时固定窗下沿与水平中心；H-point 参考数据不等于真实座椅和玻璃的相对位置。',
    sceneTitle:'2 · 背景与视频（Visual Pilot）',sceneModeLabel:'窗外背景',sceneDemo:'简化模糊景观',scenePhotoOption:'上传照片',
    sceneOpacityLabel:'照片透明度（%）',fixationLabel:'显示注视参考十字（可选）',sceneDark:'纯色背景',sceneFileLabel:'上传背景照片（仅本机）',sceneBlurLabel:'景观模糊度',
    videoFileLabel:'选择视频（本地 MP4）',videoSegmentLabel:'选择视频片段',segmentA:'A：0–5 分钟',segmentB:'B：5–10 分钟',segmentC:'C：10–15 分钟',videoLimitLabel:'每区视频上限（秒）',videoProgressLabel:'当前片段进度',videoMappingNote:'单个15分钟文件分成三段：片段和区域独立选择。跨参与者平衡片段与观看位置，避免内容混淆。',videoSound:'播放视频声音（正式实验请固定）',videoRegionLabel:'视频位置',front:'前（靠 B 柱）',middle:'中',rear:'后（靠 C 柱）',
    play:'播放',pause:'暂停',hideVideo:'停止/隐藏',videoExport:'导出视频事件 CSV',
    videoNote:'三个位置视频等尺寸（750 mm 窗口下为 250 × 140.6 mm），使用 HTML 层避免 Mac 视频错位。',
    spatialTitle:'3 · Spatial Target Pilot',participant:'Participant ID',session:'Session ID',interactionHand:'使用手',
    leftHand:'左手',rightHand:'右手',handDominance:'惯用手',mixed:'混合/不明确',gridLayout:'固定点位布局',
    repetitions:'每点重复次数',targetSize:'十字宽度（mm）',hitRadius:'命中半径（mm）',timeout:'单目标超时（ms）',
    iti:'目标间隔（ms）',sequenceSeed:'可重复随机种子',
    spatialNote:'三种固定毫米点阵：4×3/200、5×3/150（中心留空，14点）、8×5/100。可选中心回位，保留点击和试次数据。',
    preview:'显示点位预览',start:'开始点选',stop:'停止',exportTrials:'导出试次 CSV',exportClicks:'导出点击 CSV',
    diagnosticsTitle:'4 · 校准检查',inputModeLabel:'输入方式标注（保留设备原始 pointerType）',inputFinger:'手指（人工标注）',inputAuto:'设备识别',inputMouse:'鼠标',inputStylus:'触控笔',diagnostics:'触摸诊断：关',diagnosticsExport:'诊断 CSV',
    touchHint:'点选任务之外，可打开触摸诊断检查屏幕与窗体毫米坐标。',fullscreen:'全屏',hidePanel:'隐藏设置 (H)',returnToCenter:
    '每个目标后返回车窗中心并触碰确认',strictHitRadius:'限定命中半径（取消勾选：车窗内任意位置均有效）',
  },



  en:{
    footer:'Conceptual SUV rear door · geometry pilot · not a validated vehicle replica',showPanel:'Show settings (H)',language:'Language / 语言',
    title:'Passenger Window Interaction · V3.2.6',
    intro:'Left-side window pilot. Keeps V3.2 calibration, video, bilingual UI, and export; removes C3 legacy door and duplicate coordinate systems.',
    geometryTitle:'1 · Geometry & calibration',presetLabel:'Window size',small:'Small · 625 × 475 mm',medium:'Median · 684 × 494 mm',
    large:'Larger geometry pilot · 700 × 550 mm (unverified)',dloPilot:'Assumed DLO pilot · 700 × 450 mm',suvUpperPilot:'Upper-range SUV pilot · 750 × 450 mm (unverified)',custom:'Custom',windowWidth:'Window width (mm)',windowHeight:'Window height (mm)',
    screenWidth:'Active display width (mm)',scale:'Calibration ratio (%)',windowCenter:'Window centre from display left (mm)',
    windowBottom:'Window bottom from display top (mm)',inclination:'Actual installed tilt (°, logged)',center:'Centre horizontally',geometryReadout:'Current window size',
    calibrationNote:'Verify active screen width and the 100 mm ruler. Window bottom and horizontal centre remain fixed when switching sizes. H-point references do not establish the actual seat-to-glass relationship.',
    sceneTitle:'2 · Scenery & video (visual pilot)',sceneModeLabel:'Outdoor scenery',sceneDemo:'Blurred conceptual scene',scenePhotoOption:'Uploaded photo',
    sceneOpacityLabel:'Photo opacity (%)',fixationLabel:'Show fixation cue (optional)',sceneDark:'Plain dark background',sceneFileLabel:'Upload background (local only)',sceneBlurLabel:'Background blur',
    videoFileLabel:'Choose video (local MP4)',videoSegmentLabel:'Video segment',segmentA:'A: 0–5 min',segmentB:'B: 5–10 min',segmentC:'C: 10–15 min',videoLimitLabel:'Max duration per region (s)',videoProgressLabel:'Segment progress',videoMappingNote:'One 15-minute file split into three sections. Assign segments to regions independently and counterbalance across participants.',videoSound:'Play video sound (keep consistent in formal study)',videoRegionLabel:'Video position',front:'Front (near B-pillar)',middle:'Middle',rear:'Rear (near C-pillar)',
    play:'Play',pause:'Pause',hideVideo:'Stop / hide',videoExport:'Export video events CSV',
    videoNote:'All regions use the same physical video size (250 × 140.6 mm for a 750 mm window); video uses a native HTML layer for macOS.',
    spatialTitle:'3 · Spatial Target Pilot',participant:'Participant ID',session:'Session ID',interactionHand:'Interaction hand',
    leftHand:'Left hand',rightHand:'Right hand',handDominance:'Hand dominance',mixed:'Mixed / unclear',gridLayout:'Fixed target layout',
    repetitions:'Repetitions per target',targetSize:'Cross width (mm)',hitRadius:'Hit radius (mm)',timeout:'Target timeout (ms)',
    iti:'Inter-trial interval (ms)',sequenceSeed:'Reproducible random seed',
    spatialNote:'Three physical grids: 4×3/200 mm; 5×3/150 mm (centre reserved, 14 targets); 8×5/100 mm. Optional centre return, click/trial CSV.',
    preview:'Show target preview',start:'Start target task',stop:'Stop',exportTrials:'Export trial CSV',exportClicks:'Export touch CSV',
    diagnosticsTitle:'4 · Calibration checks',inputModeLabel:'Input label (preserve raw pointerType)',inputFinger:'Finger (manually labelled)',inputAuto:'Device-detected type',inputMouse:'Mouse',inputStylus:'Stylus',diagnostics:'Touch diagnostic: OFF',diagnosticsExport:'Diagnostic CSV',
    touchHint:'Outside formal trials, enable touch diagnostics to inspect screen and window millimetre coordinates.',fullscreen:'Fullscreen',hidePanel:'Hide settings (H)',returnToCenter:
    'Return to and touch window centre between targets',strictHitRadius: 'Require target-radius hit (unchecked: accept any touch within the window)',
  }
};
