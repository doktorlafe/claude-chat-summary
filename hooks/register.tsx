import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Summary } from '../types'

const summary = atom({ plugin: 'chat-summary', key: 'summary' } as const, null)

const SYSTEM =
  'You label conversations. Reply with 3 to 6 words naming what the conversation ' +
  'is about, in the language the user writes in. No quotes, no full stop, nothing else.'

// Asked over the whole transcript, so it can name what the short label leaves out.
const LONG =
  'Summarize this conversation so far for the person who had it, in the language ' +
  'they write in. Plain text, no headings: one or two sentences on what it is about, ' +
  'then short "- " lines for what was asked, what was done or decided, and what is ' +
  'still open. At most 200 words. Reply with the summary alone.'

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

// The opening request and as many of the latest messages as fit the budget.
const transcript = async ($: EngineInterface) => {
  const messages = await $.session.messages()

  if (!Array.isArray(messages)) {
    return ''
  }

  const lines = messages
    .filter(one => one.text.trim() !== '')
    .map(one => `${one.role === 'user' ? 'User' : 'Assistant'}: ${cut(one.text.trim(), 1500)}`)
  const [first, ...rest] = lines

  if (first === undefined) {
    return ''
  }

  const latest: string[] = []
  let room = 60_000 - first.length

  for (const line of rest.reverse()) {
    room -= line.length

    if (room < 0) {
      break
    }

    latest.unshift(line)
  }

  return [first, ...(latest.length < rest.length ? ['[…]'] : []), ...latest].join('\n\n')
}

// A resumed chat has nothing to fork until its first answer, so it is read
// from the transcript instead.
const summarize = async ($: EngineInterface, ask: string) => {
  const forked = await $.model.fork({ prompt: ask })

  if (forked.isAnswered || forked.reason !== 'nothing-to-fork') {
    return forked
  }

  const prompt = await transcript($)

  if (prompt === '') {
    return forked
  }

  return $.model.complete({
    model: 'haiku',
    system: ask,
    prompt,
    maxTokens: 700,
    timeoutMs: 30_000,
  })
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
    await $.command.register({
      name: 'summary',
      description: 'Summarize this chat in a few sentences and bullet points',
      argumentHint: '[what to focus on]',
    })

    const started = await next(e)

    if (e.isInteractive && (await read($, summary)) === null) {
      await refresh($)
    }

    return started
  })

  on('command.run', { command: 'summary' }, async ($, e) => {
    const focus = e.args.trim()
    const reply = await summarize(
      $,
      focus === '' ? LONG : `${LONG}\nPay most attention to: ${focus}`,
    )

    if (reply.isAnswered) {
      return { text: reply.text.trim() }
    }

    return {
      text:
        reply.reason === 'nothing-to-fork'
          ? 'Nothing to summarize yet.'
          : `No summary: ${reply.reason}.`,
    }
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
