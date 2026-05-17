import { useTranslation } from 'react-i18next'
import { Button } from '@renderer/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@renderer/components/ui/table'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useSettings } from '@renderer/hooks/useSettings'
import type { ClassSubscriber } from '@renderer/models/classRule'

type SubscriberListItem = ClassSubscriber & {
  className: string
  category: string
  color: string
}

interface SubscribersTableProps {
  subscribers: SubscriberListItem[]
  page: number
  totalPages: number
  loading: boolean
  onPageChange: (page: number) => void
  onRowClick: (subscriber: SubscriberListItem) => void
}

export default function SubscribersTable({
  subscribers,
  page,
  totalPages,
  loading,
  onPageChange,
  onRowClick
}: SubscribersTableProps) {
  const { t } = useTranslation('classes')
  const { settings } = useSettings()

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat(settings?.language, {
      style: 'currency',
      currency: settings?.currency,
      minimumFractionDigits: 0
    }).format(value)

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString(settings?.language)
  }

  const formatPhone = (countryCode: string | undefined, phone: string | undefined) => {
    if (!phone) return '—'
    if (!countryCode) return phone
    return `${countryCode}${phone}`
  }

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-12 text-center">
        <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-gray-600 border-t-yellow-400" />
      </div>
    )
  }

  if (subscribers.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-12 text-center space-y-2">
        <p className="text-gray-300 font-medium">{t('subscribers.noSubscribers')}</p>
        <p className="text-gray-500 text-sm">{t('subscribers.noSubscribersHint')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-start">#</TableHead>
              <TableHead className="text-start">{t('subscribers.columns.member')}</TableHead>
              <TableHead className="text-start">{t('subscribers.columns.phone')}</TableHead>
              <TableHead className="text-start">{t('subscribers.columns.class')}</TableHead>
              <TableHead className="text-start">{t('subscribers.columns.amount')}</TableHead>
              <TableHead className="text-start">{t('subscribers.columns.date')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subscribers.map((sub, idx) => (
              <TableRow
                key={sub.id}
                className="cursor-pointer hover:bg-gray-700/50"
                onClick={() => onRowClick(sub)}
              >
                <TableCell className="font-medium text-gray-400">
                  {idx + 1 + (page - 1) * 10}
                </TableCell>
                <TableCell className="font-medium">{sub.memberName}</TableCell>
                <TableCell className="text-gray-400">
                  <span dir="ltr">{formatPhone(sub.memberCountryCode, sub.memberPhone)}</span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: sub.color }}
                    />
                    <span>{sub.className}</span>
                  </div>
                </TableCell>
                <TableCell className="text-gray-300">{formatCurrency(sub.amount)}</TableCell>
                <TableCell className="text-gray-400">
                  {formatDate(sub.createdAt ?? '')}
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
            <Button
              variant="primary"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              {t('pagination.previous')}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
              {t('pagination.next')}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
