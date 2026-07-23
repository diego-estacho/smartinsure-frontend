/**
 * Ícones centralizados (ADR-003, FRONTEND §Ícones): um único módulo, sem SVG inline
 * espalhado pelos componentes. Set: **Lucide** (`lucide-vue-next`, ADR-021) — o traço da
 * marca do Design System. Ícone novo entra aqui (chave em inglês → componente Lucide) e no
 * de-para (docs/design-system-map.md).
 *
 * Importamos cada ícone por **subpath** (`dist/esm/icons/<nome>`), não pelo barril
 * `lucide-vue-next`: o barril traz 1000+ ícones num único .d.ts e inflava o grafo de tipos a
 * ponto de estourar o tsc (TS2321) na tipagem de rotas do `$fetch`. Os subpaths são tipados
 * leves pelo shim em `app/types/lucide-vue-next.d.ts`. Também é o melhor tree-shaking.
 *
 * O `SiIcon` e o set customizado do Vuetify (app/plugins/vuetify-icons.ts) resolvem o ícone
 * por essa chave; os `$`-internos do Vuetify são remapeados por `aliases` no mesmo plugin.
 */
import ShieldCheck from 'lucide-vue-next/dist/esm/icons/shield-check'
import Menu from 'lucide-vue-next/dist/esm/icons/menu'
import Building2 from 'lucide-vue-next/dist/esm/icons/building-2'
import Building from 'lucide-vue-next/dist/esm/icons/building'
import EllipsisVertical from 'lucide-vue-next/dist/esm/icons/ellipsis-vertical'
import Ellipsis from 'lucide-vue-next/dist/esm/icons/ellipsis'
import User from 'lucide-vue-next/dist/esm/icons/user'
import UserPlus from 'lucide-vue-next/dist/esm/icons/user-plus'
import Lock from 'lucide-vue-next/dist/esm/icons/lock'
import ArrowLeft from 'lucide-vue-next/dist/esm/icons/arrow-left'
import ArrowRight from 'lucide-vue-next/dist/esm/icons/arrow-right'
import ArrowUp from 'lucide-vue-next/dist/esm/icons/arrow-up'
import ArrowDown from 'lucide-vue-next/dist/esm/icons/arrow-down'
import LogIn from 'lucide-vue-next/dist/esm/icons/log-in'
import LogOut from 'lucide-vue-next/dist/esm/icons/log-out'
import Eye from 'lucide-vue-next/dist/esm/icons/eye'
import EyeOff from 'lucide-vue-next/dist/esm/icons/eye-off'
import LayoutDashboard from 'lucide-vue-next/dist/esm/icons/layout-dashboard'
import FileText from 'lucide-vue-next/dist/esm/icons/file-text'
import TrendingUp from 'lucide-vue-next/dist/esm/icons/trending-up'
import TrendingDown from 'lucide-vue-next/dist/esm/icons/trending-down'
import Funnel from 'lucide-vue-next/dist/esm/icons/funnel'
import Check from 'lucide-vue-next/dist/esm/icons/check'
import Clock from 'lucide-vue-next/dist/esm/icons/clock'
import Repeat from 'lucide-vue-next/dist/esm/icons/repeat'
import X from 'lucide-vue-next/dist/esm/icons/x'
import Bell from 'lucide-vue-next/dist/esm/icons/bell'
import CircleQuestionMark from 'lucide-vue-next/dist/esm/icons/circle-question-mark'
import ChevronsLeft from 'lucide-vue-next/dist/esm/icons/chevrons-left'
import ChevronsRight from 'lucide-vue-next/dist/esm/icons/chevrons-right'
import ChevronsUpDown from 'lucide-vue-next/dist/esm/icons/chevrons-up-down'
import ChevronDown from 'lucide-vue-next/dist/esm/icons/chevron-down'
import ChevronUp from 'lucide-vue-next/dist/esm/icons/chevron-up'
import ChevronLeft from 'lucide-vue-next/dist/esm/icons/chevron-left'
import ChevronRight from 'lucide-vue-next/dist/esm/icons/chevron-right'
import Search from 'lucide-vue-next/dist/esm/icons/search'
import Pencil from 'lucide-vue-next/dist/esm/icons/pencil'
import Plus from 'lucide-vue-next/dist/esm/icons/plus'
import Minus from 'lucide-vue-next/dist/esm/icons/minus'
import Power from 'lucide-vue-next/dist/esm/icons/power'
import PowerOff from 'lucide-vue-next/dist/esm/icons/power-off'
import RefreshCw from 'lucide-vue-next/dist/esm/icons/refresh-cw'
import Trash2 from 'lucide-vue-next/dist/esm/icons/trash-2'
import Download from 'lucide-vue-next/dist/esm/icons/download'
import CalendarDays from 'lucide-vue-next/dist/esm/icons/calendar-days'
import Info from 'lucide-vue-next/dist/esm/icons/info'
import CircleCheck from 'lucide-vue-next/dist/esm/icons/circle-check'
import TriangleAlert from 'lucide-vue-next/dist/esm/icons/triangle-alert'
import CircleX from 'lucide-vue-next/dist/esm/icons/circle-x'
import SquareCheckBig from 'lucide-vue-next/dist/esm/icons/square-check-big'
import Square from 'lucide-vue-next/dist/esm/icons/square'
import SquareMinus from 'lucide-vue-next/dist/esm/icons/square-minus'
import Circle from 'lucide-vue-next/dist/esm/icons/circle'
import CircleDot from 'lucide-vue-next/dist/esm/icons/circle-dot'
import Paperclip from 'lucide-vue-next/dist/esm/icons/paperclip'
import Upload from 'lucide-vue-next/dist/esm/icons/upload'
import Users from 'lucide-vue-next/dist/esm/icons/users'
import UserRound from 'lucide-vue-next/dist/esm/icons/user-round'
import KeyRound from 'lucide-vue-next/dist/esm/icons/key-round'
import Settings from 'lucide-vue-next/dist/esm/icons/settings'
import ChartColumn from 'lucide-vue-next/dist/esm/icons/chart-column'

