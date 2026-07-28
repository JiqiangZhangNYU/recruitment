#!/usr/bin/env python3
"""Generate on-demand glossary speech clips with the local Kokoro model."""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import tempfile
import time
from pathlib import Path

import imageio_ffmpeg
import numpy as np
import soundfile as sf
import torch
from kokoro import KPipeline


ROOT = Path(__file__).resolve().parents[1]
GLOSSARY_PATH = ROOT / "challenges" / "core-vocabulary" / "glossary.json"
OUTPUT_DIR = ROOT / "audio" / "core-vocabulary"
SAMPLE_RATE = 24_000
KINDS = {
    "word": ("term", 0.86),
    "example": ("example", 0.94),
    "interview": ("interviewExpression", 0.92),
}
NUMBER_WORDS = {
    "0": "zero",
    "1": "one",
    "2": "two",
    "3": "three",
    "4": "four",
    "5": "five",
    "6": "six",
    "7": "seven",
    "8": "eight",
    "9": "nine",
}
ACRONYM_PATTERN = re.compile(r"\b(?:[A-Z]{2,}[A-Z0-9]*|[A-Z]\d[A-Z0-9]+|\d[A-Z]{1,})\b")
KOKORO_VOWELS = frozenset("AIOWYiuæɑɔəɛɜɪʊʌ")
KOKORO_PHONEMES = frozenset("AIOWYbdfhijklmnpstuvwzæðŋɑɔəɛɜɡɪɹʃʊʌʒʤʧˈˌθ ,.")
WEAK_PHONEME_WORDS = frozenset({"ænd", "ənd", "əɹ", "əv", "fɔɹ", "fəɹ", "tɪ", "tə"})
IPA_TO_KOKORO = (
    ("eɪ", "A"),
    ("aɪ", "I"),
    ("oʊ", "O"),
    ("aʊ", "W"),
    ("ɔɪ", "Y"),
    ("dʒ", "ʤ"),
    ("tʃ", "ʧ"),
    ("ɝ", "ɜɹ"),
    ("ɚ", "əɹ"),
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--start-rank", type=int, default=1)
    parser.add_argument("--end-rank", type=int, default=500)
    parser.add_argument("--kind", choices=["all", *KINDS], default="all")
    parser.add_argument("--voice", default="af_heart")
    parser.add_argument("--threads", type=int, default=8)
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--manifest-only", action="store_true")
    parser.add_argument("--no-manifest", action="store_true")
    return parser.parse_args()


def spoken_acronym(match: re.Match[str]) -> str:
    token = match.group(0)
    if token == "A2A":
        return "A to A"
    if token == "3D":
        return "three D"
    if token == "3DS":
        return "three D S"
    return " ".join(NUMBER_WORDS.get(char, char) for char in token)


def prepare_text(text: str, kind: str) -> str:
    text = text.replace("PayFac", "pay fac")
    text = re.sub(r"\bA/B\b", "A B", text)
    text = ACRONYM_PATTERN.sub(spoken_acronym, text)
    text = re.sub(r"\s+", " ", text).strip()
    if kind == "word" and text[-1:] not in ".!?":
        text += "."
    return text


def ipa_to_kokoro_phonemes(ipa: str) -> str:
    if not re.fullmatch(r"/.+/", ipa):
        raise ValueError(f"Invalid glossary IPA: {ipa}")

    phonemes = ipa[1:-1]
    for ipa_value, kokoro_value in IPA_TO_KOKORO:
        phonemes = phonemes.replace(ipa_value, kokoro_value)
    phonemes = phonemes.replace("ː", "")

    shifted = []
    pending_stress = None
    for char in phonemes:
        if char in "ˈˌ":
            if pending_stress is not None:
                raise ValueError(f"Consecutive stress marks in glossary IPA: {ipa}")
            pending_stress = char
            continue
        if pending_stress is not None and char in KOKORO_VOWELS:
            shifted.append(pending_stress)
            pending_stress = None
        shifted.append(char)
    if pending_stress is not None:
        raise ValueError(f"Stress mark has no following vowel in glossary IPA: {ipa}")

    phonemes = "".join(shifted)
    if not any(stress in phonemes for stress in "ˈˌ"):
        parts = re.split(r"([ ,]+)", phonemes)
        for index, part in enumerate(parts):
            vowels = [position for position, char in enumerate(part) if char in KOKORO_VOWELS]
            if len(vowels) == 1 and part not in WEAK_PHONEME_WORDS:
                position = vowels[0]
                parts[index] = f"{part[:position]}ˈ{part[position:]}"
        phonemes = "".join(parts)
    phonemes += "."
    unsupported = sorted(set(phonemes) - KOKORO_PHONEMES)
    if unsupported:
        raise ValueError(f"Unsupported Kokoro phonemes {unsupported} converted from: {ipa}")
    return phonemes


def clip_audio(audio: np.ndarray) -> np.ndarray:
    samples = np.asarray(audio, dtype=np.float32).reshape(-1)
    audible = np.flatnonzero(np.abs(samples) > 0.0005)
    if audible.size:
        padding = int(SAMPLE_RATE * 0.08)
        start = max(0, int(audible[0]) - padding)
        end = min(samples.size, int(audible[-1]) + padding + 1)
        samples = samples[start:end]
    peak = float(np.max(np.abs(samples))) if samples.size else 0.0
    if peak:
        samples = samples * (0.92 / peak)
    return samples


def encode_mp3(audio: np.ndarray, destination: Path, ffmpeg: str) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix=".glossary-audio-", dir=destination.parent) as temp_dir:
        temp_path = Path(temp_dir)
        wav_path = temp_path / "speech.wav"
        mp3_path = temp_path / "speech.mp3"
        sf.write(wav_path, clip_audio(audio), SAMPLE_RATE, subtype="PCM_16")
        subprocess.run(
            [
                ffmpeg,
                "-hide_banner",
                "-loglevel",
                "error",
                "-y",
                "-i",
                str(wav_path),
                "-ac",
                "1",
                "-ar",
                str(SAMPLE_RATE),
                "-codec:a",
                "libmp3lame",
                "-b:a",
                "48k",
                str(mp3_path),
            ],
            check=True,
        )
        os.replace(mp3_path, destination)


