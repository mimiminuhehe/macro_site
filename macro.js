(function() {
  if (document.getElementById('macro-pro-panel')) {
    alert('이미 매크로 패널이 실행 중입니다.');
    return;
  }

  // 1. 스타일 주입
  const style = document.createElement('style');
  style.innerHTML = `
    #macro-pro-panel {
      position: fixed; top: 20px; right: 20px; width: 340px; background: #ffffff;
      border: 1px solid #d0d7de; border-radius: 10px; padding: 14px; z-index: 999999;
      box-shadow: 0 8px 24px rgba(140, 149, 159, 0.2); font-family: -apple-system, sans-serif; font-size: 12px; color: #24292f;
    }
    #macro-pro-panel * { box-sizing: border-box; margin: 0; padding: 0; }
    .mp-header { font-size: 14px; font-weight: 700; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e1e4e8; padding-bottom: 8px; color: #1f2328; }
    .mp-section { margin-bottom: 10px; display: flex; flex-direction: column; gap: 5px; }
    .mp-label { font-weight: 600; color: #57606a; font-size: 11px; }
    .mp-input { width: 100%; padding: 6px 8px; font-size: 12px; border: 1px solid #d0d7de; border-radius: 6px; outline: none; }
    .mp-input:focus { border-color: #0969da; box-shadow: 0 0 0 3px rgba(9, 105, 218, 0.15); }
    .mp-row { display: flex; gap: 6px; }
    .mp-btn { padding: 6px 10px; font-size: 11px; background: #f6f8fa; border: 1px solid #d0d7de; border-radius: 6px; cursor: pointer; font-weight: 600; color: #24292f; transition: background 0.15s; }
    .mp-btn:hover { background: #f3f4f6; border-color: #8c959f; }
    .mp-list { height: 120px; overflow-y: auto; border: 1px solid #e1e4e8; border-radius: 6px; padding: 4px; background: #f8f9fa; display: flex; flex-direction: column; gap: 4px; }
    .mp-item { background: #ffffff; padding: 6px 8px; border: 1px solid #d0d7de; border-radius: 5px; display: flex; align-items: center; justify-content: space-between; font-size: 11px; }
    .mp-item.exec { background: #dafbe1; border-color: #2ea44f; font-weight: bold; }
    .mp-action-btn { flex: 1; padding: 8px; font-weight: 700; border: none; border-radius: 6px; color: #fff; cursor: pointer; font-size: 12px; }
    .mp-start { background: #2ea44f; } .mp-start:hover { background: #2c974b; }
    .mp-stop { background: #cf222e; } .mp-stop:hover { background: #a40e26; }
    .mp-log { font-family: monospace; font-size: 10px; background: #1b1f23; color: #00ff66; padding: 8px; height: 75px; overflow-y: auto; border-radius: 6px; white-space: pre-wrap; line-height: 1.3; }

    /* 드래그 가능한 핀 아이콘 */
    .macro-drag-pin {
      position: absolute; width: 28px; height: 28px; background-color: #0969da; color: white;
      border: 2px solid #ffffff; border-radius: 50%; display: flex; align-items: center; justify-content: center;
      font-weight: bold; font-size: 11px; box-shadow: 0 4px 10px rgba(0,0,0,0.3); cursor: grab; z-index: 99998;
      transform: translate(-50%, -50%); user-select: none;
    }
    .macro-drag-pin:active { cursor: grabbing; background-color: #1f883d; }
  `;
  document.head.appendChild(style);

  // 2. 패널 UI 생성
  const panel = document.createElement('div');
  panel.id = 'macro-pro-panel';
  panel.innerHTML = `
    <div class="mp-header">
      <span>🖱️ 오토마우스 매크로</span>
      <button class="mp-btn" id="mp-close" style="padding: 2px 6px;">✕</button>
    </div>
    
    <div class="mp-section">
      <span class="mp-label">클릭 위치 지정</span>
      <button class="mp-btn" id="mp-add-pin" style="background: #ddf4ff; color: #0969da; border-color: #0969da;">📍 클릭 핀 추가 (마우스로 끌어서 이동)</button>
    </div>

    <div class="mp-section">
      <span class="mp-label">휠 스크롤 설정</span>
      <div class="mp-row">
        <input type="number" id="mp-scroll-dist" class="mp-input" value="300" placeholder="px">
        <button class="mp-btn" style="flex:1;" id="mp-add-down">📜 휠 내리기</button>
        <button class="mp-btn" style="flex:1;" id="mp-add-up">📜 휠 올리기</button>
      </div>
    </div>

    <div class="mp-section">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <span class="mp-label">시나리오 순서</span>
        <button class="mp-btn" id="mp-clear" style="font-size:10px; padding:2px 6px;">전체 삭제</button>
      </div>
      <div class="mp-list" id="mp-step-list">
        <div style="color:#8c959f; text-align:center; padding:20px 0;">핀이나 스크롤을 추가하세요.</div>
      </div>
    </div>

    <div class="mp-section">
      <div class="mp-row">
        <div style="flex:1;">
          <span class="mp-label">스텝 대기(초)</span>
          <input type="number" id="mp-delay" class="mp-input" value="1" min="0.1" step="0.1">
        </div>
        <div style="flex:1;">
          <span class="mp-label">반복 횟수 (0=무한)</span>
          <input type="number" id="mp-loops" class="mp-input" value="0" min="0">
        </div>
      </div>
    </div>

    <div class="mp-row" style="margin-top: 4px;">
      <button class="mp-action-btn mp-start" id="mp-start">시나리오 시작</button>
      <button class="mp-action-btn mp-stop" id="mp-stop" disabled>중지</button>
    </div>

    <div class="mp-section" style="margin-top: 8px;">
      <span class="mp-label">실행 로그</span>
      <div class="mp-log" id="mp-log">> 패널 로드 완료. 핀을 추가해 시작하세요.</div>
    </div>
  `;
  document.body.appendChild(panel);

  let steps = [];
  let pinCounter = 0;
  let isRunning = false;

  function log(msg) {
    const box = document.getElementById('mp-log');
    box.innerText += '\n' + msg;
    box.scrollTop = box.scrollHeight;
  }

  // 패널 닫기
  document.getElementById('mp-close').onclick = () => {
    isRunning = false;
    document.querySelectorAll('.macro-drag-pin').forEach(p => p.remove());
    panel.remove();
    style.remove();
  };

  // 📍 안정적으로 개선된 드래그 핀 추가 기능
  document.getElementById('mp-add-pin').onclick = () => {
    pinCounter++;
    const pinId = `macro-pin-${pinCounter}`;
    
    const pin = document.createElement('div');
    pin.className = 'macro-drag-pin';
    pin.id = pinId;
    pin.innerText = pinCounter;
    
    // 페이지 스크롤 위치를 고려한 화면 중앙에 배치 (절대 좌표 기준)
    let posX = window.pageXOffset + window.innerWidth / 2 + (pinCounter * 20 - 40);
    let posY = window.pageYOffset + window.innerHeight / 2 + (pinCounter * 20 - 40);
    
    pin.style.left = `${posX}px`;
    pin.style.top = `${posY}px`;
    document.body.appendChild(pin);

    // 향상된 드래그 이벤트 (document 단위 추적)
    pin.addEventListener('mousedown', (e) => {
      e.preventDefault();
      
      const shiftX = e.clientX - pin.getBoundingClientRect().left;
      const shiftY = e.clientY - pin.getBoundingClientRect().top;

      function onMouseMove(e) {
        let newX = e.clientX - shiftX + window.pageXOffset;
        let newY = e.clientY - shiftY + window.pageYOffset;
        pin.style.left = `${newX}px`;
        pin.style.top = `${newY}px`;
      }

      function onMouseUp() {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      }

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });

    steps.push({
      type: 'click',
      pinId: pinId,
      name: `📍 클릭 (핀 #${pinCounter})`
    });

    renderSteps();
    log(`📍 핀 #${pinCounter} 생성됨 (마우스로 드래그하여 위치 조절 가능)`);
  };

  // 📜 휠 내리기 추가
  document.getElementById('mp-add-down').onclick = () => {
    const dist = parseInt(document.getElementById('mp-scroll-dist').value) || 300;
    steps.push({ type: 'scroll', amount: dist, name: `📜 휠 내리기 (${dist}px)` });
    renderSteps();
    log(`휠 내리기 추가 (${dist}px)`);
  };

  // 📜 휠 올리기 추가
  document.getElementById('mp-add-up').onclick = () => {
    const dist = parseInt(document.getElementById('mp-scroll-dist').value) || 300;
    steps.push({ type: 'scroll', amount: -dist, name: `📜 휠 올리기 (${dist}px)` });
    renderSteps();
    log(`휠 올리기 추가 (${dist}px)`);
  };

  function renderSteps() {
    const listEl = document.getElementById('mp-step-list');
    listEl.innerHTML = '';
    if(steps.length === 0) {
      listEl.innerHTML = '<div style="color:#8c959f; text-align:center; padding:20px 0;">핀이나 스크롤을 추가하세요.</div>';
      return;
    }
    steps.forEach((s, idx) => {
      const div = document.createElement('div');
      div.className = 'mp-item';
      div.id = `mp-step-${idx}`;
      div.innerHTML = `<span><b>${idx+1}.</b> ${s.name}</span> <button class="mp-btn" style="padding:2px 6px;" onclick="window.mpRemove(${idx})">삭제</button>`;
      listEl.appendChild(div);
    });
  }

  window.mpRemove = function(idx) {
    const s = steps[idx];
    if(s.type === 'click') {
      const pin = document.getElementById(s.pinId);
      if(pin) pin.remove();
    }
    steps.splice(idx, 1);
    renderSteps();
    log('스텝 삭제됨');
  };

  document.getElementById('mp-clear').onclick = () => {
    document.querySelectorAll('.macro-drag-pin').forEach(p => p.remove());
    steps = [];
    pinCounter = 0;
    renderSteps();
    log('모든 스텝 및 핀 초기화됨');
  };

  // ▶️ 시나리오 시작
  document.getElementById('mp-start').onclick = async () => {
    if(steps.length === 0) {
      alert('실행할 스텝을 최소 1개 이상 추가하세요.');
      return;
    }

    isRunning = true;
    document.getElementById('mp-start').disabled = true;
    document.getElementById('mp-stop').disabled = false;

    const delay = (parseFloat(document.getElementById('mp-delay').value) || 1) * 1000;
    const maxLoops = parseInt(document.getElementById('mp-loops').value) || 0;
    let currentLoop = 0;

    log('▶️ 매크로 시나리오 시작');

    while(isRunning) {
      currentLoop++;
      log(`=== [회차 ${currentLoop}] 시작 ===`);

      for(let i = 0; i < steps.length; i++) {
        if(!isRunning) break;

        const stepEl = document.getElementById(`mp-step-${i}`);
        if(stepEl) stepEl.classList.add('exec');

        const s = steps[i];
        if(s.type === 'click') {
          const pin = document.getElementById(s.pinId);
          if(pin) {
            const rect = pin.getBoundingClientRect();
            const clientX = rect.left + rect.width / 2;
            const clientY = rect.top + rect.height / 2;

            const targetEl = document.elementFromPoint(clientX, clientY);
            if(targetEl) {
              targetEl.click();
              log(`📍 클릭 성공: 핀 #${pin.innerText} 위치`);
            } else {
              log(`⚠️ 핀 위치에 클릭할 요소가 없습니다.`);
            }
          }
        } else if(s.type === 'scroll') {
          window.scrollBy({ top: s.amount, behavior: 'smooth' });
          log(`📜 스크롤 실행 (${s.amount}px)`);
        }

        await new Promise(r => setTimeout(r, delay));
        if(stepEl) stepEl.classList.remove('exec');
      }

      if(maxLoops > 0 && currentLoop >= maxLoops) {
        log(`✅ 지정 반복 횟수(${maxLoops}회) 완료`);
        document.getElementById('mp-stop').click();
        break;
      }
    }
  };

  document.getElementById('mp-stop').onclick = () => {
    isRunning = false;
    document.getElementById('mp-start').disabled = false;
    document.getElementById('mp-stop').disabled = true;
    document.querySelectorAll('.mp-item').forEach(el => el.classList.remove('exec'));
    log('⏹ 매크로 중지됨');
  };
})();
