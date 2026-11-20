import { render, screen } from '@testing-library/react'
import App from '../src/App.jsx'
import { describe, it, expect } from 'vitest'

describe('App', () => {
  it('渲染应用标题', () => {
    render(<App />)
    expect(
      screen.getByRole('heading', { name: '药明白 · 给爸妈的极简大字用药卡片' }),
    ).toBeInTheDocument()
  })
})
