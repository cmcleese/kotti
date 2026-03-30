import { z } from 'zod'

export namespace KottiNotificationCentre {
	export enum Status {
		READ = 'read',
		UNREAD = 'unread',
	}

	export interface Notification {
		content: string
		id: string
		origin: 'user' | 'system' | 'machine'
		references?: {
			link?: string
			[key: string]: unknown
		}
		timestamp: string
		title: string
		toggle: Status
		type: 'info' | 'warning' | 'error'
	}

	export const propsSchema = z.object({
		isOpen: z.boolean().default(false),
	})

	export type Props = z.input<typeof propsSchema>
}
