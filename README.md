# Ben Wallet Packages

-   We will debug at any time, not a stable version~! π§

monorepo management with pnpm workspace

## Quick start

### Install dependencies for all repos

`pnpm i`

### Start Plugin

`pnpm dev:wallet`

## Useful commands

### Install dependency for specific repo

`pnpm i ${dependencyName} --filter ${packageName}`

### Install dependency for root (common)

`pnpm i ${dependencyName} -W`

## Dev Guide

### Import sibling package

Link package as dependency first, which is already done in the repo:

`pnpm add ${dependencyPackage} --filter ${packageName}`

Import package like what you did before, take `soul-wallet-lib` for example:

`import { WalletLib } from "soul-wallet-lib";`

## Notice

### Install pnpm if you did't have it installed yet

`npm i -g pnpm`

## TODO

[ ] chrome.storage.session requires chrome version >= 102, add polyfill.

## Code Structure

```
Ben-wallet-extension
β
β
ββββcomponents
β
β
ββββcss (global css)
β
β
ββββlib (global libraries)
β
β
ββββpages
β
β
ββββpopup(extension entrance)
β
β
ββββsdk(contract related actions)
```

=

## TODO

[x] ignore browser dark mode setting
