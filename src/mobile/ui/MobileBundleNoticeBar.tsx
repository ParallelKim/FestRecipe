import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import type { MobileBundleNotice } from '../view/types'

export default function MobileBundleNoticeBar({
  notice,
  onDismiss,
}: {
  notice: MobileBundleNotice
  onDismiss: () => void
}) {
  return (
    <Alert
      variant={notice.warn ? 'destructive' : 'default'}
      className="mx-4 mb-3 bg-muted/50"
      role="status"
    >
      <AlertTitle className="text-[13px]">{notice.title}</AlertTitle>
      <AlertDescription className="text-xs leading-relaxed">
        {notice.body}
      </AlertDescription>
      <Button
        type="button"
        variant="link"
        size="sm"
        className="mt-1 h-auto p-0 text-[13px] font-semibold"
        onClick={onDismiss}
      >
        확인
      </Button>
    </Alert>
  )
}
