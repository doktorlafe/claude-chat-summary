# chat-summary

A Claude Code mod that shows a few-word summary of what the current chat is about, in a dim line above the prompt:

```
◆ Sicily travel summary
```

The same text becomes the session title, which is what the terminal window or tab is named after.

## Install

In a terminal session of Claude Code:

```
/plugin install chat-summary --marketplace doktorlafe/claude-chat-summary
```

Answer `y` to add the marketplace, then pick a scope. The line appears after the first completed turn.

## How it works

After every turn of the main chat, the mod takes the first request, the last five later requests and the last answer (each cut to a few hundred characters) and asks Haiku to label the conversation in 3 to 6 words, in the language the user writes in. Subagent turns are skipped. When a chat is resumed, the summary is computed once at session start.

If the model does not answer within 8 seconds, the previous summary stays.

## Cost and privacy

Each completed turn adds one short Haiku call (up to 40 output tokens) on your own account. The excerpt of the conversation goes only to that model call; the mod sends nothing anywhere else and stores only the summary line in the session's state.

## Development

```
claude plugin validate .
claude plugin test .
```

## License

MIT
