'use strict';

const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '.env') });

const nodemailer = require('nodemailer');
const { renderEmailBodyHtml } = require('./templates/email-body-template');
const { renderInnerReportHtml } = require('./templates/inner-report-template');
const { renderReportPdfBuffer } = require('./templates/report-pdf-template');

const PASSWORD = process.env.MAIL_PASSWORD || '9755';
const TO = process.env.MAIL_TO || 'pazzang0@gmail.com';
// mockup 데이터 [거래내역]
function fmtNumber(n) {
  return n.toLocaleString('en-US');
}

function makeDate(month, day, year) {
  return `${month}/${String(day).padStart(2, '0')}/${year}`;
}

function buildMockTransactionRows() {
  const groups = [
    ['TSLA', 'Tesla Inc.', 241500, 10],
    ['NVDA', 'NVIDIA Corp.', 132500, 10],
    ['AAPL', 'Apple Inc.', 274000, 10],
    ['MSFT', 'Microsoft Corp.', 589000, 10],
    ['AMZN', 'Amazon.com Inc.', 211300, 10],
    ['GOOGL', 'Alphabet Inc. Class A', 198200, 10],
    ['META', 'Meta Platforms Inc.', 612000, 10],
    ['AVGO', 'Broadcom Inc.', 1945000, 10],
    ['AMD', 'Advanced Micro Devices', 243700, 10],
    ['NFLX', 'Netflix Inc.', 701200, 10],
    ['QQQ', 'Invesco QQQ Trust', 695500, 10],
  ];

  const rows = [];
  let day = 1;
  let month = 4;
  const year = 2026;

  for (const [ticker, name, basePrice, count] of groups) {
    for (let i = 0; i < count; i += 1) {
      const isSell = i % 3 === 1;
      const price = basePrice + ((i % 5) - 2) * Math.round(basePrice * 0.008);
      const qty = 8 + ((i + ticker.length) % 47);
      const amount = price * qty;
      rows.push([
        makeDate(month, day, year),
        ticker,
        name,
        fmtNumber(price),
        `${isSell ? '-' : ''}${fmtNumber(qty)}`,
        `${isSell ? '-' : ''}${fmtNumber(amount)}`,
      ]);

      day += 1;
      if (day > 30) {
        day = 1;
        month += 1;
      }
    }
  }

  return rows;
}

/** 메일 본문·거래내역(첨부) 하단 공통 회사 정보·안내 */
const LEGAL_FOOTER = {
  companyRowHtml:
    '<strong>엠엘투자자문(주)</strong> 서울특별시 강남구 역삼로17길 10 | 사업자등록번호 341-88-02703 | 대표 윤도선',
  teleSales: '통신판매업 : 2025-서울강남-04995',
  customer: '고객센터 02-6949-0045',
  copyright: '© 엠엘투자자문(주). All rights reserved',
  disclaimer:
    '본 이메일은 발신전용이며, 기존 거래유지 등을 목적으로 고객님께서 마이스톡플랜에 제공하신 이메일 주소로 발송되었습니다. 문의가 있으신 분은 고객센터를 이용해 주시기 바랍니다.',
};

