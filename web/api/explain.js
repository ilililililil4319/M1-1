// web/api/explain.js
// Vercel Serverless Function (Node.js)
// 프론트에서 받은 구간 통계를 코디세이 API(OpenAI 호환)에 전달해
// 자연어 해설 코멘트를 생성한다. API 키는 서버(환경변수)에서만 사용하며
// 프론트엔드 코드에는 절대 노출하지 않는다.

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "허용되지 않는 요청 방식입니다." });
    return;
  }

  const { start, end, first, last, changePct, max, min, count } = req.body || {};

  // 입력값 검증 (실패 처리)
  if (!start || !end || first == null || last == null) {
    res.status(400).json({ error: "필요한 구간 정보가 전달되지 않았습니다." });
    return;
  }

  const apiKey = process.env.CODYSSEY_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "서버에 API 키가 설정되어 있지 않습니다. Vercel 환경변수를 확인해주세요." });
    return;
  }

  const direction = Number(changePct) >= 0 ? "상승" : "하락";
  const prompt = `당신은 환율 데이터를 일반인이 이해하기 쉽게 설명하는 애널리스트입니다.
아래는 원/달러 환율의 특정 기간 데이터입니다.

- 기간: ${start} ~ ${end} (${count}개 영업일)
- 기간 시작 환율: ${first}원
- 기간 종료 환율: ${last}원
- 기간 최고가: ${max}원 / 최저가: ${min}원
- 기간 변동률: ${changePct}% (${direction})

조건:
1. 데이터에 근거한 사실만 서술하고, 추측성 투자 조언은 하지 않는다.
2. "이 기간 원/달러 환율은 O% 상승/하락했습니다" 형태로 핵심 변동을 1~2문장으로 요약한다.
3. 전문 용어 대신 일반인이 이해할 수 있는 표현을 사용한다.
4. 3문장을 넘기지 않는다.`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000); // 15초 타임아웃

    const response = await fetch("https://copa.codyssey.kr/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-5-mini",
        messages: [{ role: "user", content: prompt }],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      // 요청 제한(rate limit) 등 API 자체 오류
      const errText = await response.text().catch(() => "");
      res.status(502).json({ error: `AI API 호출 실패 (${response.status}) ${errText}`.trim() });
      return;
    }

    const data = await response.json();
    const explanation = data?.choices?.[0]?.message?.content?.trim();

    if (!explanation) {
      res.status(502).json({ error: "AI 응답에서 해설 내용을 찾을 수 없습니다." });
      return;
    }

    res.status(200).json({ explanation });
  } catch (err) {
    if (err.name === "AbortError") {
      res.status(504).json({ error: "AI 응답이 지연되고 있습니다. 잠시 후 다시 시도해주세요." });
      return;
    }
    res.status(500).json({ error: "서버 오류: " + err.message });
  }
};
