/**
 * Ícones centralizados (ADR-003, regra da FRONTEND.md): um único módulo, sem SVG
 * inline espalhado pelos componentes. mdi-svg é tree-shakeable — só o que é
 * re-exportado aqui entra no bundle. Ícone novo entra aqui, não no componente.
 */
export {
  mdiShieldCheckOutline,
  mdiMenu,
  mdiDotsVertical,
  mdiAccount,
  mdiAccountPlusOutline,
  mdiArrowLeft,
  mdiArrowRight,
  mdiLoginVariant,
  mdiEyeOutline,
  mdiEyeOffOutline,
  mdiViewDashboardOutline,
  mdiFileDocumentOutline,
  mdiLogout,
  mdiChevronDoubleLeft,
  mdiChevronDoubleRight,
  mdiOfficeBuildingOutline,
  mdiMagnify,
  mdiPencilOutline,
  mdiPlus,
  mdiPower,
  mdiPowerOff,
  mdiRefresh,
} from '@mdi/js'
