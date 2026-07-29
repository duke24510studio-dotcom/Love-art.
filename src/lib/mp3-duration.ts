// Exact MP3 duration by walking the frame headers.
//
// The video studio needs each narration clip's real length to time captions,
// chapters, and the browser render. Render's free plan has no ffmpeg and
// probing the audio in Node would mean another dependency, so the frame headers
// are parsed directly — it's a well-defined format and this is ~60 lines.

const BITRATES_V1_L3 = [
  0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 0,
];
const BITRATES_V2_L3 = [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160, 0];
const SAMPLE_RATES: Record<number, number[]> = {
  3: [44100, 48000, 32000], // MPEG 1
  2: [22050, 24000, 16000], // MPEG 2
  0: [11025, 12000, 8000], // MPEG 2.5
};

/** Byte offset of the first MPEG frame, skipping any ID3v2 tag. */
function audioStart(buf: Buffer): number {
  if (buf.length > 10 && buf.toString("ascii", 0, 3) === "ID3") {
    const size =
      ((buf[6] & 0x7f) << 21) | ((buf[7] & 0x7f) << 14) | ((buf[8] & 0x7f) << 7) | (buf[9] & 0x7f);
    return 10 + size;
  }
  return 0;
}

/**
 * Duration in seconds, or 0 if the buffer has no parseable frames.
 * Works for both CBR and VBR since every frame's own length is summed.
 */
export function mp3Duration(buf: Buffer): number {
  let offset = audioStart(buf);
  let seconds = 0;

  while (offset + 4 <= buf.length) {
    // Frame sync: 11 set bits.
    if (buf[offset] !== 0xff || (buf[offset + 1] & 0xe0) !== 0xe0) {
      offset += 1;
      continue;
    }

    const versionBits = (buf[offset + 1] >> 3) & 0x03; // 3=MPEG1, 2=MPEG2, 0=MPEG2.5
    const layerBits = (buf[offset + 1] >> 1) & 0x03; // 1 = Layer III
    const bitrateIndex = (buf[offset + 2] >> 4) & 0x0f;
    const sampleRateIndex = (buf[offset + 2] >> 2) & 0x03;
    const padding = (buf[offset + 2] >> 1) & 0x01;

    const sampleRates = SAMPLE_RATES[versionBits];
    if (
      layerBits !== 1 ||
      !sampleRates ||
      sampleRateIndex === 3 ||
      bitrateIndex === 0 ||
      bitrateIndex === 15
    ) {
      offset += 1;
      continue;
    }

    const isV1 = versionBits === 3;
    const bitrate = (isV1 ? BITRATES_V1_L3 : BITRATES_V2_L3)[bitrateIndex] * 1000;
    const sampleRate = sampleRates[sampleRateIndex];
    if (!bitrate || !sampleRate) {
      offset += 1;
      continue;
    }

    const samplesPerFrame = isV1 ? 1152 : 576;
    const frameLength =
      Math.floor(((isV1 ? 144 : 72) * bitrate) / sampleRate) + padding;
    if (frameLength <= 4) {
      offset += 1;
      continue;
    }

    seconds += samplesPerFrame / sampleRate;
    offset += frameLength;
  }

  return Math.round(seconds * 1000) / 1000;
}
