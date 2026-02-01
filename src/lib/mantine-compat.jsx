/**
 * Mantine Compatibility Layer
 * 
 * Temporary shims to allow components to work without full Mantine
 * during migration to RippleUI. Remove as components are migrated.
 */

import React from 'react';

// Layout Components
export const Stack = ({ children, gap = 'md', ...props }) => (
  <div className={`flex flex-col gap-${gap === 'md' ? '4' : gap === 'xs' ? '1' : gap === 'sm' ? '2' : '4'}`} {...props}>
    {children}
  </div>
);

export const Group = ({ children, gap = 'sm', justify = 'flex-start', ...props }) => (
  <div className={`flex flex-row gap-${gap === 'md' ? '4' : gap === 'xs' ? '1' : gap === 'sm' ? '2' : '4'} justify-${justify === 'space-between' ? 'between' : 'start'}`} {...props}>
    {children}
  </div>
);

export const Box = ({ children, ...props }) => (
  <div {...props}>{children}</div>
);

export const Paper = ({ children, p = 'md', withBorder = false, ...props }) => (
  <div className={`card p-${p === 'md' ? '4' : p === 'xs' ? '1' : p === 'sm' ? '2' : '4'} ${withBorder ? 'border' : ''}`} {...props}>
    {children}
  </div>
);

export const SimpleGrid = ({ children, cols = 2, gap = 'md', ...props }) => (
  <div className={`grid grid-cols-${cols} gap-${gap === 'md' ? '4' : gap === 'xs' ? '1' : gap === 'sm' ? '2' : '4'}`} {...props}>
    {children}
  </div>
);

export const Grid = ({ children, gutter = 'md', ...props }) => (
  <div className={`grid gap-${gutter === 'md' ? '4' : gutter === 'xs' ? '1' : gutter === 'sm' ? '2' : '4'}`} {...props}>
    {children}
  </div>
);

export const Grid_Col = ({ children, span = 12, ...props }) => (
  <div className={`col-span-${span?.base || span || 12}`} {...props}>
    {children}
  </div>
);

Grid.Col = Grid_Col;

// Text Components
export const Text = ({ children, size = 'md', c, fw, ...props }) => {
  const className = `text-${size === 'sm' ? 'sm' : size === 'xs' ? 'xs' : 'base'} ${c === 'dimmed' ? 'text-gray-500' : c === 'red' ? 'text-red-500' : ''} ${fw === 500 ? 'font-medium' : fw === 600 ? 'font-semibold' : ''}`;
  return <span className={className} {...props}>{children}</span>;
};

export const Title = ({ children, order = 1, ...props }) => {
  const tags = { 1: 'h1', 2: 'h2', 3: 'h3', 4: 'h4', 5: 'h5', 6: 'h6' };
  const Tag = tags[order] || 'h1';
  return <Tag {...props}>{children}</Tag>;
};

// Button Components
export const Button = ({ children, variant = 'filled', size = 'sm', color, loading, disabled, leftSection, rightSection, ...props }) => {
  const variants = {
    filled: 'btn btn-primary',
    outline: 'btn btn-outline',
    subtle: 'btn btn-ghost',
    default: 'btn',
  };
  const sizes = {
    xs: 'btn-xs',
    sm: 'btn-sm',
    md: 'btn-md',
    lg: 'btn-lg',
  };
  const colors = {
    red: 'btn-error',
    green: 'btn-success',
    blue: 'btn-primary',
  };
  
  const className = `${variants[variant] || 'btn'} ${sizes[size] || 'btn-sm'} ${color ? colors[color] || '' : ''} ${disabled ? 'btn-disabled' : ''}`;
  
  return (
    <button className={className} disabled={disabled || loading} {...props}>
      {leftSection && <span>{leftSection}</span>}
      {loading ? 'Loading...' : children}
      {rightSection && <span>{rightSection}</span>}
    </button>
  );
};

