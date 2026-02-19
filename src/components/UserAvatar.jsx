import { h } from '@/ui/webjsx.js'
import { getInitials } from '@/lib/utils.js'

export function UserAvatar({
  name = '',
  photo = null,
  size = 'md',
  inactive = false,
  tooltip = null,
  className = '',
  ...props
}) {
  const sizeMap = { xs: 'w-6 h-6 text-xs', sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-lg', xl: 'w-20 h-20 text-xl' }
  const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500', 'bg-teal-500']
  const colorIdx = name ? name.charCodeAt(0) % colors.length : 0
  const greyClass = inactive ? 'grayscale opacity-60' : ''
  const sizeClass = sizeMap[size] || sizeMap.md

  const content = photo
    ? h('img', {
        src: photo,
        alt: name,
        class: `${sizeClass} rounded-full object-cover ${greyClass} ${className}`,
        'data-component': 'user-avatar',
        title: tooltip || name,
        ...props
      })
    : h('div', {
        class: `${sizeClass} rounded-full flex items-center justify-center text-white font-semibold ${colors[colorIdx]} ${greyClass} ${className}`,
        'data-component': 'user-avatar',
        title: tooltip || name,
        ...props
      }, getInitials(name))

  return content
}

export default UserAvatar
