# chat-summary

```
/plugin install chat-summary --marketplace doktorlafe/claude-chat-summary
```

Type that at the prompt of a Claude Code terminal session, answer `y` to add the marketplace, then pick a scope. The line appears after the first completed turn.

A Claude Code mod that shows a few-word summary of what the current chat is about, in a dim line above the prompt:

```
◆ Sicily travel summary
```

The same text becomes the session title, which is what the terminal window or tab is named after.

It also adds the `/summary` command, which prints a longer summary of the chat: a sentence or two on what it is about, then bullet points for what was asked, what was done and what is still open. Anything typed after the command says what to focus on, as in `/summary the database migration`.

## How it works

After every turn of the main chat, the mod takes the first request, the last five later requests and the last answer (each cut to a few hundred characters) and asks Haiku to label the conversation in 3 to 6 words, in the language the user writes in. Subagent turns are skipped. When a chat is resumed, the summary is computed once at session start.

If the model does not answer within 8 seconds, the previous summary stays.

`/summary` asks the chat's own model instead, over the whole conversation as it was last sent, so the summary can draw on everything in it, tool results included. Right after a chat is resumed there is no such request to build on, so until the first answer it sends Haiku the text of the conversation instead (the first message and the latest ones, up to about 60,000 characters).

## Cost and privacy

Each completed turn adds one short Haiku call (up to 40 output tokens) on your own account. Each `/summary` is one request to the chat's model with the conversation as its input, mostly served from the prompt cache while the chat is active. The excerpt of the conversation goes only to that model call; the mod sends nothing anywhere else and stores only the summary line in the session's state.

## Official plugin directory

This mod is not in the official Claude Code plugin directory (`claude-plugins-official`). I would like to submit it there, but I have not started the submission yet. Until then, install it from this repository with the command at the top.

## Development

```
claude plugin validate .
claude plugin test .
```

## License

MIT
