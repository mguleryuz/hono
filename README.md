# 🚀 Hono Template with Bun

A lightning-fast web application template using Hono.js and Bun runtime, with MongoDB integration and Docker support.

## ✨ Features

- 🏃‍♂️ **Ultra-fast Performance**: Built with Hono.js and Bun runtime
- 🗃️ **MongoDB Integration**: Ready-to-use MongoDB connection with Mongoose
- 🐳 **Docker Support**: Complete Docker setup with multi-stage builds
- 🔄 **Job Management**: Built-in job scheduler with Cron support
- 🛠️ **Developer Tools**:
  - TypeScript configuration
  - ESLint + Prettier setup
  - Conventional commits with Husky
  - GitHub Actions workflow for AWS ECR

## 🚀 Quick Start

### Prerequisites

- Bun (latest version)
- Docker (optional)
- MongoDB instance

### Installation

1. Clone the repository:

```sh
git clone https://github.com/InverterNetwork/hono.git
```

2. Install dependencies:

```sh
bun install
```

3. Set up your environment variables:

- Create .env file from example

```sh
cp .env.example .env
```

### Development

Start the development server:

```sh
bun dev
```

The server will start at `http://localhost:8080` with hot-reload enabled.

### Production

Build and start the production server:

```sh
bun start
```

### Docker Support

The template includes a convenient Docker management script:

```sh
bun docker
```

This will show you various Docker operations like:

- Building images
- Starting containers
- Managing containers and images
- And more!

## 🏗️ Project Structure

├── src/
│ ├── index.ts # Application entry point
│ ├── lib/ # Core libraries
│ ├── utils/ # Utility functions
│ ├── middlewares/ # Middlewares
│ ├── services/ # Services
│ ├── types/ # Types
│ └── jobs/ # Background jobs
├── tools/ # Development tools
├── tests/ # Tests
├── .github/ # GitHub Actions workflows
└── docker.sh # Docker management script

## 🛠️ Development Tools

### Linting and Formatting

The project uses ESLint and Prettier for code quality:

```sh
bunx eslint --fix
bunx prettier --write
```

### Git Hooks

Husky is configured with:

- Pre-commit: Runs linting and formatting
- Commit-msg: Ensures conventional commit messages

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Hono](https://hono.dev) - Ultrafast web framework for the Edges
- [Bun](https://bun.sh) - Fast all-in-one JavaScript runtime
