# Variable-Emoji Language Server

Language Server for TypeScript to analyse the quality of variable names and visualising that quality with emojis.

Adapted from https://github.com/microsoft/vscode-extension-samples/tree/main/lsp-sample

## Functionality

This Language Server works for typescript files. It offers the following language feature:
- Diagnostics for variable names regenerated on each file change

Additionally, the client add emojis for the diagnostics.


## Structure

```
.
├── client // Language Client
│   ├── src
│   │   └── extension.ts // Language Client entry point
└── server // Language Server
    └── src
        └── server.ts // Language Server entry point
```


## Prerequisites

- Node.js
- npm


## Configuration for Helix
Documentation is for Windows.

- Navigate into `server/out`
- Create `emoji-server.bat` file with following content and replace `ABS_PATH` with absolute path
    ```
    @echo off
    node "ABS_PATH/variable-emoji/server/out/server.js" --stdio %*
    ```
- add that directory to `PATH` environment variable
- add `languages.toml` file to Helix [configuration directory](https://docs.helix-editor.com/guides/adding_languages.html) with following content
    ```
    [[language]]
    name = "typescript"
    language-servers = [ { name = "typescript" } ]

    [language-server.typescript]
    command = "emoji-server"
    ```