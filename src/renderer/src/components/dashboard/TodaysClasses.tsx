import { memo, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@renderer/components/ui/button'
import { CalendarDays, ChevronLeft, ChevronRight, Clock, Eye, RefreshCcw, Users } from 'lucide-react'
import type { ClassInstance } from '@renderer/models/classRule'
import InstanceDetailModal from '@renderer/components/classes/schedule/InstanceDetailModal'

interface TodaysClassesProps {
  data: ClassInstance[]
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

function formatTime(time: string, locale: string): string {
  const [h, m] = time.split(':').map(Number)
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' }).format(d)
}

function TodaysClasses({ data, page, totalPages, onPageChange }: TodaysClassesProps) {
  const { t, i18n } = useTranslation('dashboard')
  const [selectedInstance, setSelectedInstance] = useState<ClassInstance | null>(null)

  const handleView = useCallback((instance: ClassInstance) => {
    setSelectedInstance(instance)
  }, [])

  return (
    <>
      {selectedInstance && (
        <InstanceDetailModal
          instance={selectedInstance}
          open={!!selectedInstance}
          onClose={() => setSelectedInstance(null)}
        />
      )}

      <div className="flex flex-col bg-gray-800 p-6 min-h-140 rounded-lg border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-yellow-400" />
            <h3 className="text-lg font-semibold text-white">{t('todaysClasses.title')}</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPageChange(1)}
            className="gap-2 text-yellow-400 hover:text-yellow-300"
          >
            {t('refresh')}
            <RefreshCcw className="w-4 h-4" />
          </Button>
        </div>

        {data.length === 0 ? (
          <div className="text-center py-8 text-gray-400">{t('todaysClasses.noData')}</div>
        ) : (
          <>
            <div className="space-y-3 flex-1">
              {data.map((instance) => (
                <div
                  key={instance.id}
                  className="bg-gray-900/50 rounded-lg border border-gray-700 overflow-hidden hover:border-gray-600 transition-colors"
                >
                  <div className="h-[3px]" style={{ backgroundColor: instance.color }} />
                  <div className="px-3 py-2.5 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">{instance.name}</p>
                      <p className="text-sm text-gray-400 truncate">{instance.coachName}</p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {instance.startTime && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-yellow-400" />
                          <span className="text-xs font-semibold text-yellow-400">
                            {formatTime(instance.startTime, i18n.language)}
                          </span>
                        </div>
                      )}
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: instance.color + '22', color: instance.color }}
                      >
                        {instance.category}
                      </span>
                      {instance.subscriberCount !== undefined && instance.subscriberCount > 0 && (
                        <div className="flex items-center gap-1 text-gray-500">
                          <Users className="h-3 w-3" />
                          <span className="text-xs">{instance.subscriberCount}</span>
                        </div>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-gray-500 hover:text-white hover:bg-gray-800"
                        onClick={() => handleView(instance)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 px-2">
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
          </>
        )}
      </div>
    </>
  )
}

export default memo(TodaysClasses)
