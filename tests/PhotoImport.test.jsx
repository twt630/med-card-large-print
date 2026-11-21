import { describe, it, expect, vi } from 'vitest'
import { render, screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderHook, act } from '@testing-library/react'
import App from '../src/App.jsx'
import CardPreview from '../src/components/CardPreview.jsx'
import { createDrug } from '../src/data/samples.js'
import { useMembers } from '../src/hooks/useMembers.js'

const PHOTO = 'data:image/png;base64,iVBORw0KGgo='
const makeFile = (bytes = 1024, name = 'photo.png', type = 'image/png') =>
  new File([new Uint8Array(bytes)], name, { type })

describe('数据层 photoData', () => {
  it('默认为空字符串', () => {
    expect(createDrug().photoData).toBe('')
  })

  it('新增与修改药品时可写入/清除 photoData', () => {
    const { result } = renderHook(() => useMembers())
    act(() => result.current.addDrug({ name: '药A', dose: '1片', photoData: PHOTO }))
    const added = result.current.selectedCard.drugs[3]
    expect(added.photoData).toBe(PHOTO)

    act(() => result.current.updateDrug(added.id, { photoData: '' }))
    expect(result.current.selectedCard.drugs[3].photoData).toBe('')
  })
})

describe('CardPreview 照片渲染分支', () => {
  const card = (drug) => ({ title: '卡片', drugs: [drug] })

  it('有 photoData 时优先渲染照片、不渲染 SVG 药片图标', () => {
    render(
      <CardPreview
        card={card(
          createDrug({ name: '氨氯地平', times: ['早'], dose: '1片', photoData: PHOTO }),
        )}
      />,
    )
    expect(screen.getByAltText('氨氯地平的实拍照片')).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: '纯白圆片' })).not.toBeInTheDocument()

    const photoBox = screen.getByAltText('氨氯地平的实拍照片').parentElement
    expect(getComputedStyle(photoBox).borderRadius).toBe('12px')
    expect(getComputedStyle(photoBox).overflow).toBe('hidden')
  })

  it('无 photoData 时回落 SVG 药片图标', () => {
    render(
      <CardPreview card={card(createDrug({ name: '氨氯地平', times: ['早'], dose: '1片' }))} />,
    )
    expect(screen.queryByAltText(/实拍照片/)).not.toBeInTheDocument()
    expect(screen.getByRole('img', { name: '纯白圆片' })).toBeInTheDocument()
  })
})

describe('DrugForm 上传与移除', () => {
  const previewArea = () => screen.getByLabelText('卡片预览区')

  it('提供上传入口与隐藏文件输入', () => {
    render(<App />)
    const panel = screen.getByLabelText('药品 1')
    expect(within(panel).getByRole('button', { name: '📷 上传照片' })).toBeInTheDocument()
    expect(
      within(panel).getByLabelText('选择 氨氯地平 的照片'),
    ).toHaveAttribute('type', 'file')
    expect(
      within(panel).getByLabelText('选择 氨氯地平 的照片'),
    ).toHaveAttribute('accept', 'image/*')
  })

  it('上传照片后预览区显示照片', async () => {
    const user = userEvent.setup()
    render(<App />)
    const panel = screen.getByLabelText('药品 1')
    const input = within(panel).getByLabelText('选择 氨氯地平 的照片')

    await user.upload(input, makeFile())
    await waitFor(() => {
      expect(screen.getByAltText('氨氯地平的实拍照片')).toBeInTheDocument()
    })
    expect(within(panel).getByAltText('已选药品照片预览')).toBeInTheDocument()
    // 爷爷示例里阿托伐他汀也是白圆片，上传后仅剩它一个 SVG 图标
    expect(within(previewArea()).getAllByRole('img', { name: '纯白圆片' })).toHaveLength(1)
  })

  it('超过 5MB 时给出提示且不上传', async () => {
    const user = userEvent.setup()
    render(<App />)
    const panel = screen.getByLabelText('药品 1')
    const input = within(panel).getByLabelText('选择 氨氯地平 的照片')

    await user.upload(input, makeFile(6 * 1024 * 1024))
    expect(await screen.findByRole('alert')).toHaveTextContent('照片超过 5MB')
    expect(screen.queryByAltText(/实拍照片/)).not.toBeInTheDocument()
    expect(within(previewArea()).getAllByRole('img', { name: '纯白圆片' })).toHaveLength(2)
  })

  it('移除照片后回落 SVG 图标', async () => {
    const user = userEvent.setup()
    render(<App />)
    const panel = screen.getByLabelText('药品 1')
    const input = within(panel).getByLabelText('选择 氨氯地平 的照片')

    await user.upload(input, makeFile())
    await waitFor(() => {
      expect(screen.getByAltText('氨氯地平的实拍照片')).toBeInTheDocument()
    })

    await user.click(within(panel).getByRole('button', { name: '✕ 移除照片' }))
    expect(screen.queryByAltText(/实拍照片/)).not.toBeInTheDocument()
    expect(within(previewArea()).getAllByRole('img', { name: '纯白圆片' })).toHaveLength(2)
  })
})
