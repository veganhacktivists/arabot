<img src="docs/images/logo.png" width="200" height="200" title="ARA Logo" align="right">

# ARA Bot

ARA Bot is a free, open source Discord bot written in TypeScript using Sapphire, designed specifically for the [Animal Rights Advocates Discord server](https://discord.com/invite/animalrights).

This is designed to replace the old ARABot, which was not open source. This new bot uses slash commands and is overhauling a lot of the old systems.

[Learn more about Animal Rights Advocates here.](https://www.aramovement.org/)

## Usage

Make sure to create the .env file, which you can use the [.env.example](.env.example).

There are 2 options for running this bot, one using docker-compose and the other, less desirable npm.


### Docker

Running the bot Dockerised makes everything easier. To run the bot, run:

```shell
docker-compose up -d
```

### Without Docker

Make sure to run `npm install` if you just cloned the repo.

Then make sure to compile the TypeScript files using
```shell
npm run build
```

If you are running the code for the first time with a new database, make sure to run `npm run start:migrate`, otherwise run:
```shell
npm start
```

### Requirements

#### Docker

Docker and Docker-Compose are the only tools required for running the docker containers.

#### npm

- Node v18.6.0 (older versions may work, only tested on v18.6.0)
- Postgres server

## Contributing

If you want to contribute, make sure to read the [Contributing Guidelines](docs/CONTRIBUTING.md), we appreciate any help offered! :)

You can also contact Anthony in the [ARA Discord Server](https://discord.com/invite/animalrights) if you would want directions on what to develop or help when contributing to the bot.

## Support

For support, feel free to send an email to anthony@aramovement.org or reach out to Anthony or send a ModMail on the [ARA Discord Server](https://discord.com/invite/animalrights).

## Authors

- [Anthony Berg](https://github.com/smyalygames) (smyalygames#7428) - Dev Coordinator

## License

This bot is free and open source. It licensed using [GPL v3](LICENSE).

Well done on making it to the bottom of the README file :) 