def generate_audio(pipeline: KPipeline, text: str, voice: str, speed: float) -> np.ndarray:
    chunks = []
    for result in pipeline(text, voice=voice, speed=speed, split_pattern=r"\n+"):
        audio = result.audio if hasattr(result, "audio") else result[2]
        chunks.append(audio.detach().cpu().numpy() if hasattr(audio, "detach") else np.asarray(audio))
    if not chunks:
        raise RuntimeError(f"Kokoro returned no audio for: {text}")
    return np.concatenate(chunks)


def generate_audio_from_phonemes(
    pipeline: KPipeline,
    phonemes: str,
    voice: str,
    speed: float,
) -> np.ndarray:
    chunks = []
    for result in pipeline.generate_from_tokens(phonemes, voice=voice, speed=speed):
        audio = result.audio if hasattr(result, "audio") else result[2]
        chunks.append(audio.detach().cpu().numpy() if hasattr(audio, "detach") else np.asarray(audio))
    if not chunks:
        raise RuntimeError(f"Kokoro returned no audio for phonemes: {phonemes}")
    return np.concatenate(chunks)


def write_manifest(glossary: dict, voice: str) -> None:
    expected = [
        f"{entry['rank']:03d}-{kind}.mp3"
        for entry in glossary["entries"]
        for kind in KINDS
    ]
    completed = [
        name for name in expected
        if (OUTPUT_DIR / name).exists() and (OUTPUT_DIR / name).stat().st_size > 0
    ]
    manifest = {
        "version": 2,
        "model": "hexgrad/Kokoro-82M",
        "voice": voice,
        "language": "en-US",
        "sampleRate": SAMPLE_RATE,
        "format": "MP3 mono 48 kbps",
        "pathPattern": "{rank:03d}-{word|example|interview}.mp3",
        "wordPhonemeSource": "challenges/core-vocabulary/glossary.json#ipa",
        "glossaryVersion": glossary["version"],
        "expectedCount": len(expected),
        "completedCount": len(completed),
    }
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUTPUT_DIR / "manifest.json").write_text(
        json.dumps(manifest, indent=2, ensure_ascii=True) + "\n",
        encoding="utf-8",
    )


def main() -> None:
    args = parse_args()
    glossary = json.loads(GLOSSARY_PATH.read_text(encoding="utf-8"))
    word_phonemes = {
        entry["rank"]: ipa_to_kokoro_phonemes(entry["ipa"])
        for entry in glossary["entries"]
    }
    if args.manifest_only:
        write_manifest(glossary, args.voice)
        return

    if not 1 <= args.start_rank <= args.end_rank <= glossary["count"]:
        raise SystemExit(f"Rank range must be within 1-{glossary['count']}")

    torch.set_num_threads(max(1, args.threads))
    torch.set_num_interop_threads(1)
    pipeline = KPipeline(lang_code="a", repo_id="hexgrad/Kokoro-82M", device="cpu")
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    kinds = list(KINDS) if args.kind == "all" else [args.kind]
    entries = [
        entry for entry in glossary["entries"]
        if args.start_rank <= entry["rank"] <= args.end_rank
    ]
    total = len(entries) * len(kinds)
    generated = 0
    skipped = 0
    started_at = time.monotonic()

    for entry in entries:
        for kind in kinds:
            field, speed = KINDS[kind]
            destination = OUTPUT_DIR / f"{entry['rank']:03d}-{kind}.mp3"
            if destination.exists() and destination.stat().st_size > 0 and not args.force:
                skipped += 1
                continue
            if kind == "word":
                phonemes = word_phonemes[entry["rank"]]
                audio = generate_audio_from_phonemes(pipeline, phonemes, args.voice, speed)
            else:
                speech_text = prepare_text(entry[field], kind)
                audio = generate_audio(pipeline, speech_text, args.voice, speed)
            encode_mp3(audio, destination, ffmpeg)
            generated += 1
            elapsed = time.monotonic() - started_at
            done = generated + skipped
            print(
                f"[{done:04d}/{total:04d}] {destination.name} "
                f"({len(audio) / SAMPLE_RATE:.1f}s, {elapsed:.1f}s elapsed)",
                flush=True,
            )

    if not args.no_manifest:
        write_manifest(glossary, args.voice)
    print(f"Finished: {generated} generated, {skipped} skipped", flush=True)


if __name__ == "__main__":
    main()
