import os
from openai import OpenAI
from dotenv import load_dotenv

# .env 파일에서 API 키 불러오기
load_dotenv()

# 코디세이 API 클라이언트 설정
client = OpenAI(
    api_key=os.getenv("CODYSSEY_API_KEY"),   # .env에서 키 읽기
    base_url="https://copa.codyssey.kr/v1"   # 코디세이 주소
)


def ask_ai(question):
    """AI에게 질문하고 답변을 받는 함수"""
    response = client.chat.completions.create(
        model="gpt-5-mini",
        messages=[
            {"role": "user", "content": question}
        ]
    )
    return response.choices[0].message.content


# 테스트 실행
if __name__ == "__main__":
    answer = ask_ai("안녕하세요, 잘 작동하나요?")
    print(answer)
