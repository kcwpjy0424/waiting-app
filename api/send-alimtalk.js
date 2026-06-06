// ================================================
// 카카오 알림톡 발송 함수 (솔라피 API 사용)
// ================================================
// 이 파일은 Vercel 서버 안에서 실행됩니다.
// API 키가 여기 있지 않고 Vercel 환경변수에 저장되어 안전합니다.
// ================================================

const crypto = require('crypto');

module.exports = async function handler(req, res) {
  // CORS 헤더 (admin.html에서 호출 허용)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 브라우저 사전 요청 처리
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // POST 요청만 허용
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST 방식만 허용됩니다' });
  }

  const { phone, number } = req.body;

  if (!phone || number === undefined) {
    return res.status(400).json({ error: '전화번호와 대기번호가 필요합니다' });
  }

  // ================================================
  // Vercel 대시보드에서 설정한 환경변수 읽기
  // (설정 방법은 가이드 문서 참고)
  // ================================================
  const API_KEY      = process.env.SOLAPI_API_KEY;       // 솔라피 API Key
  const API_SECRET   = process.env.SOLAPI_API_SECRET;    // 솔라피 API Secret
  const SENDER_PHONE = process.env.SOLAPI_SENDER_PHONE;  // 발신번호 (카카오 채널 등록 번호)
  const PF_ID        = process.env.SOLAPI_PFID;          // 카카오 채널 ID (KA01PF...)
  const TEMPLATE_ID  = process.env.SOLAPI_TEMPLATE_ID;   // 알림톡 템플릿 ID (KA01TP...)

  if (!API_KEY || !API_SECRET || !SENDER_PHONE || !PF_ID || !TEMPLATE_ID) {
    console.error('[알림톡] 환경변수 미설정');
    return res.status(500).json({
      success: false,
      error: 'Vercel 환경변수가 설정되지 않았습니다. 가이드를 참고하세요.'
    });
  }

  try {
    // ================================================
    // 솔라피 인증 헤더 만들기 (HMAC-SHA256 방식)
    // ================================================
    const date      = new Date().toISOString();
    const salt      = Date.now().toString(36) + Math.random().toString(36).substring(2);
    const hmac      = crypto.createHmac('sha256', API_SECRET);
    hmac.update(date + salt);
    const signature = hmac.digest('hex');
    const authHeader = `HMAC-SHA256 apiKey=${API_KEY}, date=${date}, salt=${salt}, signature=${signature}`;

    // 전화번호 하이픈 제거 (01012345678 형식으로)
    const cleanPhone  = phone.replace(/-/g, '');
    const cleanSender = SENDER_PHONE.replace(/-/g, '');

    // ================================================
    // 솔라피 API 호출
    // ================================================
    const response = await fetch('https://api.solapi.com/messages/v4/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify({
        message: {
          to: cleanPhone,
          from: cleanSender,
          kakaoOptions: {
            pfId: PF_ID,
            templateId: TEMPLATE_ID,
            variables: {
              '#{번호}': String(number)  // 알림톡 템플릿의 #{번호} 변수
            }
          }
        }
      })
    });

    const result = await response.json();

    if (response.ok) {
      console.log('[알림톡] 발송 성공:', cleanPhone);
      return res.status(200).json({ success: true });
    } else {
      console.error('[알림톡] 발송 실패:', result);
      return res.status(200).json({
        success: false,
        error: result.errorMessage || result.message || '알림톡 전송 실패'
      });
    }

  } catch (error) {
    console.error('[알림톡] 서버 오류:', error);
    return res.status(500).json({ success: false, error: '서버 내부 오류' });
  }
};
