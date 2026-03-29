<template>
	<div class="kt-notification-centre">
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
		<div ref="tippyContentRef" class="kt-notification-centre__content">
			<template v-if="isTippyOpen">
				<div class="kt-notification-centre__header">Notifications</div>
				<div class="kt-notification-centre__body">
					<p>Basic dropdown is working. More data to be injected here.</p>
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

import { KottiNotificationCentre } from './types'

export default defineComponent({
	name: 'KtNotificationCentre',
	components: { KtButton },
	props: makeProps(KottiNotificationCentre.propsSchema),
	setup() {
		const isTippyOpen = ref(false)
		const tippyContentRef = ref<HTMLDivElement | null>(null)
		const tippyInstanceRef = ref<Instance | null>(null)
		const tippyTriggerRef = ref<HTMLDivElement | null>(null)

		const setIsTippyOpen = (isOpen: boolean) => {
			if (!tippyInstanceRef.value) return

			if (isOpen) tippyInstanceRef.value.show()
			else tippyInstanceRef.value.hide()
		}

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
				placement: 'bottom-end',
				theme: 'kt-light-border',
				trigger: 'manual',
			})),
		)

		return {
			isTippyOpen,
			onClickTrigger: () => {
				setIsTippyOpen(!isTippyOpen.value)
			},
			tippyContentRef,
			tippyTriggerRef,
			unreadCount: computed(() => 2),
			Yoco,
		}
	},
})
</script>

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
		background-color: var(--interactive-danger);
		border-radius: 50%;
	}

	&__content {
		width: 320px;
		max-height: 480px;
		overflow-y: auto;
		background-color: var(--ui-background);
	}

	&__header {
		padding: var(--unit-4);
		font-weight: bold;
		border-bottom: 1px solid var(--ui-01);
	}

	&__body {
		padding: var(--unit-4);
	}
}
</style>
