import React from 'react';

const getGapClass = (gap) => {
  const map = {
    xs: 'gap-1',
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
  };
  return map[gap] || 'gap-4';
};

const getPaddingClass = (padding) => {
  const map = {
    xs: 'p-1',
    sm: 'p-2',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8',
  };
  return map[padding] || 'p-4';
};

export const Stack = ({ children, gap = 'md', className = '', style = {}, ...props }) => (
  <div className={`flex flex-col ${getGapClass(gap)} ${className}`} style={style} {...props}>
    {children}
  </div>
);

export const Group = ({ children, gap = 'sm', justify = 'flex-start', className = '', style = {}, ...props }) => {
  const justifyClass = {
    'flex-start': 'justify-start',
    'center': 'justify-center',
    'flex-end': 'justify-end',
    'space-between': 'justify-between',
    'space-around': 'justify-around',
  }[justify] || 'justify-start';

  return (
    <div className={`flex flex-row items-center ${getGapClass(gap)} ${justifyClass} ${className}`} style={style} {...props}>
      {children}
    </div>
  );
};

export const Box = ({ children, className = '', style = {}, p, ...props }) => (
  <div className={`${p ? getPaddingClass(p) : ''} ${className}`} style={style} {...props}>
    {children}
  </div>
);

export const Paper = ({ children, p = 'md', withBorder = false, className = '', style = {}, ...props }) => (
  <div className={`card ${getPaddingClass(p)} ${withBorder ? 'border border-gray-300' : ''} ${className}`} style={style} {...props}>
    {children}
  </div>
);

export const SimpleGrid = ({ children, cols = 2, gap = 'md', className = '', style = {}, ...props }) => (
  <div className={`grid grid-cols-${cols} ${getGapClass(gap)} ${className}`} style={style} {...props}>
    {children}
  </div>
);

export const Grid = ({ children, gutter = 'md', className = '', style = {}, ...props }) => (
  <div className={`grid ${getGapClass(gutter)} ${className}`} style={style} {...props}>
    {children}
  </div>
);

export const Grid_Col = ({ children, span = 12, className = '', style = {}, ...props }) => (
  <div className={`col-span-${span?.base || span || 12} ${className}`} style={style} {...props}>
    {children}
  </div>
);

Grid.Col = Grid_Col;

export const Container = ({ children, className = '', style = {}, ...props }) => (
  <div className={`container mx-auto px-4 ${className}`} style={style} {...props}>
    {children}
  </div>
);

export const Text = ({ children, size = 'md', c, fw, className = '', style = {}, component = 'span', ...props }) => {
  const sizeClass = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  }[size] || 'text-base';

  const colorClass = c === 'dimmed' ? 'text-gray-500' : c === 'red' ? 'text-red-600' : c === 'green' ? 'text-green-600' : c === 'blue' ? 'text-blue-600' : '';

  const fontWeightClass = {
    400: '',
    500: 'font-medium',
    600: 'font-semibold',
    700: 'font-bold',
  }[fw] || '';

  const Component = component;
  return <Component className={`${sizeClass} ${colorClass} ${fontWeightClass} ${className}`} style={style} {...props}>{children}</Component>;
};

export const Title = ({ children, order = 1, className = '', style = {}, ...props }) => {
  const tags = { 1: 'h1', 2: 'h2', 3: 'h3', 4: 'h4', 5: 'h5', 6: 'h6' };
  const sizeClasses = {
    1: 'text-4xl font-bold',
    2: 'text-3xl font-bold',
    3: 'text-2xl font-bold',
    4: 'text-xl font-semibold',
    5: 'text-lg font-semibold',
    6: 'text-base font-semibold',
  };
  const Tag = tags[order] || 'h1';
  return <Tag className={`${sizeClasses[order] || 'text-4xl font-bold'} ${className}`} style={style} {...props}>{children}</Tag>;
};

export const Code = ({ children, className = '', style = {}, ...props }) => (
  <code className={`bg-gray-100 px-2 py-1 rounded font-mono text-sm ${className}`} style={style} {...props}>{children}</code>
);

