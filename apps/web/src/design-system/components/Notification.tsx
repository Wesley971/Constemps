export type NotificationTone = 'success' | 'warning' | 'danger' | 'info'

interface NotificationProps {
  title: string
  message?: string
  tone?: NotificationTone
}

const icons: Record<NotificationTone, string> = {
  success: 'ph:check-circle-bold',
  warning: 'ph:warning-bold',
  danger: 'ph:x-circle-bold',
  info: 'ph:info-bold',
}

const colors: Record<NotificationTone, string> = {
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
  info: 'text-info',
}

export function Notification({ title, message, tone = 'info' }: NotificationProps) {
  return (
    <div className="flex gap-3 items-start bg-white border border-line rounded-sm shadow-elevation-3 p-4 max-w-85">
      <span className={`shrink-0 mt-px ${colors[tone]}`}>
        <iconify-icon icon={icons[tone]} width="20"></iconify-icon>
      </span>
      <div>
        <div className="font-body text-label text-ink">{title}</div>
        {message && <div className="font-body text-body-sm text-inksoft mt-0.5">{message}</div>}
      </div>
    </div>
  )
}
