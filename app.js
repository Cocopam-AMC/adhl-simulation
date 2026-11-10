// IMU Integrated Scenario PWA v5 - simplified guided flow
// Source protocol: A-J integrated scenarios. Internal scenario order is fixed; selected scenario order is randomized.

const REQUIRED_ACTIVITIES = [
  "Lying","Sitting","Standing","Eating","Dressing","Bathing / Grooming / Tooth brushing",
  "Lying-to-Stand","Lying-to-Sitting","Sitting-to-Lying","Sit-to-Stand","Stand-to-Sit",
  "Walking","Walking+CANE","Walking+HIGHWALKER","Walking+WALKER","Wheelchair Passive","Assisted Bed Mobility"
];

const META = {
  "Lying": {id:"lying", category:"Static Posture", binary:"Non-Mobility", mode:"time", target:60, targetText:"목표 시간: 1분", instruction:"침대에 누워 가만히 있어주세요."},
  "Sitting": {id:"sitting", category:"Static Posture", binary:"Non-Mobility", mode:"time", target:60, targetText:"목표 시간: 1분", instruction:"앉은 자세를 유지해주세요."},
  "Standing": {id:"standing", category:"Static Posture", binary:"Non-Mobility", mode:"time", target:60, targetText:"목표 시간: 1분", instruction:"서 있는 자세를 유지해주세요."},
  "Eating": {id:"eating", category:"In-place ADL", binary:"Non-Mobility", mode:"time", target:120, targetText:"목표 시간: 2분", instruction:"앉아서 실제 식사 또는 식사 동작을 모사해주세요."},
  "Dressing": {id:"dressing", category:"In-place ADL", binary:"Non-Mobility", mode:"time", target:120, targetText:"목표 시간: 2분", instruction:"병원복 또는 다른 상의를 입고 벗는 동작을 수행해주세요."},
  "Bathing / Grooming / Tooth brushing": {id:"hygiene", category:"In-place ADL", binary:"Non-Mobility", mode:"time", target:60, targetText:"목표 시간: 1분", instruction:"현재 시나리오 지시에 따라 양치/가글 또는 grooming 동작을 수행해주세요."},
  "Lying-to-Stand": {id:"lying_to_stand", category:"Transfer", binary:"Non-Mobility", mode:"manual", target:1, targetText:"목표 횟수: 1회", instruction:"침대에서 일어나 서주세요."},
  "Lying-to-Sitting": {id:"lying_to_sitting", category:"Transfer", binary:"Non-Mobility", mode:"manual", target:1, targetText:"목표 횟수: 1회", instruction:"침대에서 일어나 앉아주세요."},
  "Sitting-to-Lying": {id:"sitting_to_lying", category:"Transfer", binary:"Non-Mobility", mode:"manual", target:1, targetText:"목표 횟수: 1회", instruction:"앉은 자세에서 침대에 누워주세요."},
  "Sit-to-Stand": {id:"sit_to_stand", category:"Transfer", binary:"Non-Mobility", mode:"manual", target:1, targetText:"목표 횟수: 1회", instruction:"앉은 자세에서 일어나 서주세요."},
  "Stand-to-Sit": {id:"stand_to_sit", category:"Transfer", binary:"Non-Mobility", mode:"manual", target:1, targetText:"목표 횟수: 1회", instruction:"서 있는 자세에서 앉아주세요."},
  "Walking": {id:"walking", category:"Active Mobility", binary:"Mobility", mode:"manual", target:40, targetText:"목표 거리: 시나리오 지시 거리", instruction:"정상 보행으로 시나리오에 지정된 경로를 이동해주세요."},
  "Walking+CANE": {id:"walking_cane", category:"Active Mobility", binary:"Mobility", mode:"manual", target:40, targetText:"목표 거리: 시나리오 지시 거리", instruction:"지팡이를 사용하여 시나리오에 지정된 경로를 보행해주세요."},
  "Walking+HIGHWALKER": {id:"walking_highwalker", category:"Active Mobility", binary:"Mobility", mode:"manual", target:40, targetText:"목표 거리: 시나리오 지시 거리", instruction:"하이워커를 사용하여 시나리오에 지정된 경로를 보행해주세요."},
  "Walking+WALKER": {id:"walking_walker", category:"Active Mobility", binary:"Mobility", mode:"manual", target:40, targetText:"목표 거리: 시나리오 지시 거리", instruction:"일반 워커를 사용하여 시나리오에 지정된 경로를 보행해주세요."},
  "Wheelchair Passive": {id:"wheelchair_passive", category:"Passive Mobility", binary:"Mobility", mode:"manual", target:40, targetText:"목표 거리: 시나리오 지시 거리", instruction:"휠체어에 앉은 상태에서 보조자가 밀어 이동해주세요."},
  "Assisted Bed Mobility": {id:"assisted_bed_mobility", category:"Passive Mobility", binary:"Mobility", mode:"manual", target:40, targetText:"목표 거리: 시나리오 지시 거리", instruction:"이동식 베드에 누운 상태에서 보조자가 밀어 이동해주세요."}
};

