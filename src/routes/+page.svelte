<script lang="ts">
	import { user } from '$lib/auth.svelte';
	import {
		CanEdit,
		DeleteEvent,
		EventProgress,
		IsEventDone,
		IsEventOngoing,
		IsEventReady,
		IsEventTimeout,
		ListEvent,
	} from '$lib/rundown';
	import { type EventRecord } from '$lib/rundown/pocketbase';
	import type { ChangeEventHandler } from 'svelte/elements';

	let activity = $state('85s7azpy7mmaur9'); // SITCON 2026 R0

	// NOTE: temperary allow manually time control
	let n = $state('09:38');
	let now = $derived.by(() => {
		const [hours, minutes] = n.split(':').map(Number);
		const date = new Date();
		date.setHours(hours, minutes, 0, 0);
		return date;
	});
	// let now = $state(new Date());
	// $effect(() => {
	// 	const interval = setInterval(() => {
	// 		now = new Date();
	// 	}, 1000);
	// 	return () => clearInterval(interval);
	// });
	// const nowStr = $derived(
	// 	`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`,
	// );

	let edit = $state(false);
	let editing = $state<{ id: string; field: string } | null>(null);

	function editEvent(eid: string, field: keyof EventRecord): ChangeEventHandler<HTMLInputElement> {
		return (e) => {
			console.log(`Edit event ${eid} field ${field} to ${e.currentTarget.value}`);
		};
	}

	function minutesToTime(m: number) {
		const hours = Math.floor(m / 60)
			.toString()
			.padStart(2, '0');
		const minutes = (m % 60).toString().padStart(2, '0');
		return `${hours}:${minutes}`;
	}
</script>

<div class="navbar w-full">
	<div class="navbar-start"></div>
	<div class="navbar-center">
		<!-- <h1 class="text-4xl font-bold">{nowStr}</h1> -->
		<input class="input input-ghost text-4xl" type="time" bind:value={n} />
		{@debug now}
	</div>
	<div class="navbar-end">
		{#await CanEdit(activity, user.uid) then canEdit}
			{#if canEdit}
				<label class="label">
					<input type="checkbox" class="toggle toggle-primary" bind:checked={edit} />
					編輯
				</label>
			{/if}
		{/await}
	</div>
</div>

{#snippet editableText(e: EventRecord, field: keyof EventRecord)}
	<!-- {#if edit && editing?.id === e.id && editing?.field === field} -->
	<!-- 	<input -->
	<!-- 		type={inputType} -->
	<!-- 		class={{ -->
	<!-- 			'input input-bordered': inputType != 'checkbox', -->
	<!-- 			toggle: inputType == 'checkbox', -->
	<!-- 		}} -->
	<!-- 		value={e[field]} -->
	<!-- 		onchange={editEvent(e.id, field)} -->
	<!-- 		onblur={() => (editing = null)} -->
	<!-- 	/> -->
	<!-- {:else} -->
	<button
		type="button"
		class="cursor-pointer"
		onclick={() => console.log(e.id, field)}
		ondblclick={() => (editing = { id: e.id, field })}
		tabindex="0"
		>{typeof e[field] == 'number'
			? minutesToTime(e[field])
			: typeof e[field] == 'boolean'
				? e[field]
					? '✅'
					: ''
				: e[field]}</button
	>
	<!-- {/if} -->
{/snippet}

{#await ListEvent(activity)}
	<p>Loading events...</p>
{:then events}
	<div class="w-full max-w-full overflow-x-scroll">
		<table class="table-pin-rows table-lg table min-w-max">
			<thead>
				<tr class="h-16">
					<th>開始</th>
					<th>結束</th>
					<th>名稱</th>
					<th>講者</th>
					<th>備註</th>
					<th>切換字卡</th>
					{#if edit}
						<th></th>
					{/if}
				</tr>
			</thead>

			<tbody>
				{#each events as e}
					<tr
						class={[
							{
								'bg-yellow-200': IsEventReady(e, now),
								'bg-green-200/50': IsEventOngoing(e, now), // allow underlay progress bar to be seen
								'bg-sky-200': IsEventDone(e, now),
								'bg-rose-200': IsEventTimeout(e, now),
							},
							'relative',
						]}
					>
						<td
							>{@render editableText(e, 'start')}
							<div
								class="absolute top-0 left-0 -z-10 h-full bg-green-600/30"
								style="width: {EventProgress(e, now) * 100}%"
							></div>
						</td>
						<td>{@render editableText(e, 'end')}</td>
						<td>{@render editableText(e, 'name')}</td>
						<td>{@render editableText(e, 'speaker')}</td>
						<td>{@render editableText(e, 'note')}</td>
						<td>{@render editableText(e, 'info_card')}</td>
						{#if edit}
							<td
								><button
									type="button"
									class="btn btn-error btn-soft"
									onclick={() => DeleteEvent(e.id)}>Remove</button
								></td
							>
						{/if}
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{:catch err}
	<p class="text-error">{err}</p>
{/await}
