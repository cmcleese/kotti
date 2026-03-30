<template>
	<div class="kt-notification-centre">
		<!-- Trigger Button -->
		<div ref="tippyTriggerRef" class="kt-notification-centre__trigger">
			<KtButton
				:icon="Yoco.Icon.BELL"
				type="default"
				@click="onClickTrigger"
			/>
			<div v-if="unreadCount > 0" class="kt-notification-centre__badge">
				{{ unreadCount }}
			</div>
		</div>

		<!-- Dropdown Content -->
		<div ref="tippyContentRef" class="kt-notification-centre__content">
			<template v-if="isTippyOpen">
				<!-- Header -->
				<div class="kt-notification-centre__header">
					<i class="yoco kt-notification-centre__header-icon" v-text="Yoco.Icon.BELL" />
					<span>Notifications</span>
					<div v-if="unreadCount > 0" class="kt-notification-centre__header-badge">
						{{ unreadCount }} New
					</div>
				</div>

				<!-- Notification List -->
				 <div
					ref="tippyBodyRef"
					class="kt-notification-centre__body"
				>
					<div
						v-for="notification in notifications"
						:key="notification.id"
						class="kt-notification-centre-item"
						:class="{ 'kt-notification-centre-item--unread': notification.toggle === KottiNotificationCentre.Status.UNREAD }"
						@click="toggleRead(notification)"
					>
						<div class="kt-notification-centre-item__dot-container">
							<div
								v-if="notification.toggle === KottiNotificationCentre.Status.UNREAD"
								class="kt-notification-centre-item__dot"
							/>
						</div>
						<div class="kt-notification-centre-item__main">
							<div class="kt-notification-centre-item__header-row">
								<div class="kt-notification-centre-item__title">
									{{ notification.title }}
								</div>
								<div class="kt-notification-centre-item__timestamp">
									{{ notification.timestamp }}
								</div>
							</div>
							<div class="kt-notification-centre-item__content">
								{{ notification.content }}
							</div>
						</div>
					</div>
				</div>
			</template>
		</div>
	</div>
</template>

<script lang="ts">
import type { Instance } from 'tippy.js'
import { delegate } from 'tippy.js'
import { computed, defineComponent, onMounted, ref } from 'vue'

import { useTippy } from '@3yourmind/vue-use-tippy'
import { Yoco } from '@3yourmind/yoco'

import { TIPPY_DISTANCE_OFFSET } from '../constants'
import { KtButton } from '../kotti-button'
import { makeProps } from '../make-props'

import mockNotifications from './notifications.json'
import { KottiNotificationCentre } from './types'

export default defineComponent({
	name: 'KtNotificationCentre',
	components: { KtButton },
	props: makeProps(KottiNotificationCentre.propsSchema),
	setup() {
		const isTippyOpen = ref(false)
		
		// Ref for the notifications list body, used for Tippy delegation
		const tippyBodyRef = ref<HTMLDivElement | null>(null)
		// Refs for Tippy content
		const tippyContentRef = ref<HTMLDivElement | null>(null)
		// Ref for Tippy instance
		const tippyInstanceRef = ref<Instance | null>(null)
		// Ref for Tippy trigger, which is the bell button
		const tippyTriggerRef = ref<HTMLDivElement | null>(null)
		// Notifications data
		const notifications = ref<KottiNotificationCentre.Notification[]>(
			mockNotifications as KottiNotificationCentre.Notification[],
		)

		// Toggle tippy dropdown visibility
		const setIsTippyOpen = (isOpen: boolean) => {
			if (!tippyInstanceRef.value) return

			if (isOpen) tippyInstanceRef.value.show()
			else tippyInstanceRef.value.hide()
		}
		// set up tippy dropdown
		useTippy(
			tippyTriggerRef,
			computed(() => ({
				appendTo: () => document.body,
				arrow: false,
				content: tippyContentRef.value ?? undefined,
				hideOnClick: false,
				interactive: true,
				offset: [0, TIPPY_DISTANCE_OFFSET],
				onClickOutside: () => {
					setIsTippyOpen(false)
				},
				onCreate(instance: Instance) {
					tippyInstanceRef.value = instance
				},
				onHide: () => {
					isTippyOpen.value = false
				},
				onShow: () => {
					isTippyOpen.value = true
				},
				// By default Tippy limits width to 350px, we disable that to use our own width
				maxWidth: 'none',
				placement: 'bottom-end',
				theme: 'kt-light-border kt-notification-centre',
				trigger: 'manual',
			})),
		)

		onMounted(() => {
			if (tippyBodyRef.value) {
				delegate(tippyBodyRef.value, {
					content: (reference) => {
						const isUnread = reference.classList.contains(
							'kt-notification-centre-item--unread',
						)
						return isUnread ? 'Mark as Read' : 'Mark as Unread'
					},
					target: '.kt-notification-centre-item',
					theme: 'kt-light-border',
				})
			}
		})

		return {
			isTippyOpen,
			KottiNotificationCentre,
			notifications,
			onClickTrigger: () => {
				setIsTippyOpen(!isTippyOpen.value)
			},
			tippyBodyRef,
			tippyContentRef,
			tippyTriggerRef,
			// Toggle notification read/unread status
			toggleRead: (notification: KottiNotificationCentre.Notification) => {
				notification.toggle =
					notification.toggle === KottiNotificationCentre.Status.READ
						? KottiNotificationCentre.Status.UNREAD
						: KottiNotificationCentre.Status.READ
			},
			// Track unread notifications count
			unreadCount: computed(
				() =>
					notifications.value.filter(
						(n) => n.toggle === KottiNotificationCentre.Status.UNREAD,
					).length,
			),
			Yoco,
		}
	},
})
</script>