export const Button = ({ 
  children, 
  variant = 'filled', 
  size = 'sm', 
  color,
  loading,
  disabled,
  leftSection,
  rightSection,
  className = '',
  style = {},
  fullWidth = false,
  ...props 
}) => {
  const variants = {
    filled: 'btn-primary',
    outline: 'btn-outline',
    subtle: 'btn-ghost',
    default: 'btn',
    light: 'btn-ghost',
  };

  const sizes = {
    xs: 'btn-xs',
    sm: 'btn-sm',
    md: 'btn-md',
    lg: 'btn-lg',
    xl: 'btn-xl',
  };

  const colors = {
    red: 'btn-error',
    green: 'btn-success',
    blue: 'btn-primary',
    gray: 'btn-ghost',
    yellow: 'btn-warning',
  };

  const variantClass = variants[variant] || 'btn-primary';
  const sizeClass = sizes[size] || 'btn-sm';
  const colorClass = color ? (colors[color] || '') : '';
  const widthClass = fullWidth ? 'w-full' : '';
  const disabledClass = disabled ? 'btn-disabled' : '';

  return (
    <button 
      className={`btn ${variantClass} ${sizeClass} ${colorClass} ${widthClass} ${disabledClass} ${className}`}
      disabled={disabled || loading}
      style={style}
      {...props}
    >
      <span className="flex items-center gap-2">
        {leftSection && <span className="flex items-center">{leftSection}</span>}
        {loading ? <span className="loading loading-spinner loading-sm"></span> : children}
        {rightSection && <span className="flex items-center">{rightSection}</span>}
      </span>
    </button>
  );
};

export const ActionIcon = ({ children, variant = 'default', color, onClick, size = 'md', className = '', style = {}, ...props }) => {
  const sizeClass = {
    xs: 'btn-xs',
    sm: 'btn-sm',
    md: 'btn-md',
    lg: 'btn-lg',
  }[size] || 'btn-md';

  const colorClass = {
    red: 'btn-error',
    green: 'btn-success',
    blue: 'btn-primary',
  }[color] || '';

  return (
    <button
      className={`btn ${sizeClass} btn-ghost ${colorClass} ${className}`}
      onClick={onClick}
      style={style}
      {...props}
    >
      {children}
    </button>
  );
};

export const UnstyledButton = ({ children, onClick, className = '', style = {}, ...props }) => (
  <button className={`btn btn-ghost no-animation ${className}`} onClick={onClick} style={style} {...props}>{children}</button>
);

export const TextInput = ({ 
  value, 
  onChange, 
  placeholder, 
  disabled, 
  className = '',
  style = {},
  label,
  error,
  ...props 
}) => (
  <div className="form-control w-full">
    {label && <label className="label"><span className="label-text">{label}</span></label>}
    <input 
      type="text" 
      className={`input input-bordered w-full ${error ? 'input-error' : ''} ${className}`}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      style={style}
      {...props}
    />
    {error && <label className="label"><span className="label-text-alt text-error">{error}</span></label>}
  </div>
);

export const NumberInput = ({ 
  value, 
  onChange, 
  placeholder, 
  disabled, 
  className = '',
  style = {},
  label,
  error,
  ...props 
}) => (
  <div className="form-control w-full">
    {label && <label className="label"><span className="label-text">{label}</span></label>}
    <input 
      type="number" 
      className={`input input-bordered w-full ${error ? 'input-error' : ''} ${className}`}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      style={style}
      {...props}
    />
    {error && <label className="label"><span className="label-text-alt text-error">{error}</span></label>}
  </div>
);

export const PasswordInput = ({ 
  value, 
  onChange, 
  placeholder, 
  disabled, 
  className = '',
  style = {},
  label,
  error,
  ...props 
}) => (
  <div className="form-control w-full">
    {label && <label className="label"><span className="label-text">{label}</span></label>}
    <input 
      type="password" 
      className={`input input-bordered w-full ${error ? 'input-error' : ''} ${className}`}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      style={style}
      {...props}
    />
    {error && <label className="label"><span className="label-text-alt text-error">{error}</span></label>}
  </div>
);

