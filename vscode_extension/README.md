# Ruby Sorbet for VS Code

## Features

This extension provides language-aware IDE features for Ruby projects that use
Sorbet. It includes features like the following:

- Diagnostics (errors) that update as you type
- Hover tooltips, to show types and documentation
- Go to Definition/Find All References support
- Autocompletion
- Code Actions for refactoring
- Quick Fixes for errors

For a full list of features, see the "Editor Features" section of
[the Sorbet docs](https://sorbet.org/docs/vscode).

## Documentation

This extension only works in projects that have adopted Sorbet. For
instructions, see here:

- <https://sorbet.org/docs/adopting>

The docs for the Sorbet extension for VS Code live here:

- <https://sorbet.org/docs/vscode>

The Sorbet extension for VS Code is powered by the
[language server protocol](https://microsoft.github.io/language-server-protocol/)
(LSP). Sorbet's support for LSP is documented here:

- <https://sorbet.org/docs/lsp>

## TCP Transport (Docker / Remote LSP)

The extension can connect to a Sorbet LSP server over TCP instead of spawning a
local subprocess. This is useful when Sorbet runs inside Docker Compose or
another managed environment.

### VSCode configuration

Add a config entry with `"transport": "tcp"` to your `.vscode/settings.json`:

```json
"sorbet.userLspConfigs": [{
  "id": "docker-lsp",
  "name": "Sorbet (Docker)",
  "description": "Connect to LSP managed by Docker Compose",
  "transport": "tcp",
  "host": "localhost",
  "port": 5000
}],
"sorbet.selectedLspConfigId": "docker-lsp",
"sorbet.enabled": true
```

`host` defaults to `"localhost"` if omitted. `port` is required.

The extension will attempt to connect every ~7 seconds until the server is
available, so you can start Docker Compose before or after opening VSCode.

### Server requirements

The extension opens a **raw TCP socket** and speaks the
[LSP wire format](https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/#baseProtocol)
directly over it — there is no HTTP framing. Each message in both directions is:

```
Content-Length: <byte-length>\r\n
\r\n
<JSON body>
```

The connection is **full-duplex**: the server sends notifications (diagnostics,
progress, log messages) to the client at any time without a corresponding
request. Any server implementation that wraps `srb typecheck --lsp` must
therefore be a **bidirectional byte pipe** — it cannot use HTTP
request/response semantics, because:

- The server sends unsolicited notifications (no `id`, no corresponding request)
- The client pipelines multiple requests without waiting for prior responses
- Responses may arrive out of order (matched by `id`)

### Minimal implementation

The simplest correct wrapper is a single `socat` command:

```sh
socat TCP-LISTEN:5000,reuseaddr,fork \
  EXEC:"bundle exec srb typecheck --lsp"
```

### Docker Compose wrapper

For a container that does setup work before exposing the LSP, the pattern is:

1. Run any code generation at container startup (once, before the loop)
2. Open a `TCPServer` on the configured port
3. For each accepted connection, spawn `srb typecheck --lsp` and copy bytes
   bidirectionally between the socket and the process's stdin/stdout
4. When the socket closes, let Sorbet exit; wait for the next connection

In Ruby:

```ruby
server = TCPServer.new('0.0.0.0', 5000)

loop do
  socket = server.accept

  stdin_r, stdin_w = IO.pipe
  stdout_r, stdout_w = IO.pipe
  pid = Process.spawn(*sorbet_args, in: stdin_r, out: stdout_w, err: :err)
  stdin_r.close
  stdout_w.close

  t1 = Thread.new { IO.copy_stream(socket, stdin_w) rescue nil; stdin_w.close }
  t2 = Thread.new { IO.copy_stream(stdout_r, socket) rescue nil; socket.close }
  t1.join
  t2.join
  Process.wait(pid) rescue nil
end
```

Sorbet is restarted per connection. Because the extension retries automatically,
this is transparent to the user — VSCode reconnects and re-runs the LSP
handshake each time.

### Debugging

To see all LSP messages exchanged between the extension and the server, add to
your `.vscode/settings.json`:

```json
"ruby.trace.server": "verbose"
```

Then open **View → Output → Sorbet** to see the full JSON request/response log.
To increase the extension's own log verbosity, use the command palette:
**Sorbet: Set Log Level → Trace**.

## Developing on this Extension

See [docs/lsp-dev-guide.md] for information on how to get started with LSP and
VS Code extension development.

[docs/lsp-dev-guide.md]: https://github.com/sorbet/sorbet/blob/master/docs/lsp-dev-guide.md


## Sorbet Extension API

Starting from version 0.3.41, Sorbet exports a public API. You can access it using VS Code's `getExtension` API. To ensure backward and forward compatibility, all properties are nullable.

- `status`: Represents the Sorbet status, or `undefined` if the state is unknown.
- `onStatusChanged`: An event triggered whenever the status changes.

### Available Status Values
The following are string values:

- `disabled`: Indicates that the Sorbet Language Server has been disabled.
- `error`: Indicates that the Sorbet Language Server encountered an error. This status does not correlate to code typing errors.
- `running`: Indicates that the Sorbet Language Server is running.
- `start`: Indicates that the Sorbet Language Server is starting. This status may repeat in case of an error.