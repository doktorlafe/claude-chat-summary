# colorful

```
/plugin install colorful --marketplace doktorlafe/claude-chat-summary
```

A Claude Code mod that sets the text color of replies, prompts, notices and other transcript rows.

## Usage

```
/colors                    show the current colors
/colors <target> <color>   set one
/colors reset              put everything back to default
```

Targets:

| Target     | What it colors                          |
| ---------- | --------------------------------------- |
| `reply`    | Claude's replies                        |
| `prompt`   | your own prompts in the transcript      |
| `info`     | the info notices under the logo         |
| `command`  | slash command output                    |
| `duration` | the line that closes a turn             |
| `hint`     | the hint line under the prompt          |

A color is a name (`red`, `cyan`), a hex (`#ff8800`), a theme key (`claude`, `success`) or `default`, which leaves the row to Claude Code.

`reply` and `command` also take the presets `vscode` (dark) and `vscode-light`, which give headings, bold, code, links and bullets each their own color, after VS Code's Dark+ and Light+ themes.

## How it works

Markdown rows take no color, so a colored reply is drawn as colored text with the common marks (headings, lists, quotes, bold, italic, inline code, links) handled by the mod. Code fences and tables are still drawn by Claude Code, so they keep their highlighting.

The colors are stored as the plugin's options, so they can also be set when installing or with `claude plugin configure colorful`.

## Development

```
claude plugin validate colorful
claude plugin test colorful
```

## License

MIT
