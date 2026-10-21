const ROOM_ACTIVITIES = [
  {id:"lying", name:"Lying", category:"Static Posture", instruction:"침대에 누워 가만히 있어주세요.", mode:"time", target:60, targetText:"목표 시간: 60초"},
  {id:"sitting", name:"Sitting", category:"Static Posture", instruction:"침대에 앉아 가만히 있어주세요.", mode:"time", target:60, targetText:"목표 시간: 60초"},
  {id:"standing", name:"Standing", category:"Static Posture", instruction:"침대 앞에 서서 가만히 있어주세요.", mode:"time", target:60, targetText:"목표 시간: 60초"},
  {id:"eating", name:"Eating", category:"Static ADL", instruction:"앉아서 과자 먹기 또는 실제 식사 동작을 모사해주세요.", mode:"time", target:120, targetText:"목표 시간: 120초"},
  {id:"dressing", name:"Dressing", category:"Static ADL", instruction:"앉아서 상의 또는 병원복을 입고 벗는 동작을 모사해주세요.", mode:"time", target:120, targetText:"목표 시간: 120초"},
  {id:"hygiene", name:"Bathing / Grooming / Tooth brushing", category:"Static ADL", instruction:"자리를 이동하여 서서 양치하고 가글하는 동작을 모사해주세요.", mode:"time", target:60, targetText:"목표 시간: 60초"},
  {id:"lying_to_stand", name:"Lying-to-Stand", category:"Transfer", instruction:"침대에서 천천히 일어나 서기를 반복해주세요.", mode:"manual", target:3, targetText:"목표 횟수: 3회"},
  {id:"lying_to_sitting", name:"Lying-to-Sitting", category:"Transfer", instruction:"침대에서 천천히 일어나 앉기를 반복해주세요.", mode:"manual", target:3, targetText:"목표 횟수: 3회"},
  {id:"sitting_to_lying", name:"Sitting-to-Lying", category:"Transfer", instruction:"앉은 자세에서 다시 눕기를 반복해주세요.", mode:"manual", target:3, targetText:"목표 횟수: 3회"},
  {id:"sit_to_stand", name:"Sit-to-Stand", category:"Transfer", instruction:"앉았다가 일어서기를 반복해주세요.", mode:"manual", target:3, targetText:"목표 횟수: 3회"},
  {id:"stand_to_sit", name:"Stand-to-Sit", category:"Transfer", instruction:"서있다가 앉기를 반복해주세요.", mode:"manual", target:3, targetText:"목표 횟수: 3회"}
];

const CORRIDOR_ACTIVITIES = [
  {id:"walking", name:"Walking", category:"Active Mobility", instruction:"정상 보행으로 30 m 이동해주세요.", mode:"manual", target:30, targetText:"목표 거리: 30 m"},
  {id:"walking_cane", name:"Walking + CANE", category:"Active Mobility", instruction:"오른손에 지팡이를 잡고 20 m, 이후 왼손에 지팡이를 잡고 10 m 보행해주세요.", mode:"manual", target:30, targetText:"목표 거리: 30 m"},
  {id:"highwalker", name:"Walking + HIGHWALKER", category:"Active Mobility", instruction:"하이워커를 이용하여 30 m 보행해주세요.", mode:"manual", target:30, targetText:"목표 거리: 30 m"},
  {id:"walker", name:"Walking + WALKER", category:"Active Mobility", instruction:"일반 워커를 이용하여 30 m 보행해주세요.", mode:"manual", target:30, targetText:"목표 거리: 30 m"},
  {id:"wheelchair_active", name:"Wheelchair Active", category:"Active Mobility", instruction:"대상자가 스스로 휠체어를 굴려 30 m 이동해주세요.", mode:"manual", target:30, targetText:"목표 거리: 30 m"},
  {id:"wheelchair_passive", name:"Wheelchair Passive", category:"Passive Mobility", instruction:"보조자가 휠체어를 밀어 30 m 이동해주세요.", mode:"manual", target:30, targetText:"목표 거리: 30 m"},
  {id:"bed_mobility", name:"Assisted Bed Mobility", category:"Passive Mobility", instruction:"대상자가 베드에 있는 상태에서 보조자가 밀어 30 m 이동해주세요.", mode:"manual", target:30, targetText:"목표 거리: 30 m"},
  {id:"stairs", name:"Stairs", category:"Active Mobility", instruction:"한쪽 다리가 아픈 것처럼 반 층 올라가기 → 반 층 내려오기 → 다시 반 층 올라가기를 수행해주세요.", mode:"manual", target:3, targetText:"반 층 이동 × 3"}
];

