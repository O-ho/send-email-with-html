'use strict';

function getByPath(obj, path) {
  return path.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

function assertNonEmptyString(value, path) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`[reportData] '${path}' is required and must be a non-empty string.`);
  }
}

function assertArray(value, path, minLen) {
  if (!Array.isArray(value) || value.length < minLen) {
    throw new Error(`[reportData] '${path}' is required and must be an array with length >= ${minLen}.`);
  }
}

function validateReportData(reportData) {
  if (!reportData || typeof reportData !== 'object') {
    throw new Error('[reportData] Missing reportData. Pass user-personalized data from BE.');
  }

  const requiredStrings = [
    'cover.period',
    'cover.customerNameStrong',
    'cover.logoDataUri',
    'page2.customerName',
    'page2.contractPeriod',
    'page2.contractAmount',
    'page2.evaluationAmount',
    'page2.cumulativeReturn',
    'page2.periodReturn',
    'page2.investmentProfile',
    'page2.marketSummary',
    'page3.turnoverBuy',
    'page3.turnoverSell',
    'page3.turnoverPeriod',
    'page3.turnoverCumulative',
    'page6.conflictText',
    'page7.dateText',
    'page7.signer',
  ];

  const requiredArrays = [
    ['page2.investmentRestrictions', 1],
    ['page3.performanceDiscretionary', 4],
    ['page3.performanceKospi', 4],
    ['page3.performanceSp500', 4],
    ['page3.assetRows', 1],
    ['page4.holdingRows', 1],
    ['page5.costRows', 1],
    ['page5.feePolicyRow', 3],
    ['page5.professionalRows', 1],
    ['page6.algorithmRows', 1],
    ['page6.maintenanceRows', 1],
    ['page8.transactionRows', 1],
  ];

  for (const path of requiredStrings) {
    assertNonEmptyString(getByPath(reportData, path), path);
  }

  for (const [path, minLen] of requiredArrays) {
    assertArray(getByPath(reportData, path), path, minLen);
  }
}

function td(v, cls) {
  return `<td${cls ? ` class="${cls}"` : ''}>${v || ''}</td>`;
}

function tdSpan(v, cls, colspan, rowspan) {
  const span = `${colspan ? ` colspan="${colspan}"` : ''}${rowspan ? ` rowspan="${rowspan}"` : ''}`;
  return `<td${cls ? ` class="${cls}"` : ''}${span}>${v || ''}</td>`;
}

function th(v, cls, colspan, rowspan) {
  const span = `${colspan ? ` colspan="${colspan}"` : ''}${rowspan ? ` rowspan="${rowspan}"` : ''}`;
  return `<th${cls ? ` class="${cls}"` : ''}${span}>${v || ''}</th>`;
}

function row(cells) {
  return `<tr>${cells.join('')}</tr>`;
}

function renderProfessionalTable(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return '';
  }

  const rendered = [];
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i] || [];
    if (i === rows.length - 1 && r.length >= 2) {
      rendered.push(row([th(r[0], 'left-h bg-accent'), tdSpan(r.slice(1).join(' '), '', 2)]));
      continue;
    }
    rendered.push(row([th(r[0], 'left-h bg-accent'), td(r[1] || ''), td(r[2] || '')]));
  }

  return rendered.join('');
}

