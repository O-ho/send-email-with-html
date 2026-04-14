'use strict';

const React = require('react');
const {
  Body,
  Container,
  Column,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Row,
  Section,
  Tailwind,
  Text,
} = require('@react-email/components');
const { render } = require('@react-email/render');
// 본문 내용 html 예시, 160 복제해서 쓴다면 필요없어짐
function SecureEmailBody(props) {
  const { legalFooter, passwordHint } = props;

  return React.createElement(
    Html,
    { lang: 'ko' },
    React.createElement(Head, null),
    React.createElement(Preview, null, '마이스톡플랜 거래 내역 보고서 안내'),
    React.createElement(
      Tailwind,
      {
        config: {
          theme: {
            extend: {
              colors: {
                brand: '#0067ac',
                ink: '#212528',
                body: '#343a40',
                muted: '#6d747b',
              },
            },
          },
        },
      },
      React.createElement(
        Body,
        { className: 'm-0 bg-white p-0' },
        React.createElement(
          Container,
          { className: 'mx-auto my-0 w-full max-w-[920px] px-5' },
          React.createElement(
            Section,
            { className: 'py-8' },
            React.createElement('div', { className: 'h-1 w-full bg-brand' }),
            React.createElement(
              Heading,
              { className: 'mb-0 mt-8 text-[22px] font-bold leading-[1.35] text-black' },
              '마이스톡플랜'
            )
          ),
          React.createElement(
            Section,
            null,
            React.createElement(
              Heading,
              {
                as: 'h2',
                className: 'm-0 text-[28px] font-semibold leading-[36px] text-ink',
              },
              '주식 매매내역 보고서 안내'
            ),
            React.createElement(
              Text,
              { className: 'mb-0 mt-6 text-[14px] leading-6 text-body' },
              '첨부파일은 고객님의 소중한 개인정보 보호를 위해 암호화하여 발송됩니다.'
            ),
            React.createElement(
              Text,
              { className: 'mb-0 mt-3 text-[14px] leading-6 text-body' },
              `첨부파일을 저장한 뒤에 생년월일 6자리(YYMMDD) 비밀번호로 열람할 수 있습니다. (샘플: ${passwordHint})`
            )
          ),
          React.createElement(Hr, { className: 'my-8 border border-solid border-[#e4eaf2]' }),
          React.createElement(
            Section,
            { className: 'rounded-sm bg-[#f8f9fa] px-4 py-5' },
            React.createElement(
              Heading,
              { as: 'h3', className: 'm-0 text-[15px] font-semibold leading-[23px] text-ink' },
              '보안메일 확인 방법'
            ),
            React.createElement(Hr, { className: 'mb-4 mt-4 border border-solid border-[#dee2e6]' }),
            React.createElement(
              Row,
              { className: 'mb-4' },
              React.createElement(
                Column,
                { className: 'w-[48px]' },
                React.createElement(
                  'span',
                  {
                    className:
                      'inline-block h-9 w-9 rounded-[18px] bg-brand text-center text-[16px] font-bold leading-9 text-white',
                  },
                  '1'
                )
              ),
              React.createElement(
                Column,
                null,
                React.createElement(
                  Text,
                  {
                    className: 'mb-0 ml-2 text-[14px] font-bold leading-[21px] text-[#495057]',
                    style: { marginTop: 0, marginBottom: 0 },
                  },
                  '첨부파일 다운로드 후 열기'
                )
              )
            ),
            React.createElement(
              Row,
              { className: 'mb-4' },
              React.createElement(
                Column,
                { className: 'w-[48px]' },
                React.createElement(
                  'span',
                  {
                    className:
                      'inline-block h-9 w-9 rounded-[18px] bg-brand text-center text-[16px] font-bold leading-9 text-white',
                  },
                  '2'
                )
              ),
              React.createElement(
                Column,
                null,
                React.createElement(
                  Text,
                  {
                    className: 'mb-0 ml-2 text-[14px] font-bold leading-[21px] text-[#495057]',
                    style: { marginTop: 0, marginBottom: 0 },
                  },
                  '비밀번호 입력'
                )
              )
            ),
            React.createElement(
              Text,
              { className: 'm-0 text-[13px] leading-[22px] text-muted' },
              '- 첨부파일이 안 열린다면 파일을 PC에 저장(또는 다른 이름으로 저장) 후 실행해 주세요.'
            )
          ),
          React.createElement(Hr, { className: 'mb-4 mt-8 border border-solid border-[#e9ecef]' }),
          React.createElement(
            'div',
            {
              className: 'pb-10 text-[13px] leading-5 text-muted',
              dangerouslySetInnerHTML: {
                __html:
                  `${legalFooter.companyRowHtml}<br>` +
                  `${legalFooter.teleSales}<br>` +
                  `${legalFooter.customer}<br><br>` +
                  `${legalFooter.copyright}<br><br>` +
                  `${legalFooter.disclaimer}`,
              },
            }
          )
        )
      )
    )
  );
}

async function renderEmailBodyHtml(props) {
  const element = React.createElement(SecureEmailBody, props);
  return render(element, {
    pretty: true,
  });
}

module.exports = {
  renderEmailBodyHtml,
};
