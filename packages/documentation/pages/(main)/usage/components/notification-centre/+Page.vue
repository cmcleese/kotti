<template>
	<div>
		<ComponentInfo v-bind="{ component }" />

		<p>
			<code>KtNotificationCentre</code> provides a notification centre component with AI-powered summarization.
		</p>

		<h2>Interactive Example</h2>

		<CodePreview
			code='
				<KtNotificationCentre />
			'
			language="vue-html"
		>
			<KtNotificationCentre />
		</CodePreview>

	</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

import { KtNotificationCentre } from '@3yourmind/kotti-ui'

import CodePreview from '~/components/CodePreview.vue'
import ComponentInfo from '~/components/component-info/ComponentInfo.vue'

export default defineComponent({
	name: 'DocumentationPageUsageComponentsNotificationCentre',
	components: {
		CodePreview,
		ComponentInfo,
		KtNotificationCentre,
	},
	setup() {
		return {
			component: KtNotificationCentre,
		}
	},
})
</script>
