export interface DashboardMilestone {
  threshold: number
  message: string
}

export interface DashboardSummary {
  message: string
  milestone: DashboardMilestone | null
}

export interface ActivityDay {
  date: string
  active: boolean
}
