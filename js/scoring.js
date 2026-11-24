// 计分仅描述本问卷中的行为频率；未知与未作答均不参与平均。
(function () {
  'use strict';
  const data = window.QuizData;
  const negativeTypes = ['T04', 'T05', 'T06', 'T07', 'T08', 'T09'];
  const mean = values => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
  const isValid = value => Number.isInteger(value) && value >= 0 && value <= 4;

  function levelFor(value) {
    return data.levels[value < 15 ? 0 : value < 30 ? 1 : value < 45 ? 2 : value < 60 ? 3 : 4];
  }

  function classify(dimensions) {
    const sorted = dimensions.filter(d => d.R >= 60).slice().sort((a, b) => b.R - a.R || a.H - b.H || a.order - b.order);
    if (sorted.length) {
      const main = sorted.filter(d => d.R === sorted[0].R && d.H === sorted[0].H);
      return { main: main.map(d => negativeTypes[d.order]), secondary: sorted.filter(d => !main.includes(d)).map(d => negativeTypes[d.order]) };
    }
    const P = mean(dimensions.map(d => d.P));
    const H = mean(dimensions.map(d => d.H));
    if (H >= 85 && P >= 80 && dimensions.every(d => d.H >= 70 && d.R < 40)) return { main: ['T01'], secondary: [] };
    if (H >= 70 && dimensions.every(d => d.H >= 55 && d.R < 50) && dimensions.find(d => d.id === 'boundaries').H >= 70) return { main: ['T02'], secondary: [] };
    return { main: ['T03'], secondary: [] };
  }

  function calculate(answers) {
    const dimensions = data.dimensions.map((dimension, order) => {
      const groups = { P: [], R: [] };
      data.questions.forEach((q, index) => {
        if (q.dimension === dimension.id && isValid(answers[index])) groups[q.direction].push(answers[index]);
      });
      const P = groups.P.length ? mean(groups.P) * 25 : null;
      const R = groups.R.length ? mean(groups.R) * 25 : null;
      const count = groups.P.length + groups.R.length;
      const valid = count >= 3 && P !== null && R !== null;
      return { ...dimension, order, P, R, H: valid ? (P + 100 - R) / 2 : null, count, valid };
    });
    const answered = data.questions.filter((q, i) => answers[i] === null || isValid(answers[i])).length;
    const complete = answered === 24 && dimensions.every(d => d.valid);
    const high = dimensions.filter(d => d.R !== null && d.R >= 60);
    const tags = [];
    const P = complete ? mean(dimensions.map(d => d.P)) : null;
    const R = complete ? mean(dimensions.map(d => d.R)) : null;
    const H = complete ? mean(dimensions.map(d => d.H)) : null;
    if (complete && P >= 75) tags.push('正向支持充分');
    if (dimensions.some(d => d.P !== null && d.P >= 65 && d.R !== null && d.R >= 60)) tags.push('正负行为并存');
    if (high.length >= 3) tags.push('多维关系警讯');
    if (complete && high.length === 1) tags.push('局部关系失衡');
    if (dimensions.find(d => d.id === 'boundaries').R >= 75) tags.push('边界值得关注');
    if (dimensions.find(d => d.id === 'repair').R >= 75) tags.push('冲突修复困难');
    if (!complete) tags.push('关系观察不足');
    const type = complete ? classify(dimensions) : { main: [], secondary: [] };
    const interpretation = !complete ? data.copy.incomplete : high.length ? data.copy.highPrefix + high.map(d => d.name).join('、') + data.copy.highSuffix : data.copy.completeLow;
    return { dimensions, answered, complete, P, R, H, ...type, tags, level: complete ? levelFor(R) : null, interpretation };
  }

  window.QuizScoring = { calculate, classify, levelFor };
})();
