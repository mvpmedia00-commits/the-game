# Character voices

Every line of dialogue can play a recorded voice. If there's no recording for a line, the game reads it with the
computer voice instead, so you can add recordings a few at a time.

## Add a voice line
1. Open **[LINES.md](LINES.md)**. It lists every line, who says it, and the exact **file name** to use (e.g. `tony-velvet-1k3x9a.mp3`).
2. Record the line (see the tips below) and save it as an **MP3** with that exact file name.
3. Put the file in this folder (`assets/voices/`). On GitHub: open this folder → **Add file → Upload files** → drop the MP3s → **Commit**.
4. Reload the game. That line now plays your recording.

**Phone calls (📞 in LINES.md):** record them normally. The game adds the phone-speaker sound by itself.

## If you change the dialogue
A file name is tied to the exact words of the line. If you edit a line, run `node tools/voice-lines.mjs` from the repo
folder (or ask Claude) to update LINES.md, then re-record that line. Lines you didn't change keep working.

## Recording tips
- A quiet room, phone or USB mic about a hand's width from your mouth. Leave half a second of silence at the start and end.
- Mono MP3, 44.1 kHz, 128–192 kbps. Free tools: **Audacity** (record, trim, Effect → Normalize to −1 dB, export MP3), or your phone's voice recorder plus an online MP3 converter.
- One file per line. Keep each file under about 300 KB.
- AI voice services (e.g. ElevenLabs) work too. Use a plan that allows commercial use, and only clone a real person's voice with their written permission.