export const Textarea = ({ 
  value, 
  onChange, 
  placeholder, 
  disabled, 
  className = '',
  style = {},
  label,
  error,
  ...props 
}) => (
  <div className="form-control w-full">
    {label && <label className="label"><span className="label-text">{label}</span></label>}
    <textarea 
      className={`textarea textarea-bordered w-full ${error ? 'textarea-error' : ''} ${className}`}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      style={style}
      {...props}
    />
    {error && <label className="label"><span className="label-text-alt text-error">{error}</span></label>}
  </div>
);

export const Select = ({ 
  value, 
  onChange, 
  data, 
  placeholder, 
  disabled, 
  className = '',
  style = {},
  label,
  error,
  ...props 
}) => (
  <div className="form-control w-full">
    {label && <label className="label"><span className="label-text">{label}</span></label>}
    <select 
      className={`select select-bordered w-full ${error ? 'select-error' : ''} ${className}`}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      disabled={disabled}
      style={style}
      {...props}
    >
      <option value="">{placeholder}</option>
      {data?.map((item) => (
        <option key={item.value} value={item.value}>{item.label}</option>
      ))}
    </select>
    {error && <label className="label"><span className="label-text-alt text-error">{error}</span></label>}
  </div>
);

export const MultiSelect = ({ 
  data, 
  value, 
  onChange, 
  placeholder, 
  searchable, 
  className = '',
  style = {},
  ...props 
}) => (
  <select 
    multiple 
    className={`select select-bordered w-full ${className}`}
    value={value || []}
    onChange={(e) => onChange?.(Array.from(e.target.selectedOptions, option => option.value))}
    style={style}
    {...props}
  >
    <option value="">{placeholder}</option>
    {data?.map((item) => (
      <option key={item.value} value={item.value}>{item.label}</option>
    ))}
  </select>
);

export const Checkbox = ({ checked, onChange, label, className = '', style = {}, ...props }) => (
  <div className="form-control">
    <label className="label cursor-pointer">
      <input 
        type="checkbox" 
        className={`checkbox ${className}`}
        checked={checked}
        onChange={onChange}
        style={style}
        {...props}
      />
      {label && <span className="label-text">{label}</span>}
    </label>
  </div>
);

export const Radio = ({ checked, onChange, label, value, className = '', style = {}, ...props }) => (
  <div className="form-control">
    <label className="label cursor-pointer">
      <input 
        type="radio" 
        className={`radio ${className}`}
        checked={checked}
        onChange={onChange}
        value={value}
        style={style}
        {...props}
      />
      {label && <span className="label-text">{label}</span>}
    </label>
  </div>
);

export const Switch = ({ checked, onChange, label, className = '', style = {}, ...props }) => (
  <div className="form-control">
    <label className="label cursor-pointer">
      <input 
        type="checkbox" 
        className={`toggle ${className}`}
        checked={checked}
        onChange={onChange}
        style={style}
        {...props}
      />
      {label && <span className="label-text">{label}</span>}
    </label>
  </div>
);

export const FileInput = ({ onChange, multiple, className = '', style = {}, ...props }) => (
  <input 
    type="file" 
    className={`file-input file-input-bordered w-full ${className}`}
    onChange={onChange}
    multiple={multiple}
    style={style}
    {...props}
  />
);

export const Input = ({ className = '', style = {}, ...props }) => (
  <input 
    className={`input input-bordered w-full ${className}`}
    style={style}
    {...props}
  />
);

export const Alert = ({ children, color = 'blue', title, onClose, icon, className = '', style = {}, ...props }) => {
  const colors = {
    red: 'alert-error',
    error: 'alert-error',
    green: 'alert-success',
    success: 'alert-success',
    blue: 'alert-info',
    info: 'alert-info',
    yellow: 'alert-warning',
    warning: 'alert-warning',
  };

  return (
    <div className={`alert ${colors[color] || 'alert-info'} ${className}`} style={style} {...props}>
      <div className="flex justify-between items-start gap-2">
        <div className="flex gap-2">
          {icon && <span className="flex-shrink-0">{icon}</span>}
          <div>
            {title && <h3 className="font-semibold">{title}</h3>}
            {children}
          </div>
        </div>
        {onClose && <button onClick={onClose} className="text-lg flex-shrink-0">&times;</button>}
      </div>
    </div>
  );
};

