import { z } from 'zod'

export namespace KottiNotificationCentre {
	export interface Notification {
		id: string
		title: string
		content: string
		timestamp: string
		isRead: boolean
		priority?: 'low' | 'medium' | 'high'
	}

	export const propsSchema = z.object({
		isOpen: z.boolean().default(false),
	})

	export type Props = z.input<typeof propsSchema>
}
