import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import VCubismFramework from '../VCubismFramework.vue'

// CubismFrameworkのモック
vi.mock('@framework/live2dcubismframework', () => ({
  CubismFramework: {
    startUp: vi.fn(),
    initialize: vi.fn(),
    dispose: vi.fn(),
    cleanUp: vi.fn(),
  },
}))

// Loggerのモック
vi.mock('@/logger', () => ({
  logger: {
    debug: vi.fn(),
  },
}))

// インポート文はモックの後に配置
import { logger } from '@/logger'
import { CubismFramework } from '@framework/live2dcubismframework'

describe('VCubismFramework', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should mount successfully', async () => {
    const wrapper = mount(VCubismFramework)
    expect(wrapper.exists()).toBe(true)
  })

  it('should initialize CubismFramework on mount', async () => {
    mount(VCubismFramework)
    await flushPromises()

    expect(CubismFramework.startUp).toHaveBeenCalled()
    expect(CubismFramework.initialize).toHaveBeenCalled()
    expect(logger.debug).toHaveBeenCalledWith('CubismFramework has been initialized')
  })

  it('should set initialized to true after initialization', async () => {
    const wrapper = mount(VCubismFramework)
    await flushPromises()

    // @ts-expect-error プライベートなリアクティブ状態を検査
    expect(wrapper.vm.initialized).toBe(true)
  })

  it('should dispose CubismFramework on unmount', async () => {
    const wrapper = mount(VCubismFramework)
    await flushPromises()

    wrapper.unmount()

    expect(CubismFramework.dispose).toHaveBeenCalled()
    expect(CubismFramework.cleanUp).toHaveBeenCalled()
    expect(logger.debug).toHaveBeenCalledWith('CubismFramework has been disposed')
  })

  it('should render slot content only when initialized', async () => {
    // テスト用のスロットコンテンツ
    const slotContent = 'Test Slot Content'

    const wrapper = mount(VCubismFramework, {
      slots: {
        default: `<div class="test-slot">${slotContent}</div>`,
      },
    })

    // マウント直後はまだ初期化が完了していないため、スロットは表示されない
    expect(wrapper.find('.test-slot').exists()).toBe(false)

    // 初期化完了を待つ
    await flushPromises()

    // 初期化後はスロットが表示されるはず
    expect(wrapper.find('.test-slot').exists()).toBe(true)
    expect(wrapper.find('.test-slot').text()).toBe(slotContent)
  })

  it('should set initialized to false before unmount', async () => {
    const wrapper = mount(VCubismFramework)
    await flushPromises()

    // onBeforeUnmountをトリガー
    wrapper.unmount()

    // @ts-expect-error 初期化状態がfalseになっているか確認
    expect(wrapper.vm.initialized).toBe(false)
  })
})
