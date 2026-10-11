import { expect, test } from 'claude-code/testing'

const REPLY = {
  plugin: 'colorful',
  surface: 'terminal',
  component: 'AssistantMessage',
  props: { text: 'Hello **world**\n\n```js\n1\n```', isFirstOfReply: true },
} as const

test('a reply is drawn in the configured color', { options: { reply: '#ff8800' } }, async $ => {
  const ui = await $.ui.mount(REPLY)

  expect((await ui.find({ type: 'Text', text: /Hello/ }))?.props.color).toBe('#ff8800')
  expect(await ui.find({ type: 'Markdown' })).toBeDefined()
  await ui.unmount()
})

test('default leaves the reply to the engine', async ($, on) => {
  on('ui.render', { component: 'AssistantMessage' }, ($, e) => {
    const { Text } = $.ui.resolve(e)

    return h(Text, {}, 'engine drew it')
  })
  const ui = await $.ui.mount(REPLY)

  expect(await ui.find({ type: 'Text', text: /engine drew it/ })).toBeDefined()
  await ui.unmount()
})

test('/colors lists the targets', async $ => {
  const { text } = await $.command.run({ command: 'colors', args: '' })

  expect(text).toContain('reply: default')
})

test('the vscode preset colors each part of a reply', { options: { reply: 'vscode' } }, async $ => {
  const ui = await $.ui.mount({
    ...REPLY,
    props: { text: '# Title\n\n- one `code` and **bold**', isFirstOfReply: true },
  })

  expect((await ui.find({ type: 'Text', text: /^Title$/ }))?.props.color).toBe('#569cd6')
  expect((await ui.find({ type: 'Text', text: /^code$/ }))?.props.color).toBe('#ce9178')
  expect((await ui.find({ type: 'Text', text: /^bold$/ }))?.props.color).toBe('#569cd6')
  await ui.unmount()
})
