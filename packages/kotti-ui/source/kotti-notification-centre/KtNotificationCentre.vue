<template>
	<div class="kt-notification-centre">
		<!-- Trigger Button -->
		<div ref="tippyTriggerRef" class="kt-notification-centre__button">
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
					<div class="kt-notification-centre__header-title">
						<i class="yoco kt-notification-centre__header-icon">bell</i>
						Notifications
					</div>
					<div
						v-if="unreadCount > 0"
						class="kt-notification-centre__header-badge"
					>
						{{ unreadCount }} New
					</div>
				</div>

				<!-- Notification List -->
				<div
					v-if="notifications && notifications.length > 0"
					class="kt-notification-centre__list"
				>
					<!-- Summary Section -->
					<div
						v-if="summary || summaryLoading"
						class="kt-notification-centre__summary"
					>
						<div v-if="summaryLoading" class="kt-notification-centre__summary-loading">
							Analyzing notifications...
						</div>
						<div v-else-if="summary" class="kt-notification-centre__summary-content">
							<div class="kt-notification-centre__summary-header">
								✦ AI Summary
								<div v-if="summary.urgentCount > 0" class="kt-notification-centre__summary-badge">
									{{ summary.urgentCount }} urgent
								</div>
							</div>
							<div class="kt-notification-centre__summary-insight">
								{{ summary.insight }}
							</div>
							<div class="kt-notification-centre__summary-can-wait">
								{{ summary.canWait }}
							</div>
						</div>
					</div>

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
							<div class="kt-notification-centre-item__footer">
								<div
									class="kt-notification-centre-item__type-badge"
									:class="`kt-notification-centre-item__type-badge--${notification.type}`"
								>
									{{ notification.type }}
								</div>
							</div>
						</div>
					</div>
				</div>
				<div v-else class="kt-notification-centre__empty-state">
					<i class="yoco kt-notification-centre__empty-icon">bell</i>
					<span>You're all caught up</span>
				</div>
			</template>
		</div>
	</div>
</template>

<script lang="ts">
import type { Instance } from 'tippy.js'
import { computed, defineComponent, ref } from 'vue'

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

		// Refs for Tippy content
		const tippyContentRef = ref<HTMLDivElement | null>(null)
		// Ref for Tippy instance
		const tippyInstanceRef = ref<Instance | null>(null)
		// Ref for Tippy trigger, which is the bell button
		const tippyTriggerRef = ref<HTMLDivElement | null>(null)
		// Notifications data
		const notifications = ref<KottiNotificationCentre.Notification[]>(
			mockNotifications as KottiNotificationCentre.Notification[]
		)

		const summary = ref<KottiNotificationCentre.SummaryResponse | null>(
			null,
		)
		const summaryLoading = ref(false)

		const summarizeNotifications = async (
			notifications_to_summarize: KottiNotificationCentre.Notification[],
		) => {
			const unread = (notifications_to_summarize ?? []).filter(
				(n) => n.toggle === KottiNotificationCentre.Status.UNREAD,
			)
			// check if there are any unread notifications
			if (unread.length === 0) {
				summary.value = {
					canWait: 'No new notifications to summarize.',
					insight: 'All caught up!',
					urgentCount: 0,
				}
				return
			}

			summaryLoading.value = true
			try {
				// Only send the essential fields to the AI to keep the prompt focused and save tokens
				const context = unread.map((n) => ({
					origin: n.origin,
					title: n.title,
					type: n.type,
				}))

				const response = await fetch(
					`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${
						import.meta.env.VITE_GEMINI_API_KEY
					}`,
					{
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							contents: [
								{
									parts: [
										{
											text: `You are an assistant in an industrial manufacturing notification centre.
												Analyze these unread notifications and identify patterns and relationships between them.

												Return ONLY valid JSON with this exact shape:
												{
													"insight": "one sentence max 20 words — group urgent items and surface connections between them",
													"canWait": "one sentence max 15 words — summarize the low priority items",
													"urgentCount": <count of unread items with type error or warning>
												}

												Rules:
												- insight must connect related items, never just list them
												- ignore all read notifications entirely

												Notifications: ${JSON.stringify(context)}`,
										},
									],
								},
							],
							generationConfig: {
								response_mime_type: 'application/json',
							},
						}),
					},
				)
				const data = await response.json()
				const textResult = data.candidates[0].content.parts[0].text
					summary.value = JSON.parse(
					textResult,
					) as KottiNotificationCentre.SummaryResponse
			} catch (error) {
				// set the summary to the error message
				summary.value = {
					canWait: 'Unable to connect to AI service.',
					insight: 'Summary generation failed',
					urgentCount: 0,
				}
			} finally {
				summaryLoading.value = false
			}
		}

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
					// Generate summary when the dropdown opens
					const unreadCount = notifications.value.filter(
						(n) => n.toggle === KottiNotificationCentre.Status.UNREAD,
					).length
					if (!summaryLoading.value && unreadCount > 0) {
						summarizeNotifications(notifications.value)
					}
				},
				// By default Tippy limits width to 350px, we disable that to use our own width
				maxWidth: 'none',
				placement: 'bottom-end',
				theme: 'kt-light-border kt-notification-centre',
				trigger: 'manual',
			})),
		)

		return {
			isTippyOpen,
			KottiNotificationCentre,
			notifications,
			onClickTrigger: () => {
				setIsTippyOpen(!isTippyOpen.value)
			},
			tippyContentRef,
			tippyTriggerRef,
			// Simplified summary state
			summary,
			summaryLoading,
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
				(notifications.value ?? []).filter(
					(n) => n.toggle === KottiNotificationCentre.Status.UNREAD,
				).length,
			),
			Yoco,
		}
	},
})
</script>

