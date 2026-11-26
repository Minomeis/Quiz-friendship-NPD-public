// 简版结果图完全在本机绘制，不加载图片、字体或外部绘图库。
(function () {
  'use strict';

  function wrapText(ctx, text, x, y, width, lineHeight) {
    let line = '';
    for (const char of text) {
      if (char === '\n' || (line && ctx.measureText(line + char).width > width)) {
        ctx.fillText(line, x, y); y += lineHeight; line = char === '\n' ? '' : char;
      } else line += char;
    }
    if (line) ctx.fillText(line, x, y);
    return y + lineHeight;
  }

  function drawSummary(result) {
    const data = window.QuizData, outcome = result.outcome;
    const canvas = document.createElement('canvas');
    canvas.width = 900;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('浏览器不支持生成图片');
    function paint() {
      ctx.fillStyle = '#fcf8f8'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f1d9dc'; ctx.fillRect(0, 0, 900, 130);
      ctx.fillStyle = '#493239'; ctx.font = '28px "Microsoft YaHei", sans-serif';
      ctx.fillText('友情观察室 · 友情关系自我觉察测试', 56, 79);
      ctx.fillStyle = '#796168'; ctx.font = '24px "Microsoft YaHei", sans-serif';
      ctx.fillText(`${outcome.level} · ${outcome.min}～${outcome.max}分`, 56, 205);
      ctx.fillStyle = '#493239'; ctx.font = 'bold 42px "Microsoft YaHei", sans-serif';
      let y = wrapText(ctx, outcome.name, 56, 275, 788, 60) + 22;
      ctx.font = 'bold 70px "Microsoft YaHei", sans-serif';
      ctx.fillText(`${result.total} / ${result.maxScore}`, 56, y + 45); y += 85;
      ctx.fillStyle = '#eadcdf'; ctx.fillRect(56, y, 788, 10);
      ctx.fillStyle = '#99565e'; ctx.fillRect(56, y, 788 * result.total / result.maxScore, 10); y += 52;
      ctx.font = '22px "Microsoft YaHei", sans-serif'; ctx.fillStyle = '#796168';
      y = wrapText(ctx, data.scoreNote, 56, y, 788, 36) + 28;
      ctx.font = 'bold 29px "Microsoft YaHei", sans-serif'; ctx.fillStyle = '#493239';
      y = wrapText(ctx, outcome.judgment, 56, y, 788, 46) + 34;
      ctx.font = 'bold 28px "Microsoft YaHei", sans-serif';
      ctx.fillText('接下来应该怎么办', 56, y); y += 52;
      const advice = outcome.advice.find(block => block.type === 'ol');
      ctx.font = '26px "Microsoft YaHei", sans-serif'; ctx.fillStyle = '#695159';
      for (const [i, text] of advice.items.entries()) y = wrapText(ctx, `${i + 1}. ${text}`, 56, y, 788, 42) + 18;
      y += 26; ctx.font = 'bold 28px "Microsoft YaHei", sans-serif'; ctx.fillStyle = '#493239';
      y = wrapText(ctx, outcome.summary, 56, y, 788, 44) + 34;
      ctx.font = '22px "Microsoft YaHei", sans-serif'; ctx.fillStyle = '#796168';
      return wrapText(ctx, data.shortDisclaimer, 56, y, 788, 36) + 50;
    }
    // 先量出所有段落高度，再绘制，长标题和建议均不会被截断。
    canvas.height = Math.ceil(paint());
    paint();
    return canvas;
  }

  window.QuizVisual = { wrapText, drawSummary };
})();