export const Badge = ({ children, color, variant = 'filled', size = 'md', className = '', style = {}, ...props }) => {
  const colors = {
    red: 'badge-error',
    green: 'badge-success',
    blue: 'badge-primary',
    gray: 'badge-neutral',
    yellow: 'badge-warning',
  };

  const variants = {
    filled: colors[color] || 'badge-primary',
    outline: `badge-outline ${colors[color] || 'badge-primary'}`,
    light: `badge-outline`,
  };

  const sizes = {
    xs: 'badge-sm',
    sm: 'badge-md',
    md: 'badge-lg',
    lg: 'badge-xl',
  };

  return (
    <span className={`badge ${variants[variant] || variants.filled} ${sizes[size] || 'badge-md'} ${className}`} style={style} {...props}>
      {children}
    </span>
  );
};

export const Loader = ({ size = 'md', className = '', style = {}, ...props }) => {
  const sizes = {
    xs: 'loading-xs',
    sm: 'loading-sm',
    md: 'loading-md',
    lg: 'loading-lg',
  };
  return (
    <div className={`loading loading-spinner ${sizes[size] || 'loading-md'} ${className}`} style={style} {...props}></div>
  );
};

export const Progress = ({ value, color = 'blue', className = '', style = {}, ...props }) => {
  const colors = {
    green: 'progress-success',
    blue: 'progress-primary',
    red: 'progress-error',
    yellow: 'progress-warning',
  };

  return (
    <progress 
      className={`progress w-full ${colors[color] || 'progress-primary'} ${className}`}
      value={value}
      max="100"
      style={style}
      {...props}
    ></progress>
  );
};

export const Skeleton = ({ height = 100, width = '100%', className = '', style = {}, ...props }) => (
  <div 
    className={`bg-gray-300 rounded-md animate-pulse ${className}`}
    style={{ height: `${height}px`, width, ...style }}
    {...props}
  />
);

export const RingProgress = ({ children, section, ...props }) => (
  <div className="radial-progress" {...props}>{children}</div>
);

