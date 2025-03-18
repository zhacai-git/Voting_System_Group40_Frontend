import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import voteEntrance from '@/views/voteEntrance.vue'  // 更新为实际路径

describe('VoteEntrance', () => {
  it('renders the header correctly', () => {
    const wrapper = mount(voteEntrance)
    expect(wrapper.find('.system-title').text()).toBe('Online Voting System')
    // expect(wrapper.find('.version-info').text()).toBe('Group 40 Sys. Ver: 0.0.0')
  })

  it('renders the vote input form', () => {
    const wrapper = mount(voteEntrance)
    expect(wrapper.find('.title').text()).toBe('Enter Vote Number')
    expect(wrapper.find('.vote-input').exists()).toBe(true)
    expect(wrapper.find('.join-btn').text()).toBe('Join Vote')
  })

  it('binds the input field to voteNumber data', async () => {
    const wrapper = mount(voteEntrance)
    const input = wrapper.find('.vote-input')

    // 确保输入框存在
    expect(input.exists()).toBe(true)

    // 修改输入框的值
    await input.setValue('9876 5432')

    // 验证组件的数据已更新
    expect(wrapper.vm.voteNumber).toBe('9876 5432')
  })

  it('displays the create/manage link and login button', () => {
    const wrapper = mount(voteEntrance)
    expect(wrapper.find('.create-link').text()).toBe('Create / Manage a vote')
    expect(wrapper.find('.login-btn').text()).toBe('Login')
  })

  it('has a join vote button', () => {
    const wrapper = mount(voteEntrance)
    const button = wrapper.find('.join-btn')
    expect(button.exists()).toBe(true)
    expect(button.text()).toBe('Join Vote')
  })
})