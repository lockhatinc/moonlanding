import { h } from '@/ui/webjsx.js'

export function Navbar({
  children,
  className = '',
  ...props
}) {
  return h('nav', {
    class: `sticky top-0 z-[60] bg-white shadow-sm border-b border-gray-100 px-6 py-3 ${className}`,
    role: 'navigation',
    ...props
  }, [
    h('div', { class: 'flex items-center justify-between max-w-full' }, children)
  ])
}

export function NavbarLeft({ children, className = '', ...props }) {
  return h('div', {
    class: `flex items-center gap-4 ${className}`,
    ...props
  }, children)
}

export function NavbarRight({ children, className = '', ...props }) {
  return h('div', {
    class: `flex items-center gap-4 ${className}`,
    ...props
  }, children)
}

export function NavbarLogo({ children, href = '/', className = '', ...props }) {
  return h('a', {
    href,
    class: `text-xl font-bold text-blue-600 ${className}`,
    ...props
  }, children)
}

export function NavLinks({ children, className = '', ...props }) {
  return h('div', {
    class: `hidden md:flex gap-2 ${className}`,
    ...props
  }, children)
}

export function NavLink({
  children,
  href = '#',
  active = false,
  className = '',
  ...props
}) {
  const activeClass = active
    ? 'bg-blue-50 text-blue-600'
    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'

  return h('a', {
    href,
    class: `px-3 py-2 text-sm font-medium rounded-md transition-all duration-150 ${activeClass} ${className}`,
    ...props
  }, children)
}

export function Sidebar({
  children,
  collapsed = false,
  className = '',
  ...props
}) {
  const widthClass = collapsed ? 'w-12' : 'w-60'

  return h('aside', {
    class: `bg-white border-r border-gray-100 h-screen overflow-y-auto transition-all duration-200 ${widthClass} ${className}`,
    role: 'complementary',
    ...props
  }, children)
}

export function SidebarSection({
  children,
  title = null,
  className = '',
  ...props
}) {
  return h('div', { class: `p-2 ${className}`, ...props }, [
    title && h('div', {
      class: 'px-3 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wide'
    }, title),
    children
  ])
}

export function SidebarLink({
  children,
  href = '#',
  active = false,
  icon = null,
  className = '',
  ...props
}) {
  const activeClass = active
    ? 'bg-blue-50 text-blue-600 font-medium'
    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'

  return h('a', {
    href,
    class: `flex items-center gap-3 px-3 py-2.5 text-sm rounded-md transition-all duration-150 ${activeClass} ${className}`,
    ...props
  }, [
    icon && h('span', { class: 'flex-shrink-0' }, icon),
    h('span', {}, children)
  ])
}

export default {
  Navbar,
  NavbarLeft,
  NavbarRight,
  NavbarLogo,
  NavLinks,
  NavLink,
  Sidebar,
  SidebarSection,
  SidebarLink
}