function A(name, override={}) { return {...META[name], name, ...override}; }

const SCENARIOS = {
  A: {title:"보행 불가 → 치료실 보행 훈련 → 이동식 베드 복귀", activities:[
    A("Lying",{instruction:"침대에 누운 상태를 유지해주세요."}),
    A("Lying-to-Sitting",{instruction:"침대에서 일어나 앉아주세요."}),
    A("Sitting",{instruction:"침대에 앉은 자세를 유지해주세요."}),
    A("Eating",{instruction:"침대에 앉아서 식사 동작을 수행해주세요."}),
    A("Bathing / Grooming / Tooth brushing",{instruction:"침대에 앉아서 양치 동작을 수행해주세요."}),
    A("Dressing",{instruction:"병원복 또는 준비된 의복을 입고 벗어주세요."}),
    A("Sit-to-Stand",{instruction:"침대에서 일어나 서주세요."}),
    A("Stand-to-Sit",{instruction:"이동식 베드에 앉아주세요."}),
    A("Sitting-to-Lying",{instruction:"이동식 베드에 누워주세요."}),
    A("Assisted Bed Mobility",{targetText:"목표 거리: 20 m 왕복 2회",instruction:"이동식 베드에 누운 상태에서 보조자가 20 m 구간을 왕복 2회 이동해주세요."}),
    A("Lying-to-Stand",{instruction:"이동식 베드에서 일어나 서주세요."}),
    A("Standing",{instruction:"서 있는 상태에서 보조기기 변경을 기다려주세요."}),
    A("Walking+HIGHWALKER",{targetText:"목표 거리: 20 m × 2회 후 병실 복귀",instruction:"하이워커를 사용하여 20 m 구간을 2회 이동한 뒤 병실로 복귀해주세요."}),
    A("Stand-to-Sit",{instruction:"침대에 앉아주세요."}),
    A("Sitting-to-Lying",{instruction:"침대에 누워주세요."})
  ]},
  B: {title:"병동 보행 → 병실 복귀 → 식사 → 양치", activities:[
    A("Lying"),
    A("Lying-to-Stand",{instruction:"침대에서 일어나 서주세요."}),
    A("Walking",{targetText:"목표 거리: 20 m × 2회 후 병실 복귀",instruction:"정상 보행으로 20 m 구간을 2회 이동한 뒤 병실로 복귀해주세요."}),
    A("Stand-to-Sit",{instruction:"침대 또는 의자에 앉아주세요."}),
    A("Sitting"),
    A("Sit-to-Stand"),
    A("Walking+CANE",{targetText:"목표 거리: 20 m × 2회 후 병실 복귀",instruction:"지팡이를 사용하여 20 m 구간을 2회 이동한 뒤 병실로 복귀해주세요."}),
    A("Stand-to-Sit"),
    A("Eating",{instruction:"앉아서 식사 동작을 수행해주세요."}),
    A("Sit-to-Stand"),
    A("Walking",{targetText:"이동: 양치 장소까지",instruction:"양치 장소까지 걸어서 이동해주세요."}),
    A("Bathing / Grooming / Tooth brushing",{instruction:"양치 동작을 수행해주세요."}),
    A("Walking",{targetText:"이동: 침대까지",instruction:"침대로 걸어서 이동해주세요."}),
    A("Sitting-to-Lying",{instruction:"침대에 누워주세요."})
  ]},
  C: {title:"진료실 복귀 → 화장실 → 옷 갈아입기 → 눕기", activities:[
    A("Sitting",{instruction:"의자에 앉은 상태로 시작해주세요."}),
    A("Sit-to-Stand"),
    A("Stand-to-Sit",{instruction:"휠체어에 앉아주세요."}),
    A("Wheelchair Passive",{targetText:"목표 거리: 20 m × 2회",instruction:"휠체어에 앉은 상태에서 보조자가 20 m 구간을 2회 이동해주세요."}),
    A("Sit-to-Stand"),
    A("Standing"),
    A("Walking",{targetText:"이동: 침대까지",instruction:"병실 입구에서 침대까지 걸어서 이동해주세요."}),
    A("Stand-to-Sit",{instruction:"침대에 앉아주세요."}),
    A("Dressing",{instruction:"침대에 앉아 센서가 없는 병원복 상하의를 입고 벗어주세요."}),
    A("Sitting-to-Lying",{instruction:"침대에 누워주세요."}),
    A("Lying")
  ]},
  D: {title:"옷 갈아입기 → 화장실 양치 → 침대 복귀", activities:[
    A("Lying"),
    A("Lying-to-Sitting"),
    A("Sitting"),
    A("Dressing",{instruction:"센서가 없는 병원복 상하의를 입고 벗어주세요."}),
    A("Sit-to-Stand"),
    A("Walking+WALKER",{targetText:"목표 거리: 20 m × 2회",instruction:"워커를 사용하여 20 m 구간을 2회 이동해주세요."}),
    A("Bathing / Grooming / Tooth brushing",{instruction:"서서 양치 동작을 수행해주세요."}),
    A("Walking+WALKER",{targetText:"목표 거리: 20 m × 2회",instruction:"워커를 사용하여 20 m 구간을 2회 이동해주세요."}),
    A("Stand-to-Sit"),
    A("Sitting")
  ]},
  E: {title:"치료실에서 보조기 변경 보행 훈련", activities:[
    A("Sitting",{instruction:"휠체어에 앉은 상태로 시작해주세요."}),
    A("Wheelchair Passive",{targetText:"이동: 치료 위치까지",instruction:"휠체어에 앉은 상태에서 보조자가 이동해주세요."}),
    A("Sit-to-Stand"),
    A("Walking+WALKER",{targetText:"목표 거리: 20 m × 2회",instruction:"워커를 사용하여 20 m 구간을 2회 이동해주세요."}),
    A("Standing",{instruction:"서 있는 자세를 유지해주세요."}),
    A("Walking+CANE",{targetText:"목표 거리: 20 m × 2회",instruction:"지팡이를 사용하여 20 m 구간을 2회 이동해주세요."}),
    A("Stand-to-Sit",{instruction:"휠체어에 앉아 휴식해주세요."}),
    A("Sitting"),
    A("Sit-to-Stand"),
    A("Walking",{targetText:"목표 거리: 20 m × 2회",instruction:"정상 보행으로 20 m 구간을 2회 이동해주세요."}),
    A("Stand-to-Sit",{instruction:"휠체어에 앉아주세요."}),
    A("Sitting"),
    A("Wheelchair Passive",{targetText:"이동: 병실로 복귀",instruction:"휠체어에 앉은 상태에서 보조자가 병실로 이동해주세요."})
  ]},
  F: {title:"휠체어 이동 → 간식 → 병실 복귀 → 양치", activities:[
    A("Lying"),
    A("Lying-to-Sitting"),
    A("Sitting"),
    A("Sit-to-Stand",{instruction:"침대에서 일어나 서주세요."}),
    A("Stand-to-Sit",{instruction:"휠체어에 앉아주세요."}),
    A("Wheelchair Passive",{targetText:"목표 거리: 20 m × 2회",instruction:"휠체어에 앉은 상태에서 보조자가 20 m 구간을 2회 이동해주세요."}),
    A("Eating",{instruction:"휠체어에 앉아서 식사/간식 동작을 수행해주세요."}),
    A("Wheelchair Passive",{targetText:"목표 거리: 20 m × 2회",instruction:"휠체어에 앉은 상태에서 보조자가 20 m 구간을 2회 이동해주세요."}),
    A("Bathing / Grooming / Tooth brushing",{instruction:"앉은 상태에서 양치 동작을 수행해주세요."})
  ]},
  G: {title:"옷 갈아입기 → 병동 보행 → 경치 구경 → 양치 → 앉기", activities:[
    A("Lying"),
    A("Lying-to-Sitting"),
    A("Dressing",{instruction:"센서가 없는 병원복 상하의를 입고 벗어주세요."}),
    A("Sit-to-Stand"),
    A("Walking",{targetText:"목표 거리: 20 m × 2회",instruction:"병실 밖으로 나가 20 m 구간을 2회 보행해주세요."}),
    A("Standing",{instruction:"복도에서 잠시 서 있는 자세를 유지해주세요."}),
    A("Walking",{targetText:"목표 거리: 20 m × 2회 후 병실 복귀",instruction:"20 m 구간을 2회 보행한 뒤 병실로 복귀해주세요."}),
    A("Bathing / Grooming / Tooth brushing",{instruction:"서서 양치 동작을 수행해주세요."}),
    A("Walking",{targetText:"이동: 침대까지",instruction:"침대로 걸어서 이동해주세요."}),
    A("Stand-to-Sit",{instruction:"침대에 앉아주세요."}),
    A("Sitting")
  ]},
  H: {title:"검사 후 병실 복귀 → 보행 훈련 → 눕기", activities:[
    A("Lying",{instruction:"이송침대에 누운 상태로 시작해주세요."}),
    A("Assisted Bed Mobility",{targetText:"목표 거리: 복도 20 m × 2회",instruction:"이송침대에 누운 상태에서 보조자가 복도 20 m 구간을 2회 이동해주세요."}),
    A("Lying"),
    A("Lying-to-Sitting"),
    A("Sitting"),
    A("Sit-to-Stand"),
    A("Standing"),
    A("Walking+HIGHWALKER",{targetText:"목표 거리: 복도 20 m × 2회 후 병실 이동",instruction:"하이워커를 사용하여 복도 20 m 구간을 2회 이동한 뒤 병실로 이동해주세요."}),
    A("Stand-to-Sit",{instruction:"침대에 앉아주세요."}),
    A("Sitting-to-Lying",{instruction:"침대에 누워주세요."})
  ]},
  I: {title:"침대 → 휴게실 이동 → 식사 → 병실 복귀 → 눕기", activities:[
    A("Lying",{instruction:"병실 침대에 누운 상태로 시작해주세요."}),
    A("Lying-to-Sitting"),
    A("Sitting"),
    A("Sit-to-Stand"),
    A("Walking+HIGHWALKER",{targetText:"목표 거리: 20 m × 2회",instruction:"하이워커를 사용하여 20 m 구간을 2회 이동해주세요."}),
    A("Stand-to-Sit",{instruction:"의자에 앉아주세요."}),
    A("Eating",{instruction:"시뮬레이션센터 병실에서 식사 동작을 수행해주세요."}),
    A("Sit-to-Stand",{instruction:"의자에서 일어나 서주세요."}),
    A("Walking+WALKER",{targetText:"목표 거리: 20 m × 2회",instruction:"워커를 사용하여 20 m 구간을 2회 이동해주세요."}),
    A("Stand-to-Sit",{instruction:"침대에 앉아주세요."}),
    A("Sitting-to-Lying",{instruction:"침대에 누워주세요."}),
    A("Lying")
  ]},
  J: {title:"일어나서 준비 → 병동 보행 → 옷 갈아입기 → 검사실 이동", activities:[
    A("Lying",{instruction:"침대에 누운 상태로 시작해주세요."}),
    A("Lying-to-Stand",{instruction:"침대에서 일어나 서주세요."}),
    A("Walking+CANE",{targetText:"목표 거리: 복도 20 m × 2회",instruction:"지팡이를 사용하여 복도 20 m 구간을 2회 이동해주세요."}),
    A("Bathing / Grooming / Tooth brushing",{instruction:"서서 양치 동작을 수행해주세요."}),
    A("Walking+CANE",{targetText:"이동: 침대까지",instruction:"지팡이를 사용하여 침대로 이동해주세요."}),
    A("Stand-to-Sit",{instruction:"침대에 앉아주세요."}),
    A("Dressing",{instruction:"센서가 없는 병원복 상하의를 입고 벗어주세요."}),
    A("Sitting-to-Lying",{instruction:"이송침대에 누워주세요."}),
    A("Assisted Bed Mobility",{targetText:"목표 거리: 복도 20 m × 2회",instruction:"이송침대에 누운 상태에서 보조자가 복도 20 m 구간을 2회 이동해주세요."}),
    A("Lying")
  ]}
};

