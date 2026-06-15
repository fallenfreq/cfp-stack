<template>
	<div>
		<div v-if="loading" class="admin-list__state">Loading…</div>
		<div v-else-if="empty" class="admin-list__state">
			<slot name="empty">Nothing here yet.</slot>
		</div>
		<div v-else class="admin-table-wrap">
			<table class="admin-table">
				<thead>
					<tr class="admin-table__head">
						<slot name="header" />
					</tr>
				</thead>
				<tbody>
					<slot />
				</tbody>
			</table>
		</div>
	</div>
</template>

<script setup lang="ts">
defineProps<{ loading?: boolean; empty?: boolean }>()
</script>

<style>
.admin-list__state {
	opacity: 0.5;
	padding: 12px 4px;
	font-size: 0.875rem;
}

.admin-table-wrap {
	overflow-x: auto;
	scrollbar-width: none;
}
.admin-table-wrap::-webkit-scrollbar {
	display: none;
}

@media (max-width: 639px) {
	.admin-table-wrap {
		margin: 0 -1.25rem;
	}
}

/*
 * border-collapse: separate + border-spacing: 0 is required for box-shadow on
 * sticky cells to work — collapse merges cell borders into the table's paint
 * layer which clips overflow. With separate, each cell is its own box.
 * border-bottom is applied manually on each cell to compensate.
 */
.admin-table {
	width: 100%;
	border-collapse: separate;
	border-spacing: 0;
	font-size: 0.875rem;
}

.admin-table__head th {
	text-align: left;
	padding: 6px 10px;
	font-size: 0.7rem;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.07em;
	color: rgba(var(--text_primary) / 0.45);
	border-bottom: 1px solid rgba(var(--border_color));
	white-space: nowrap;
	user-select: none;
	background: rgb(var(--bg_secondary));
}

.admin-table__head th:last-child {
	position: sticky;
	right: 0;
	z-index: 2;
	box-shadow: -6px 0 10px rgba(0, 0, 0, 0.2);
}
</style>
