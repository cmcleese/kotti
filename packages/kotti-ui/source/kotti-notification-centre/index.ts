import { attachMeta, makeInstallable } from '../utilities'

import KtNotificationCentreVue from './KtNotificationCentre.vue'
import { KottiNotificationCentre } from './types'

export const KtNotificationCentre = attachMeta(
	makeInstallable(KtNotificationCentreVue),
	{
		addedVersion: '1.0.0',
		deprecated: null,
		designs: null,
		slots: {},

		typeScript: {
			namespace: 'Kotti.NotificationCentre',
			schema: KottiNotificationCentre.propsSchema,
		},
	},
)
