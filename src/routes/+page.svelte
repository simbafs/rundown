<script lang="ts">
	import { getEditContext } from '$lib/context';
	import { supabase, table } from '$lib/supabase';
	import { errorToast } from '$lib/toast';
	import { onMount } from 'svelte';
	import type { ChangeEventHandler } from 'svelte/elements';

	type Entry = {
		id: number;
		name: string;
		room: string;
		start: number;
		end: number;
		duration: number;
	};

	let now = $state(new Date());
	let events = $state<Entry[]>([]);
	let room = $state('R0');
	let eventsInRoom = $derived(
		events.filter((e) => e.room == room).sort((a, b) => a.start - b.start),
	);
	let editing = $state<{ id: number; field: keyof Entry } | null>(null);
	let top = $derived(nowTop());
	let nowStr = $derived(
		`${pad2(now.getHours())}:${pad2(now.getMinutes())}:${pad2(now.getSeconds())}`,
	);
	const edit = getEditContext();

	function pad2(num: number) {
		return num.toString().padStart(2, '0');
	}

	function timeToMinutes(time: string) {
		const [hours, minutes] = time.split(':').map(Number);
		return hours * 60 + minutes;
	}

	function minutesToTime(minutes: number) {
		const hrs = Math.floor(minutes / 60)
			.toString()
			.padStart(2, '0');
		const mins = (minutes % 60).toString().padStart(2, '0');
		return `${hrs}:${mins}`;
	}

	function durationToHeight(duration: number) {
		return Math.max(duration * 2, 64);
	}

	function nowTop() {
		const nowMinutes = now.getHours() * 60 + now.getMinutes();

		let top = 64 - 2; // thead, 2 is halve the height of the line

		for (const e of eventsInRoom) {
			if (e.start > nowMinutes) {
				break;
			} else if (e.end >= nowMinutes) {
				top += ((nowMinutes - e.start) / e.duration) * durationToHeight(e.duration);
			} else {
				top += durationToHeight(e.duration);
			}
		}

		return top;
	}

	function editEntry(id: number, field: keyof Entry): ChangeEventHandler<HTMLInputElement> {
		return function (e) {
			const value = e.currentTarget.value;
			console.log({ id, field, value });

			supabase
				.from(table.entry)
				.update({ [field]: value })
				.eq('id', id)
				.then(({ error }) => {
					if (error) {
						console.error('Error updating event:', error);
						errorToast(error.message);
					}
					editing = null;
				});
		};
	}

	function removeEntry(id: number) {
		return () => {
			console.log(`remove ${id}`);
			supabase
				.from(table.entry)
				.delete()
				.eq('id', id)
				.then(({ error }) => {
					if (error) {
						console.error('Error deleting event:', error);
						errorToast(error.message);
					}
				});
		};
	}

	function createEntry(e: Event) {
		e.preventDefault();

		const data = Object.fromEntries(new FormData(e.currentTarget as HTMLFormElement).entries());

		console.log(data);

		supabase
			.from(table.entry)
			.insert([
				{
					name: data.name as string,
					room: room,
					start: data.start as string,
					end: data.end as string,
					team_id: 'a5a6320c-940a-43ea-a33f-7ee31867f78a',
				},
			])
			.then(({ error }) => {
				if (error) {
					console.error('Error creating event:', error);
					errorToast(error.message);
				}

				console.log(e);
				(e.target as HTMLFormElement).reset();
			});
	}

	supabase
		.from(table.entry)
		.select('*')
		.then(({ data, error }) => {
			if (error) {
				console.error('Error fetching event data:', error);
				errorToast(error.message);
			}

			if (!data) {
				events = [];
				return;
			}

			console.log(data);

			events = data.map((e) => ({
				id: e.id,
				name: e.name,
				room: e.room,
				start: timeToMinutes(e.start),
				end: timeToMinutes(e.end),
				duration: timeToMinutes(e.end) - timeToMinutes(e.start),
			}));
		});

	onMount(() => {
		const interval = setInterval(() => {
			now = new Date();
		}, 1000);
		const channel = supabase
			.channel('custom-all-channel')
			.on('postgres_changes', { event: '*', schema: 'public', table: table.entry }, (payload) => {
				console.log('Change received!', payload);
				switch (payload.eventType) {
					case 'INSERT': {
						const e = payload.new;
						events = [
							...events,
							{
								id: e.id,
								name: e.name,
								room: e.room,
								start: timeToMinutes(e.start),
								end: timeToMinutes(e.end),
								duration: timeToMinutes(e.end) - timeToMinutes(e.start),
							},
						].sort((a, b) => a.start - b.start);
						break;
					}
					case 'UPDATE': {
						const e = payload.new;
						events = events
							.map((ev) =>
								ev.id === e.id
									? {
											id: e.id,
											name: e.name,
											room: e.room,
											start: timeToMinutes(e.start),
											end: timeToMinutes(e.end),
											duration: timeToMinutes(e.end) - timeToMinutes(e.start),
										}
									: ev,
							)
							.sort((a, b) => a.start - b.start);
						break;
					}
					case 'DELETE': {
						const e = payload.old;
						events = events.filter((ev) => ev.id !== e.id);
						break;
					}
				}
			})
			.subscribe();

		return () => {
			channel.unsubscribe();
			clearInterval(interval);
		};
	});
