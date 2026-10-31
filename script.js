// Шесть вещей на маршруте: тот же порядок, что на плане и в списке наверху.
const STOPS = [
  { word: 'самовар', ask: 'Открываешь дверь. Что пыхтит в прихожей?', x: 264, y: 326 },
  { word: 'якорь', ask: 'Дальше ванная. Что лежит в воде?', x: 42, y: 462 },
  { word: 'арбуз', ask: 'Кухня. Что кипит на плите?', x: 42, y: 106 },
  { word: 'барабан', ask: 'Комната. Что стоит вместо телевизора?', x: 266, y: 222 },
  { word: 'кактус', ask: 'Балкон. Кто на перилах в ушанке?', x: 516, y: 98 },
  { word: 'зонт', ask: 'Спальня. Что раскрыто над кроватью?', x: 436, y: 462 },
];

const DAYS = ['первое', 'второе', 'третье', 'четвёртое', 'пятое', 'шестое', 'седьмое', 'восьмое', 'девятое', 'десятое',
  'одиннадцатое', 'двенадцатое', 'тринадцатое', 'четырнадцатое', 'пятнадцатое', 'шестнадцатое', 'семнадцатое',
  'восемнадцатое', 'девятнадцатое', 'двадцатое', 'двадцать первое', 'двадцать второе', 'двадцать третье',
  'двадцать четвёртое', 'двадцать пятое', 'двадцать шестое', 'двадцать седьмое', 'двадцать восьмое',
  'двадцать девятое', 'тридцатое', 'тридцать первое'];
const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

const $ = (id) => document.getElementById(id);
const SVG_NS = 'http://www.w3.org/2000/svg';

/** Строка в клетке вверху тетрадного листа: как пишут дату в школе. */
function schoolDate(d) {
  const day = DAYS[d.getDate() - 1];
  return `${day[0].toUpperCase()}${day.slice(1)} ${MONTHS[d.getMonth()]}`;
}

function editDistance(a, b) {
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++) row.push(Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)));
    prev = row;
  }
  return prev[b.length];
}

/** Опечатка в букву и другой падеж — не ошибка: проверяем память, а не орфографию. */
function isRight(answer, word) {
  const a = answer.trim().toLowerCase().replace(/ё/g, 'е');
  const stem = word.slice(0, Math.max(3, word.length - 1));
  return a.startsWith(stem) || editDistance(a, word) <= 1;
}

const GRADES = [[6, '5'], [5, '5−'], [4, '4'], [3, '3']];

function verdict(right) {
  const grade = GRADES.find(([n]) => n === right)?.[1] ?? '';
  const count = `${right} из 6 с одного просмотра`;
  if (right === 6) return { grade, comment: `${count}. Так и работает дворец памяти. В приложении ты строишь его по своему дому и доходишь до 20 слов.` };
  if (right >= 4) return { grade, comment: `${count}, и без всякой подготовки. В приложении дворец строится по твоему дому, поэтому держится крепче.` };
  return { grade, comment: `${count}. С первого раза так и бывает. В приложении маршрут строится по твоему дому, а слова добавляются постепенно.` };
}

function highlight(room, on) {
  document.querySelectorAll(`.hero [data-room="${room}"]`).forEach((el) => {
    if (el.matches('rect, li')) el.classList.toggle('on', on);
  });
}

document.querySelectorAll('.route li').forEach((li) => {
  li.addEventListener('mouseenter', () => highlight(li.dataset.room, true));
  li.addEventListener('mouseleave', () => highlight(li.dataset.room, false));
});

function buildTest() {
  $('test').hidden = false;
  $('test-date').textContent = schoolDate(new Date());

  const figure = $('plan').cloneNode(true);
  figure.removeAttribute('id');
  figure.querySelector('figcaption').remove();
  const svg = figure.querySelector('svg');
  // Фильтр чернил остаётся один на странице: id в копии не должны повторяться.
  svg.querySelector('defs').remove();
  svg.querySelectorAll('.word').forEach((el) => el.remove());
  svg.setAttribute('aria-label', 'Пустой план квартиры: сюда записываются ответы');
  $('test-plan').append(figure);

  const room = (i) => svg.querySelector(`.rooms rect[data-room="${i + 1}"]`);
  const write = (text, x, y, cls) => {
    const t = document.createElementNS(SVG_NS, 'text');
    t.setAttribute('x', x);
    t.setAttribute('y', y);
    t.setAttribute('class', cls);
    t.textContent = text;
    svg.append(t);
    return t;
  };

  let at = 0;
  let right = 0;

  function ask() {
    room(at).classList.add('on');
    $('test-question').textContent = STOPS[at].ask;
    $('test-input').value = '';
  }

  function finish() {
    $('test-form').hidden = true;
    const { grade, comment } = verdict(right);
    $('test-grade').textContent = grade;
    $('test-grade').hidden = !grade;
    $('test-comment').textContent = comment;
    $('test-result').hidden = false;
    $('test-result').focus({ preventScroll: true });
  }

  function answer(text) {
    const stop = STOPS[at];
    const ok = text !== '' && isRight(text, stop.word);
    room(at).classList.remove('on');
    if (ok) {
      right++;
      const t = write(text.trim().toLowerCase(), stop.x, stop.y, 'answer');
      write('✓', stop.x + t.getComputedTextLength() + 8, stop.y, 'tick');
    } else {
      write(stop.word, stop.x, stop.y, 'fix');
    }
    at++;
    if (at === STOPS.length) finish();
    else ask();
  }

  $('test-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const text = $('test-input').value;
    if (!text.trim()) return;
    answer(text);
    $('test-input').focus({ preventScroll: true });
  });
  $('test-skip').addEventListener('click', () => answer(''));

  ask();
}

buildTest();