const $ = id => document.getElementById(id);
let scenarioCount=3, selectedScenarioIds=[], sequence=[], currentIndex=0, logs=[];
let subjectId="", voiceEnabled=true;
let timerHandle=null, currentActivityStart=null, activityStarted=false, activityCompleted=false;
let activityPaused=false, activityPauseStartMs=null, activityPauseAccumMs=0, activityPauseCount=0, activityRemainingSec=null;

function showOnly(id){["setup","previewScreen","activityScreen","finishScreen"].forEach(x=>$(x).classList.add("hidden"));$(id).classList.remove("hidden");}
function shuffle(arr){const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function combinations(arr,k){const out=[];function rec(start,p){if(p.length===k){out.push([...p]);return;}for(let i=start;i<arr.length;i++){p.push(arr[i]);rec(i+1,p);p.pop();}}rec(0,[]);return out;}
function coverage(ids){const s=new Set();ids.forEach(id=>SCENARIOS[id].activities.forEach(a=>s.add(a.name)));return s;}
function validCombos(k){return combinations(Object.keys(SCENARIOS),k).filter(ids=>REQUIRED_ACTIVITIES.every(x=>coverage(ids).has(x)));}
function chooseScenarios(){const candidates=validCombos(scenarioCount);if(!candidates.length)throw new Error("조건을 만족하는 시나리오 조합이 없습니다.");return shuffle(candidates[Math.floor(Math.random()*candidates.length)]);}
function speak(text){if(!voiceEnabled||!("speechSynthesis" in window))return;speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang="ko-KR";u.rate=.92;u.pitch=1;speechSynthesis.speak(u);}
function fmt(sec){sec=Math.max(0,Math.ceil(sec));return `${Math.floor(sec/60).toString().padStart(2,"0")}:${(sec%60).toString().padStart(2,"0")}`;}

function renderPreview(){selectedScenarioIds=chooseScenarios();const box=$("scenarioPreview");box.innerHTML="";selectedScenarioIds.forEach((id,i)=>{const d=document.createElement("div");d.className="scenarioCard";d.innerHTML=`<b>${i+1}. Scenario ${id}</b><br><span class="muted">${SCENARIOS[id].title}</span>`;box.appendChild(d);});const cov=coverage(selectedScenarioIds);$("coverageBox").innerHTML=`<strong>필수 동작 포함 확인: <span class="ok">${REQUIRED_ACTIVITIES.filter(x=>cov.has(x)).length} / ${REQUIRED_ACTIVITIES.length} ✓</span></strong><br><span class="note">선택 조합: ${selectedScenarioIds.join(" → ")}</span>`;showOnly("previewScreen");}
function buildSequence(){sequence=[];selectedScenarioIds.forEach((sid,sidx)=>{SCENARIOS[sid].activities.forEach((a,aidx)=>sequence.push({...a,scenario_id:sid,scenario_title:SCENARIOS[sid].title,scenario_execution_order:sidx+1,activity_order_in_scenario:aidx+1}));});}
function resetActivityState(){if(timerHandle){clearInterval(timerHandle);timerHandle=null;}currentActivityStart=null;activityStarted=false;activityCompleted=false;activityPaused=false;activityPauseStartMs=null;activityPauseAccumMs=0;activityPauseCount=0;activityRemainingSec=null;$("pauseBanner").classList.add("hidden");$("pauseActivityBtn").textContent="⏸ 일시정지";}
function renderActivity(){resetActivityState();const a=sequence[currentIndex];$("scenarioProgress").textContent=`Scenario ${a.scenario_id} · ${a.scenario_execution_order} / ${selectedScenarioIds.length}  |  ${a.scenario_title}`;$("progress").textContent=`현재 동작 ${a.activity_order_in_scenario} / ${SCENARIOS[a.scenario_id].activities.length}  ·  전체 ${currentIndex+1} / ${sequence.length}`;$("activityName").textContent=a.name;$("activityCategory").textContent=a.category;$("binaryLabel").textContent=`분석 라벨: ${a.binary}`;$("activityInstruction").textContent=a.instruction;$("activityTarget").textContent=a.targetText;$("prevActivityBtn").disabled=currentIndex===0;$("pauseActivityBtn").disabled=true;$("readyPanel").classList.remove("hidden");$("runningPanel").classList.add("hidden");$("timer").textContent=a.mode==="time"?fmt(a.target):"";showOnly("activityScreen");speak(a.instruction);}
function beginActivity(){$("readyPanel").classList.add("hidden");$("runningPanel").classList.remove("hidden");$("prevActivityBtn").disabled=false;$("pauseActivityBtn").disabled=false;startActivity();}
function runTimeTimer(){if(timerHandle)clearInterval(timerHandle);timerHandle=setInterval(()=>{if(activityPaused)return;activityRemainingSec--;$("timer").textContent=fmt(activityRemainingSec);if(activityRemainingSec<=0){clearInterval(timerHandle);timerHandle=null;finishActivity(true);}},1000);}
function startActivity(){const a=sequence[currentIndex];currentActivityStart=Date.now();activityStarted=true;$("runningStatus").textContent="동작 진행 중";if(a.mode==="time"){activityRemainingSec=a.target;$("timer").textContent=fmt(activityRemainingSec);runTimeTimer();}else $("timer").textContent="";}
function toggleActivityPause(){if(!activityStarted||activityCompleted)return;if(!activityPaused){activityPaused=true;activityPauseStartMs=Date.now();activityPauseCount++;if(timerHandle){clearInterval(timerHandle);timerHandle=null;}if("speechSynthesis" in window)speechSynthesis.cancel();$("pauseActivityBtn").textContent="▶ 계속하기";$("pauseBanner").classList.remove("hidden");$("runningStatus").textContent="일시정지 중";}else{if(activityPauseStartMs)activityPauseAccumMs+=Date.now()-activityPauseStartMs;activityPauseStartMs=null;activityPaused=false;$("pauseActivityBtn").textContent="⏸ 일시정지";$("pauseBanner").classList.add("hidden");$("runningStatus").textContent="동작 진행 중";if(sequence[currentIndex].mode==="time")runTimeTimer();speak("계속 진행해주세요.");}}
function finishActivity(autoFinished=false){if(activityCompleted)return;if(timerHandle){clearInterval(timerHandle);timerHandle=null;}if(activityPaused&&activityPauseStartMs){activityPauseAccumMs+=Date.now()-activityPauseStartMs;activityPauseStartMs=null;activityPaused=false;}const end=Date.now();activityCompleted=true;$("pauseActivityBtn").disabled=true;$("pauseBanner").classList.add("hidden");const a=sequence[currentIndex],wall=(end-currentActivityStart)/1000,pause=activityPauseAccumMs/1000;logs.push({subject_id:subjectId,selected_scenario_count:scenarioCount,selected_scenarios:selectedScenarioIds.join("-"),scenario_id:a.scenario_id,scenario_title:a.scenario_title,scenario_execution_order:a.scenario_execution_order,activity_order_in_scenario:a.activity_order_in_scenario,global_order:currentIndex+1,activity_id:a.id,activity_name:a.name,category:a.category,binary_label:a.binary,target:a.targetText,start_ms:currentActivityStart,start_iso:new Date(currentActivityStart).toISOString(),end_ms:end,end_iso:new Date(end).toISOString(),duration_sec:wall.toFixed(3),pause_count:activityPauseCount,pause_duration_sec:pause.toFixed(3),active_duration_sec:Math.max(0,wall-pause).toFixed(3),completion_type:autoFinished?"AUTO_TIMER":"MANUAL_BUTTON"});goNext();}
function goNext(){if(currentIndex>=sequence.length-1){showOnly("finishScreen");speak("모든 시나리오가 완료되었습니다.");return;}currentIndex++;renderActivity();}
function previousActivity(){if(currentIndex===0)return;if(activityStarted||activityCompleted){if(!confirm("이전 동작으로 돌아가면 현재 동작과 이후 기록은 취소됩니다. 이동할까요?"))return;}if(timerHandle){clearInterval(timerHandle);timerHandle=null;}if("speechSynthesis" in window)speechSynthesis.cancel();const target=currentIndex-1;logs=logs.filter(r=>Number(r.global_order)<target+1);currentIndex=target;renderActivity();}
function csvEscape(v){const s=String(v??"");return `"${s.replaceAll('"','""')}"`;}
function downloadCsv(){const h=["subject_id","selected_scenario_count","selected_scenarios","scenario_id","scenario_title","scenario_execution_order","activity_order_in_scenario","global_order","activity_id","activity_name","category","binary_label","target","start_ms","start_iso","end_ms","end_iso","duration_sec","pause_count","pause_duration_sec","active_duration_sec","completion_type"];const rows=[h.join(",")];for(const r of logs)rows.push(h.map(k=>csvEscape(r[k])).join(","));const blob=new Blob(["\uFEFF"+rows.join("\r\n")],{type:"text/csv;charset=utf-8"}),a=document.createElement("a");const stamp=new Date().toISOString().replaceAll(":","-").replace("T","_").slice(0,19);a.href=URL.createObjectURL(blob);a.download=`${subjectId}_SCENARIO_${selectedScenarioIds.join("")}_${stamp}_protocol.csv`;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},1000);}
function abortSession(){if(confirm("현재 실험을 종료할까요? 지금까지 기록된 CSV는 저장할 수 있습니다.")){if(timerHandle)clearInterval(timerHandle);if("speechSynthesis" in window)speechSynthesis.cancel();showOnly("finishScreen");}}

$("count3Btn").onclick=()=>{scenarioCount=3;$("count3Btn").classList.add("active");$("count4Btn").classList.remove("active");};
$("count4Btn").onclick=()=>{scenarioCount=4;$("count4Btn").classList.add("active");$("count3Btn").classList.remove("active");};
$("generateScenarios").onclick=()=>{subjectId=$("subjectId").value.trim();if(!subjectId){alert("대상자 ID를 입력해주세요.");return;}voiceEnabled=$("voiceOn").value==="on";renderPreview();};
$("rerollBtn").onclick=renderPreview;
$("confirmStart").onclick=()=>{buildSequence();currentIndex=0;logs=[];if(voiceEnabled)speak("통합 시나리오 실험을 시작합니다.");renderActivity();};
$("readyStart").onclick=beginActivity;$("manualComplete").onclick=()=>finishActivity(false);$("prevActivityBtn").onclick=previousActivity;$("pauseActivityBtn").onclick=toggleActivityPause;$("abortSession").onclick=abortSession;$("downloadCsv").onclick=downloadCsv;$("newSession").onclick=()=>location.reload();

if("serviceWorker" in navigator){window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js"));}
