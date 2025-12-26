import {
  FileText,
  Users,
  Building,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Clock,
  Send,
  Plus,
  Edit,
  Trash,
  Eye,
  Download,
  Briefcase,
  File,
  User,
  HelpCircle,
  Highlighter,
  MessageCircle,
  Mail,
  ArrowLeft,
  Pencil,
  Trash2,
  FileSearch,
  ClipboardCheck,
  LogOut,
  Settings,
  ChevronDown,
  LayoutDashboard,
  Activity,
  Search,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronUp,
  Check,
  Lock,
  RotateCcw,
  Columns,
  Rows,
  GripVertical,
  Wifi,
  WifiOff,
  CheckSquare,
  UserCheck,
  Award,
  Folder,
  Calendar,
  Star,
  RefreshCw,
} from 'lucide-react';

export const ENTITY_ICONS = {
  engagement: Briefcase,
  client: Building,
  user: User,
  message: MessageCircle,
  review: FileText,
  highlight: Highlighter,
  response: MessageSquare,
  rfi: HelpCircle,
  checklist: CheckCircle,
  team: Users,
  client_user: Users,
  file: File,
  email: Mail,
};

export const STATUS_ICONS = {
  pending: Clock,
  active: CheckCircle,
  completed: CheckCircle,
  cancelled: AlertCircle,
  open: AlertCircle,
  closed: CheckCircle,
  archived: File,
  resolved: Check,
  unresolved: AlertCircle,
};

export const ACTION_ICONS = {
  create: Plus,
  edit: Pencil,
  delete: Trash2,
  view: Eye,
  download: Download,
  back: ArrowLeft,
  send: Send,
  search: FileSearch,
  checklist: ClipboardCheck,
  logout: LogOut,
  settings: Settings,
  dashboard: LayoutDashboard,
  activity: Activity,
  lock: Lock,
  reopen: RotateCcw,
  wifi: Wifi,
  wifiOff: WifiOff,
  check: Check,
};

export const NAVIGATION_ICONS = {
  chevronDown: ChevronDown,
  chevronUp: ChevronUp,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  arrowLeft: ArrowLeft,
};

export const UI_ICONS = {
  search: Search,
  zoomIn: ZoomIn,
  zoomOut: ZoomOut,
  messageSquare: MessageSquare,
  check: Check,
  plus: Plus,
  file: File,
  columns: Columns,
  rows: Rows,
  gripVertical: GripVertical,
  users: Users,
  calendar: Calendar,
  star: Star,
  refresh: RefreshCw,
};

export function getEntityIcon(entityName) {
  return ENTITY_ICONS[entityName] || File;
}

export function getStatusIcon(status) {
  return STATUS_ICONS[status] || Clock;
}

export function getActionIcon(action) {
  return ACTION_ICONS[action] || FileText;
}

export function getNavigationIcon(icon) {
  return NAVIGATION_ICONS[icon] || ChevronRight;
}

export function getUIIcon(icon) {
  return UI_ICONS[icon] || File;
}

const COMPONENT_NAMES = {
  FileText,
  Users,
  Building,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Clock,
  Send,
  Plus,
  Edit,
  Trash,
  Eye,
  Download,
  Briefcase,
  File,
  User,
  HelpCircle,
  Highlighter,
  MessageCircle,
  Mail,
  ArrowLeft,
  Pencil,
  Trash2,
  FileSearch,
  ClipboardCheck,
  LogOut,
  Settings,
  ChevronDown,
  LayoutDashboard,
  Activity,
  Search,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronUp,
  Check,
  Lock,
  RotateCcw,
  Columns,
  Rows,
  GripVertical,
  Wifi,
  WifiOff,
  CheckSquare,
  UserCheck,
  Award,
  Folder,
  Calendar,
  Star,
  RefreshCw,
};

export const Icons = {
  ...ENTITY_ICONS,
  ...STATUS_ICONS,
  ...ACTION_ICONS,
  ...NAVIGATION_ICONS,
  ...UI_ICONS,
  ...COMPONENT_NAMES,
};
