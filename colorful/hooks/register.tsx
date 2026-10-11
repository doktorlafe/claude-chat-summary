import type { Elements, PluginOptions, Register, RenderNode } from 'claude-code'

const TARGETS = ['reply', 'prompt', 'info', 'command', 'duration', 'hint'] as const
type Target = (typeof TARGETS)[number]

const USAGE = [
  'Usage: /colors <target> <color>   or   /colors reset',
  `Targets: ${TARGETS.join(', ')}`,
  'Colors: a name (red, cyan), a hex (#ff8800), a theme key (claude, success), or default',
  'Presets for reply and command: vscode (dark), vscode-light — headings, bold, code, links and bullets each get their own color',
].join('\n')

const colorOf = (options: PluginOptions, target: Target): string | undefined => {
  const value = String(options[target] ?? '').trim()

  return value === '' || value.toLowerCase() === 'default' ? undefined : value
}

const isTarget = (word: string): word is Target =>
  (TARGETS as readonly string[]).includes(word)

const formatDuration = (ms: number): string => {
  const seconds = Math.round(ms / 1000)

  return seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m ${seconds % 60}s`
}

type TerminalElements = Pick<Elements['terminal'], 'Box' | 'Text' | 'Markdown'>

type Palette = {
  text: string
  heading: string
  bold: string
  italic: string
  code: string
  link: string
  marker: string
  quote: string
}

// The markdown colors of VS Code's Dark+ and Light+ themes.
const PRESETS: Readonly<Record<string, Palette>> = {
  vscode: {
    text: '#d4d4d4',
    heading: '#569cd6',
    bold: '#569cd6',
    italic: '#c586c0',
    code: '#ce9178',
    link: '#4ec9b0',
    marker: '#6796e6',
    quote: '#6a9955',
  },
  'vscode-light': {
    text: '#000000',
    heading: '#800000',
    bold: '#000080',
    italic: '#af00db',
    code: '#a31515',
    link: '#0451a5',
    marker: '#0451a5',
    quote: '#008000',
  },
}

const paletteOf = (color: string): Palette =>
  PRESETS[color.toLowerCase()] ?? {
    text: color,
    heading: color,
    bold: color,
    italic: color,
    code: color,
    link: color,
    marker: color,
    quote: color,
  }

const INLINE = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)\s]+\)|\*[^*\s][^*]*\*)/

// Markdown takes no color, so prose is drawn as colored Text with the common
// marks handled here; fences and tables stay Markdown for their highlighting.
const drawMarkdown = (
  { Box, Text, Markdown }: TerminalElements,
  text: string,
  color: string,
): RenderNode => {
  const palette = paletteOf(color)
  const isPreset = color.toLowerCase() in PRESETS

  const inline = (line: string): RenderNode[] =>
    line
      .split(INLINE)
      .filter(part => part !== '')
      .map(part => {
        const link = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(part)

        if (link) {
          return (
            <Text color={palette.link} underline>
              {link[1] ?? ''}
              {link[1] === link[2] ? '' : ` (${link[2] ?? ''})`}
            </Text>
          )
        }

        if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
          return (
            <Text color={palette.bold} bold>
              {part.slice(2, -2)}
            </Text>
          )
        }

        if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
          return (
            <Text color={palette.code} inverse={!isPreset}>
              {part.slice(1, -1)}
            </Text>
          )
        }

        if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
          return (
            <Text color={palette.italic} italic>
              {part.slice(1, -1)}
            </Text>
          )
        }

        return part
      })

  const rows: RenderNode[] = []
  let kept: string[] = []
  let isFenced = false

  const flush = () => {
    if (kept.length > 0) {
      rows.push(<Markdown text={kept.join('\n')} />)
      kept = []
    }
  }

  for (const line of text.split('\n')) {
    const isFence = line.trimStart().startsWith('```')

    if (isFenced || isFence) {
      kept.push(line)

      if (isFence) {
        if (isFenced) {
          flush()
        }
        isFenced = !isFenced
      }
      continue
    }

    if (line.trimStart().startsWith('|')) {
      kept.push(line)
      continue
    }

    flush()
    const heading = /^#{1,6}\s+(.*)$/.exec(line)
    const item = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/.exec(line)
    const quote = /^\s*>\s?(.*)$/.exec(line)

    if (heading) {
      rows.push(
        <Text color={palette.heading} bold>
          {inline(heading[1] ?? '')}
        </Text>,
      )
    } else if (item) {
      const marker = /\d/.test(item[2] ?? '') ? (item[2] ?? '') : '•'

      rows.push(
        <Text color={palette.text}>
          {item[1] ?? ''}
          <Text color={palette.marker}>{marker} </Text>
          {inline(item[3] ?? '')}
        </Text>,
      )
    } else if (quote) {
      rows.push(
        <Text color={palette.quote} italic>
          ▎ {inline(quote[1] ?? '')}
        </Text>,
      )
    } else {
      rows.push(<Text color={palette.text}>{line === '' ? ' ' : inline(line)}</Text>)
    }
  }

  flush()

  return (
    <Box flexDirection="column" flexGrow={1}>
      {rows}
    </Box>
  )
}

