# Vector frontend

<p align="center"><img src="public/vecpic.png" alt="Vector" width="500"></p>

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=nextdotjs)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-149eca?style=for-the-badge&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)
[![Build](https://img.shields.io/github/actions/workflow/status/sepiol026-wq/vector-frontend/build.yml?style=for-the-badge&label=build)](https://github.com/sepiol026-wq/vector-frontend/actions)
[![Heroku module](https://img.shields.io/badge/Heroku-Vector_module-2ca5e0?style=for-the-badge&logo=telegram)](https://github.com/sepiol026-wq/GoyModules/blob/main/vector.py)

Web interface for the Vector module catalog: search, module source and revision views, ratings, comments, collections and developer pages.

This repository contains the frontend distribution, not the backend or an archive of the hosted deployment. API services are configured separately. Server rendering and interactive features require a compatible Vector API; this is not an offline catalog.

## Run

Node.js 22 or newer.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000. Set `VECTOR_API_ORIGIN` to the backend you intend to use. It must be an origin, without a path or credentials. API calls use same-origin routing; authentication callbacks and cookie domains must be configured for your frontend hostname by the backend operator. Merely copying this repository does not configure an OAuth application.

```sh
npm run typecheck
npm run build
npm start
```

## Source updates

A server checks the private source repository every minute. Changed frontend snapshots are published after type checking, a production build and a production dependency audit. Export commits are signed and use a neutral message; upstream history, commit messages and revision identifiers are not copied. Dependency versions are locked in `package-lock.json`.

## Vector module

[Module source for Heroku](https://github.com/sepiol026-wq/GoyModules/blob/main/vector.py) · [Catalog](https://www.0xvector.lol)
