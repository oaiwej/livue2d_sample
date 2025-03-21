import type {
  ChatCompletionMessageParam,
  ChatCompletionSystemMessageParam,
  ChatCompletionTool,
  ChatCompletionToolMessageParam,
} from 'openai/resources/index.mjs'
import type { ChatCompletionUserMessageParam } from 'openai/src/resources/index.js'
import { model, openai } from './openai'

/**
 * キャラクターの表情を変更する関数の引数
 */
export interface ChangeCharacterExpressionArgs {
  expressionType: 'normal' | 'happy' | 'sad' | 'angry' | 'surprised' | 'blush'
}

/**
 * キャラクターの会話と表情を管理するクラス
 */
export class CharacterChatWithExpression {
  // 会話履歴
  protected conversationHistory: ChatCompletionMessageParam[] = []
  // ツール
  protected readonly tools: ChatCompletionTool[] = [
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

  // システムメッセージ
  protected readonly defaultSystemMessage: ChatCompletionSystemMessageParam = {
    role: 'system',
    content: `
      You can also change the character's expression using the \`change_character_expression\` function in response to the conversation.
    `,
  }
  // 会話履歴の数がこの数以上になったら要約する
  protected summarizeLength = 5
  // 会話履歴を要約するためのシステムメッセージ
  protected summarizeSystemMessage: ChatCompletionSystemMessageParam = {
    role: 'system',
    // これまでの会話を要約してください。具体的な名詞や日付などは失われないように注意してください。
    content:
      'Please summarize the conversation so far. Be careful not to lose specific nouns, dates, etc.',
  }
  // 会話履歴の要約を促すユーザーメッセージ
  protected summarizeUserMessage: ChatCompletionUserMessageParam = {
    role: 'user',
    content: 'Please summarize the conversation so far.',
  }

  // オプションのシステムメッセージ
  protected systemMessages: ChatCompletionSystemMessageParam[] = []

  /**
   * キャラクターの会話と表情を管理するクラスを初期化する
   * @param systemMessages 追加のシステムメッセージ
   * @param summarizeLength 会話履歴の数がこの数以上になったら要約する
   */
  constructor(
    systemMessages: ChatCompletionSystemMessageParam[] = [],
    summarizeLength: number = 5,
  ) {
    this.systemMessages = systemMessages
    this.summarizeLength = summarizeLength
  }

  /**
   * 会話履歴をクリアする
   */
  public clearHistory(): void {
    this.conversationHistory = []
  }

  /**
   * 会話履歴を取得する
   */
  public getHistory(): ChatCompletionMessageParam[] {
    return [...this.conversationHistory]
  }

  /**
   * ユーザーのメッセージに対するキャラクターの応答を取得する
   * @param userMessageContent ユーザーのメッセージ
   * @returns キャラクターの応答と表情
   */
  public async completion(
    userMessageContent: string,
  ): Promise<{ text: string; expression: ChangeCharacterExpressionArgs['expressionType'] | null }> {
    const systemMessages: ChatCompletionSystemMessageParam[] = [
      this.defaultSystemMessage,
      ...this.systemMessages,
    ]

    try {
      // 会話履歴が一定数以上になったら要約する
      if (this.conversationHistory.length >= this.summarizeLength) {
        await this.summarizeHistory()
      }

      const userMessage: ChatCompletionUserMessageParam = {
        role: 'user',
        content: userMessageContent,
      }
      this.conversationHistory.push(userMessage)

      // APIリクエストに関数定義を含める
      const response = await openai.chat.completions.create({
        model,
        messages: [...systemMessages, ...this.conversationHistory],
        tools: this.tools,
        tool_choice: 'auto', // AIに関数呼び出しの判断を委ねる
        temperature: 0.7,
      })

      // AIの応答を取得
      const message = response.choices[0].message

      // 関数呼び出しを処理
      if (message.tool_calls) {
        const functionCall = message.tool_calls[0]

        if (functionCall.function.name === 'change_character_expression') {
          // 関数の引数をJSONとしてパース
          const args = JSON.parse(functionCall.function.arguments) as ChangeCharacterExpressionArgs

          // ツールレスポンスを作成
          const toolMessage: ChatCompletionToolMessageParam = {
            role: 'tool',
            content: `Changed the expression to ${args.expressionType}.`,
            tool_call_id: functionCall.id,
          }
          this.conversationHistory.push(toolMessage)

          // ツールレスポンスを含めて再度APIリクエスト
          const response = await openai.chat.completions.create({
            model,
            messages: [...systemMessages, ...this.conversationHistory, toolMessage],
            temperature: 0.7,
          })

          // 応答を履歴に追加
          this.conversationHistory.push({
            role: 'assistant',
            content: response.choices[0].message.content ?? '',
          })

          // 応答と表情を返す
          return {
            text: response.choices[0].message.content ?? '',
            expression: args.expressionType,
          }
        }
      }

      // 応答を履歴に追加
      this.conversationHistory.push({
        role: 'assistant',
        content: message.content ?? '',
      })

      // 関数呼び出しがない場合は通常のテキスト応答を返す
      return { text: message.content ?? '', expression: null }
    } catch (error) {
      console.error('OpenAI API error:', error)
      return { text: 'エラーが発生しました', expression: null }
    }
  }

  /**
   * 会話履歴を要約する処理
   */
  public async summarizeHistory(): Promise<void> {
    const response = await openai.chat.completions.create({
      model,
      messages: [
        this.summarizeSystemMessage,
        ...this.conversationHistory,
        this.summarizeUserMessage,
      ],
      temperature: 0.0,
    })
    const summary = response.choices[0].message.content ?? ''
    this.conversationHistory = [
      {
        role: 'system',
        // ここまでのあらすじ
        content: 'Here is a summary of the conversation so far: \r\n' + summary,
      },
    ]
  }
}
