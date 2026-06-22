GREETING_RESPONSES = [
    "أهلاً وسهلاً! إزاي أقدر أساعدك النهارده؟",
    "مرحباً بك! أنا هنا عشان أساعدك، ممكن تقولي إيه اللي محتاجه؟",
    "أهلاً بيك! إيه اللي أقدر أعملوه عشانك؟",
]

HUMAN_REQUEST_RESPONSE = "هورينك لحد من فريقنا دلوقتي عشان يساعدك."

COMPLAINT_RESPONSE = "آسفين على الإزعاج. هورينك شكوتك لفريقنا وهنتواصل معاك في أقرب وقت."

HUMAN_HANDOFF_FALLBACK = "هورينك لحد من فريقنا دلوقتي"


def get_greeting_response() -> str:
    import random
    return random.choice(GREETING_RESPONSES)