function buildHtml(props) {
  const reportData = props && props.reportData;
  validateReportData(reportData);

  const p = reportData;

  const CONTRACT_NOTES = [
    '1) 계약기간 : 최초 계약일로부터 계약 만료 예정일까지의 기간입니다.',
    '2) 해당기간 : 보고서 작성의 대상이 되는 기간입니다.',
    '3) 대상계좌 : 마이스톡플랜이 주문대리하는 고객님 계좌입니다.',
    '4) 계약금액 : 고객님이 맡기신 금액으로, 계약이 자동 연장되는 경우 신규 계약일의 평가금액입니다.',
    '5) 평가금액 : 대상기간 말일을 기준으로 보유 중인 주식과 현금을 합산한 금액입니다.',
    '6) 누적 수익률 : 최초 계약일로부터 대상기간 말일까지 투자일임 수수료 등 제반 비용을 차감한 수익률입니다.',
    '7) 해당기간 수익률 : 보고서 작성대상기간 동안의 수익률입니다.',
  ];

  const TURNOVER_NOTES = [
    '1) 매매회전율 : (매수금액 + 매도금액) / 2 / (투자일임계약의 일평균 평가금액) X 100',
    '2) 기간누적 매매회전율 : 계약기간이 1년을 초과하는 경우, 최근 1년간 매매회전율',
  ];

  const ASSET_NOTES = [
    '1) 주식 평가금액 : 대상기간 말일에 보유 중인 주식을 대상기간 말일 종가로 평가하여 합산한 금액.',
    '2) 현금 평가금액 : 투자일임계약 + 누적 매매손익(체결일 기준)',
  ];

  const COST_NOTES = [
    '1) 투자일임수수료 : 투자일임계약에 의하여 당사에 지급하는 수수료',
    '2) 매매 수수료 : 주식 매매와 관련하여 증권회사에 지급하는 수수료',
    '3) 제세금 : 주식 매매와 관련하여 발생하는 증권거래세 등',
  ];

  const FUTURE_STRATEGY_TEXT =
    '마이스톡플랜은 자체 개발 알고리즘에 의하여 우량 종목을 선별하여, 사전에 정해진 전략에 따라 안정적인 시세차익을 추구합니다. 향후 종목 선별 알고리즘 및 투자전략을 지속적으로 개선해나갈 계획입니다.';

  const NOTICE_LINE_1 =
    '엠엘투자자문(주)는 「금융투자업규정」 제4-73조의 규정에 따라 분기별로 투자자의 재무상태, 투자목적 등의 변경여부를 확인하고, 변경된 내용에 부합하도록 투자일임재산을 운용하고자 합니다. 기존에 고객님과의 투자일임계약에 따른 고객님의 재무상태나 투자목적 등의 변동이 있는 경우에는 반드시 당사에 연락(이메일: support@ml-invest.co.kr)을 주시기 바랍니다.';

  const NOTICE_LINE_2 =
    '아울러 본 안내에 따른 투자목적 등 변경에 대하여 고객님의 별도의 회신이 없는 경우에는 고객님의 재무상태나 투자목적 등에 변동이 없는 것으로 간주하고 기존 투자일임재산 운용방침에 따라 고객님의 투자일임재산이 운용됨을 알려드립니다.';

  const COVER_TITLE = '『마이스톡플랜(My Stock Plan)』';
  const COVER_SUBTITLE = '투자일임 보고서';
  const COVER_CUSTOMER_SUFFIX = '귀하';
  const COVER_BRAND_EN = 'ML Investment Advisory';
  const COVER_BRAND_KO = '엠엘투자자문 주식회사';
  const STRATEGY_SUMMARY_TEXT =
    '마이스톡플랜은 자체 개발 알고리즘에 의하여 우량 종목을 선별하여, 사전에 정해진 전략에 따라 안정적인 시세차익을 추구합니다.';

  const contractRows = [
    row([th('고객명', 'left-h bg-accent'), td(p.page2.customerName), th('계약기간', 'left-h bg-accent'), td(p.page2.contractPeriod)]),
    row([th('계약금액', 'left-h bg-accent'), td(p.page2.contractAmount), th('평가금액', 'left-h bg-accent'), td(p.page2.evaluationAmount)]),
    row([
      th(`누적 수익률<br><span class="sm">(${p.cover.period})</span>`, 'left-h bg-accent'),
      td(p.page2.cumulativeReturn),
      th(`해당기간 수익률<br><span class="sm">(${p.cover.period})</span>`, 'left-h bg-accent'),
      td(p.page2.periodReturn),
    ]),
  ].join('');

  const assetRows = p.page3.assetRows
    .map((r) => row([td(r[0], ' strong-cell'), td(r[1]), td(r[2]), td(r[3])]))
    .join('');

  const holdingRows = p.page4.holdingRows
    .map((r) => row([td(r[0]), td(r[1]), td(r[2]), td(r[3]), td(r[4]), td(r[5])]))
    .join('');

  const costRows = p.page5.costRows
    .map((r) => row([th(r[0], ' '), td(r[1]), td(r[2]), td(r[3]), td(r[4])]))
    .join('');

  const algoRows = p.page6.algorithmRows
    .map((r) => row([td(r[0]), td(r[1]), td(r[2]), td(r[3]), td(r[4])]))
    .join('');

  const maintenanceRows = p.page6.maintenanceRows
    .map((r) => row([td(r[0]), td(r[1]), td(r[2])]))
    .join('');

  const transactionRows = p.page8.transactionRows
    .map((r) => row([td(r[0], 'trade-date'), td(r[1]), td(r[2], 'text-left'), td(r[3], 'trade-num'), td(r[4], 'trade-num'), td(r[5], 'trade-num')]))
    .join('');

  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>투자일임 보고서</title>
<style>
*{box-sizing:border-box}
body{margin:0;background:#efefef;color:#111;font-family:AppleSDGothicNeo,'Malgun Gothic',dotum,sans-serif}
.report{width:860px;margin:22px auto;padding:40px;background:#fff}
.brand-top{margin:0}
.brand-top img{display:block;width:360px;height:48px;object-fit:contain}
.main-title{margin:40px 0 0;font-size:28px;font-weight:700;letter-spacing:-.01em}
.meta{margin:40px 0 0;font-size:19px;line-height:1.2;font-weight:700}
.brand-right{margin:40px 0 40px;text-align:right;font-size:19px;line-height:1.2;font-weight:700}
.hr{height:1px;background:#222;margin:18px 0 28px}
h2{margin:40px 0 16px;font-size:24px;line-height:1.2;letter-spacing:-.01em}
h3{margin:16px 0 16px;font-size:20px;line-height:1.5;letter-spacing:-.01em}
h3>span{font-weight: 400}
.sub{margin:16px 0 16px;font-size:13px;font-weight:700}
.unit{margin:0 0 8px;text-align:right;font-size:15px;color:#333}
table{width:100%;border-collapse:collapse;table-layout:fixed;margin:0 0 16px}
th,td{border:1px solid #2b2b2b;padding:16px 8px;vertical-align:middle;text-align:center;font-size:16px;line-height:1.2;background:#fff;font-weight:400}
th{font-weight:500}
.sm{font-size: 12px}
.left-h{font-weight:400}
.strong-cell{font-weight:700}
.bg-accent{background:#F3F3F3;color:#111}
ol.notes{margin:8px 0 28px;padding:0;list-style:none}
ol.notes li{margin:0 0 4px;font-size:14px;line-height:1.3;color:#000}
p{margin:16px 0;font-size:16px;line-height:1.5}
.notice-title{margin:40px 0 16px;font-size:24px;font-weight:700;letter-spacing:-.01em}
.closing{margin-top:40px;text-align:right}
.closing .d{margin:0;font-size:20px;font-weight:700}
.closing .n{margin:4px 0 0;font-size:20px;font-weight:800;line-height:1.3}
.text-left{text-align:left}
.t-2col col:nth-child(1){width:25%}
.t-2col col:nth-child(2){width:75%}
.t-4col col{width:25%}
.t-turnover col:nth-child(1){width:25%}
.t-turnover col:nth-child(2){width:25%}
.t-turnover col:nth-child(3){width:25%}
.t-turnover col:nth-child(4){width:12.5%}
.t-turnover col:nth-child(5){width:12.5%}
.t-performance col:nth-child(1){width:18%}
.t-performance col:nth-child(2){width:18%}
.t-performance col:nth-child(3){width:13%}
.t-performance col:nth-child(4){width:12.75%}
.t-performance col:nth-child(5){width:12.75%}
.t-performance col:nth-child(6){width:12.75%}
.t-performance col:nth-child(7){width:12.75%}
.t-asset col:nth-child(1){width:25%}
.t-asset col:nth-child(2){width:25%}
.t-asset col:nth-child(3){width:25%}
.t-asset col:nth-child(4){width:25%}
.t-holdings col{width:16.66%}
.t-cost col:nth-child(1){width:24%}
.t-cost col:nth-child(2){width:19%}
.t-cost col:nth-child(3){width:19%}
.t-cost col:nth-child(4){width:19%}
.t-cost col:nth-child(5){width:19%}
.t-robo col:nth-child(1){width: 24%}
.t-robo col:nth-child(2){width: 16%}
.t-robo col:nth-child(3){width: 16%}
.t-robo col:nth-child(4){width: 16%}
.t-robo col:nth-child(5){width: 30%}
.t-cost th.left-h{font-size:12px;line-height:1.35}
.t-fee col{width:33.33%}
.t-pro col:nth-child(1){width:36%}
.t-pro col:nth-child(2){width:32%}
.t-pro col:nth-child(3){width:32%}
.t-holdings tbody td{font-size:12px}
.py8{padding-top:8px!important;padding-bottom:8px!important}
.appendix-page{break-before:page;page-break-before:always;margin-top:0}
.appendix-title{margin:0 0 10px;font-size:22px;font-weight:700;line-height:1.2;letter-spacing:-.01em}
.appendix-unit{margin:0 0 6px;text-align:right;font-size:12px;color:#333}
.t-trade{margin:0}
.t-trade col:nth-child(1){width:15%}
.t-trade col:nth-child(2){width:12%}
.t-trade col:nth-child(3){width:25%}
.t-trade col:nth-child(4){width:16%}
.t-trade col:nth-child(5){width:16%}
.t-trade col:nth-child(6){width:16%}
.t-trade th,.t-trade td{padding:4px 6px;font-size:10px;line-height:1.25;border:1px solid #2b2b2b}
.t-trade th{font-weight:500}
.trade-num{text-align:right}
.trade-date{text-align:center}
@media print{
  body{background:#fff}
  .report{margin:0 auto;padding:18px 20px 24px;width:100%}
}
</style>
</head>
<body>
<article class="report">
  <div class="brand-top"><img src="${p.cover.logoDataUri}" alt="${COVER_BRAND_EN}" width="360" height="48"></div>
  <h1 class="main-title">${COVER_TITLE} ${COVER_SUBTITLE}</h1>
  <p class="meta">기간: ${p.cover.period}<br>${p.cover.customerNameStrong} ${COVER_CUSTOMER_SUFFIX}</p>
  <p class="brand-right">${COVER_BRAND_EN}<br>${COVER_BRAND_KO}</p>

  <div class="hr"></div>

  <h2>1. 투자일임계약의 개요</h2>
  <p class="unit">(단위 : 원, %)</p>
  <table class="t-4col"><colgroup><col><col><col><col></colgroup>${contractRows}</table>
  <ol class="notes">${CONTRACT_NOTES.map((n) => `<li>${n}</li>`).join('')}</ol>

  <h2>2. 투자성향</h2>
  <table class="t-2col"><colgroup><col><col></colgroup>
    ${row([th('투자성향', 'left-h bg-accent'), td(p.page2.investmentProfile)])}
    ${row([th('투자일임 제한사항', 'left-h bg-accent'), td(p.page2.investmentRestrictions.join('<br>'))])}
  </table>

  <h2>3. 투자일임재산의 운용현황</h2>
  <h3>가. 시황 및 운용전략</h3>
  <table class="t-2col"><colgroup><col><col></colgroup>
    ${row([th('증권시장 상황', 'left-h bg-accent'), td(p.page2.marketSummary,'text-left')])}
    ${row([th('운용전략', 'left-h bg-accent'), td(STRATEGY_SUMMARY_TEXT,'text-left')])}
  </table>
  <h3>나. 운용 현황: <span>별지 첨부</span></h3>

  <h3>다. 주식 매매회전율</h3>
  <table class="t-turnover">
    <colgroup><col><col><col><col><col></colgroup>
    ${row([
      th('구분', 'bg-accent', '', 2),
      th('매수금액<br><span style="font-size:12px;font-weight:500">(백만원)</span>', 'bg-accent', '', 2),
      th('매도금액<br><span style="font-size:12px;font-weight:500">(백만원)</span>', 'bg-accent', '', 2),
      th('매매회전율', 'py8 bg-accent', 2),
    ])}
    ${row([th('해당기간', 'py8 bg-accent'), th('기간누적', 'py8 bg-accent')])}
    ${row([td('주식'), td(p.page3.turnoverBuy), td(p.page3.turnoverSell), td(p.page3.turnoverPeriod), td(p.page3.turnoverCumulative)])}
  </table>
  <ol class="notes">${TURNOVER_NOTES.map((n) => `<li>${n}</li>`).join('')}</ol>

  <h2>4. 투자일임재산 운용실적 및 자산구성 현황</h2>
  <h3>가. 운용실적</h3>
  <table class="t-performance">
    <colgroup><col><col><col><col><col><col><col></colgroup>
    ${row([th('구분', 'bg-accent', 2), th('증권시장 상황', 'bg-accent'), th('최근 3개월', 'bg-accent'), th('최근 6개월', 'bg-accent'), th('최근 9개월', 'bg-accent'), th('최근 12개월', 'bg-accent')])}
    ${row([th('투자일임계약 수익률', 'left-h strong-cell', 2), td('운용전략'), td(p.page3.performanceDiscretionary[0]), td(p.page3.performanceDiscretionary[1]), td(p.page3.performanceDiscretionary[2]), td(p.page3.performanceDiscretionary[3])])}
    ${row([th('비교지수 수익률', 'left-h strong-cell', '', 2), td('KOSPI'), td('운용전략'), td(p.page3.performanceKospi[0]), td(p.page3.performanceKospi[1]), td(p.page3.performanceKospi[2]), td(p.page3.performanceKospi[3])])}
    ${row([td('S&P500'), td('운용전략'), td(p.page3.performanceSp500[0]), td(p.page3.performanceSp500[1]), td(p.page3.performanceSp500[2]), td(p.page3.performanceSp500[3])])}
  </table>

  <h3>나. 자산 보유현황</h3>
  <table class="t-asset"><colgroup><col><col><col><col></colgroup>
    ${row([th('구분', 'bg-accent'), th('평가금액(원)', 'bg-accent'), th('비중(%)', 'bg-accent'), th('비고', 'bg-accent')])}
    ${assetRows}
  </table>
  <ol class="notes">${ASSET_NOTES.map((n) => `<li>${n}</li>`).join('')}</ol>

  <h3>다. 보유 종목 현황</h3>
  <p class="unit">(단위 : 원, %)</p>
  <table class="t-holdings"><colgroup><col><col><col><col><col><col></colgroup>
    <thead>
    ${row([th('종목명', 'bg-accent'), th('보유수량', 'bg-accent'), th('평균매수가격(원)', 'bg-accent'), th('시가(원)', 'bg-accent'), th('보유잔액(원)', 'bg-accent'), th('보유비중(%)', 'bg-accent')])}
    </thead>
    <tbody>
    ${holdingRows}
    </tbody>
  </table>

  <h2>5. 투자일임수수료 등 비용발생내역</h2>
  <h3>가. 투자일임 관련 비용발생 내역</h3>
  <p class="unit">(단위 : 원, %)</p>
  <table class="t-cost"><colgroup><col><col><col><col><col></colgroup>
    ${row([th('구분', 'bg-accent'), th('투자일임 수수료', 'bg-accent'), th('매매 수수료', 'bg-accent'), th('제세금', 'bg-accent'), th('총비용', 'bg-accent')])}
    ${costRows}
  </table>
  <ol class="notes">${COST_NOTES.map((n) => `<li>${n}</li>`).join('')}</ol>

  <h3>나. 투자일임수수료 부과기준 및 지급방법</h3>
  <table class="t-fee"><colgroup><col><col><col></colgroup>
    ${row([th('대상기간', 'bg-accent'), th('수수료 산정기준', 'bg-accent'), th('납부시기', 'bg-accent')])}
    ${row([td(p.page5.feePolicyRow[0]), td(p.page5.feePolicyRow[1]), td(p.page5.feePolicyRow[2])])}
  </table>

  <h2>6. 투자운용전문인력 현황</h2>
  <table class="t-pro"><colgroup><col><col><col></colgroup>
    ${renderProfessionalTable(p.page5.professionalRows)}
  </table>

  <h3>나. 투자일임수수료 부과기준 및 지급방법</h3>
  <table class="t-fee"><colgroup><col><col><col></colgroup>
    ${row([th('대상기간', 'bg-accent'), th('수수료 산정기준', 'bg-accent'), th('납부시기', 'bg-accent')])}
    ${row([td(p.page5.feePolicyRow[0]), td(p.page5.feePolicyRow[1]), td(p.page5.feePolicyRow[2])])}
  </table>

  <h2>7. 기타</h2>
  <h3>가. 투자일임재산 운용 관련 고객과 이해상충 발생여지가 있는 거래 세부내역 및 조치사항</h3>
  <p>${p.page6.conflictText}</p>

  <table class="t-pro"><colgroup><col><col><col></colgroup>
    ${renderProfessionalTable(p.page5.professionalRows)}
  </table>

  <h3>나. 전자적 투자조언장치 내역 및 그 유지 보수를 위한 전문인력 현황</h3>
  <h3>1) 전자적 투자조언장치(로보어드바이저)</h3>
  <table class="t-robo"><colgroup><col><col><col><col><col></colgroup>
    ${row([th('알고리즘명', 'bg-accent'), th('운용개시일', 'bg-accent'), th('일임계약수(건)', 'bg-accent'), th('운용규모(백만원)', 'bg-accent'), th('심사경력', 'bg-accent')])}
    ${algoRows}
  </table>

  <h3>2) 유지 보수 전문인력</h3>
  <table class="t-fee"><colgroup><col><col><col></colgroup>
    ${row([th('성명', 'bg-accent'), th('주요경력', 'bg-accent'), th('유지보수 전문인력 요건충족 여부', 'bg-accent')])}
    ${maintenanceRows}
  </table>

  <h3>다. 향후 투자일임재산 운용전략</h3>
  <p>${FUTURE_STRATEGY_TEXT}</p>

  <div class="notice-title">&lt; 고객 투자성향 변경여부 확인조사 안내 &gt;</div>
  <p>${NOTICE_LINE_1}</p>
  <p>${NOTICE_LINE_2}</p>

  <div class="closing">
    <p class="d">${p.page7.dateText}</p>
    <p class="n">${p.page7.signer}</p>
  </div>

  <section class="appendix-page">
    <h2 class="appendix-title">별지. 거래내역</h2>
    <p class="appendix-unit">(단위 : 원)</p>
    <table class="t-trade">
      <colgroup><col><col><col><col><col><col></colgroup>
      <thead>
        ${row([
          th('거래일자', 'bg-accent'),
          th('ticker', 'bg-accent'),
          th('종목명', 'bg-accent'),
          th('거래가격', 'bg-accent'),
          th('거래수량', 'bg-accent'),
          th('거래금액', 'bg-accent'),
        ])}
      </thead>
      <tbody>
        ${transactionRows}
      </tbody>
    </table>
  </section>
</article>
</body>
</html>`;
}

async function renderInnerReportHtml(props) {
  return buildHtml(props);
}

module.exports = {
  renderInnerReportHtml,
};
