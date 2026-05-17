import { useTranslation } from 'react-i18next'
import { Pencil, Trash2, UserPlus, ChevronLeft, ChevronRight, LoaderCircle } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { Checkbox } from '@renderer/components/ui/checkbox'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@renderer/components/ui/table'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger
} from '@renderer/components/ui/alert-dialog'
import type { ClassRule } from '@renderer/models/classRule'

interface RulesTableProps {
  rules: ClassRule[]
  page: number
  totalPages: number
  loading: boolean
  selectedIds: string[]
  onPageChange: (page: number) => void
  onSelectionChange: (ids: string[]) => void
  onEdit: (rule: ClassRule) => void
  onDelete: (id: string) => void
  onBulkDelete: (ids: string[]) => void
  onAddSubscriber: (rule: ClassRule) => void
  canEdit: boolean
  canDelete: boolean
  canManageSubscribers: boolean
}

export default function RulesTable({
  rules, page, totalPages, loading, selectedIds,
  onPageChange, onSelectionChange, onEdit, onDelete, onBulkDelete, onAddSubscriber,
  canEdit, canDelete, canManageSubscribers
}: RulesTableProps) {
  const { t } = useTranslation('classes')

  const allSelected = rules.length > 0 && rules.every((r) => selectedIds.includes(r.id!))
  const someSelected = rules.some((r) => selectedIds.includes(r.id!))

  const toggleAll = () => {
    if (allSelected) {
      onSelectionChange(selectedIds.filter((id) => !rules.some((r) => r.id === id)))
    } else {
      const newIds = rules.map((r) => r.id!).filter((id) => !selectedIds.includes(id))
      onSelectionChange([...selectedIds, ...newIds])
    }
  }

  const toggleRow = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((i) => i !== id))
    } else {
      onSelectionChange([...selectedIds, id])
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LoaderCircle className="h-10 w-10 animate-spin text-yellow-500" />
      </div>
    )
  }

  if (rules.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-lg text-gray-400">{t('rules.noRules')}</p>
        <p className="text-sm text-gray-500">{t('rules.noRulesHint')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {selectedIds.length > 0 && canDelete && (
        <div className="flex items-center justify-between rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-2">
          <p className="text-sm text-yellow-400">
            {selectedIds.length} {t('rules.selected')}
          </p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300">
                <Trash2 className="me-1.5 h-4 w-4" />
                {t('rules.actions.delete')}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('rules.bulkDeleteTitle')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('rules.bulkDeleteConfirm', { count: selectedIds.length })}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('rules.form.cancel')}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onBulkDelete(selectedIds)}
                  className="bg-red-600 text-white hover:bg-red-700"
                >
                  {t('rules.actions.delete')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-gray-700 bg-gray-800">
        <Table>
          <TableHeader>
            <TableRow>
              {canDelete && (
                <TableHead className="w-14">
                  <div className="px-4">
                    <Checkbox
                      checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                      onCheckedChange={toggleAll}
                    />
                  </div>
                </TableHead>
              )}
              <TableHead className="text-start">{t('rules.columns.name')}</TableHead>
              <TableHead className="text-start">{t('rules.columns.category')}</TableHead>
              <TableHead className="text-start">{t('rules.columns.coach')}</TableHead>
              <TableHead className="text-start">{t('rules.columns.days')}</TableHead>
              <TableHead className="text-start">{t('rules.columns.subscribers')}</TableHead>
              <TableHead className="text-end">{t('rules.columns.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rules.map((rule) => (
              <TableRow key={rule.id} className={selectedIds.includes(rule.id!) ? 'bg-gray-700/30' : ''}>
                {canDelete && (
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="px-4">
                      <Checkbox
                        checked={selectedIds.includes(rule.id!)}
                        onCheckedChange={() => toggleRow(rule.id!)}
                      />
                    </div>
                  </TableCell>
                )}
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: rule.color }}
                    />
                    <span className="font-medium text-white">{rule.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-gray-400">{rule.category}</TableCell>
                <TableCell className="text-gray-400">{rule.coachName}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {(rule.days ?? []).map((d) => (
                      <span
                        key={d}
                        className="rounded-full bg-gray-700 px-2 py-0.5 text-xs text-gray-300"
                      >
                        {t(`rules.days.${String(d)}`)}
                      </span>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-gray-400">{rule.subscriberCount ?? 0}</TableCell>
                <TableCell className="text-end" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1">
                    {canManageSubscribers && (
                      <Button
                        variant="ghost" size="icon"
                        onClick={() => onAddSubscriber(rule)}
                        title={t('rules.actions.addSubscriber')}
                      >
                        <UserPlus className="h-4 w-4" />
                      </Button>
                    )}
                    {canEdit && (
                      <Button
                        variant="ghost" size="icon"
                        onClick={() => onEdit(rule)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {canDelete && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4 text-red-400" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t('rules.actions.delete')}</AlertDialogTitle>
                            <AlertDialogDescription>{t('rules.deleteConfirm')}</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t('rules.form.cancel')}</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => onDelete(rule.id!)}
                              className="bg-red-600 text-white hover:bg-red-700"
                            >
                              {t('rules.actions.delete')}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-gray-400">
            {t('pagination.page')} {page} {t('pagination.of')} {totalPages}
          </p>
          <div className="flex gap-2 ltr:flex-row rtl:flex-row-reverse">
            <Button variant="primary" size="sm" onClick={() => onPageChange(page - 1)} disabled={page === 1}>
              <ChevronLeft className="h-4 w-4" />
              {t('pagination.previous')}
            </Button>
            <Button variant="primary" size="sm" onClick={() => onPageChange(page + 1)} disabled={page === totalPages}>
              <ChevronRight className="h-4 w-4" />
              {t('pagination.next')}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
