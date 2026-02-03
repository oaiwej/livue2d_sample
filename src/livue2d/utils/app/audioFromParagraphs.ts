import { WavFileReader } from '../audio/WavFileReader'
import { WavFileWriter } from '../audio/WavFileWriter'
import { requestAudioQuery } from '../voicevox/requestAudioQuery'
import { requestSynthesis } from '../voicevox/requestSynthesis'
import { splitSentence } from '../voicevox/splitSentence'
import type { VoiceVoxAudioQuery } from '../voicevox/type/VoiceVoxAudioQuery'
import type { Paragraph } from './type/Paragraph'

export async function audioFromParagraphs(paragraphs: Paragraph[]): Promise<WavFileReader> {
  const wavDict: { [key: Paragraph['id']]: WavFileReader } = {}
  // ParagraphからWavFileReaderを生成
  for (const paragraph of paragraphs) {
    if (paragraph.audioQueries === null) {
      paragraph.audioQueries = await audioQueriesFromParagraph(paragraph)
    }
    const wav = await audioFromParagraph(paragraph)
    if (!wav) {
      throw new Error('Failed to generate audio')
    }
    wavDict[paragraph.id] = wav
  }
  // 最初のWavFileReaderを取得
  const firstWav = wavDict[paragraphs[0].id]
  // 最後のParagraphの終了時間を取得
  const endTimeMs = Math.max(...paragraphs.map((p) => p.end))
  // 音声の出力先を作成
  const wavWriter = WavFileWriter.createSilence(endTimeMs, firstWav.getFormat())
  // Paragraphごとに音声を上書き
  for (const paragraph of paragraphs) {
    const wav = wavDict[paragraph.id]
    wavWriter.overwriteAudioAtTimePosition(paragraph.start, wav)
  }

  return new WavFileReader(wavWriter.getBuffer())
}

export async function audioQueriesFromParagraph(
  paragraph: Paragraph,
): Promise<VoiceVoxAudioQuery[]> {
  const sentences = splitSentence(paragraph.text)
  const audioQueries = (
    await Promise.all(
      sentences.map((sentence) => {
        return requestAudioQuery(sentence, paragraph.speaker)
      }),
    )
  ).map((audioQuery) => {
    audioQuery.speedScale = paragraph.speedScale
    return audioQuery
  })
  return audioQueries
}

export async function audioFromParagraph(paragraph: Paragraph): Promise<WavFileReader | null> {
  if (paragraph.audioQueries === null) {
    paragraph.audioQueries = await audioQueriesFromParagraph(paragraph)
  }
  const wavFiles = (
    await Promise.all(
      paragraph.audioQueries.map((audioQuery) => {
        return requestSynthesis(audioQuery, paragraph.speaker)
      }),
    )
  ).map((buffer) => new WavFileReader(buffer))

  if (wavFiles.length === 0) {
    return null
  }
  const result = new WavFileWriter(wavFiles[0].getFormat())
  result.append(wavFiles)
  return new WavFileReader(result.getBuffer())
}