export const register: Register = (on, options) => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'colors',
      description: 'Set the text color of replies, prompts, notices and more',
    })

    return next(e)
  })

  on('command.run', { command: 'colors' }, async ($, e) => {
    const [target = '', color = ''] = e.args.trim().split(/\s+/)

    if (target === '') {
      const current = TARGETS.map(
        one => `${one}: ${colorOf(options, one) ?? 'default'}`,
      ).join('\n')

      return { text: `${current}\n\n${USAGE}` }
    }

    const changes =
      target === 'reset'
        ? TARGETS.map(one => [one, 'default'] as const)
        : isTarget(target) && color !== ''
          ? [[target, color] as const]
          : []

    if (changes.length === 0) {
      return { text: USAGE }
    }

    for (const [one, value] of changes) {
      const { deny } = await $.config.set({ key: `colorful.${one}`, value })

      if (deny !== undefined) {
        return { text: `Could not set ${one}: ${deny}` }
      }
    }

    return {
      text: changes.map(([one, value]) => `${one} color: ${value}`).join('\n'),
    }
  })

  on('ui.render', { component: 'AssistantMessage' }, ($, e, next) => {
    const color = colorOf(options, 'reply')

    if (color === undefined || e.surface !== 'terminal') {
      return next(e)
    }

    const elements = $.ui.resolve(e)
    const { Box, Text } = elements

    return (
      <Box flexDirection="row">
        <Text color={paletteOf(color).marker}>{e.props.isFirstOfReply ? '● ' : '  '}</Text>
        {drawMarkdown(elements, e.props.text, color)}
      </Box>
    )
  })

  on('ui.render', { component: 'UserMessage' }, ($, e, next) => {
    const color = colorOf(options, 'prompt')
    const isOwnPrompt =
      e.props.origin.kind === 'composer' &&
      e.props.task === undefined &&
      e.props.from === undefined

    if (color === undefined || e.surface !== 'terminal' || !isOwnPrompt) {
      return next(e)
    }

    const { Box, Text } = $.ui.resolve(e)

    return (
      <Box flexDirection="row">
        <Text color={color}>{'> '}</Text>
        <Text color={color}>{e.props.text}</Text>
      </Box>
    )
  })

  on('ui.render', { component: 'InfoNotice' }, ($, e, next) => {
    const color = colorOf(options, 'info')

    if (color === undefined) {
      return next(e)
    }

    const { Text } = $.ui.resolve(e)
    const command = e.props.command === null ? '' : ` ${e.props.command}`

    return (
      <Text color={color}>
        {e.props.text}
        {command}
      </Text>
    )
  })

  on('ui.render', { component: 'CommandOutput' }, ($, e, next) => {
    const color = colorOf(options, 'command')

    if (color === undefined || e.surface !== 'terminal' || e.props.isErrored) {
      return next(e)
    }

    return drawMarkdown($.ui.resolve(e), e.props.text, color)
  })

  on('ui.render', { component: 'TurnDuration' }, ($, e, next) => {
    const color = colorOf(options, 'duration')

    if (color === undefined) {
      return next(e)
    }

    const { Text } = $.ui.resolve(e)

    return (
      <Text color={color}>
        ✻ {e.props.word} for {formatDuration(e.props.durationMs)}
      </Text>
    )
  })

  on('ui.render', { component: 'PromptHint' }, ($, e, next) => {
    const color = colorOf(options, 'hint')

    if (color === undefined || e.surface !== 'terminal') {
      return next(e)
    }

    const { Text } = $.ui.resolve(e)

    return <Text color={color}>{e.props.hint}</Text>
  })
}