export const ActionIcon = ({ children, variant = 'default', color, onClick, size = 'md', ...props }) => (
  <button
    className={`btn btn-sm btn-ghost ${color === 'red' ? 'text-red-500' : ''}`}
    onClick={onClick}
    {...props}
  >
    {children}
  </button>
);

// Form Components
export const TextInput = ({ value, onChange, placeholder, disabled, ...props }) => (
  <input type="text" className="input" value={value} onChange={onChange} placeholder={placeholder} disabled={disabled} {...props} />
);

export const NumberInput = ({ value, onChange, placeholder, disabled, ...props }) => (
  <input type="number" className="input" value={value} onChange={(e) => onChange?.(e.target.value)} placeholder={placeholder} disabled={disabled} {...props} />
);

export const Textarea = ({ value, onChange, placeholder, disabled, ...props }) => (
  <textarea className="input" value={value} onChange={onChange} placeholder={placeholder} disabled={disabled} {...props} />
);

export const Select = ({ value, onChange, data, placeholder, disabled, ...props }) => (
  <select className="select" value={value} onChange={(e) => onChange?.(e.target.value)} disabled={disabled} {...props}>
    <option value="">{placeholder}</option>
    {data?.map((item) => (
      <option key={item.value} value={item.value}>{item.label}</option>
    ))}
  </select>
);

export const Checkbox = ({ checked, onChange, ...props }) => (
  <input type="checkbox" className="checkbox" checked={checked} onChange={onChange} {...props} />
);

export const FileInput = ({ onChange, ...props }) => (
  <input type="file" className="input" onChange={onChange} {...props} />
);

// Feedback Components
export const Alert = ({ children, color = 'blue', title, onClose, ...props }) => {
  const colors = {
    red: 'alert-error',
    green: 'alert-success',
    blue: 'alert-info',
  };
  return (
    <div className={`alert ${colors[color] || 'alert-info'}`} {...props}>
      <div className="flex justify-between items-start gap-2">
        <div>
          {title && <h3 className="font-semibold">{title}</h3>}
          {children}
        </div>
        {onClose && <button onClick={onClose} className="text-lg">&times;</button>}
      </div>
    </div>
  );
};

export const Badge = ({ children, color, variant, size, ...props }) => (
  <span className="badge" {...props}>{children}</span>
);

export const Loader = ({ size = 'md', ...props }) => (
  <div className="loading" {...props}></div>
);

export const Progress = ({ value, color = 'blue', ...props }) => {
  const colors = {
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    red: 'bg-red-500',
  };
  return (
    <div className="w-full bg-gray-200 rounded-full h-2" {...props}>
      <div className={`h-2 rounded-full ${colors[color] || 'bg-blue-500'}`} style={{ width: `${value}%` }}></div>
    </div>
  );
};

export const Skeleton = ({ height = 100, ...props }) => (
  <div className="bg-gray-200 rounded-md animate-pulse" style={{ height: `${height}px` }} {...props} />
);

// Modal/Dialog Components
export const Modal = ({ opened, onClose, title, children, ...props }) => {
  if (!opened) return null;
  return (
    <dialog className="modal modal-open" {...props}>
      <div className="modal-box">
        {title && <h3 className="font-bold text-lg">{title}</h3>}
        {children}
      </div>
    </dialog>
  );
};

// Table Components
export const Table = ({ children, ...props }) => (
  <table className="table" {...props}>{children}</table>
);

Table.Thead = ({ children }) => <thead>{children}</thead>;
Table.Tbody = ({ children }) => <tbody>{children}</tbody>;
Table.Tr = ({ children }) => <tr>{children}</tr>;
Table.Th = ({ children }) => <th>{children}</th>;
Table.Td = ({ children }) => <td>{children}</td>;

// Other Components
export const ScrollArea = ({ children, ...props }) => (
  <div className="overflow-y-auto" {...props}>{children}</div>
);

export const Tabs = ({ value, onTabChange, children, ...props }) => (
  <div className="tabs" {...props}>{children}</div>
);

