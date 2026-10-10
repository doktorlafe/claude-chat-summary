import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Summary } from '../types'

const summary = atom({ plugin: 'chat-summary', key: 'summary' } as const, null)

const SYSTEM =
  'You label conversations. Reply with 3 to 6 words naming what the conversation ' +
  'is about, in the language the user writes in. No quotes, no full stop, nothing else.'

const cut = (text: string, length: number) =>
  text.length > length ? `${text.slice(0, length)}…` : text

// The first prompt says what the chat set out to do, the last few where it went.
const digest = async ($: EngineInterface) => {
  const messages = await $.session.messages()

  if (!Array.isArray(messages)) {
    return ''
  }

  const asked = messages
    .filter(one => one.role === 'user' && one.text.trim() !== '')
    .map(one => cut(one.text.trim(), 300))

  if (asked.length === 0) {
    return ''
  }

  const recent = asked.slice(1).slice(-5)
  const answer = messages.findLast(
    one => one.role === 'assistant' && one.text.trim() !== '',
  )

  return [
    `First request: ${asked[0]}`,
    ...recent.map(text => `Later request: ${text}`),
    answer ? `Last answer: ${cut(answer.text.trim(), 400)}` : '',
  ]
    .filter(Boolean)
    .join('\n')
}

const refresh = async ($: EngineInterface) => {
  const prompt = await digest($)

  if (prompt === '') {
    return
  }

  const reply = await $.model.complete({
    model: 'haiku',
    system: SYSTEM,
    prompt,
    maxTokens: 40,
    timeoutMs: 8000,
  })

  if (!reply.isAnswered) {
    return
  }

  const line = reply.text.trim().split('\n')[0]?.replace(/^["'„“]+|["'“”.]+$/g, '') ?? ''

  if (line !== '') {
    const next: Summary = cut(line, 60)
    await update($, summary, () => next)
  }
}

export const register: Register = on => {
  // A resumed chat has a transcript and no summary yet.
  on('session.start', async ($, e, next) => {
    const started = await next(e)

    if (e.isInteractive && (await read($, summary)) === null) {
      await refresh($)
    }

    return started
  })

  on('turn.complete', async ($, e, next) => {
    const ended = await next(e)

    if (e.agentId === undefined) {
      await refresh($)
    }

    return ended
  })

  // The session's title is what the terminal's window or tab is named after.
  on('classic.UserPromptSubmit', async ($, e, next) => {
    const result = await next(e)
    const text = await read($, summary)

    return text === null ? result : { ...result, sessionTitle: text }
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const text = await read($, summary)

    if (e.props.hasSurvey || text === null) {
      return next(e)
    }

    const { Box, Text } = $.ui.resolve(e)

    return (
      <Box>
        <Text dimColor>
          ◆ {text}
        </Text>
      </Box>
    )
  })
}
