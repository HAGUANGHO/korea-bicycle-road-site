// 자동 등록 방지 칸 (자체 캡차, 사용자 요청 2026-10-23). DB가 낸 덧셈 문제를 그림(캔버스)에 비뚤게 그리고
// 잡선을 넣어, 화면 글자를 그대로 긁어 가는 봇이 읽기 어렵게 한다. 채점은 DB 함수가 한다(utils/board.js).
// DB에 캡차가 없으면(board_v4.sql 전) 칸을 숨긴다.
import { t } from '../i18n.js';
import { html, esc } from '../utils/dom.js';
import { newCaptcha } from '../utils/board.js';

const cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
const rand = (lo, hi) => lo + Math.random() * (hi - lo);

function draw(canvas, a, b) {
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = cssVar('--surface-2');
  ctx.fillRect(0, 0, w, h);
  // 잡선
  for (let i = 0; i < 6; i += 1) {
    ctx.strokeStyle = cssVar(i % 2 ? '--muted' : '--border');
    ctx.lineWidth = rand(1, 2);
    ctx.beginPath();
    ctx.moveTo(rand(0, w), rand(0, h));
    ctx.bezierCurveTo(rand(0, w), rand(0, h), rand(0, w), rand(0, h), rand(0, w), rand(0, h));
    ctx.stroke();
  }
  // 글자마다 기울기·높이를 조금씩 다르게
  const text = `${a} + ${b} = ?`;
  ctx.fillStyle = cssVar('--text');
  ctx.font = `700 24px ${getComputedStyle(document.body).fontFamily}`;
  ctx.textBaseline = 'middle';
  let x = 12;
  [...text].forEach((ch) => {
    ctx.save();
    ctx.translate(x, h / 2 + rand(-5, 5));
    ctx.rotate(rand(-0.3, 0.3));
    ctx.fillText(ch, 0, 0);
    ctx.restore();
    x += ch === ' ' ? 6 : ctx.measureText(ch).width + 2;
  });
  // 점
  for (let i = 0; i < 40; i += 1) {
    ctx.fillStyle = cssVar('--muted');
    ctx.fillRect(rand(0, w), rand(0, h), 1.5, 1.5);
  }
}

export function captchaField() {
  const el = html(`
    <div class="board-captcha" hidden>
      <span class="field-name">${esc(t('자동 등록 방지'))} <span class="req" aria-hidden="true">*</span></span>
      <div class="captcha-row">
        <canvas width="150" height="46" role="img" aria-label="${esc(t('덧셈 문제 그림'))}"></canvas>
        <button class="secondary captcha-new" type="button" title="${esc(t('새 문제'))}">↻ ${esc(t('새 문제'))}</button>
        <input name="captcha" type="text" inputmode="numeric" maxlength="3" autocomplete="off" placeholder="${esc(t('답'))}"
          aria-label="${esc(t('자동 등록 방지'))}" aria-required="true">
      </div>
      <span class="muted small">${esc(t('그림 속 덧셈의 답을 숫자로 적어 주세요'))}</span>
    </div>`);
  const canvas = el.querySelector('canvas');
  const input = el.querySelector('input');
  let current = null;
  input.addEventListener('input', () => { input.value = input.value.replace(/\D/g, ''); });

  async function load() {
    input.value = '';
    try {
      current = await newCaptcha();
    } catch {
      current = null; // 문제를 못 받으면 등록 때 DB가 알려 준다
    }
    el.hidden = !current;
    if (current) draw(canvas, current.a, current.b);
  }
  el.querySelector('.captcha-new').addEventListener('click', load);
  el.load = load;
  el.active = () => Boolean(current);
  el.answer = () => input.value.trim();
  el.value = () => (current ? { id: current.id, answer: input.value.trim() } : null);
  el.focusInput = () => input.focus();
  return el;
}
