# mkpro

A command-line tool for quickly creating project folders and VS Code workspace.

| Command           | Action                                    |
| ----------------- | ----------------------------------------- |
| `mkpro myapp`     | create project (equivalent to `-p`)       |
| `mkpro -p myapp`  | create project                            |
| `mkpro -h mysite` | create host `~/vhosts/mysite.local`       |
| `mkpro -r myrepo` | create repository `~/repos/myrepo`        |
| `mkpro -ph myapp` | project + host + add host to workspace    |
| `mkpro -pr myapp` | project + repo + add repo to workspace    |

## Configuration

**mkpro** uses configurable paths stored in `~/.config/mkpro/config.json`. You can create or modify the configuration using:

```
mkpro --config
```

This will guide you through setting up the directories for projects, hosts, and repositories.

## Features

- Creates project structures with predefined folders (materials, docs)
- Generates VS Code workspace files
- Configurable paths via JSON configuration