let locationMode="ROOM", restSec=60, voiceEnabled=true, subjectId="", sequence=[], currentIndex=0;
let logs=[], timerHandle=null, restHandle=null;
let currentActivityStart=null, activityStarted=false, activityCompleted=false;
let activityPaused=false, activityPauseStartMs=null, activityPauseAccumMs=0, activityPauseCount=0, activityRemainingSec=null;
let restPaused=false, restPauseStartMs=null, restPauseAccumMs=0, restPauseCount=0, restRemainingSec=null;

const $ = id => document.getElementById(id);

function showOnly(id){
  ["setup","activityScreen","restScreen","finishScreen"].forEach(x => $(x).classList.add("hidden"));
  $(id).classList.remove("hidden");
}
function shuffle(arr){
  const a=[...arr];
  for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
  return a;
}
function speak(text){
  if(!voiceEnabled || !("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  const u=new SpeechSynthesisUtterance(text); u.lang="ko-KR"; u.rate=.92; u.pitch=1; speechSynthesis.speak(u);
}
function fmt(sec){
  sec=Math.max(0,Math.ceil(sec)); return `${Math.floor(sec/60).toString().padStart(2,"0")}:${(sec%60).toString().padStart(2,"0")}`;
}
function resetActivityState(){
  if(timerHandle){clearInterval(timerHandle);timerHandle=null;}
  currentActivityStart=null; activityStarted=false; activityCompleted=false; activityPaused=false;
  activityPauseStartMs=null; activityPauseAccumMs=0; activityPauseCount=0; activityRemainingSec=null;
  $("pauseBanner").classList.add("hidden"); $("pauseActivityBtn").textContent="⏸ 일시정지";
}
function renderActivity(){
  resetActivityState();
  const a=sequence[currentIndex];
  $("progress").textContent=`현재 동작 ${currentIndex+1} / ${sequence.length}`;
  $("activityName").textContent=a.name; $("activityCategory").textContent=a.category;
  $("activityInstruction").textContent=a.instruction; $("activityTarget").textContent=a.targetText;
  $("prevActivityBtn").disabled=currentIndex===0; $("pauseActivityBtn").disabled=true;
  $("readyPanel").classList.remove("hidden"); $("countPanel").classList.add("hidden");
  $("runningPanel").classList.add("hidden"); $("completedPanel").classList.add("hidden");
  $("timer").textContent=a.mode==="time"?fmt(a.target):"";
  showOnly("activityScreen");
}
async function runCountdown(){
  $("readyPanel").classList.add("hidden"); $("countPanel").classList.remove("hidden");
  $("prevActivityBtn").disabled=true; $("pauseActivityBtn").disabled=true;
  for(const n of [3,2,1]){
    $("countdown").textContent=n; speak(String(n)); await new Promise(r=>setTimeout(r,1000));
  }
  speak("시작하세요."); $("countPanel").classList.add("hidden"); $("runningPanel").classList.remove("hidden");
  $("prevActivityBtn").disabled=false; $("pauseActivityBtn").disabled=false; startActivity();
}
function runTimeTimer(){
  if(timerHandle) clearInterval(timerHandle);
  timerHandle=setInterval(()=>{
    if(activityPaused) return;
    activityRemainingSec--; $("timer").textContent=fmt(activityRemainingSec);
    if(activityRemainingSec<=0){clearInterval(timerHandle);timerHandle=null;finishActivity(true);}
  },1000);
}
function startActivity(){
  const a=sequence[currentIndex]; currentActivityStart=Date.now(); activityStarted=true;
  $("runningStatus").textContent="동작 진행 중";
  if(a.mode==="time"){activityRemainingSec=a.target;$("timer").textContent=fmt(activityRemainingSec);runTimeTimer();}
  else $("timer").textContent="";
}
function toggleActivityPause(){
  if(!activityStarted||activityCompleted) return;
  if(!activityPaused){
    activityPaused=true; activityPauseStartMs=Date.now(); activityPauseCount++;
    if(timerHandle){clearInterval(timerHandle);timerHandle=null;} if("speechSynthesis" in window) speechSynthesis.cancel();
    $("pauseActivityBtn").textContent="▶ 계속하기"; $("pauseBanner").classList.remove("hidden"); $("runningStatus").textContent="일시정지 중";
  }else{
    if(activityPauseStartMs) activityPauseAccumMs += Date.now()-activityPauseStartMs;
    activityPauseStartMs=null; activityPaused=false; $("pauseActivityBtn").textContent="⏸ 일시정지";
    $("pauseBanner").classList.add("hidden"); $("runningStatus").textContent="동작 진행 중";
    if(sequence[currentIndex].mode==="time") runTimeTimer(); speak("계속 진행해주세요.");
  }
}
function finishActivity(autoFinished=false){
  if(activityCompleted) return;
  if(timerHandle){clearInterval(timerHandle);timerHandle=null;}
  if(activityPaused&&activityPauseStartMs){activityPauseAccumMs+=Date.now()-activityPauseStartMs;activityPauseStartMs=null;activityPaused=false;}
  const end=Date.now(); activityCompleted=true; $("pauseActivityBtn").disabled=true; $("pauseBanner").classList.add("hidden");
  $("runningPanel").classList.add("hidden"); $("completedPanel").classList.remove("hidden"); speak("동작이 완료되었습니다.");
  const a=sequence[currentIndex], wall=(end-currentActivityStart)/1000, pause=activityPauseAccumMs/1000;
  logs.push({
    subject_id:subjectId,session_type:locationMode,planned_order:currentIndex+1,activity_id:a.id,activity_name:a.name,category:a.category,target:a.targetText,
    start_ms:currentActivityStart,start_iso:new Date(currentActivityStart).toISOString(),end_ms:end,end_iso:new Date(end).toISOString(),
    duration_sec:wall.toFixed(3),pause_count:activityPauseCount,pause_duration_sec:pause.toFixed(3),active_duration_sec:Math.max(0,wall-pause).toFixed(3),
    completion_type:autoFinished?"AUTO_TIMER":"MANUAL_BUTTON",rest_sec:restSec,rest_pause_count:0,rest_pause_duration_sec:"0.000"
  });
}
function previousActivity(){
  if(currentIndex===0) return;
  if(activityStarted||activityCompleted){
    if(!confirm("이전 동작으로 돌아가면 현재 동작과 이후 기록은 취소됩니다. 이동할까요?")) return;
  }
  if(timerHandle){clearInterval(timerHandle);timerHandle=null;} if("speechSynthesis" in window) speechSynthesis.cancel();
  const target=currentIndex-1;
  logs=logs.filter(r=>Number(r.planned_order)<target+1);
  currentIndex=target; renderActivity();
}
function startRest(){
  if(currentIndex>=sequence.length-1){showOnly("finishScreen");speak("모든 동작이 완료되었습니다.");return;}
  if(restHandle){clearInterval(restHandle);restHandle=null;}
  restPaused=false;restPauseStartMs=null;restPauseAccumMs=0;restPauseCount=0;restRemainingSec=restSec;
  $("pauseRestBtn").disabled=false;$("pauseRestBtn").textContent="⏸ 휴식 일시정지";$("restPauseBanner").classList.add("hidden");
  showOnly("restScreen");$("restTimer").textContent=fmt(restRemainingSec);$("nextActivityBtn").classList.add("hidden");speak("휴식 시간입니다.");
  runRestTimer();
}
function runRestTimer(){
  if(restHandle)clearInterval(restHandle);
  restHandle=setInterval(()=>{
    if(restPaused)return;
    restRemainingSec--;$("restTimer").textContent=fmt(restRemainingSec);
    if(restRemainingSec<=0){
      clearInterval(restHandle);restHandle=null;$("nextActivityBtn").classList.remove("hidden");$("pauseRestBtn").disabled=true;
      if(logs.length){logs[logs.length-1].rest_pause_count=restPauseCount;logs[logs.length-1].rest_pause_duration_sec=(restPauseAccumMs/1000).toFixed(3);}
      speak("휴식이 완료되었습니다. 다음 동작을 확인해주세요.");
    }
  },1000);
}
function toggleRestPause(){
  if(restRemainingSec<=0)return;
  if(!restPaused){
    restPaused=true;restPauseStartMs=Date.now();restPauseCount++;if(restHandle){clearInterval(restHandle);restHandle=null;}
    if("speechSynthesis" in window)speechSynthesis.cancel();$("pauseRestBtn").textContent="▶ 휴식 계속";$("restPauseBanner").classList.remove("hidden");
  }else{
    if(restPauseStartMs)restPauseAccumMs+=Date.now()-restPauseStartMs;restPauseStartMs=null;restPaused=false;
    $("pauseRestBtn").textContent="⏸ 휴식 일시정지";$("restPauseBanner").classList.add("hidden");runRestTimer();
  }
}
function csvEscape(v){const s=String(v??"");return `"${s.replaceAll('"','""')}"`;}
function downloadCsv(){
  const h=["subject_id","session_type","planned_order","activity_id","activity_name","category","target","start_ms","start_iso","end_ms","end_iso","duration_sec","pause_count","pause_duration_sec","active_duration_sec","completion_type","rest_sec","rest_pause_count","rest_pause_duration_sec"];
  const rows=[h.join(",")];for(const r of logs)rows.push(h.map(k=>csvEscape(r[k])).join(","));
  const blob=new Blob(["\uFEFF"+rows.join("\r\n")],{type:"text/csv;charset=utf-8"}),a=document.createElement("a");
  const stamp=new Date().toISOString().replaceAll(":","-").replace("T","_").slice(0,19);
  a.href=URL.createObjectURL(blob);a.download=`${subjectId}_${locationMode}_${stamp}_protocol.csv`;document.body.appendChild(a);a.click();
  setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},1000);
}
function abortSession(){
  if(confirm("현재 실험을 종료할까요? 지금까지 기록된 CSV는 저장할 수 있습니다.")){
    if(timerHandle)clearInterval(timerHandle);if(restHandle)clearInterval(restHandle);if("speechSynthesis" in window)speechSynthesis.cancel();showOnly("finishScreen");
  }
}

