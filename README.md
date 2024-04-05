# AIDevs2 - Reloaded

Set of solutions to tasks on AIDevs2 - Reloaded course

---

## Installation

- Copy `.env-sample` to `.env` and fill in the values.
- install bun if not installed before -> [https://bun.sh/](https://bun.sh/)
- install dependencies with `bun install`

## Usage

- run `bun 01' to run task 1 and so on...

## Notes

- task 13 - search - requires additional [API for Qdrant](https://github.com/pdulak/localEmbeddingsAPI) - this API uses local embeddings and dockerized Qdrant
- task 14 - search - uses [Chroma](https://www.trychroma.com/)
- task 15 - search - uses local Qdrant instance started by `docker-compose -f docker-compose-qdrant.yml up`
