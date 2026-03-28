import asyncio
import logging
import io
import struct
from dataclasses import dataclass
from typing import AsyncIterator

import aiohttp

from livekit.agents import tts
from livekit import rtc

logger = logging.getLogger("chatterbox-tts")

SAMPLE_RATE = 24000
NUM_CHANNELS = 1


@dataclass
class ChatterboxTTSOptions:
    server_url: str = "http://localhost:8000"
    voice: str = "default"
    exaggeration: float = 0.5
    cfg_weight: float = 0.5
    sample_rate: int = SAMPLE_RATE


class ChatterboxTTS(tts.TTS):
    def __init__(
        self,
        *,
        server_url: str = "http://localhost:8000",
        voice: str = "default",
        exaggeration: float = 0.5,
        cfg_weight: float = 0.5,
    ):
        super().__init__(
            capabilities=tts.TTSCapabilities(streaming=False),
            sample_rate=SAMPLE_RATE,
            num_channels=NUM_CHANNELS,
        )
        self._opts = ChatterboxTTSOptions(
            server_url=server_url.rstrip("/"),
            voice=voice,
            exaggeration=exaggeration,
            cfg_weight=cfg_weight,
        )

    def synthesize(self, text: str, *, conn_options=None) -> tts.ChunkedStream:
        return ChatterboxChunkedStream(tts=self, input_text=text, opts=self._opts)


class ChatterboxChunkedStream(tts.ChunkedStream):
    def __init__(self, *, tts: ChatterboxTTS, input_text: str, opts: ChatterboxTTSOptions):
        super().__init__(tts=tts, input_text=input_text)
        self._opts = opts

    async def _run(self) -> None:
        try:
            payload = {
                "text": self._input_text,
                "voice": self._opts.voice,
                "exaggeration": self._opts.exaggeration,
                "cfg_weight": self._opts.cfg_weight,
            }

            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self._opts.server_url}/tts",
                    json=payload,
                    timeout=aiohttp.ClientTimeout(total=30),
                ) as resp:
                    resp.raise_for_status()
                    raw_audio = await resp.read()

            pcm_data = _wav_to_pcm(raw_audio)
            frame = rtc.AudioFrame(
                data=pcm_data,
                sample_rate=self._opts.sample_rate,
                num_channels=NUM_CHANNELS,
                samples_per_channel=len(pcm_data) // 2,
            )
            self._event_ch.send_nowait(
                tts.SynthesizedAudio(request_id=self._request_id, frame=frame)
            )
        except Exception as e:
            logger.error(f"[ChatterboxTTS] synthesis error: {e}")
            raise


def _wav_to_pcm(wav_bytes: bytes) -> bytes:
    if wav_bytes[:4] == b"RIFF":
        data_pos = wav_bytes.find(b"data")
        if data_pos != -1:
            data_size = struct.unpack_from("<I", wav_bytes, data_pos + 4)[0]
            return wav_bytes[data_pos + 8: data_pos + 8 + data_size]
    return wav_bytes
