import type {
  ChatCompletionMessageParam,
  ChatCompletionSystemMessageParam,
  ChatCompletionUserMessageParam,
} from 'openai/resources/index.mjs'
import type { ChatCompletionTool } from 'openai/src/resources/index.js'
import { model, openai } from '../llm/openai'
import type { ChangeCharacterExpressionArgs } from './CharacterChatWithExpression'
import type { ExpressionType } from './type/ExpressionType'

const tools: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'change_character_expression',
      description: "Change the character's expression",
      parameters: {
        type: 'object',
        properties: {
          expressionType: {
            type: 'string',
            enum: ['normal', 'happy', 'sad', 'angry', 'surprised', 'blush'],
            description: 'Expression',
          },
        },
        required: ['expressionType'],
      },
    },
  },
]

export async function selectExpression(text: string): Promise<ExpressionType> {
  const systemMessage: ChatCompletionSystemMessageParam = {
    role: 'system',
    // 与えられた文章から`change_character_expression`関数でふさわしい表情を選択してください。
    content:
      'Please select an appropriate expression for the `change_character_expression` function from the given text.',
  }
  const userMessage: ChatCompletionUserMessageParam = {
    role: 'user',
    content: text,
  }
  const messages: ChatCompletionMessageParam[] = [systemMessage, userMessage]
  let expressionType: ExpressionType = 'auto'

  for (let i = 0; i < 10; i++) {
    const response = await openai.chat.completions.create({
      model,
      messages,
      tools,
      tool_choice: 'auto', // AIに関数呼び出しの判断を委ねる
    })
    const message = response.choices[0].message
    if (message.tool_calls?.length) {
      const toolCall = message.tool_calls[0]
      if (toolCall.function.name === 'change_character_expression') {
        const args = JSON.parse(toolCall.function.arguments) as ChangeCharacterExpressionArgs
        expressionType = args.expressionType
        break
      }
    }
  }

  return expressionType
}