/** BE 조회 결과를 가정한 개인화 보고서 더미 데이터 */
const DUMMY_REPORT_DATA = {
  cover: {
    period: '2025-11-03 ~ 2026-02-02',
    customerNameStrong: '권 병 소',
    logoDataUri: '',
  },
  page2: {
    customerName: '권병소',
    contractPeriod: '2025-11-03<br>~ 2026-11-02',
    contractAmount: '400,000,000원',
    evaluationAmount: '405,309,914',
    cumulativeReturn: '1.33%',
    periodReturn: '1.33%',
    investmentProfile: '적극투자형',
    investmentRestrictions: ['-'],
    marketSummary: '최근 3개월간 KOSPI 지수는 +27.2%, S&P500 지수는 +1.4% 변동하였습니다.',
  },
  page3: {
    turnoverBuy: '728',
    turnoverSell: '360',
    turnoverPeriod: '134%',
    turnoverCumulative: '134%',
    performanceDiscretionary: ['1.62%', '-', '-', '-'],
    performanceKospi: ['27.2%', '-', '-', '-'],
    performanceSp500: ['1.4%', '-', '-', '-'],
    assetRows: [
      ['주식', '121,904,492', '30%', ''],
      ['채권', '235,132,786', '59%', '미국채권 ETF: 52%<br>한국채권 ETF: 7%'],
      ['현금', '48,272,636', '11%', ''],
      ['합계', '405,309,914', '100%', ''],
    ],
  },
  page4: {
    holdingRows: [
      ['TIGER 미국 나스닥바이오', '337.0', '31,226', '30,395', '10,243,115', '2.6%'],
      ['TIGER 미국필라델피아 반도체나스닥', '306.0', '29,840', '29,765', '9,108,090', '2.3%'],
      ['ALB', '28.6', '253,028', '261,635', '7,491,916', '1.9%'],
      ['BBY', '116.3', '102,793', '93,026', '10,815,602', '2.7%'],
      ['CQQQ', '134.0', '83,448', '66,862', '8,959,559', '2.2%'],
      ['DHR', '22.3', '325,311', '276,171', '6,151,650', '1.5%'],
      ['EWJ', '67.0', '122,713', '122,097', '8,180,467', '2.0%'],
      ['TIP', '428.0', '160,959', '160,164', '68,550,393', '17.1%'],
      ['GOVT', '2,086.0', '33,536', '33,329', '69,525,218', '17.4%'],
      ['SCHP', '1,796.0', '38,886', '38,620', '69,362,045', '17.3%'],
    ],
  },
  page5: {
    costRows: [
      ['해당기간<br><span class="sm">(2025-11-03 ~ 2026-02-02)</span>', ' 6개월 무료', '1,229,041', '8,560', '1,237,061'],
      ['기간누적<br><span class="sm">(2025-11-03 ~ 2026-02-02)</span>', ' 6개월 무료', '1,229,041', '8,560', '1,237,061'],
    ],
    feePolicyRow: ['2025-11-03 ~ 2026-02-02', '운용금액의 연 0.5%, 최초 6개월 무료', '해당사항 없음'],
    // 3*5 table
    professionalRows: [
      ['직위', '대표이사', '본부장'],
      ['성명', '윤도선', '김민기'],
      ['운용개시일', '2023-09-01', '2023-09-01'],
      ['운용 중인 다른 투자일임 계약(건)', '일육공: 28,939', '해당사항 없음'],
      ['운용규모(백만원)', '일육공: 16,882', '해당사항 없음'],
      [
        '주요 경력',
        '동국대 경제학과<br>KIS채권평가 마케팅<br>라이언자산운용(주)<br>투자자산운용사',
        '서울대학교 자원공학과<br>KB증권 Quant Trader<br>라이언자산운용(주)<br>투자자산운용사',
      ],
      ['연락처', '02-6949-0045', ''],
    ],
  },
  page6: {
    conflictText: '※ 엠엘투자자문(주)의 이해관계인과의 거래내역 : 해당사항 없음',
    algorithmRows: [['가우스앤 글로벌 밸류핀', '2021-11-01', '14', '711', '운용심사 및 시스템심사 통과 2022-05-30']],
    maintenanceRows: [['김민기', 'KB증권, 라이언자산운용(주)', '충족']],
  },
  page7: {
    dateText: '2026년 4월 1일',
    signer: '엠엘투자자문(주) 대표이사 윤도선',
  },
  page8: {
    transactionRows: buildMockTransactionRows(),
  },
};

function loadCompanyLogoDataUri() {
  const logoPath = path.join(__dirname, 'public', 'company-logo.png');
  if (!fs.existsSync(logoPath)) {
    throw new Error(`[assets] company logo not found: ${logoPath}`);
  }
  const logoBuffer = fs.readFileSync(logoPath);
  return `data:image/png;base64,${logoBuffer.toString('base64')}`;
}

async function buildInnerHtml() {
  const reportData = JSON.parse(JSON.stringify(DUMMY_REPORT_DATA));
  reportData.cover.logoDataUri = loadCompanyLogoDataUri();

  return renderInnerReportHtml({
    reportData: reportData,
    legalFooter: LEGAL_FOOTER,
  });
}

async function buildPdfBuffer() {
  const innerHtml = await buildInnerHtml();
  return renderReportPdfBuffer({
    html: innerHtml,
    password: PASSWORD,
  });
}

/** 메일 본문(HTML). react-email + Tailwind 템플릿으로 렌더링. */
async function buildEmailBodyHtml() {
  return renderEmailBodyHtml({
    legalFooter: LEGAL_FOOTER,
    passwordHint: `설정한 MAIL_PASSWORD 또는 ${PASSWORD}`,
  });
}

async function send() {
  const pdfBuffer = await buildPdfBuffer();
  const emailBodyHtml = await buildEmailBodyHtml();
  const today = new Date();
  const yyyy = String(today.getFullYear());
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const reportDate = `${yyyy}-${mm}-${dd}`;
  const attachmentName = `mystockplan-report(${reportDate}).pdf`;

  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) {
    console.error(
      'GMAIL_USER 와 GMAIL_APP_PASSWORD 가 필요합니다. 프로젝트 루트의 .env 에 예시처럼 넣었는지 확인하세요.\n' +
        '  GMAIL_USER=발송@gmail.com\n' +
        '  GMAIL_APP_PASSWORD=앱비밀번호\n' +
        '누락: ' +
        [!user && 'GMAIL_USER', !pass && 'GMAIL_APP_PASSWORD'].filter(Boolean).join(', ')
    );
    const out = path.join(__dirname, 'dist', attachmentName);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, pdfBuffer);
    console.log('메일 발송을 건너뛰고 PDF 파일만 저장했습니다:', out);
    process.exit(0);
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
  const bodyText =
    `한 달 주식 매매내역이 비밀번호 보호 PDF 첨부(${attachmentName})로 전달되었습니다.\n` +
    '첨부를 열고 비밀번호를 입력해 열람해 주세요.\n' +
    `열람 비밀번호: ${PASSWORD}\n` +
    '본 메일은 발송 전용입니다.';

  await transporter.sendMail({
    from: `"주식 매매내역 샘플" <${user}>`,
    to: TO,
    subject: '[마이스톡플랜] 투자일임보고서',
    text: bodyText,
    html: emailBodyHtml,
    attachments: [
      {
        filename: attachmentName,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  });

  console.log('발송 완료:', TO);
}

async function main() {
  await send();
}

main().catch(function (err) {
  console.error(err);
  process.exit(1);
});
