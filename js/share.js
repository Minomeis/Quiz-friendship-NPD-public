// 本地图形与简版报告导出，不加载图片、字体或外部绘图库。
(function () {
  'use strict';
  const format = value => value === null ? '待观察' : String(Number(value.toFixed(1)));
  const point = (index, radius, cx = 240, cy = 180) => {
    const angle = -Math.PI / 2 + index * Math.PI / 3;
    return [cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius];
  };

  function radarSVG(dimensions) {
    const rings = [25, 50, 75, 100].map(value => `<polygon points="${dimensions.map((d, i) => point(i, value * 1.1).join(',')).join(' ')}" fill="none" stroke="#dfe2ed"/><text x="247" y="${180 - value * 1.1 + 12}">${value}</text>`).join('');
    const axes = dimensions.map((d, i) => {
      const end = point(i, 110);
      const label = point(i, 146);
      return `<line x1="240" y1="180" x2="${end[0]}" y2="${end[1]}" stroke="#e4e6ef"/><text class="axis-label ${d.R >= 75 ? 'axis-high' : ''}" text-anchor="middle" x="${label[0]}" y="${label[1]}">${d.name}</text><text text-anchor="middle" x="${label[0]}" y="${label[1] + 19}">${format(d.R)}</text>`;
    }).join('');
    const polygon = dimensions.map((d, i) => point(i, d.R * 1.1).join(',')).join(' ');
    return `<svg class="radar" viewBox="0 0 480 360" role="img" aria-labelledby="radar-title radar-description"><title id="radar-title">六维负向行为雷达图</title><desc id="radar-description">中心0，外圈100，越向外代表负向行为越频繁。${dimensions.map(d => d.name + format(d.R)).join('，')}</desc>${rings}${axes}<text x="240" y="185" text-anchor="middle">0</text><polygon data-testid="radar-polygon" points="${polygon}" fill="#6867b52e" stroke="#6263a7" stroke-width="2.5"/>${dimensions.map((d, i) => { const p = point(i, d.R * 1.1); return `<circle data-dimension="${d.id}" data-score="${d.R}" data-radius="${d.R * 1.1}" cx="${p[0]}" cy="${p[1]}" r="4" fill="${d.R >= 75 ? '#9a4c35' : '#6263a7'}"/>`; }).join('')}</svg>`;
  }

  function wrapText(ctx, text, x, y, width, lineHeight) {
    let line = '';
    for (const char of text) {
      if (ctx.measureText(line + char).width > width && line) {
        ctx.fillText(line, x, y);
        y += lineHeight;
        line = char;
      } else line += char;
    }
    if (line) ctx.fillText(line, x, y);
    return y + lineHeight;
  }

  function drawSummary(result) {
    const data = window.QuizData;
    const canvas = document.createElement('canvas');
    canvas.width = 900;
    canvas.height = result.complete ? 1500 + Math.max(0, result.main.length - 2) * 58 : 1500;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('浏览器不支持生成图片');
    ctx.fillStyle = '#f5f6fa'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#24284b'; ctx.fillRect(0, 0, 900, 130);
    ctx.fillStyle = '#ffffff'; ctx.font = '28px "Microsoft YaHei", sans-serif';
    ctx.fillText('友情观察室 · 关系行为报告', 56, 79);
    let y = 205;
    ctx.fillStyle = '#62677b'; ctx.font = '24px "Microsoft YaHei", sans-serif';
    ctx.fillText(result.complete ? '你的友情关系画像' : '部分情境尚待观察', 56, y);
    y += 65;
    ctx.fillStyle = '#24284b'; ctx.font = 'bold 42px "Microsoft YaHei", sans-serif';
    if (result.complete) {
      for (const id of result.main) { ctx.fillText(data.types[id].name, 56, y); y += 58; }
      y += 25;
      ctx.font = '24px "Microsoft YaHei", sans-serif'; ctx.fillStyle = '#62677b';
      ctx.fillText('负向行为综合指数', 56, y); y += 72;
      ctx.fillStyle = '#24284b'; ctx.font = 'bold 64px "Microsoft YaHei", sans-serif';
      ctx.fillText(format(result.R) + ' / 100', 56, y); y += 46;
      ctx.font = '28px "Microsoft YaHei", sans-serif'; ctx.fillText(result.level, 56, y); y += 90;
      ctx.font = 'bold 28px "Microsoft YaHei", sans-serif'; ctx.fillText('六维负向行为', 56, y); y += 40;
      ctx.font = '22px "Microsoft YaHei", sans-serif'; ctx.fillStyle = '#62677b';
      ctx.fillText('中心0 · 外圈100 · 高分代表负向行为更频繁', 56, y); y += 330;
      const cx = 450, cy = y, radius = 215;
      for (const value of [25, 50, 75, 100]) {
        ctx.beginPath();
        result.dimensions.forEach((d, i) => { const p = point(i, radius * value / 100, cx, cy); if (i) ctx.lineTo(...p); else ctx.moveTo(...p); });
        ctx.closePath(); ctx.strokeStyle = '#ccd1e0'; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.font = '20px "Microsoft YaHei", sans-serif'; ctx.fillStyle = '#62677b'; ctx.fillText(String(value), cx + 10, cy - radius * value / 100 + 20);
      }
      result.dimensions.forEach((d, i) => {
        const end = point(i, radius, cx, cy);
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(...end); ctx.strokeStyle = '#d9deea'; ctx.stroke();
      });
      ctx.beginPath();
      result.dimensions.forEach((d, i) => { const p = point(i, radius * d.R / 100, cx, cy); if (i) ctx.lineTo(...p); else ctx.moveTo(...p); });
      ctx.closePath(); ctx.fillStyle = '#6867b52e'; ctx.fill(); ctx.strokeStyle = '#6263a7'; ctx.lineWidth = 4; ctx.stroke();
      ctx.textAlign = 'center';
      ctx.font = '20px "Microsoft YaHei", sans-serif'; ctx.fillStyle = '#62677b'; ctx.fillText('0', cx, cy + 6);
      result.dimensions.forEach((d, i) => {
        const p = point(i, 300, cx, cy);
        ctx.fillStyle = d.R >= 75 ? '#9a4c35' : '#24284b'; ctx.font = '26px "Microsoft YaHei", sans-serif'; ctx.fillText(d.name, p[0], p[1]);
        ctx.font = '24px "Microsoft YaHei", sans-serif'; ctx.fillText(format(d.R) + (d.R >= 75 ? ' · 重点关注' : ''), p[0], p[1] + 36);
      });
      ctx.textAlign = 'left'; y += 420;
    } else {
      ctx.font = '26px "Microsoft YaHei", sans-serif'; ctx.fillStyle = '#62677b';
      y = wrapText(ctx, data.copy.incomplete, 56, y, 780, 44) + 30;
      for (const d of result.dimensions) {
        ctx.fillStyle = '#24284b'; ctx.font = 'bold 28px "Microsoft YaHei", sans-serif'; ctx.fillText(d.name, 56, y); y += 40;
        ctx.font = '24px "Microsoft YaHei", sans-serif'; ctx.fillStyle = '#62677b';
        ctx.fillText('正向支持 P：' + format(d.P) + '    负向行为 R：' + format(d.R), 56, y); y += 70;
      }
      y += 30;
    }
    ctx.fillStyle = '#62677b'; ctx.font = '22px "Microsoft YaHei", sans-serif';
    wrapText(ctx, data.shortDisclaimer, 56, y, 788, 36);
    return canvas;
  }

  window.QuizVisual = { format, radarSVG, drawSummary };
})();