$("roomBtn").onclick=()=>{locationMode="ROOM";$("roomBtn").classList.add("active");$("corridorBtn").classList.remove("active");};
$("corridorBtn").onclick=()=>{locationMode="CORRIDOR";$("corridorBtn").classList.add("active");$("roomBtn").classList.remove("active");};
$("startSession").onclick=()=>{
  subjectId=$("subjectId").value.trim();if(!subjectId){alert("대상자 ID를 입력해주세요.");return;}
  restSec=Number($("restSec").value);if(!Number.isFinite(restSec)||restSec<10||restSec>120){alert("휴식시간은 10~120초로 설정해주세요.");return;}
  voiceEnabled=$("voiceOn").value==="on";if(voiceEnabled)speak("음성 안내를 시작합니다.");
  sequence=shuffle(locationMode==="ROOM"?ROOM_ACTIVITIES:CORRIDOR_ACTIVITIES);currentIndex=0;logs=[];renderActivity();
};
$("readyStart").onclick=runCountdown;
$("manualComplete").onclick=()=>finishActivity(false);
$("goRest").onclick=startRest;
$("nextActivityBtn").onclick=()=>{currentIndex++;renderActivity();};
$("downloadCsv").onclick=downloadCsv;
$("abortSession").onclick=abortSession;$("abortRest").onclick=abortSession;$("newSession").onclick=()=>location.reload();
$("prevActivityBtn").onclick=previousActivity;$("pauseActivityBtn").onclick=toggleActivityPause;$("pauseRestBtn").onclick=toggleRestPause;

if("serviceWorker" in navigator){window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js"));}