/**
 * Registry: chave estável (inglês) → componente Lucide. Fonte única consumida pelo `SiIcon`
 * e pelo set do Vuetify.
 */
export const appIcons = {
  // ── Ícones usados nas telas ───────────────────────────────────────────
  shieldCheck: ShieldCheck,
  menu: Menu,
  building: Building2,
  domain: Building,
  dotsVertical: EllipsisVertical,
  dotsHorizontal: Ellipsis,
  user: User,
  userPlus: UserPlus,
  users: Users,
  userRound: UserRound,
  keyRound: KeyRound,
  settings: Settings,
  barChart: ChartColumn,
  lock: Lock,
  arrowLeft: ArrowLeft,
  arrowRight: ArrowRight,
  logIn: LogIn,
  logOut: LogOut,
  eye: Eye,
  eyeOff: EyeOff,
  dashboard: LayoutDashboard,
  fileText: FileText,
  trendingUp: TrendingUp,
  trendingDown: TrendingDown,
  filter: Funnel,
  clock: Clock,
  repeat: Repeat,
  bell: Bell,
  helpCircle: CircleQuestionMark,
  search: Search,
  pencil: Pencil,
  plus: Plus,
  power: Power,
  powerOff: PowerOff,
  refresh: RefreshCw,
  trash: Trash2,
  download: Download,
  calendar: CalendarDays,

  // ── Alvos de aliases internos do Vuetify + primitivos de forma ────────
  check: Check,
  close: X,
  chevronDown: ChevronDown,
  chevronUp: ChevronUp,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  chevronsLeft: ChevronsLeft,
  chevronsRight: ChevronsRight,
  unfold: ChevronsUpDown,
  arrowUp: ArrowUp,
  arrowDown: ArrowDown,
  minus: Minus,
  info: Info,
  circleCheck: CircleCheck,
  alertTriangle: TriangleAlert,
  circleX: CircleX,
  squareCheck: SquareCheckBig,
  square: Square,
  squareMinus: SquareMinus,
  circle: Circle,
  circleDot: CircleDot,
  paperclip: Paperclip,
  upload: Upload,
}

/** Nome de ícone válido — use para tipar props/campos que carregam um ícone. */
export type AppIconName = keyof typeof appIcons