<style lang="scss">
/* We need a global style to override Tippy's default content padding */
.tippy-box[data-theme~='kt-notification-centre'] {
	.tippy-content {
		padding: 0;
	}
}
</style>

<style lang="scss" scoped>
.kt-notification-centre {
	display: inline-block;

	&__trigger {
		position: relative;
		display: inline-block;
	}

	&__badge {
		position: absolute;
		top: -4px;
		right: -4px;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 16px;
		height: 16px;
		font-size: 10px;
		color: white;
		background-color: var(--red-50);
		border-radius: 50%;
	}

	&__content {
		display: flex;
		flex-direction: column;
		max-width: 480px;
		max-height: 480px;
		background-color: var(--ui-background);
	}

	/* Fixed header so it doesn't disappear when scrolling through long lists */
	&__header {
		display: flex;
		flex-shrink: 0;
		align-items: center;
		padding: var(--unit-4);
		font-weight: bold;
		border-bottom: 1px solid var(--ui-01);
		background-color: var(--ui-background-shade);
		&-badge {
			padding: 2px 8px;
			margin-left: var(--unit-3);
			font-size: 11px;
			color: white;
			background-color: var(--red-50);
			border-radius: 10px;
		}
	}

	&__header-icon {
		margin-right: var(--unit-3);
		font-size: 1.2em;
		color: var(--text-01);
	}

	&__body {
		flex: 1;
		padding: 0;
		overflow-y: auto;
	}
}

// Notification row styles
.kt-notification-centre-item {
	display: flex;
	align-items: center;
	padding: var(--unit-4) var(--unit-4) var(--unit-4) var(--unit-2);
	cursor: pointer;
	border-bottom: 1px solid var(--ui-01);
	transition: background-color 0.2s;

	&:hover {
		background-color: var(--ui-background-shade);
	}

	&__dot-container {
		display: flex;
		flex-shrink: 0;
		justify-content: center;
		width: 24px;
	}

	&__dot {
		width: 8px;
		height: 8px;
		background-color: var(--red-50);
		border-radius: 50%;
	}

	&__main {
		flex: 1;
		min-width: 0;
	}

	&__header-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	&--unread {
		.kt-notification-centre-item__title {
			font-weight: bold;
		}
	}

	&__title {
		font-size: 0.9em;
		color: var(--text-01);
	}

	&__content {
		margin-top: var(--unit-1);
		font-size: 0.85em;
		line-height: 1.4;
		color: var(--text-02);
	}

	&__timestamp {
		margin-left: var(--unit-3);
		font-size: 0.80em;
		white-space: nowrap;
		color: var(--text-03);
	}
}
</style>
