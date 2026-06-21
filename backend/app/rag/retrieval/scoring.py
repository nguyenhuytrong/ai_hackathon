import math
import re
from collections import Counter

_WORD_RE = re.compile(r"[a-zA-Z0-9]+")


def tokenize(text: str) -> list[str]:
    return [token.lower() for token in _WORD_RE.findall(text)]


def cosine_similarity(left: list[float] | None, right: list[float] | None) -> float:
    if not left or not right:
        return 0.0
    length = min(len(left), len(right))
    if length == 0:
        return 0.0
    dot = sum(left[index] * right[index] for index in range(length))
    left_norm = math.sqrt(sum(value * value for value in left[:length])) or 1.0
    right_norm = math.sqrt(sum(value * value for value in right[:length])) or 1.0
    # Convert [-1, 1] into [0, 1] so it can be combined with metadata/keyword scores.
    return max(0.0, min(1.0, (dot / (left_norm * right_norm) + 1.0) / 2.0))


def keyword_overlap_score(query: str, text: str) -> float:
    query_tokens = Counter(tokenize(query))
    if not query_tokens:
        return 0.0
    text_tokens = set(tokenize(text))
    matched = sum(weight for token, weight in query_tokens.items() if token in text_tokens)
    total = sum(query_tokens.values())
    return matched / total