</script>

<h1 class="w-full text-center text-4xl font-bold">{nowStr}</h1>

<select class="select w-full shrink-0" onchange={(e) => (room = e.currentTarget.value)}>
	<option value="R0">R0</option>
	<option value="R1">R1</option>
	<option value="R2">R2</option>
	<option value="R3">R3</option>
	<option value="S">S</option>
</select>

{#snippet editableText(e: Entry, field: keyof Entry)}
	{#if edit.checked && editing?.id === e.id && editing?.field === field}
		<input
			type={typeof e[field] == 'number' ? 'time' : 'text'}
			class="input input-bordered"
			value={e[field]}
			onchange={editEntry(e.id, field)}
			onblur={() => (editing = null)}
		/>
	{:else}
		<span
			class="cursor-pointer"
			ondblclick={() => (editing = { id: e.id, field })}
			role="button"
			tabindex="0">{typeof e[field] == 'number' ? minutesToTime(e[field]) : e[field]}</span
		>
	{/if}
{/snippet}

<form class="relative grow overflow-x-scroll" onsubmit={createEntry}>
	<table class="table-pin-rows table">
		<thead>
			<tr class="h-16">
				<th>名字</th>
				<th>開始時間</th>
				<th>結束時間</th>
				<th>持續時間</th>
				{#if edit.checked}
					<th></th>
				{/if}
			</tr>
		</thead>

		<tbody>
			{#each eventsInRoom as e}
				<tr style="height: {durationToHeight(e.duration)}px">
					<td>{@render editableText(e, 'name')}</td>
					<td>{@render editableText(e, 'start')}</td>
					<td>{@render editableText(e, 'end')}</td>
					<td>{minutesToTime(e.duration)}</td>
					{#if edit.checked}
						<td
							><button type="button" class="btn btn-error btn-soft" onclick={removeEntry(e.id)}
								>Remove</button
							></td
						>
					{/if}
				</tr>
			{/each}
			{#if edit.checked}
				<tr>
					<td>
						<input type="text" name="name" class="input" placeholder="Name" required />
					</td>
					<td>
						<input type="time" name="start" class="input" placeholder="Start Time" required />
					</td>
					<td>
						<input type="time" name="end" class="input" placeholder="End Time" required />
					</td>
					<td> </td>
					<td>
						<button class="btn btn-success btn-soft">Create</button>
					</td>
				</tr>
			{/if}
		</tbody>
	</table>

	<div
		class="bg-primary/30 shadow-primary/60 pointer-events-none absolute right-0 left-0 h-1 shadow-md"
		style="top: {top}px"
	></div>
</form>
