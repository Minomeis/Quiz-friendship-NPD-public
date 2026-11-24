// 页面状态仅保存在内存；刷新及重新测试均清除本次朋友信息和答案。
(function () {
  'use strict';
  const data = window.QuizData;
  const scoring = window.QuizScoring;
  const visual = window.QuizVisual;
  const app = document.getElementById('app');
  let answers = Array(24);
  let nickname = '';
  let current = 0;
  let result = null;
  let moving = false;
  let exporting = false;
  let imageURL = null;
  const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const paragraphs = values => values.map(text => `<p>${escape(text)}</p>`).join('');
  const items = values => values.map(text => `<li>${escape(text)}</li>`).join('');

  function focusView() {
    const heading = app.querySelector('h1');
    heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }

  function showHome() {
    app.innerHTML = `<div class="home-grid">
      <section class="hero" aria-labelledby="home-title">
        <p class="eyebrow">友情中的自恋型行为识别测试</p>
        <h1 id="home-title">测测你身边<br>有没有隐藏的<br><span>NPD特征</span></h1>
        <p class="subtitle">${escape(data.subtitle)}</p>
        <svg class="relationship-art" viewBox="0 0 420 160" aria-hidden="true"><circle cx="166" cy="80" r="63" fill="none" stroke="#8893b8" stroke-width="1"/><circle cx="248" cy="80" r="63" fill="none" stroke="#a7d2c4" stroke-width="1.5"/><circle cx="166" cy="80" r="43" fill="none" stroke="#8893b8" stroke-width="1" stroke-dasharray="3 7"/><circle cx="248" cy="80" r="43" fill="none" stroke="#a7d2c4" stroke-width="1" stroke-dasharray="3 7"/><circle cx="207" cy="80" r="7" fill="#b9dcd4"/><path d="M30 80h55m244 0h55" stroke="#8893b8" stroke-width="1"/><circle cx="30" cy="80" r="3" fill="#8893b8"/><circle cx="384" cy="80" r="3" fill="#a7d2c4"/></svg>
        <div class="hero-bottom"><div><strong>24</strong>道情境题</div><div><strong>6</strong>个维度</div><div><strong>9</strong>种关系类型</div></div>
      </section>
      <section class="home-side"><p class="eyebrow">从一段真实的友情开始</p><h2>看见相处的细节，<br>也看见自己的感受。</h2>
        <div class="intro">${paragraphs(data.intro)}</div>
        <form id="start-form" class="start-form"><label for="nickname">朋友昵称 <span>（选填，仅在本机使用）</span></label><input id="nickname" type="text" maxlength="30" autocomplete="off" placeholder="用一个你熟悉的称呼" aria-describedby="privacy"><button class="button primary" type="submit">开始测试</button><div id="privacy" class="privacy"><span>约 3～5 分钟</span><span>本地计算 · 无需登录</span></div></form>
        <p class="disclaimer">${escape(data.shortDisclaimer)}</p>
      </section>
      <div class="home-note"><strong>一份行为观察，给关系多一点清晰。</strong><span>六维负向行为分析 · 正向品质评价 · 专属相处建议</span></div>
    </div>`;
    app.querySelector('#start-form').addEventListener('submit', event => {
      event.preventDefault(); nickname = app.querySelector('#nickname').value.trim(); current = 0; showQuestion(); focusView();
    });
  }

  function showQuestion() {
    const question = data.questions[current];
    const count = answers.filter(value => value !== undefined).length;
    app.innerHTML = `<section class="quiz-shell" aria-label="友情行为测试答题">
      <div class="quiz-top"><strong>第 ${current + 1} 题 / 24</strong><span class="muted" id="answered-count">已作答 ${count} / 24</span></div>
      <div class="progress-track" role="progressbar" aria-label="作答进度" aria-valuemin="0" aria-valuemax="24" aria-valuenow="${count}"><span style="width:${count / 24 * 100}%"></span></div>
      <div class="question-card"><p class="question-caption">回想实际经历，选择最贴近的一项</p><h1 id="question-title">${escape(question.text)}</h1>
        <fieldset class="options" aria-labelledby="question-title"><legend class="visually-hidden">选择行为发生频率</legend>${data.options.map(option => `<label class="option"><input type="radio" name="answer" value="${option.key}" ${answers[current] === option.value ? 'checked' : ''}><span class="letter" aria-hidden="true">${option.key}</span><span>${escape(option.text)}</span></label>`).join('')}</fieldset>
        <div class="quiz-nav"><button class="button secondary" id="previous" ${current === 0 || moving ? 'disabled' : ''}>上一题</button><button class="button primary" id="next" ${answers[current] === undefined || moving ? 'disabled' : ''}>${current === 23 ? '查看测试结果' : '下一题'}</button></div>
        <p class="selection-note" aria-live="polite">${answers[current] === undefined ? '请选择一项后继续；无法判断也可以如实选择。' : '已选择，可继续或随时修改。'}</p>
      </div>
      <details class="question-review"><summary>按题号返回修改</summary><div class="question-grid">${data.questions.map((q, i) => `<button class="question-jump ${answers[i] !== undefined ? 'answered' : ''} ${i === current ? 'current' : ''}" data-question="${i}" aria-label="第${i + 1}题，${answers[i] !== undefined ? '已作答' : '未作答'}" ${i === current ? 'aria-current="step"' : ''} ${moving ? 'disabled' : ''}>${i + 1}</button>`).join('')}</div></details>
      <p class="disclaimer">请始终围绕同一位朋友作答。没有遇到过或无法判断的情境无需猜测。刷新页面将清除本次答案。</p>
    </section>`;
    app.querySelectorAll('input[name=answer]').forEach(input => input.addEventListener('change', () => {
      answers[current] = data.options.find(option => option.key === input.value).value;
      result = null;
      const completed = answers.filter(value => value !== undefined).length;
      app.querySelector('#answered-count').textContent = `已作答 ${completed} / 24`;
      app.querySelector('[role=progressbar]').setAttribute('aria-valuenow', completed);
      app.querySelector('.progress-track span').style.width = `${completed / 24 * 100}%`;
      app.querySelector('#next').disabled = moving;
      app.querySelector('.selection-note').textContent = '已选择，可继续或随时修改。';
      const jump = app.querySelector(`[data-question="${current}"]`);
      jump.classList.add('answered'); jump.setAttribute('aria-label', `第${current + 1}题，已作答`);
    }));
    app.querySelector('#previous').addEventListener('click', () => navigate(current - 1));
    app.querySelector('#next').addEventListener('click', () => {
      if (answers[current] === undefined || moving) return;
      if (current < 23) navigate(current + 1);
      else {
        const missing = Array.from({ length: 24 }, (_, i) => i).find(i => answers[i] === undefined);
        if (missing !== undefined) { navigate(missing); return; }
        result = scoring.calculate(answers); showResult(); focusView();
      }
    });
    app.querySelectorAll('[data-question]').forEach(button => button.addEventListener('click', () => navigate(Number(button.dataset.question))));
  }

  function navigate(index) {
    if (moving || index < 0 || index > 23) return;
    moving = true; current = index; showQuestion(); focusView();
    // 短暂锁定导航，避免连点跳过已经作答的题目。
    setTimeout(() => {
      moving = false;
      const next = app.querySelector('#next');
      if (next) {
        next.disabled = answers[current] === undefined;
        app.querySelector('#previous').disabled = current === 0;
        app.querySelectorAll('[data-question]').forEach(button => { button.disabled = false; });
      }
    }, 240);
  }

  function knownScores() {
    return `<div class="partial-grid">${result.dimensions.map(d => `<div class="partial-cell"><h3>${escape(d.name)}</h3><p class="partial-note">${d.count} / 4 道有效观察 · ${d.valid ? '维度有效' : '样本不足'}</p><div class="partial-row"><span>${escape(d.quality)} P</span><strong>${visual.format(d.P)}</strong></div>${d.P !== null ? `<div class="bar positive"><span style="width:${d.P}%"></span></div>` : ''}<div class="partial-row"><span>负向行为 R</span><strong>${visual.format(d.R)}</strong></div>${d.R !== null ? `<div class="bar"><span style="width:${d.R}%"></span></div>` : ''}${d.R >= 75 ? '<span class="flag">重点关注：已知负向行为指数 ≥75</span>' : ''}</div>`).join('')}</div>`;
  }

  function qualities() {
    const sorted = result.dimensions.filter(d => d.P !== null && d.P >= 75).slice().sort((a, b) => b.P - a.P || a.order - b.order);
    return sorted.length ? sorted.map(d => `<div class="quality-item"><h3>${escape(d.quality)}<span>P ${visual.format(d.P)}</span></h3><p>${escape(d.positive)}</p>${d.R !== null && d.R >= 60 ? `<p class="coexist">${escape(data.copy.coexist)}</p>` : ''}</div>`).join('') : `<p class="muted">${escape(data.copy.positiveEmpty)}</p>`;
  }

  function concerns() {
    let dimensions = result.dimensions.filter(d => d.R !== null && d.R >= 60);
    const prominent = dimensions.length > 0;
    if (!prominent) dimensions = result.dimensions.filter(d => d.R !== null && d.R >= 30);
    dimensions.sort((a, b) => b.R - a.R || a.order - b.order);
    return dimensions.length ? dimensions.map(d => `<div class="quality-item">${d.R >= 75 ? '<span class="warning-mark">重点关注 · R ≥75</span>' : `<span class="warning-mark">${prominent ? '值得关注' : '进一步观察项'}</span>`}<h3 class="warning-title">${escape(d.name)}<span>R ${visual.format(d.R)}</span></h3><p>${escape(d.negative)}</p>${!prominent ? '<p class="small muted">这是进一步观察的线索，不代表严重问题。</p>' : ''}</div>`).join('') : `<p class="muted">${escape(data.copy.negativeLow)}</p>`;
  }

  function showResult() {
    const r = result;
    const types = r.main.map(id => data.types[id]);
    const tone = r.main[0] === 'T01' || r.main[0] === 'T02' ? 'positive' : !r.complete || r.main[0] === 'T03' ? 'neutral' : '';
    const score = r.complete ? `<section class="panel"><div class="score-layout"><div><p class="section-label">负向行为综合指数</p><div class="score" data-testid="overall-score">${visual.format(r.R)}<span>/ 100</span></div><p class="level-name">${escape(r.level)}</p></div><p class="muted small">六个负向维度的平均值<br>描述行为频率，不代表患病概率</p></div><div class="score-scale" aria-hidden="true">${data.levels.map(name => `<span class="${name === r.level ? 'active' : ''}"></span>`).join('')}</div><p class="legend">正向支持单独评价，不能抵消负向行为。</p></section>` : '';
    const chart = r.complete ? `<section class="panel"><div class="panel-title"><h2>六维负向行为画像</h2><span class="small muted">仅展示 R 值</span></div><p class="small muted">分数越高、越向外，代表负向行为越频繁。</p><div class="radar-wrap">${visual.radarSVG(r.dimensions)}</div><div class="dimension-grid">${r.dimensions.map(d => `<div class="dimension-cell ${d.R >= 75 ? 'high' : ''}">${escape(d.name)}<strong>${visual.format(d.R)}<span class="small muted"> / 100</span></strong>${d.R >= 75 ? '<span class="flag">重点关注 · R ≥75</span>' : ''}</div>`).join('')}</div></section>` : `<section class="panel"><h2>已有的观察数据</h2><p class="incomplete-banner">部分维度有效观察不足，暂不计算综合分或关系类型。未知不是零分，也不代表健康。以下 P / R 仅描述已知答案，未观察的部分不能据此推论。</p><p class="legend">P 越高表示正向支持越充分；R 越高表示负向行为越频繁。两者独立计算。</p>${knownScores()}</section>`;
    app.innerHTML = `<article class="report"><div class="report-topline"><p class="eyebrow">${nickname ? escape(nickname) + ' · ' : ''}你的友情观察报告</p><button class="text-button" id="edit">返回修改</button></div>
      <header class="report-hero ${tone}"><p class="eyebrow">${r.complete ? (types.length > 1 ? '并列主关系类型 · 多种模式同样突出' : '你的主关系类型') : '关系观察不足'}</p><h1>${r.complete ? types.map(t => `<span>${escape(t.name)}</span>`).join('') : '部分情境尚待观察'}</h1>${r.complete ? types.map(t => `<p class="type-quote">${escape(t.quote)}</p>`).join('') : '<p class="type-quote">如实选择“无法判断”，也是一份有价值的观察。</p>'}<div class="tags">${r.tags.map(tag => `<span class="tag">${escape(tag)}</span>`).join('')}</div></header>
      ${score}${chart}
      <section class="panel reading"><h2>NPD相关行为解读</h2><p style="margin-top:14px">${escape(r.interpretation)}</p></section>
      ${r.complete ? `<section class="panel analysis"><h2>你们的关系，可能如何相处</h2><p class="examples-note">典型表现是该模式的可能例子，并不代表你全部经历过。</p>${types.map(t => `<div class="type-section"><h3 style="margin-top:22px">${escape(t.name)} · 关系分析</h3>${paragraphs(t.analysis)}<h3 style="margin-top:22px">${t.id === 'T01' || t.id === 'T02' ? '值得珍惜的地方（典型表现）' : t.id === 'T03' ? '值得观察的地方' : '典型相处表现'}</h3><ul>${items(t.examples)}</ul></div>`).join('')}${r.secondary.length ? `<div class="secondary-types"><h3>同时出现的次要特征</h3>${r.secondary.map(id => { const t = data.types[id]; return `<div class="secondary-type"><h3>${escape(t.name)}</h3><blockquote>${escape(t.quote)}</blockquote><p>${escape(t.analysis[0])}</p></div>`; }).join('')}</div>` : ''}</section>
      <section class="panel"><h2>这段友情值得肯定的地方</h2><p class="legend">根据你的回答，以下正向支持较为充分。</p><div style="margin-top:20px">${qualities()}</div></section>
      <section class="panel"><h2>值得警惕或进一步观察的地方</h2><p class="legend">根据你报告的经历，关注行为的持续性及实际影响。</p><div style="margin-top:20px">${concerns()}</div></section>
      <section class="panel advice"><h2>给你的相处建议</h2>${types.map(t => `<div class="type-section"><h3 style="margin-top:20px">${escape(t.name)} · 五条建议</h3><ol>${items(t.advice)}</ol></div>`).join('')}</section>
      <section class="panel knowledge"><h2>心理学小知识</h2>${types.map(t => `<div><h3>${escape(t.name)}</h3><p>${escape(t.knowledge)}</p></div>`).join('')}<p class="legend">本问卷的题库及阈值均为原创产品规则，不是 DSM 诊断条目或正式量表，未经心理测量学验证。</p><div class="disclaimer"><h3>测试声明</h3><p>${escape(data.disclaimer)}</p></div></section>` : `<section class="panel advice"><h2>接下来，可以这样观察</h2><ol>${items(data.copy.insufficientAdvice)}</ol><p class="legend">不必为了得到完整结果而猜测；可返回修改，补充你确实经历过的情境。</p><div class="disclaimer"><h3>测试声明</h3><p>${escape(data.disclaimer)}</p></div></section>`}
      <div class="report-actions"><button class="button primary" id="save">保存简版结果图</button><button class="button secondary" id="restart">重新测试</button></div><p id="save-status" class="status" role="status"></p><div id="export-preview"></div>
    </article>`;
    app.querySelector('#edit').addEventListener('click', () => { current = 0; showQuestion(); focusView(); });
    app.querySelector('#restart').addEventListener('click', restart);
    app.querySelector('#save').addEventListener('click', saveResult);
  }

  async function saveResult() {
    if (exporting) return;
    const snapshot = result;
    const button = app.querySelector('#save');
    const status = app.querySelector('#save-status');
    exporting = true; button.disabled = true; status.textContent = '正在生成简版结果图…';
    try {
      const canvas = visual.drawSummary(snapshot);
      const blob = await new Promise((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('图片生成失败')), 'image/png'));
      // 返回修改或重测后，丢弃旧报告的异步导出结果。
      if (result !== snapshot || !button.isConnected) return;
      if (imageURL) URL.revokeObjectURL(imageURL);
      imageURL = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = imageURL; link.download = '友情观察报告.png'; document.body.appendChild(link); link.click(); link.remove();
      status.textContent = '图片已生成，已尝试下载。如未自动保存，可展开图片后长按保存，或直接截图。简版图不含朋友昵称。';
      app.querySelector('#export-preview').innerHTML = `<details class="export-preview"><summary>展开简版结果图</summary><img src="${imageURL}" alt="简版友情观察报告，不含朋友昵称"></details>`;
    } catch (error) {
      if (button.isConnected) status.textContent = '暂时无法生成图片，请直接截取结果页面保存。';
    } finally {
      exporting = false; if (button.isConnected) button.disabled = false;
    }
  }

  function restart() {
    if (imageURL) { URL.revokeObjectURL(imageURL); imageURL = null; }
    answers = Array(24); nickname = ''; current = 0; result = null; moving = false;
    showHome(); focusView();
  }

  showHome();
})();
