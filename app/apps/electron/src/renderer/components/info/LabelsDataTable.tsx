/**
 * LabelsDataTable — hierarchical catalog (Craft).
 * Tree expand/collapse + optional whole-row select for settings editor.
 */

import * as React from 'react'
import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import type { ColumnDef, Row } from '@tanstack/react-table'
import { ChevronRight, Maximize2 } from 'lucide-react'
import { Info_DataTable, SortableHeader } from './Info_DataTable'
import { Info_Badge } from './Info_Badge'
import { DataTableOverlay } from '@craft-agent/ui'
import { LabelIcon } from '@/components/ui/label-icon'
import { cn } from '@/lib/utils'
import { useTheme } from '@/hooks/useTheme'
import type { LabelConfig } from '@craft-agent/shared/labels'
import { normalizeLabelKind } from '@craft-agent/shared/labels/kind-normalize'
import { getLocalizedLabelName } from '@/utils/label-display-name'

interface LabelsDataTableProps {
  data: LabelConfig[]
  searchable?: boolean
  maxHeight?: number
  fullscreen?: boolean
  fullscreenTitle?: string
  /** Settings: highlight + click to edit */
  selectedLabelId?: string | null
  onLabelSelect?: (labelId: string) => void
  /** Show kind column (functional / expert) */
  showPurposeColumn?: boolean
  className?: string
}

function ExpandableNameCell({
  row,
  t,
}: {
  row: Row<LabelConfig>
  t: TFunction
}) {
  const canExpand = row.getCanExpand()
  const isExpanded = row.getIsExpanded()
  const name = getLocalizedLabelName(t, row.original)

  return (
    <div
      className="flex items-center gap-1.5 p-1.5 pl-2.5"
      style={{ paddingLeft: `${row.depth * 16 + 10}px` }}
    >
      {canExpand ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            row.toggleExpanded()
          }}
          className="p-0.5 rounded hover:bg-foreground/5 transition-colors"
          aria-expanded={isExpanded}
        >
          <ChevronRight
            className={cn(
              'w-3 h-3 text-muted-foreground transition-transform duration-150',
              isExpanded && 'rotate-90',
            )}
          />
        </button>
      ) : (
        <span className="w-4 shrink-0" />
      )}
      <span className="min-w-0 truncate text-sm font-medium">{name}</span>
      <span className="shrink-0 font-mono text-[11px] text-muted-foreground/70">
        #{row.original.id}
      </span>
    </div>
  )
}

function getColumns(
  t: TFunction,
  showPurposeColumn: boolean,
): ColumnDef<LabelConfig>[] {
  const columns: ColumnDef<LabelConfig>[] = [
    {
      id: 'color',
      header: () => <span className="p-1.5 pl-2.5">{t('common.color')}</span>,
      cell: ({ row }) => (
        <div className="p-1.5 pl-2.5">
          <LabelIcon
            label={row.original}
            size="sm"
            hasChildren={!!row.original.children?.length}
          />
        </div>
      ),
      minSize: 56,
      maxSize: 56,
      enableSorting: false,
    },
    {
      id: 'name',
      header: ({ column }) => <SortableHeader column={column} title={t('common.name')} />,
      accessorFn: (row) => getLocalizedLabelName(t, row),
      cell: ({ row }) => <ExpandableNameCell row={row} t={t} />,
      meta: { fillWidth: true },
    },
  ]

  if (showPurposeColumn) {
    columns.push({
      id: 'kind',
      header: () => <span className="p-1.5 pl-2.5">{t('settings.expertKits.kindHeader')}</span>,
      // Never compare `kind` directly — `identity` is the legacy spelling of
      // `expert` and `kind-normalize` is the single place allowed to know it.
      accessorFn: (row) => normalizeLabelKind(row.kind),
      cell: ({ row }) => (
        <div className="p-1.5 pl-2.5">
          <Info_Badge color="muted" className="whitespace-nowrap">
            {normalizeLabelKind(row.original.kind) === 'expert'
              ? t('settings.expertKits.kindExpert')
              : t('settings.expertKits.kindFunctional')}
          </Info_Badge>
        </div>
      ),
      minSize: 96,
      enableSorting: false,
    })
  }

  columns.push({
    id: 'valueType',
    accessorKey: 'valueType',
    header: ({ column }) => <SortableHeader column={column} title={t('common.type')} />,
    cell: ({ row }) => (
      <div className="p-1.5 pl-2.5">
        {row.original.valueType ? (
          <Info_Badge color="muted" className="capitalize whitespace-nowrap">
            {t(`sidebar.labelValueType.${row.original.valueType}`)}
          </Info_Badge>
        ) : (
          <span className="text-muted-foreground/50 text-sm">—</span>
        )}
      </div>
    ),
    minSize: 100,
  })

  return columns
}

function getSubRows(row: LabelConfig): LabelConfig[] | undefined {
  return row.children?.length ? row.children : undefined
}

export function LabelsDataTable({
  data,
  searchable = false,
  maxHeight = 400,
  fullscreen = false,
  fullscreenTitle = 'Labels',
  selectedLabelId = null,
  onLabelSelect,
  showPurposeColumn = false,
  className,
}: LabelsDataTableProps) {
  const { t } = useTranslation()
  const [isFullscreen, setIsFullscreen] = useState(false)
  const { isDark } = useTheme()
  const columns = useMemo(
    () => getColumns(t, showPurposeColumn),
    [t, showPurposeColumn],
  )

  const fullscreenButton = fullscreen ? (
    <button
      type="button"
      onClick={() => setIsFullscreen(true)}
      className={cn(
        'p-1 rounded-[6px] transition-all',
        'opacity-0 group-hover:opacity-100',
        'bg-background/80 backdrop-blur-sm shadow-minimal',
        'text-muted-foreground/50 hover:text-foreground',
        'focus:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:opacity-100',
      )}
      title={t('table.viewFullscreen')}
    >
      <Maximize2 className="w-3.5 h-3.5" />
    </button>
  ) : undefined

  const countLabels = (items: LabelConfig[]): number =>
    items.reduce((sum, l) => sum + 1 + countLabels(l.children || []), 0)
  const totalCount = countLabels(data)

  const getRowClassName = onLabelSelect
    ? (row: LabelConfig) =>
        row.id === selectedLabelId ? 'bg-foreground/[0.07]' : undefined
    : undefined

  const onRowClick = onLabelSelect
    ? (row: LabelConfig) => onLabelSelect(row.id)
    : undefined

  return (
    <>
      <Info_DataTable
        columns={columns}
        data={data}
        searchable={searchable ? { placeholder: t('table.searchLabels') } : false}
        maxHeight={maxHeight}
        emptyContent={t('table.noLabelsConfigured')}
        floatingAction={fullscreenButton}
        className={cn(fullscreen && 'group', className)}
        getSubRows={getSubRows}
        getRowClassName={getRowClassName}
        onRowClick={onRowClick}
      />

      {fullscreen && (
        <DataTableOverlay
          isOpen={isFullscreen}
          onClose={() => setIsFullscreen(false)}
          title={fullscreenTitle}
          subtitle={t('table.labelCount', { count: totalCount })}
          theme={isDark ? 'dark' : 'light'}
        >
          <Info_DataTable
            columns={columns}
            data={data}
            searchable={searchable ? { placeholder: t('table.searchLabels') } : false}
            emptyContent={t('table.noLabelsConfigured')}
            getSubRows={getSubRows}
            getRowClassName={getRowClassName}
            onRowClick={onRowClick}
          />
        </DataTableOverlay>
      )}
    </>
  )
}