<style lang="scss">
/* Global style needed to override Tippy's default content padding */
.tippy-box[data-theme~='kt-notification-centre'] {
	.tippy-content {
		padding: 0;
	}
}
</style>

<style lang="scss" scoped>
.kt-notification-centre {
	display: inline-block;
	// trigger button
	&__button {
		position: relative;
		display: inline-block;
	}
	// new notification badge on button
	&__badge {
		position: absolute;
		top: -4px;
		right: -4px;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 16px;
		height: 16px;
		font-size: 0.7em;
		color: white;
		background-color: var(--red-50);
		border-radius: 50%;
	}
	// tippy dropdown content
	&__content {
		display: flex;
		flex-direction: column;
		max-width: 480px;
		max-height: 480px;
		background-color: var(--ui-background);
	}

	// Content Header
	&__header {
		display: flex;
		flex-shrink: 0;
		align-items: center;
		padding: var(--unit-4);
		font-weight: bold;
		border-bottom: 1px solid var(--ui-01);
		background-color: var(--ui-background-shade);
		gap: var(--unit-1);

		&-title {
			display: flex;
			align-items: center;
		}

		&-icon {
			margin-right: var(--unit-2);
			font-size: 1.4em;
			color: var(--text-01);
		}

		&-badge {
			padding: 2px 8px;
			margin-left: var(--unit-3);
			font-size: 0.7em;
			color: white;
			background-color: var(--red-50);
			border-radius: 10px;
		}
	}

	// Notification List
	&__list {
		display: flex;
		flex: 1;
		flex-direction: column;
		overflow-y: auto;
	}

	// AI Summary Section
	&__summary {
		display: flex;
		flex-direction: column;
		background-color: var(--purple-05);
		border-bottom: 2px solid var(--ui-01);

		:root[data-theme='dark'] & {
			background-color: var(--purple-100);
		}

		&-header {
			display: flex;
			align-items: center;
			gap: var(--unit-3);
			padding: var(--unit-2) 0;
			font-size: 0.9em;
			font-weight: 600;
			color: var(--text-01);

			:root[data-theme='dark'] & {
				color: var(--text-04);
			}
		}

		&-badge {
			display: inline-flex;
			flex-shrink: 0;
			padding: 0 6px;
			font-size: 0.7em;
			font-weight: 700;
			line-height: normal;
			color: white;
			text-transform: uppercase;
			background-color: var(--red-50);
			border-radius: 4px;
		}

		&-content {
			display: flex;
			flex-direction: column;
			padding: 0 var(--unit-4) var(--unit-4);
		}

		&-insight {
			font-size: 1em;
			font-weight: 600;
			line-height: 1.4;
			color: var(--text-01);
			padding-left: var(--unit-3);

			:root[data-theme='dark'] & {
				color: var(--white);
			}
		}

		&-can-wait {
			margin-top: var(--unit-1);
			padding-left: var(--unit-3);
			font-size: 0.9em;
			font-style: italic;
			color: var(--text-02);

			:root[data-theme='dark'] & {
				color: var(--purple-30);
				opacity: 0.8;
			}
		}

		&-loading {
			padding: var(--unit-4);
			font-style: italic;
			opacity: 0.7;
		}
	}

	&__empty-state {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--unit-8) var(--unit-4);
		color: var(--text-03);
		gap: var(--unit-3);
		opacity: 0.8;
	}

	&__empty-icon {
		font-size: 1.5em;
	}
}

// Notification row 
.kt-notification-centre-item {
	display: flex;
	align-items: flex-start;
	padding: var(--unit-2);
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
		padding-top: 4px;
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
		margin-bottom: var(--unit-1);
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
		font-size: 0.85em;
		line-height: 1.4;
		color: var(--text-02);
	}

	&__footer {
		display: flex;
		align-items: center;
		margin-top: var(--unit-2);
	}

	&__type-badge {
		flex-shrink: 0;
		padding: 1px 4px;
		font-size: 0.625em;
		font-weight: 700;
		text-transform: uppercase;
		border-radius: 3px;

		&--error {
			color: var(--red-70);
			background-color: var(--red-10);
		}

		&--warning {
			color: var(--orange-70);
			background-color: var(--orange-10);
		}

		&--info {
			color: var(--blue-70);
			background-color: var(--blue-10);
		}
	}

	&__timestamp {
		flex-shrink: 0;
		margin-left: var(--unit-3);
		font-size: 0.75em;
		white-space: nowrap;
		color: var(--text-03);
	}
}
</style>