export const Modal = ({ opened, onClose, title, children, centered = true, className = '', style = {}, ...props }) => {
  if (!opened) return null;
  
  return (
    <div className="modal modal-open">
      <div className={`modal-box ${className}`} style={style} {...props}>
        {title && (
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg">{title}</h3>
            <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost">✕</button>
          </div>
        )}
        {!title && <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>}
        <div className="py-4">{children}</div>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
};

export const Popover = ({ children, position = 'bottom', withArrow = false, className = '', style = {}, ...props }) => (
  <div className={`dropdown ${className}`} style={style} {...props}>{children}</div>
);

export const Popover_Target = ({ children }) => (
  <div className="dropdown-toggle">{children}</div>
);
Popover.Target = Popover_Target;

export const Popover_Dropdown = ({ children, p = 'md', className = '', style = {}, ...props }) => {
  const paddingClass = {
    'xs': 'p-1',
    'sm': 'p-2',
    'md': 'p-4',
    'lg': 'p-6',
    'xl': 'p-8',
  }[p] || 'p-4';
  
  return (
    <ul className={`dropdown-content menu shadow bg-base-100 rounded-box z-[1] ${paddingClass} ${className}`} style={style} {...props}>
      {children}
    </ul>
  );
};
Popover.Dropdown = Popover_Dropdown;

export const Table = ({ children, className = '', style = {}, striped = false, ...props }) => (
  <table className={`table table-zebra ${className}`} style={style} {...props}>{children}</table>
);

Table.Thead = ({ children }) => <thead>{children}</thead>;
Table.Tbody = ({ children }) => <tbody>{children}</tbody>;
Table.Tr = ({ children }) => <tr>{children}</tr>;
Table.Th = ({ children }) => <th>{children}</th>;
Table.Td = ({ children }) => <td>{children}</td>;

export const Breadcrumbs = ({ children, className = '', style = {}, ...props }) => (
  <nav className={`breadcrumbs text-sm ${className}`} style={style} {...props}>
    <ul>{children}</ul>
  </nav>
);

export const Tabs = ({ value, onTabChange, children, className = '', style = {}, ...props }) => (
  <div className={`tabs tabs-bordered ${className}`} style={style} {...props}>
    {React.Children.map(children, (child) => {
      if (!React.isValidElement(child)) return child;
      return React.cloneElement(child, { activeTab: value, onTabChange });
    })}
  </div>
);

export const Tabs_List = ({ children }) => <div className="tabs-list flex">{children}</div>;
Tabs.List = Tabs_List;

export const Tabs_Tab = ({ value, children, activeTab, onTabChange, ...props }) => (
  <a 
    className={`tab ${activeTab === value ? 'tab-active' : ''}`}
    onClick={() => onTabChange?.(value)}
    {...props}
  >
    {children}
  </a>
);
Tabs.Tab = Tabs_Tab;

export const Tabs_Panel = ({ value, children, activeTab, ...props }) => (
  activeTab === value ? <div className="tab-content p-4" {...props}>{children}</div> : null
);
Tabs.Panel = Tabs_Panel;

export const NavLink = ({ children, label, active, onClick, className = '', style = {}, ...props }) => (
  <li>
    <a 
      className={`menu-item ${active ? 'active' : ''} ${className}`}
      onClick={onClick}
      style={style}
      {...props}
    >
      {label || children}
    </a>
  </li>
);

export const ScrollArea = ({ children, className = '', style = {}, ...props }) => (
  <div className={`overflow-y-auto ${className}`} style={style} {...props}>{children}</div>
);

export const Avatar = ({ src, alt, color, size = 'md', name, className = '', style = {}, ...props }) => {
  const sizes = {
    xs: 'avatar-xs',
    sm: 'avatar-sm',
    md: 'avatar-md',
    lg: 'avatar-lg',
    xl: 'avatar-xl',
  };

  return (
    <div className={`avatar ${sizes[size] || 'avatar-md'} ${className}`} {...props}>
      <div className="w-12 h-12 rounded-full">
        {src ? <img src={src} alt={alt || name} /> : <span className="text-center text-white font-bold">{name?.charAt(0)}</span>}
      </div>
    </div>
  );
};

export const ThemeIcon = ({ children, size = 'md', color, variant = 'default', className = '', style = {}, ...props }) => {
  const sizes = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  return (
    <div className={`flex items-center justify-center ${sizes[size] || 'w-10 h-10'} rounded-full ${className}`} style={style} {...props}>
      {children}
    </div>
  );
};

export const Center = ({ children, className = '', style = {}, ...props }) => (
  <div className={`flex items-center justify-center ${className}`} style={style} {...props}>{children}</div>
);

export const Divider = ({ className = '', style = {}, ...props }) => (
  <hr className={`border-gray-300 ${className}`} style={style} {...props} />
);

export const Card = ({ children, className = '', style = {}, ...props }) => (
  <div className={`card bg-base-100 shadow-xl ${className}`} style={style} {...props}>
    <div className="card-body">{children}</div>
  </div>
);

export const Tooltip = ({ label, children, className = '', style = {}, position = 'top', ...props }) => (
  <div className={`tooltip tooltip-${position}`} data-tip={label} style={style} {...props}>{children}</div>
);

export const Menu = ({ children, shadow = 'md', position = 'bottom', className = '', style = {}, ...props }) => (
  <div className={`dropdown ${className}`} style={style} {...props}>{children}</div>
);

export const Menu_Target = ({ children }) => (
  <div className="dropdown-toggle">{children}</div>
);
Menu.Target = Menu_Target;

export const Menu_Dropdown = ({ children, className = '', style = {}, ...props }) => (
  <ul className={`dropdown-content menu p-2 shadow bg-base-100 rounded-box z-[1] w-52 ${className}`} style={style} {...props}>
    {children}
  </ul>
);
Menu.Dropdown = Menu_Dropdown;

export const Menu_Item = ({ children, onClick, color, className = '', style = {}, ...props }) => (
  <li className={className} style={style} {...props}>
    <a onClick={onClick} className={color === 'red' ? 'text-error' : ''}>
      {children}
    </a>
  </li>
);
Menu.Item = Menu_Item;

export const SegmentedControl = ({ data, value, onChange, className = '', style = {}, ...props }) => (
  <div className={`btn-group ${className}`} style={style} {...props}>
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

export const Rating = ({ value, onChange, count = 5, className = '', style = {}, ...props }) => (
  <div className={`flex gap-1 ${className}`} style={style} {...props}>
    {Array.from({ length: count }).map((_, i) => (
      <button
        key={i}
        className={`text-2xl ${i < value ? 'text-yellow-400' : 'text-gray-300'} cursor-pointer`}
        onClick={() => onChange?.(i + 1)}
      >
        ★
      </button>
    ))}
  </div>
);

export const Pagination = ({ total, value, onChange, className = '', style = {}, ...props }) => (
  <div className={`join ${className}`} style={style} {...props}>
    {Array.from({ length: total }).map((_, i) => (
      <button
        key={i}
        className={`join-item btn ${value === i + 1 ? 'btn-active' : ''}`}
        onClick={() => onChange?.(i + 1)}
      >
        {i + 1}
      </button>
    ))}
  </div>
);

export const AppShell = ({ children, header, navbar, footer, className = '', style = {}, ...props }) => (
  <div className={`h-screen flex flex-col ${className}`} style={style} {...props}>
    {header && <header className="navbar bg-base-100 shadow-lg">{header}</header>}
    <div className="flex flex-1 overflow-hidden">
      {navbar && <nav className="bg-base-200 w-64 overflow-y-auto">{navbar}</nav>}
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
    {footer && <footer className="footer bg-base-200 p-4">{footer}</footer>}
  </div>
);

export const Burger = ({ opened, onClick, size = 'md', className = '', style = {}, ...props }) => (
  <button 
    className={`btn btn-ghost btn-circle ${className}`}
    onClick={onClick}
    style={style}
    {...props}
  >
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={opened ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
    </svg>
  </button>
);

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
        const keyArray = Array.isArray(keys) ? keys : [keys];
        if (keyArray.includes(e.key) || keyArray.includes(e.code)) {
          callback();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [keybinds]);
};

let toastQueue = [];
let toastRender = null;

export const Notifications = () => {
  const [toasts, setToasts] = React.useState([]);

  React.useEffect(() => {
    toastRender = setToasts;
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.map((toast, idx) => (
        <div key={idx} className={`alert alert-${toast.color || 'info'} shadow-lg`}>
          <div className="flex-1">
            {toast.title && <h3 className="font-bold">{toast.title}</h3>}
            {toast.message}
          </div>
          <button onClick={() => setToasts(t => t.filter((_, i) => i !== idx))} className="btn btn-sm btn-ghost">✕</button>
        </div>
      ))}
    </div>
  );
};

export const notifications = {
  show: (options) => {
    const { message, title, color = 'info', autoClose = 3000 } = options;
    const id = Date.now();
    toastQueue.push({ message, title, color, id });
    
    if (toastRender) {
      toastRender(toastQueue);
      
      if (autoClose) {
        setTimeout(() => {
          toastQueue = toastQueue.filter(t => t.id !== id);
          toastRender?.(toastQueue);
        }, autoClose);
      }
    }
  },
  hide: (id) => {
    toastQueue = toastQueue.filter(t => t.id !== id);
    toastRender?.(toastQueue);
  },
};

export const MantineProvider = ({ children }) => <>{children}</>;

export const Image = ({ src, alt, className = '', style = {}, ...props }) => (
  <img src={src} alt={alt} className={className} style={style} {...props} />
);

export const ColorSchemeScript = () => null;
