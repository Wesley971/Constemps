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
  success: 'var(--success)',
  warning: 'var(--warning)',
  danger: 'var(--danger)',
  info: 'var(--info)',
}

export function Notification({ title, message, tone = 'info' }: NotificationProps) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start',
        background: 'var(--white)',
        border: '1px solid var(--line)',
        borderRadius: 'var(--radius-sm)',
        boxShadow: 'var(--elevation-3)',
        padding: 16,
        maxWidth: 340,
      }}
    >
      <iconify-icon icon={icons[tone]} width="20" style={{ color: colors[tone], flexShrink: 0, marginTop: 1 }}></iconify-icon>
      <div>
        <div style={{ font: 'var(--text-label)', color: 'var(--ink)' }}>{title}</div>
        {message && <div style={{ font: 'var(--text-body-sm)', color: 'var(--inksoft)', marginTop: 2 }}>{message}</div>}
      </div>
    </div>
  )
}
