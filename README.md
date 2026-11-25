# ❄ chat-summary

**Always know what this chat is about, at a glance.**

Five terminal tabs open, every one of them named `claude`? Came back from lunch and can't remember where you left off? chat-summary keeps a short, live label of the conversation right above your prompt, and it looks good doing it.

```
❄ Sicily travel summary
```

### Why you'll like it

- 🏷️ **A label that keeps up.** After every turn, the line updates to what the chat is about *now*, in your own language.
- 🗂️ **Tabs you can tell apart.** Your terminal window or tab is named after the chat, so finding the right session takes a second.
- 📝 **A recap on demand.** Type `/summary` for a short write-up of what was asked, what got done and what's still open.
- ✨ **Seven looks to choose from.** From a quiet frosty glint to a full bouncing rainbow, or no animation at all.
- 🪶 **Light on cost.** One tiny Haiku call per turn, and nothing leaves your account.

## Install

One line, and you're set:

At the prompt of a Claude Code terminal session:

```
/plugin install chat-summary --marketplace doktorlafe/claude-chat-summary
```

Answer `y` to add the marketplace, then pick a scope. The summary appears after the first completed turn.

## Themes

Pick the look in `/plugin` → **chat-summary** → configure. The change applies right away.

| Style | Look |
| --- | --- |
| `winter` ❄ | icy blues with a frosty glint (default) |
| `aurora` ✦ | northern lights, teal fading into violet |
| `ember` ✶ | warm, muted firelight |
| `ocean` ≈ | teal waves |
| `sakura` ✿ | soft cherry-blossom pink |
| `rainbow` ◆ | bouncing rainbow colours |
| `plain` ◆ | a dim, still line with no animation |

**Animation speed** can be `slow`, `normal` (default) or `fast`.

The glint themes are meant to stay out of the way: a soft light slides across the text, then rests for a few seconds before the next pass.

## `/summary`

`/summary` prints a longer recap of the chat: a sentence or two on what it is about, then bullet points for what was asked, what was done and what is still open. Anything typed after the command says what to focus on:

```
/summary the database migration
```

## How it works

- **The line above the prompt.** After every turn of the main chat, the mod takes the first request, the last five later requests and the last answer (each cut to a few hundred characters) and asks Haiku to label the conversation in 3 to 6 words, in the language you write in. Subagent turns are skipped. If Haiku does not answer within 8 seconds, the previous summary stays. A resumed chat is summarized once when the session starts.
- **The session title.** The same label becomes the session title, which the terminal names its window or tab after.
- **`/summary`.** This asks the chat's own model over the whole conversation, tool results included. Right after a chat is resumed there is no request to build on yet, so until the first answer it sends Haiku the conversation's text instead: the first message and the latest ones, up to about 60,000 characters.

## Cost and privacy

- Each completed turn adds one short Haiku call (up to 40 output tokens) on your own account.
- Each `/summary` is one request to the chat's model. While the chat is active, most of it is served from the prompt cache.
- The conversation excerpt goes only to those model calls. The mod sends nothing anywhere else, and keeps only the summary line in the session's state.

## Development

Run it from a clone without installing:

```
claude --plugin-dir ./chat-summary
```

Check and test:

```
claude plugin validate chat-summary
claude plugin test chat-summary
```

The mod isn't in the official Claude Code plugin directory (`claude-plugins-official`) yet. I plan to submit it there; until then, install it from this repository.

## License

MIT
