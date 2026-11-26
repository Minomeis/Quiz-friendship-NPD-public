// 仅接收15项0～4整数；未作答或非法值不参与结果生成。
(function () {
  'use strict';
  const data = window.QuizData;
  const isValid = value => Number.isInteger(value) && value >= 0 && value <= 4;

  function calculate(answers) {
    if (!Array.isArray(answers) || answers.length !== data.questions.length) return null;
    // 使用Array.from检查稀疏数组，避免空位被every跳过。
    if (!Array.from(answers).every(isValid)) return null;
    const total = answers.reduce((sum, value) => sum + value, 0);
    const outcome = data.results.find(item => total >= item.min && total <= item.max);
    return outcome ? { total, maxScore: data.maxScore, outcome } : null;
  }

  window.QuizScoring = { isValid, calculate };
})();
