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

let locationMode = "ROOM";
let restSec = 60;
let voiceEnabled = true;
let subjectId = "";
let sequence = [];
let currentIndex = 0;
let currentActivityStart = null;
let currentActivityEnd = null;
let timerHandle = null;
let restHandle = null;
let logs = [];
let sessionStartMs = null;

const $ = id => document.getElementById(id);

function showOnly(id){
  ["setup","activityScreen","restScreen","finishScreen"].forEach(x => $(x).classList.add("hidden"));
  $(id).classList.remove("hidden");
}

function shuffle(arr){
  const a = [...arr];
  for(let i=a.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [a[i],a[j]]=[a[j],a[i]];
  }
  return a;
}

function speak(text){
  if(!voiceEnabled || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "ko-KR";
  u.rate = 0.92;
  u.pitch = 1.0;
  window.speechSynthesis.speak(u);
}

function fmt(sec){
  sec = Math.max(0, Math.ceil(sec));
  const m = Math.floor(sec/60).toString().padStart(2,"0");
  const s = (sec%60).toString().padStart(2,"0");
  return `${m}:${s}`;
}

function renderActivity(){
  const a = sequence[currentIndex];
  $("progress").textContent = `현재 동작 ${currentIndex+1} / ${sequence.length}`;
  $("activityName").textContent = a.name;
  $("activityCategory").textContent = a.category;
  $("activityInstruction").textContent = a.instruction;
  $("activityTarget").textContent = a.targetText;
  $("readyPanel").classList.remove("hidden");
  $("countPanel").classList.add("hidden");
  $("runningPanel").classList.add("hidden");
  $("completedPanel").classList.add("hidden");
  $("timer").textContent = a.mode === "time" ? fmt(a.target) : "";
  $("manualComplete").classList.toggle("hidden", false);
  showOnly("activityScreen");
}

async function runCountdown(){
  $("readyPanel").classList.add("hidden");
  $("countPanel").classList.remove("hidden");
  for(const n of [3,2,1]){
    $("countdown").textContent = n;
    speak(String(n));
    await new Promise(r => setTimeout(r, 1000));
  }
  speak("시작하세요.");
  $("countPanel").classList.add("hidden");
  $("runningPanel").classList.remove("hidden");
  startActivity();
}

function startActivity(){
  const a = sequence[currentIndex];
  currentActivityStart = Date.now();
  $("runningStatus").textContent = "동작 진행 중";

  if(a.mode === "time"){
    let remaining = a.target;
    $("timer").textContent = fmt(remaining);
    timerHandle = setInterval(() => {
      remaining -= 1;
      $("timer").textContent = fmt(remaining);
      if(remaining <= 0){
        clearInterval(timerHandle);
        timerHandle = null;
        finishActivity(true);
      }
    },1000);
  } else {
    $("timer").textContent = "";
  }
}

function finishActivity(autoFinished=false){
  if(timerHandle){ clearInterval(timerHandle); timerHandle=null; }
  currentActivityEnd = Date.now();
  $("runningPanel").classList.add("hidden");
  $("completedPanel").classList.remove("hidden");
  speak("동작이 완료되었습니다.");

  const a = sequence[currentIndex];
  logs.push({
    subject_id: subjectId,
    session_type: locationMode,
    planned_order: currentIndex + 1,
    activity_id: a.id,
    activity_name: a.name,
    category: a.category,
    target: a.targetText,
    start_ms: currentActivityStart ?? "",
    start_iso: currentActivityStart ? new Date(currentActivityStart).toISOString() : "",
    end_ms: currentActivityEnd,
    end_iso: new Date(currentActivityEnd).toISOString(),
    duration_sec: currentActivityStart ? ((currentActivityEnd-currentActivityStart)/1000).toFixed(3) : "",
    completion_type: autoFinished ? "AUTO_TIMER" : "MANUAL_BUTTON",
    rest_sec: restSec
  });
}

function startRest(){
  if(currentIndex >= sequence.length-1){
    showOnly("finishScreen");
    speak("모든 동작이 완료되었습니다.");
    return;
  }

  showOnly("restScreen");
  let remaining = restSec;
  $("restTimer").textContent = fmt(remaining);
  $("nextActivityBtn").classList.add("hidden");
  speak("휴식 시간입니다.");

  restHandle = setInterval(() => {
    remaining -= 1;
    $("restTimer").textContent = fmt(remaining);
    if(remaining <= 0){
      clearInterval(restHandle);
      restHandle = null;
      $("nextActivityBtn").classList.remove("hidden");
      speak("휴식이 완료되었습니다. 다음 동작을 확인해주세요.");
    }
  },1000);
}

function csvEscape(v){
  const s = String(v ?? "");
  return `"${s.replaceAll('"','""')}"`;
}

function downloadCsv(){
  const headers = [
    "subject_id","session_type","planned_order","activity_id","activity_name",
    "category","target","start_ms","start_iso","end_ms","end_iso",
    "duration_sec","completion_type","rest_sec"
  ];
  const rows = [headers.join(",")];
  for(const row of logs){
    rows.push(headers.map(h => csvEscape(row[h])).join(","));
  }
  const csvText = "\uFEFF" + rows.join("\r\n");
  const blob = new Blob([csvText], {type:"text/csv;charset=utf-8"});
  const a = document.createElement("a");
  const stamp = new Date().toISOString().replaceAll(":","-").replace("T","_").slice(0,19);
  a.href = URL.createObjectURL(blob);
  a.download = `${subjectId}_${locationMode}_${stamp}_protocol.csv`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}

function abortSession(){
  if(timerHandle){clearInterval(timerHandle);timerHandle=null;}
  if(restHandle){clearInterval(restHandle);restHandle=null;}
  if(confirm("현재 실험을 종료할까요? 지금까지 기록된 CSV는 저장할 수 있습니다.")){
    showOnly("finishScreen");
  }
}

$("roomBtn").onclick = () => {
  locationMode="ROOM";
  $("roomBtn").classList.add("active"); $("corridorBtn").classList.remove("active");
};
$("corridorBtn").onclick = () => {
  locationMode="CORRIDOR";
  $("corridorBtn").classList.add("active"); $("roomBtn").classList.remove("active");
};

$("startSession").onclick = () => {
  subjectId = $("subjectId").value.trim();
  if(!subjectId){ alert("대상자 ID를 입력해주세요."); return; }
  restSec = Number($("restSec").value);
  if(!Number.isFinite(restSec) || restSec < 60 || restSec > 120){
    alert("휴식시간은 60~120초로 설정해주세요."); return;
  }
  voiceEnabled = $("voiceOn").value === "on";

  // iOS Safari permits speech reliably after a user gesture.
  if(voiceEnabled) speak("음성 안내를 시작합니다.");

  const src = locationMode==="ROOM" ? ROOM_ACTIVITIES : CORRIDOR_ACTIVITIES;
  sequence = shuffle(src);
  currentIndex = 0;
  logs = [];
  sessionStartMs = Date.now();
  renderActivity();
};

$("readyStart").onclick = runCountdown;
$("manualComplete").onclick = () => finishActivity(false);
$("goRest").onclick = startRest;
$("nextActivityBtn").onclick = () => { currentIndex += 1; renderActivity(); };
$("downloadCsv").onclick = downloadCsv;
$("abortSession").onclick = abortSession;
$("abortRest").onclick = abortSession;
$("newSession").onclick = () => location.reload();

if("serviceWorker" in navigator){
  window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js"));
}
