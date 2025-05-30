import handlebars from 'handlebars'

/**
 * Service responsible for generating context for AI agents to respond to messages.
 * Handles the transformation of agent data and user input into formatted prompts.
 */
export class ContextService {
  /**
   * Creates a custom context from provided state, template, and instructions.
   *
   * @param state - Key-value pairs of context data
   * @param instructions - Custom instructions for the AI
   * @returns Formatted context string ready for LLM prompt
   * @throws Error if required parameters are missing or template processing fails
   */
  static createContext({
    state: incomingState,
    template,
  }: {
    state: Record<string, string[] | string | null | undefined>
    template: string
  }): string {
    // Validate required inputs
    if (!incomingState || Object.keys(incomingState).length === 0) {
      throw new Error('State data is required')
    }

    try {
      // Track removed keys (null values)
      const removedKeys: string[] = []

      // Format array values in the state object and filter out null values
      const state = Object.entries(incomingState).reduce(
        (acc, [key, value]) => {
          if (value === null || value === undefined) {
            removedKeys.push(key)
            return acc
          }

          if (Array.isArray(value)) {
            acc[key] = ContextService.formatArrayField(value)
          } else {
            acc[key] = value
          }
          return acc
        },
        {} as Record<string, string>
      )

      // Remove lines containing removed keys from template
      let cleanedTemplate = template
      if (removedKeys.length > 0) {
        cleanedTemplate = ContextService.removeKeysFromTemplate(
          template,
          removedKeys
        )
      }

      // Compose final context
      return ContextService.composeContext({
        state,
        template: cleanedTemplate,
      })
    } catch (error) {
      throw new Error(
        `Failed to create custom context: ${(error as Error).message}`
      )
    }
  }

  /**
   * Removes lines containing specified keys from the template.
   *
   * @param template - Template string
   * @param keys - Array of keys to remove
   * @returns Cleaned template with lines containing keys removed
   */
  private static removeKeysFromTemplate(
    template: string,
    keys: string[]
  ): string {
    const lines = template.split('\n')
    const keyPatterns = keys.map((key) => new RegExp(`{{\\s*${key}\\s*}}`, 'i'))

    const filteredLines = lines.filter((line) => {
      return !keyPatterns.some((pattern) => pattern.test(line))
    })

    return filteredLines.join('\n')
  }

  /**
   * Composes a context string by replacing placeholders in a template using Handlebars.
   *
   * @param state - Key-value pairs to inject into the template
   * @param template - Template string with handlebars placeholders
   * @returns Processed string with placeholders replaced with values
   * @throws Error if template compilation or rendering fails
   */
  private static composeContext({
    state,
    template,
  }: {
    state: Record<string, string>
    template: string
  }): string {
    if (!template) {
      throw new Error('Template cannot be null or undefined')
    }

    if (!state) {
      throw new Error('State cannot be null or undefined')
    }

    try {
      const templateFunction = handlebars.compile(template)
      return templateFunction(state)
    } catch (error) {
      throw new Error(`Template processing failed: ${(error as Error).message}`)
    }
  }

  /**
   * Formats an array of strings into a bullet-point list.
   *
   * @param fieldArray - Array of strings to format
   * @returns Formatted string with bullet points or empty string if array is empty/null/undefined
   */
  private static formatArrayField(
    fieldArray: string[] | null | undefined
  ): string {
    if (!fieldArray || fieldArray.length === 0) return ''
    return fieldArray.map((item) => `- ${item}`).join('\n')
  }
}