export const Tabs_List = ({ children }) => <div className="tabs-list">{children}</div>;
Tabs.List = Tabs_List;

export const Tabs_Tab = ({ value, children, ...props }) => (
  <a className="tab" {...props}>{children}</a>
);
Tabs.Tab = Tabs_Tab;

export const Tabs_Panel = ({ value, children, ...props }) => (
  <div className="tab-content" {...props}>{children}</div>
);
Tabs.Panel = Tabs_Panel;

export const Tooltip = ({ label, children, ...props }) => (
  <div className="tooltip" title={label} {...props}>{children}</div>
);

export const Avatar = ({ src, alt, color, size, name, ...props }) => (
  <img src={src} alt={alt || name} className={`avatar avatar-${size || 'md'}`} {...props} />
);

export const ThemeIcon = ({ children, size = 'md', color, variant = 'default', ...props }) => (
  <div className={`flex items-center justify-center w-${size === 'md' ? '10' : size === 'sm' ? '8' : '12'} h-${size === 'md' ? '10' : size === 'sm' ? '8' : '12'}`} {...props}>
    {children}
  </div>
);

export const Center = ({ children, ...props }) => (
  <div className="flex items-center justify-center" {...props}>{children}</div>
);

export const Divider = ({ ...props }) => (
  <hr className="border-gray-300" {...props} />
);

export const Popover = ({ children, ...props }) => (
  <div className="popover" {...props}>{children}</div>
);

export const Card = ({ children, ...props }) => (
  <div className="card" {...props}>{children}</div>
);

export const MultiSelect = ({ data, value, onChange, placeholder, searchable, ...props }) => (
  <select multiple className="select" value={value} onChange={(e) => onChange?.(Array.from(e.target.selectedOptions, option => option.value))} {...props}>
    <option value="">{placeholder}</option>
    {data?.map((item) => (
      <option key={item.value} value={item.value}>{item.label}</option>
    ))}
  </select>
);

export const SegmentedControl = ({ data, value, onChange, ...props }) => (
  <div className="btn-group" {...props}>
    {data?.map((item) => (
      <button
        key={item.value}
        className={`btn ${value === item.value ? 'btn-active' : ''}`}
        onClick={() => onChange?.(item.value)}
      >
        {item.label}
      </button>
    ))}
  </div>
);

export const Switch = ({ checked, onChange, ...props }) => (
  <input type="checkbox" className="toggle" checked={checked} onChange={onChange} {...props} />
);

export const Rating = ({ value, onChange, count = 5, ...props }) => (
  <div className="flex gap-1" {...props}>
    {Array.from({ length: count }).map((_, i) => (
      <button
        key={i}
        className={`text-2xl ${i < value ? 'text-yellow-400' : 'text-gray-300'}`}
        onClick={() => onChange?.(i + 1)}
      >
        ★
      </button>
    ))}
  </div>
);

export const RingProgress = ({ children, section, ...props }) => (
  <div className="ring-progress" {...props}>{children}</div>
);

export const Breadcrumbs = ({ children, ...props }) => (
  <nav className="breadcrumbs" {...props}>{children}</nav>
);

export const UnstyledButton = ({ children, onClick, ...props }) => (
  <button className="btn btn-ghost" onClick={onClick} {...props}>{children}</button>
);

export const LoadingOverlay = ({ visible = false, ...props }) => (
  visible && <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"><div className="loading"></div></div>
);

// Hooks
export const useDisclosure = (initialValue = false) => {
  const [value, setValue] = React.useState(initialValue);
  return {
    value,
    open: () => setValue(true),
    close: () => setValue(false),
    toggle: () => setValue(!value),
  };
};

export const useHotkeys = (keybinds) => {
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      for (const [keys, callback] of keybinds) {
        if (keys === e.key) {
          callback();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [keybinds]);
};

// Notifications (from @mantine/notifications)
export const Notifications = () => null;
export const notifications = {
  show: () => {},
  hide: () => {},
};

// Provider
export const MantineProvider = ({ children }) => <>{children}</>;
