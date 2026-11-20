import html2canvas from 'html2canvas'

export async function exportCardImage(node, filename = '药明白-吃药卡片.png') {
  if (!node) {
    throw new Error('未找到要导出的卡片节点')
  }
  const canvas = await html2canvas(node, {
    scale: 2,
    backgroundColor: '#FFFDF7',
    useCORS: true,
    logging: false,
  })

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!blob) {
    throw new Error('图片生成失败，请重试')
  }

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
