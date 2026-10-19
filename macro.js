(function() {
  if (document.getElementById('macro-full-panel')) {
    alert('이미 매크로 패널이 실행 중입니다.');
    return;
  }

  // 스타일 주입
  const style = document.createElement('style');
  style.innerHTML = `
    #macro-full-panel {
      position: fixed; top: 20px; right: 20px; width: 360px; background: #fff;
      border: 2px solid #0969da; border-radius: 8px; padding: 16px; z-index: 999999;
      box-shadow: 0 4px 16px rgba(0,0,0,0.3); font-family: -apple-system, sans-serif; font-size: 12px; color: #24292f;
    }
    #macro-full-panel * { box-sizing: border-box; margin: 0; padding: 0; }
    .mf-title { font-size: 15px; font-weight: bold; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #f0f2f5; padding-bottom: 6px; }
    .mf-group { margin-bottom: 10px; display: flex; flex-direction: column; gap: 4px; }
    .mf-label { font-weight: bold; color: #57606a; font-size: 11px; }
    .mf-input { width: 100%; padding: 6px; font-size: 12px; border: 1px solid #ced4da; border-radius: 4px; }
    .mf-row { display: flex; gap: 6px; }
    .mf-btn { padding: 6px 10px; font-size: 11px; background: #f6f8fa; border: 1px solid #d0d7de; border-radius: 4px; cursor: pointer; font-weight: 500; }
    .mf-btn:hover { background: #eef1f4; }
    .mf-list { height: 130px; overflow-y: auto; border: 1px solid #e1e4e8; border-radius: 4px; padding: 4px; background: #f8f9fa; display: flex; flex-direction: column; gap: 4px; }
    .mf-item { background: #fff; padding: 5px; border: 1px solid #d0d7de; border-radius: 4px; display: flex; align-items: center; justify-content: space-between; }
    .mf-item.exec { background: #dafbe1; border-color: #2ea44f; }
    .mf-action-btn { flex: 1; padding: 8px; font-weight: bold; border: none; border-radius: 4px; color: #fff; cursor: pointer; }
    .mf-start { background: #2ea44f; } .mf-start:hover { background: #2c974b; }
    .mf-stop { background: #cf222e; } .mf-stop:hover { background: #a40e26; }
    .mf-log { font-family: monospace; font-size: 10px; background: #1b1f23; color: #00ff66; padding: 6px; height: 80px; overflow-y: auto; border-radius: 4px; white-space: pre-wrap; }
  `;
  document.head.appendChild(style);

  // 패널 UI 생성
  const panel = document.createElement('div');
  panel.id = 'macro-full-panel';
  panel.innerHTML = `
    <div class="mf-title">
      <span>웹 자동화 매크로 패널</span>
      <button class="mf-btn" id="mf-close">×</button>
    </div>
    
    <div class="mf-group">
      <span class="mf-label">클릭 대상 (CSS 선택자)</span>
      <input type="text" id="mf-selector" class="mf-input" placeholder="예: #submit-btn 또는 .btn">
      <button class="mf-btn" id="mf-add-click">🎯 클릭 액션 추가</button>
    </div>

    <div class="mf-group">
      <span class="mf-label">휠 스크롤 거리 (픽셀)</span>
      <div class="mf-row">
        <input type="number" id="mf-scroll-dist" class="mf-input" value="300" placeholder="px">
        <button class="mf-btn" style="flex:1;" id="mf-add-down">📜 휠 내리기</button>
        <button class="mf-btn" style="flex:1;" id="mf-add-up">📜 휠 올리기</button>
      </div>
    </div>

    <div class="mf-group">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <span class="mf-label">시나리오 순서</span>
        <button class="mf-btn" style="font-size:10px; padding:2px 6px;" id="mf-clear">전체 삭제</button>
      </div>
      <div class="mf-list" id="mf-step-list">
        <div style="color:#8c959f; text-align:center; padding:10px;">등록된 액션이 없습니다.</div>
      </div>
    </div>

    <div class="mf-group">
      <div class="mf-row">
        <div style="flex:1;">
          <span class="mf-label">스텝 대기(초)</span>
          <input type="number" id="mf-delay" class="mf-input" value="1" min="0.1" step="0.1">
        </div>
        <div style="flex:1;">
          <span class="mf-label">반복 횟수 (0=무한)</span>
          <input type="number" id="mf-loops" class="mf-input" value="0" min="0">
        </div>
      </div>
    </div>

    <div class="mf-row" style="margin-top:4px;">
      <button class="mf-action-btn mf-start" id="mf-start">시나리오 시작</button>
      <button class="mf-action-btn mf-stop" id="mf-stop" disabled>중지</button>
    </div>

    <div class="mf-group" style="margin-top:8px;">
      <span class="mf-label">실행 로그</span>
      <div class="mf-log" id="mf-log">> 매크로 패널 로드 완료</div>
    </div>
  `;
  document.body.appendChild(panel);

  let steps = [];
  let isRunning = false;

  function log(msg) {
    const box = document.getElementById('mf-log');
    box.innerText += '\n' + msg;
    box.scrollTop = box.scrollHeight;
  }

  document.getElementById('mf-close').onclick = () => {
    isRunning = false;
    panel.remove();
    style.remove();
  };

  document.getElementById('mf-add-click').onclick = () => {
    const selector = document.getElementById('mf-selector').value.trim();
    if(!selector) {
      alert('클릭할 요소의 CSS 선택자를 입력해주세요!');
      return;
    }
    steps.push({ type: 'click', selector: selector, name: `🎯 클릭: ${selector}` });
    renderSteps();
    log(`클릭 추가: ${selector}`);
  };

  document.getElementById('mf-add-down').onclick = () => {
    const dist = parseInt(document.getElementById('mf-scroll-dist').value) || 300;
    steps.push({ type: 'scroll', amount: dist, name: `📜 휠 내리기 (${dist}px)` });
    renderSteps();
    log(`휠 내리기 추가 (${dist}px)`);
  };

  document.getElementById('mf-add-up').onclick = () => {
    const dist = parseInt(document.getElementById('mf-scroll-dist').value) || 300;
    steps.push({ type: 'scroll', amount: -dist, name: `📜 휠 올리기 (${dist}px)` });
    renderSteps();
    log(`휠 올리기 추가 (${dist}px)`);
  };

  function renderSteps() {
    const listEl = document.getElementById('mf-step-list');
    listEl.innerHTML = '';
    if(steps.length === 0) {
      listEl.innerHTML = '<div style="color:#8c959f; text-align:center; padding:10px;">등록된 액션이 없습니다.</div>';
      return;
    }
    steps.forEach((s, idx) => {
      const div = document.createElement('div');
      div.className = 'mf-item';
      div.id = `mf-step-${idx}`;
      div.innerHTML = `<span><b>${idx+1}.</b> ${s.name}</span> <button class="mf-btn" style="padding:2px 6px;" onclick="window.mfRemove(${idx})">삭제</button>`;
      listEl.appendChild(div);
    });
  }

  window.mfRemove = function(idx) {
    steps.splice(idx, 1);
    renderSteps();
    log('스텝 삭제됨');
  };

  document.getElementById('mf-clear').onclick = () => {
    steps = [];
    renderSteps();
    log('전체 스텝 삭제됨');
  };

  document.getElementById('mf-start').onclick = async () => {
    if(steps.length === 0) {
      alert('실행할 스텝을 최소 1개 이상 추가하세요.');
      return;
    }

    isRunning = true;
    document.getElementById('mf-start').disabled = true;
    document.getElementById('mf-stop').disabled = false;

    const delay = (parseFloat(document.getElementById('mf-delay').value) || 1) * 1000;
    const maxLoops = parseInt(document.getElementById('mf-loops').value) || 0;
    let currentLoop = 0;

    log('▶️ 매크로 시나리오 시작');

    while(isRunning) {
      currentLoop++;
      log(`=== [회차 ${currentLoop}] 시작 ===`);

      for(let i = 0; i < steps.length; i++) {
        if(!isRunning) break;

        const stepEl = document.getElementById(`mf-step-${i}`);
        if(stepEl) stepEl.classList.add('exec');

        const s = steps[i];
        if(s.type === 'click') {
          const el = document.querySelector(s.selector);
          if(el) {
            el.click();
            log(`🎯 클릭 성공: ${s.selector}`);
          } else {
            log(`⚠️ 요소 없음: ${s.selector}`);
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
        document.getElementById('mf-stop').click();
        break;
      }
    }
  };

  document.getElementById('mf-stop').onclick = () => {
    isRunning = false;
    document.getElementById('mf-start').disabled = false;
    document.getElementById('mf-stop').disabled = true;
    document.querySelectorAll('.mf-item').forEach(el => el.classList.remove('exec'));
    log('⏹ 매크로 중지됨');
  };
})();
