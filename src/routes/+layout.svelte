<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';
	import { setEditContext } from '$lib/context';

	let { children } = $props();

	const { title = 'Rundown' } = page.data;

	const edit = $state({
		checked: false
	});

	setEditContext(edit);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>{title}</title>
</svelte:head>

<div class="bg-base-200 mx-auto flex h-screen w-screen flex-col items-center gap-8 pb-8">
	<div class="navbar bg-base-100 shadow-sm">
		<span class="navbar-start">
			<h1>Rundown</h1>
		</span>
		<span class="navbar-end">
			<label class="label">
				<input
					type="checkbox"
					class="toggle toggle-primary"
					checked={edit.checked}
					onchange={(e) => (edit.checked = e.currentTarget.checked)}
				/>
				Edit
			</label>
		</span>
	</div>

	<div class="card bg-base-100 min-h-1 min-w-3/5 gap-y-4 p-4 shadow-lg">
		{@render children()}
	</div>
</div>
