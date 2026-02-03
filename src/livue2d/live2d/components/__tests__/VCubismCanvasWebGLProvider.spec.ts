import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest'
import { inject } from 'vue'
import VCubismCanvasWebGLProvider from '../VCubismCanvasWebGLProvider.vue'

// モックの設定 - ファクトリー関数内で変数を使わない
vi.mock('@/live2d/webgl/createShader', () => ({
  createShader: vi.fn(() => 'mock-program-id'),
}))

vi.mock('@/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}))

// vi.mockの後にインポートする
import { createShader } from '@/live2d/webgl/createShader'
import { logger } from '@/logger'

// injectのモックを設定
vi.mock('vue', async () => {
  const actual = await vi.importActual('vue')
  return {
    ...(actual as object),
    inject: vi.fn((key) => {
      if (key === 'WebGLRenderingContext') return { value: null }
      if (key === 'WebGLProgram') return { value: 'mock-program-id' }
      return undefined
    }),
  }
})

describe('VCubismCanvasWebGLProvider', () => {
  let mockGLContext: WebGLRenderingContext

  // テスト前の準備
  beforeEach(() => {
    // クリアメソッドを使用してモックをリセット
    vi.clearAllMocks()

    // キャンバスとWebGLコンテキストのモックを設定
    mockGLContext = {
      getParameter: vi.fn(),
      clearColor: vi.fn(),
      clear: vi.fn(),
      viewport: vi.fn(),
      deleteProgram: vi.fn(),
      createShader: vi.fn(),
    } as unknown as WebGLRenderingContext

    // HTMLCanvasElementをモック
    // @ts-expect-error テスト用にグローバルに設定
    global.HTMLCanvasElement.prototype.getContext = vi.fn(() => mockGLContext)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should mount successfully', async () => {
    const wrapper = mount(VCubismCanvasWebGLProvider)
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.find({ ref: 'canvas' }).exists()).toBe(true)
  })

  it('should initialize WebGL context on mount', async () => {
    mount(VCubismCanvasWebGLProvider)
    await flushPromises()

    // インポートしたcreateShaderをそのまま使用
    expect(createShader).toHaveBeenCalledWith(mockGLContext)
  })

  it('should handle error when WebGL context cannot be created', async () => {
    // WebGLコンテキスト取得失敗のケース
    global.HTMLCanvasElement.prototype.getContext = vi.fn(() => null)

    mount(VCubismCanvasWebGLProvider)
    await flushPromises()

    expect(logger.error).toHaveBeenCalledWith('Failed to get WebGL2 context')
  })

  it('should clean up resources on unmount', async () => {
    const wrapper = mount(VCubismCanvasWebGLProvider)
    await flushPromises()

    wrapper.unmount()

    expect(mockGLContext.deleteProgram).toHaveBeenCalled()
  })

  it('should provide WebGL context and program', async () => {
    // injectのモック値を設定
    const mockInject = inject as unknown as Mock
    mockInject.mockImplementation((key: string) => {
      if (key === 'WebGLRenderingContext') return { value: mockGLContext }
      if (key === 'WebGLProgram') return { value: 'mock-program-id' }
      return undefined
    })

    // テスト用の子コンポーネント
    const ChildComponent = {
      template: '<div>Child Component</div>',
      setup() {
        const injectedContext = inject('WebGLRenderingContext')
        const injectedProgram = inject('WebGLProgram')

        return { injectedContext, injectedProgram }
      },
    }

    const wrapper = mount(VCubismCanvasWebGLProvider, {
      slots: {
        default: ChildComponent,
      },
    })

    await flushPromises()

    expect(wrapper.text()).toContain('Child Component')
    expect(mockInject).toHaveBeenCalledWith('WebGLRenderingContext')
    expect(mockInject).toHaveBeenCalledWith('WebGLProgram')
  })
})
