# Core vocabulary audio

The files in this directory are generated locally with the Apache-2.0 licensed
[`hexgrad/Kokoro-82M`](https://huggingface.co/hexgrad/Kokoro-82M) model and the
`af_heart` American English voice. The page loads a single MP3 only after a
read-aloud button is pressed.

Generate or resume the complete set from the repository root:

```bash
python scripts/build-glossary-audio.py
```

Use `--start-rank` and `--end-rank` to split a build into independent ranges.
Run `--manifest-only` after parallel builds finish.
