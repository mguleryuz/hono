#!/usr/bin/env bun
import { promises as fs } from 'fs'
import { join } from 'path'
import readline from 'readline'

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
}

// Project metadata interface
interface ProjectMetadata {
  projectName: string
  appTitle: string
  title: string
  description: string
  keywords: string[]
  ogTitle: string
  ogDescription: string
  twitterCreator: string
  twitterTitle: string
  twitterDescription: string
}

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

// Helper function to ask questions
function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(`${colors.cyan}${prompt}${colors.reset} `, resolve)
  })
}

// Helper function to ask with default value
async function questionWithDefault(
  prompt: string,
  defaultValue: string
): Promise<string> {
  const answer = await question(
    `${prompt} ${colors.dim}(${defaultValue})${colors.reset}:`
  )
  return answer.trim() || defaultValue
}

// Validate project name (npm package name rules)
function validateProjectName(name: string): boolean {
  const regex = /^(?:@[a-z0-9-*~][a-z0-9-*._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/
  return regex.test(name)
}

// Main setup function
async function setupMetadata() {
  console.log(
    `\n${colors.bright}${colors.magenta}🚀 Project Metadata Setup${colors.reset}\n`
  )
  console.log(
    `${colors.dim}This script will help you set up your project metadata.${colors.reset}\n`
  )

  try {
    // Collect metadata
    const metadata: ProjectMetadata = {
      projectName: '',
      appTitle: '',
      title: '',
      description: '',
      keywords: [],
      ogTitle: '',
      ogDescription: '',
      twitterCreator: '',
      twitterTitle: '',
      twitterDescription: '',
    }

    // Project name
    let projectName = ''
    while (!projectName) {
      projectName = await question('Project name (npm package name):')
      if (!validateProjectName(projectName)) {
        console.log(
          `${colors.yellow}Invalid project name. Must follow npm naming conventions.${colors.reset}`
        )
        projectName = ''
      }
    }
    metadata.projectName = projectName

    // App title
    metadata.appTitle = await questionWithDefault('App title', projectName)

    // Page title
    metadata.title = await questionWithDefault('Page title', metadata.appTitle)

    // Description
    metadata.description = await question('Description:')

    // Keywords
    const keywordsStr = await question('Keywords (comma-separated):')
    metadata.keywords = keywordsStr
      .split(',')
      .map((k) => k.trim())
      .filter((k) => k)

    // Open Graph
    console.log(`\n${colors.blue}Open Graph metadata:${colors.reset}`)
    metadata.ogTitle = await questionWithDefault('OG Title', metadata.title)
    metadata.ogDescription = await questionWithDefault(
      'OG Description',
      metadata.description
    )

    // Twitter
    console.log(`\n${colors.blue}Twitter Card metadata:${colors.reset}`)
    metadata.twitterCreator = await question(
      'Twitter creator handle (e.g., @username):'
    )
    metadata.twitterTitle = await questionWithDefault(
      'Twitter Title',
      metadata.ogTitle
    )
    metadata.twitterDescription = await questionWithDefault(
      'Twitter Description',
      metadata.ogDescription
    )

    console.log(
      `\n${colors.green}✓ Metadata collected successfully!${colors.reset}\n`
    )

    // Update files
    console.log(`${colors.yellow}Updating project files...${colors.reset}\n`)

    // Update package.json
    const packageJsonPath = join(process.cwd(), 'package.json')
    const packageJson = await fs.readFile(packageJsonPath, 'utf-8')
    const updatedPackageJson = packageJson.replace(
      /<project_name>/g,
      metadata.projectName
    )
    await fs.writeFile(packageJsonPath, updatedPackageJson)
    console.log(`${colors.green}✓${colors.reset} Updated package.json`)

    // Update client/index.html
    const indexHtmlPath = join(process.cwd(), 'client', 'index.html')
    let indexHtml = await fs.readFile(indexHtmlPath, 'utf-8')

    // Replace all placeholders
    indexHtml = indexHtml
      .replace(/<title>title<\/title>/g, `<title>${metadata.title}</title>`)
      .replace(/<og_title>/g, metadata.ogTitle)
      .replace(/<og_description>/g, metadata.ogDescription)
      .replace(/<twitter_creator>/g, metadata.twitterCreator)
      .replace(/<twitter_title>/g, metadata.twitterTitle)
      .replace(/<twitter_description>/g, metadata.twitterDescription)
      .replace(/<description>/g, metadata.description)
      .replace(/<keyword1, keyword2>, keyword3>/g, metadata.keywords.join(', '))

    await fs.writeFile(indexHtmlPath, indexHtml)
    console.log(`${colors.green}✓${colors.reset} Updated client/index.html`)

    // Update app-sidebar.tsx
    const sidebarPath = join(
      process.cwd(),
      'client',
      'src',
      'components',
      'app-sidebar.tsx'
    )
    const sidebar = await fs.readFile(sidebarPath, 'utf-8')
    const updatedSidebar = sidebar.replace(/<app_title>/g, metadata.appTitle)
    await fs.writeFile(sidebarPath, updatedSidebar)
    console.log(`${colors.green}✓${colors.reset} Updated app-sidebar.tsx`)

    // Success message
    console.log(
      `\n${colors.bright}${colors.green}✨ Project metadata setup complete!${colors.reset}\n`
    )
    console.log(
      `${colors.dim}Your project "${metadata.projectName}" is now configured.${colors.reset}`
    )
    console.log(
      `${colors.dim}Run "bun dev" to start developing!${colors.reset}\n`
    )
  } catch (error) {
    console.error(
      `\n${colors.bright}${colors.yellow}❌ Error:${colors.reset}`,
      error
    )
    process.exit(1)
  } finally {
    rl.close()
  }
}

// Run the setup
setupMetadata()
