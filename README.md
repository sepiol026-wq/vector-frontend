<!-- Improved compatibility of the back to top link -->
<a id="readme-top"></a>

<!-- PROJECT SHIELDS -->
<!-- Reference style links are declared at the bottom of this file. -->
[![Next.js][next-shield]][next-url]
[![React][react-shield]][react-url]
[![TypeScript][ts-shield]][ts-url]
[![Node.js][node-shield]][node-url]
[![AGPL-3.0][license-shield]][license-url]
[![Build][build-shield]][build-url]
[![Last commit][commit-shield]][commit-url]
[![Stars][stars-shield]][stars-url]
[![Forks][forks-shield]][forks-url]
[![Issues][issues-shield]][issues-url]
[![Live catalog][catalog-shield]][catalog-url]
[![Vector module][module-shield]][module-url]

<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="https://www.0xvector.lol">
    <img src="public/vecpic.png" alt="Vector" width="500">
  </a>

  <h3 align="center">Vector frontend</h3>

  <p align="center">
    Web interface for the Vector module catalog: search, module source and revision views, ratings, comments, collections and developer pages.
    <br />
    <a href="https://www.0xvector.lol"><strong>Open the live catalog »</strong></a>
    <br />
    <br />
    <a href="https://www.0xvector.lol">Live site</a>
    &middot;
    <a href="https://github.com/sepiol026-wq/vector-frontend/issues">Report bug</a>
    &middot;
    <a href="https://github.com/sepiol026-wq/vector-frontend/issues">Request feature</a>
  </p>
</div>

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of contents</summary>
  <ol>
    <li><a href="#about-the-project">About the project</a></li>
    <li><a href="#built-with">Built with</a></li>
    <li>
      <a href="#getting-started">Getting started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#source-updates">Source updates</a></li>
    <li><a href="#vector-module">Vector module</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
  </ol>
</details>

<!-- ABOUT THE PROJECT -->
## About the project

This repository holds the frontend part of Vector, the web interface for the module catalog. That covers search, module source and revision views, ratings, comments, collections and developer pages.

It is the frontend only. The backend is not here, and neither is an archive of the hosted deployment. API services are configured separately.

> [!IMPORTANT]
> This is not an offline catalog. Server rendering and the interactive features need a working connection to a compatible Vector API, so cloning the repository on its own will not give you a functional site.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Built with

* ![Next.js][next-shield]
* ![React][react-shield]
* ![TypeScript][ts-shield]

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- GETTING STARTED -->
## Getting started

### Prerequisites

Node.js 22 or newer.

### Installation

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Then open http://localhost:3000.

Point `VECTOR_API_ORIGIN` at the backend you intend to use.

> [!WARNING]
> `VECTOR_API_ORIGIN` must be an origin, without a path and without credentials. Anything else will fail to route.

> [!NOTE]
> API calls use same-origin routing, so authentication callbacks and cookie domains have to be configured for your frontend hostname by the backend operator. Copying this repository does not configure an OAuth application for you.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- USAGE -->
## Usage

```sh
npm run typecheck
npm run build
npm start
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- SOURCE UPDATES -->
## Source updates

A server checks the private source repository every minute. A changed frontend snapshot is published only after type checking, a production build and a production dependency audit all pass.

Export commits are signed and carry a neutral message. Upstream history, commit messages and revision identifiers are not copied over. Dependency versions are locked in `package-lock.json`.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- VECTOR MODULE -->
## Vector module

The catalog is driven by a userbot module that lives in the GoyModules repository.

* [Module source for Heroku](https://github.com/sepiol026-wq/GoyModules/blob/main/vector.py)
* [Catalog](https://www.0xvector.lol)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- LICENSE -->
## License

Vector frontend is released under the GNU Affero General Public License v3.0. The full text is in `LICENSE`.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- CONTACT -->
## Contact

GitHub: [sepiol026-wq](https://github.com/sepiol026-wq)

Live catalog: [https://www.0xvector.lol](https://www.0xvector.lol)

Telegram channel: [@GoyModules](https://t.me/GoyModules)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- MARKDOWN LINKS & IMAGES -->
[next-shield]: https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=nextdotjs
[next-url]: https://nextjs.org
[react-shield]: https://img.shields.io/badge/React-19-149eca?style=for-the-badge&logo=react
[react-url]: https://react.dev
[ts-shield]: https://img.shields.io/badge/TypeScript-5-3178c6?style=for-the-badge&logo=typescript
[ts-url]: https://www.typescriptlang.org
[node-shield]: https://img.shields.io/badge/Node.js-22%2B-339933?style=for-the-badge&logo=nodedotjs&logoColor=white
[node-url]: https://nodejs.org
[license-shield]: https://img.shields.io/badge/License-AGPL_v3-red?style=for-the-badge
[license-url]: ./LICENSE
[build-shield]: https://img.shields.io/github/actions/workflow/status/sepiol026-wq/vector-frontend/build.yml?style=for-the-badge&label=build
[build-url]: https://github.com/sepiol026-wq/vector-frontend/actions
[commit-shield]: https://img.shields.io/github/last-commit/sepiol026-wq/vector-frontend?style=for-the-badge
[commit-url]: https://github.com/sepiol026-wq/vector-frontend/commits
[stars-shield]: https://img.shields.io/github/stars/sepiol026-wq/vector-frontend?style=for-the-badge
[stars-url]: https://github.com/sepiol026-wq/vector-frontend/stargazers
[forks-shield]: https://img.shields.io/github/forks/sepiol026-wq/vector-frontend?style=for-the-badge
[forks-url]: https://github.com/sepiol026-wq/vector-frontend/network/members
[issues-shield]: https://img.shields.io/github/issues/sepiol026-wq/vector-frontend?style=for-the-badge
[issues-url]: https://github.com/sepiol026-wq/vector-frontend/issues
[catalog-shield]: https://img.shields.io/badge/Catalog-0xvector.lol-blue?style=for-the-badge&logo=googlechrome&logoColor=white
[catalog-url]: https://www.0xvector.lol
[module-shield]: https://img.shields.io/badge/Heroku-Vector_module-2ca5e0?style=for-the-badge&logo=telegram
[module-url]: https://github.com/sepiol026-wq/GoyModules/blob/main/vector.py
