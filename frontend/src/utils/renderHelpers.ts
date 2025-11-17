/**
 * 安全渲染函数：处理字符串、数组、对象
 * 防止 React "Objects are not valid as a React child" 错误
 */
export const safeRender = (value: any): string => {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number') return String(value)
  if (typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) return value.join('、')
  if (typeof value === 'object') {
    // 如果是{primary, secondary}格式，优先显示primary
    if (value.primary) return String(value.primary)

    // 如果是五行对象 {fire, wood, earth, metal, water}，格式化显示
    if (value.fire !== undefined || value.wood !== undefined ||
        value.earth !== undefined || value.metal !== undefined || value.water !== undefined) {
      const elements = []
      if (value.wood) elements.push(`木:${value.wood}`)
      if (value.fire) elements.push(`火:${value.fire}`)
      if (value.earth) elements.push(`土:${value.earth}`)
      if (value.metal) elements.push(`金:${value.metal}`)
      if (value.water) elements.push(`水:${value.water}`)
      return elements.join(' ')
    }

    // 否则JSON化
    return JSON.stringify(value)
  }
  return String(value)
}
