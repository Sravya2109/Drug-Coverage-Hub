import re
from datetime import datetime


def clean_whitespace(text: str) -> str:
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def normalize_drug_name(name: str) -> str:
    if not name:
        return name
    name = name.strip()
    name = re.sub(r"[®™©]", "", name)   # strip trademark symbols
    name = re.sub(r"\s+", " ", name)
    name = re.sub(r"[.,;:]+$", "", name)
    return name.title()


def normalize_date(raw: str) -> str | None:
    if not raw:
        return None
    raw = raw.strip()
    formats = [
        "%m/%d/%Y",
        "%m-%d-%Y",
        "%B %d, %Y",
        "%b %d, %Y",
        "%B %d %Y",
        "%b %d %Y",
        "%Y-%m-%d",
        "%Y/%m/%d",
        "%d %B %Y",
        "%d %b %Y",
    ]
    for fmt in formats:
        try:
            return datetime.strptime(raw, fmt).strftime("%Y-%m-%d")
        except ValueError:
            continue
    return None


def extract_codes(text: str, pattern: str) -> list[str]:
    return re.findall(pattern, text)


def split_into_chunks(text: str, max_chars: int) -> list[str]:
    if len(text) <= max_chars:
        return [text]

    sentence_endings = re.compile(r"(?<=[.!?])\s+")
    sentences = sentence_endings.split(text)

    chunks: list[str] = []
    current = ""
    for sentence in sentences:
        if len(current) + len(sentence) + 1 > max_chars:
            if current:
                chunks.append(current.strip())
            if len(sentence) > max_chars:
                # sentence itself too long — hard split
                for i in range(0, len(sentence), max_chars):
                    chunks.append(sentence[i : i + max_chars])
                current = ""
            else:
                current = sentence
        else:
            current = current + " " + sentence if current else sentence

    if current:
        chunks.append(current.strip())

    return chunks
