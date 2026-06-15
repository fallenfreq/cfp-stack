<template>
	<tr class="admin-row">
		<td class="admin-cell">
			<span class="admin-cell__name">{{ name || '—' }}</span>
		</td>
		<td class="admin-cell">
			<code class="admin-cell__slug">/{{ slug }}</code>
		</td>
		<td class="admin-cell">
			<slot name="meta" />
		</td>
		<td class="admin-cell admin-cell--narrow">
			<VaSwitch
				:model-value="published"
				size="small"
				@update:model-value="($event: boolean) => $emit('update:published', $event)"
			/>
		</td>
		<td class="admin-cell admin-cell--narrow admin-cell--sticky">
			<VaDropdown placement="bottom-end" :close-on-content-click="true">
				<template #anchor>
					<button class="admin-more" title="Actions">
						<svg width="14" height="14" viewBox="0 0 14 14" fill="none">
							<circle cx="2.5" cy="7" r="1.25" fill="currentColor" />
							<circle cx="7" cy="7" r="1.25" fill="currentColor" />
							<circle cx="11.5" cy="7" r="1.25" fill="currentColor" />
						</svg>
					</button>
				</template>
				<VaDropdownContent>
					<div class="admin-menu">
						<slot name="actions" />
					</div>
				</VaDropdownContent>
			</VaDropdown>
		</td>
	</tr>
</template>

<script setup lang="ts">
defineProps<{ name: string; slug: string; published: boolean }>()
defineEmits<{ 'update:published': [value: boolean] }>()
</script>

<style>
.admin-row {
	background: rgb(var(--bg_secondary));
}
.admin-row td {
	border-bottom: 1px solid rgba(var(--border_color));
}
.admin-row:last-child td {
	border-bottom: none;
}

.admin-cell {
	padding: 10px 10px;
	vertical-align: middle;
}
.admin-cell--narrow {
	width: 1px;
	white-space: nowrap;
}
.admin-cell--sticky {
	position: sticky;
	right: 0;
	width: 48px;
	background: inherit;
	z-index: 2;
	box-shadow: -6px 0 10px rgba(0, 0, 0, 0.2);
}

.admin-cell__name {
	font-weight: 500;
	white-space: nowrap;
}

.admin-cell__slug {
	font-family: monospace;
	font-size: 0.75rem;
	color: rgba(var(--text_primary) / 0.5);
	white-space: nowrap;
}

.admin-more {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 28px;
	height: 28px;
	background: none;
	border: 1px solid transparent;
	border-radius: 4px;
	cursor: pointer;
	color: rgba(var(--text_primary) / 0.6);
	transition:
		color 0.1s,
		background 0.1s,
		border-color 0.1s;
}
.admin-more:hover {
	color: rgb(var(--text_primary));
	background: rgba(var(--text_primary) / 0.08);
	border-color: rgba(var(--text_primary) / 0.2);
}

.admin-menu {
	display: flex;
	flex-direction: column;
	padding: 4px;
	min-width: 130px;
}

/* Slot content API — non-scoped so it applies inside action slots */
.admin-action {
	display: block;
	width: 100%;
	text-align: left;
	background: none;
	border: none;
	border-radius: 4px;
	padding: 6px 10px;
	font-size: 0.875rem;
	cursor: pointer;
	color: inherit;
	text-decoration: none;
}
.admin-action:hover {
	background: rgba(var(--text_primary) / 0.08);
}
.admin-action--danger {
	color: rgb(var(--danger));
}

/* Icon button — used in view headers */
.admin-icon-btn {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 30px;
	height: 30px;
	background: none;
	border: 1px solid rgba(var(--text_primary) / 0.2);
	border-radius: 4px;
	cursor: pointer;
	color: rgba(var(--text_primary) / 0.7);
	transition:
		color 0.1s,
		background 0.1s,
		border-color 0.1s;
	flex-shrink: 0;
}
.admin-icon-btn:hover {
	color: rgb(var(--text_primary));
	background: rgba(var(--text_primary) / 0.06);
	border-color: rgba(var(--text_primary) / 0.35);
}
</style>
