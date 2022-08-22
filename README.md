# Charon

A simple scaffolding tool. (Pure ESM)

## Installation

```bash
# ni
ni -g @zolyn/charon

# npm
npm i -g @zolyn/charon

# yarn
yarn global add @zolyn/charon

# pnpm
pnpm add -g @zolyn/charon
```

## Commands

### Default

Initialize project with the given template

#### Usage

```bash
charon [template]
```

### Options

| Options                 | Description                                                                                                  | Default value        | Constraints                         |
| ----------------------- | ------------------------------------------------------------------------------------------------------------ | -------------------- | ----------------------------------- |
| `-d, --dest <path>`     | Destination                                                                                                  | Name of the template |                                     |
| `-m, --mode <mode>`     | Mode for extracting git repositories.                                                                        | `"normal"`           | `"normal", "preserve", "overwrite"` |
| `-n, --name <name>`     | Project name                                                                                                 |                      |                                     |
| `-a, --author <author>` | Project author                                                                                               |                      |                                     |
| `-u, --user <user>`     | Your username on the code hosting service platform                                                           |                      |                                     |
| `-s, --skip`            | Skip prompts                                                                                                 | `false`              | `true, false`                       |
| `-g, --git`             | Initialize a git repository after downloading template.                                                      | `false`              | `true, false`                       |
| `-p, --preserve`        | Preserve the files if the destination is not empty. Same as "-m preserve" (High priority when use with "-o") |                      |                                     |
| `-o, --overwrite`       | Overwrite the files if the destination is not empty. Same as "-m overwrite"                                  |                      |                                     |
| `-v, --version`         | Display version number                                                                                       |                      |                                     |
| `-h, --help`            | Display available options                                                                                    |                      |                                     |

## Config

Aliases: `c`, `co`

Get/set config value

### Usage

Get config value

```bash
> charon config --user
[info] Zolyn
```

Set config value

```bash
> charon config --user Zolyn
[info] Zolyn
[success] Done.
```

### Options

| Options           | Description                                                       | Constraints                         |
| ----------------- | ----------------------------------------------------------------- | ----------------------------------- |
| `--author [name]` | Project author                                                    |                                     |
| `--user [user]`   | Your username on the code hosting service platform                |                                     |
| `--mode [mode]`   | Mode for extracting git repositories                              | `"normal", "preserve", "overwrite"` |
| `--skip [switch]` | Whether to skip prompts                                           |                                     |
| `--git [switch]`  | Whether to initialize a git repository after downloading template |                                     |
| `-c, --clear`     | Clear config                                                      |                                     |
| `-h, --help`      | Display available options                                         |                                     |

## Templates

Aliases: `t`, `te`

Edit templates

### Usage

Add template

```bash
charon templates -a Zolyn/ts-starter
```

Delete template

```bash
charon templates -d Zolyn/ts-starter
```

List templates

```bash
> charon templates -l
[info] ['Zolyn/ts-starter']
```

### Options

| Options                | Description               |
| ---------------------- | ------------------------- |
| `-a, --add [template]` | Add a template            |
| `-d, --del [template]` | Delete a template         |
| `-l, --list`           | List all templates        |
| `-c, --clear`          | Clear all templates       |
| `-h, --help`           | Display available options |

## FAQ

**Q1: How can I get my original directory back ?**

**A1:**
In `preserve` and `overwrite` mode, Charon moves old directories to the trash rather than deleting them directly, so you can find them in the trash.

## About the name

Charon, one of the moons of Pluto, is also a "moon" of [Lagrange](https://wiki.arcaea.cn/%E6%8B%89%E6%A0%BC%E5%85%B0) (From Arcaea)

## License

[MIT](LICENSE)
