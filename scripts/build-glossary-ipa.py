#!/usr/bin/env python3
"""Add American IPA transcriptions to the core vocabulary glossary."""

from __future__ import annotations

import json
import re
from pathlib import Path

import eng_to_ipa


ROOT = Path(__file__).resolve().parents[1]
GLOSSARY_PATH = ROOT / "challenges" / "core-vocabulary" / "glossary.json"
TOKEN_PATTERN = re.compile(r"[A-Za-z0-9]+|[,/]")
PARENTHETICAL_ABBREVIATION = re.compile(r"\s*\([A-Za-z0-9]+\)")

LETTER_IPA = {
    "A": "eɪ", "B": "biː", "C": "siː", "D": "diː", "E": "iː",
    "F": "ɛf", "G": "dʒiː", "H": "eɪtʃ", "I": "aɪ", "J": "dʒeɪ",
    "K": "keɪ", "L": "ɛl", "M": "ɛm", "N": "ɛn", "O": "oʊ",
    "P": "piː", "Q": "kjuː", "R": "ɑɹ", "S": "ɛs", "T": "tiː",
    "U": "juː", "V": "viː", "W": "dʌbəljuː", "X": "ɛks",
    "Y": "waɪ", "Z": "ziː",
}
DIGIT_IPA = {
    "0": "zɪɹoʊ", "1": "wʌn", "2": "tuː", "3": "θɹiː", "4": "fɔɹ",
    "5": "faɪv", "6": "sɪks", "7": "sɛvən", "8": "eɪt", "9": "naɪn",
}
MANUAL_IPA = {
    "bin": "bɪn",
    "chargeback": "ˈtʃɑɹdʒˌbæk",
    "data": "ˈdeɪtə",
    "exit": "ˈɛɡzɪt",
    "idempotency": "ˌaɪdəmˈpoʊtənsi",
    "integration": "ˌɪntəˈɡɹeɪʃən",
    "numerator": "ˈnuːməˌɹeɪtəɹ",
    "onboarding": "ˈɑnˌbɔɹdɪŋ",
    "pan": "pæn",
    "passkey": "ˈpæsˌkiː",
    "payfac": "ˈpeɪˌfæk",
    "prefunding": "pɹiːˈfʌndɪŋ",
    "representment": "ˌɹiːpɹɪˈzɛntmənt",
    "roadmap": "ˈɹoʊdˌmæp",
    "target": "ˈtɑɹɡət",
    "tokenization": "ˌtoʊkənəˈzeɪʃən",
    "updater": "ˈʌpˌdeɪtəɹ",
    "uptime": "ˈʌpˌtaɪm",
    "watchlist": "ˈwɑtʃˌlɪst",
    "webhook": "ˈwɛbˌhʊk",
}


def add_initialism_stress(sounds: list[str]) -> str:
    if len(sounds) == 1:
        return f"ˈ{sounds[0]}"
    sounds[0] = f"ˌ{sounds[0]}"
    sounds[-1] = f"ˈ{sounds[-1]}"
    return " ".join(sounds)


def initialism_ipa(token: str) -> str:
    if token == "A2A":
        return "ˌeɪ tə ˈeɪ"
    sounds = [LETTER_IPA.get(char, DIGIT_IPA.get(char)) for char in token]
    if any(sound is None for sound in sounds):
        raise ValueError(f"Unsupported initialism: {token}")
    return add_initialism_stress(sounds)


def normalize_ipa(value: str) -> str:
    normalized = (
        value.replace("ʧ", "tʃ")
        .replace("ʤ", "dʒ")
        .replace("r", "ɹ")
        .replace("g", "ɡ")
    )
    return re.sub(r"([ˈˌ][^aeiouæɑɔɛɪʊʌəɚɝ]*)ə", r"\1ʌ", normalized)


def token_ipa(token: str) -> str:
    manual = MANUAL_IPA.get(token.lower())
    if manual:
        return manual
    if token.isupper() or re.fullmatch(r"(?:[A-Z]+\d+[A-Z0-9]*|\d+[A-Z]+)", token):
        return initialism_ipa(token)
    converted = eng_to_ipa.convert(token.lower(), stress_marks="both")
    if converted.endswith("*"):
        raise ValueError(f"No American IPA entry for: {token}")
    return normalize_ipa(converted)


def term_ipa(term: str) -> str:
    spoken_term = PARENTHETICAL_ABBREVIATION.sub("", term)
    parts: list[str] = []
    for token in TOKEN_PATTERN.findall(spoken_term):
        if token == ",":
            if parts:
                parts[-1] += ","
            continue
        if token == "/":
            continue
        parts.append(token_ipa(token))
    if not parts:
        raise ValueError(f"No pronunciation tokens for: {term}")
    return f"/{' '.join(parts)}/"


def main() -> None:
    glossary = json.loads(GLOSSARY_PATH.read_text(encoding="utf-8"))
    updated_entries = []
    for entry in glossary["entries"]:
        updated = {}
        for key, value in entry.items():
            if key == "ipa":
                continue
            updated[key] = value
            if key == "term":
                updated["ipa"] = term_ipa(value)
        updated_entries.append(updated)
    glossary["version"] = 3
    glossary["entries"] = updated_entries
    GLOSSARY_PATH.write_text(
        json.dumps(glossary, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Added American IPA to {len(updated_entries)} glossary entries")


if __name__ == "__main__":
    main()
