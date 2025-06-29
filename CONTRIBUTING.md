# Contributing to Hono + React Full-Stack Template

Thank you for your interest in contributing to this project! We welcome contributions from everyone. By participating in this project, you agree to abide by our code of conduct.

## 📋 Table of Contents

- [Getting Started](#getting-started)
- [How to Contribute](#how-to-contribute)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Submitting a Pull Request](#submitting-a-pull-request)
- [Code Style Guidelines](#code-style-guidelines)
- [Commit Message Guidelines](#commit-message-guidelines)

## 🚀 Getting Started

1. **Fork the Repository**
   - Navigate to the [main repository](https://github.com/mguleryuz/hono)
   - Click the "Fork" button in the top-right corner
   - This creates a copy of the repository in your GitHub account

2. **Clone Your Fork**

   ```bash
   git clone https://github.com/YOUR_USERNAME/hono.git
   cd hono
   ```

3. **Add Upstream Remote**
   ```bash
   git remote add upstream https://github.com/mguleryuz/hono.git
   ```

## 🛠️ How to Contribute

### 1. Create a New Branch

Always create a new branch for your work:

```bash
# Update your local main branch
git checkout main
git pull upstream main

# Create and switch to a new branch
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

### 2. Development Setup

```bash
# Install dependencies
bun i

# Set up project metadata
bun setup

# Copy environment variables
cp .env.example .env

# Start development server
bun dev
```

### 3. Making Changes

- Write clean, maintainable code
- Follow the existing code style
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass: `bun test`
- Ensure code passes linting: `bun lint`

## 📝 Commit Message Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/). This helps with automatic versioning and changelog generation.

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature (minor version bump)
- `fix`: Bug fix (patch version bump)
- `docs`: Documentation changes
- `style`: Code style changes (formatting, semicolons, etc.)
- `refactor`: Code refactoring without changing functionality
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `ci`: CI/CD changes

### Examples

```bash
# Feature
git commit -m "feat(auth): add WhatsApp OTP authentication"

# Bug fix
git commit -m "fix(api): resolve user session timeout issue"

# Documentation
git commit -m "docs: update API documentation for auth endpoints"

# Breaking change
git commit -m "feat(api)!: change authentication response format

BREAKING CHANGE: auth response now returns user object instead of just token"
```

## 🚀 Submitting a Pull Request

### 1. Push Your Changes

```bash
git push origin feature/your-feature-name
```

### 2. Create a Pull Request

1. Go to your fork on GitHub
2. Click "Pull Request" or "Compare & pull request"
3. Ensure the base repository is `mguleryuz/hono` and base branch is `main`
4. Fill out the PR template:
   - **Title**: Use a clear, descriptive title following commit conventions
   - **Description**: Explain what changes you made and why
   - **Related Issues**: Link any related issues using `Fixes #123` or `Relates to #456`
   - **Screenshots**: Add screenshots for UI changes
   - **Testing**: Describe how you tested your changes

### 3. PR Review Process

- A maintainer will review your PR
- Address any requested changes
- Once approved, your PR will be merged
- Your contribution will be included in the next release!

## 🎨 Code Style Guidelines

### TypeScript/JavaScript

- Use TypeScript for all new code
- Follow the existing code structure
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Prefer `const` over `let` when possible

### React Components

- Use functional components with hooks
- Follow the component structure in existing files
- Keep components small and focused
- Use proper prop types with TypeScript

### Styling

- Use Tailwind CSS utility classes
- Follow the existing styling patterns
- Ensure responsive design
- Test on different screen sizes

## 🧪 Testing

- Write tests for new features
- Ensure all existing tests pass
- Test your changes locally before submitting
- Include test files in your PR

## 🤝 Getting Help

If you need help or have questions:

1. Check the [documentation](README.md)
2. Look through existing [issues](https://github.com/mguleryuz/hono/issues)
3. Create a new issue with your question
4. Join our community discussions

## 🙏 Thank You!

Thank you for contributing! Your efforts help make this project better for everyone. We appreciate your time and expertise!

---

<div align="center">
  <sub>Happy coding! 🚀</sub>
</div>
