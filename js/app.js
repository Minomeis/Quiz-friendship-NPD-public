// 页面状态仅保存在内存；刷新及重新测试均清除本次朋友信息和答案。
(function () {
  'use strict';
  const data = window.QuizData;
  const scoring = window.QuizScoring;
  const visual = window.QuizVisual;
  const app = document.getElementById('app');
  const totalQuestions = data.questions.length;
  let answers = Array(totalQuestions);
  let nickname = '';
  let current = 0;
  let result = null;
  let moving = false;
  let exporting = false;
  let imageURL = null;
  const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const paragraphs = values => values.map(text => `<p>${escape(text)}</p>`).join('');
  const items = values => values.map(text => `<li>${escape(text)}</li>`).join('');
  const blocks = values => values.map(block => block.items ? `<${block.type}>${items(block.items)}</${block.type}>` : `<p${block.type === 'emphasis' ? ' class="emphasis"' : ''}>${escape(block.text)}</p>`).join('');

  function focusView() {
    const heading = app.querySelector('h1');
    heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }

  function showHome() {
    app.innerHTML = `<div class="home-grid">
      <section class="hero" aria-labelledby="home-title">
        <p class="eyebrow">${escape(data.formalName)}</p>
        <h1 id="home-title">测测你是不是<br>正在被消耗型朋友<br><span>慢慢透支</span></h1>
        <p class="subtitle">${escape(data.subtitle)}</p>
        <svg class="relationship-art" viewBox="0 0 420 160" aria-hidden="true"><circle cx="166" cy="80" r="63" fill="none" stroke="#b67d85" stroke-width="1"/><circle cx="248" cy="80" r="63" fill="none" stroke="#99565e" stroke-width="1.5"/><circle cx="166" cy="80" r="43" fill="none" stroke="#b67d85" stroke-width="1" stroke-dasharray="3 7"/><circle cx="248" cy="80" r="43" fill="none" stroke="#99565e" stroke-width="1" stroke-dasharray="3 7"/><circle cx="207" cy="80" r="7" fill="#99565e"/><path d="M30 80h55m244 0h55" stroke="#b67d85" stroke-width="1"/><circle cx="30" cy="80" r="3" fill="#b67d85"/><circle cx="384" cy="80" r="3" fill="#99565e"/></svg>
        <div class="hero-bottom"><div><strong>15</strong>道情境题</div><div><strong>60</strong>分满分</div><div><strong>4</strong>档关系提醒</div></div>
      </section>
      <section class="home-side"><p class="eyebrow">从一段真实的友情开始</p><h2>和TA相处，<br>你还能轻松做自己吗？</h2>
        <div class="intro">${paragraphs(data.intro)}</div>
        <form id="start-form" class="start-form"><label for="nickname">朋友昵称 <span>（选填，仅在本机使用）</span></label><input id="nickname" type="text" maxlength="30" autocomplete="off" placeholder="用一个你熟悉的称呼" aria-describedby="privacy"><button class="button primary" type="submit">开始测试</button><div id="privacy" class="privacy"><span>约 3～5 分钟</span><span>本地计算 · 无需登录</span></div></form>
        <p class="disclaimer">${escape(data.shortDisclaimer)}</p>
      </section>
      <div class="home-note"><strong>看清相处的模式，也照顾自己的感受。</strong><span>情绪消耗 · 单向付出 · 关系边界</span></div>
    </div>`;
    app.querySelector('#start-form').addEventListener('submit', event => {
      event.preventDefault(); nickname = app.querySelector('#nickname').value.trim(); current = 0; showQuestion(); focusView();
    });
  }

  function showQuestion() {
    const question = data.questions[current];
    const count = answers.filter(scoring.isValid).length;
    app.innerHTML = `<section class="quiz-shell" aria-label="友情关系测试答题">
      <div class="quiz-top"><strong>第 ${current + 1} 题 / 共 ${totalQuestions} 题</strong><span class="muted" id="answered-count">已作答 ${count} / ${totalQuestions}</span></div>
      <div class="progress-track" role="progressbar" aria-label="作答进度" aria-valuemin="0" aria-valuemax="${totalQuestions}" aria-valuenow="${count}"><span style="width:${count / totalQuestions * 100}%"></span></div>
      <div class="question-card"><p class="question-caption">回想同一位朋友过去半年到一年的实际表现</p><h1 id="question-title">${escape(question.title)}</h1><p id="question-description" class="question-description">${escape(question.text)}</p>
        <fieldset class="options" aria-labelledby="question-title" aria-describedby="question-description"><legend class="visually-hidden">选择行为发生频率</legend>${data.options.map(option => `<label class="option"><input type="radio" name="answer" value="${option.key}" ${answers[current] === option.value ? 'checked' : ''}><span class="letter" aria-hidden="true">${option.key}</span><span>${escape(option.text)}</span></label>`).join('')}</fieldset>
        <div class="quiz-nav"><button class="button secondary" id="previous" ${current === 0 || moving ? 'disabled' : ''}>上一题</button><button class="button primary" id="next" ${!scoring.isValid(answers[current]) || moving ? 'disabled' : ''}>${current === totalQuestions - 1 ? '查看测试结果' : '下一题'}</button></div>
        <p class="selection-note" aria-live="polite">${scoring.isValid(answers[current]) ? '已选择，可继续或随时修改。' : '请选择最贴近实际情况的一项后继续。'}</p>
      </div>
      <details class="question-review"><summary>按题号返回修改</summary><div class="question-grid">${data.questions.map((q, i) => `<button class="question-jump ${scoring.isValid(answers[i]) ? 'answered' : ''} ${i === current ? 'current' : ''}" data-question="${i}" aria-label="第${i + 1}题，${scoring.isValid(answers[i]) ? '已作答' : '未作答'}" ${i === current ? 'aria-current="step"' : ''} ${moving ? 'disabled' : ''}>${i + 1}</button>`).join('')}</div></details>
      <p class="disclaimer">请始终围绕同一位朋友作答，每题单选，全部完成后才能查看结果。刷新页面将清除本次答案。</p>
    </section>`;
    app.querySelectorAll('input[name=answer]').forEach(input => input.addEventListener('change', () => {
      answers[current] = data.options.find(option => option.key === input.value).value;
      result = null;
      const completed = answers.filter(scoring.isValid).length;
      app.querySelector('#answered-count').textContent = `已作答 ${completed} / ${totalQuestions}`;
      app.querySelector('[role=progressbar]').setAttribute('aria-valuenow', completed);
      app.querySelector('.progress-track span').style.width = `${completed / totalQuestions * 100}%`;
      app.querySelector('#next').disabled = moving;
      app.querySelector('.selection-note').textContent = '已选择，可继续或随时修改。';
      const jump = app.querySelector(`[data-question="${current}"]`);
      jump.classList.add('answered'); jump.setAttribute('aria-label', `第${current + 1}题，已作答`);
    }));
    app.querySelector('#previous').addEventListener('click', () => navigate(current - 1));
    app.querySelector('#next').addEventListener('click', () => {
      if (!scoring.isValid(answers[current]) || moving) return;
      if (current < totalQuestions - 1) navigate(current + 1);
      else {
        const missing = Array.from({ length: totalQuestions }, (_, i) => i).find(i => !scoring.isValid(answers[i]));
        if (missing !== undefined) { navigate(missing); return; }
        result = scoring.calculate(answers);
        if (result) { showResult(); focusView(); }
      }
    });
    app.querySelectorAll('[data-question]').forEach(button => button.addEventListener('click', () => navigate(Number(button.dataset.question))));
  }

  function navigate(index) {
    if (moving || index < 0 || index >= totalQuestions) return;
    moving = true; current = index; showQuestion(); focusView();
    // 短暂锁定导航，避免连点跳过已经作答的题目。
    setTimeout(() => {
      moving = false;
      const next = app.querySelector('#next');
      if (next) {
        next.disabled = !scoring.isValid(answers[current]);
        app.querySelector('#previous').disabled = current === 0;
        app.querySelectorAll('[data-question]').forEach(button => { button.disabled = false; });
      }
    }, 240);
  }

  function showResult() {
    const r = result, outcome = r.outcome;
    app.innerHTML = `<article class="report"><div class="report-topline"><p class="eyebrow">${nickname ? escape(nickname) + ' · ' : ''}你的友情观察报告</p><button class="text-button" id="edit">返回修改</button></div>
      <header class="report-hero tone-${outcome.id}"><p class="eyebrow">${escape(outcome.level)} · ${outcome.min}～${outcome.max}分</p><h1>${escape(outcome.name)}</h1><p class="type-quote">${escape(outcome.judgment)}</p>
        <div class="result-score"><p class="section-label">本次测试总分</p><div class="score" data-testid="overall-score">${r.total}<span>/ ${r.maxScore}</span></div></div>
        <div class="progress-track score-progress" role="progressbar" aria-label="消耗行为总分" aria-valuemin="0" aria-valuemax="${r.maxScore}" aria-valuenow="${r.total}"><span style="width:${r.total / r.maxScore * 100}%"></span></div><p class="legend">${escape(data.scoreNote)}</p>
      </header>
      <section class="result-section analysis"><h2>你为什么得到这个结果</h2>${blocks(outcome.analysis)}</section>
      <section class="result-section experiences"><h2>你可能正在经历什么</h2>${blocks(outcome.experiences)}</section>
      <section class="result-section advice"><h2>接下来应该怎么办</h2>${blocks(outcome.advice)}</section>
      <aside class="result-summary"><p class="section-label">一句话总结</p><p>${escape(outcome.summary)}</p></aside>
      <section class="disclaimer result-disclaimer"><h2>测试声明</h2>${paragraphs(data.disclaimer)}</section>
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
    answers = Array(totalQuestions); nickname = ''; current = 0; result = null; moving = false;
    showHome(); focusView();
  }

  showHome();
})();
