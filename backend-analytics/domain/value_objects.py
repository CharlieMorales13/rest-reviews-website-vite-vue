from enum import Enum
from dataclasses import dataclass


class SentimentLabel(str, Enum):
    POSITIVE = "positive"
    NEGATIVE = "negative"
    NEUTRAL = "neutral"


@dataclass(frozen=True)
class IGEWeights:
    food: float = 0.5
    service: float = 0.3
    price: float = 0.2
    scale: float = 20.0
