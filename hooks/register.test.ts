import { expect, test } from 'claude-code/testing'

const BAND = {
  hasSurvey: false,
  isWorking: false,
  maxRows: 10,
  bodyColumns: 80,
  scroll: { offset: 0, bodyRows: 10 },
  view: {},
}

const TURN = {
  answer: 'Hotovo.',
  durationMs: 1000,
  isAborted: false,
  turnId: 't1',
  reason: 'answer',
} as const

for (const surface of ['terminal', 'desktop'] as const) {
  test(`draws the model's label above the prompt (${surface})`, async ($, on) => {
    let asked = ''
    on('session.messages', () => ({
      value: [
        { role: 'user', text: 'udělej mi .md soubor o vps na arm', toolUses: [] },
        { role: 'assistant', text: 'Soubor je hotový.', toolUses: [] },
      ],
    }))
    on('model.complete', (_, e) => {
      asked = e.prompt

      return {
        value: {
          isAnswered: true,
          text: '"Dokumentace VPS na ARM."\n',
          usage: { input_tokens: 1, output_tokens: 1 },
        },
      }
    })
    on('turn.complete', (_, e) => ({ text: e.answer }))
    on('classic.UserPromptSubmit', () => ({}))

    await $.turn.complete(TURN)

    const ui = await $.ui.mount({
      plugin: 'chat-summary',
      surface,
      component: 'AbovePrompt',
      props: BAND,
    })

    const titled = await $.classic.UserPromptSubmit({ prompt: 'dál' })
    expect(titled.sessionTitle).toBe('Dokumentace VPS na ARM')

    expect(asked).toContain('First request: udělej mi .md soubor')
    expect(JSON.stringify(await ui.drawn())).toContain('"◆ ","Dokumentace VPS na ARM"')
  })
}

test('a subagent turn asks the model nothing', async ($, on) => {
  let calls = 0
  on('session.messages', () => ({
    value: [{ role: 'user', text: 'ahoj', toolUses: [] }],
  }))
  on('model.complete', () => {
    calls += 1

    return { value: { isAnswered: false, reason: 'empty-reply' } }
  })
  on('turn.complete', (_, e) => ({ text: e.answer }))

  await $.turn.complete({ ...TURN, agentId: 'a1' })

  expect(calls).toBe(0)
})
